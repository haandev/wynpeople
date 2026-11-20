import { Link } from '@tanstack/react-router'
import { WynPeopleBrand } from '../ui/Brand'
import type { Me } from '../../lib/useMe'
import { InboxBell } from './InboxBell'
import { navFor } from './nav'
import { TabNav } from './TabNav'
import { UserMenu } from './UserMenu'

export function TopBar({ me }: { me: Me }) {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-stretch gap-6 px-4">
        <Link to="/" className="flex items-center text-stone-900" aria-label="wynPeople home">
          <span className="md:hidden">
            <WynPeopleBrand variant="logomark" size={28} />
          </span>
          <span className="hidden md:inline-flex">
            <WynPeopleBrand size={26} />
          </span>
        </Link>
        <div className="min-w-0 flex-1">
          <TabNav tabs={navFor(me)} />
        </div>
        <div className="flex items-center gap-1">
          <InboxBell />
          <UserMenu me={me} />
        </div>
      </div>
    </header>
  )
}
