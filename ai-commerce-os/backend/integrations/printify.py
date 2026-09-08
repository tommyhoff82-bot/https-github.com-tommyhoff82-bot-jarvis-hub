"""Printify API client.

Handles print-on-demand catalog lookups and order submission. Every
function takes an optional `api_key` so callers can validate a
workspace's own key (see api/routes/integrations.py) without touching
the deployment-wide PRINTIFY_API_KEY env var; when omitted, that env var
is the fallback, which is what the order webhook (api/webhooks/shopify.py)
still uses today — see MASTER_GUIDE.md for the per-workspace-routing gap
that leaves open.
"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

DEFAULT_API_KEY = os.getenv("PRINTIFY_API_KEY")
BASE_URL = "https://api.printify.com/v1"


def _headers(api_key: str | None = None) -> dict:
    key = api_key or DEFAULT_API_KEY
    return {"Authorization": f"Bearer {key}"}


async def list_shops(api_key: str | None = None) -> list[dict]:
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{BASE_URL}/shops.json", headers=_headers(api_key))
        res.raise_for_status()
        return res.json()


async def list_catalog_blueprints(api_key: str | None = None) -> list[dict]:
    """Available product types (t-shirts, mugs, etc.) to build listings from."""
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{BASE_URL}/catalog/blueprints.json", headers=_headers(api_key))
        res.raise_for_status()
        return res.json()


async def submit_order(shop_id: str, order_data: dict, api_key: str | None = None) -> dict:
    """order_data is a Shopify order payload (webhook body); this builds
    and submits the equivalent Printify order for fulfillment.
    """
    line_items = [
        {"print_provider_id": 1, "variant_id": "MOCK_99", "quantity": item["quantity"]}
        for item in order_data["line_items"]
    ]
    address = order_data["shipping_address"]
    payload = {
        "external_id": str(order_data["id"]),
        "shipping_method": 1,
        "address_to": {
            "first_name": address["first_name"],
            "last_name": address["last_name"],
            "email": order_data["email"],
            "country": address["country_code"],
            "city": address["city"],
            "address1": address["address1"],
            "zip": address["zip"],
        },
        "line_items": line_items,
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{BASE_URL}/shops/{shop_id}/orders.json",
            headers=_headers(api_key),
            json=payload,
        )
        res.raise_for_status()
        return res.json()
