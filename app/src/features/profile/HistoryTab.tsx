import { Card, Empty } from '../../components/ui/ui'
import { fmtDate, label, text } from '../../lib/format'
import { useHistory } from './data'
import type { History } from './groupPeriods'

const TITLES: Record<string, string> = {
  jobTitle: 'Job title', department: 'Department', productTeam: 'Product team', office: 'Location', manager: 'Reports to',
  costCenter: 'Cost center', legalEntity: 'Legal entity', status: 'Status', employmentType: 'Employment type',
  workerType: 'Worker type', leaveType: 'Leave type', terminationReason: 'Termination reason', terminationType: 'Termination type',
}
const ENUMS = new Set(['status', 'employmentType', 'workerType', 'leaveType', 'terminationReason', 'terminationType'])

/** Every field change as one timeline, newest first. */
export function HistoryTab({ employeeId }: { employeeId: string }) {
  const q = useHistory(employeeId)
  const h = (q.data?.[0] ?? {}) as unknown as History
  const events = Object.entries(h)
    .filter(([k, v]) => k in TITLES && Array.isArray(v))
    .flatMap(([k, periods]) => (periods ?? []).map((p) => ({ field: k, ...p })))
    .sort((a, b) => (b._effectiveFrom ?? '').localeCompare(a._effectiveFrom ?? ''))
  return (
    <Card title="Change history">
      {events.length === 0 ? (
        <Empty>{q.isLoading ? 'Loading…' : 'No history visible to you.'}</Empty>
      ) : (
        <ol className="relative space-y-3 border-l border-stone-200 pl-5">
          {events.map((e, i) => (
            <li key={i} className="text-sm">
              <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500" />
              <p className="text-xs text-stone-500">{fmtDate(e._effectiveFrom)}</p>
              <p>
                <span className="font-medium">{TITLES[e.field]}</span> → {ENUMS.has(e.field) ? label(e.value as string) : text(e.value)}
                {e.reason && <span className="text-stone-500"> — {e.reason}</span>}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
