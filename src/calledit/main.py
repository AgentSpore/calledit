"""CalledIt FastAPI entrypoint: API routers + static frontend."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from calledit.api import boards, predictions
from calledit.core.config import settings
from calledit.core.db import init_db, seed_demo

api = APIRouter(prefix="/api/v1")
api.include_router(boards.router)
api.include_router(predictions.board_router)
api.include_router(predictions.router)


@api.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok"}


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    await seed_demo()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="CalledIt", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.cors_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api)

    # Mount the buildless frontend LAST at '/', only if the directory exists.
    frontend = Path(settings.frontend_dir)
    if frontend.is_dir():
        app.mount("/", StaticFiles(directory=str(frontend), html=True), name="static")
    else:
        logger.info("Frontend dir {} absent; serving API only", frontend)

    return app


app = create_app()
