import { useState } from 'react'
import { SkeletonList } from '../../components/ui/Skeleton'
import { Badge, Button, Card, Empty, statusTone } from '../../components/ui/ui'
import { errorMessage, fmtDate, fmtHours, label, todayIso } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll } from '../profile/data'
import { useMyRequests } from './data'

/** The signed-in person's own requests, with cancel while it is still allowed. */
export function MyRequests() {
  const q = useMyRequests()
  const [error, setError] = useState<string | null>(null)
  const cancel = async (requestId: string) => {
    setError(null)
    try {
      await wyndbase.mutation.pto.cancelRequest({ requestId, reason: 'Canceled by employee' })
      await refreshAll()
    } catch (e) {
      setError(errorMessage(e))
    }
  }
  return (
    <Card title="My requests">
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      {q.isLoading ? (
        <SkeletonList rows={3} />
      ) : (q.data ?? []).length === 0 ? (
        <Empty>You have no requests yet.</Empty>
      ) : (
        <ul className="divide-y divide-stone-100">
          {q.data?.map((r) => {
            const cancellable = r.status === 'pending' || (r.status === 'approved' && (r.startDate ?? '') > todayIso())
            return (
              <li key={r.requestId} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <p className="font-medium">
                    {r.typeName} · {fmtDate(r.startDate)} – {fmtDate(r.endDate)}
                  </p>
                  <p className="text-xs text-stone-500">
                    {fmtHours(r.totalHours)}
                    {r.decidedBy && ` · ${label(r.status)} by ${r.decidedBy}`}
                    {r.decisionNote && ` · “${r.decisionNote}”`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone(r.status)}>{label(r.status)}</Badge>
                  {cancellable && (
                    <Button variant="ghost" onClick={() => cancel(r.requestId)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
