import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { Avatar } from '../ui/Avatar'
import { signOut } from '../../lib/session'
import type { Me } from '../../lib/useMe'
import { wyndbase } from '../../wyndbase'
import { useClickOutside } from './useClickOutside'

export { initials } from '../ui/Avatar'

export function UserMenu({ me }: { me: Me }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const account = useQuery(wyndbase.query.auth.getMe())
  const picture = account.data?.[0]?.picture
  useClickOutside(ref, open, () => setOpen(false))
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-stone-100" aria-haspopup="menu" aria-expanded={open}>
        <Avatar name={me.name} picture={picture} size="xs" />
        <span className="hidden text-sm font-medium text-stone-700 sm:inline">{me.name}</span>
        <svg viewBox="0 0 20 20" className="hidden h-4 w-4 text-stone-400 sm:block" fill="currentColor"><path d="M5.2 7.2a.8.8 0 0 1 1.1 0L10 10.9l3.7-3.7a.8.8 0 1 1 1.1 1.1l-4.2 4.3a.8.8 0 0 1-1.2 0L5.2 8.3a.8.8 0 0 1 0-1.1Z" /></svg>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 animate-pop-in overflow-hidden rounded-xl bg-white shadow-pop ring-1 ring-stone-900/5" role="menu">
          <div className="flex items-center gap-3 border-b border-stone-100 px-4 py-3">
            <Avatar name={me.name} picture={picture} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{me.name}</p>
              <p className="truncate text-xs text-stone-500">{[me.jobTitle, me.office].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
          <div className="p-1.5">
            <Link to="/me" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-stone-50" role="menuitem">
              My profile
            </Link>
            <p className="px-3 py-1.5 text-xs text-stone-400">Roles: {me.roles.join(', ') || 'employee'}</p>
            <button type="button" onClick={signOut} className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50" role="menuitem">
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
