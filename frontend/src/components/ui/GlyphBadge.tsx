import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

export type GlyphTone = {
  /** Main glyph color */
  fg: string
  /** Badge background (gradient stops as CSS) */
  bg: string
  /** Optional ring / glow */
  ring?: string
}

type Variant = 'hero' | 'card' | 'trait' | 'income'

const VARIANT_CLASS: Record<Variant, string> = {
  hero: 'glyph-badge glyph-badge--hero',
  card: 'glyph-badge glyph-badge--card',
  trait: 'glyph-badge glyph-badge--trait',
  income: 'glyph-badge glyph-badge--income',
}

export function GlyphBadge({
  variant,
  tone,
  children,
  className,
}: {
  variant: Variant
  tone: GlyphTone
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(VARIANT_CLASS[variant], className)}
      style={{
        ['--glyph-fg' as string]: tone.fg,
        ['--glyph-bg' as string]: tone.bg,
        ...(tone.ring ? { ['--glyph-ring' as string]: tone.ring } : {}),
      }}
    >
      {children}
    </span>
  )
}
