'use client'
import { cn } from '@/lib/utils'

// ── StatCard ──────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: React.ReactNode
  sub?: string
  icon?: string
  trend?: 'up' | 'down' | 'neutral'
  accentColor?: string
  className?: string
  valueClassName?: string
}

export function StatCard({ label, value, sub, icon, trend, accentColor = '#6366f1', className, valueClassName }: StatCardProps) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : null
  const trendColor = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#94a3b8'

  return (
    <div className={cn('relative bg-white rounded-2xl border border-slate-100 p-5 shadow-sm overflow-hidden', className)}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: accentColor }} />
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</span>
        {icon && (
          <span className="flex items-center justify-center w-8 h-8 rounded-xl text-lg"
            style={{ background: accentColor + '15' }}>{icon}</span>
        )}
      </div>
      <div className={cn(valueClassName ?? 'text-2xl font-bold text-slate-900 tracking-tight')}>{value}</div>
      {(sub || trend) && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {trendIcon && <span className="text-xs font-bold" style={{ color: trendColor }}>{trendIcon}</span>}
          {sub && <span className="text-xs text-slate-400">{sub}</span>}
        </div>
      )}
    </div>
  )
}

// ── ChartCard ─────────────────────────────────────────────────────
export function ChartCard({ title, subtitle, children, className }: {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden', className)}>
      <div className="px-5 py-4 border-b border-slate-50">
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────
export function Card({ children, className, title, action }: {
  children: React.ReactNode
  className?: string
  title?: string
  action?: React.ReactNode
}) {
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden', className)}>
      {title && (
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray'

const BADGE_STYLES: Record<BadgeVariant, string> = {
  green:  'bg-green-50 text-green-700 border-green-200',
  red:    'bg-red-50 text-red-700 border-red-200',
  yellow: 'bg-amber-50 text-amber-700 border-amber-200',
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  gray:   'bg-slate-50 text-slate-600 border-slate-200',
}

export function Badge({ children, variant = 'gray', dot, className }: {
  children: React.ReactNode
  variant?: BadgeVariant
  dot?: boolean
  className?: string
}) {
  const dotColors: Record<BadgeVariant, string> = {
    green: 'bg-green-500', red: 'bg-red-500', yellow: 'bg-amber-500',
    blue: 'bg-blue-500', purple: 'bg-purple-500', gray: 'bg-slate-400',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold', BADGE_STYLES[variant], className)}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  )
}

// ── Button ────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none'
  const variants = {
    primary:   'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
    danger:    'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100',
    ghost:     'text-slate-500 hover:bg-slate-100',
  }
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</label>}
      <input
        className={cn(
          'w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-sm text-slate-800 outline-none transition-all',
          'placeholder:text-slate-300',
          'focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100',
          error ? 'border-red-300' : 'border-slate-200',
          className
        )}
        {...props}
      />
      {hint  && <p className="text-[10px] text-slate-400">{hint}</p>}
      {error && <p className="text-[10px] text-red-500">{error}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</label>}
      <select
        className={cn(
          'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 outline-none cursor-pointer',
          'focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100',
          className
        )}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      {description && <p className="mt-1.5 max-w-xs text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Spinner ───────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-10 h-10'
  return <div className={cn(s, 'border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin')} />
}

// ── Progress Bar ──────────────────────────────────────────────────
export function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const color = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#10b981'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">KM utilizzo</span>
        <span className="font-mono font-semibold" style={{ color }}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
