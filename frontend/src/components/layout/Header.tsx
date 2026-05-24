import { colors } from '../../config/theme'

export function Header() {
  return (
    <header
      className="bg-white sticky top-0 z-50"
      style={{ borderBottom: `1px solid ${colors.border}` }}
    >
      <div className="page-container">
        <div className="flex items-center min-h-[56px] sm:min-h-[64px] gap-3 py-2 sm:py-0">
          <div
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0"
            style={{ background: `linear-gradient(135deg, ${colors.primary.DEFAULT}, ${colors.primary.dark})` }}
          >
            С
          </div>
          <div className="min-w-0">
            <div className="text-sm sm:text-[15px] font-bold leading-tight truncate" style={{ color: colors.text.primary }}>
              СДМ Хакатон
            </div>
            <div
              className="text-[11px] sm:text-xs leading-tight mt-0.5 line-clamp-2 sm:line-clamp-none"
              style={{ color: colors.text.secondary }}
            >
              Система рекомендаций банковских продуктов
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
