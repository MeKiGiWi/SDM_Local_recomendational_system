export type Segment = 'INDIVIDUALS' | 'VIP' | 'STUDENTS'

export { syntheticFromProfile } from './syntheticFromProfile.generated'
import { syntheticFromProfile } from './syntheticFromProfile.generated'

export interface UserFeatures {
  age: number
  balance: number
  monthlyIncome: number
  accountType: number
  currency: number
  clicks: Record<string, number>
  seniorityMonths?: number
  isNewCustomer?: number
  sex?: number
  segment?: Segment
  segmentVip?: number
  segmentStudent?: number
  regionName?: string
}

function segmentFromFeatures(f: UserFeatures): string {
  if (f.segment) return f.segment
  if (f.segmentStudent) return 'STUDENTS'
  if (f.segmentVip) return 'VIP'
  if (f.accountType === 3) return 'STUDENTS'
  if (f.balance >= 1_000_000 || f.monthlyIncome >= 500_000) return 'VIP'
  return 'INDIVIDUALS'
}

export interface ModelMeta {
  products: string[]
  numeric_features: string[]
  categorical_features: string[]
}

export function buildPointwiseRows(
  f: UserFeatures,
  meta: ModelMeta,
): { numeric: number[]; categorical: string[] }[] {
  const segment = segmentFromFeatures(f)
  const syn = syntheticFromProfile(f.age, f.monthlyIncome, f.balance, segment)
  const sex = (f.sex ?? 1) === 1 ? 'M' : 'F'
  const isNew = String(f.isNewCustomer ?? 0)
  const region = f.regionName ?? 'MADRID'
  const income = f.monthlyIncome

  const values: Record<string, number | string> = {
    age: f.age,
    seniority_months: f.seniorityMonths ?? 24,
    income_at_lag: income,
    ...syn,
    sex,
    is_new_customer: isNew,
    region_name: region,
    segment,
  }

  for (const p of meta.products) {
    values[`own_${p}`] = (f.clicks[p] ?? 0) > 0 ? 1 : 0
  }

  return meta.products.map((product) => {
    const rowValues: Record<string, number | string> = { ...values, product }
    const numeric = meta.numeric_features.map((k) => Number(rowValues[k] ?? 0))
    const categorical = meta.categorical_features.map((k) => String(rowValues[k] ?? ''))
    return { numeric, categorical }
  })
}
