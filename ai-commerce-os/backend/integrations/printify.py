"""Printify API client.

Handles print-on-demand catalog lookups and order submission. The order
submission piece was previously inlined in api/webhooks/shopify.py; it now
lives here so both the webhook handler and any future manual "fulfill this
order" action call the same code path.
"""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

PRINTIFY_API_KEY = os.getenv("PRINTIFY_API_KEY")
BASE_URL = "https://api.printify.com/v1"


def _headers() -> dict:
    return {"Authorization": f"Bearer {PRINTIFY_API_KEY}"}


async def list_shops() -> list[dict]:
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{BASE_URL}/shops.json", headers=_headers())
        res.raise_for_status()
        return res.json()


async def list_catalog_blueprints() -> list[dict]:
    """Available product types (t-shirts, mugs, etc.) to build listings from."""
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{BASE_URL}/catalog/blueprints.json", headers=_headers())
        res.raise_for_status()
        return res.json()


async def submit_order(shop_id: str, order_data: dict) -> dict:
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
            headers=_headers(),
            json=payload,
        )
        res.raise_for_status()
        return res.json()
