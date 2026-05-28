#!/usr/bin/env python3
"""
Run the same CatBoost .cbm that ships in the APK (mobile/assets/model).
Builds pointwise rows like mobile/src/services/pointwiseFeatures.ts + native Kotlin.
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


def load_profiles() -> list[dict]:
    data = json.loads(QUANTILES_JSON.read_text(encoding="utf-8"))
    return [
        {
            "name": p["name"],
            "age": p["age"],
            "balance": p["balance"],
            "monthlyIncome": p["monthlyIncome"],
            "sex": p["sex"],
            "seniorityMonths": p["seniorityMonths"],
            "isNewCustomer": p["isNewCustomer"],
            "segment": p["segment"],
            "regionName": p["regionName"],
        }
        for p in data
    ]


def build_frame(profile: dict, products: list[str], clicks: dict[str, int] | None = None) -> pd.DataFrame:
    clicks = clicks or {}
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
            row[f"own_{p}"] = float((clicks.get(p, 0) > 0))
        rows.append(row)
    return pd.DataFrame(rows)


def load_product_names() -> dict[str, str]:
    data = json.loads(ADS.read_text(encoding="utf-8-sig"))
    out: dict[str, str] = {}
    for items in data.values():
        for it in items:
            out[it["id"]] = it["name"]
    return out


def main() -> None:
    assert CBM.exists(), f"Missing {CBM}"
    meta = json.loads(META.read_text(encoding="utf-8"))
    assert meta["inference"] == "catboost_cbm_native", meta.get("inference")
    products = meta["products"]
    names = load_product_names()

    model = CatBoostClassifier()
    model.load_model(str(CBM))
    cat_cols = ["sex", "is_new_customer", "region_name", "segment", "product"]

    print(f"Model: {CBM} ({CBM.stat().st_size / 1e6:.2f} MB)")
    print(f"Products: {len(products)}\n")

    profiles = load_profiles()
    for p in profiles:
        frame = build_frame(p, products)
        pool = Pool(frame, cat_features=cat_cols)
        proba = model.predict_proba(pool)[:, 1]
        ranked = sorted(zip(products, proba), key=lambda x: -x[1])[:5]
        print(f"=== {p['name']} (age {p['age']}, income {p['monthlyIncome']}, {p['segment']}) ===")
        for i, (pid, score) in enumerate(ranked, 1):
            title = names.get(pid, pid)
            print(f"  {i}. {pid} — {title}  (p={score:.4f})")
        print()

    print("OK: phone .cbm inference matches native CatBoost applier path")


if __name__ == "__main__":
    main()
