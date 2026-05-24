"""
Скрипт обучения BitNet-модели на сервере.

Запуск:
    python -m src.models.train --epochs 20 --batch-size 256 --lr 1e-3 --sample-frac 0.5

Результаты:
  - models/checkpoints/bitnet_best.pt    — чекпоинт
  - models/checkpoints/training_info.json
  - frontend/public/model/bitnet_weights.json  — веса для браузера
  - frontend/public/model/feature_order.json   — маппинг индексов
  - frontend/public/model/normalization.json
"""

import argparse
import json
import sys
from pathlib import Path

import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_MODEL_DIR = PROJECT_ROOT / "frontend" / "public" / "model"
sys.path.insert(0, str(PROJECT_ROOT))

from src.models.bitnet import SimpleBitNet, export_frontend_weights
from src.pipeline.loaders.custom_wide import load_custom_wide
from src.pipeline.loaders.santander import load_santander

SUPPORTED_DATASETS = {"santander": load_santander, "custom": load_custom_wide}


def train(
    epochs: int = 20,
    batch_size: int = 256,
    lr: float = 1e-3,
    hidden_dim: int = 128,
    num_layers: int = 3,
    sample_frac: float = 0.1,
    dataset: str = "custom",
    device: str = "cpu",
) -> SimpleBitNet:
    print(f"Device: {device}")
    print(f"Loading data (dataset={dataset}, sample_frac={sample_frac})...")

    loader = SUPPORTED_DATASETS.get(dataset)
    if loader is None:
        raise ValueError(f"Unknown dataset: {dataset}. Options: {list(SUPPORTED_DATASETS.keys())}")

    feat_names = None
    prod_names = None
    if dataset == "custom":
        X, y, feat_names, prod_names = loader(sample_frac=sample_frac)
        print(f"  Features: {feat_names}")
        print(f"  Products: {prod_names[:5]}... ({len(prod_names)} total)")
    else:
        X, y = loader(sample_frac=sample_frac)
    print(f"  X: {X.shape}, y: {y.shape}")

    n = len(X)
    n_train = int(n * 0.8)
    X_train = torch.from_numpy(X[:n_train]).to(device)
    y_train = torch.from_numpy(y[:n_train]).to(device)
    X_val = torch.from_numpy(X[n_train:]).to(device)
    y_val = torch.from_numpy(y[n_train:]).to(device)

    model = SimpleBitNet(
        d_in=X.shape[1], d_out=y.shape[1],
        d_h=hidden_dim, n_layers=num_layers,
    ).to(device)

    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs)
    criterion = nn.BCEWithLogitsLoss()

    best_loss = float("inf")
    history = {"train_loss": [], "val_loss": [], "val_precision": []}

    for epoch in range(epochs):
        model.train()
        perm = torch.randperm(n_train, device=device)
        total_loss = 0.0
        steps = 0

        for i in range(0, n_train, batch_size):
            idx = perm[i: i + batch_size]
            xb, yb = X_train[idx], y_train[idx]

            optimizer.zero_grad()
            logits = model(xb)
            loss = criterion(logits, yb)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            steps += 1

        train_loss = total_loss / steps
        scheduler.step()

        model.eval()
        with torch.no_grad():
            val_logits = model(X_val)
            val_loss = criterion(val_logits, y_val).item()
            val_pred = (torch.sigmoid(val_logits) > 0.5).float()
            val_precision = (val_pred * y_val).sum() / val_pred.sum().clamp(min=1)

        history["train_loss"].append(round(train_loss, 4))
        history["val_loss"].append(round(val_loss, 4))
        history["val_precision"].append(round(val_precision.item(), 4))

        print(f"Epoch {epoch+1:3d}/{epochs} | train_loss: {train_loss:.4f} | val_loss: {val_loss:.4f} | val_prec: {val_precision:.4f}")

        if val_loss < best_loss:
            best_loss = val_loss
            ckpt_dir = BACKEND_DIR / "models" / "checkpoints"
            ckpt_dir.mkdir(parents=True, exist_ok=True)
            torch.save(model.state_dict(), ckpt_dir / "bitnet_best.pt")

    info = model.export_info()
    info["best_val_loss"] = best_loss
    info["train_config"] = {
        "epochs": epochs, "batch_size": batch_size, "lr": lr,
        "hidden_dim": hidden_dim, "num_layers": num_layers,
    }

    ckpt_dir = BACKEND_DIR / "models" / "checkpoints"
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    with open(ckpt_dir / "training_info.json", "w") as f:
        json.dump(info, f, indent=2)

    with open(ckpt_dir / "history.json", "w") as f:
        json.dump(history, f, indent=2)

    # Экспорт во фронтенд
    print("\n=== Exporting to frontend ===")
    export_frontend_weights(model, FRONTEND_MODEL_DIR, feat_names, prod_names)

    if feat_names:
        with open(ckpt_dir / "feature_names.json", "w") as f:
            json.dump({"input_features": feat_names, "product_names": prod_names}, f, indent=2)

    print(f"\nTraining complete. Model: {info['model_size_kb']:.1f} KB, {info['total_parameters']:,} params")
    print(f"Checkpoint: {ckpt_dir / 'bitnet_best.pt'}")
    return model


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=256)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--hidden-dim", type=int, default=128)
    parser.add_argument("--num-layers", type=int, default=3)
    parser.add_argument("--sample-frac", type=float, default=0.1)
    parser.add_argument("--dataset", type=str, default="custom", choices=["santander", "custom"])
    parser.add_argument("--device", type=str, default="cuda" if torch.cuda.is_available() else "cpu")
    args = parser.parse_args()

    train(
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        hidden_dim=args.hidden_dim,
        num_layers=args.num_layers,
        sample_frac=args.sample_frac,
        dataset=args.dataset,
        device=args.device,
    )
