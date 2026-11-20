import { useQuery } from '@tanstack/react-query'
import { SkeletonList, SkeletonStatCards } from '../../components/ui/Skeleton'
import { Badge, Card, Empty, statusTone } from '../../components/ui/ui'
import { fmtDate, fmtHours, label } from '../../lib/format'
import { wyndbase } from '../../wyndbase'

export function TimeOffTab({ employeeId }: { employeeId: string }) {
  const balances = useQuery(wyndbase.query.pto.balances({ employeeId }))
  const requests = useQuery(wyndbase.query.pto.myRequests({ employeeId }))
  return (
    <div className="space-y-5">
      {balances.isLoading ? <SkeletonStatCards count={3} /> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(balances.data ?? []).map((b) => (
          <Card key={b.code ?? b.type}>
            <p className="text-xs uppercase tracking-wide text-stone-500">{b.name ?? b.code}</p>
            <p className="mt-1 text-2xl font-semibold text-brand-800">{fmtHours(b.balance)}</p>
            <p className="mt-1 text-xs text-stone-500">
              accrued {fmtHours(b.accrued)} · used {fmtHours(b.used)}
            </p>
          </Card>
        ))}
        {balances.data?.length === 0 && <Empty>No balances yet.</Empty>}
      </div>}
      <Card title="Requests">
        {requests.isLoading ? (
          <SkeletonList rows={3} />
        ) : (requests.data ?? []).length === 0 ? (
          <Empty>No requests.</Empty>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Dates</th>
                <th>Type</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Decided by</th>
              </tr>
            </thead>
            <tbody>
              {requests.data?.map((r) => (
                <tr key={r.requestId}>
                  <td>
                    {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                  </td>
                  <td>{r.typeName}</td>
                  <td>{fmtHours(r.totalHours)}</td>
                  <td>
                    <Badge tone={statusTone(r.status)}>{label(r.status)}</Badge>
                  </td>
                  <td className="text-stone-500">{r.decidedBy ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
