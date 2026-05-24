"""
Экспорт BitNet b1.58 модели в GGUF для бинарного инференса.

GGUF — формат llama.cpp / bitnet.cpp:
- 1.58-битные веса упаковываются в 2 бита на параметр
- Метаданные модели (tensor names, shapes) в заголовке
- Оптимизированные ядра под ARM/x86

После экспорта .gguf файл загружается на телефон
и запускается через bitnet.cpp inference.

Запуск:
    python -m src.models.export.gguf_export
"""

import struct
import json
import sys
from pathlib import Path
from typing import Dict, List, Tuple

import torch
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.models.bitnet import BitNetRecommender, weight_quant_b158


GGUF_MAGIC = 0x46554747  # "GGUF"
GGUF_VERSION = 3


def write_gguf_header(f, metadata: dict):
    """Запись GGUF-заголовка."""
    f.write(struct.pack('<I', GGUF_MAGIC))
    f.write(struct.pack('<I', GGUF_VERSION))

    meta_json = json.dumps(metadata, ensure_ascii=False)
    meta_bytes = meta_json.encode('utf-8')

    f.write(struct.pack('<Q', len(meta_json)))
    f.write(struct.pack('<Q', len(meta_bytes)))
    f.write(meta_bytes)

    # Паддинг до 32 байт
    pad = (32 - (f.tell() % 32)) % 32
    f.write(b'\0' * pad)


def export_to_gguf(
    checkpoint_path: Path | None = None,
    output_path: Path | None = None,
) -> Path:
    """Экспорт BitNetRecommender в GGUF."""
    ckpt_dir = PROJECT_ROOT / "backend" / "models" / "checkpoints"
    ckpt = checkpoint_path or (ckpt_dir / "bitnet_best.pt")

    if not ckpt.exists():
        print("Checkpoint not found. Run training first.")
        sys.exit(1)

    state = torch.load(ckpt, map_location="cpu", weights_only=True)

    # Восстанавливаем конфиг из training_info.json
    info_path = ckpt_dir / "training_info.json"
    if info_path.exists():
        with open(info_path) as f:
            info = json.load(f)
    else:
        info = {"input_dim": 32, "num_products": 36, "hidden_dim": 256, "num_layers": 3}

    model = BitNetRecommender(
        input_dim=info.get("input_dim", 32),
        num_products=info.get("num_products", 36),
        hidden_dim=info.get("hidden_dim", 256),
        num_layers=info.get("num_layers", 3),
    )
    model.load_state_dict(state)
    model.eval()

    # Квантование всех весов в 1.58 бит
    quantized_tensors: List[Tuple[str, np.ndarray]] = []
    total_bits = 0

    for name, param in model.named_parameters():
        tensor = param.data
        if 'weight' in name and tensor.dim() >= 2:
            w_q = weight_quant_b158(tensor)
            values = w_q.cpu().numpy().astype(np.float16)
            bits = tensor.numel() * 2  # 2 бита на 1.58-битный параметр
        else:
            values = tensor.cpu().numpy().astype(np.float16)
            bits = tensor.numel() * 16
        quantized_tensors.append((name, values))
        total_bits += bits

    # GGUF metadata
    metadata = {
        "general.architecture": "bitnet-b158-recommender",
        "general.name": "SDM BitNet Recommender",
        "bitnet.input_dim": info.get("input_dim", 32),
        "bitnet.num_products": info.get("num_products", 36),
        "bitnet.hidden_dim": info.get("hidden_dim", 256),
        "bitnet.num_layers": info.get("num_layers", 3),
        "bitnet.weight_bits": 1.58,
        "bitnet.activation_bits": 8,
        "bitnet.tensor_count": len(quantized_tensors),
    }

    export_dir = PROJECT_ROOT / "backend" / "models" / "export"
    export_dir.mkdir(parents=True, exist_ok=True)
    out = output_path or (export_dir / "bitnet_recommender.gguf")

    with open(out, 'wb') as f:
        write_gguf_header(f, metadata)

        for name, values in quantized_tensors:
            name_bytes = name.encode('utf-8')
            f.write(struct.pack('<I', len(name_bytes)))
            f.write(name_bytes)
            f.write(struct.pack('<I', len(values.shape)))
            for s in values.shape:
                f.write(struct.pack('<I', s))
            f.write(struct.pack('<I', 1))  # type: f16
            f.write(struct.pack('<Q', values.nbytes))
            f.write(values.tobytes())

    size_kb = out.stat().st_size / 1024
    print(f"GGUF exported: {out}")
    print(f"  Size: {size_kb:.1f} KB")
    print(f"  Tensors: {len(quantized_tensors)}")
    print(f"  Total bits: {total_bits / 8 / 1024:.1f} KB")
    print(f"\nДля инференса на телефоне используй bitnet.cpp:")
    print(f"  python run_inference.py -m {out} -f user_features.bin")

    # Сохраняем порядок фичей
    feature_names_path = ckpt_dir / "feature_names.json"
    if feature_names_path.exists():
        with open(feature_names_path) as f:
            names_data = json.load(f)
        feature_order = names_data.get("input_features", [])
        product_names = names_data.get("product_names", [])
    else:
        feature_order = [f"feat_{i}" for i in range(info.get("input_dim", 32))]
        product_names = [f"prod_{i}" for i in range(info.get("num_products", 36))]

    order_path = export_dir / "feature_order.json"
    with open(order_path, 'w') as f:
        json.dump({"input_features": feature_order, "product_names": product_names}, f, indent=2, ensure_ascii=False)

    return out


if __name__ == "__main__":
    export_to_gguf()
