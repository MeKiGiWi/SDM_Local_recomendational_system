#!/usr/bin/env python3
"""Проверка: UI monthlyIncome (₽/мес) ↔ income_at_lag модели (EUR/год, как income_filled)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

QUANTILES = ROOT / "backend" / "datasets" / "processed" / "profile_quantiles.json"
RUB_PER_EUR = 100.0  # ориентир из обсуждения в проекте

MANUAL_RUB_MONTHLY = {
    "Матвей": 15_000,
    "Артем": 120_000,
    "Даня": 350_000,
    "Михаил": 5_000_000,
}


def rub_monthly_to_annual_eur(rub_monthly: float, rate: float = RUB_PER_EUR) -> float:
    return (rub_monthly / rate) * 12.0


def annual_eur_to_rub_monthly(annual_eur: float, rate: float = RUB_PER_EUR) -> float:
    return annual_eur * rate / 12.0


def main() -> None:
    profiles = json.loads(QUANTILES.read_text(encoding="utf-8"))

    print("Модель обучена на income_filled / income_at_lag — годовой доход (шкала Santander, ~EUR).\n")
    print("В коде сейчас: monthlyIncome из UI передаётся в income_at_lag БЕЗ конвертации.\n")
    print("=" * 72)
    print(f"{'Профиль':<10} {'UI ₽/мес':>12} {'→ модель EUR/год':>18} {'квантиль EUR/год':>18} {'OK?':>6}")
    print("-" * 72)

    all_ok_identity = True
    all_ok_converted = True
    for p in profiles:
        ui = p["monthlyIncome"]
        target_eur = ui  # quantile script wrote annual EUR into monthlyIncome field
        via_convert = rub_monthly_to_annual_eur(ui)
        ok_id = abs(via_convert - target_eur) / max(target_eur, 1) < 0.02
        if not ok_id:
            all_ok_converted = False
        # as implemented today: identity
        model_now = ui
        ok_now = model_now == target_eur
        if not ok_now:
            all_ok_identity = False
        print(
            f"{p['name']:<10} {ui:>12,} {via_convert:>18,.0f} {target_eur:>18,} "
            f"{'да' if ok_id else 'НЕТ':>6}"
        )

    print("-" * 72)
    print("\nПри конвертации RUB/мес → EUR/год (×12 / 100) текущие числа в UI НЕ совпадают с квантилями.")
    print("Сейчас в UI фактически показана годовая EUR-величина квантиля, подписанная как ₽/мес.\n")

    print("=" * 72)
    print(f"Какие ₽/мес должны быть в UI при квантиле EUR/год (R={RUB_PER_EUR:.0f}):\n")
    for p in profiles:
        eur = p["monthlyIncome"]
        rub = annual_eur_to_rub_monthly(eur)
        print(f"  {p['name']}: {rub:,.0f} ₽/мес  ↔  {eur:,} EUR/год (q={p['quantile']})")

    print("\n" + "=" * 72)
    print("Ваши старые ручные значения (коммит до квантилей):\n")
    for name, rub in MANUAL_RUB_MONTHLY.items():
        eur = rub_monthly_to_annual_eur(rub)
        print(f"  {name}: {rub:,} ₽/мес  →  {eur:,.0f} EUR/год")

    print("\nИтог:")
    print("  • Квантили 0.05/0.25/0.5/0.8 подставлены в monthlyIncome как EUR/год (не ₽/мес).")
    print("  • Модель получает то же число — для CatBoost это корректно.")
    print("  • Подпись «₽/мес» в UI и ручные 15k/120k/350k/5M — другая шкала; нужна конвертация в profileToModel.")


if __name__ == "__main__":
    main()
