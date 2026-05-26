/** Design tokens — aligned with OKLCH values in index.css */
export const colors = {
  bg: 'var(--color-sdm-bg)',
  surface: 'var(--color-sdm-surface)',
  border: 'var(--color-sdm-border)',
  borderLight: 'var(--color-sdm-border-subtle)',

  primary: {
    DEFAULT: 'var(--color-sdm-primary)',
    dark: 'var(--color-sdm-primary-dark)',
    light: 'var(--color-sdm-primary-light)',
    bg: 'var(--color-sdm-primary-bg)',
    bgLight: 'var(--color-sdm-primary-bg-soft)',
    glow: 'oklch(47.5% 0.19 264 / 0.22)',
  },

  text: {
    primary: 'var(--color-sdm-text)',
    secondary: 'var(--color-sdm-text-secondary)',
    muted: 'var(--color-sdm-text-muted)',
    light: 'oklch(96% 0.01 252)',
    white: 'oklch(99% 0.005 252)',
  },

  accent: {
    green: { bg: 'oklch(96.5% 0.04 155)', icon: 'oklch(52% 0.14 160)' },
    blue: { bg: 'oklch(96% 0.035 264)', icon: 'oklch(50% 0.16 264)' },
    purple: { bg: 'oklch(96% 0.04 295)', icon: 'oklch(48% 0.16 295)' },
    orange: { bg: 'oklch(97% 0.04 55)', icon: 'oklch(58% 0.16 45)' },
    yellow: { bg: 'oklch(96.5% 0.06 95)', text: 'oklch(52% 0.12 85)' },
  },

  segmented: {
    bg: 'oklch(94.5% 0.015 252)',
    activeShadow: 'oklch(47.5% 0.19 264 / 0.14)',
  },

  shadow: {
    card: 'var(--shadow-card)',
    cardHover: 'var(--shadow-card-hover)',
    hero: 'var(--shadow-hero)',
    header: 'var(--shadow-header)',
  },

  rank: [
    { from: 'var(--color-sdm-primary)', to: 'var(--color-sdm-primary-dark)', shadow: 'var(--shadow-hero)' },
    { from: 'oklch(52% 0.14 160)', to: 'oklch(45% 0.12 160)', shadow: 'oklch(52% 0.14 160 / 0.22)' },
    { from: 'oklch(48% 0.16 295)', to: 'oklch(42% 0.14 295)', shadow: 'oklch(48% 0.16 295 / 0.22)' },
    { from: 'oklch(58% 0.14 55)', to: 'oklch(50% 0.12 50)', shadow: 'oklch(58% 0.14 55 / 0.22)' },
    { from: 'oklch(52% 0.18 15)', to: 'oklch(45% 0.16 15)', shadow: 'oklch(52% 0.18 15 / 0.22)' },
  ],
} as const

export function formatRubles(n: number): string {
  return `${n.toLocaleString('ru-RU')} ₽`
}
