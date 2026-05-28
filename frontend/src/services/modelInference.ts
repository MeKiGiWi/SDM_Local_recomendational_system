/**
 * Web uses server CatBoost via catboostApi / adsApi — no local surrogate.
 * See mobile/src/services/modelInference.ts for native .cbm on Android.
 */
export type Segment = 'INDIVIDUALS' | 'VIP' | 'STUDENTS'

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

export async function initModel(): Promise<boolean> {
  return true
}

export const initBitNet = initModel
export function isModelLoaded(): boolean {
  return true
}
export const isBitNetLoaded = isModelLoaded
