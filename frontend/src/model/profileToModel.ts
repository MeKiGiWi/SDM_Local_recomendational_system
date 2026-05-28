import type { AccountType, Currency } from '../store/userInputStore'

export type Segment = 'INDIVIDUALS' | 'VIP' | 'STUDENTS'

export interface ModelProfileFields {
  sex: 0 | 1
  seniorityMonths: number
  isNewCustomer: 0 | 1
  segment: Segment
  regionName: string
  ownedProducts: string[]
}

export interface ProfileForModel extends ModelProfileFields {
  id: string
  name: string
  age: number
  balance: number
  monthlyIncome: number
  monthlyIncomeRub: number
  scoringIncome: number
  accountType: AccountType
  currency: Currency
}

export interface UserFeatures {
  age: number
  balance: number
  monthlyIncome: number
  accountType: number
  currency: number
  sex: number
  seniorityMonths: number
  isNewCustomer: number
  segment: Segment
  regionName: string
  ownedProducts: string[]
}

const CURRENCY_MAP: Record<Currency, number> = { RUB: 0, USD: 1, EUR: 2, CNY: 3 }
const ACCOUNT_MAP: Record<AccountType, number> = { current: 0, savings: 1, deposit: 2, card: 3 }

export function profileToUserFeatures(profile: ProfileForModel): UserFeatures {
  return {
    age: profile.age,
    balance: profile.balance,
    monthlyIncome: profile.scoringIncome,
    accountType: ACCOUNT_MAP[profile.accountType] ?? 0,
    currency: CURRENCY_MAP[profile.currency] ?? 0,
    sex: profile.sex,
    seniorityMonths: profile.seniorityMonths,
    isNewCustomer: profile.isNewCustomer,
    segment: profile.segment,
    regionName: profile.regionName,
    ownedProducts: profile.ownedProducts,
  }
}
