"""
Загрузчик кастомного датасета (wide format).

Формат: train_wide.csv
  - Фичи: user_id, sex, age, is_new_customer, seniority_months, income, segment
  - Таргет: 22 продукта (dep-7, card-2, ... card-3)
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Tuple, Optional

DATA_DIR = Path(__file__).parent.parent.parent.parent / "datasets" / "raw"

FEATURE_COLS = ["age", "seniority_months", "income", "is_new_customer"]
CAT_COLS = {"sex": ["F", "M"], "segment": ["INDIVIDUALS", "VIP", "STUDENTS"]}


def load_custom_wide(
    sample_frac: float = 1.0,
    random_state: int = 42,
    data_path: Optional[Path] = None,
    max_features: int = 32,
    max_products: int = 36,
) -> Tuple[np.ndarray, np.ndarray, list, list]:
    path = data_path or DATA_DIR / "train_wide.csv"
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")

    df = pd.read_csv(path, low_memory=False)
    df = df.sample(frac=sample_frac, random_state=random_state)
    df = df.reset_index(drop=True)

    # --- Features ---
    X_parts = []

    # Числовые фичи
    for c in FEATURE_COLS:
        col = pd.to_numeric(df[c], errors="coerce").fillna(0)
        X_parts.append(col.values.astype(np.float32))

    # Sex: F→0, M→1
    sex_enc = df["sex"].map({"F": 0.0, "M": 1.0}).fillna(0.0).values.astype(np.float32)
    X_parts.append(sex_enc)

    # Segment: one-hot
    for val in CAT_COLS["segment"]:
        X_parts.append((df["segment"] == val).astype(np.float32).values)

    X_raw = np.column_stack(X_parts)

    # Нормализация
    X_mean = X_raw.mean(axis=0)
    X_std = X_raw.std(axis=0) + 1e-8
    X = (X_raw - X_mean) / X_std
    X = np.nan_to_num(X)

    # Пад или обрезка до max_features
    if X.shape[1] < max_features:
        X = np.pad(X, ((0, 0), (0, max_features - X.shape[1])))
    else:
        X = X[:, :max_features]

    feature_names = FEATURE_COLS + ["sex_enc"] + [f"segment_{v}" for v in CAT_COLS["segment"]]
    feature_names = feature_names[:max_features]

    # --- Target: product columns ---
    product_cols = [c for c in df.columns if c not in ["user_id", "sex", "age", "is_new_customer", "seniority_months", "income", "segment"]]
    y_raw = df[product_cols].fillna(0).values.astype(np.float32)

    # Пад или обрезка до max_products
    y = np.zeros((y_raw.shape[0], max_products), dtype=np.float32)
    n_prod = min(y_raw.shape[1], max_products)
    y[:, :n_prod] = y_raw[:, :n_prod]

    return X, y, feature_names, product_cols[:max_products]


if __name__ == "__main__":
    X, y, feat_names, prod_names = load_custom_wide(sample_frac=0.01)
    print(f"Custom dataset: X={X.shape}, y={y.shape}")
    print(f"  Features ({len(feat_names)}): {feat_names}")
    print(f"  Products ({len(prod_names)}): {prod_names}")
    print(f"  Mean products/user: {y.sum(axis=1).mean():.1f}")
