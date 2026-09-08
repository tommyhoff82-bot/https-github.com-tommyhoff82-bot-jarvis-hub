import hmac
import hashlib
import base64
import json
import os
from fastapi import APIRouter, Request, HTTPException
from dotenv import load_dotenv

from db import db
from integrations import printify

load_dotenv()
router = APIRouter()

SHOPIFY_SECRET = os.getenv("SHOPIFY_WEBHOOK_SECRET")


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
    shop_domain = request.headers.get("X-Shopify-Shop-Domain")
    print(f"📦 New order from {shop_domain}")

    # Route the order to whichever workspace actually connected this
    # Shopify store, rather than a single global shop/key — this is what
    # makes fulfillment correct once more than one workspace connects a
    # store on the same deployment (see /settings/integrations).
    shopify_integration = await db.integration.find_first(
        where={"platform": "shopify", "storeId": shop_domain, "isActive": True}
    )
    if not shopify_integration:
        # A store sent us a webhook we don't recognize — most likely it was
        # disconnected after the webhook was registered. Nothing to fulfill.
        raise HTTPException(status_code=404, detail=f"No workspace has {shop_domain} connected")

    printify_integration = await db.integration.find_first(
        where={"workspaceId": shopify_integration.workspaceId, "platform": "printify", "isActive": True}
    )
    if not printify_integration:
        print(f"⚠️  Workspace {shopify_integration.workspaceId} has no Printify account connected — "
              f"order from {shop_domain} received but not fulfilled")
        raise HTTPException(status_code=422, detail="This workspace hasn't connected Printify yet")

    result = await printify.submit_order(
        shop_id=printify_integration.storeId,
        order_data=order_data,
        api_key=printify_integration.accessToken,
    )
    print(f"✅ Order sent to Printify for workspace {shopify_integration.workspaceId}: "
          f"{result.get('id', 'unknown id')}")
    return {"status": "received"}
