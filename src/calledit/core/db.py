"""aiosqlite connection management, schema init, and demo seed."""

from collections.abc import AsyncIterator
from datetime import date, datetime, timedelta, timezone

import aiosqlite
from loguru import logger

from calledit.core.config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    claim TEXT NOT NULL,
    resolve_by TEXT NOT NULL,
    stake REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'open',
    outcome INTEGER,
    created_at TEXT NOT NULL,
    resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS forecasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prediction_id INTEGER NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    probability REAL NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE (prediction_id, member_id)
);
"""


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


async def connect() -> aiosqlite.Connection:
    """Open a connection with row factory and foreign keys enabled."""
    conn = await aiosqlite.connect(settings.db_path)
    conn.row_factory = aiosqlite.Row
    await conn.execute("PRAGMA foreign_keys = ON")
    return conn


async def get_db() -> AsyncIterator[aiosqlite.Connection]:
    """FastAPI dependency yielding a per-request connection."""
    conn = await connect()
    try:
        yield conn
    finally:
        await conn.close()


async def init_db() -> None:
    """Create tables if absent."""
    conn = await connect()
    try:
        await conn.executescript(SCHEMA)
        await conn.commit()
    finally:
        await conn.close()


async def seed_demo() -> None:
    """Insert one idempotent demo board if the database has no boards."""
    conn = await connect()
    try:
        cur = await conn.execute("SELECT COUNT(*) AS c FROM boards")
        row = await cur.fetchone()
        if row["c"] > 0:
            logger.info("Seed skipped: {} board(s) already present", row["c"])
            return
        await _insert_demo(conn)
        await conn.commit()
        logger.info("Seeded demo board DEMO01")
    finally:
        await conn.close()


async def _insert_demo(conn: aiosqlite.Connection) -> None:
    now = _utcnow()
    cur = await conn.execute(
        "INSERT INTO boards (code, title, created_at) VALUES (?, ?, ?)",
        ("DEMO01", "Friday Crew", now),
    )
    board_id = cur.lastrowid

    member_ids: dict[str, int] = {}
    for name in ("Sam", "Maya", "Leo", "Pri"):
        c = await conn.execute(
            "INSERT INTO members (board_id, name, created_at) VALUES (?, ?, ?)",
            (board_id, name, now),
        )
        member_ids[name] = c.lastrowid

    today = date.today()
    past = (today - timedelta(days=2)).isoformat()
    due_past = (today - timedelta(days=1)).isoformat()
    future = (today + timedelta(days=7)).isoformat()

    # Seven resolved claims. forecasts[name] = probability the event happens.
    # Maya is consistently well-calibrated; Leo is over-confident and wrong.
    resolved = [
        # (claim, outcome, {member: prob})
        ("Launch ships before Friday", 1, {"Sam": 0.6, "Maya": 0.8, "Leo": 0.95, "Pri": 0.5}),
        ("Lakers win tonight", 0, {"Sam": 0.5, "Maya": 0.2, "Leo": 0.9, "Pri": 0.55}),
        ("It rains at the picnic", 1, {"Sam": 0.7, "Maya": 0.85, "Leo": 0.1, "Pri": 0.6}),
        ("Q2 numbers beat target", 0, {"Sam": 0.45, "Maya": 0.15, "Leo": 0.85, "Pri": 0.5}),
        ("New hire accepts the offer", 1, {"Sam": 0.65, "Maya": 0.9, "Leo": 0.3, "Pri": 0.7}),
        ("Server migration finishes clean", 0, {"Sam": 0.55, "Maya": 0.25, "Leo": 0.95, "Pri": 0.4}),
        ("Conference talk gets accepted", 1, {"Sam": 0.6, "Maya": 0.75, "Leo": 0.2, "Pri": 0.65}),
    ]
    for claim, outcome, probs in resolved:
        pc = await conn.execute(
            "INSERT INTO predictions (board_id, claim, resolve_by, stake, status, "
            "outcome, created_at, resolved_at) VALUES (?, ?, ?, ?, 'resolved', ?, ?, ?)",
            (board_id, claim, past, 5.0, outcome, now, now),
        )
        pred_id = pc.lastrowid
        for name, prob in probs.items():
            await conn.execute(
                "INSERT INTO forecasts (prediction_id, member_id, probability, created_at) "
                "VALUES (?, ?, ?, ?)",
                (pred_id, member_ids[name], prob, now),
            )

    # Three open claims, one already due (resolve_by in the past, still open).
    open_claims = [
        ("We hit 1k signups this month", due_past, {"Sam": 0.4, "Maya": 0.55, "Leo": 0.8}),
        ("The demo goes flawlessly", future, {"Maya": 0.6, "Pri": 0.5}),
        ("Coffee machine survives the week", future, {"Sam": 0.3}),
    ]
    for claim, resolve_by, probs in open_claims:
        pc = await conn.execute(
            "INSERT INTO predictions (board_id, claim, resolve_by, stake, status, "
            "created_at) VALUES (?, ?, ?, ?, 'open', ?)",
            (board_id, claim, resolve_by, 5.0, now),
        )
        pred_id = pc.lastrowid
        for name, prob in probs.items():
            await conn.execute(
                "INSERT INTO forecasts (prediction_id, member_id, probability, created_at) "
                "VALUES (?, ?, ?, ?)",
                (pred_id, member_ids[name], prob, now),
            )
