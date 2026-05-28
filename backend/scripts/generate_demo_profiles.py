"""
Generate four reproducible demo profiles from real data for the web UI.

Input priority:
  1. ./train_wide_filled_lags.csv
  2. backend/datasets/raw/train_wide_with_lags.csv
  3. backend/datasets/raw/train_wide_new.csv
  4. backend/datasets/raw/train_wide.csv

Outputs:
  frontend/src/features/profiles/demoProfiles.generated.ts
  backend/datasets/processed/demo_profiles.json
  frontend/src/model/__fixtures__/profiles.json
"""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
PRODUCTS = [
    "dep-7",
    "card-2",
    "dep-5",
    "card-1",
    "card-5",
    "rko-2",
    "rko-3",
    "rko-4",
    "dep-9",
    "dep-1",
    "dep-3",
    "rko-1",
    "dep-2",
    "loan-2",
    "card-4",
    "loan-1",
    "srv-3",
    "loan-5",
    "biz-4",
    "dep-6",
    "loan-4",
    "card-3",
]
DATA_CANDIDATES = [
    ROOT / "train_wide_filled_lags.csv",
    ROOT / "backend" / "datasets" / "raw" / "train_wide_with_lags.csv",
    ROOT / "backend" / "datasets" / "raw" / "train_wide_new.csv",
    ROOT / "backend" / "datasets" / "raw" / "train_wide.csv",
]
TARGETS = [15_000, 100_000, 500_000, 5_000_000]
# Purchasing-power / market-calibration coefficient for mapping the European
# model income distribution onto a Russian demo income scale. This is not an
# official EUR/RUB FX rate and must not be used for accounting conversion.
START_EUR_TO_RUB_CALIBRATED = 20.0
EUR_TO_RUB_CALIBRATED = 12.0
CALIBRATION_CANDIDATES = [4.0, 8.0, 12.0, 15.0, 20.0, 25.0, 30.0]
MODEL_INCOME_UNIT = "EUR/year"
OUT_TS = ROOT / "frontend" / "src" / "features" / "profiles" / "demoProfiles.generated.ts"
OUT_JSON = ROOT / "backend" / "datasets" / "processed" / "demo_profiles.json"
OUT_FIXTURES = ROOT / "frontend" / "src" / "model" / "__fixtures__" / "profiles.json"


def find_dataset() -> Path:
    for path in DATA_CANDIDATES:
        if path.exists():
            return path
    raise SystemExit("No dataset found for demo profiles")


def infer_segment_label(segment: str) -> str:
    return {
        "STUDENTS": "Студент",
        "VIP": "Премиум",
        "INDIVIDUALS": "Частный клиент",
    }.get(segment, "Клиент банка")


def model_income_to_monthly_rub(model_income_eur_year: float, coefficient: float = EUR_TO_RUB_CALIBRATED) -> float:
    if MODEL_INCOME_UNIT != "EUR/year":
        raise ValueError(f"Unsupported model income unit: {MODEL_INCOME_UNIT}")
    return model_income_eur_year * coefficient / 12.0


def calibration_report(model_income_eur_year: pd.Series) -> tuple[list[dict], dict]:
    percentiles = {
        "p05": 0.05,
        "p25": 0.25,
        "p50": 0.50,
        "p75": 0.75,
        "p90": 0.90,
        "p95": 0.95,
        "p99": 0.99,
    }
    reports = []
    for coefficient in CALIBRATION_CANDIDATES:
        monthly = model_income_eur_year * coefficient / 12.0
        reports.append(
            {
                "coefficient": coefficient,
                "quantilesRubMonth": {
                    label: int(round(float(monthly.quantile(q)))) for label, q in percentiles.items()
                },
                "targetQuantiles": {
                    str(target): round(float((monthly <= target).mean()), 4) for target in TARGETS
                },
            }
        )

    selected = next(item for item in reports if item["coefficient"] == EUR_TO_RUB_CALIBRATED)
    summary = {
        "selectedCoefficient": EUR_TO_RUB_CALIBRATED,
        "selectionReason": (
            "Coefficient 12 places 100k RUB/month near the median, 500k RUB/month near p99, "
            "and 5M RUB/month in the extreme upper tail. Starting coefficient 20 made the "
            "distribution too high for the Russian demo scale."
        ),
        "startCoefficient": START_EUR_TO_RUB_CALIBRATED,
        "selectedReport": selected,
    }
    return reports, summary


def pick_icon_tags(segment: str, income: float, owned: list[str]) -> list[str]:
    tags = []
    if segment == "STUDENTS":
        tags.append("Стартовый доход")
    elif income >= 500_000:
        tags.append("Высокий доход")
    else:
        tags.append("Стабильный доход")

    if any(p.startswith("loan-") for p in owned):
        tags.append("Есть кредитные продукты")
    if any(p.startswith("dep-") for p in owned):
        tags.append("Есть сбережения")
    if any(p.startswith("rko-") or p.startswith("biz-") for p in owned):
        tags.append("Есть бизнес-продукты")
    if len(tags) < 3:
        tags.append("Профиль из реального датасета")
    return tags[:4]


def balance_proxy(row: pd.Series) -> tuple[float, str]:
    if "balance" in row.index and pd.notna(row["balance"]):
        return float(row["balance"]), "balance"
    if "lag_90" in row.index and pd.notna(row["lag_90"]):
        return float(row["lag_90"]), "lag_90"
    if "income_lag_90" in row.index and pd.notna(row["income_lag_90"]):
        return float(row["income_lag_90"]), "income_lag_90_proxy"
    return float(row["income_filled"]) * 0.35, "income_share_proxy"


def build_profile(row: pd.Series, target_income: int, monthly_distribution_rub: pd.Series) -> dict:
    model_income_eur_year = float(row["income_filled"])
    monthly_income_rub = model_income_to_monthly_rub(model_income_eur_year)
    balance, balance_source = balance_proxy(row)
    owned = [product for product in PRODUCTS if product in row.index and float(row[product]) > 0]
    sex_raw = str(row["sex"])
    sex_num = 1 if sex_raw.upper() == "M" else 0
    segment = str(row["segment"])
    age = int(round(float(row["age"])))
    seniority = int(round(float(row["seniority_months"])))
    is_new = int(round(float(row["is_new_customer"])))
    quantile = float((monthly_distribution_rub <= monthly_income_rub).mean())
    selection_delta = abs(monthly_income_rub - target_income)
    return {
        "id": f"user-{int(row['user_id'])}",
        "name": f"Клиент {target_income // 1000}k",
        "sourceUserId": int(row["user_id"]),
        "targetMonthlyIncomeRub": target_income,
        "modelIncomeEurYear": round(model_income_eur_year, 2),
        "rawIncome": {
            "field": "income_filled",
            "value": round(model_income_eur_year, 2),
            "unit": MODEL_INCOME_UNIT,
        },
        "monthlyIncomeRub": int(round(monthly_income_rub)),
        "incomeQuantile": round(quantile, 4),
        "selectionReason": (
            f"Nearest real client to target {target_income:,.0f} RUB/month after calibrated conversion; "
            f"delta {selection_delta:,.0f} RUB/month."
        ).replace(",", " "),
        "age": age,
        "balance": round(balance, 2),
        "balanceSource": balance_source,
        "sex": sex_num,
        "sexLabel": "Мужчина" if sex_num == 1 else "Женщина",
        "seniorityMonths": seniority,
        "isNewCustomer": is_new,
        "segment": segment,
        "regionName": str(row["region_name"]),
        "ownedProducts": owned,
        "ownedProductFlags": {product: int(product in owned) for product in PRODUCTS},
        "info": infer_segment_label(segment),
        "description": f"Реальный клиент из датасета, выбранный рядом с уровнем дохода {target_income:,.0f} ₽/мес.".replace(",", " "),
        "characteristics": pick_icon_tags(segment, monthly_income_rub, owned),
    }


def ts_source(profiles: list[dict]) -> str:
    payload = json.dumps(profiles, ensure_ascii=False, indent=2)
    return (
        "/* AUTO-GENERATED — do not edit. Run: python backend/scripts/generate_demo_profiles.py */\n"
        f"export const DEMO_PROFILES = {payload} as const\n"
    )


def public_profile(profile: dict) -> dict:
    """Return the UI payload. Raw income/audit details stay in demo_profiles.json."""
    public = {
        key: value
        for key, value in profile.items()
        if key not in {"rawIncome", "selectionReason", "modelIncomeEurYear"}
    }
    public["scoringIncome"] = profile["modelIncomeEurYear"]
    return public


def main() -> None:
    dataset = find_dataset()
    usecols = ["user_id", "sex", "age", "is_new_customer", "seniority_months", "region_name", "segment", "income_filled", "income_lag_90"]
    present_cols = pd.read_csv(dataset, nrows=0).columns.tolist()
    usecols = [col for col in usecols if col in present_cols] + [col for col in PRODUCTS if col in present_cols]
    df = pd.read_csv(dataset, usecols=usecols, low_memory=False)
    df = df.dropna(subset=["income_filled", "age", "sex", "seniority_months", "is_new_customer", "segment", "region_name"]).copy()
    model_income_eur_year = df["income_filled"].astype(float)
    monthly_income_rub = model_income_to_monthly_rub(model_income_eur_year)
    reports, summary = calibration_report(model_income_eur_year)

    profiles = []
    for target in TARGETS:
        idx = (monthly_income_rub - target).abs().idxmin()
        profiles.append(build_profile(df.loc[idx], target, monthly_income_rub))
    public_profiles = [public_profile(profile) for profile in profiles]

    max_monthly_income = float(monthly_income_rub.max())
    audit = {
        "sourceDataset": str(dataset.relative_to(ROOT)).replace("\\", "/"),
        "displayCurrency": "RUB/month",
        "modelIncomeUnit": MODEL_INCOME_UNIT,
        "incomeCalibrationCoefficient": EUR_TO_RUB_CALIBRATED,
        "calibrationKind": "market_adjusted_not_fx_rate",
        "calibrationSummary": summary,
        "calibrationReport": reports,
        "targets": TARGETS,
        "maxAvailableMonthlyIncomeRub": int(round(max_monthly_income)),
        "usedUpperTailInsteadOfTarget": max_monthly_income < TARGETS[-1],
        "profiles": profiles,
    }

    OUT_TS.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_FIXTURES.parent.mkdir(parents=True, exist_ok=True)
    OUT_TS.write_text(ts_source(public_profiles), encoding="utf-8")
    OUT_JSON.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    OUT_FIXTURES.write_text(json.dumps(public_profiles, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {OUT_TS}")
    print(f"wrote {OUT_JSON}")
    print(f"wrote {OUT_FIXTURES}")


if __name__ == "__main__":
    main()
