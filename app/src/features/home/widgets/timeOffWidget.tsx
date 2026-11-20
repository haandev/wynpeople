import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { SkeletonList } from '../../../components/ui/Skeleton'
import { Button, Empty, Field, inputCls, Modal } from '../../../components/ui/ui'
import { fmtDate, fmtHours, hoursToDays, isoDate, todayIso } from '../../../lib/format'
import { useMe } from '../../../lib/useMe'
import { wyndbase } from '../../../wyndbase'
import { projectAccruals, type HistoryRow } from '../../profile/TimeOffCards'
import { RequestDialog } from '../../timeoff/RequestDialog'
import { Calculator, CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, HandHeart, Palmtree, PauseCircle, Thermometer, User, type LucideIcon } from 'lucide-react'

const ICON: Record<string, LucideIcon> = { VAC: Palmtree, SICK: Thermometer, PERS: User, UNP: PauseCircle, VOL: HandHeart }

/**
 * My time off, one type at a time: the hours available today and the hours already booked ahead,
 * a button to request time off and a calculator for the balance on a future date.
 */
export function TimeOffWidget() {
  const { me } = useMe()
  const employeeId = me?.employeeId ?? ''
  const today = todayIso()
  const until = useMemo(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 12)
    return isoDate(d)
  }, [])
  const balances = useQuery(wyndbase.query.pto.balances({}))
  const ledger = useQuery({ ...wyndbase.query.pto.ledgerHistory({ employeeId }), enabled: !!employeeId })
  const proj = useQuery({ ...wyndbase.query.pto.projectedAccruals({ employeeId, until }), enabled: !!employeeId })
  const [i, setI] = useState(0)
  const [requesting, setRequesting] = useState(false)
  const [calculating, setCalculating] = useState(false)

  const list = balances.data ?? []
  if (balances.isLoading) return <SkeletonList rows={3} />
  if (!list.length)
    return (
      <div className="flex h-full flex-col">
        <Empty>No time off balances yet.</Empty>
      </div>
    )
  const b = list[((i % list.length) + list.length) % list.length]
  const typeId = String(b.type ?? '')
  const TypeIcon = ICON[b.code ?? ''] ?? CalendarDays
  // Leave already approved for days ahead is in the ledger, dated on those days.
  const scheduled = -(ledger.data ?? []).filter((e) => e.typeId === typeId && String(e.entryDate) > today && (e.kind === 'usage' || e.kind === 'reversal')).reduce((s, e) => s + Number(e.hours ?? 0), 0)

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 items-center gap-2">
        {list.length > 1 && (
          <button type="button" onClick={() => setI(i - 1)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50" aria-label="Previous type">
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-medium text-stone-700">{b.name ?? b.code}</p>
          <p className="mt-1 flex items-center justify-center gap-2 text-4xl font-semibold tracking-tight text-brand-800">
            <TypeIcon className="h-8 w-8 text-brand-700" strokeWidth={1.75} aria-hidden />
            {fmtHours(b.balance).replace(/\s?h$/, '')}
          </p>
          <p className="text-sm text-brand-700">hours available · ≈ {hoursToDays(b.balance)}</p>
          {scheduled > 0 && <p className="mt-0.5 text-xs text-stone-500">{fmtHours(scheduled)} scheduled</p>}
        </div>
        {list.length > 1 && (
          <button type="button" onClick={() => setI(i + 1)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50" aria-label="Next type">
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => setRequesting(true)}>
          <CalendarPlus className="h-4 w-4" /> Request time off
        </Button>
        <Button variant="secondary" onClick={() => setCalculating(true)} aria-label="Calculate a future balance" title="Calculate a future balance">
          <Calculator className="h-4 w-4" />
        </Button>
      </div>
      {requesting && <RequestDialog onClose={() => setRequesting(false)} />}
      {calculating && (
        <BalanceCalculator
          typeName={b.name ?? b.code ?? ''}
          ledger={(ledger.data ?? [])
            .filter((e) => e.typeId === typeId)
            .map((e) => ({ entryId: e.entryId, entryDate: String(e.entryDate), kind: String(e.kind), hours: Number(e.hours ?? 0), projected: false }))}
          policies={(proj.data ?? []).filter((p) => p.typeId === typeId)}
          until={until}
          onClose={() => setCalculating(false)}
        />
      )}
    </div>
  )
}

/** The balance on a chosen date: today's ledger, leave booked up to then, and the accruals the policy will add. */
function BalanceCalculator({ typeName, ledger, policies, until, onClose }: { typeName: string; ledger: HistoryRow[]; policies: Parameters<typeof projectAccruals>[0]; until: string; onClose: () => void }) {
  const today = todayIso()
  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 3)
    return isoDate(d)
  })
  const result = useMemo(() => {
    const projected = projectAccruals(policies, ledger, today)
    const upTo = (rows: HistoryRow[]) => rows.filter((r) => r.entryDate <= date).reduce((s, r) => s + r.hours, 0)
    const now = ledger.filter((r) => r.entryDate <= today).reduce((s, r) => s + r.hours, 0)
    const booked = -ledger.filter((r) => r.entryDate > today && r.entryDate <= date).reduce((s, r) => s + r.hours, 0)
    const earned = upTo(projected)
    return { now, booked, earned, total: upTo(ledger) + earned }
  }, [policies, ledger, today, date])
  return (
    <Modal title={`Calculate ${typeName}`} onClose={onClose} footer={<Button onClick={onClose}>Done</Button>}>
      <Field label="Balance on">
        <input type="date" className={inputCls} value={date} min={today} max={until} onChange={(e) => setDate(e.target.value || today)} />
      </Field>
      <dl className="divide-y divide-stone-100 rounded-xl border border-stone-200 text-sm">
        <div className="flex justify-between px-4 py-2.5">
          <dt className="text-stone-600">Available today</dt>
          <dd className="tabular-nums">{fmtHours(result.now)}</dd>
        </div>
        <div className="flex justify-between px-4 py-2.5">
          <dt className="text-stone-600">Will be earned by then</dt>
          <dd className="tabular-nums text-emerald-700">+ {fmtHours(result.earned)}</dd>
        </div>
        <div className="flex justify-between px-4 py-2.5">
          <dt className="text-stone-600">Already booked by then</dt>
          <dd className="tabular-nums text-red-700">− {fmtHours(Math.max(0, result.booked))}</dd>
        </div>
        <div className="flex justify-between bg-stone-50 px-4 py-3 font-semibold">
          <dt>Balance on {fmtDate(date)}</dt>
          <dd className="tabular-nums">
            {fmtHours(result.total)} <span className="font-normal text-stone-500">≈ {hoursToDays(result.total)}</span>
          </dd>
        </div>
      </dl>
      <p className="text-xs text-stone-500">An estimate from your current policy; a policy change or leave of absence changes it.</p>
    </Modal>
  )
}
