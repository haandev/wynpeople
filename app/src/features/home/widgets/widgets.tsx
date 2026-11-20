import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Avatar } from '../../../components/ui/Avatar'
import { askConfirm } from '../../../components/ui/confirm'
import { SkeletonList } from '../../../components/ui/Skeleton'
import { Badge, Button, Empty, ErrorNote, inputCls } from '../../../components/ui/ui'
import { errorMessage, fmtDate, fmtHours, hoursToDays, isoDate, label, todayIso } from '../../../lib/format'
import { useMe } from '../../../lib/useMe'
import { wyndbase } from '../../../wyndbase'
import { refreshAll } from '../../profile/data'
import { Donut, MonthLine, type Slice } from './charts'

const Loading = () => <SkeletonList rows={3} />

/** SUMMARIZE names the group column after its expression; the label is whichever key is not `n`. */
function slices(rows: Record<string, unknown>[] | undefined, none: string, pretty = (s: string) => s): Slice[] {
  return (rows ?? [])
    .map((r) => {
      const key = Object.keys(r).find((k) => k !== 'n')
      const raw = key ? r[key] : null
      return { label: raw === null || raw === undefined || raw === '' ? none : pretty(String(raw)), n: Number(r.n ?? 0) }
    })
    .sort((a, b) => b.n - a.n)
}

// ——— Me ———

const ACCENT: Record<string, string> = { VAC: 'from-sky-500 to-sky-600', SICK: 'from-rose-500 to-rose-600', PERS: 'from-violet-500 to-violet-600' }

export function BalancesWidget() {
  const q = useQuery(wyndbase.query.pto.balances({}))
  if (q.isLoading) return <Loading />
  if (!q.data?.length) return <Empty>No time off balances yet.</Empty>
  return (
    <div className="grid h-full auto-rows-fr gap-3 sm:grid-cols-3">
      {q.data.map((b) => (
        <div key={b.code ?? b.type} className="relative overflow-hidden rounded-lg border border-stone-200/80 bg-white p-4">
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${ACCENT[b.code ?? ''] ?? 'from-brand-500 to-brand-600'}`} />
          <p className="text-xs font-medium uppercase tracking-wider text-stone-500">{b.name ?? b.code}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-stone-900">{fmtHours(b.balance)}</p>
          <p className="mt-0.5 text-xs text-stone-500">
            ≈ {hoursToDays(b.balance)} available · used {fmtHours(b.used)}
          </p>
        </div>
      ))}
    </div>
  )
}

export function ApprovalsWidget() {
  const inbox = useQuery(wyndbase.inbox.unread.options())
  const items = inbox.data?.list.interactions ?? []
  if (inbox.isLoading) return <Loading />
  if (!items.length) return <Empty icon="✓">Nothing waits for your decision.</Empty>
  return (
    <ul className="-mx-2 divide-y divide-stone-100">
      {items.map((a) => (
        <li key={a.id} className="flex items-center justify-between gap-3 px-2 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-stone-800">{a.title}</p>
            {a.description && <p className="truncate text-xs text-stone-500">{a.description}</p>}
          </div>
          <Link to="/time-off" className="shrink-0 rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50">
            Review
          </Link>
        </li>
      ))}
    </ul>
  )
}

// ——— People ———

export function WhosOutWidget() {
  const today = todayIso()
  const { me } = useMe()
  const q = useQuery(wyndbase.query.pto.whoIsOut({ from: today, to: today }))
  if (q.isLoading) return <Loading />
  // One person may have more than one request covering today.
  const people = [...new Map((q.data ?? []).map((o) => [o.employeeId, o])).values()]
  const mine = people.filter((o) => me?.officeTeamId && o.officeTeamId === me.officeTeamId)
  return (
    <div className="flex h-full flex-col">
      {people.length === 0 ? (
        <Empty icon="☀">Everyone's in today.</Empty>
      ) : (
        <>
          <p className="text-base font-semibold text-brand-700">
            {people.length} {people.length === 1 ? 'person is' : 'people are'} out today
          </p>
          {me?.office && <p className="text-sm text-stone-500">{mine.length} from {me.office}</p>}
          <ul className="mt-3 flex flex-wrap gap-2">
            {/* The tooltip never names the type of leave: whether someone is sick is not everyone's business. */}
            {people.map((o) => (
              <li key={o.employeeId} title={`${o.name} · out until ${fmtDate(o.endDate)}`}>
                <Link to="/people/$employeeId" params={{ employeeId: o.employeeId! }}>
                  <Avatar name={o.name} size="md" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <Link to="/time-off" className="mt-auto pt-3 text-sm font-medium text-brand-700 hover:underline">
        Full calendar
      </Link>
    </div>
  )
}

interface Celebration {
  id: string
  name: string | null
  picture: unknown
  date: Date
  what: string
  kind: 'anniversary' | 'birthday'
}

/** The next time `mmdd` comes round, counting from a few days ago so yesterday's still shows. */
function nextOccurrence(mmdd: string, from: Date) {
  const [m, d] = mmdd.split('-').map(Number)
  const at = new Date(from.getFullYear(), m - 1, d)
  if (at < from) at.setFullYear(at.getFullYear() + 1)
  return at
}
const ordinal = (n: number) => `${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10 < 4 ? n % 10 : 0]}`

export function CelebrationsWidget() {
  const q = useQuery(wyndbase.query.home.celebrations())
  const list = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - 3)
    const end = new Date(start)
    end.setDate(end.getDate() + 33)
    const out: Celebration[] = []
    for (const e of q.data ?? []) {
      if (e.hireDate) {
        const at = nextOccurrence(String(e.hireDate).slice(5, 10), start)
        const years = at.getFullYear() - Number(String(e.hireDate).slice(0, 4))
        if (years >= 1 && at <= end) out.push({ id: `${e.employeeId}-a`, name: e.name, picture: e.picture, date: at, what: `${ordinal(years)} anniversary`, kind: 'anniversary' })
      }
      if (e.birthday) {
        const at = nextOccurrence(String(e.birthday), start)
        if (at <= end) out.push({ id: `${e.employeeId}-b`, name: e.name, picture: e.picture, date: at, what: 'Happy birthday!', kind: 'birthday' })
      }
    }
    return out.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [q.data])
  if (q.isLoading) return <Loading />
  if (!list.length) return <Empty icon="🎉">No birthdays or work anniversaries in the next month.</Empty>
  return (
    <ul className="-mx-1 divide-y divide-stone-100">
      {list.map((c) => (
        <li key={c.id} className="flex items-center gap-3 px-1 py-2.5">
          <Avatar name={c.name} picture={c.picture} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-800">{c.name}</p>
            <p className="truncate text-xs text-stone-500">
              {c.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} · {c.what}
            </p>
          </div>
          <span className="text-lg" aria-hidden>
            {c.kind === 'birthday' ? '🎂' : '🎉'}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function NewHiresWidget() {
  const q = useQuery(wyndbase.query.home.newHires({ days: 30 }))
  if (q.isLoading) return <Loading />
  const rows = q.data ?? []
  if (!rows.length) return <Empty icon="👋">No one joined in the last 30 days.</Empty>
  return (
    <div className="flex h-full flex-col items-center text-center">
      <span className="text-3xl" aria-hidden>
        👋
      </span>
      <p className="mt-2 text-lg font-semibold text-stone-900">
        Welcome {rows.length} new team {rows.length === 1 ? 'member' : 'members'}!
      </p>
      <ul className="mt-4 w-full space-y-2 text-left">
        {rows.map((r) => (
          <li key={r.employeeId}>
            <Link to="/people/$employeeId" params={{ employeeId: r.employeeId }} className="flex items-center gap-3 rounded-lg p-1 hover:bg-stone-50">
              <Avatar name={r.name} picture={r.picture} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-stone-800">{r.name}</p>
                <p className="truncate text-xs text-stone-500">
                  {r.jobTitle ?? '—'} · started {fmtDate(String(r.hireDate))}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ——— Company ———

export function LinksWidget() {
  const { me } = useMe()
  const canEdit = !!me?.roles.includes('hr_admin')
  const q = useQuery(wyndbase.query.home.listLinks())
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState({ title: '', url: '' })
  const [error, setError] = useState<string | null>(null)
  const run = async (fn: () => Promise<unknown>) => {
    setError(null)
    try {
      await fn()
      await refreshAll()
      return true
    } catch (e) {
      setError(errorMessage(e))
      return false
    }
  }
  const add = async () => {
    const url = /^https?:\/\//i.test(draft.url.trim()) ? draft.url.trim() : `https://${draft.url.trim()}`
    if (await run(() => wyndbase.mutation.home.saveLink({ title: draft.title, url, sortOrder: (q.data?.length ?? 0) + 1 }))) setDraft({ title: '', url: '' })
  }
  if (q.isLoading) return <Loading />
  const links = q.data ?? []
  return (
    <div className="flex h-full flex-col">
      {links.length === 0 && !editing ? (
        <Empty icon="🔗">Your company has not added any links yet.</Empty>
      ) : (
        <ul className="space-y-1">
          {links.map((l) => (
            <li key={l.linkId} className="group flex items-center gap-2">
              <a href={l.url ?? '#'} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50">
                {l.title}
              </a>
              {editing && (
                <button
                  type="button"
                  className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  onClick={async () => (await askConfirm(`Remove the link “${l.title}”?`, { confirmLabel: 'Remove', danger: true })) && run(() => wyndbase.mutation.home.deleteLink({ linkId: l.linkId }))}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            void add()
          }}
        >
          <input className={inputCls} placeholder="Title, e.g. Handbook" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <input className={inputCls} placeholder="https://…" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
          <Button type="submit" disabled={!draft.title.trim() || !draft.url.trim()}>
            Add link
          </Button>
        </form>
      )}
      <ErrorNote error={error} />
      {canEdit && (
        <button type="button" onClick={() => setEditing(!editing)} className="mt-auto self-start pt-3 text-sm font-medium text-brand-700 hover:underline">
          {editing ? 'Done' : 'Edit links'}
        </button>
      )}
    </div>
  )
}

export function TimeOffUsedWidget() {
  const q = useQuery(wyndbase.query.home.timeOffUsed())
  const types = useMemo(() => [...new Set((q.data ?? []).map((r) => String(r.name ?? '—')))].sort(), [q.data])
  const [type, setType] = useState<string>('')
  const current = type && types.includes(type) ? type : (types[0] ?? '')
  const series = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, k) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + k, 1)
      const key = isoDate(d).slice(0, 7)
      const hours = (q.data ?? []).filter((r) => r.to_char === key && String(r.name ?? '—') === current).reduce((s, r) => s + Number(r.hours ?? 0), 0)
      return { month: d.toLocaleDateString('en-GB', { month: 'short' }), value: Math.round((hours / 8) * 10) / 10 }
    })
  }, [q.data, current])
  if (q.isLoading) return <Loading />
  if (!types.length) return <Empty>No approved time off in the last 12 months.</Empty>
  return (
    <div className="flex h-full flex-col gap-3">
      <select className={inputCls} value={current} onChange={(e) => setType(e.target.value)}>
        {types.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <div className="min-h-0 flex-1">
        <MonthLine data={series} unit="days" />
      </div>
    </div>
  )
}

export function WithoutPayRaiseWidget() {
  const q = useQuery({ ...wyndbase.query.home.withoutPayRaise(), retry: false })
  if (q.isLoading) return <Loading />
  const rows = q.data ?? []
  if (!rows.length) return <Empty icon="✓">Everyone had a pay change in the last 12 months.</Empty>
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-stone-900">{rows.length}</span>
        <span className="text-sm text-stone-500">without a pay change for 12+ months</span>
      </div>
      <ul className="mt-3 min-h-0 flex-1 space-y-1 overflow-auto">
        {rows.map((r) => (
          <li key={r.employeeId}>
            <Link to="/people/$employeeId" params={{ employeeId: r.employeeId! }} className="flex items-center gap-3 rounded-lg p-1 hover:bg-stone-50">
              <Avatar name={r.name} picture={r.picture} size="xs" />
              <span className="min-w-0 flex-1 truncate text-sm text-stone-800">{r.name}</span>
              <Badge>since {fmtDate(String(r.since))}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DepartmentWidget() {
  const q = useQuery(wyndbase.query.home.byDepartment())
  return q.isLoading ? <Loading /> : <Donut data={slices(q.data, 'No department')} center="people" />
}
export function OfficeWidget() {
  const q = useQuery(wyndbase.query.home.byOffice())
  return q.isLoading ? <Loading /> : <Donut data={slices(q.data, 'No office')} center="people" />
}
export function EmploymentTypeWidget() {
  const q = useQuery(wyndbase.query.home.byEmploymentType())
  return q.isLoading ? <Loading /> : <Donut data={slices(q.data, 'Not set', label)} center="people" />
}
const TENURE_ORDER = ['< 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years']
export function TenureWidget() {
  const q = useQuery(wyndbase.query.home.byTenure())
  const data = slices(q.data, 'Unknown').sort((a, b) => TENURE_ORDER.indexOf(a.label) - TENURE_ORDER.indexOf(b.label))
  return q.isLoading ? <Loading /> : <Donut data={data} center="people" />
}
