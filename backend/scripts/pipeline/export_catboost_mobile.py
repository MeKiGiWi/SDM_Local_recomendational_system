"""
Export trained CatBoost artifacts for mobile native inference and browser inference.

Outputs:
  mobile/assets/model/catboost_pointwise.cbm
  mobile/assets/model/catboost_model.json
  frontend/public/model/catboost_pointwise.cbm
  frontend/public/model/catboost_model.json
  frontend/public/model/catboost_model_full.json
  frontend/public/model/catboost_web_runtime.json
  frontend/public/model/catboost_cat_features_hashes.json
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import shutil
import sys
import tempfile
from pathlib import Path
from types import ModuleType

import pandas as pd
from catboost import Pool

ROOT = Path(__file__).resolve().parents[3]
BACKEND = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BACKEND))

from src.models.catboost_pointwise import CatBoostPointwiseRecommender  # noqa: E402
from src.models.synthetic_from_profile import write_typescript_targets  # noqa: E402
from src.pipeline.loaders.custom_wide import export_feature_order  # noqa: E402

FRONTEND_MODEL = ROOT / "frontend" / "public" / "model"
MOBILE_MODEL = ROOT / "mobile" / "assets" / "model"
PKL_CANDIDATES = [
    BACKEND / "models" / "export" / "catboost_pointwise_holdout.pkl",
    ROOT / "catboost_pointwise_holdout_old_good.pkl",
    ROOT / "catboost_pointwise_holdout.pkl",
]
CBM_NAME = "catboost_pointwise.cbm"
META_NAME = "catboost_model.json"
FULL_JSON_NAME = "catboost_model_full.json"
WEB_RUNTIME_NAME = "catboost_web_runtime.json"
CAT_HASHES_NAME = "catboost_cat_features_hashes.json"
DATA_CANDIDATES = [
    ROOT / "train_wide_filled_lags.csv",
    ROOT / "backend" / "datasets" / "raw" / "train_wide_with_lags.csv",
    ROOT / "backend" / "datasets" / "raw" / "train_wide_new.csv",
    ROOT / "backend" / "datasets" / "raw" / "train_wide.csv",
]


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def _find_dataset() -> Path | None:
    for path in DATA_CANDIDATES:
        if path.exists():
            return path
    return None


def _load_category_pool(products: list[str], feature_names: list[str]) -> Pool:
    dataset = _find_dataset()
    if dataset is None:
        raise SystemExit("Missing dataset for web export category hashes")

    cols = ["sex", "is_new_customer", "region_name", "segment"]
    df = pd.read_csv(dataset, usecols=cols, low_memory=False)
    regions = sorted(df["region_name"].dropna().astype(str).unique().tolist()) or ["MADRID"]
    sexes = sorted(df["sex"].dropna().astype(str).unique().tolist()) or ["M", "F"]
    segments = sorted(df["segment"].dropna().astype(str).unique().tolist()) or ["INDIVIDUALS", "VIP", "STUDENTS"]
    new_flags = sorted({str(int(float(v))) for v in df["is_new_customer"].dropna().tolist()}) or ["0", "1"]

    rows: list[dict[str, object]] = []
    for product in products:
        for region in regions:
            for sex in sexes:
                for segment in segments:
                    for is_new in new_flags:
                        row: dict[str, object] = {
                            "sex": sex,
                            "age": 42.0,
                            "is_new_customer": is_new,
                            "seniority_months": 60.0,
                            "region_name": region,
                            "segment": segment,
                            "income_at_lag": 120000.0,
                            "synthetic_activity_score": 1.0,
                            "synthetic_operations_cnt_30d": 10.0,
                            "synthetic_active_days_30d": 8.0,
                            "synthetic_expenses_30d": 50000.0,
                            "synthetic_income_30d": 120000.0,
                            "synthetic_turnover_30d": 130000.0,
                            "synthetic_avg_operation_size_30d": 13000.0,
                            "synthetic_financial_intensity": 0.7,
                            "synthetic_inflow_outflow_ratio": 1.4,
                            "synthetic_credit_pressure": 0.3,
                            "synthetic_savings_capacity": 0.9,
                            "synthetic_credit_capacity": 0.8,
                            "synthetic_business_intensity": 0.08,
                            "product": product,
                        }
                        for own_product in products:
                            row[f"own_{own_product}"] = 1.0 if own_product == product else 0.0
                        rows.append(row)

    frame = pd.DataFrame(rows)[feature_names]
    return Pool(frame, cat_features=["sex", "is_new_customer", "region_name", "segment", "product"])


def _load_module(path: Path) -> ModuleType:
    spec = importlib.util.spec_from_file_location(path.stem, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot import generated module: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _serialize(obj):
    if isinstance(obj, (str, int, float, bool)) or obj is None:
        if isinstance(obj, int) and abs(obj) > 9_007_199_254_740_991:
            return str(obj)
        return obj
    if isinstance(obj, dict):
        return {str(k): _serialize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_serialize(v) for v in obj]
    if hasattr(obj, "__dict__"):
        return {k: _serialize(v) for k, v in obj.__dict__.items()}
    raise TypeError(f"Unsupported type during serialization: {type(obj)!r}")


def _build_web_runtime(cbm_src: Path, rec: CatBoostPointwiseRecommender) -> tuple[dict, dict[str, int]]:
    with tempfile.TemporaryDirectory() as tmpdir:
        py_path = Path(tmpdir) / "catboost_web_applier.py"
        rec.model.save_model(str(py_path), format="python", pool=_load_category_pool(rec.products, rec.feature_names))
        module = _load_module(py_path)
        exported_model = module.catboost_model
        model_ctrs = getattr(exported_model, "model_ctrs", None)

        runtime = {
            "float_features_index": exported_model.float_features_index,
            "float_feature_count": exported_model.float_feature_count,
            "cat_feature_count": exported_model.cat_feature_count,
            "binary_feature_count": exported_model.binary_feature_count,
            "tree_count": exported_model.tree_count,
            "float_feature_borders": exported_model.float_feature_borders,
            "tree_depth": exported_model.tree_depth,
            "tree_split_border": exported_model.tree_split_border,
            "tree_split_feature_index": exported_model.tree_split_feature_index,
            "tree_split_xor_mask": exported_model.tree_split_xor_mask,
            "cat_features_index": exported_model.cat_features_index,
            "one_hot_cat_feature_index": exported_model.one_hot_cat_feature_index,
            "one_hot_hash_values": exported_model.one_hot_hash_values,
            "ctr_feature_borders": exported_model.ctr_feature_borders,
            "leaf_values": exported_model.leaf_values,
            "scale": exported_model.scale,
            "biases": exported_model.biases,
            "dimension": exported_model.dimension,
            "model_ctrs": _serialize(model_ctrs) if model_ctrs is not None else None,
            "source_model_file": CBM_NAME,
            "source_full_json": FULL_JSON_NAME,
        }
        cat_hashes = {str(k): int(v) for k, v in module.cat_features_hashes.items()}
        return runtime, cat_hashes


def main() -> None:
    pkl_source = next((path for path in PKL_CANDIDATES if path.exists()), None)
    model_source = pkl_source if pkl_source is not None else FRONTEND_MODEL / CBM_NAME
    if not model_source.exists():
        raise SystemExit(f"Missing trained model candidates: {PKL_CANDIDATES} and fallback CBM: {FRONTEND_MODEL / CBM_NAME}")

    rec = CatBoostPointwiseRecommender(model_source)
    cat_idx = set(rec._cat_idx)
    numeric_features = [rec.feature_names[i] for i in range(len(rec.feature_names)) if i not in cat_idx]
    categorical_features = [rec.feature_names[i] for i in rec._cat_idx]

    FRONTEND_MODEL.mkdir(parents=True, exist_ok=True)
    MOBILE_MODEL.mkdir(parents=True, exist_ok=True)

    cbm_src = model_source if model_source.suffix == ".cbm" else model_source.with_suffix(".cbm")
    if model_source.suffix != ".cbm":
        rec.model.save_model(str(cbm_src))
    full_json_src = FRONTEND_MODEL / FULL_JSON_NAME
    rec.model.save_model(str(full_json_src), format="json")
    print(f"Exported CBM: {cbm_src} ({cbm_src.stat().st_size / 1e6:.2f} MB)")
    print(f"Exported full JSON: {full_json_src} ({full_json_src.stat().st_size / 1e6:.2f} MB)")

    runtime, cat_hashes = _build_web_runtime(cbm_src, rec)

    web_meta = {
        "version": 4,
        "inference": "catboost_browser_runtime",
        "model_file": CBM_NAME,
        "web_runtime_file": WEB_RUNTIME_NAME,
        "web_full_json_file": FULL_JSON_NAME,
        "cat_feature_hashes_file": CAT_HASHES_NAME,
        "products": rec.products,
        "feature_names": rec.feature_names,
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "source_pkl": str(pkl_source.relative_to(ROOT)).replace("\\", "/") if pkl_source is not None else None,
    }
    mobile_meta = {
        **web_meta,
        "inference": "catboost_cbm_native",
    }

    if cbm_src.resolve() != (FRONTEND_MODEL / CBM_NAME).resolve():
        shutil.copy2(cbm_src, FRONTEND_MODEL / CBM_NAME)
    shutil.copy2(cbm_src, MOBILE_MODEL / CBM_NAME)
    runtime_json = json.dumps(runtime, ensure_ascii=False)
    hashes_json = json.dumps(cat_hashes, ensure_ascii=False)
    for dest in (FRONTEND_MODEL, MOBILE_MODEL):
        (dest / WEB_RUNTIME_NAME).write_text(runtime_json, encoding="utf-8")
        (dest / CAT_HASHES_NAME).write_text(hashes_json, encoding="utf-8")

    (FRONTEND_MODEL / META_NAME).write_text(json.dumps(web_meta, indent=2, ensure_ascii=False), encoding="utf-8")
    (MOBILE_MODEL / META_NAME).write_text(json.dumps(mobile_meta, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  wrote {FRONTEND_MODEL / META_NAME}")
    print(f"  wrote {MOBILE_MODEL / META_NAME}")

    export_feature_order(rec.products, FRONTEND_MODEL / "feature_order.json")
    shutil.copy2(FRONTEND_MODEL / "feature_order.json", MOBILE_MODEL / "feature_order.json")

    manifest = {
        "inference": "catboost_browser_runtime",
        "targets": {
            "web": "frontend/public/model",
            "expo_bundle": "mobile/assets/model",
        },
        "files": {
            CBM_NAME: {
                "bytes": (MOBILE_MODEL / CBM_NAME).stat().st_size,
                "sha256_16": _sha256(MOBILE_MODEL / CBM_NAME),
                "required": True,
            },
            META_NAME: {
                "bytes": (FRONTEND_MODEL / META_NAME).stat().st_size,
                "required": True,
            },
            FULL_JSON_NAME: {
                "bytes": (FRONTEND_MODEL / FULL_JSON_NAME).stat().st_size,
                "required": True,
            },
            WEB_RUNTIME_NAME: {
                "bytes": (FRONTEND_MODEL / WEB_RUNTIME_NAME).stat().st_size,
                "required": True,
            },
            CAT_HASHES_NAME: {
                "bytes": (FRONTEND_MODEL / CAT_HASHES_NAME).stat().st_size,
                "required": True,
            },
        },
        "train_hint": "python backend/scripts/pipeline/train_catboost_pointwise.py && python backend/scripts/pipeline/export_catboost_mobile.py",
    }
    for dest in (FRONTEND_MODEL, MOBILE_MODEL):
        (dest / "model_manifest.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    for dest in (FRONTEND_MODEL, MOBILE_MODEL):
        legacy = dest / "catboost_mobile.json"
        if legacy.exists():
            legacy.unlink()
            print(f"  removed legacy {legacy}")

    for path in write_typescript_targets():
        print(f"  wrote {path}")

    print("Done. Rebuild web/mobile bundles after export.")


if __name__ == "__main__":
    main()
