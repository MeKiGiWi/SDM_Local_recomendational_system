/** AUTO-GENERATED — do not edit. Regenerate: python backend/scripts/export_catboost_mobile.py */
export function syntheticFromProfile(
  age: number,
  income: number,
  balance: number,
  segment: string,
): Record<string, number> {
  void age
  const segMul = segment === 'VIP' ? 1.4 : segment === 'STUDENTS' ? 0.65 : 1
  const turnover = Math.max(income, 1) * 1.15 + balance * 0.02
  const ops = Math.min(80, Math.max(2, turnover / 8000)) * segMul
  const activeDays = Math.min(28, Math.max(2, ops * 0.55))
  const expenses = turnover * 0.62
  return {
    synthetic_activity_score: Math.min(2.5, Math.max(0.05, (Math.log1p(turnover) / 12) * segMul)),
    synthetic_operations_cnt_30d: ops,
    synthetic_active_days_30d: activeDays,
    synthetic_expenses_30d: expenses,
    synthetic_income_30d: Math.max(income, 1),
    synthetic_turnover_30d: turnover,
    synthetic_avg_operation_size_30d: turnover / Math.max(ops, 1),
    synthetic_financial_intensity: Math.min(3, Math.max(0.02, turnover / (balance + income + 1))),
    synthetic_inflow_outflow_ratio: Math.min(2.5, Math.max(0.3, income / (expenses + 1))),
    synthetic_credit_pressure: Math.min(1.5, Math.max(0.01, expenses / (balance + income + 1))),
    synthetic_savings_capacity: Math.min(2, Math.max(-1, (balance + income - expenses) / (income + 1))),
    synthetic_credit_capacity: Math.min(2, Math.max(0, (income * 3 - expenses) / (income * 3 + 1))),
    synthetic_business_intensity: segment === 'VIP' && balance > 500_000 ? 0.35 : 0.08,
  }
}
