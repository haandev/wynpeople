import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { askConfirm } from '../../components/ui/confirm'
import { SkeletonList } from '../../components/ui/Skeleton'
import { Badge, Button, Card, Empty, ErrorNote, inputCls } from '../../components/ui/ui'
import { errorMessage, fmtDate, fmtHours, isoDate, label, todayIso } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll, useOrgTree } from './data'

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
        <Empty icon="🏝️">No time off or holidays coming up.</Empty>
      ) : (
        <ul className="divide-y divide-stone-100">
          {items.map((it) => (
            <li key={it.key} className="flex items-center gap-4 py-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-stone-100 text-xl" aria-hidden>
                {it.kind === 'holiday' ? '🎉' : '🏝️'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-stone-900">{range(it.from, it.to)}</p>
                <p className="flex items-center gap-1.5 text-sm text-stone-600">
                  {it.kind === 'leave' && (it.status === 'approved' ? <span className="text-emerald-600" title="Approved">✓</span> : <span className="text-amber-600" title="Waiting for approval">⏳</span>)}
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

/**
 * How a balance came to be: every ledger entry of one time off type with the balance after it, newest
 * first. Entries dated in the future (leave already booked) show as scheduled and are not in today's balance.
 */
export function BalanceHistoryCard({ employeeId }: { employeeId: string }) {
  const q = useQuery(wyndbase.query.pto.ledgerHistory({ employeeId }))
  const today = todayIso()
  const types = useMemo(() => {
    const m = new Map<string, string>()
    for (const e of q.data ?? []) if (e.typeId) m.set(e.typeId, e.typeName ?? e.typeCode ?? '—')
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [q.data])
  const [typeId, setTypeId] = useState('')
  const current = types.some(([id]) => id === typeId) ? typeId : (types[0]?.[0] ?? '')

  const rows = useMemo(() => {
    let balance = 0
    const out = (q.data ?? [])
      .filter((e) => e.typeId === current)
      .map((e) => {
        balance += Number(e.hours ?? 0)
        return { ...e, balance }
      })
    return out.reverse()
  }, [q.data, current])
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
                        <span className={future ? '' : 'text-stone-800'}>{KIND_LABEL[String(r.kind)] ?? label(String(r.kind))}</span>
                        {r.requestStart && <span className="text-stone-500"> · {range(String(r.requestStart), String(r.requestEnd ?? r.requestStart))}</span>}
                        {r.reason && <span className="block text-xs text-stone-500">{r.reason}</span>}
                        {future && <Badge>scheduled</Badge>}
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
