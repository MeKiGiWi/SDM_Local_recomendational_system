import { useCallback, useEffect, useState } from 'react'
import { Header } from '../components/layout'
import { ClientSelector, PROFILES } from '../components/features/advertising/ClientSelector'
import { ClientProfile } from '../components/features/advertising/ClientProfile'
import { RecommendationsPanel } from '../components/features/advertising/RecommendationsPanel'
import { colors } from '../config/theme'
import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe'
import { useUserInputStore } from '../store'

export function HomePage() {
  const [selectedIdx, setSelectedIdx] = useState(3)
  const setField = useUserInputStore((s) => s.setField)

  const handleSelect = useCallback(
    (idx: number) => {
      const p = PROFILES[idx]
      if (!p) return
      setField('age', p.age)
      setField('balance', p.balance)
      setField('monthlyIncome', p.monthlyIncome)
      setField('accountType', p.accountType)
      setField('currency', p.currency)
      setField('fullName', p.name)
      setSelectedIdx(idx)
    },
    [setField]
  )

  const goNext = useCallback(() => {
    handleSelect((selectedIdx + 1) % PROFILES.length)
  }, [handleSelect, selectedIdx])

  const goPrev = useCallback(() => {
    handleSelect((selectedIdx - 1 + PROFILES.length) % PROFILES.length)
  }, [handleSelect, selectedIdx])

  const swipeRef = useHorizontalSwipe(goNext, goPrev)

  const profile = PROFILES[selectedIdx]

  useEffect(() => {
    handleSelect(selectedIdx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={swipeRef}
      className="profile-swipe-zone min-h-screen min-h-[100dvh] flex flex-col"
      style={{ background: colors.bg }}
    >
      <Header />
      <main className="flex-1 page-container py-5 sm:py-6 lg:py-8 w-full">
        <header className="mb-6 sm:mb-8 animate-fade-in-up">
          <p className="section-label mb-2">Демо рекомендаций</p>
          <h1 className="page-title">Подберите продукты для клиента</h1>
          <p className="mt-2 text-sm max-w-xl leading-relaxed" style={{ color: colors.text.secondary }}>
            Выберите профиль клиента и сравните персональные рекомендации с популярными продуктами.
          </p>
        </header>

        <section className="mb-6 sm:mb-8">
          <p className="section-label mb-3">Клиенты</p>
          <ClientSelector selectedIdx={selectedIdx} onSelect={handleSelect} />
        </section>

        <section className="flex flex-col lg:grid lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] gap-4 sm:gap-5 lg:gap-6 items-stretch">
          <ClientProfile key={profile.name} profile={profile} />
          <RecommendationsPanel key={`rec-${profile.name}`} profile={profile} />
        </section>
      </main>
    </div>
  )
}
