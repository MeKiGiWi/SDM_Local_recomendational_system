import { colors } from './theme'
import type { ProfileData } from '../components/features/advertising/ClientSelector'
import {
  GlyphIncomeTrend,
  GlyphShieldCheck,
  GlyphLiquidity,
  GlyphGoal,
  GlyphGrowth,
  GlyphAnalytics,
  GlyphDigital,
  GlyphBalance,
} from '../components/ui/BankGlyphs'

type TraitIcon = ProfileData['characteristics'][number]['icon']

const TRAIT_GLYPHS: Record<
  TraitIcon,
  { Glyph: typeof GlyphIncomeTrend; tone: { fg: string; bg: string } }
> = {
  trend: {
    Glyph: GlyphIncomeTrend,
    tone: { fg: colors.accent.green.icon, bg: `linear-gradient(145deg, ${colors.accent.green.bg}, oklch(92% 0.06 155))` },
  },
  shield: {
    Glyph: GlyphShieldCheck,
    tone: { fg: colors.accent.blue.icon, bg: `linear-gradient(145deg, ${colors.accent.blue.bg}, oklch(92% 0.06 264))` },
  },
  droplet: {
    Glyph: GlyphLiquidity,
    tone: { fg: colors.accent.blue.icon, bg: `linear-gradient(145deg, ${colors.accent.blue.bg}, oklch(91% 0.07 250))` },
  },
  target: {
    Glyph: GlyphGoal,
    tone: { fg: colors.accent.purple.icon, bg: `linear-gradient(145deg, ${colors.accent.purple.bg}, oklch(91% 0.07 295))` },
  },
  rocket: {
    Glyph: GlyphGrowth,
    tone: { fg: colors.accent.orange.icon, bg: `linear-gradient(145deg, ${colors.accent.orange.bg}, oklch(93% 0.07 45))` },
  },
  chart: {
    Glyph: GlyphAnalytics,
    tone: { fg: colors.accent.green.icon, bg: `linear-gradient(145deg, ${colors.accent.green.bg}, oklch(92% 0.06 155))` },
  },
  phone: {
    Glyph: GlyphDigital,
    tone: { fg: colors.accent.blue.icon, bg: `linear-gradient(145deg, ${colors.accent.blue.bg}, oklch(92% 0.06 264))` },
  },
  balance: {
    Glyph: GlyphBalance,
    tone: { fg: colors.accent.purple.icon, bg: `linear-gradient(145deg, ${colors.accent.purple.bg}, oklch(91% 0.07 295))` },
  },
}

export function getTraitGlyph(icon: TraitIcon) {
  return TRAIT_GLYPHS[icon]
}
