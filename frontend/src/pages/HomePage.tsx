import { useEffect, useState } from 'react'
import { Header } from '../components/layout'
import { ClientSelector, PROFILES } from '../components/features/advertising/ClientSelector'
import { ClientProfile } from '../components/features/advertising/ClientProfile'
import { RecommendationsPanel } from '../components/features/advertising/RecommendationsPanel'
import { colors } from '../config/theme'
import { useUserInputStore } from '../store'

export function HomePage() {
  const [selectedIdx, setSelectedIdx] = useState(3)
  const setField = useUserInputStore((s) => s.setField)

  const handleSelect = (idx: number) => {
    const p = PROFILES[idx]
    setField('age', p.age)
    setField('balance', p.balance)
    setField('monthlyIncome', p.monthlyIncome)
    setField('accountType', p.accountType)
    setField('currency', p.currency)
    setField('fullName', p.name)
    setSelectedIdx(idx)
  }

  const profile = PROFILES[selectedIdx]

  useEffect(() => {
    handleSelect(selectedIdx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: colors.bg }}>
      <Header />
      <main className="flex-1 page-container py-5 sm:py-6 lg:py-8">
        <h1
          className="text-[22px] sm:text-[26px] lg:text-[28px] font-bold tracking-tight mb-5 sm:mb-6 animate-fade-in-up leading-tight"
          style={{ color: colors.text.primary }}
        >
          Подберите продукты для клиента
        </h1>

        <section className="mb-5 sm:mb-6">
          <ClientSelector selectedIdx={selectedIdx} onSelect={handleSelect} />
        </section>

        <section className="flex flex-col lg:grid lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] gap-4 sm:gap-5 lg:gap-6 items-stretch">
          <ClientProfile profile={profile} />
          <RecommendationsPanel profile={profile} />
        </section>
      </main>
    </div>
  )
}
