"""Synthetic features: single source (Python) must match generated TS vectors."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

BACKEND = Path(__file__).resolve().parents[1]
ROOT = BACKEND.parent
sys.path.insert(0, str(BACKEND))

from src.models.catboost_pointwise import UserContext, CatBoostPointwiseRecommender  # noqa: E402
from src.models.synthetic_from_profile import synthetic_from_profile, typescript_source  # noqa: E402

QUANTILES = ROOT / "backend" / "datasets" / "processed" / "profile_quantiles.json"


@pytest.fixture
def demo_profiles() -> list[dict]:
    return json.loads(QUANTILES.read_text(encoding="utf-8"))


def test_typescript_file_matches_embedded_source():
    ts_path = ROOT / "mobile" / "src" / "services" / "syntheticFromProfile.generated.ts"
    assert ts_path.exists(), "Run: python backend/scripts/generate_synthetic_ts.py"
    assert ts_path.read_text(encoding="utf-8") == typescript_source()


@pytest.mark.parametrize(
    "age,income,balance,segment",
    [
        (21, 45943, 45718, "STUDENTS"),
        (29, 74997, 75173, "INDIVIDUALS"),
        (42, 100602, 101713, "INDIVIDUALS"),
        (55, 161283, 163881, "INDIVIDUALS"),
        (35, 85000, 120000, "VIP"),
    ],
)
def test_synthetic_keys_stable(age, income, balance, segment):
    out = synthetic_from_profile(age, income, balance, segment)
    assert len(out) == 11
    assert out["synthetic_turnover_30d"] > 0


def test_phone_rows_match_server_recommender(demo_profiles):
    rec = CatBoostPointwiseRecommender()
    for p in demo_profiles:
        ctx = UserContext.from_api(
            age=p["age"],
            balance=p["balance"],
            monthly_income=p["monthlyIncome"],
            sex=p["sex"],
            seniority_months=p["seniorityMonths"],
            is_new_customer=p["isNewCustomer"],
            segment=p["segment"],
            region_name=p["regionName"],
        )
        syn_ctx = ctx.synthetic or {}
        syn_direct = synthetic_from_profile(p["age"], p["monthlyIncome"], p["balance"], p["segment"])
        for k, v in syn_direct.items():
            assert syn_ctx[k] == pytest.approx(v), f"{p['name']} {k}"
