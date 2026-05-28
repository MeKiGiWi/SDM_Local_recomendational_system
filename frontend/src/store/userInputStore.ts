import { create } from 'zustand'
import type { AdSelectionResponse } from '../types'
import { adsApi, analyticsApi } from '../api/endpoints'
import { ANALYTICS } from '../config/features'
import { generateSessionId } from '../utils/session'
import { getItem, setItem } from '../utils/storage'
import { initModel } from '../services/modelInference'
import type { Segment } from '../utils/profileToModel'

export type Currency = 'RUB' | 'USD' | 'EUR' | 'CNY'
export type AccountType = 'savings' | 'current' | 'deposit' | 'card'

export interface UserProfile {
  fullName: string
  age: number
  currency: Currency
  balance: number
  monthlyIncome: number
  accountType: AccountType
  sex: 0 | 1
  seniorityMonths: number
  isNewCustomer: 0 | 1
  segment: Segment
  regionName: string
}

interface UserInputState extends UserProfile {
  sessionId: string
  selectedAd: AdSelectionResponse | null
  adHistory: AdSelectionResponse[]
  isLoading: boolean
  error: string | null
  clickHistory: Record<string, number>
  clickTimeline: { productId: string; time: string }[]
  setField: <K extends keyof UserProfile>(field: K, value: UserProfile[K]) => void
  trackClick: (productId: string) => void
  fetchAd: () => Promise<void>
  clearError: () => void
}

const DEFAULTS: UserProfile = {
  fullName: 'Иван Петров',
  age: 30,
  currency: 'RUB',
  balance: 250000,
  monthlyIncome: 85000,
  accountType: 'current',
  sex: 1,
  seniorityMonths: 72,
  isNewCustomer: 0,
  segment: 'INDIVIDUALS',
  regionName: 'MADRID',
}

const STORAGE_KEY = 'sdm_user_profile'
const CLICK_KEY = 'sdm_click_history'

function loadSavedState() {
  const saved = getItem<{ profile: UserProfile; clicks: Record<string, number> }>(STORAGE_KEY)
  if (saved) return saved
  const clicks = getItem<Record<string, number>>(CLICK_KEY) ?? {}
  return { profile: DEFAULTS, clicks }
}

function saveState(profile: UserProfile, clicks: Record<string, number>) {
  setItem(STORAGE_KEY, { profile, clicks })
  setItem(CLICK_KEY, clicks)
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

const saved = loadSavedState()

export const useUserInputStore = create<UserInputState>((set, get) => ({
  ...saved.profile,
  sessionId: generateSessionId(),
  selectedAd: null,
  adHistory: [],
  isLoading: false,
  error: null,
  clickHistory: saved.clicks,
  clickTimeline: [],

  setField: (field, value) => {
    set({ [field]: value } as Partial<UserInputState>)
    saveState({ ...get(), ...{ [field]: value } } as UserProfile, get().clickHistory)
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      get().fetchAd()
    }, 300)
  },

  trackClick: (productId: string) => {
    const state = get()
    const newClicks = {
      ...state.clickHistory,
      [productId]: (state.clickHistory[productId] || 0) + 1,
    }
    set({
      clickHistory: newClicks,
      clickTimeline: [
        ...state.clickTimeline.slice(-99),
        { productId, time: new Date().toISOString() },
      ],
    })
    saveState(state as UserProfile, newClicks)

    if (ANALYTICS.ENABLED) {
      analyticsApi.track({
        id: crypto.randomUUID?.() ?? `${Date.now()}`,
        type: 'button_click',
        payload: { productId, totalClicks: newClicks[productId] },
        timestamp: new Date().toISOString(),
        sessionId: state.sessionId,
      })
    }

    // Пересчёт рекомендации после клика
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      get().fetchAd()
    }, 500)
  },

  fetchAd: async () => {
    const state = get()
    const { age, balance, monthlyIncome, accountType, currency, clickHistory, sessionId } = state
    set({ isLoading: true, error: null })

    try {
      let adResponse: AdSelectionResponse

      await initModel()
      const response = await adsApi.select({
        age,
        balance,
        monthlyIncome,
        sessionId,
        sex: state.sex,
        seniorityMonths: state.seniorityMonths,
        isNewCustomer: state.isNewCustomer,
        segment: state.segment,
        regionName: state.regionName,
        accountType,
        currency,
        clickHistory,
      })
      if (response.error) throw new Error(response.error)
      adResponse = response.data

      set((state) => ({
        selectedAd: adResponse,
        adHistory: [...state.adHistory, adResponse],
        isLoading: false,
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка подбора', isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
