"""Shared fixtures for the integration test suite.

These tests hit a REAL Postgres database — no mocking the ORM — because
that's the only way to actually catch what the earlier verification pass
found (broken Prisma relations, a connection lifecycle bug). Point
TEST_DATABASE_URL at a throwaway database before running:

    createdb ai_commerce_os_test
    export TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/ai_commerce_os_test"
    export JWT_SECRET="test-secret"
    cd backend && prisma db push --schema schema.prisma  # with DATABASE_URL=$TEST_DATABASE_URL
    pytest tests/

If TEST_DATABASE_URL isn't set, every test in this file is skipped rather
than failing — so `pytest` still runs cleanly for anyone who hasn't set up
a test database yet, e.g. as a quick unit-test-only check.
"""
import os
import sys

# Make the backend package (main.py, db.py, auth.py, integrations/, ...)
# importable regardless of how/where pytest is invoked from.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")

if TEST_DATABASE_URL:
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ.setdefault("JWT_SECRET", "test-secret-do-not-use-in-production")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")

pytestmark = pytest.mark.skipif(
    not TEST_DATABASE_URL,
    reason="TEST_DATABASE_URL not set — skipping DB-backed integration tests (see tests/conftest.py)",
)


@pytest_asyncio.fixture
async def db_conn():
    """Connect fresh for each test and disconnect at teardown.

    This matters more than it looks: `db` is a module-level singleton
    (see db.py), and pytest-asyncio gives each test function its own event
    loop by default. A connection left open from a previous test is bound
    to that test's (now-closed) event loop — reusing it here raises
    "RuntimeError: Event loop is closed" on the second test that touches
    the database. Connecting and disconnecting per test avoids that
    entirely, at the cost of a little overhead per test.
    """
    from db import db

    await db.connect()
    yield db
    # Order matters: children before parents, to satisfy foreign keys.
    await db.agenttask.delete_many()
    await db.aidecision.delete_many()
    await db.learning.delete_many()
    await db.order.delete_many()
    await db.product.delete_many()
    await db.addon.delete_many()
    await db.integration.delete_many()
    await db.agentconfig.delete_many()
    await db.workspace.delete_many()
    await db.user.delete_many()
    await db.disconnect()


@pytest_asyncio.fixture
async def client(db_conn):
    """An httpx client wired directly to the FastAPI app — no real network
    socket, but a real ASGI request/response cycle through every
    middleware and dependency, same as a real request would take.
    """
    import main

    transport = ASGITransport(app=main.app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def signup_and_get_token(client, email="user@example.com", password="supersecret123"):
    res = await client.post("/api/auth/signup", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["token"]
