import { Link } from '@tanstack/react-router'
import type { Tab } from './nav'

export function TabNav({ tabs }: { tabs: Tab[] }) {
  return (
    <nav className="flex gap-1 overflow-x-auto" aria-label="Main">
      {tabs.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          activeOptions={{ exact: t.to === '/' }}
          className="whitespace-nowrap rounded-t-md px-4 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white"
          activeProps={{ className: 'bg-stone-100 !text-brand-800 hover:!bg-stone-100' }}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
