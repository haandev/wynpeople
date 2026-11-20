import { useQuery } from '@tanstack/react-query'
import { useState, useSyncExternalStore } from 'react'
import { Avatar } from '../../../components/ui/Avatar'
import { askConfirm } from '../../../components/ui/confirm'
import { SkeletonList } from '../../../components/ui/Skeleton'
import { Button, ErrorNote, Field, inputCls, Modal } from '../../../components/ui/ui'
import { errorMessage } from '../../../lib/format'
import { useMe } from '../../../lib/useMe'
import { wyndbase } from '../../../wyndbase'
import { refreshAll } from '../../profile/data'
import { Inbox, Plus } from 'lucide-react'

// The composer opens from the widget and from the page's "New…" menu.
let composing = false
const listeners = new Set<() => void>()
const setComposing = (v: boolean) => {
  composing = v
  listeners.forEach((l) => l())
}
export const openAnnouncementComposer = () => setComposing(true)

const ago = (iso: unknown) => {
  const t = new Date(String(iso)).getTime()
  const m = Math.round((Date.now() - t) / 60000)
  if (m < 60) return m <= 1 ? 'just now' : `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

type Ann = NonNullable<ReturnType<typeof useAnnouncements>['data']>[number]
const useAnnouncements = () => useQuery(wyndbase.query.home.listAnnouncements())

function Item({ a, canRemove, full = false }: { a: Ann; canRemove: boolean; full?: boolean }) {
  const [error, setError] = useState<string | null>(null)
  return (
    <li className="group flex gap-3 py-3">
      <Avatar name={a.author} picture={a.authorPicture} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-stone-900">{a.title}</p>
        {a.body && <p className={`whitespace-pre-line text-sm text-stone-600 ${full ? '' : 'line-clamp-2'}`}>{a.body}</p>}
        <p className="mt-0.5 text-xs text-stone-500">
          {a.author} · {ago(a.postedAt)}
        </p>
        <ErrorNote error={error} />
      </div>
      {canRemove && (
        <button
          type="button"
          className="h-8 shrink-0 rounded-lg px-2 text-xs text-stone-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
          onClick={async () => {
            if (!(await askConfirm(`Take down “${a.title}”?`, { confirmLabel: 'Take down', danger: true }))) return
            try {
              await wyndbase.mutation.home.deleteAnnouncement({ announcementId: a.announcementId })
              await refreshAll()
            } catch (e) {
              setError(errorMessage(e))
            }
          }}
        >
          Take down
        </button>
      )}
    </li>
  )
}

export function AnnouncementsWidget() {
  const { me } = useMe()
  const q = useAnnouncements()
  const [all, setAll] = useState(false)
  const isHr = !!me && (me.roles.includes('hr_admin') || me.roles.includes('hr_manager'))
  const canRemove = (a: Ann) => !!me && (me.roles.includes('hr_admin') || a.authorId === me.userId)
  const rows = q.data ?? []
  if (q.isLoading) return <SkeletonList rows={3} />
  return (
    <div className="flex h-full flex-col">
      {rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <Inbox className="h-10 w-10 text-stone-300" strokeWidth={1.5} aria-hidden />
          <p className="text-stone-500">There are no announcements at the moment.</p>
        </div>
      ) : (
        <ul className="-my-3 divide-y divide-stone-100">
          {rows.slice(0, 5).map((a) => (
            <Item key={a.announcementId} a={a} canRemove={canRemove(a)} />
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-center gap-3 pt-3 text-sm">
        {isHr && (
          <button type="button" onClick={openAnnouncementComposer} className="font-medium text-brand-700 hover:underline">
            <Plus className="mr-1 inline h-4 w-4 align-[-3px]" />New announcement
          </button>
        )}
        {rows.length > 0 && (
          <button type="button" onClick={() => setAll(true)} className="ml-auto font-medium text-brand-700 hover:underline">
            All announcements
          </button>
        )}
      </div>
      {all && (
        <Modal title="Announcements" onClose={() => setAll(false)}>
          <ul className="divide-y divide-stone-100">
            {rows.map((a) => (
              <Item key={a.announcementId} a={a} canRemove={canRemove(a)} full />
            ))}
          </ul>
        </Modal>
      )}
    </div>
  )
}

/** Mounted once on the home page; shows the composer when it is open. */
export function AnnouncementComposerHost() {
  const open = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => composing,
  )
  const [draft, setDraft] = useState({ title: '', body: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!open) return null
  const close = () => {
    setComposing(false)
    setError(null)
  }
  const post = async () => {
    setBusy(true)
    setError(null)
    try {
      await wyndbase.mutation.home.postAnnouncement({ title: draft.title, body: draft.body || null })
      await refreshAll()
      setDraft({ title: '', body: '' })
      close()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      title="New announcement"
      onClose={close}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button onClick={post} disabled={busy || !draft.title.trim()}>
            {busy ? 'Posting…' : 'Post to everyone'}
          </Button>
        </>
      }
    >
      <Field label="Title">
        <input autoFocus className={inputCls} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Office closed on Friday" />
      </Field>
      <Field label="Message">
        <textarea rows={5} className={inputCls} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
      </Field>
      <p className="text-xs text-stone-500">Everyone in the company sees it on their home page.</p>
      <ErrorNote error={error} />
    </Modal>
  )
}
