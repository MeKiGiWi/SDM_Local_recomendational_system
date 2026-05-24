import type { ProfileData } from './ClientSelector'
import { colors, formatRubles } from '../../../config/theme'
import { WalletIcon, TrendUpIcon, ShieldIcon, DropletIcon, TargetIcon } from '../../ui/Icons'

const CHAR_CONFIG: Record<
  ProfileData['characteristics'][number]['icon'],
  { bg: string; color: string; Icon: typeof TrendUpIcon }
> = {
  trend: { bg: colors.accent.green.bg, color: colors.accent.green.icon, Icon: TrendUpIcon },
  shield: { bg: colors.accent.blue.bg, color: colors.accent.blue.icon, Icon: ShieldIcon },
  droplet: { bg: colors.accent.blue.bg, color: colors.accent.blue.icon, Icon: DropletIcon },
  target: { bg: colors.accent.purple.bg, color: colors.accent.purple.icon, Icon: TargetIcon },
  rocket: { bg: colors.accent.orange.bg, color: colors.accent.orange.icon, Icon: TrendUpIcon },
  chart: { bg: colors.accent.green.bg, color: colors.accent.green.icon, Icon: TrendUpIcon },
  phone: { bg: colors.accent.blue.bg, color: colors.accent.blue.icon, Icon: ShieldIcon },
  balance: { bg: colors.accent.purple.bg, color: colors.accent.purple.icon, Icon: TargetIcon },
}

export function ClientProfile({ profile }: { profile: ProfileData }) {
  return (
    <div
      className="bg-white rounded-2xl p-4 sm:p-5 lg:p-6 h-full flex flex-col card-shadow animate-fade-in-up w-full"
      style={{ border: `1px solid ${colors.border}` }}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className="w-20 h-20 sm:w-[88px] sm:h-[88px] rounded-full overflow-hidden mb-3 ring-4 ring-white shadow-md"
          style={{ background: profile.avatarBg }}
        >
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: colors.text.primary }}>
          {profile.name}
        </h2>
        <div
          className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full mt-1.5"
          style={{ background: colors.primary.bg, color: colors.primary.DEFAULT }}
        >
          {profile.info}
        </div>
        <div className="text-sm mt-1.5" style={{ color: colors.text.secondary }}>
          {profile.age} лет
        </div>
      </div>

      <div className="w-full h-px my-4 sm:my-5" style={{ background: colors.border }} />

      <div
        className="flex items-center gap-3 rounded-xl px-3.5 sm:px-4 py-3 mb-4 w-full"
        style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
      >
        <div
          className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: colors.primary.bg, color: colors.primary.DEFAULT }}
        >
          <WalletIcon size={16} />
        </div>
        <div className="text-left min-w-0 flex-1">
          <div className="text-xs" style={{ color: colors.text.muted }}>Ежемесячный доход</div>
          <div className="text-sm sm:text-[15px] font-semibold break-words" style={{ color: colors.text.primary }}>
            {formatRubles(profile.monthlyIncome)}
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed mb-4 sm:mb-5 text-left" style={{ color: colors.text.secondary }}>
        {profile.description}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mt-auto">
        {profile.characteristics.map((ch) => {
          const cfg = CHAR_CONFIG[ch.icon]
          const { Icon } = cfg
          return (
            <div
              key={ch.label}
              className="flex items-center gap-2.5 rounded-xl px-3 py-3 min-h-[52px]"
              style={{ border: `1px solid ${colors.border}`, background: colors.surface }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                <Icon size={15} />
              </div>
              <span className="text-xs font-medium leading-tight" style={{ color: colors.text.primary }}>
                {ch.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
