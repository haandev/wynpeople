import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/ui'
import { isoDate } from '../../lib/format'
import { useMe } from '../../lib/useMe'
import { wyndbase } from '../../wyndbase'
import { RequestDialog } from '../timeoff/RequestDialog'
import { Dashboard } from './Dashboard'
import { AnnouncementComposerHost, openAnnouncementComposer } from './widgets/announcements'

export function thisWeek(now = new Date()) {
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { from: isoDate(monday), to: isoDate(sunday) }
}

/** "New…": the things people start from home. HR also posts announcements and adds employees. */
function NewMenu({ onRequest }: { onRequest: () => void }) {
  const { me } = useMe()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const hr = !!me && (me.roles.includes('hr_admin') || me.roles.includes('hr_manager'))
  const items: { label: string; icon: string; run: () => void }[] = [
    { label: 'Time off request', icon: '🗓️', run: onRequest },
    ...(hr
      ? [
          { label: 'Announcement', icon: '📣', run: openAnnouncementComposer },
          { label: 'Employee', icon: '👤', run: () => void navigate({ to: '/people/new' }) },
        ]
      : []),
  ]
  return (
    <div ref={ref} className="relative">
      <Button variant="secondary" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu">
        ⊕ New… ▾
      </Button>
      {open && (
        <ul role="menu" className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-pop">
          {items.map((it) => (
            <li key={it.label}>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
                onClick={() => {
                  setOpen(false)
                  it.run()
                }}
              >
                <span aria-hidden>{it.icon}</span>
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function HomePage() {
  const { me } = useMe()
  const account = useQuery(wyndbase.query.auth.getMe())
  const [customizing, setCustomizing] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const firstName = me?.name?.split(' ')[0]

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        <Avatar name={me?.name} picture={account.data?.[0]?.picture} size="lg" />
        <div className="mr-auto min-w-0">
          <h1 className="truncate text-3xl font-semibold tracking-tight text-brand-900">Hi, {firstName ?? ''}</h1>
          {me?.jobTitle && <p className="text-sm text-stone-600">{me.jobTitle}</p>}
        </div>
        {!customizing && (
          <div className="flex gap-2">
            <NewMenu onRequest={() => setRequesting(true)} />
            <Button variant="secondary" onClick={() => setCustomizing(true)}>
              ⊞ Edit
            </Button>
          </div>
        )}
      </header>
      <Dashboard customizing={customizing} onDone={() => setCustomizing(false)} />
      {requesting && <RequestDialog onClose={() => setRequesting(false)} />}
      <AnnouncementComposerHost />
    </div>
  )
}
