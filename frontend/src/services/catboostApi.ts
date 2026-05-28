import { apiClient } from '../api/client'
import type { ProfileForModel } from '../utils/profileToModel'

export interface RankedProduct {
  id: string
  score?: number
}

/** Server-side CatBoost (same .pkl as training). */
export async function fetchCatboostRecommendations(
  profile: ProfileForModel,
): Promise<RankedProduct[]> {
  const q = new URLSearchParams({
    age: String(profile.age),
    balance: String(profile.balance),
    monthly_income: String(profile.monthlyIncome),
    sex: String(profile.sex),
    seniority_months: String(profile.seniorityMonths),
    is_new_customer: String(profile.isNewCustomer),
    segment: profile.segment,
    region_name: profile.regionName,
  })
  const res = await apiClient.get<Array<{ id: string; score?: number }>>(
    `/products/recommendations?${q}`,
  )
  if (res.error || !res.data) throw new Error(res.error ?? 'recommendations failed')
  return res.data.map((p) => ({ id: p.id, score: p.score }))
}
