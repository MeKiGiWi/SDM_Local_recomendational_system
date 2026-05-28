"""
Export trained CatBoost (.cbm) for offline Android inference (native applier).

No logistic surrogate — the same artifact as on the server.

  python backend/scripts/export_catboost_mobile.py

Outputs:
  mobile/assets/model/catboost_pointwise.cbm
  mobile/assets/model/catboost_model.json   (metadata)
  frontend/public/model/...                 (same copies)
"""

from __future__ import annotations

import hashlib
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from src.models.catboost_pointwise import CatBoostPointwiseRecommender  # noqa: E402
from src.models.synthetic_from_profile import write_mobile_typescript  # noqa: E402
from src.pipeline.loaders.custom_wide import export_feature_order  # noqa: E402

FRONTEND_MODEL = ROOT / "frontend" / "public" / "model"
MOBILE_MODEL = ROOT / "mobile" / "assets" / "model"
PKL = BACKEND / "models" / "export" / "catboost_pointwise_holdout.pkl"
CBM_NAME = "catboost_pointwise.cbm"
META_NAME = "catboost_model.json"


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def main() -> None:
    if not PKL.exists():
        raise SystemExit(f"Missing trained model: {PKL}")

    rec = CatBoostPointwiseRecommender(PKL)
    cat_idx = set(rec._cat_idx)
    numeric_features = [rec.feature_names[i] for i in range(len(rec.feature_names)) if i not in cat_idx]
    categorical_features = [rec.feature_names[i] for i in rec._cat_idx]

    FRONTEND_MODEL.mkdir(parents=True, exist_ok=True)
    MOBILE_MODEL.mkdir(parents=True, exist_ok=True)

    cbm_src = PKL.with_suffix(".cbm")
    rec.model.save_model(str(cbm_src))
    print(f"Exported CBM: {cbm_src} ({cbm_src.stat().st_size / 1e6:.2f} MB)")

    meta = {
        "version": 3,
        "inference": "catboost_cbm_native",
        "model_file": CBM_NAME,
        "products": rec.products,
        "feature_names": rec.feature_names,
        "numeric_features": numeric_features,
        "categorical_features": categorical_features,
        "source_pkl": str(PKL.relative_to(ROOT)).replace("\\", "/"),
    }

    for dest in (FRONTEND_MODEL, MOBILE_MODEL):
        shutil.copy2(cbm_src, dest / CBM_NAME)
        (dest / META_NAME).write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"  wrote {dest / CBM_NAME}")
        print(f"  wrote {dest / META_NAME}")

    export_feature_order(rec.products, FRONTEND_MODEL / "feature_order.json")
    shutil.copy2(FRONTEND_MODEL / "feature_order.json", MOBILE_MODEL / "feature_order.json")

    manifest = {
        "inference": "catboost_cbm_native",
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
                "bytes": (MOBILE_MODEL / META_NAME).stat().st_size,
                "required": True,
            },
        },
        "train_hint": "python backend/scripts/train_catboost_pointwise.py && python backend/scripts/export_catboost_mobile.py",
    }
    for dest in (FRONTEND_MODEL, MOBILE_MODEL):
        (dest / "model_manifest.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    # Remove legacy surrogate bundle if present
    for dest in (FRONTEND_MODEL, MOBILE_MODEL):
        legacy = dest / "catboost_mobile.json"
        if legacy.exists():
            legacy.unlink()
            print(f"  removed legacy {legacy}")

    ts_path = write_mobile_typescript()
    print(f"  wrote {ts_path}")

    print("Done. Rebuild APK: node scripts/build-apk.mjs")


if __name__ == "__main__":
    main()
