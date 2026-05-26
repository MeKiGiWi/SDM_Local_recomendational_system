import { cn } from '../../utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--color-sdm-text)]">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'block w-full rounded-xl border border-[var(--color-sdm-border)] bg-[var(--color-sdm-surface)] px-3.5 py-2.5 text-sm text-[var(--color-sdm-text)] shadow-[0_1px_2px_oklch(24%_0.03_258/0.03)] placeholder:text-[var(--color-sdm-text-muted)]',
          'transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'focus:border-[var(--color-sdm-primary)] focus:outline-none focus:ring-[3px] focus:ring-[oklch(47.5%_0.19_264/0.15)]',
          error && 'border-[oklch(52%_0.18_25)] focus:border-[oklch(52%_0.18_25)] focus:ring-[oklch(52%_0.18_25/0.15)]',
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-[oklch(48%_0.16_25)]">{error}</p>}
    </div>
  )
}
