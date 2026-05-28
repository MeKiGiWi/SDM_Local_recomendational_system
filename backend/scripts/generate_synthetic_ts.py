#!/usr/bin/env python3
"""Regenerate mobile/src/services/syntheticFromProfile.generated.ts from Python source."""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from src.models.synthetic_from_profile import write_mobile_typescript  # noqa: E402

if __name__ == "__main__":
    path = write_mobile_typescript()
    print(f"Wrote {path}")
