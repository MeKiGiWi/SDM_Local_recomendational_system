import { colors } from '../../config/theme'

export function Header() {
  return (
    <header className="site-header sticky top-0 z-50">
      <div className="page-container">
        <div className="flex items-center min-h-[60px] sm:min-h-[68px] gap-3.5 py-2.5 sm:py-0">
          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-[14px] flex items-center justify-center font-bold text-[15px] shrink-0"
            style={{
              background: `linear-gradient(145deg, ${colors.primary.DEFAULT}, ${colors.primary.dark})`,
              color: colors.text.white,
              boxShadow: `0 4px 12px ${colors.primary.glow}`,
            }}
          >
            С
          </div>
          <div className="min-w-0">
            <div
              className="text-[15px] sm:text-base font-bold leading-tight tracking-tight truncate"
              style={{ color: colors.text.primary }}
            >
              СДМ Хакатон
            </div>
            <div
              className="text-[11px] sm:text-xs leading-snug mt-0.5 line-clamp-2 sm:line-clamp-none font-medium"
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
