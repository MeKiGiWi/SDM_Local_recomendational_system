#!/usr/bin/env python3
"""
Топ-5 рекомендаций как в mobile UI (fetchRecommendationsForProfile, без кликов).

  python backend/scripts/phone_ui_recommendations.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd
from catboost import CatBoostClassifier, Pool

ROOT = Path(__file__).resolve().parents[2]
BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from src.models.synthetic_from_profile import synthetic_from_profile  # noqa: E402

CBM = ROOT / "mobile" / "assets" / "model" / "catboost_pointwise.cbm"
META = ROOT / "mobile" / "assets" / "model" / "catboost_model.json"
ADS = ROOT / "mobile" / "src" / "data" / "ad-products.json"
QUANTILES_JSON = ROOT / "backend" / "datasets" / "processed" / "profile_quantiles.json"

CATEGORY_TAGS = {
    "deposits_and_savings_accounts_individuals": "Вклад",
    "loans_individuals": "Кредит",
    "debit_cards": "Карта",
    "rko_business_packages": "РКО",
    "deposits_business": "Депозит",
    "additional_business_services": "Услуга",
}


def load_catalog() -> dict[str, dict]:
    data = json.loads(ADS.read_text(encoding="utf-8-sig"))
    out: dict[str, dict] = {}
    for category, items in data.items():
        for it in items:
            out[it["id"]] = {
                "name": it["name"],
                "description": it["description"],
                "category": category,
                "tag": CATEGORY_TAGS.get(category, category),
            }
    return out


def build_frame(profile: dict, products: list[str]) -> pd.DataFrame:
    segment = profile["segment"]
    syn = synthetic_from_profile(profile["age"], profile["monthlyIncome"], profile["balance"], segment)
    sex = "M" if profile["sex"] == 1 else "F"
    rows = []
    for product in products:
        row = {
            "sex": sex,
            "age": float(profile["age"]),
            "is_new_customer": str(int(profile["isNewCustomer"])),
            "seniority_months": float(profile["seniorityMonths"]),
            "region_name": profile["regionName"],
            "segment": segment,
            "income_at_lag": float(profile["monthlyIncome"]),
            "product": product,
            **syn,
        }
        for p in products:
            row[f"own_{p}"] = 0.0
        rows.append(row)
    return pd.DataFrame(rows)


def top_k_ui(products: list[str], proba, k: int = 5) -> list[tuple[str, float]]:
    """Same as getTopKUniqueProductIds: sort by score desc, unique ids."""
    ranked = sorted(zip(products, proba), key=lambda x: -x[1])
    seen: set[str] = set()
    out: list[tuple[str, float]] = []
    for pid, score in ranked:
        if pid in seen:
            continue
        seen.add(pid)
        out.append((pid, float(score)))
        if len(out) >= k:
            break
    return out


def main() -> None:
    assert CBM.exists(), f"Missing {CBM}"
    meta = json.loads(META.read_text(encoding="utf-8"))
    products: list[str] = meta["products"]
    catalog = load_catalog()
    profiles = json.loads(QUANTILES_JSON.read_text(encoding="utf-8"))

    model = CatBoostClassifier()
    model.load_model(str(CBM))
    cat_cols = ["sex", "is_new_customer", "region_name", "segment", "product"]

    print(f"Phone model: {CBM.name} ({CBM.stat().st_size / 1e6:.2f} MB)")
    print(f"Inference: {meta['inference']}\n")

    for p in profiles:
        frame = build_frame(p, products)
        proba = model.predict_proba(Pool(frame, cat_features=cat_cols))[:, 1]
        top = top_k_ui(products, proba, 5)
        print(f"{'=' * 60}")
        print(f"{p['name']}  (q={p['quantile']}, {p['age']} лет, доход {p['monthlyIncome']:,} ₽)")
        print(f"Сегмент: {p['segment']}  |  Счёт: {p['accountType']}")
        print("Список в UI (сверху вниз, 1 — «Лучший выбор»):\n")
        for i, (pid, score) in enumerate(top, 1):
            item = catalog.get(pid)
            if not item:
                print(f"  {i}. [{pid}]  (нет в ad-products.json)")
                continue
            badge = "Лучший выбор" if i == 1 else f"#{i}"
            print(f"  {i}. [{item['tag']}] {item['name']}")
            print(f"     id: {pid}  |  {badge}  |  p={score:.4f}")
        print()


if __name__ == "__main__":
    main()
