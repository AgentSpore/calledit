"""Prediction creation, forecasting (upsert), resolution, and deletion."""

from datetime import datetime, timezone

import aiosqlite

from calledit.schemas.board import ForecastOut, PredictionOut
from calledit.services import scoring


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _board_id(conn: aiosqlite.Connection, code: str) -> int | None:
    cur = await conn.execute("SELECT id FROM boards WHERE code = ?", (code,))
    row = await cur.fetchone()
    return row["id"] if row else None


async def create_prediction(
    conn: aiosqlite.Connection,
    code: str,
    claim: str,
    resolve_by: str,
    stake: float,
) -> PredictionOut | None:
    board_id = await _board_id(conn, code)
    if board_id is None:
        return None
    now = _utcnow()
    cur = await conn.execute(
        "INSERT INTO predictions (board_id, claim, resolve_by, stake, status, "
        "created_at) VALUES (?, ?, ?, ?, 'open', ?)",
        (board_id, claim, resolve_by, stake, now),
    )
    await conn.commit()
    return PredictionOut(
        id=cur.lastrowid,
        claim=claim,
        resolve_by=resolve_by,
        stake=stake,
        status="open",
        outcome=None,
        created_at=now,
        resolved_at=None,
        due=False,
        forecasts=[],
    )


async def upsert_forecast(
    conn: aiosqlite.Connection,
    prediction_id: int,
    member_id: int,
    probability: float,
) -> ForecastOut | None:
    """Insert or replace one member's forecast on a prediction (0..1 or 0..100)."""
    pred = await conn.execute(
        "SELECT id FROM predictions WHERE id = ?", (prediction_id,)
    )
    if await pred.fetchone() is None:
        return None
    member = await conn.execute("SELECT name FROM members WHERE id = ?", (member_id,))
    member_row = await member.fetchone()
    if member_row is None:
        return None

    p = scoring.normalize_probability(probability)
    now = _utcnow()
    await conn.execute(
        "INSERT INTO forecasts (prediction_id, member_id, probability, created_at) "
        "VALUES (?, ?, ?, ?) "
        "ON CONFLICT (prediction_id, member_id) "
        "DO UPDATE SET probability = excluded.probability, created_at = excluded.created_at",
        (prediction_id, member_id, p, now),
    )
    await conn.commit()
    return ForecastOut(
        member_id=member_id,
        member_name=member_row["name"],
        probability=p,
        brier_contribution=None,
    )


async def resolve_prediction(
    conn: aiosqlite.Connection, prediction_id: int, outcome: bool
) -> bool:
    cur = await conn.execute(
        "UPDATE predictions SET status = 'resolved', outcome = ?, resolved_at = ? "
        "WHERE id = ?",
        (1 if outcome else 0, _utcnow(), prediction_id),
    )
    await conn.commit()
    return cur.rowcount > 0


async def delete_prediction(conn: aiosqlite.Connection, prediction_id: int) -> bool:
    cur = await conn.execute(
        "DELETE FROM predictions WHERE id = ?", (prediction_id,)
    )
    await conn.commit()
    return cur.rowcount > 0
