"""
Экспорт BitNet модели в ONNX для Android / on-device инференса.

Использование:
    python -m src.models.export.onnx_export

ONNX-модель может быть сконвертирована в TFLite через onnx2tf
или использована напрямую через ONNX Runtime на Android.
"""

import sys
from pathlib import Path

import torch
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.models.bitnet import BitNetRecommender


def export_to_onnx(
    checkpoint_path: Path | None = None,
    output_path: Path | None = None,
    input_dim: int = 32,
    num_products: int = 36,
    hidden_dim: int = 256,
    num_layers: int = 3,
) -> Path:
    """Экспорт модели в ONNX формат."""
    model = BitNetRecommender(
        input_dim=input_dim,
        num_products=num_products,
        hidden_dim=hidden_dim,
        num_layers=num_layers,
    )

    ckpt_dir = PROJECT_ROOT / "backend" / "models" / "checkpoints"
    ckpt = checkpoint_path or (ckpt_dir / "bitnet_best.pt")
    if ckpt.exists():
        model.load_state_dict(torch.load(ckpt, map_location="cpu", weights_only=True))
        print(f"Loaded checkpoint: {ckpt}")
    else:
        print("No checkpoint found, exporting random model")

    model.eval()

    # Фикс квантованных операций для ONNX: на время экспорта отключаем STE
    # и подменяем BitLinear на обычный Linear с зафиксированными весами
    _quantize_for_export(model)

    dummy = torch.randn(1, input_dim)
    export_dir = PROJECT_ROOT / "backend" / "models" / "export"
    export_dir.mkdir(parents=True, exist_ok=True)
    out = output_path or (export_dir / "bitnet_recommender.onnx")

    torch.onnx.export(
        model,
        dummy,
        str(out),
        input_names=["user_features"],
        output_names=["product_scores"],
        dynamic_axes={
            "user_features": {0: "batch"},
            "product_scores": {0: "batch"},
        },
        opset_version=17,
    )

    # Восстановить квантованные слои (reload)
    print(f"ONNX exported: {out}")
    print(f"Size: {out.stat().st_size / 1024:.1f} KB")

    # Метаданные
    meta = {
        "input_dim": input_dim,
        "num_products": num_products,
        "hidden_dim": hidden_dim,
        "num_layers": num_layers,
        "framework": "ONNX",
        "runtime": "onnxruntime-android / TFLite (via onnx2tf)",
    }
    with open(export_dir / "model_meta.json", "w") as f:
        import json
        json.dump(meta, f, indent=2)

    return out


def _quantize_for_export(model: BitNetRecommender):
    """Заморозка квантованных весов перед ONNX-экспортом."""
    from src.models.bitnet import BitLinear158, weight_quant_b158

    for module in model.modules():
        if isinstance(module, BitLinear158):
            with torch.no_grad():
                w = weight_quant_b158(module.weight)
                module.weight.data = w


if __name__ == "__main__":
    export_to_onnx()
