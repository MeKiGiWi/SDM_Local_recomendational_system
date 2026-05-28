"""HTTP API for the SDM frontend (auth, products, ads, analytics)."""

from __future__ import annotations

import json
import random
import sys
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

ROOT = Path(__file__).resolve().parents[3]
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

PRODUCTS_JSON = ROOT / "frontend" / "src" / "data" / "ad-products.json"

_recommender = None


def _get_recommender():
    global _recommender
    if _recommender is None:
        from src.models.catboost_pointwise import get_recommender

        _recommender = get_recommender()
    return _recommender


def _product_by_id(product_id: str) -> dict[str, Any] | None:
    for p in _load_products():
        if p["id"] == product_id:
            return p
    return None

MOCK_USER: dict[str, Any] = {
    "id": "user-001",
    "fullName": "Иван Петров",
    "phone": "+7 (999) 123-45-67",
    "email": "ivan@example.com",
    "balance": 2458900.50,
    "currency": "RUB",
    "bonusPoints": 1250,
    "tariff": "Пакет «Оптимальный»",
    "registrationDate": "2024-01-15",
}

MOCK_TRANSACTIONS = [
    {
        "id": "tx-1",
        "type": "deposit",
        "amount": 50000,
        "currency": "RUB",
        "description": "Пополнение через банкомат",
        "date": "2026-05-20T10:30:00",
        "status": "completed",
    },
    {
        "id": "tx-2",
        "type": "withdrawal",
        "amount": 15000,
        "currency": "RUB",
        "description": "Снятие наличных",
        "date": "2026-05-19T14:20:00",
        "status": "completed",
    },
]

AD_TEMPLATES = [
    {"title": "Вклад «Идеальный баланс»", "subtitle": "Ставка до 14,30% — от 50 000 ₽", "link": "/products?category=deposits_individuals"},
    {"title": "MIR SUPREME Платиновая", "subtitle": "Премиум-карта с VIP-доступом", "link": "/products?category=debit_cards"},
    {"title": "Потребительский кредит", "subtitle": "До 3 млн ₽ от 24% годовых", "link": "/products?category=loans_individuals"},
    {"title": "Ипотека", "subtitle": "До 20 млн ₽ на 25 лет от 18,9%", "link": "/products?category=loans_individuals"},
    {"title": "Автокредит", "subtitle": "До 6 млн ₽ от 22% годовых", "link": "/products?category=loans_individuals"},
    {"title": "МИР Привилегия Классическая", "subtitle": "До 6% на остаток — 0 ₽ обслуживание", "link": "/products?category=debit_cards"},
    {"title": "РКО «Стартовый»", "subtitle": "0 ₽/мес первые 2 месяца", "link": "/products?category=rko_business"},
    {"title": "«СДМ-Вклад»", "subtitle": "До 14,15% от 50 000 ₽", "link": "/products?category=deposits_individuals"},
    {"title": "Депозит «Оперативный плюс»", "subtitle": "Для бизнеса от 5 млн ₽", "link": "/products?category=deposits_business"},
    {"title": "Факторинг для маркетплейсов", "subtitle": "Финансирование до 50 млн ₽", "link": "/products?category=business_services"},
]

_event_log: list[Any] = []
_products_cache: list[dict[str, Any]] | None = None

app = FastAPI(title="SDM Bank API", version="1.0.0")
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
        for p in group:
            items.append(
                {
                    "id": p["id"],
                    "name": p["name"],
                    "description": p["description"],
                    "category": category,
                    "image": p.get("image", ""),
                    "showOnHome": p.get("showOnHome", False),
                }
            )
    _products_cache = items
    return items


def _pick_ad(age: int, balance: float) -> tuple[int, str]:
    if age < 25 and balance < 50000:
        return 5, "Молодой возраст + скромный бюджет: дебетовая карта с кэшбеком"
    if age < 25:
        return 2, "Молодой возраст + хороший бюджет: потребительский кредит на развитие"
    if 25 <= age < 45 and balance >= 200000:
        return 3, "Средний возраст + высокий доход: ипотека"
    if age >= 45 and balance >= 500000:
        return 0, "Зрелый возраст + крупная сумма: выгодный вклад"
    if age >= 45:
        return 7, "Зрелый возраст + сбережения: стабильный вклад"
    if balance >= 1000000:
        return 8, "Крупный капитал: депозит для бизнеса"
    if 25 <= age < 45:
        return 4, "Средний возраст: автокредит"
    return 0, "Универсальное предложение: выгодный вклад"


MODEL_DIR = ROOT / "frontend" / "public" / "model"
REQUIRED_MODEL_FILES = ("catboost_pointwise.cbm", "catboost_model.json", "feature_order.json")
CATBOOST_PKL = BACKEND / "models" / "export" / "catboost_pointwise_holdout.pkl"


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "source": "sdm-api"}


@app.get("/api/model/health")
def model_health() -> dict[str, Any]:
    """Статус файлов модели на сервере (в APK копия из frontend/public/model)."""
    files: dict[str, Any] = {}
    missing: list[str] = []
    for name in REQUIRED_MODEL_FILES:
        path = MODEL_DIR / name
        if path.exists():
            files[name] = {"bytes": path.stat().st_size, "ok": True}
        else:
            files[name] = {"ok": False}
            missing.append(name)

    manifest_path = MODEL_DIR / "model_manifest.json"
    manifest = None
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    pkl_ok = CATBOOST_PKL.exists()
    return {
        "status": "ok" if not missing and pkl_ok else "incomplete",
        "inference_on_phone": "catboost_pointwise.cbm (native CatBoost, offline Android)",
        "inference_on_server": "catboost_pointwise.pkl",
        "catboost_pkl": {"path": str(CATBOOST_PKL.relative_to(ROOT)).replace("\\", "/"), "ok": pkl_ok},
        "model_dir": str(MODEL_DIR.relative_to(ROOT)).replace("\\", "/"),
        "required": list(REQUIRED_MODEL_FILES),
        "missing": missing,
        "files": files,
        "manifest": manifest,
        "train_hint": "python backend/scripts/train_catboost_pointwise.py && python backend/scripts/export_catboost_mobile.py",
    }


@app.post("/api/auth/login")
async def login(_: Request) -> JSONResponse:
    return JSONResponse(
        {
            "token": "mock-jwt-token-12345",
            "user": {
                "id": "user-001",
                "fullName": MOCK_USER["fullName"],
                "phone": MOCK_USER["phone"],
                "email": MOCK_USER["email"],
            },
        }
    )


@app.post("/api/auth/register")
async def register(request: Request) -> JSONResponse:
    body = await request.json()
    return JSONResponse(
        {"token": "mock-jwt-token-67890", "user": {"id": "user-002", **body}},
        status_code=201,
    )


@app.post("/api/auth/logout")
def logout() -> None:
    return None


@app.get("/api/auth/me")
def auth_me() -> dict[str, Any]:
    return MOCK_USER


@app.get("/api/user/profile")
def user_profile() -> dict[str, Any]:
    return MOCK_USER


@app.get("/api/user/dashboard")
def user_dashboard() -> dict[str, Any]:
    return {
        "profile": MOCK_USER,
        "recentTransactions": MOCK_TRANSACTIONS,
        "activeProducts": [
            {
                "id": "dep-1",
                "name": "Вклад «Идеальный баланс»",
                "description": "Краткосрочный вклад",
                "category": "deposits_and_savings_accounts_individuals",
            },
        ],
    }


@app.get("/api/user/transactions")
def user_transactions() -> list[dict[str, Any]]:
    return MOCK_TRANSACTIONS


@app.get("/api/products")
def products(category: str | None = None) -> list[dict[str, Any]]:
    items = _load_products()
    if category:
        return [p for p in items if p["category"] == category]
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
    try:
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
        for pid, score in ranked:
            p = _product_by_id(pid)
            if p:
                out.append({**p, "score": round(score, 4)})
        if out:
            return out
    except Exception:
        pass
    items = _load_products()
    return random.sample(items, k=min(5, len(items)))


@app.post("/api/ads/ai-select")
async def ads_select(request: Request) -> dict[str, Any]:
    body = await request.json()
    age = int(body.get("age", 30))
    balance = float(body.get("balance", 100000))
    monthly_income = float(body.get("monthlyIncome", body.get("monthly_income", balance * 0.3)))
    click_history = body.get("clickHistory") or body.get("clicks") or {}
    sex = body.get("sex")
    seniority_months = body.get("seniorityMonths", body.get("seniority_months"))
    is_new_customer = body.get("isNewCustomer", body.get("is_new_customer"))
    segment = body.get("segment")
    region_name = body.get("regionName", body.get("region_name"))

    try:
        from src.models.catboost_pointwise import UserContext

        ctx = UserContext.from_api(
            age=age,
            balance=balance,
            monthly_income=monthly_income,
            click_history=click_history if isinstance(click_history, dict) else {},
            sex=sex if sex is not None else None,
            seniority_months=float(seniority_months) if seniority_months is not None else None,
            is_new_customer=int(is_new_customer) if is_new_customer is not None else None,
            segment=str(segment) if segment else None,
            region_name=str(region_name) if region_name else None,
        )
        ranked = _get_recommender().rank_products(
            ctx, top_k=1, click_boost=click_history if isinstance(click_history, dict) else None
        )
        if ranked:
            pid, score = ranked[0]
            product = _product_by_id(pid)
            if product:
                return {
                    "adId": product["id"],
                    "title": product["name"],
                    "subtitle": (product["description"][:80] + "...") if len(product["description"]) > 80 else product["description"],
                    "link": f"/product/{product['id']}",
                    "reason": "CatBoost: оптимально под ваш профиль",
                    "confidence": round(float(score), 3),
                }
    except Exception:
        pass

    ad_idx, reason = _pick_ad(age, balance)
    template = AD_TEMPLATES[ad_idx]
    return {
        "adId": f"ai-ad-{ad_idx}",
        "title": template["title"],
        "subtitle": template["subtitle"],
        "link": template["link"],
        "reason": reason,
        "confidence": round(0.75 + random.random() * 0.2, 3),
    }


@app.post("/api/analytics/event")
async def analytics_event(request: Request) -> None:
    body = await request.json()
    _event_log.append(body)
    return None


@app.get("/api/analytics/events")
def analytics_events() -> dict[str, Any]:
    return {"count": len(_event_log), "events": _event_log[-50:]}
