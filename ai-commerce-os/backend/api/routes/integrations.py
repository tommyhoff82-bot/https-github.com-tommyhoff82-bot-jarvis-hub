"""Connect-your-store endpoints.

This is the piece the rest of the app was missing: a way for a workspace
to actually attach its own Shopify store and Printify account, rather than
relying on a single deployment-wide token from .env. Every connect call
validates the credential against the real API before saving it, so a
typo'd token fails immediately with a clear error instead of silently
breaking the Scout agent or the order webhook later.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from db import db
from auth import get_current_user, require_workspace_owner
from integrations.shopify import ShopifyClient
from integrations import printify

router = APIRouter()

SUPPORTED_PLATFORMS = ("shopify", "printify")


def _public_integration(i) -> dict:
    """Never send accessToken/refreshToken to the client."""
    return {
        "platform": i.platform,
        "storeId": i.storeId,
        "isActive": i.isActive,
        "createdAt": i.createdAt.isoformat(),
    }


class ShopifyConnectRequest(BaseModel):
    workspace_id: str
    shop_domain: str  # e.g. "my-store.myshopify.com"
    access_token: str


class PrintifyConnectRequest(BaseModel):
    workspace_id: str
    shop_id: str
    api_key: str


async def _upsert_integration(workspace_id: str, platform: str, access_token: str, store_id: str):
    await db.integration.upsert(
        where={"workspaceId_platform": {"workspaceId": workspace_id, "platform": platform}},
        data={
            "create": {
                "workspaceId": workspace_id, "platform": platform,
                "accessToken": access_token, "storeId": store_id, "isActive": True,
            },
            "update": {"accessToken": access_token, "storeId": store_id, "isActive": True},
        },
    )


@router.get("/integrations")
async def list_integrations(workspace_id: str, current_user=Depends(get_current_user)):
    await require_workspace_owner(workspace_id, current_user)
    integrations = await db.integration.find_many(where={"workspaceId": workspace_id})
    return [_public_integration(i) for i in integrations]


@router.post("/integrations/shopify")
async def connect_shopify(data: ShopifyConnectRequest, current_user=Depends(get_current_user)):
    await require_workspace_owner(data.workspace_id, current_user)

    client = ShopifyClient(shop_domain=data.shop_domain, access_token=data.access_token)
    try:
        shop = await client.get_shop()
    except Exception:
        raise HTTPException(status_code=400,
                             detail="Couldn't verify that store. Check the domain and access token.")

    await _upsert_integration(data.workspace_id, "shopify", data.access_token, data.shop_domain)
    return {"status": "connected", "shop_name": shop.get("name", data.shop_domain)}


@router.post("/integrations/printify")
async def connect_printify(data: PrintifyConnectRequest, current_user=Depends(get_current_user)):
    await require_workspace_owner(data.workspace_id, current_user)

    try:
        shops = await printify.list_shops(api_key=data.api_key)
    except Exception:
        raise HTTPException(status_code=400, detail="Couldn't verify that Printify API key.")

    if not any(str(s.get("id")) == str(data.shop_id) for s in shops):
        raise HTTPException(status_code=400,
                             detail="That shop_id isn't one of the shops this API key can access.")

    await _upsert_integration(data.workspace_id, "printify", data.api_key, data.shop_id)
    return {"status": "connected"}


@router.delete("/integrations/{platform}")
async def disconnect_integration(platform: str, workspace_id: str,
                                  current_user=Depends(get_current_user)):
    if platform not in SUPPORTED_PLATFORMS:
        raise HTTPException(status_code=404, detail="Unknown platform")
    await require_workspace_owner(workspace_id, current_user)

    await db.integration.update_many(
        where={"workspaceId": workspace_id, "platform": platform},
        data={"isActive": False},
    )
    return {"status": "disconnected"}
