"""Prediction creation (under a board) and prediction-id routes."""

import aiosqlite
from fastapi import APIRouter, Depends, HTTPException

from calledit.core.db import get_db
from calledit.schemas.board import (
    ForecastIn,
    ForecastOut,
    PredictionCreate,
    PredictionOut,
    ResolveIn,
)
from calledit.services import prediction_service

# Predictions created under a board.
board_router = APIRouter(prefix="/boards", tags=["predictions"])
# Operations on an existing prediction by id.
router = APIRouter(prefix="/predictions", tags=["predictions"])


@board_router.post(
    "/{code}/predictions", response_model=PredictionOut, status_code=201
)
async def create_prediction(
    code: str, body: PredictionCreate, db: aiosqlite.Connection = Depends(get_db)
) -> PredictionOut:
    pred = await prediction_service.create_prediction(
        db, code, body.claim, body.resolve_by, body.stake
    )
    if pred is None:
        raise HTTPException(status_code=404, detail="Board not found")
    return pred


@router.put("/{prediction_id}/forecast", response_model=ForecastOut)
async def put_forecast(
    prediction_id: int,
    body: ForecastIn,
    db: aiosqlite.Connection = Depends(get_db),
) -> ForecastOut:
    forecast = await prediction_service.upsert_forecast(
        db, prediction_id, body.member_id, body.probability
    )
    if forecast is None:
        raise HTTPException(
            status_code=404, detail="Prediction or member not found"
        )
    return forecast


@router.patch("/{prediction_id}/resolve")
async def resolve_prediction(
    prediction_id: int,
    body: ResolveIn,
    db: aiosqlite.Connection = Depends(get_db),
) -> dict:
    ok = await prediction_service.resolve_prediction(
        db, prediction_id, body.outcome
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {"id": prediction_id, "status": "resolved", "outcome": body.outcome}


@router.delete("/{prediction_id}", status_code=204)
async def delete_prediction(
    prediction_id: int, db: aiosqlite.Connection = Depends(get_db)
) -> None:
    ok = await prediction_service.delete_prediction(db, prediction_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Prediction not found")
