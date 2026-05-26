import { colors } from './theme'
import {
  GlyphDeposit,
  GlyphLoan,
  GlyphCard,
  GlyphBusiness,
  GlyphVault,
  GlyphServices,
  GlyphProduct,
} from '../components/ui/BankGlyphs'

type GlyphComponent = typeof GlyphDeposit

export type CategoryGlyphMeta = {
  Glyph: GlyphComponent
  tone: { fg: string; bg: string; ring?: string }
  heroTone: { fg: string; bg: string; ring?: string }
}

const blue = {
  fg: colors.accent.blue.icon,
  bg: `linear-gradient(145deg, oklch(96% 0.04 264), oklch(92% 0.07 264))`,
  ring: 'oklch(50% 0.16 264 / 0.2)',
}
const green = {
  fg: colors.accent.green.icon,
  bg: `linear-gradient(145deg, oklch(96.5% 0.04 155), oklch(92% 0.07 155))`,
  ring: 'oklch(52% 0.14 160 / 0.2)',
}
const purple = {
  fg: colors.accent.purple.icon,
  bg: `linear-gradient(145deg, oklch(96% 0.04 295), oklch(91% 0.08 295))`,
  ring: 'oklch(48% 0.16 295 / 0.2)',
}
const orange = {
  fg: colors.accent.orange.icon,
  bg: `linear-gradient(145deg, oklch(97% 0.04 55), oklch(93% 0.08 45))`,
  ring: 'oklch(58% 0.14 55 / 0.2)',
}
const gold = {
  fg: colors.accent.yellow.text,
  bg: `linear-gradient(145deg, oklch(97% 0.05 95), oklch(93% 0.09 85))`,
  ring: 'oklch(52% 0.12 85 / 0.22)',
}
const neutral = {
  fg: colors.text.secondary,
  bg: `linear-gradient(145deg, oklch(96% 0.012 252), oklch(93% 0.018 252))`,
  ring: 'oklch(52% 0.03 258 / 0.15)',
}

const heroWhite = {
  fg: 'oklch(99% 0.005 252)',
  bg: `linear-gradient(155deg, oklch(100% 0 0 / 0.28), oklch(100% 0 0 / 0.12))`,
  ring: 'oklch(100% 0 0 / 0.35)',
}

export const CATEGORY_GLYPHS: Record<string, CategoryGlyphMeta> = {
  deposits_and_savings_accounts_individuals: {
    Glyph: GlyphDeposit,
    tone: blue,
    heroTone: heroWhite,
  },
  loans_individuals: {
    Glyph: GlyphLoan,
    tone: green,
    heroTone: heroWhite,
  },
  debit_cards: {
    Glyph: GlyphCard,
    tone: purple,
    heroTone: heroWhite,
  },
  rko_business_packages: {
    Glyph: GlyphBusiness,
    tone: orange,
    heroTone: heroWhite,
  },
  deposits_business: {
    Glyph: GlyphVault,
    tone: gold,
    heroTone: heroWhite,
  },
  additional_business_services: {
    Glyph: GlyphServices,
    tone: neutral,
    heroTone: heroWhite,
  },
}

const DEFAULT: CategoryGlyphMeta = {
  Glyph: GlyphProduct,
  tone: neutral,
  heroTone: heroWhite,
}

export function getCategoryGlyph(category: string): CategoryGlyphMeta {
  return CATEGORY_GLYPHS[category] ?? DEFAULT
}
