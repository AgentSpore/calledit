"""Pydantic v2 schemas for boards, members, predictions, forecasts, leaderboard."""

from pydantic import BaseModel, Field


class BoardCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class MemberCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class MemberOut(BaseModel):
    id: int
    name: str
    created_at: str


class PredictionCreate(BaseModel):
    claim: str = Field(min_length=1, max_length=400)
    resolve_by: str
    stake: float = 0.0


class ForecastIn(BaseModel):
    member_id: int
    probability: float


class ResolveIn(BaseModel):
    outcome: bool


class ForecastOut(BaseModel):
    member_id: int
    member_name: str
    probability: float
    # Brier contribution (p-o)^2, present only on resolved predictions.
    brier_contribution: float | None = None


class PredictionOut(BaseModel):
    id: int
    claim: str
    resolve_by: str
    stake: float
    status: str
    outcome: int | None
    created_at: str
    resolved_at: str | None
    due: bool
    forecasts: list[ForecastOut]


class BoardOut(BaseModel):
    code: str
    title: str
    created_at: str
    members: list[MemberOut]
    predictions: list[PredictionOut]


class BoardCreateOut(BaseModel):
    code: str
    title: str
    created_at: str


class LeaderboardEntry(BaseModel):
    member_id: int
    member: str
    brier: float | None
    label: str | None
    n: int
    accuracy: float | None
    net_stake: float
    rank: int | None
    note: str | None = None


class CalibrationPoint(BaseModel):
    bucket: str
    mean_prob: float
    hit_rate: float
    n: int
