import { useEffect, useRef } from 'react'
import type { Currency, AccountType } from '../../../store/userInputStore'
import { colors, formatRubles } from '../../../config/theme'
import { PORTRAITS } from '../../../config/portraits'
import { GraduationIcon, BriefcaseIcon, RocketIcon, BuildingIcon } from '../../ui/Icons'

import type { ModelProfileFields } from '../../../utils/profileToModel'

export interface ProfileData extends ModelProfileFields {
  name: string
  age: number
  balance: number
  monthlyIncome: number
  accountType: AccountType
  currency: Currency
  info: string
  avatar: string
  avatarBg: string
  description: string
  characteristics: { label: string; icon: 'trend' | 'shield' | 'droplet' | 'target' | 'rocket' | 'chart' | 'phone' | 'balance' }[]
}

export const PROFILES: ProfileData[] = [
  {
    name: 'Матвей',
    age: 21,
    balance: 45718,
    monthlyIncome: 45943,
    accountType: 'card',
    currency: 'RUB',
    sex: 1,
    seniorityMonths: 6,
    isNewCustomer: 0,
    segment: 'STUDENTS',
    regionName: 'MADRID',
    info: 'Студент',
    avatar: PORTRAITS.matvey,
    avatarBg: 'linear-gradient(135deg, oklch(92% 0.06 250) 0%, oklch(86% 0.08 264) 100%)',
    description: 'Молодой студент. Предпочитает современные цифровые решения.',
    characteristics: [
      { label: 'Небольшой доход', icon: 'chart' },
      { label: 'Молодой возраст', icon: 'rocket' },
      { label: 'Активный образ', icon: 'trend' },
      { label: 'Цифровые привычки', icon: 'phone' },
    ],
  },
  {
    name: 'Артем',
    age: 29,
    balance: 75173,
    monthlyIncome: 74997,
    accountType: 'current',
    currency: 'RUB',
    sex: 1,
    seniorityMonths: 23,
    isNewCustomer: 0,
    segment: 'INDIVIDUALS',
    regionName: 'MADRID',
    info: 'Менеджер',
    avatar: PORTRAITS.artem,
    avatarBg: 'linear-gradient(135deg, oklch(94% 0.05 295) 0%, oklch(88% 0.08 295) 100%)',
    description: 'Уверенный профессионал. Ценит баланс между доходом и надежностью.',
    characteristics: [
      { label: 'Стабильный доход', icon: 'trend' },
      { label: 'Надёжный заёмщик', icon: 'shield' },
      { label: 'Сбалансированный', icon: 'balance' },
      { label: 'Кредитная история', icon: 'chart' },
    ],
  },
  {
    name: 'Даня',
    age: 42,
    balance: 101713,
    monthlyIncome: 100602,
    accountType: 'savings',
    currency: 'RUB',
    sex: 1,
    seniorityMonths: 62,
    isNewCustomer: 0,
    segment: 'INDIVIDUALS',
    regionName: 'MADRID',
    info: 'Предприниматель',
    avatar: PORTRAITS.danya,
    avatarBg: 'linear-gradient(135deg, oklch(96% 0.05 55) 0%, oklch(90% 0.09 45) 100%)',
    description: 'Активный предприниматель. Ищет возможности для роста капитала.',
    characteristics: [
      { label: 'Высокий доход', icon: 'trend' },
      { label: 'Готов к риску', icon: 'target' },
      { label: 'Развитие бизнеса', icon: 'rocket' },
      { label: 'Активные инвестиции', icon: 'chart' },
    ],
  },
  {
    name: 'Михаил',
    age: 55,
    balance: 163881,
    monthlyIncome: 161283,
    accountType: 'deposit',
    currency: 'RUB',
    sex: 1,
    seniorityMonths: 170,
    isNewCustomer: 0,
    segment: 'INDIVIDUALS',
    regionName: 'MADRID',
    info: 'Топ-менеджер',
    avatar: PORTRAITS.mikhail,
    avatarBg: 'linear-gradient(135deg, oklch(93% 0.04 160) 0%, oklch(86% 0.08 160) 100%)',
    description: 'Опытный управленец с высоким доходом. Ценит надежность и сохранность капитала.',
    characteristics: [
      { label: 'Высокий доход', icon: 'trend' },
      { label: 'Консервативный', icon: 'shield' },
      { label: 'Нужна ликвидность', icon: 'droplet' },
      { label: 'Долгосрочные цели', icon: 'target' },
    ],
  },
]

const SELECTOR_ICONS = [GraduationIcon, BriefcaseIcon, RocketIcon, BuildingIcon]

const SELECTOR_THEMES = [
  {
    wash: 'oklch(96% 0.04 264 / 0.55)',
    accent: colors.accent.blue.icon,
    iconBg: colors.accent.blue.bg,
  },
  {
    wash: 'oklch(96% 0.04 295 / 0.5)',
    accent: colors.accent.purple.icon,
    iconBg: colors.accent.purple.bg,
  },
  {
    wash: 'oklch(97% 0.05 55 / 0.45)',
    accent: colors.accent.orange.icon,
    iconBg: colors.accent.orange.bg,
  },
  {
    wash: 'oklch(96% 0.04 160 / 0.45)',
    accent: colors.accent.green.icon,
    iconBg: colors.accent.green.bg,
  },
]

export function ClientSelector({
  selectedIdx,
  onSelect,
}: {
  selectedIdx: number
  onSelect: (idx: number) => void
}) {
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    cardRefs.current[selectedIdx]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
  }, [selectedIdx])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {PROFILES.map((p, idx) => {
        const active = selectedIdx === idx
        const Icon = SELECTOR_ICONS[idx]
        const theme = SELECTOR_THEMES[idx]

        return (
          <button
            key={p.name}
            ref={(el) => {
              cardRefs.current[idx] = el
            }}
            type="button"
            onClick={() => onSelect(idx)}
            aria-pressed={active}
            className={`profile-picker-card group h-full w-full rounded-[1.25rem] px-4 py-3.5 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-3.5 cursor-pointer card-shadow-hover animate-fade-in-up text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
              active ? 'profile-picker-card--active' : ''
            }`}
            style={{
              animationDelay: `${idx * 60}ms`,
              outlineColor: 'var(--color-sdm-primary)',
              ['--profile-wash' as string]: theme.wash,
              ['--profile-accent' as string]: theme.accent,
            }}
          >
            <div className="profile-picker-card__avatar-wrap shrink-0">
              <div
                className="profile-picker-card__avatar"
                style={{ background: p.avatarBg }}
              >
                <img
                  src={p.avatar}
                  alt=""
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div
                className="profile-picker-card__badge"
                style={{ background: theme.iconBg, color: theme.accent }}
              >
                <Icon size={14} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-bold text-[15px] leading-tight tracking-tight truncate" style={{ color: colors.text.primary }}>
                {p.name}
              </div>
              <div className="text-[13px] mt-0.5 leading-snug truncate font-medium" style={{ color: colors.text.secondary }}>
                {p.info}, {p.age} лет
              </div>
              <div className="text-[12px] sm:text-[13px] mt-1 leading-snug font-medium tabular-nums" style={{ color: colors.text.muted }}>
                <span className="sm:hidden block">Доход {formatRubles(p.monthlyIncome)}</span>
                <span className="hidden sm:block truncate">Доход {formatRubles(p.monthlyIncome)} / мес.</span>
              </div>
            </div>

            <div
              className={`profile-picker-card__radio shrink-0 self-center ${active ? 'profile-picker-card__radio--on' : ''}`}
              aria-hidden
            />
          </button>
        )
      })}
    </div>
  )
}
