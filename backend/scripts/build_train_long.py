"""
Собрать train_long (pointwise: одна строка = пользователь × продукт).

Логика совпадает с Colab / train_catboost_pointwise.build_pointwise_frame.

Вход:  backend/datasets/raw/train_wide_with_lags.csv
Выход: backend/datasets/processed/train_long.csv  (по умолчанию)

Запуск из корня репозитория:
  python backend/scripts/build_train_long.py
  python backend/scripts/build_train_long.py --sample-frac 0.1
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from src.models.catboost_pointwise import PRODUCTS, synthetic_from_row  # noqa: E402

DATA_CSV = ROOT / "backend" / "datasets" / "raw" / "train_wide_with_lags.csv"
OUT_CSV = ROOT / "backend" / "datasets" / "processed" / "train_long.csv"
TARGET_HORIZON = "90"


def wide_to_long(df: pd.DataFrame, products: list[str]) -> pd.DataFrame:
    rows: list[dict] = []
    target_cols = {p: f"target_{p}_{TARGET_HORIZON}" for p in products}

    for _, row in df.iterrows():
        syn = synthetic_from_row(row)
        income = float(row.get("income_filled", row.get("income", 50000)))
        base = {
            "user_id": row.get("user_id"),
            "sex": str(row["sex"]),
            "age": float(row["age"]),
            "is_new_customer": str(int(row["is_new_customer"])),
            "seniority_months": float(row["seniority_months"]),
            "region_name": str(row["region_name"]),
            "segment": str(row["segment"]),
            "income_at_lag": income,
            **syn,
        }
        for p in products:
            r = dict(base)
            for op in products:
                r[f"own_{op}"] = float(row[op] > 0) if op in row.index else 0.0
            r["product"] = p
            tcol = target_cols[p]
            r["target"] = int(row[tcol] > 0) if tcol in row.index else int(row[p] > 0)
            rows.append(r)

    return pd.DataFrame(rows)


def main() -> None:
    p = argparse.ArgumentParser(description="Build train_long from train_wide_with_lags")
    p.add_argument("--data", type=Path, default=DATA_CSV)
    p.add_argument("--out", type=Path, default=OUT_CSV)
    p.add_argument("--sample-frac", type=float, default=1.0)
    args = p.parse_args()

    if not args.data.exists():
        raise SystemExit(f"Dataset not found: {args.data}")

    print(f"Loading {args.data} …")
    df = pd.read_csv(args.data, low_memory=False)
    if args.sample_frac < 1.0:
        df = df.sample(frac=args.sample_frac, random_state=42).reset_index(drop=True)
    print(f"  wide rows={len(df)}")

    products = [p for p in PRODUCTS if p in df.columns]
    long_df = wide_to_long(df, products)
    print(f"  long rows={len(long_df)} ({len(products)} products / user)")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    long_df.to_csv(args.out, index=False)
    print(f"Saved: {args.out}")


if __name__ == "__main__":
    main()
