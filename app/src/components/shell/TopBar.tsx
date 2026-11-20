import type { Me } from '../../lib/useMe'
import { InboxBell } from './InboxBell'
import { navFor } from './nav'
import { TabNav } from './TabNav'
import { UserMenu } from './UserMenu'

export function TopBar({ me }: { me: Me }) {
  return (
    <header className="bg-brand-700">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pt-3">
        <span className="text-lg font-bold tracking-tight text-white">wynpeople</span>
        <div className="flex items-center gap-2">
          <InboxBell />
          <UserMenu me={me} />
        </div>
      </div>
      <div className="mx-auto mt-2 max-w-7xl px-4">
        <TabNav tabs={navFor(me)} />
      </div>
    </header>
  )
}
