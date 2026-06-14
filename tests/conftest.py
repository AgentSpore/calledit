"""Shared fixtures: an ASGI client backed by a fresh temp database."""

from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from calledit.core.config import settings
from calledit.main import app


@pytest_asyncio.fixture
async def client(tmp_path) -> AsyncIterator[AsyncClient]:
    # connect()/init_db()/seed read settings.db_path at call time, so pointing
    # the singleton at a per-test file gives each test an isolated database.
    settings.db_path = str(tmp_path / "test.db")
    transport = ASGITransport(app=app)
    async with app.router.lifespan_context(app):
        async with AsyncClient(
            transport=transport, base_url="http://test"
        ) as ac:
            yield ac
