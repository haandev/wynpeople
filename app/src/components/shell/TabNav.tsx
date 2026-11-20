import { Link } from '@tanstack/react-router'
import type { Tab } from './nav'

export function TabNav({ tabs }: { tabs: Tab[] }) {
  return (
    <nav className="flex h-full items-stretch gap-1 overflow-x-auto" aria-label="Main">
      {tabs.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          activeOptions={{ exact: t.to === '/' }}
          className="relative flex items-center whitespace-nowrap px-3 text-sm font-medium text-stone-500 transition hover:text-stone-900"
          activeProps={{ className: '!text-brand-800 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand-600' }}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
