"""Shopify Admin API client.

Thin wrapper around the Shopify Admin REST API, scoped to what the rest of
this codebase needs: reading shop info and pushing products the Scout
agent (backend/agents/scout.py) has decided to list. Each workspace's
Shopify credentials live in the `Integration` table (see schema.prisma),
keyed by `platform == "shopify"` — pass the access token and shop domain
straight from that row rather than from a global env var, since every
workspace connects its own store.
"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

API_VERSION = "2024-01"


class ShopifyClient:
    def __init__(self, shop_domain: str, access_token: str):
        """shop_domain looks like 'my-store.myshopify.com'."""
        self.base_url = f"https://{shop_domain}/admin/api/{API_VERSION}"
        self.headers = {
            "X-Shopify-Access-Token": access_token,
            "Content-Type": "application/json",
        }

    async def get_shop(self) -> dict:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{self.base_url}/shop.json", headers=self.headers)
            res.raise_for_status()
            return res.json()["shop"]

    async def create_product(self, title: str, description: str, price: float,
                              tags: list[str] | None = None) -> dict:
        payload = {
            "product": {
                "title": title,
                "body_html": description,
                "tags": ", ".join(tags or []),
                "variants": [{"price": f"{price:.2f}"}],
            }
        }
        async with httpx.AsyncClient() as client:
            res = await client.post(f"{self.base_url}/products.json",
                                     headers=self.headers, json=payload)
            res.raise_for_status()
            return res.json()["product"]

    async def update_product_status(self, product_id: str, status: str) -> dict:
        """status: 'active' | 'draft' | 'archived'."""
        payload = {"product": {"id": product_id, "status": status}}
        async with httpx.AsyncClient() as client:
            res = await client.put(f"{self.base_url}/products/{product_id}.json",
                                    headers=self.headers, json=payload)
            res.raise_for_status()
            return res.json()["product"]

    async def get_order(self, order_id: str) -> dict:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{self.base_url}/orders/{order_id}.json",
                                    headers=self.headers)
            res.raise_for_status()
            return res.json()["order"]


async def get_client_for_workspace(workspace_id: str) -> "ShopifyClient | None":
    """Look up the workspace's stored Shopify integration and build a client.

    Returns None if the workspace hasn't connected a Shopify store yet.
    """
    from db import db

    integration = await db.integration.find_first(
        where={"workspaceId": workspace_id, "platform": "shopify", "isActive": True}
    )
    if not integration or not integration.storeId:
        return None
    return ShopifyClient(shop_domain=integration.storeId, access_token=integration.accessToken)
