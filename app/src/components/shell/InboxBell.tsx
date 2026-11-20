import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { wyndbase } from '../../wyndbase'

/** Unread inbox count (approvals, notifications) with a small dropdown. */
export function InboxBell() {
  const { data } = useQuery(wyndbase.inbox.unread.options())
  const [open, setOpen] = useState(false)
  const items = [...(data?.list.interactions ?? []), ...(data?.list.notifications ?? []), ...(data?.list.alerts ?? [])]
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-white/90 hover:bg-white/10"
        aria-label={`Inbox, ${data?.total ?? 0} unread`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {(data?.total ?? 0) > 0 && (
          <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-amber-400 px-1 text-[10px] font-bold text-stone-900">
            {data?.total}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-stone-200 bg-white p-2 text-stone-800 shadow-lg">
          {items.length === 0 ? (
            <p className="p-3 text-sm text-stone-500">You're all caught up.</p>
          ) : (
            items.slice(0, 8).map((i) => (
              <div key={i.id} className="rounded p-2 hover:bg-stone-50">
                <p className="text-sm font-medium">{i.title}</p>
                {i.description && <p className="text-xs text-stone-500">{i.description}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
