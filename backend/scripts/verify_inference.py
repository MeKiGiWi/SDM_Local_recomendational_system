#!/usr/bin/env python3
"""Smoke test: CatBoost pkl + exported .cbm metadata."""

from __future__ import annotations

import json
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
ROOT = BACKEND.parent
sys.path.insert(0, str(BACKEND))

from src.models.catboost_pointwise import UserContext, get_recommender  # noqa: E402

META = ROOT / "mobile" / "assets" / "model" / "catboost_model.json"
CBM = ROOT / "mobile" / "assets" / "model" / "catboost_pointwise.cbm"
PKL = BACKEND / "models" / "export" / "catboost_pointwise_holdout.pkl"


def test_pkl() -> None:
    assert PKL.exists(), f"missing {PKL}"
    rec = get_recommender()
    ctx = UserContext.from_api(age=30, balance=250_000, monthly_income=85_000)
    ranked = rec.rank_products(ctx, top_k=5)
    assert len(ranked) >= 1, "empty ranking"
    assert all(0 <= s <= 1 for _, s in ranked), "scores out of range"
    print("pkl top3:", [p for p, _ in ranked[:3]])


def test_cbm_bundle() -> None:
    assert CBM.exists(), f"missing {CBM}"
    assert META.exists(), f"missing {META}"
    meta = json.loads(META.read_text(encoding="utf-8"))
    assert meta["inference"] == "catboost_cbm_native"
    assert len(meta["products"]) == 22
    print("cbm:", round(CBM.stat().st_size / 1e6, 2), "MB,", len(meta["products"]), "products")


def main() -> None:
    test_pkl()
    test_cbm_bundle()
    print("ALL OK")


if __name__ == "__main__":
    main()
