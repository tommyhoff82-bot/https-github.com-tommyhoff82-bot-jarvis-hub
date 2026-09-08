import stripe
import os
from fastapi import APIRouter, Request, HTTPException, Depends
from dotenv import load_dotenv

from auth import get_current_user, require_workspace_owner

load_dotenv()
router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Tier metadata lives here rather than only in the frontend so the two
# never drift apart. Price IDs come from your own Stripe dashboard
# (Products -> a plan -> pricing) — see backend/.env.example.
PLANS = [
    {"tier": "starter", "name": "Starter", "price": 99,
     "price_id_env": "STRIPE_PRICE_STARTER",
     "features": ["1 Store", "Product Scout", "Basic Learning"]},
    {"tier": "pro", "name": "Pro", "price": 299,
     "price_id_env": "STRIPE_PRICE_PRO", "highlighted": True,
     "features": ["3 Stores", "All Agents", "Advanced Learning"]},
    {"tier": "enterprise", "name": "Enterprise", "price": 999,
     "price_id_env": "STRIPE_PRICE_ENTERPRISE",
     "features": ["Unlimited", "Custom Training", "Priority"]},
]


@router.get("/billing/plans")
async def list_plans():
    return [
        {
            "tier": p["tier"], "name": p["name"], "price": p["price"],
            "features": p["features"], "highlighted": p.get("highlighted", False),
            "price_id": os.getenv(p["price_id_env"]) or None,
        }
        for p in PLANS
    ]


@router.post("/billing/checkout")
async def create_checkout_session(workspace_id: str, price_id: str,
                                   current_user=Depends(get_current_user)):
    await require_workspace_owner(workspace_id, current_user)
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Stripe is not configured on this server")

    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{'price': price_id, 'quantity': 1}],
        mode='subscription',
        success_url=f"{FRONTEND_URL}/dashboard?upgrade=success",
        cancel_url=f"{FRONTEND_URL}/billing?upgrade=canceled",
        client_reference_id=workspace_id,
    )
    return {"checkout_url": session.url}


@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    try:
        event = stripe.Webhook.construct_event(payload, sig_header,
                                                 STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        workspace_id = session['client_reference_id']
        line_items = stripe.checkout.Session.list_line_items(session['id'], limit=1)
        price_id = line_items.data[0].price.id if line_items.data else None
        tier = next((p["tier"] for p in PLANS if os.getenv(p["price_id_env"]) == price_id), None)

        from db import db
        await db.workspace.update(
            where={"id": workspace_id},
            data={"subscriptionTier": tier or "starter", "status": "active"},
        )
        print(f"✅ Workspace {workspace_id} upgraded to {tier or 'unknown tier'}!")
    return {"status": "success"}
