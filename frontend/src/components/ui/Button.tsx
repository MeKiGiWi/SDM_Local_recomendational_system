import { cn } from '../../utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-xl font-semibold transition-[background-color,box-shadow,transform,color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'

  const variants = {
    primary:
      'bg-[var(--color-sdm-primary)] text-[var(--color-sdm-text-white)] hover:bg-[var(--color-sdm-primary-dark)] focus-visible:outline-[var(--color-sdm-primary)] shadow-[0_2px_8px_oklch(47.5%_0.19_264/0.25)]',
    secondary:
      'bg-[var(--color-sdm-primary-bg)] text-[var(--color-sdm-text)] hover:bg-[var(--color-sdm-primary-bg-soft)] focus-visible:outline-[var(--color-sdm-primary)]',
    outline:
      'border border-[var(--color-sdm-border)] text-[var(--color-sdm-text)] bg-[var(--color-sdm-surface)] hover:bg-[var(--color-sdm-bg)] focus-visible:outline-[var(--color-sdm-primary)]',
    ghost:
      'text-[var(--color-sdm-text-secondary)] hover:bg-[var(--color-sdm-primary-bg-soft)] focus-visible:outline-[var(--color-sdm-primary)]',
    danger:
      'bg-[oklch(52%_0.18_25)] text-[var(--color-sdm-text-white)] hover:bg-[oklch(45%_0.16_25)] focus-visible:outline-[oklch(52%_0.18_25)]',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
