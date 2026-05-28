"""
Единый экспорт модели для телефона (Expo) и браузера (Vite).

  python backend/scripts/export_model.py

Делегирует в export_catboost_mobile.py (CatBoost .cbm + metadata для native inference).
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "backend" / "scripts" / "export_catboost_mobile.py"


def export_model(*, strict: bool = True) -> None:
    cmd = [sys.executable, str(SCRIPT)]
    r = subprocess.run(cmd, cwd=ROOT)
    if r.returncode != 0 and strict:
        sys.exit(r.returncode)


if __name__ == "__main__":
    export_model(strict="--allow-missing" not in sys.argv)
