import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AdProduct } from '../../../data/productParser'
import { fetchCatboostRecommendations } from '../../../services/catboostApi'
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
      <div className="rec-hero__layout relative">
        <div
          className="pointer-events-none absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-30"
          style={{ background: 'oklch(99% 0.005 252 / 0.12)' }}
          aria-hidden
        />
        <div className="rec-hero__content relative z-[1]">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rec-rank-badge rec-rank-badge--hero">Лучший выбор</span>
            <span className="rec-tag rec-tag--on-hero">{getCategoryTag(product.category)}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 leading-tight tracking-tight">{product.name}</h3>
          <p className="text-sm leading-relaxed line-clamp-3 sm:line-clamp-2 text-white/85">{product.description}</p>
        </div>
        <div className="rec-hero__glyph relative z-[1]">
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
  const [items, setItems] = useState<AdProduct[]>([])

  useEffect(() => {
    if (mode === 'popular') {
      setItems(uniqueProducts(getHomeAdProducts(), 5))
      return
    }
    if (!profile) {
      setItems([])
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const ranked = await fetchCatboostRecommendations(profile)
        const resolved = ranked
          .map((r) => getProductById(r.id))
          .filter((p): p is AdProduct => p != null)
        if (!cancelled) {
          setItems(uniqueProducts(resolved.length > 0 ? resolved : getAllProducts().slice(0, 5), 5))
        }
      } catch {
        if (!cancelled) setItems(uniqueProducts(getAllProducts().slice(0, 5), 5))
      }
    })()

    return () => {
      cancelled = true
    }
  }, [profile, mode, clickHistory])

  return items
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
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange('profile')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          По профилю
        </button>
        <button
          type="button"
          onClick={() => onChange('popular')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            mode === 'popular' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          Популярные
        </button>
      </div>
    </div>
  )
}

export function RecommendationsPanel({ profile }: { profile: ProfileData | null }) {
  const [mode, setMode] = useState<'profile' | 'popular'>('profile')
  const trackClick = useUserInputStore((s) => s.trackClick)
  const items = useRecommendations(profile, mode)

  const hero = items[0]
  const rest = items.slice(1, 5)

  return (
    <section>
      <ModeSwitch mode={mode} onChange={setMode} />
      {hero ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <HeroRecCard product={hero} onTrack={trackClick} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {rest.map((p, i) => (
              <SecondaryRecCard key={p.id} product={p} rank={i + 2} onTrack={trackClick} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Выберите профиль клиента</p>
      )}
    </section>
  )
}
