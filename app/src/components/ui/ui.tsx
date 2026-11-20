import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Card({ title, actions, children, className = '' }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-stone-200 bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-brand-800">{title}</h2>
          <div className="flex gap-2">{actions}</div>
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-stone-300',
  secondary: 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50',
  ghost: 'text-brand-700 hover:bg-brand-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

export function Button({ variant = 'primary', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...rest}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    />
  )
}

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-stone-900/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
          <h2 className="font-semibold text-stone-800">{title}</h2>
          <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-700" aria-label="Close">
            ✕
          </button>
        </header>
        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-stone-100 px-5 py-3">{footer}</footer>}
      </div>
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-stone-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-400">{hint}</span>}
    </label>
  )
}

export const inputCls =
  'w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

export function ErrorNote({ error }: { error: string | null | undefined }) {
  if (!error) return null
  return <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-stone-400">{children}</p>
}

export function Badge({ children, tone = 'stone' }: { children: ReactNode; tone?: 'stone' | 'green' | 'amber' | 'red' | 'blue' }) {
  const tones = {
    stone: 'bg-stone-100 text-stone-700',
    green: 'bg-brand-100 text-brand-800',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-sky-100 text-sky-800',
  }
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>
}

export const statusTone = (s: string | null | undefined) =>
  s === 'approved' || s === 'active' ? 'green' : s === 'pending' || s === 'leave' ? 'amber' : s === 'denied' || s === 'terminated' ? 'red' : 'stone'
