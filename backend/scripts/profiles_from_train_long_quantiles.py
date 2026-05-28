"""
Заполнить 4 демо-профиля квантилями 0.05 / 0.25 / 0.5 / 0.8 по train_long (или wide).

Сначала соберите train_long (если ещё нет):
  python backend/scripts/build_train_long.py

Затем:
  python backend/scripts/profiles_from_train_long_quantiles.py
  python backend/scripts/profiles_from_train_long_quantiles.py --apply

--apply  — перезаписать mobile/src/config/profiles.ts и
           frontend/.../ClientSelector.tsx числовыми полями (имена/тексты UI не трогает).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

LONG_CSV = ROOT / "backend" / "datasets" / "processed" / "train_long.csv"
WIDE_CSV = ROOT / "backend" / "datasets" / "raw" / "train_wide_with_lags.csv"
OUT_JSON = ROOT / "backend" / "datasets" / "processed" / "profile_quantiles.json"

PROFILE_NAMES = ["Матвей", "Артем", "Даня", "Михаил"]
QUANTILES = [0.05, 0.25, 0.5, 0.8]
ACCOUNT_TYPES = ["card", "current", "savings", "deposit"]
INCOME_BAND = 0.02


def load_users(path: Path) -> pd.DataFrame:
    """Одна строка на пользователя (из long или wide)."""
    header = pd.read_csv(path, nrows=0).columns.tolist()
    is_long = "product" in header and "income_at_lag" in header

    if is_long:
        df = pd.read_csv(
            path,
            usecols=[
                "user_id",
                "sex",
                "age",
                "is_new_customer",
                "seniority_months",
                "region_name",
                "segment",
                "income_at_lag",
            ],
            low_memory=False,
        )
        df = df.drop_duplicates(subset=["user_id"], keep="first")
        return df.rename(columns={"income_at_lag": "income_filled"})

    usecols = [
        "user_id",
        "sex",
        "age",
        "is_new_customer",
        "seniority_months",
        "region_name",
        "segment",
        "income_filled",
        "lag_90",
    ]
    return pd.read_csv(path, usecols=usecols, low_memory=False)


def profile_at_quantile(df: pd.DataFrame, q: float) -> dict:
    income = df["income_filled"]
    lo = income.quantile(max(0.0, q - INCOME_BAND))
    hi = income.quantile(min(1.0, q + INCOME_BAND))
    band = df[(income >= lo) & (income <= hi)]
    if band.empty:
        band = df

    seg_mode = str(band["segment"].mode().iloc[0])
    age_q = int(round(df["age"].quantile(q)))
    if q <= 0.05 and age_q <= 25 and (band["segment"] == "STUDENTS").any():
        seg_mode = "STUDENTS"
    if q >= 0.8 and (band["segment"] == "VIP").mean() > 0.25:
        seg_mode = "VIP"

    sex_char = str(band["sex"].mode().iloc[0])
    balance_col = "lag_90" if "lag_90" in df.columns else "income_filled"

    return {
        "quantile": q,
        "age": age_q,
        "monthlyIncome": int(round(income.quantile(q))),
        "balance": int(round(df[balance_col].quantile(q))),
        "seniorityMonths": int(round(df["seniority_months"].quantile(q))),
        "isNewCustomer": int(round(df["is_new_customer"].quantile(q))),
        "sex": 1 if sex_char.upper().startswith("M") else 0,
        "segment": seg_mode,
        "regionName": str(band["region_name"].mode().iloc[0]),
    }


def build_profiles(df: pd.DataFrame) -> list[dict]:
    out: list[dict] = []
    for q, name, account in zip(QUANTILES, PROFILE_NAMES, ACCOUNT_TYPES):
        row = profile_at_quantile(df, q)
        row["name"] = name
        row["accountType"] = account
        row["currency"] = "RUB"
        out.append(row)
    return out


def apply_to_ts(profiles: list[dict], ts_path: Path) -> None:
    text = ts_path.read_text(encoding="utf-8")
    for p in profiles:
        name = p["name"]
        block_re = re.compile(
            rf"name: '{re.escape(name)}',.*?(?=\n  \{{|\n\])",
            re.DOTALL,
        )
        m = block_re.search(text)
        if not m:
            raise ValueError(f"Profile block not found for {name} in {ts_path}")

        block = m.group(0)
        replacements = {
            r"age: \d+": f"age: {p['age']}",
            r"balance: [\d_]+": f"balance: {p['balance']}",
            r"monthlyIncome: [\d_]+": f"monthlyIncome: {p['monthlyIncome']}",
            r"accountType: '[^']+'": f"accountType: '{p['accountType']}'",
            r"sex: [01]": f"sex: {p['sex']}",
            r"seniorityMonths: \d+": f"seniorityMonths: {p['seniorityMonths']}",
            r"isNewCustomer: [01]": f"isNewCustomer: {p['isNewCustomer']}",
            r"segment: '[^']+'": f"segment: '{p['segment']}'",
            r"regionName: '[^']+'": f"regionName: '{p['regionName']}'",
        }
        for pat, repl in replacements.items():
            block, n = re.subn(pat, repl, block, count=1)
            if n == 0:
                raise ValueError(f"Field {pat} not found in profile {name}")
        text = text[: m.start()] + block + text[m.end() :]

    ts_path.write_text(text, encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=None, help="train_long.csv or train_wide_with_lags.csv")
    ap.add_argument("--out-json", type=Path, default=OUT_JSON)
    ap.add_argument("--apply", action="store_true", help="Patch mobile + frontend profile TS files")
    args = ap.parse_args()

    data = args.data
    if data is None:
        data = LONG_CSV if LONG_CSV.exists() else WIDE_CSV

    if not data.exists():
        raise SystemExit(
            f"No dataset at {data}. Run: python backend/scripts/build_train_long.py"
        )

    print(f"Loading users from {data} …")
    users = load_users(data)
    print(f"  users={len(users)}")

    profiles = build_profiles(users)
    args.out_json.parent.mkdir(parents=True, exist_ok=True)
    args.out_json.write_text(json.dumps(profiles, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Saved: {args.out_json}\n")
    for p in profiles:
        print(
            f"  {p['name']} (q{p['quantile']}): age={p['age']}, "
            f"income={p['monthlyIncome']}, balance={p['balance']}, "
            f"segment={p['segment']}, region={p['regionName']}"
        )

    if args.apply:
        mobile = ROOT / "mobile" / "src" / "config" / "profiles.ts"
        frontend = ROOT / "frontend" / "src" / "components" / "features" / "advertising" / "ClientSelector.tsx"
        apply_to_ts(profiles, mobile)
        apply_to_ts(profiles, frontend)
        print("\nApplied to mobile + frontend profile files.")


if __name__ == "__main__":
    main()
