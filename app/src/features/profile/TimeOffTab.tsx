import { useQuery } from '@tanstack/react-query'
import { Badge, Card, Empty, statusTone } from '../../components/ui/ui'
import { fmtDate, fmtHours, label } from '../../lib/format'
import { wyndbase } from '../../wyndbase'

export function TimeOffTab({ employeeId }: { employeeId: string }) {
  const balances = useQuery(wyndbase.query.pto.balances({ employeeId }))
  const requests = useQuery(wyndbase.query.pto.myRequests({ employeeId }))
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>
      <Card title="Requests">
        {(requests.data ?? []).length === 0 ? (
          <Empty>No requests.</Empty>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                <th className="py-2 pr-4">Dates</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Hours</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Decided by</th>
              </tr>
            </thead>
            <tbody>
              {requests.data?.map((r) => (
                <tr key={r.requestId} className="border-b border-stone-100">
                  <td className="py-2 pr-4">
                    {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                  </td>
                  <td className="py-2 pr-4">{r.typeName}</td>
                  <td className="py-2 pr-4">{fmtHours(r.totalHours)}</td>
                  <td className="py-2 pr-4">
                    <Badge tone={statusTone(r.status)}>{label(r.status)}</Badge>
                  </td>
                  <td className="py-2 pr-4 text-stone-500">{r.decidedBy ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
