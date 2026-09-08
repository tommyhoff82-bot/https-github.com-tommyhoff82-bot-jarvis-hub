"""Integration tests against the real FastAPI app and a real Postgres
database. See tests/conftest.py for how to point these at a test database
— they're skipped automatically if TEST_DATABASE_URL isn't set.

This is the committed, repeatable version of the manual verification pass
documented in MASTER_GUIDE.md ("Actually verified, not just imported" /
"Then verified again, in an actual browser") — run this after any change
instead of re-doing that by hand.
"""
import pytest

from conftest import signup_and_get_token

# pytest.ini sets asyncio_mode = auto, so every `async def test_*` here
# runs under pytest-asyncio without needing an explicit decorator.

# --- Auth ---

async def test_signup_then_me_returns_empty_workspaces(client):
    token = await signup_and_get_token(client)
    res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["workspaces"] == []


async def test_signup_duplicate_email_rejected(client):
    await signup_and_get_token(client, email="dupe@example.com")
    res = await client.post("/api/auth/signup", json={"email": "dupe@example.com", "password": "supersecret123"})
    assert res.status_code == 409


async def test_signup_short_password_rejected(client):
    res = await client.post("/api/auth/signup", json={"email": "short@example.com", "password": "abc"})
    assert res.status_code == 400


async def test_signup_over_length_password_rejected_cleanly(client):
    # This is the exact bug the browser verification pass caught: this
    # used to 500 instead of 400 (see auth.py's BCRYPT_MAX_BYTES check).
    res = await client.post("/api/auth/signup", json={"email": "long@example.com", "password": "a" * 73})
    assert res.status_code == 400


async def test_login_with_correct_password_succeeds(client):
    await signup_and_get_token(client, email="login@example.com", password="supersecret123")
    res = await client.post("/api/auth/login", json={"email": "login@example.com", "password": "supersecret123"})
    assert res.status_code == 200
    assert "token" in res.json()


async def test_login_with_wrong_password_rejected(client):
    await signup_and_get_token(client, email="login2@example.com", password="supersecret123")
    res = await client.post("/api/auth/login", json={"email": "login2@example.com", "password": "wrong"})
    assert res.status_code == 401


async def test_me_without_token_rejected(client):
    res = await client.get("/api/auth/me")
    assert res.status_code == 403  # HTTPBearer's own "no credentials" response


async def test_me_with_garbage_token_rejected(client):
    res = await client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert res.status_code == 401


# --- Workspaces ---

async def test_create_workspace_persists_for_real(client):
    token = await signup_and_get_token(client)
    res = await client.post(
        "/api/workspaces",
        headers={"Authorization": f"Bearer {token}"},
        json={"business_name": "Test Co", "niche": "eco-friendly kitchenware"},
    )
    assert res.status_code == 200
    workspace_id = res.json()["workspace_id"]

    me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    workspaces = me.json()["workspaces"]
    assert len(workspaces) == 1
    assert workspaces[0]["id"] == workspace_id
    assert workspaces[0]["businessName"] == "Test Co"
    assert workspaces[0]["subscriptionTier"] == "starter"


async def test_cross_user_cannot_access_another_workspace(client):
    token_a = await signup_and_get_token(client, email="owner@example.com")
    ws = await client.post(
        "/api/workspaces",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"business_name": "Owner's Co", "niche": "candles"},
    )
    workspace_id = ws.json()["workspace_id"]

    token_b = await signup_and_get_token(client, email="attacker@example.com")
    res = await client.get(
        f"/api/agents/tasks?workspace_id={workspace_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res.status_code == 403


async def test_nonexistent_workspace_returns_404(client):
    token = await signup_and_get_token(client)
    res = await client.get(
        "/api/agents/tasks?workspace_id=does-not-exist",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 404


# --- Agents ---

async def test_learner_agent_completes_cleanly_with_no_decisions(client):
    # This is the exact bug the verification pass caught: the learner used
    # to crash on import (eager OpenAI/Pinecone client construction) even
    # on this no-op path that never needed either.
    token = await signup_and_get_token(client)
    ws = await client.post(
        "/api/workspaces",
        headers={"Authorization": f"Bearer {token}"},
        json={"business_name": "Test Co", "niche": "eco-friendly kitchenware"},
    )
    workspace_id = ws.json()["workspace_id"]

    trigger = await client.post(
        "/api/agents/trigger",
        headers={"Authorization": f"Bearer {token}"},
        json={"workspace_id": workspace_id, "agent_type": "learner"},
    )
    assert trigger.status_code == 200

    tasks = await client.get(
        f"/api/agents/tasks?workspace_id={workspace_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert tasks.status_code == 200
    task_list = tasks.json()
    assert len(task_list) == 1
    assert task_list[0]["agentType"] == "learner"
    assert task_list[0]["status"] == "completed"


async def test_trigger_rejects_unknown_agent_type(client):
    token = await signup_and_get_token(client)
    ws = await client.post(
        "/api/workspaces",
        headers={"Authorization": f"Bearer {token}"},
        json={"business_name": "Test Co", "niche": "candles"},
    )
    workspace_id = ws.json()["workspace_id"]

    res = await client.post(
        "/api/agents/trigger",
        headers={"Authorization": f"Bearer {token}"},
        json={"workspace_id": workspace_id, "agent_type": "not-a-real-agent"},
    )
    assert res.status_code == 400


async def test_insights_with_no_decisions_returns_real_zeros(client):
    token = await signup_and_get_token(client)
    ws = await client.post(
        "/api/workspaces",
        headers={"Authorization": f"Bearer {token}"},
        json={"business_name": "Test Co", "niche": "candles"},
    )
    workspace_id = ws.json()["workspace_id"]

    res = await client.get(
        f"/api/learning/insights?workspace_id={workspace_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total_decisions"] == 0
    assert data["success_rate"] == 0.0
    assert data["top_learnings"] == []


# --- Billing ---

async def test_billing_plans_are_public(client):
    res = await client.get("/api/billing/plans")
    assert res.status_code == 200
    tiers = {p["tier"] for p in res.json()}
    assert tiers == {"starter", "pro", "enterprise"}


async def test_checkout_without_stripe_configured_returns_503(client, monkeypatch):
    import api.routes.billing as billing

    monkeypatch.setattr(billing.stripe, "api_key", None)
    token = await signup_and_get_token(client)
    ws = await client.post(
        "/api/workspaces",
        headers={"Authorization": f"Bearer {token}"},
        json={"business_name": "Test Co", "niche": "candles"},
    )
    workspace_id = ws.json()["workspace_id"]

    res = await client.post(
        f"/api/billing/checkout?workspace_id={workspace_id}&price_id=price_fake",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 503


# --- Integrations ---

async def test_connect_shopify_with_bad_credentials_returns_400_not_500(client, monkeypatch):
    import integrations.shopify as shopify_module

    async def fail_get_shop(self):
        raise RuntimeError("simulated: Shopify rejected the token")

    monkeypatch.setattr(shopify_module.ShopifyClient, "get_shop", fail_get_shop)

    token = await signup_and_get_token(client)
    ws = await client.post(
        "/api/workspaces",
        headers={"Authorization": f"Bearer {token}"},
        json={"business_name": "Test Co", "niche": "candles"},
    )
    workspace_id = ws.json()["workspace_id"]

    res = await client.post(
        "/api/integrations/shopify",
        headers={"Authorization": f"Bearer {token}"},
        json={"workspace_id": workspace_id, "shop_domain": "fake.myshopify.com", "access_token": "bad"},
    )
    assert res.status_code == 400


async def test_connect_shopify_with_good_credentials_saves_without_leaking_token(client, monkeypatch):
    import integrations.shopify as shopify_module

    async def fake_get_shop(self):
        return {"name": "Fake Test Shop"}

    monkeypatch.setattr(shopify_module.ShopifyClient, "get_shop", fake_get_shop)

    token = await signup_and_get_token(client)
    ws = await client.post(
        "/api/workspaces",
        headers={"Authorization": f"Bearer {token}"},
        json={"business_name": "Test Co", "niche": "candles"},
    )
    workspace_id = ws.json()["workspace_id"]

    connect = await client.post(
        "/api/integrations/shopify",
        headers={"Authorization": f"Bearer {token}"},
        json={"workspace_id": workspace_id, "shop_domain": "real.myshopify.com", "access_token": "good-token"},
    )
    assert connect.status_code == 200

    listing = await client.get(
        f"/api/integrations?workspace_id={workspace_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    integrations = listing.json()
    assert len(integrations) == 1
    assert integrations[0]["platform"] == "shopify"
    assert integrations[0]["storeId"] == "real.myshopify.com"
    assert "accessToken" not in integrations[0]
    assert "good-token" not in str(integrations[0])
