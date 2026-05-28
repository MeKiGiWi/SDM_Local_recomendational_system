/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef } from 'react'
import { colors, formatRubles } from '../../shared/config/theme'
import { PORTRAITS } from '../../shared/config/portraits'
import { DEMO_PROFILES } from './demoProfiles.generated'
import type { ProfileForModel } from '../../model/profileToModel'

const AVATARS = [PORTRAITS.matvey, PORTRAITS.artem, PORTRAITS.danya, PORTRAITS.mikhail]
const GRADIENTS = [
  'linear-gradient(135deg, oklch(92% 0.06 250) 0%, oklch(86% 0.08 264) 100%)',
  'linear-gradient(135deg, oklch(95% 0.04 200) 0%, oklch(88% 0.08 220) 100%)',
  'linear-gradient(135deg, oklch(96% 0.05 55) 0%, oklch(90% 0.09 45) 100%)',
  'linear-gradient(135deg, oklch(94% 0.05 150) 0%, oklch(86% 0.08 160) 100%)',
]

export interface ProfileData extends ProfileForModel {
  sourceUserId: number
  targetMonthlyIncomeRub: number
  incomeQuantile: number
  balanceSource: string
  sexLabel: string
  ownedProductFlags: Record<string, number>
  info: string
  description: string
  characteristics: string[]
  avatar: string
  avatarBg: string
}

export const PROFILES: ProfileData[] = DEMO_PROFILES.map((profile, index) => ({
  ...profile,
  characteristics: [...profile.characteristics],
  ownedProducts: [...profile.ownedProducts],
  monthlyIncome: profile.monthlyIncomeRub,
  avatar: AVATARS[index] ?? AVATARS[0],
  avatarBg: GRADIENTS[index] ?? GRADIENTS[0],
  accountType: profile.ownedProducts.some((item) => item.startsWith('card-'))
    ? 'card'
    : profile.ownedProducts.some((item) => item.startsWith('dep-'))
      ? 'deposit'
      : 'current',
  currency: 'RUB',
}))

export function formatIncomeQuantile(value: number): string {
  if (value > 0 && value < 0.01) return '<1%'
  return `${Math.round(value * 100)}%`
}

export function ClientSelector({
  selectedIdx,
  onSelect,
}: {
  selectedIdx: number
  onSelect: (idx: number) => void
}) {
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    cardRefs.current[selectedIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }, [selectedIdx])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {PROFILES.map((profile, index) => {
        const active = selectedIdx === index
        return (
          <button
            key={profile.id}
            ref={(element) => {
              cardRefs.current[index] = element
            }}
            type="button"
            onClick={() => onSelect(index)}
            className={`profile-picker-card group h-full w-full rounded-[1.25rem] px-4 py-4 flex items-center gap-3 text-left card-shadow-hover ${
              active ? 'profile-picker-card--active' : ''
            }`}
            style={{ outlineColor: 'var(--color-sdm-primary)' }}
          >
            <div className="profile-picker-card__avatar-wrap shrink-0">
              <div className="profile-picker-card__avatar" style={{ background: profile.avatarBg }}>
                <img src={profile.avatar} alt="" className="w-full h-full object-cover object-center" loading="lazy" decoding="async" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[15px] leading-tight tracking-tight truncate" style={{ color: colors.text.primary }}>
                {formatRubles(profile.monthlyIncomeRub)}
              </div>
              <div className="text-[13px] mt-0.5 leading-snug truncate font-medium" style={{ color: colors.text.secondary }}>
                {profile.info}, {profile.age} лет
              </div>
              <div className="text-[12px] mt-1 leading-snug font-medium truncate" style={{ color: colors.text.muted }}>
                квантиль {formatIncomeQuantile(profile.incomeQuantile)}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
