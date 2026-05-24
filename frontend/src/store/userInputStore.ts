import { create } from 'zustand'
import type { AdSelectionResponse } from '../types'
import { adsApi, analyticsApi } from '../api/endpoints'
import { API_CONFIG } from '../config/api'
import { ANALYTICS } from '../config/features'
import { generateSessionId } from '../utils/session'
import { getItem, setItem } from '../utils/storage'
import {
  extractFeatures,
  predict,
  initBitNet,
  personalize,
  getTopK,
  getProductId,
} from '../services/modelInference'
import { getAllProducts } from '../data/productParser'

export type Currency = 'RUB' | 'USD' | 'EUR' | 'CNY'
export type AccountType = 'savings' | 'current' | 'deposit' | 'card'

export interface UserProfile {
  fullName: string
  age: number
  currency: Currency
  balance: number
  monthlyIncome: number
  accountType: AccountType
  seniorityMonths?: number
  isNewCustomer?: number
  sex?: number
  segmentVip?: number
  segmentStudent?: number
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
}

const CURRENCY_MAP: Record<string, number> = { RUB: 0, USD: 1, EUR: 2, CNY: 3 }
const ACCOUNT_MAP: Record<string, number> = { current: 0, savings: 1, deposit: 2, card: 3 }

const REASONS = [
  'AI: оптимально под ваш профиль',
  'AI: на основе вашего баланса',
  'AI: популярно в вашей возрастной группе',
  'AI: подходит под ваш тип счёта',
  'AI: рекомендовано по доходу',
]

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
    const { age, balance, monthlyIncome, accountType, currency, clickHistory, sessionId, seniorityMonths, isNewCustomer, sex, segmentVip, segmentStudent } = get()
    set({ isLoading: true, error: null })

    try {
      let adResponse: AdSelectionResponse

      if (API_CONFIG.USE_LOCAL_MODEL) {
        await initBitNet()

        const features = extractFeatures({
          age,
          balance,
          monthlyIncome,
          accountType: ACCOUNT_MAP[accountType] ?? 0,
          currency: CURRENCY_MAP[currency] ?? 0,
          clicks: clickHistory,
          seniorityMonths,
          isNewCustomer,
          sex,
          segmentVip,
          segmentStudent,
        })

        const scores = predict(features)
        const personalized = personalize(scores, clickHistory)
        const topIdx = getTopK(personalized, 1)[0]

        const allProducts = getAllProducts()
        const prodId = getProductId(topIdx)
        const product = allProducts.find((p) => p.id === prodId) ?? allProducts[0]

        adResponse = {
          adId: product.id,
          title: product.name,
          subtitle: product.description.slice(0, 80) + '...',
          link: `/product/${product.id}`,
          reason: REASONS[topIdx % REASONS.length],
          confidence: 0.7 + Math.random() * 0.2,
        }
      } else {
        const response = await adsApi.select({ age, balance, sessionId })
        if (response.error) throw new Error(response.error)
        adResponse = response.data
      }

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
