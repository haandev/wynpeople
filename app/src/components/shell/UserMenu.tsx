import { useState } from 'react'
import { signOut } from '../../lib/session'
import type { Me } from '../../lib/useMe'

export const initials = (name: string | null) =>
  (name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')

export function UserMenu({ me }: { me: Me }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-white/10">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-xs font-bold text-brand-800">{initials(me.name)}</span>
        <span className="hidden text-sm text-white sm:inline">{me.name}</span>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-stone-200 bg-white p-2 text-stone-800 shadow-lg">
          <p className="px-2 pt-1 text-sm font-semibold">{me.name}</p>
          <p className="px-2 pb-2 text-xs text-stone-500">{[me.jobTitle, me.office].filter(Boolean).join(' · ')}</p>
          <p className="px-2 pb-2 text-xs text-stone-500">Roles: {me.roles.join(', ') || 'employee'}</p>
          <button type="button" onClick={signOut} className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-stone-100">
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
