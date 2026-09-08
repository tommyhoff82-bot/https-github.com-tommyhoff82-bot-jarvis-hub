import hmac
import hashlib
import base64
import json
import os
import httpx
from fastapi import APIRouter, Request, HTTPException
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

SHOPIFY_SECRET = os.getenv("SHOPIFY_WEBHOOK_SECRET")
PRINTIFY_API_KEY = os.getenv("PRINTIFY_API_KEY")


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

    line_items = [{"print_provider_id": 1, "variant_id": "MOCK_99",
                   "quantity": item['quantity']}
                  for item in order_data['line_items']]

    address = order_data['shipping_address']
    payload = {
        "external_id": str(order_data['id']),
        "shipping_method": 1,
        "address_to": {
            "first_name": address['first_name'], "last_name": address['last_name'],
            "email": order_data['email'], "country": address['country_code'],
            "city": address['city'], "address1": address['address1'],
            "zip": address['zip']
        },
        "line_items": line_items
    }

    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://api.printify.com/v1/shops/12345/orders.json",
            headers={"Authorization": f"Bearer {PRINTIFY_API_KEY}"},
            json=payload
        )
        if res.status_code == 200:
            print("✅ Order sent to Printify!")
    return {"status": "received"}
