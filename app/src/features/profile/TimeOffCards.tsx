import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { askConfirm } from '../../components/ui/confirm'
import { SkeletonList } from '../../components/ui/Skeleton'
import { Badge, Button, Card, Empty, ErrorNote, inputCls } from '../../components/ui/ui'
import { errorMessage, fmtDate, fmtHours, isoDate, label, todayIso } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll, useOrgTree } from './data'
import { CheckCircle2, Clock, Palmtree, PartyPopper } from 'lucide-react'

const md = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const range = (from: string, to: string) => (from === to ? md(from) : `${md(from)} – ${md(to)}`)

interface Upcoming {
  key: string
  from: string
  to: string
  kind: 'leave' | 'holiday'
  title: string
  detail?: string | null
  status?: string | null
  requestId?: string
}

/**
 * What is coming for this person: their pending and approved time off, and the public holidays of their
 * office's country, in date order. The person and HR may cancel a request here (the server decides when).
 */
export function UpcomingTimeOffCard({ employeeId, officeTeamId, canCancel }: { employeeId: string; officeTeamId: string | null | undefined; canCancel: boolean }) {
  const today = todayIso()
  const horizon = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 4)
    return isoDate(d)
  }, [])
  const requests = useQuery(wyndbase.query.pto.myRequests({ employeeId }))
  const holidays = useQuery(wyndbase.query.pto.holidaysInRange({ from: today, to: horizon }))
  const tree = useOrgTree()
  const country = tree.data?.find((u) => u.teamId === officeTeamId)?.country
  const [error, setError] = useState<string | null>(null)

  const items = useMemo(() => {
    const out: Upcoming[] = []
    for (const r of requests.data ?? []) {
      if (!r.endDate || String(r.endDate) < today || !['pending', 'approved'].includes(String(r.status))) continue
      out.push({
        key: r.requestId,
        from: String(r.startDate),
        to: String(r.endDate),
        kind: 'leave',
        title: `${fmtHours(r.totalHours)} of ${r.typeName ?? 'time off'}`,
        detail: r.note,
        status: r.status,
        requestId: r.requestId,
      })
    }
    for (const h of holidays.data ?? []) {
      if (!country || h.country !== String(country)) continue
      out.push({ key: `h-${h.date}-${h.name}`, from: String(h.date), to: String(h.date), kind: 'holiday', title: h.name ?? 'Holiday' })
    }
    // A holiday of several days is several rows on the server; show it once.
    const merged: Upcoming[] = []
    for (const it of out.sort((a, b) => a.from.localeCompare(b.from) || a.kind.localeCompare(b.kind))) {
      const prev = merged[merged.length - 1]
      const next = prev && new Date(`${prev.to}T00:00:00`)
      next?.setDate(next.getDate() + 1)
      if (prev && it.kind === 'holiday' && prev.kind === 'holiday' && prev.title === it.title && next && isoDate(next) === it.from) prev.to = it.to
      else merged.push({ ...it })
    }
    return merged
  }, [requests.data, holidays.data, country, today])

  const cancel = async (it: Upcoming) => {
    if (!it.requestId || !(await askConfirm(`Cancel ${it.title} on ${range(it.from, it.to)}?`, { confirmLabel: 'Cancel request', danger: true }))) return
    setError(null)
    try {
      await wyndbase.mutation.pto.cancelRequest({ requestId: it.requestId, reason: 'Canceled from the profile' })
      await refreshAll()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <Card title="Upcoming time off">
      <ErrorNote error={error} />
      {requests.isLoading || holidays.isLoading ? (
        <SkeletonList rows={3} />
      ) : items.length === 0 ? (
        <Empty icon={<Palmtree className="h-4 w-4" />}>No time off or holidays coming up.</Empty>
      ) : (
        <ul className="divide-y divide-stone-100">
          {items.map((it) => (
            <li key={it.key} className="flex items-center gap-4 py-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700" aria-hidden>
                {it.kind === 'holiday' ? <PartyPopper className="h-5 w-5" /> : <Palmtree className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-stone-900">{range(it.from, it.to)}</p>
                <p className="flex items-center gap-1.5 text-sm text-stone-600">
                  {it.kind === 'leave' && (it.status === 'approved' ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Approved" /> : <Clock className="h-4 w-4 shrink-0 text-amber-600" aria-label="Waiting for approval" />)}
                  <span className="truncate">{it.title}</span>
                  {it.status === 'pending' && <Badge tone="amber">pending</Badge>}
                </p>
              </div>
              {it.detail && <p className="hidden max-w-[30%] truncate text-sm text-stone-500 md:block">{it.detail}</p>}
              {it.kind === 'leave' && canCancel && (it.status === 'pending' || it.from > today) && (
                <Button variant="secondary" onClick={() => void cancel(it)}>
                  Cancel
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

const KIND_LABEL: Record<string, string> = {
  accrual: 'Accrual',
  usage: 'Time off taken',
  reversal: 'Returned (request canceled)',
  adjustment: 'Adjustment',
  carryover: 'Carried over',
  expiry: 'Expired',
  payout: 'Paid out',
  forfeit: 'Forfeited',
  transfer_in: 'Transferred in',
  transfer_out: 'Transferred out',
}

export interface HistoryRow {
  entryId: string
  entryDate: string
  kind: string
  hours: number
  reason?: string | null
  requestId?: string | null
  requestStart?: unknown
  requestEnd?: unknown
  projected: boolean
}

interface Projection {
  mode?: string | null
  frequency?: string | null
  rate?: unknown
  cap?: unknown
  grant?: unknown
  yearStartMonth?: unknown
  yearStartDay?: unknown
  periods?: unknown
}

/**
 * The accruals still to come, from the person's current policy (pto.projectedAccruals): one per future pay
 * period for a per-period policy, stopping at the yearly cap (counting what was already earned that year),
 * and one grant at each coming leave-year start for an annual-grant policy.
 */
export function projectAccruals(policies: Projection[], ledger: HistoryRow[], today: string): HistoryRow[] {
  const out: HistoryRow[] = []
  for (const p of policies) {
    if (p.mode === 'per_period' && p.rate != null) {
      const rate = Number(p.rate)
      const cap = p.cap == null ? Infinity : Number(p.cap)
      const earned = new Map<string, number>()
      for (const r of ledger) if (r.kind === 'accrual' && r.entryDate <= today) earned.set(r.entryDate.slice(0, 4), (earned.get(r.entryDate.slice(0, 4)) ?? 0) + r.hours)
      const ends = ((p.periods as { frequency: string; end: string }[] | null) ?? []).filter((x) => x.frequency === p.frequency).map((x) => String(x.end)).sort()
      for (const end of ends) {
        const year = end.slice(0, 4)
        const hours = Math.max(0, Math.min(rate, cap - (earned.get(year) ?? 0)))
        if (hours <= 0) continue
        earned.set(year, (earned.get(year) ?? 0) + hours)
        out.push({ entryId: `proj-${end}`, entryDate: end, kind: 'accrual', hours, projected: true })
      }
    }
    if (p.mode === 'annual_grant' && p.grant != null && p.yearStartMonth) {
      const y0 = Number(today.slice(0, 4))
      for (const y of [y0, y0 + 1]) {
        const d = isoDate(new Date(y, Number(p.yearStartMonth) - 1, Number(p.yearStartDay ?? 1)))
        const horizon = isoDate(new Date(y0 + 1, Number(today.slice(5, 7)) - 1, Number(today.slice(8, 10))))
        if (d > today && d <= horizon) out.push({ entryId: `grant-${d}`, entryDate: d, kind: 'accrual', hours: Number(p.grant), reason: 'Annual grant', projected: true })
      }
    }
  }
  return out
}

// A recalculation writes "Recalculation <batch id>": the id means nothing to a reader.
const RECALC = /^Recalculation [0-9a-f-]{36}$/i

/** A reversal is a canceled request's hours coming back only when it gives hours back for a request. */
function describe(kind: string, hours: number, reason: string | null | undefined, hasRequest: boolean) {
  if (reason && RECALC.test(reason)) return hours < 0 ? 'Recalculation (taken back)' : 'Recalculation (added)'
  if (kind === 'reversal') return hasRequest && hours > 0 ? 'Returned (request canceled)' : 'Reversal'
  return KIND_LABEL[kind] ?? label(kind)
}

/**
 * How a balance came to be: every ledger entry of one time off type with the balance after it, newest
 * first. Entries dated in the future (leave already booked) show as scheduled and are not in today's balance.
 */
export function BalanceHistoryCard({ employeeId }: { employeeId: string }) {
  const q = useQuery(wyndbase.query.pto.ledgerHistory({ employeeId }))
  const today = todayIso()
  const until = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 12)
    return isoDate(d)
  }, [])
  const proj = useQuery(wyndbase.query.pto.projectedAccruals({ employeeId, until }))
  const types = useMemo(() => {
    const m = new Map<string, string>()
    for (const e of q.data ?? []) if (e.typeId) m.set(e.typeId, e.typeName ?? e.typeCode ?? '—')
    for (const p of proj.data ?? []) if (p.typeId && !m.has(p.typeId)) m.set(p.typeId, p.typeName ?? p.typeCode ?? '—')
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [q.data, proj.data])
  const [typeId, setTypeId] = useState('')
  const current = types.some(([id]) => id === typeId) ? typeId : (types[0]?.[0] ?? '')

  const rows = useMemo(() => {
    const ledger: HistoryRow[] = (q.data ?? [])
      .filter((e) => e.typeId === current)
      .map((e) => ({ entryId: e.entryId, entryDate: String(e.entryDate), kind: String(e.kind), hours: Number(e.hours ?? 0), reason: e.reason, requestId: e.requestId, requestStart: e.requestStart, requestEnd: e.requestEnd, projected: false }))
    const projected = projectAccruals((proj.data ?? []).filter((p) => p.typeId === current), ledger, today)
    // Oldest first, ledger before projection on the same day, to carry the balance; shown newest first.
    const all = [...ledger, ...projected].sort((a, b) => a.entryDate.localeCompare(b.entryDate) || Number(a.projected) - Number(b.projected))
    let balance = 0
    return all.map((r) => ({ ...r, balance: (balance += r.hours) })).reverse()
  }, [q.data, proj.data, current, today])
  const balanceToday = rows.find((r) => String(r.entryDate) <= today)?.balance ?? 0

  return (
    <Card
      title="Balance history"
      actions={
        types.length > 1 && (
          <select className={`${inputCls} w-48`} value={current} onChange={(e) => setTypeId(e.target.value)}>
            {types.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )
      }
    >
      {q.isLoading ? (
        <SkeletonList rows={4} />
      ) : rows.length === 0 ? (
        <Empty>No balance history yet.</Empty>
      ) : (
        <>
          <p className="mb-3 text-sm text-stone-600">
            Balance today: <span className="font-semibold text-stone-900">{fmtHours(balanceToday)}</span>
          </p>
          <BalanceChart rows={rows} today={today} />
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th className="text-right">Used (−)</th>
                  <th className="text-right">Earned (+)</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const h = Number(r.hours ?? 0)
                  const future = String(r.entryDate) > today
                  return (
                    <tr key={r.entryId} className={future ? 'text-stone-400' : ''}>
                      <td className="whitespace-nowrap">{fmtDate(String(r.entryDate))}</td>
                      <td>
                        <span className={future ? '' : 'text-stone-800'}>{describe(String(r.kind), h, r.reason, !!r.requestId)}</span>
                        {!!r.requestStart && <span className="text-stone-500"> · {range(String(r.requestStart), String(r.requestEnd ?? r.requestStart))}</span>}
                        {r.reason && !RECALC.test(r.reason) && <span className="block text-xs text-stone-500">{r.reason}</span>}
                        {future && <Badge>{r.projected ? 'projected' : 'scheduled'}</Badge>}
                      </td>
                      <td className="text-right tabular-nums">{h < 0 ? fmtHours(-h) : ''}</td>
                      <td className="text-right tabular-nums">{h > 0 ? fmtHours(h) : ''}</td>
                      <td className="text-right font-medium tabular-nums">{fmtHours(r.balance)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}

const DAY = 86_400_000
const toT = (iso: string) => new Date(`${iso}T00:00:00`).getTime()

/**
 * The balance over time as a step line: solid up to today, faded and dashed after it (leave already
 * booked, accruals already posted ahead). Both halves share today's point so the line is unbroken.
 */
function BalanceChart({ rows, today }: { rows: { entryDate: unknown; balance: number }[]; today: string }) {
  const data = useMemo(() => {
    // rows arrive newest first; walk them oldest first and keep the last balance of each day
    const byDay = new Map<string, number>()
    for (const r of [...rows].reverse()) byDay.set(String(r.entryDate), r.balance)
    const days = [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    const past = days.filter(([d]) => d <= today)
    const future = days.filter(([d]) => d > today)
    const now = past.length ? past[past.length - 1][1] : 0
    const pts: { t: number; past?: number; future?: number }[] = past.map(([d, b]) => ({ t: toT(d), past: b }))
    pts.push({ t: toT(today), past: now, future: future.length ? now : undefined })
    for (const [d, b] of future) pts.push({ t: toT(d), future: b })
    // Before the first entry the balance was zero: start the line there, a little before it.
    const span = pts[pts.length - 1].t - pts[0].t
    pts.unshift({ t: pts[0].t - Math.max(7 * DAY, span * 0.04), past: 0 })
    return pts
  }, [rows, today])
  // Under a year: day and month; longer: month and year.
  const long = data[data.length - 1].t - data[0].t > 300 * DAY
  const fmt = (t: number) => new Date(t).toLocaleDateString('en-GB', long ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' })
  return (
    <div className="mb-4 h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="#f0eeec" vertical={false} />
          <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={fmt} tick={{ fontSize: 11, fill: '#78716c' }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fontSize: 11, fill: '#78716c' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
          <Tooltip
            labelFormatter={(t) => new Date(Number(t)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            formatter={(v, name) => [`${Number(v)} h`, name === 'future' ? 'Scheduled' : 'Balance']}
          />
          <ReferenceLine x={toT(today)} stroke="#d6d3d1" strokeDasharray="3 3" label={{ value: 'Today', position: 'insideTopRight', fontSize: 11, fill: '#a8a29e' }} />
          <Line type="stepAfter" dataKey="past" stroke="#8257da" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
          <Line type="stepAfter" dataKey="future" stroke="#8257da" strokeOpacity={0.35} strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
