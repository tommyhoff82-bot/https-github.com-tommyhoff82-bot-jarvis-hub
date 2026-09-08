import stripe
import os
from fastapi import APIRouter, Request, HTTPException
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")


@router.post("/billing/checkout")
async def create_checkout_session(workspace_id: str, price_id: str):
    session = stripe.checkout.Session.create(
        payment_method_types=['card'],
        line_items=[{'price': price_id, 'quantity': 1}],
        mode='subscription',
        success_url="https://yourapp.com/dashboard?upgrade=success",
        cancel_url="https://yourapp.com/billing?upgrade=canceled",
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
        print(f"✅ Workspace {session['client_reference_id']} upgraded!")
    return {"status": "success"}
