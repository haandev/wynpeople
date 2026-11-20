import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { wyndbase } from '../../wyndbase'
import { useClickOutside } from './useClickOutside'

/** Unread inbox count (approvals, notifications) with a dropdown. */
export function InboxBell() {
  const { data } = useQuery(wyndbase.inbox.unread.options())
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, open, () => setOpen(false))
  const items = [...(data?.list.interactions ?? []), ...(data?.list.notifications ?? []), ...(data?.list.alerts ?? [])]
  const total = data?.total ?? 0
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
        aria-label={`Inbox, ${total} unread`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {total > 0 && <span className="absolute right-1 top-1 min-w-4 rounded-full bg-amber-500 px-1 text-center text-[10px] font-bold leading-4 text-white ring-2 ring-white">{total}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 animate-pop-in overflow-hidden rounded-xl bg-white shadow-pop ring-1 ring-stone-900/5">
          <div className="border-b border-stone-100 px-4 py-2.5 text-sm font-semibold">Inbox</div>
          <div className="max-h-80 overflow-y-auto p-1.5">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-stone-400">You're all caught up.</p>
            ) : (
              items.slice(0, 8).map((i) => (
                <Link key={i.id} to="/time-off" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-stone-50">
                  <p className="text-sm font-medium text-stone-800">{i.title}</p>
                  {i.description && <p className="line-clamp-2 text-xs text-stone-500">{i.description}</p>}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
