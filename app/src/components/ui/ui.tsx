import { createPortal } from 'react-dom'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Card({ title, actions, children, className = '', padded = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={`rounded-xl border border-stone-200/80 bg-white shadow-card ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-stone-900">{title}</h2>
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        </header>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:bg-stone-300 disabled:shadow-none',
  secondary: 'border border-stone-300 bg-white text-stone-700 shadow-sm hover:bg-stone-50 hover:border-stone-400 disabled:text-stone-400',
  ghost: 'text-brand-700 hover:bg-brand-50 disabled:text-stone-400',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:bg-red-300',
}

export function Button({ variant = 'primary', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    />
  )
}

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  // Portaled to <body>: an animated (transformed) ancestor would otherwise confine the fixed overlay to itself.
  return createPortal(
    <div className="fixed inset-0 z-40 grid animate-fade-in place-items-center bg-stone-900/30 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg animate-pop-in overflow-hidden rounded-2xl bg-white shadow-pop ring-1 ring-stone-900/5">
        <header className="flex items-center justify-between px-6 pb-2 pt-5">
          <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700" aria-label="Close">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M6.3 5.3a1 1 0 0 0-1.4 1.4L8.6 10l-3.7 3.3a1 1 0 1 0 1.4 1.4L10 11.4l3.7 3.3a1 1 0 0 0 1.4-1.4L11.4 10l3.7-3.3a1 1 0 0 0-1.4-1.4L10 8.6 6.3 5.3Z" /></svg>
          </button>
        </header>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-3">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-stone-100 bg-stone-50/60 px-6 py-3.5">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-stone-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-400">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'h-9 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm shadow-sm transition placeholder:text-stone-400 hover:border-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-stone-50 [&:is(textarea)]:h-auto [&:is(textarea)]:py-2'

export function ErrorNote({ error }: { error: string | null | undefined }) {
  if (!error) return null
  return (
    <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <span aria-hidden>⚠</span>
      {error}
    </p>
  )
}

export function Empty({ children, icon = '○' }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center text-sm text-stone-400">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-stone-100 text-stone-400">{icon}</span>
      {children}
    </div>
  )
}

const tones = {
  stone: 'bg-stone-100 text-stone-700 ring-stone-200',
  green: 'bg-brand-50 text-brand-800 ring-brand-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  blue: 'bg-sky-50 text-sky-800 ring-sky-200',
}
const dots = { stone: 'bg-stone-400', green: 'bg-brand-500', amber: 'bg-amber-500', red: 'bg-red-500', blue: 'bg-sky-500' }

export function Badge({ children, tone = 'stone' }: { children: ReactNode; tone?: keyof typeof tones }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />
      {children}
    </span>
  )
}

export const statusTone = (s: string | null | undefined) =>
  s === 'approved' || s === 'active' ? 'green' : s === 'pending' || s === 'leave' ? 'amber' : s === 'denied' || s === 'terminated' ? 'red' : 'stone'

/** Page title row: title, optional subtitle and actions. */
export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Underlined tabs used inside a page. */
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: readonly T[]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-stone-200" role="tablist">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={value === t}
          onClick={() => onChange(t)}
          className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${value === t ? 'border-brand-600 text-brand-800' : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-800'}`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

/** Segmented control (two or three views of the same data). */
export function Segmented<T extends string>({ options, value, onChange }: { options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-stone-100 p-0.5 text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 font-medium transition ${value === o.value ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Previous / today / next as one joined control that never wraps. */
export function MonthNav({ onPrev, onNext, onToday }: { onPrev: () => void; onNext: () => void; onToday?: () => void }) {
  const btn = 'grid h-9 min-w-9 place-items-center px-2.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50 hover:text-stone-900'
  return (
    <div className="inline-flex shrink-0 divide-x divide-stone-200 overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm">
      <button type="button" onClick={onPrev} className={btn} aria-label="Previous month">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M12.8 5.2a.8.8 0 0 1 0 1.1L9.1 10l3.7 3.7a.8.8 0 1 1-1.1 1.1l-4.3-4.2a.8.8 0 0 1 0-1.2l4.3-4.2a.8.8 0 0 1 1.1 0Z" /></svg>
      </button>
      {onToday && (
        <button type="button" onClick={onToday} className={btn}>
          Today
        </button>
      )}
      <button type="button" onClick={onNext} className={btn} aria-label="Next month">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M7.2 5.2a.8.8 0 0 1 1.1 0l4.3 4.2a.8.8 0 0 1 0 1.2l-4.3 4.2a.8.8 0 1 1-1.1-1.1L10.9 10 7.2 6.3a.8.8 0 0 1 0-1.1Z" /></svg>
      </button>
    </div>
  )
}
