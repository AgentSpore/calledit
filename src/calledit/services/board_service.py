"""Board, member, board-view, leaderboard, and calibration logic."""

import secrets
from datetime import date, datetime, timezone

import aiosqlite

from calledit.schemas.board import (
    BoardCreateOut,
    BoardOut,
    CalibrationPoint,
    ForecastOut,
    LeaderboardEntry,
    MemberOut,
    PredictionOut,
)
from calledit.services import scoring

# Unambiguous alphabet for share codes (no 0/O/1/I).
_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
_CODE_LEN = 6


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _is_due(status: str, resolve_by: str) -> bool:
    """Open prediction whose resolve_by date is today or in the past."""
    if status != "open":
        return False
    try:
        return date.fromisoformat(resolve_by) <= date.today()
    except ValueError:
        return False


async def _generate_code(conn: aiosqlite.Connection) -> str:
    """Server-side unique 6-char uppercase code."""
    while True:
        code = "".join(secrets.choice(_CODE_ALPHABET) for _ in range(_CODE_LEN))
        cur = await conn.execute("SELECT 1 FROM boards WHERE code = ?", (code,))
        if await cur.fetchone() is None:
            return code


async def create_board(conn: aiosqlite.Connection, title: str) -> BoardCreateOut:
    code = await _generate_code(conn)
    now = _utcnow()
    await conn.execute(
        "INSERT INTO boards (code, title, created_at) VALUES (?, ?, ?)",
        (code, title, now),
    )
    await conn.commit()
    return BoardCreateOut(code=code, title=title, created_at=now)


async def _board_row(conn: aiosqlite.Connection, code: str) -> aiosqlite.Row | None:
    cur = await conn.execute("SELECT * FROM boards WHERE code = ?", (code,))
    return await cur.fetchone()


async def add_member(
    conn: aiosqlite.Connection, code: str, name: str
) -> MemberOut | None:
    board = await _board_row(conn, code)
    if board is None:
        return None
    now = _utcnow()
    cur = await conn.execute(
        "INSERT INTO members (board_id, name, created_at) VALUES (?, ?, ?)",
        (board["id"], name, now),
    )
    await conn.commit()
    return MemberOut(id=cur.lastrowid, name=name, created_at=now)


async def get_board(conn: aiosqlite.Connection, code: str) -> BoardOut | None:
    board = await _board_row(conn, code)
    if board is None:
        return None
    board_id = board["id"]

    members = [
        MemberOut(id=r["id"], name=r["name"], created_at=r["created_at"])
        async for r in await conn.execute(
            "SELECT * FROM members WHERE board_id = ? ORDER BY id", (board_id,)
        )
    ]
    name_by_id = {m.id: m.name for m in members}

    preds_cur = await conn.execute(
        "SELECT * FROM predictions WHERE board_id = ? ORDER BY id", (board_id,)
    )
    pred_rows = await preds_cur.fetchall()

    predictions: list[PredictionOut] = []
    for p in pred_rows:
        fc_cur = await conn.execute(
            "SELECT * FROM forecasts WHERE prediction_id = ? ORDER BY id", (p["id"],)
        )
        forecasts: list[ForecastOut] = []
        for f in await fc_cur.fetchall():
            contribution = (
                scoring.brier_contribution(f["probability"], p["outcome"])
                if p["status"] == "resolved" and p["outcome"] is not None
                else None
            )
            forecasts.append(
                ForecastOut(
                    member_id=f["member_id"],
                    member_name=name_by_id.get(f["member_id"], "?"),
                    probability=f["probability"],
                    brier_contribution=contribution,
                )
            )
        predictions.append(
            PredictionOut(
                id=p["id"],
                claim=p["claim"],
                resolve_by=p["resolve_by"],
                stake=p["stake"],
                status=p["status"],
                outcome=p["outcome"],
                created_at=p["created_at"],
                resolved_at=p["resolved_at"],
                due=_is_due(p["status"], p["resolve_by"]),
                forecasts=forecasts,
            )
        )

    return BoardOut(
        code=board["code"],
        title=board["title"],
        created_at=board["created_at"],
        members=members,
        predictions=predictions,
    )


async def _member_resolved(
    conn: aiosqlite.Connection, board_id: int
) -> dict[int, list[tuple[float, int]]]:
    """member_id -> list of (probability, outcome) over resolved predictions."""
    cur = await conn.execute(
        "SELECT f.member_id, f.probability, p.outcome "
        "FROM forecasts f JOIN predictions p ON p.id = f.prediction_id "
        "WHERE p.board_id = ? AND p.status = 'resolved' AND p.outcome IS NOT NULL",
        (board_id,),
    )
    out: dict[int, list[tuple[float, int]]] = {}
    for r in await cur.fetchall():
        out.setdefault(r["member_id"], []).append((r["probability"], r["outcome"]))
    return out


async def _member_net_stake(
    conn: aiosqlite.Connection, board_id: int
) -> dict[int, float]:
    """Net stake per member: +stake when their call side was right, -stake when wrong.

    A member's "side" is p > 0.5 (they bet it happens) vs p < 0.5 (won't);
    p == 0.5 abstains. Right side wins the stake, wrong side loses it.
    """
    cur = await conn.execute(
        "SELECT f.member_id, f.probability, p.outcome, p.stake "
        "FROM forecasts f JOIN predictions p ON p.id = f.prediction_id "
        "WHERE p.board_id = ? AND p.status = 'resolved' AND p.outcome IS NOT NULL",
        (board_id,),
    )
    out: dict[int, float] = {}
    for r in await cur.fetchall():
        p, outcome, stake = r["probability"], r["outcome"], r["stake"]
        if stake == 0 or p == 0.5:
            out.setdefault(r["member_id"], 0.0)
            continue
        right = (p > 0.5) == (outcome == 1)
        out[r["member_id"]] = out.get(r["member_id"], 0.0) + (stake if right else -stake)
    return out


async def leaderboard(
    conn: aiosqlite.Connection, code: str
) -> list[LeaderboardEntry] | None:
    board = await _board_row(conn, code)
    if board is None:
        return None
    board_id = board["id"]

    members_cur = await conn.execute(
        "SELECT id, name FROM members WHERE board_id = ? ORDER BY id", (board_id,)
    )
    members = await members_cur.fetchall()
    resolved_by_member = await _member_resolved(conn, board_id)
    net_stake = await _member_net_stake(conn, board_id)

    entries: list[LeaderboardEntry] = []
    for m in members:
        resolved = resolved_by_member.get(m["id"], [])
        n = len(resolved)
        brier = scoring.brier_score(resolved)
        ranked = n >= scoring.MIN_RANKED_FORECASTS
        entries.append(
            LeaderboardEntry(
                member_id=m["id"],
                member=m["name"],
                brier=brier,
                label=scoring.brier_label(brier),
                n=n,
                accuracy=scoring.accuracy(resolved),
                net_stake=net_stake.get(m["id"], 0.0),
                rank=None,
                note=None if ranked else "needs more calls",
            )
        )

    # Rank only members with enough resolved forecasts, by Brier ascending.
    rankable = [e for e in entries if e.n >= scoring.MIN_RANKED_FORECASTS]
    rankable.sort(key=lambda e: e.brier)
    for position, entry in enumerate(rankable, start=1):
        entry.rank = position

    # Ranked first (by rank), then unranked (by n desc) for a sensible order.
    entries.sort(
        key=lambda e: (e.rank is None, e.rank if e.rank is not None else -e.n)
    )
    return entries


async def calibration(
    conn: aiosqlite.Connection, code: str, member_id: int
) -> list[CalibrationPoint] | None:
    board = await _board_row(conn, code)
    if board is None:
        return None
    resolved = (await _member_resolved(conn, board["id"])).get(member_id, [])
    return [CalibrationPoint(**pt) for pt in scoring.calibration_curve(resolved)]
