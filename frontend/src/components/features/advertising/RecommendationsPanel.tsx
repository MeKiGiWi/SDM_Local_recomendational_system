import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AdProduct } from '../../../data/productParser'
import {
  extractFeatures,
  predict,
  initBitNet,
  personalize,
  getTopK,
  getProductId,
} from '../../../services/modelInference'
import { getAllProducts, getHomeAdProducts } from '../../../data/productParser'
import { colors } from '../../../config/theme'
import { SafeIcon } from '../../ui/Icons'
import type { ProfileData } from './ClientSelector'
import { useUserInputStore } from '../../../store/userInputStore'

const CATEGORY_ICONS: Record<string, { emoji: string; bg: string }> = {
  deposits_and_savings_accounts_individuals: { emoji: '🏦', bg: '#EBF2FF' },
  loans_individuals: { emoji: '⚖️', bg: '#ECFDF5' },
  debit_cards: { emoji: '💳', bg: '#F5F3FF' },
  rko_business_packages: { emoji: '🏢', bg: '#FFF7ED' },
  deposits_business: { emoji: '🏠', bg: '#FEF3C7' },
  additional_business_services: { emoji: '📋', bg: '#F1F5F9' },
}

const CATEGORY_TAGS: Record<string, string> = {
  deposits_and_savings_accounts_individuals: 'Вклад',
  loans_individuals: 'Кредит',
  debit_cards: 'Карта',
  rko_business_packages: 'РКО',
  deposits_business: 'Депозит',
  additional_business_services: 'Услуга',
}

function getCategoryMeta(cat: string) {
  return CATEGORY_ICONS[cat] ?? { emoji: '📦', bg: '#F1F5F9' }
}

function getCategoryTag(cat: string): string {
  return CATEGORY_TAGS[cat] ?? cat
}

function HeroRecCard({ product, onTrack }: { product: AdProduct; onTrack: (id: string) => void }) {
  return (
    <Link
      to={`/product/${product.id}`}
      onClick={() => onTrack(product.id)}
      className="block rounded-2xl overflow-hidden card-shadow-hover animate-fade-in-up w-full"
      style={{
        background: `linear-gradient(135deg, ${colors.primary.DEFAULT} 0%, ${colors.primary.dark} 100%)`,
        boxShadow: colors.shadow.hero,
      }}
    >
      <div className="p-4 sm:p-5 lg:p-6 flex flex-col md:flex-row gap-4 md:gap-5 items-start md:items-center">
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-md whitespace-nowrap"
              style={{ background: colors.accent.yellow.bg, color: colors.accent.yellow.text }}
            >
              1. Рекомендуем
            </span>
            <span
              className="text-[11px] font-medium px-2.5 py-1 rounded-md whitespace-nowrap"
              style={{ background: 'rgba(255,255,255,0.2)', color: colors.text.white }}
            >
              {getCategoryTag(product.category)}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-tight">{product.name}</h3>
          <p className="text-sm leading-relaxed line-clamp-3 sm:line-clamp-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {product.description}
          </p>
        </div>
        <div className="shrink-0 opacity-90 self-center md:self-start">
          <SafeIcon size={48} className="md:hidden" />
          <SafeIcon size={56} className="hidden md:block" />
        </div>
      </div>
    </Link>
  )
}

function SecondaryRecCard({ product, rank, onTrack }: { product: AdProduct; rank: number; onTrack: (id: string) => void }) {
  const meta = getCategoryMeta(product.category)

  return (
    <Link
      to={`/product/${product.id}`}
      onClick={() => onTrack(product.id)}
      className="block rounded-2xl p-4 sm:p-5 card-shadow card-shadow-hover animate-fade-in-up bg-white h-full w-full"
      style={{
        border: `1px solid ${colors.border}`,
        animationDelay: `${rank * 50}ms`,
        minHeight: '156px',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: colors.bg, color: colors.text.secondary }}
        >
          {rank}
        </div>
        <span
          className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md shrink-0"
          style={{ background: colors.bg, color: colors.text.muted }}
        >
          {getCategoryTag(product.category)}
        </span>
      </div>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
        style={{ background: meta.bg }}
      >
        {meta.emoji}
      </div>
      <h3 className="text-[15px] font-bold mb-1 leading-tight line-clamp-2" style={{ color: colors.text.primary }}>
        {product.name}
      </h3>
      <p className="text-xs leading-relaxed line-clamp-2" style={{ color: colors.text.secondary }}>
        {product.description}
      </p>
    </Link>
  )
}

function useRecommendations(profile: ProfileData | null, mode: 'profile' | 'popular'): AdProduct[] {
  const clickHistory = useUserInputStore((s) => s.clickHistory)
  return useMemo(() => {
    if (mode === 'popular') {
      return getHomeAdProducts().slice(0, 5)
    }
    if (!profile) return []

    const CURRENCY_MAP: Record<string, number> = { RUB: 0, USD: 1, EUR: 2, CNY: 3 }
    const ACCOUNT_MAP: Record<string, number> = { current: 0, savings: 1, deposit: 2, card: 3 }

    void initBitNet()
    const features = extractFeatures({
      age: profile.age,
      balance: profile.balance,
      monthlyIncome: profile.monthlyIncome,
      accountType: ACCOUNT_MAP[profile.accountType] ?? 0,
      currency: CURRENCY_MAP[profile.currency] ?? 0,
      clicks: clickHistory,
      seniorityMonths: (profile as any).seniorityMonths,
      isNewCustomer: (profile as any).isNewCustomer,
      sex: (profile as any).sex,
      segmentVip: (profile as any).segmentVip,
      segmentStudent: (profile as any).segmentStudent,
    })
    const scores = predict(features)
    const personalized = personalize(scores, clickHistory)
    const top5 = getTopK(personalized, 5)
    const allProducts = getAllProducts()
    return top5.map((idx) => {
      const prodId = getProductId(idx)
      return allProducts.find((p) => p.id === prodId) ?? allProducts[0]
    })
  }, [profile, mode, clickHistory])
}

function ModeSwitch({
  mode,
  onChange,
}: {
  mode: 'profile' | 'popular'
  onChange: (m: 'profile' | 'popular') => void
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5 sm:mb-6">
      <h3 className="text-base font-semibold shrink-0" style={{ color: colors.text.primary }}>
        Режим рекомендаций
      </h3>
      <div
        className="flex w-full md:w-auto rounded-xl p-1 gap-0.5"
        style={{ background: colors.segmented.bg }}
      >
        {(['profile', 'popular'] as const).map((m) => {
          const active = mode === m
          return (
            <button
              key={m}
              onClick={() => onChange(m)}
              className="flex-1 md:flex-none px-3 sm:px-4 py-2 sm:py-1.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer text-center whitespace-nowrap"
              style={
                active
                  ? {
                      background: colors.primary.DEFAULT,
                      color: colors.text.white,
                      boxShadow: `0 2px 8px ${colors.segmented.activeShadow}`,
                    }
                  : { color: colors.text.secondary }
              }
            >
              {m === 'profile' ? 'По профилю' : 'Популярные'}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function RecommendationsPanel({ profile }: { profile: ProfileData | null }) {
  const [mode, setMode] = useState<'profile' | 'popular'>('profile')
  const products = useRecommendations(profile, mode)
  const trackClick = useUserInputStore((s) => s.trackClick)

  return (
    <div
      className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 card-shadow animate-fade-in-up w-full min-w-0"
      style={{ border: `1px solid ${colors.border}`, animationDelay: '100ms' }}
    >
      <ModeSwitch mode={mode} onChange={setMode} />

      <h4
        className="text-xs font-semibold uppercase tracking-wider mb-4"
        style={{ color: colors.text.muted }}
      >
        Топ-5 рекомендаций
      </h4>

      {products.length > 0 && (
        <div className="mb-3 sm:mb-4">
          <HeroRecCard product={products[0]} onTrack={trackClick} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {products.slice(1).map((p, i) => (
          <SecondaryRecCard key={p.id} product={p} rank={i + 2} onTrack={trackClick} />
        ))}
      </div>
    </div>
  )
}
