import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AdProduct } from '../../../data/productParser'
import {
  extractFeatures,
  predict,
  initBitNet,
  personalize,
  getTopKUniqueProductIds,
} from '../../../services/modelInference'
import { getAllProducts, getHomeAdProducts, getProductById } from '../../../data/productParser'
import { colors } from '../../../config/theme'
import { CategoryGlyph } from '../../ui/CategoryIcon'
import type { ProfileData } from './ClientSelector'
import { useUserInputStore } from '../../../store/userInputStore'

const CATEGORY_TAGS: Record<string, string> = {
  deposits_and_savings_accounts_individuals: 'Вклад',
  loans_individuals: 'Кредит',
  debit_cards: 'Карта',
  rko_business_packages: 'РКО',
  deposits_business: 'Депозит',
  additional_business_services: 'Услуга',
}

function getCategoryTag(cat: string): string {
  return CATEGORY_TAGS[cat] ?? cat
}

function uniqueProducts(items: AdProduct[], limit: number): AdProduct[] {
  const seen = new Set<string>()
  const out: AdProduct[] = []
  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    out.push(item)
    if (out.length >= limit) break
  }
  return out
}

function HeroRecCard({ product, onTrack }: { product: AdProduct; onTrack: (id: string) => void }) {
  return (
    <Link
      to={`/product/${product.id}`}
      onClick={() => onTrack(product.id)}
      className="rec-hero block rounded-[1.25rem] overflow-hidden card-shadow-hover animate-fade-in-up w-full"
      style={{
        background: `linear-gradient(152deg, ${colors.primary.DEFAULT} 0%, ${colors.primary.dark} 68%, oklch(36% 0.13 264) 100%)`,
        boxShadow: colors.shadow.hero,
      }}
    >
      <div className="p-4 sm:p-5 lg:p-6 flex flex-col md:flex-row gap-4 md:gap-5 items-start md:items-center relative">
        <div
          className="pointer-events-none absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-30"
          style={{ background: 'oklch(99% 0.005 252 / 0.12)' }}
          aria-hidden
        />
        <div className="flex-1 min-w-0 w-full relative z-[1]">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rec-rank-badge rec-rank-badge--hero">Лучший выбор</span>
            <span className="rec-tag rec-tag--on-hero">{getCategoryTag(product.category)}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-tight tracking-tight">{product.name}</h3>
          <p className="text-sm leading-relaxed line-clamp-3 sm:line-clamp-2 text-white/85">{product.description}</p>
        </div>
        <div className="shrink-0 self-center md:self-start relative z-[1]">
          <CategoryGlyph category={product.category} variant="hero" />
        </div>
      </div>
    </Link>
  )
}

function SecondaryRecCard({ product, rank, onTrack }: { product: AdProduct; rank: number; onTrack: (id: string) => void }) {
  return (
    <Link
      to={`/product/${product.id}`}
      onClick={() => onTrack(product.id)}
      className="rec-card block rounded-[1.25rem] p-4 sm:p-5 card-shadow card-shadow-hover animate-fade-in-up h-full w-full"
      style={{
        animationDelay: `${rank * 50}ms`,
        minHeight: '168px',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="rec-rank-num" aria-hidden>
          {rank}
        </span>
        <span className="rec-tag">{getCategoryTag(product.category)}</span>
      </div>
      <div className="mb-3">
        <CategoryGlyph category={product.category} variant="card" />
      </div>
      <h3 className="text-[15px] font-bold mb-1.5 leading-tight line-clamp-2 tracking-tight" style={{ color: colors.text.primary }}>
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
      return uniqueProducts(getHomeAdProducts(), 5)
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
    const topIds = getTopKUniqueProductIds(personalized, 5)
    const resolved = topIds
      .map((id) => getProductById(id))
      .filter((p): p is AdProduct => p != null)
    return uniqueProducts(resolved.length > 0 ? resolved : getAllProducts().slice(0, 5), 5)
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
      <div className="mode-switch flex w-full md:w-auto rounded-xl p-1 gap-0.5">
        {(['profile', 'popular'] as const).map((m) => {
          const active = mode === m
          return (
            <button
              key={m}
              onClick={() => onChange(m)}
              className={`flex-1 md:flex-none px-3 sm:px-4 py-2 sm:py-1.5 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer text-center whitespace-nowrap ${
                active ? 'mode-switch__btn--active' : 'mode-switch__btn'
              }`}
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
      className="surface-panel surface-panel--elevated rounded-[1.25rem] p-4 sm:p-5 lg:p-6 animate-fade-in-up w-full min-w-0"
      style={{ animationDelay: '100ms' }}
    >
      <ModeSwitch mode={mode} onChange={setMode} />

      <p className="section-label mb-4">Топ-5 рекомендаций</p>

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
