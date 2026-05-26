import type { ProfileData } from './ClientSelector'
import { colors, formatRubles } from '../../../config/theme'
import { getTraitGlyph } from '../../../config/traitGlyphs'
import { GlyphWallet } from '../../ui/BankGlyphs'
import { GlyphBadge } from '../../ui/GlyphBadge'

const INCOME_TONE = {
  fg: colors.primary.DEFAULT,
  bg: `linear-gradient(145deg, ${colors.primary.bg}, oklch(94% 0.05 264))`,
  ring: 'oklch(47.5% 0.19 264 / 0.15)',
}

export function ClientProfile({ profile }: { profile: ProfileData }) {
  return (
    <article className="profile-detail surface-panel rounded-[1.25rem] h-full flex flex-col animate-fade-in-up w-full overflow-hidden">
      <div
        className="profile-detail__hero px-4 sm:px-5 pt-5 sm:pt-6 pb-4 text-center"
        style={{ background: profile.avatarBg }}
      >
        <div className="profile-detail__avatar mx-auto">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
        </div>
        <h2 className="text-xl sm:text-[1.35rem] font-bold tracking-tight mt-3" style={{ color: colors.text.primary }}>
          {profile.name}
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          <span className="profile-detail__role">{profile.info}</span>
          <span className="profile-detail__age">{profile.age} лет</span>
        </div>
      </div>

      <div className="flex flex-col p-4 sm:p-5 lg:p-6 pt-4">
        <div className="profile-detail__income mb-4">
          <GlyphBadge variant="income" tone={INCOME_TONE}>
            <GlyphWallet size={20} className="glyph-badge__icon" />
          </GlyphBadge>
          <div className="min-w-0 flex-1 text-left">
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>
              Ежемесячный доход
            </div>
            <div className="text-lg sm:text-xl font-bold tracking-tight tabular-nums mt-0.5" style={{ color: colors.text.primary }}>
              {formatRubles(profile.monthlyIncome)}
            </div>
          </div>
        </div>

        <p className="text-sm leading-relaxed mb-5 text-left" style={{ color: colors.text.secondary }}>
          {profile.description}
        </p>

        <p className="section-label mb-3">Портрет клиента</p>
        <ul className="profile-detail__traits">
          {profile.characteristics.map((ch) => {
            const { Glyph, tone } = getTraitGlyph(ch.icon)
            return (
              <li key={ch.label} className="profile-detail__trait">
                <GlyphBadge variant="trait" tone={tone}>
                  <Glyph size={18} className="glyph-badge__icon" />
                </GlyphBadge>
                <span className="profile-detail__trait-label">{ch.label}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </article>
  )
}
