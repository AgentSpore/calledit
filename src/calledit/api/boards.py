"""Board, member, leaderboard, and calibration routes."""

import aiosqlite
from fastapi import APIRouter, Depends, HTTPException

from calledit.core.db import get_db
from calledit.schemas.board import (
    BoardCreate,
    BoardCreateOut,
    BoardOut,
    CalibrationPoint,
    LeaderboardEntry,
    MemberCreate,
    MemberOut,
)
from calledit.services import board_service

router = APIRouter(prefix="/boards", tags=["boards"])


@router.post("", response_model=BoardCreateOut, status_code=201)
async def create_board(
    body: BoardCreate, db: aiosqlite.Connection = Depends(get_db)
) -> BoardCreateOut:
    return await board_service.create_board(db, body.title)


@router.get("/{code}", response_model=BoardOut)
async def get_board(
    code: str, db: aiosqlite.Connection = Depends(get_db)
) -> BoardOut:
    board = await board_service.get_board(db, code)
    if board is None:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@router.post("/{code}/members", response_model=MemberOut, status_code=201)
async def add_member(
    code: str, body: MemberCreate, db: aiosqlite.Connection = Depends(get_db)
) -> MemberOut:
    member = await board_service.add_member(db, code, body.name)
    if member is None:
        raise HTTPException(status_code=404, detail="Board not found")
    return member


@router.get("/{code}/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(
    code: str, db: aiosqlite.Connection = Depends(get_db)
) -> list[LeaderboardEntry]:
    entries = await board_service.leaderboard(db, code)
    if entries is None:
        raise HTTPException(status_code=404, detail="Board not found")
    return entries


@router.get(
    "/{code}/members/{member_id}/calibration",
    response_model=list[CalibrationPoint],
)
async def calibration(
    code: str, member_id: int, db: aiosqlite.Connection = Depends(get_db)
) -> list[CalibrationPoint]:
    points = await board_service.calibration(db, code, member_id)
    if points is None:
        raise HTTPException(status_code=404, detail="Board not found")
    return points
