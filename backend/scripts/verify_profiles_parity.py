#!/usr/bin/env python3
"""Print CatBoost top-5 per demo profile (server ground truth)."""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
ROOT = BACKEND.parent
sys.path.insert(0, str(BACKEND))

from src.models.catboost_pointwise import UserContext, get_recommender  # noqa: E402

PROFILES = [
    ("Матвей", dict(age=21, balance=45718, monthly_income=45943, account_type="card", sex=1, seniority_months=6, is_new_customer=0, segment="STUDENTS", region_name="MADRID")),
    ("Артем", dict(age=29, balance=75173, monthly_income=74997, account_type="current", sex=1, seniority_months=23, is_new_customer=0, segment="INDIVIDUALS", region_name="MADRID")),
    ("Даня", dict(age=42, balance=101713, monthly_income=100602, account_type="savings", sex=1, seniority_months=62, is_new_customer=0, segment="INDIVIDUALS", region_name="MADRID")),
    ("Михаил", dict(age=55, balance=163881, monthly_income=161283, account_type="deposit", sex=1, seniority_months=170, is_new_customer=0, segment="INDIVIDUALS", region_name="MADRID")),
]

def main() -> None:
    rec = get_recommender()
    for name, kw in PROFILES:
        ctx = UserContext.from_api(**kw)
        ranked = rec.rank_products(ctx, top_k=5)
        print(f"\n=== {name} ===")
        for i, (pid, score) in enumerate(ranked, 1):
            print(f"  {i}. {pid} ({score:.4f})")


if __name__ == "__main__":
    main()
