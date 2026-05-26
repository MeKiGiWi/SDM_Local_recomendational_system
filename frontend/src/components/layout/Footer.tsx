import { colors } from '../../config/theme'

export function Footer() {
  return (
    <footer
      className="mt-auto"
      style={{
        background: colors.surface,
        borderTop: `1px solid ${colors.border}`,
      }}
    >
      <div className="page-container py-5 text-center text-xs font-medium" style={{ color: colors.text.muted }}>
        © 2026 СДМ Хакатон
      </div>
    </footer>
  )
}
