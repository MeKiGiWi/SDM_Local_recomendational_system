import type { ProductCategory } from '../../types'
import { getCategoryGlyph } from '../../config/categoryGlyphs'
import { GlyphBadge } from './GlyphBadge'

export function getCategoryVisual(category: string) {
  return getCategoryGlyph(category)
}

export function CategoryGlyph({
  category,
  variant = 'card',
}: {
  category: ProductCategory | string
  variant?: 'hero' | 'card'
}) {
  const { Glyph, tone, heroTone } = getCategoryGlyph(category)
  const t = variant === 'hero' ? heroTone : tone
  const iconSize = variant === 'hero' ? 30 : 22

  return (
    <GlyphBadge variant={variant} tone={t}>
      <Glyph size={iconSize} className="glyph-badge__icon" />
    </GlyphBadge>
  )
}
