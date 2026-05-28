/**
 * Демо-профили: квантили дохода 0.05 / 0.25 / 0.5 / 0.8 по train_wide_with_lags.
 * Пересчитать: python backend/scripts/profiles_from_train_long_quantiles.py --apply
 */
import { PORTRAITS } from './portraits'
import type { AccountType, Currency } from '../store/userInputStore'
import { colors } from './theme'
import type { ModelProfileFields } from '../utils/profileToModel'

export interface ProfileData extends ModelProfileFields {
  name: string
  age: number
  balance: number
  monthlyIncome: number
  accountType: AccountType
  currency: Currency
  info: string
  avatar: number
  avatarBg: [string, string]
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
    avatarBg: ['#e8ecf8', '#d4dcf0'],
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
    avatarBg: ['#f0e8f8', '#e0d4f0'],
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
    avatarBg: ['#fff4e6', '#fce8d4'],
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
    avatarBg: ['#e8f8ef', '#d4efe0'],
    description: 'Опытный управленец с высоким доходом. Ценит надежность и сохранность капитала.',
    characteristics: [
      { label: 'Высокий доход', icon: 'trend' },
      { label: 'Консервативный', icon: 'shield' },
      { label: 'Нужна ликвидность', icon: 'droplet' },
      { label: 'Долгосрочные цели', icon: 'target' },
    ],
  },
]

export const SELECTOR_THEMES = [
  {
    wash: 'rgba(61, 95, 196, 0.08)',
    accent: colors.accent.blue.icon,
    iconBg: colors.accent.blue.bg,
  },
  {
    wash: 'rgba(124, 77, 204, 0.08)',
    accent: colors.accent.purple.icon,
    iconBg: colors.accent.purple.bg,
  },
  {
    wash: 'rgba(217, 122, 26, 0.08)',
    accent: colors.accent.orange.icon,
    iconBg: colors.accent.orange.bg,
  },
  {
    wash: 'rgba(45, 138, 92, 0.08)',
    accent: colors.accent.green.icon,
    iconBg: colors.accent.green.bg,
  },
] as const
