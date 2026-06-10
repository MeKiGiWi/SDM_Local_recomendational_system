"""Legacy backend API for data and verification helpers.

The primary recommendation demo path runs locally in the web and mobile clients.
This FastAPI app is kept only for development utilities and dataset/model inspection.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).resolve().parents[3]
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

PRODUCTS_JSON = ROOT / "frontend" / "src" / "data" / "ad-products.json"
MODEL_DIR = ROOT / "frontend" / "public" / "model"
CATBOOST_PKL = BACKEND / "models" / "export" / "catboost_pointwise_holdout.pkl"
REQUIRED_MODEL_FILES = (
    "catboost_pointwise.cbm",
    "catboost_model.json",
    "feature_order.json",
    "model_manifest.json",
)

_products_cache: list[dict[str, Any]] | None = None
_recommender = None

app = FastAPI(title="SDM Edge Recommendation Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _load_products() -> list[dict[str, Any]]:
    global _products_cache
    if _products_cache is not None:
        return _products_cache

    raw = json.loads(PRODUCTS_JSON.read_text(encoding="utf-8-sig"))
    items: list[dict[str, Any]] = []
    for category, group in raw.items():
        for product in group:
            items.append(
                {
                    "id": product["id"],
                    "name": product["name"],
                    "description": product["description"],
                    "category": category,
                    "image": product.get("image", ""),
                    "showOnHome": product.get("showOnHome", False),
                }
            )
    _products_cache = items
    return items


def _product_by_id(product_id: str) -> dict[str, Any] | None:
    for product in _load_products():
        if product["id"] == product_id:
            return product
    return None


def _get_recommender():
    global _recommender
    if _recommender is None:
        from src.models.catboost_pointwise import get_recommender

        _recommender = get_recommender()
    return _recommender


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "role": "legacy-dev-backend"}


@app.get("/api/model/health")
def model_health() -> dict[str, Any]:
    files: dict[str, Any] = {}
    missing: list[str] = []
    for name in REQUIRED_MODEL_FILES:
        path = MODEL_DIR / name
        if path.exists():
            files[name] = {"bytes": path.stat().st_size, "ok": True}
        else:
            files[name] = {"ok": False}
            missing.append(name)

    manifest = None
    manifest_path = MODEL_DIR / "model_manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    return {
        "status": "ok" if not missing else "incomplete",
        "backend_role": "training-export-verification",
        "primary_inference_path": "client-side-local",
        "catboost_pkl_present": CATBOOST_PKL.exists(),
        "model_dir": str(MODEL_DIR.relative_to(ROOT)).replace("\\", "/"),
        "required": list(REQUIRED_MODEL_FILES),
        "missing": missing,
        "files": files,
        "manifest": manifest,
    }


@app.get("/api/products")
def products(category: str | None = None) -> list[dict[str, Any]]:
    items = _load_products()
    if category:
        return [product for product in items if product["category"] == category]
    return items


@app.get("/api/products/recommendations")
def product_recommendations(
    age: int = 35,
    balance: float = 250_000,
    monthly_income: float = 85_000,
    sex: int | None = None,
    seniority_months: float | None = None,
    is_new_customer: int | None = None,
    segment: str | None = None,
    region_name: str | None = None,
) -> list[dict[str, Any]]:
    """Legacy endpoint kept for development comparison only."""
    from src.models.catboost_pointwise import UserContext

    ctx = UserContext.from_api(
        age=age,
        balance=balance,
        monthly_income=monthly_income,
        sex=sex,
        seniority_months=seniority_months,
        is_new_customer=is_new_customer,
        segment=segment,
        region_name=region_name,
    )
    ranked = _get_recommender().rank_products(ctx, top_k=5)
    out: list[dict[str, Any]] = []
    for product_id, score in ranked:
        product = _product_by_id(product_id)
        if product:
            out.append({**product, "score": round(score, 4)})

    if out:
        return out

    return []
