import { useQuery } from '@tanstack/react-query'
import { MoreHorizontal, Share2, Table2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { askConfirm } from '../../components/ui/confirm'
import { PersonPicker } from '../../components/ui/PersonPicker'
import { SkeletonList } from '../../components/ui/Skeleton'
import { Button, Card, Empty, ErrorNote, Field, inputCls, Modal } from '../../components/ui/ui'
import { errorMessage } from '../../lib/format'
import { useMe } from '../../lib/useMe'
import { wyndbase } from '../../wyndbase'
import { REPORTS, type ReportDef } from './reports'

export const useSavedReports = () => useQuery(wyndbase.query.rpt.mySavedReports())
export type SavedReport = NonNullable<ReturnType<typeof useSavedReports>['data']>[number]

const refresh = () => wyndbase.queryClient.invalidateQueries()

/** "Today 2:54 pm", otherwise "Nov 10". */
function when(iso: unknown) {
  if (!iso) return '—'
  const d = new Date(String(iso))
  const today = new Date()
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}

/** Save (a new saved report) and, on your own saved report, Save changes. */
export function SaveReportButtons({ def, saved, filters, onSaved }: { def: ReportDef; saved?: SavedReport | null; filters: Record<string, unknown>; onSaved?: (id: string) => void }) {
  const { me } = useMe()
  const mine = !!saved && saved.ownerId === me?.userId
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const changed = mine && JSON.stringify(saved!.filters) !== JSON.stringify(filters)

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await wyndbase.mutation.rpt.createSavedReport({ name, reportKey: def.key, filters })
      await refresh()
      setNaming(false)
      const id = r[0]?.savedReportId
      if (id) onSaved?.(id)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  const update = async () => {
    setBusy(true)
    try {
      await wyndbase.mutation.rpt.updateSavedReport({ savedReportId: saved!.savedReportId, filters })
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {mine && (
        <Button disabled={busy || !changed} onClick={update}>
          Save changes
        </Button>
      )}
      <Button
        variant="secondary"
        onClick={() => {
          setName(saved ? `${saved.name} (copy)` : def.title)
          setNaming(true)
        }}
      >
        {saved ? 'Save as…' : 'Save report'}
      </Button>
      {naming && (
        <Modal
          title="Save report"
          onClose={() => setNaming(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setNaming(false)}>
                Cancel
              </Button>
              <Button disabled={busy || !name.trim()} onClick={create}>
                Save
              </Button>
            </>
          }
        >
          <Field label="Name">
            <input autoFocus className={inputCls} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && name.trim() && void create()} />
          </Field>
          <p className="text-sm text-stone-500">It keeps this report's filters. You'll find it under My reports, and you can share it.</p>
          <ErrorNote error={error} />
        </Modal>
      )}
    </>
  )
}

/** The owner picks who the report is shared with. Recipients see it with their own access. */
function ShareDialog({ report, onClose }: { report: SavedReport; onClose: () => void }) {
  const { me } = useMe()
  const [people, setPeople] = useState<{ userId: string; name: string | null }[]>((report.sharedWith ?? []).map((p) => ({ userId: p.userId!, name: p.name })))
  const [pick, setPick] = useState('')
  const picked = useQuery({ ...wyndbase.query.hr.searchPeople({ userId: pick }), enabled: !!pick })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const p = picked.data?.[0]
    if (!pick || !p?.userId) return
    setPeople((list) => (list.some((x) => x.userId === p.userId) ? list : [...list, { userId: p.userId!, name: p.name }]))
    setPick('')
  }, [picked.data, pick])

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await wyndbase.mutation.rpt.shareSavedReport({ savedReportId: report.savedReportId, recipients: people.map((p) => ({ userId: p.userId })) })
      await refresh()
      onClose()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={`Share “${report.name}”`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={save}>
            {busy ? 'Saving…' : 'Save sharing'}
          </Button>
        </>
      }
    >
      <Field label="Add a person">
        <PersonPicker value={pick} onChange={setPick} exclude={[me?.userId ?? '', ...people.map((p) => p.userId)]} />
      </Field>
      {people.length === 0 ? (
        <p className="text-sm text-stone-500">Not shared with anyone yet.</p>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-xl border border-stone-200">
          {people.map((p) => (
            <li key={p.userId} className="flex items-center justify-between px-3 py-2 text-sm">
              {p.name}
              <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => setPeople(people.filter((x) => x.userId !== p.userId))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-stone-500">They'll see it under My reports with only the data they're already allowed to see.</p>
      <ErrorNote error={error} />
    </Modal>
  )
}

function RowMenu({ report, onShare, onRename }: { report: SavedReport; onShare: () => void; onRename: () => void }) {
  const { me } = useMe()
  const mine = report.ownerId === me?.userId
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const remove = async () => {
    setOpen(false)
    const msg = mine ? `Delete “${report.name}”? People it is shared with lose it too.` : `Remove “${report.name}” from your reports?`
    if (!(await askConfirm(msg, { confirmLabel: mine ? 'Delete' : 'Remove', danger: true }))) return
    try {
      await wyndbase.mutation.rpt.deleteSavedReport({ savedReportId: report.savedReportId })
      await refresh()
    } catch (e) {
      setError(errorMessage(e))
    }
  }
  const items = mine
    ? [
        { label: 'Share…', run: onShare },
        { label: 'Rename…', run: onRename },
        { label: 'Delete', run: remove, danger: true },
      ]
    : [{ label: 'Remove from my reports', run: remove, danger: true }]
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="grid h-8 w-8 place-items-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50" aria-label={`Actions for ${report.name}`}>
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <ul role="menu" className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-pop">
          {items.map((it) => (
            <li key={it.label}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  it.run()
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-stone-50 ${it.danger ? 'text-red-600' : 'text-stone-700'}`}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <ErrorNote error={error} />
    </div>
  )
}

function RenameDialog({ report, onClose }: { report: SavedReport; onClose: () => void }) {
  const [name, setName] = useState(report.name ?? '')
  const [error, setError] = useState<string | null>(null)
  const save = async () => {
    try {
      await wyndbase.mutation.rpt.updateSavedReport({ savedReportId: report.savedReportId, name })
      await refresh()
      onClose()
    } catch (e) {
      setError(errorMessage(e))
    }
  }
  return (
    <Modal
      title="Rename report"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!name.trim()} onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <Field label="Name">
        <input autoFocus className={inputCls} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && name.trim() && void save()} />
      </Field>
      <ErrorNote error={error} />
    </Modal>
  )
}

/** My reports: what I saved and what was shared with me, most recently viewed first. */
export function MyReports({ onOpen }: { onOpen: (r: SavedReport) => void }) {
  const { me } = useMe()
  const q = useSavedReports()
  const [sharing, setSharing] = useState<SavedReport | null>(null)
  const [renaming, setRenaming] = useState<SavedReport | null>(null)
  const rows = [...(q.data ?? [])].sort((a, b) => String(b.lastViewed ?? b._createdAt).localeCompare(String(a.lastViewed ?? a._createdAt)))
  return (
    <Card title="My reports">
      {q.isLoading ? (
        <SkeletonList rows={4} />
      ) : rows.length === 0 ? (
        <Empty icon={<Table2 className="h-4 w-4" />}>Open a report, set its filters and press “Save report”; it shows up here, and you can share it.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Last viewed</th>
                <th>Owner</th>
                <th>Shared by</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const mine = r.ownerId === me?.userId
                const type = REPORTS.find((x) => x.key === r.reportKey)
                return (
                  <tr key={r.savedReportId}>
                    <td>
                      <button type="button" onClick={() => onOpen(r)} className="flex items-center gap-2 text-left font-medium text-brand-700 hover:underline">
                        <Table2 className="h-4 w-4 shrink-0" />
                        {r.name}
                      </button>
                      <span className="ml-6 block text-xs text-stone-500">
                        {type?.title ?? r.reportKey}
                        {mine && (r.sharedWith?.length ?? 0) > 0 && (
                          <span className="ml-2 inline-flex items-center gap-1 text-stone-400">
                            <Share2 className="h-3 w-3" /> shared with {r.sharedWith!.length}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-stone-600">{when(r.lastViewed)}</td>
                    <td className="text-stone-600">{mine ? 'Me' : r.owner}</td>
                    <td className="text-stone-600">{mine ? '' : r.owner}</td>
                    <td className="w-10 text-right">
                      <RowMenu report={r} onShare={() => setSharing(r)} onRename={() => setRenaming(r)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {sharing && <ShareDialog report={sharing} onClose={() => setSharing(null)} />}
      {renaming && <RenameDialog report={renaming} onClose={() => setRenaming(null)} />}
    </Card>
  )
}
