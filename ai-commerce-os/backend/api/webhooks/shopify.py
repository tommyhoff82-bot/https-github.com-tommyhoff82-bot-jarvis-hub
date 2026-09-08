import hmac
import hashlib
import base64
import json
import os
from fastapi import APIRouter, Request, HTTPException
from dotenv import load_dotenv

from integrations import printify

load_dotenv()
router = APIRouter()

SHOPIFY_SECRET = os.getenv("SHOPIFY_WEBHOOK_SECRET")
PRINTIFY_SHOP_ID = os.getenv("PRINTIFY_SHOP_ID", "12345")


async def verify_shopify_webhook(request: Request):
    body = await request.body()
    hmac_header = request.headers.get("X-Shopify-Hmac-SHA256")
    digest = hmac.new(SHOPIFY_SECRET.encode('utf-8'), body,
                       hashlib.sha256).digest()
    computed_hmac = base64.b64encode(digest).decode()
    if not hmac.compare_digest(computed_hmac, hmac_header):
        raise HTTPException(status_code=401)
    return json.loads(body)


@router.post("/webhooks/shopify/orders")
async def handle_shopify_order(request: Request):
    order_data = await verify_shopify_webhook(request)
    print(f"📦 New order from {request.headers.get('X-Shopify-Shop-Domain')}")

    result = await printify.submit_order(PRINTIFY_SHOP_ID, order_data)
    print(f"✅ Order sent to Printify: {result.get('id', 'unknown id')}")
    return {"status": "received"}
