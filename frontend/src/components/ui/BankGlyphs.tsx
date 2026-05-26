/** Filled duotone glyphs for banking UI (categories + client traits). */
type G = { className?: string; size?: number }

function Svg({ size, className, children }: G & { children: React.ReactNode }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      {children}
    </svg>
  )
}

/* ── Product categories ── */

export function GlyphDeposit({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <path
        fill="currentColor"
        d="M12 3 4 7.2v2.3L12 14l8-4.5V7.2L12 3Zm0 2.4 5.2 2.9L12 11.2 6.8 8.3 12 5.4Z"
      />
      <path
        fill="currentColor"
        opacity="0.38"
        d="M5 11.5v5.8L12 21l7-3.7v-5.8l-2 .9v4.1L12 18.6 7 15.5v-4.1l-2-.9Z"
      />
      <circle cx="12" cy="9.5" r="1.6" fill="currentColor" />
    </Svg>
  )
}

export function GlyphLoan({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <path
        fill="currentColor"
        opacity="0.35"
        d="M6 4h9l3 3v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
      />
      <path fill="currentColor" d="M8 4h8l3 3H8V4Zm-1 8h6v1.5H7V12Zm0 3h4v1.5H7V15Z" />
      <circle cx="16.5" cy="16.5" r="4.5" fill="currentColor" />
      <path
        fill="var(--glyph-on-accent, #fff)"
        d="M15.1 16.5h.9v-2.2h1.1v2.2h.9v1h-.9v.9h-1.1v-.9h-.9v-1Z"
      />
    </Svg>
  )
}

export function GlyphCard({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <rect x="2" y="5" width="20" height="14" rx="3" fill="currentColor" opacity="0.32" />
      <rect x="2" y="5" width="20" height="14" rx="3" fill="currentColor" />
      <rect x="2" y="9.5" width="20" height="3" fill="currentColor" opacity="0.22" />
      <rect x="5" y="14" width="5" height="3.5" rx="1" fill="var(--glyph-on-accent, oklch(99% 0.005 252))" opacity="0.9" />
      <rect x="13" y="14.8" width="6" height="1.2" rx="0.6" fill="var(--glyph-on-accent, oklch(99% 0.005 252))" opacity="0.75" />
    </Svg>
  )
}

export function GlyphBusiness({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <path fill="currentColor" opacity="0.34" d="M4 20V9l8-4 8 4v11H4Z" />
      <path fill="currentColor" d="M6 20V10.2l6-3 6 3V20H6Zm3-8.5h6v1.5H9V11.5Zm0 3h6v1.5H9v-1.5Z" />
      <path fill="currentColor" d="M10 20v-4h4v4h-4Z" />
    </Svg>
  )
}

export function GlyphVault({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" opacity="0.32" />
      <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
      <circle cx="12" cy="12" r="5" fill="var(--glyph-on-accent, oklch(99% 0.005 252))" opacity="0.92" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      <rect x="11" y="7" width="2" height="5" rx="1" fill="currentColor" />
    </Svg>
  )
}

export function GlyphServices({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <path fill="currentColor" opacity="0.34" d="M8 3h8v3H8V3Z" />
      <path fill="currentColor" d="M7 5h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path fill="var(--glyph-on-accent, oklch(99% 0.005 252))" d="M8.5 11h7v1.4h-7V11Zm0 3.2h5v1.4h-5v-1.4Z" opacity="0.9" />
    </Svg>
  )
}

export function GlyphProduct({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <path fill="currentColor" opacity="0.34" d="M12 2 3 7v10l9 5 9-5V7l-9-5Z" />
      <path fill="currentColor" d="M12 4.2 5.5 8 12 11.8 18.5 8 12 4.2Zm-6.5 6.3L12 14l6.5-3.5L12 17.5 5.5 14Z" />
    </Svg>
  )
}

/* ── Client portrait traits ── */

export function GlyphIncomeTrend({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <rect x="3" y="14" width="4" height="7" rx="1" fill="currentColor" opacity="0.35" />
      <rect x="10" y="10" width="4" height="11" rx="1" fill="currentColor" opacity="0.55" />
      <rect x="17" y="6" width="4" height="15" rx="1" fill="currentColor" />
      <path fill="currentColor" d="m16 8 2-2 2 2 1.2-1.2L18 4l-3.2 3.2L16 8Z" />
    </Svg>
  )
}

export function GlyphShieldCheck({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <path fill="currentColor" opacity="0.32" d="M12 2 4 6v6c0 5.2 3.4 8.8 8 10 4.6-1.2 8-4.8 8-10V6l-8-4Z" />
      <path fill="currentColor" d="M12 2 4 6v6c0 5.2 3.4 8.8 8 10 4.6-1.2 8-4.8 8-10V6l-8-4Z" />
      <path
        fill="var(--glyph-on-accent, oklch(99% 0.005 252))"
        d="m10.2 12.2 1.6 1.6 3.8-4"
        stroke="var(--glyph-on-accent, oklch(99% 0.005 252))"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function GlyphLiquidity({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <circle cx="8" cy="14" r="4" fill="currentColor" opacity="0.38" />
      <circle cx="14" cy="12" r="4" fill="currentColor" opacity="0.58" />
      <circle cx="17" cy="16" r="4" fill="currentColor" />
      <path fill="currentColor" d="M6 7h12v1.5H6V7Zm2-3h8v1.5H8V4Z" opacity="0.7" />
    </Svg>
  )
}

export function GlyphGoal({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.3" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5.5" fill="currentColor" opacity="0.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path fill="currentColor" d="M12 2v3M12 19v3M2 12h3M19 12h3" opacity="0.45" stroke="currentColor" strokeWidth="0" />
    </Svg>
  )
}

export function GlyphGrowth({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <path fill="currentColor" opacity="0.32" d="M4 20h16v2H4v-2Z" />
      <path fill="currentColor" d="M6 16.5 11 11l3.5 3.5L20 9l1.4 1.4L14.5 17 11 13.5 7.4 17 6 16.5Z" />
      <circle cx="18" cy="7" r="2.5" fill="currentColor" />
    </Svg>
  )
}

export function GlyphAnalytics({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <path fill="currentColor" d="M5 4h3v16H5V4Zm5.5 6h3v10h-3v-10ZM16 9h3v11h-3V9Z" opacity="0.4" />
      <path fill="currentColor" d="M5 8h3v12H5V8Zm5.5 4h3v8h-3v-8ZM16 6h3v14h-3V6Z" />
    </Svg>
  )
}

export function GlyphDigital({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <rect x="7" y="2" width="10" height="20" rx="2.5" fill="currentColor" opacity="0.32" />
      <rect x="7" y="2" width="10" height="20" rx="2.5" fill="currentColor" />
      <circle cx="12" cy="18.5" r="1.2" fill="var(--glyph-on-accent, oklch(99% 0.005 252))" />
      <rect x="9" y="5" width="6" height="9" rx="1" fill="var(--glyph-on-accent, oklch(99% 0.005 252))" opacity="0.88" />
    </Svg>
  )
}

export function GlyphBalance({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <path fill="currentColor" d="M12 3v3M5 8h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path fill="currentColor" opacity="0.35" d="M6 8 4 20h5L6 8Zm12 0 2 12h-5l-2-12Z" />
      <path fill="currentColor" d="M6 8 5 18h4l1-10Zm12 0 1 10h-4l-1-10Z" />
      <circle cx="7.5" cy="18" r="2" fill="currentColor" />
      <circle cx="16.5" cy="18" r="2" fill="currentColor" />
    </Svg>
  )
}

export function GlyphWallet({ size = 24, className }: G) {
  return (
    <Svg size={size} className={className}>
      <path fill="currentColor" opacity="0.34" d="M3 7a3 3 0 0 1 3-3h12v16H6a3 3 0 0 1-3-3V7Z" />
      <path fill="currentColor" d="M6 4h13a2 2 0 0 1 2 2v2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm11 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </Svg>
  )
}
