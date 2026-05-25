import pandas as pd
import numpy as np

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


RANDOM_SEED = 52
rng = np.random.default_rng(RANDOM_SEED)


def get_result_cols(path):
    df = pd.read_csv(path)

    cols = df.columns.tolist()

    cols.remove("income")

    cols.append("income_generated")
    cols.append("income_filled")


    return cols


def make_age_group(age):
    if pd.isna(age):
        return 'UNKNOWN'
    if age < 18:
        return 'UNDER_18'
    if age <= 24:
        return '18_24'
    if age <= 34:
        return '25_34'
    if age <= 44:
        return '35_44'
    if age <= 54:
        return '45_54'
    if age <= 64:
        return '55_64'
    return '65_PLUS'


def prepare_income_features(df):
    df = df.copy()

    # normalize sex (drop 3 values)
    df = df.dropna(subset=['sex'])

    # normalize seniority_months (drop 2 negative values)
    df["seniority_months"] = pd.to_numeric(df["seniority_months"], errors='coerce')
    df.loc[df["seniority_months"] < 0, "seniority_months"] = np.nan
    df = df.dropna(subset=["seniority_months"])
    df["seniority_months"] = df["seniority_months"].round().astype('Int64')

    # normalize age (drop values not in [14, 95])
    df["age"] = pd.to_numeric(df["age"], errors='coerce')
    df.loc[
        df['age'] < 14 | (df['age'] > 95),
        "age" 
    ] = np.nan
    df = df.dropna(subset=["age"])
    df["age"] = df["age"].round().astype('Int64')

    # normalize segment
    df['segment'] = df['segment'].fillna('UNKNOWN')

    PREFIXES = ['dep-', 'card-', 'rko-', 'loan-', 'srv-', 'biz-']

    product_cols = [col for col in df.columns if col.startswith(tuple(PREFIXES))]

    dep_cols = [col for col in product_cols if col.startswith('dep-')]
    card_cols = [col for col in product_cols if col.startswith('card-')]
    rko_cols = [col for col in product_cols if col.startswith('rko-')]
    loan_cols = [col for col in product_cols if col.startswith('loan-')]
    srv_cols = [col for col in product_cols if col.startswith('srv-')]
    biz_cols = [col for col in product_cols if col.startswith('biz-')]

    # create age groups
    df["age_group"] = df["age"].apply(make_age_group)

    # agregate product features
    df["products_count"] = df[product_cols].sum(axis=1)

    df["dep_count"] = df[dep_cols].sum(axis=1) if dep_cols else 0
    df["card_count"] = df[card_cols].sum(axis=1) if card_cols else 0
    df["rko_count"] = df[rko_cols].sum(axis=1) if rko_cols else 0
    df["loan_count"] = df[loan_cols].sum(axis=1) if loan_cols else 0
    df["srv_count"] = df[srv_cols].sum(axis=1) if srv_cols else 0
    df["biz_count"] = df[biz_cols].sum(axis=1) if biz_cols else 0

    df["has_dep"] = (df["dep_count"] > 0).astype(int)
    df["has_card"] = (df["card_count"] > 0).astype(int)
    df["has_rko"] = (df["rko_count"] > 0).astype(int)
    df["has_loan"] = (df["loan_count"] > 0).astype(int)
    df["has_srv"] = (df["srv_count"] > 0).astype(int)
    df["has_biz"] = (df["biz_count"] > 0).astype(int)

    # create product profile:
    def product_profile(row):
        if row["products_count"] == 0:
            return 'NO_PRODUCTS'
        
        profile = []

        if row["has_dep"]:
            profile.append('DEP')
        if row["has_card"]:
            profile.append('CARD')
        if row["has_rko"]:
            profile.append('RKO')
        if row["has_loan"]:
            profile.append('LOAN')
        if row["has_srv"]:
            profile.append('SRV')
        if row["has_biz"]:
            profile.append('BIZ')

        return "_".join(profile)

    df["product_profile"] = df.apply(product_profile, axis=1)

    return df, product_cols


def generate_income_from_existing_data(path):
    df = pd.read_csv(path)

    # prepare features
    df, product_cols = prepare_income_features(df)

    train_mask = df["income"].notna() & (df["income"] > 0)

    train_df = df.loc[train_mask].copy()

    # emissons limit
    lower = train_df["income"].quantile(0.005)
    upper = train_df["income"].quantile(0.900)

    train_df = train_df[
        (train_df["income"] >= lower) & 
        (train_df["income"] <= upper)
    ].copy()

    y_train = np.log1p(train_df["income"])

    # categorical features
    cat_features = [
        "sex", 
        "segment", 
        "age_group", 
        "product_profile"
    ]

    # numerical features
    num_features = [
        "age",
        "is_new_customer",
        "seniority_months",
        "products_count",
        "dep_count",
        "card_count",
        "rko_count",
        "loan_count",
        "srv_count",
        "biz_count",
        "has_dep",
        "has_card",
        "has_rko",
        "has_loan",
        "has_srv",
        "has_biz"
    ]

    # product flags
    num_features = num_features + product_cols

    X_train = train_df[cat_features + num_features]
    X_all = df[cat_features + num_features]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                'cat', 
                OneHotEncoder(
                    handle_unknown='ignore',
                    sparse_output=False
                ), 
                cat_features
            )
        ],
        remainder='passthrough',
        sparse_threshold=0
    )

    model = HistGradientBoostingRegressor(
        max_iter=1000,
        learning_rate=0.05,
        max_leaf_nodes=31,
        l2_regularization=0.1,
        random_state=RANDOM_SEED
    )

    pipeline = Pipeline(
        steps=[
            ('preprocessor', preprocessor),
            ('model', model)
        ]
    )

    pipeline.fit(X_train, y_train)

    # predict missing income values
    pred_train = pipeline.predict(X_train)
    pred_all = pipeline.predict(X_all)

    train_df["income_residual"] = y_train - pred_train

    # residual bucket
    train_df["residual_group"] = (
        train_df["segment"].astype(str) + "_" +
        train_df["age_group"].astype(str) + "_" +
        train_df["product_profile"].astype(str)
    )

    df["residual_group"] = (
        df["segment"].astype(str) + "_" +
        df["age_group"].astype(str) + "_" +
        df["product_profile"].astype(str)
    )

    global_residuals = train_df["income_residual"].values

    residuals_by_group = {
        group: values["income_residual"].values
        for group, values in train_df.groupby("residual_group")
        if len(values) >= 30
    }

    residuals_by_segment_age = {
        group: values["income_residual"].values
        for group, values in train_df.groupby(["segment", "age_group"])
        if len(values) >= 30
    }

    synthetic_log_incomes = []

    for pos, (_, row) in enumerate(df.iterrows()):
        base_prediction = pred_all[pos]
        group = row["residual_group"]

        if group in residuals_by_group:
            residual_pool = residuals_by_group[group]
        else:
            fallback_key = (row["segment"], row["age_group"])
            residual_pool = residuals_by_segment_age.get(fallback_key, global_residuals)

        sampled_residual = rng.choice(residual_pool)

        extra_noise = rng.normal(0, 0.03)

        synthetic_log_incomes.append(
            base_prediction + sampled_residual + extra_noise
        )

    income_generated = np.expm1(synthetic_log_incomes)
    income_generated = np.clip(income_generated, lower, upper)

    df["income_generated"] = income_generated

    df["income_filled"] = df["income"]

    missing_mask = df["income_filled"].isna() | (df["income_filled"] <= 0)
    df.loc[missing_mask, "income_filled"] = df.loc[missing_mask, "income_generated"]

    df["income_was_generated"] = missing_mask.astype(int)

    # drop intermediate columns
    cols = get_result_cols(path)
    df = df[cols]


    return df, pipeline


def main():
    path = "backend/datasets/raw/train_wide.csv"

    df_income, income_model = generate_income_from_existing_data(path)

    df_income.to_csv("backend/datasets/processed/v1/train_wide_with_income.csv", index=False)


if __name__ == "__main__":
    main()