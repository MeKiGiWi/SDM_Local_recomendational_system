import { cn } from '../../utils/cn'

interface CardProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
  hoverable?: boolean
}

export function Card({ className, children, onClick, hoverable }: CardProps) {
  return (
    <div
      className={cn(
        'bg-[var(--color-sdm-surface)] rounded-2xl border border-[var(--color-sdm-border)] shadow-[var(--shadow-card)]',
        hoverable &&
          'hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--color-sdm-border-subtle)] transition-[box-shadow,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-5 py-4 border-b border-[var(--color-sdm-border-subtle)]', className)}>
      {children}
    </div>
  )
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}
