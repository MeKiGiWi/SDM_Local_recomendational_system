import { cn } from '../../utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const variants = {
  default: 'bg-[var(--color-sdm-primary-bg)] text-[var(--color-sdm-text)]',
  success: 'bg-[oklch(96.5%_0.04_155)] text-[oklch(38%_0.1_160)]',
  warning: 'bg-[oklch(96.5%_0.06_95)] text-[oklch(42%_0.12_85)]',
  danger: 'bg-[oklch(96%_0.04_25)] text-[oklch(42%_0.14_25)]',
  info: 'bg-[var(--color-sdm-primary-bg)] text-[var(--color-sdm-primary)]',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold tracking-wide',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
