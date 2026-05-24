export const colors = {
  bg: '#F5F7FB',
  surface: '#FFFFFF',
  border: '#E8ECF2',
  borderLight: '#EAEAEA',

  primary: {
    DEFAULT: '#0056D2',
    dark: '#004BB8',
    light: '#3B82F6',
    bg: '#EBF2FF',
    bgLight: '#F5F9FF',
    glow: 'rgba(0,86,210,0.22)',
  },

  text: {
    primary: '#1A1D26',
    secondary: '#64748B',
    muted: '#94A3B8',
    light: '#F3F4F6',
    white: '#FFFFFF',
  },

  accent: {
    green: { bg: '#ECFDF5', icon: '#10B981' },
    blue: { bg: '#EFF6FF', icon: '#2563EB' },
    purple: { bg: '#F5F3FF', icon: '#7C3AED' },
    orange: { bg: '#FFF7ED', icon: '#F97316' },
    yellow: { bg: '#FEF9C3', text: '#CA8A04' },
  },

  segmented: {
    bg: '#F1F5F9',
    activeShadow: 'rgba(0,86,210,0.12)',
  },

  shadow: {
    card: '0 1px 3px rgba(0,0,0,0.04), 0 6px 16px rgba(0,0,0,0.05)',
    cardHover: '0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)',
    hero: '0 8px 32px rgba(0,86,210,0.28)',
  },

  rank: [
    { from: '#0056D2', to: '#004BB8', shadow: 'rgba(0,86,210,0.28)' },
    { from: '#059669', to: '#047857', shadow: 'rgba(5,150,105,0.25)' },
    { from: '#7C3AED', to: '#6D28D9', shadow: 'rgba(124,58,237,0.25)' },
    { from: '#D97706', to: '#B45309', shadow: 'rgba(217,119,6,0.25)' },
    { from: '#E11D48', to: '#BE123C', shadow: 'rgba(225,29,72,0.25)' },
  ],
} as const

export function formatRubles(n: number): string {
  return `${n.toLocaleString('ru-RU')} ₽`
}
