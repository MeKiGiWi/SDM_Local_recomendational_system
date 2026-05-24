import type { Currency, AccountType } from '../../../store/userInputStore'
import { colors, formatRubles } from '../../../config/theme'
import { GraduationIcon, BriefcaseIcon, RocketIcon, BuildingIcon } from '../../ui/Icons'

export interface ProfileData {
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
    age: 20,
    balance: 15000,
    monthlyIncome: 15000,
    accountType: 'card',
    currency: 'RUB',
    info: 'Студент',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Matvey&backgroundColor=b6e3f4',
    avatarBg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
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
    age: 35,
    balance: 350000,
    monthlyIncome: 120000,
    accountType: 'current',
    currency: 'RUB',
    info: 'Менеджер',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Artem&backgroundColor=c0aede',
    avatarBg: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
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
    age: 28,
    balance: 1500000,
    monthlyIncome: 350000,
    accountType: 'savings',
    currency: 'RUB',
    info: 'Предприниматель',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Danya&backgroundColor=ffd5dc',
    avatarBg: 'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)',
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
    balance: 5000000,
    monthlyIncome: 5000000,
    accountType: 'deposit',
    currency: 'RUB',
    info: 'Топ-менеджер',
    avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Mikhail&backgroundColor=d1d4f9',
    avatarBg: 'linear-gradient(135deg, #DBEAFE 0%, #93C5FD 100%)',
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

const SELECTOR_COLORS = [
  { bg: '#EBF2FF', icon: '#2563EB' },
  { bg: '#F5F3FF', icon: '#7C3AED' },
  { bg: '#FFF7ED', icon: '#EA580C' },
  { bg: '#ECFDF5', icon: '#059669' },
]

export function ClientSelector({
  selectedIdx,
  onSelect,
}: {
  selectedIdx: number
  onSelect: (idx: number) => void
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {PROFILES.map((p, idx) => {
        const active = selectedIdx === idx
        const Icon = SELECTOR_ICONS[idx]
        const palette = SELECTOR_COLORS[idx]

        return (
          <button
            key={p.name}
            onClick={() => onSelect(idx)}
            className="group h-full w-full rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-3.5 transition-all duration-200 cursor-pointer card-shadow-hover animate-fade-in-up text-left"
            style={{
              animationDelay: `${idx * 60}ms`,
              background: colors.surface,
              border: active ? `2px solid ${colors.primary.DEFAULT}` : `1px solid ${colors.border}`,
              boxShadow: active ? colors.shadow.card : undefined,
            }}
          >
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: palette.bg, color: palette.icon }}
            >
              <Icon size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[15px] leading-tight truncate" style={{ color: colors.text.primary }}>
                {p.name}
              </div>
              <div className="text-[13px] mt-0.5 leading-snug truncate" style={{ color: colors.text.secondary }}>
                {p.info}, {p.age} лет
              </div>
              <div className="text-[12px] sm:text-[13px] mt-0.5 leading-snug" style={{ color: colors.text.muted }}>
                <span className="sm:hidden block">Доход {formatRubles(p.monthlyIncome)}</span>
                <span className="hidden sm:block truncate">Доход {formatRubles(p.monthlyIncome)} / мес.</span>
              </div>
            </div>

            <div
              className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 self-center"
              style={{ borderColor: active ? colors.primary.DEFAULT : '#CBD5E1' }}
              aria-hidden
            >
              {active && (
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.primary.DEFAULT }} />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
