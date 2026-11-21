import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { Button, Card, Empty, ErrorNote } from '../../components/ui/ui'
import { errorMessage, fmtDate, fmtHours, label } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll } from '../profile/data'
import { Table, Td } from './common'
import { useRecalcReviews } from './recalcReviews'

/**
 * Preview of one pending recalculation (who and how many periods), with Apply / Dismiss.
 * A recalculation queued since the review flow exists waits in HR's inbox: answering that request
 * runs the flow (apply or dismiss). One with no request (older, or reopened) is applied directly.
 */
export function RecalcPreview({ pendingRecalcId, interactionId, onDone }: { pendingRecalcId: string; interactionId?: string; onDone?: () => void }) {
  const q = useQuery(wyndbase.query.pto.previewRecalc({ pendingRecalcId }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const act = async (kind: 'apply' | 'dismiss') => {
    setBusy(true)
    setError(null)
    try {
      if (interactionId) {
        await wyndbase.mutation.system.answerInteraction({ interactionId, response: kind === 'apply' ? { decision: 'apply' } : { decision: 'dismiss', note: 'Dismissed in settings' } })
        await wyndbase.inbox.markAllSeen().catch(() => undefined)
      } else if (kind === 'apply') await wyndbase.mutation.pto.applyRecalc({ pendingRecalcId })
      else await wyndbase.mutation.pto.dismissRecalc({ pendingRecalcId, reason: 'Dismissed in settings' })
      await refreshAll()
      onDone?.()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-3">
      {q.isLoading ? (
        <SkeletonTable rows={3} cols={5} />
      ) : (q.data ?? []).length === 0 ? (
        <Empty>No employee is affected.</Empty>
      ) : (
        <Table head={['Employee', 'Employment', 'From', 'Periods to re-accrue', 'Currently accrued in range']}>
          {q.data?.map((r) => (
            <tr key={r.employeeId}>
              <Td className="font-medium">{r.name}</Td>
              <Td>{label(r.employmentType)}</Td>
              <Td>{fmtDate(String(r.fromDate ?? ''))}</Td>
              <Td>{r.periodsInRange}</Td>
              <Td>{fmtHours(r.currentAccrued)} → reversed and re-accrued under the new rule</Td>
            </tr>
          ))}
        </Table>
      )}
      <ErrorNote error={error} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" disabled={busy} onClick={() => act('dismiss')}>
          Dismiss
        </Button>
        <Button disabled={busy} onClick={() => act('apply')}>
          {busy ? 'Working…' : 'Apply recalculation'}
        </Button>
      </div>
    </div>
  )
}

export function RecalcSettings({ canEdit }: { canEdit: boolean }) {
  // After an answer the flow applies or dismisses on its own, a few seconds later: poll until it has.
  const [waitUntil, setWaitUntil] = useState(0)
  const q = useQuery({
    ...wyndbase.query.pto.listPendingRecalcs({ status: null }),
    refetchInterval: (query) => ((query.state.data ?? []).some((r) => r.status === 'applying') || Date.now() < waitUntil ? 1000 : false),
  })
  const reviews = useRecalcReviews()
  const [open, setOpen] = useState<string | null>(null)
  return (
    <Card title="PTO recalculations">
      <p className="mb-3 text-sm text-stone-500">Back-dated job or policy changes queue a recalculation here. Nothing changes until it is applied.</p>
      {(q.data ?? []).length === 0 ? (
        <Empty>No recalculations.</Empty>
      ) : (
        <ul className="space-y-3">
          {q.data?.map((r) => (
            <li key={r.id} className="rounded-md border border-stone-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{r.reason}</p>
                  <p className="text-xs text-stone-500">
                    From {fmtDate(r.fromDate)} · {label(r.status)} · queued {fmtDate(r.createdAt)}
                    {r.status === 'open' && reviews.has(String(r.id)) && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 ring-1 ring-amber-200">In your inbox</span>}
                  </p>
                </div>
                {canEdit && r.status === 'applying' && (
                  <Button
                    variant="secondary"
                    title="If re-accrual did not finish, reopen and apply again; nothing is written twice."
                    onClick={() => wyndbase.mutation.pto.reopenRecalc({ pendingRecalcId: r.id }).then(refreshAll).catch((e) => alert(errorMessage(e)))}
                  >
                    Reopen
                  </Button>
                )}
                {canEdit && r.status === 'open' && (
                  <Button variant="secondary" onClick={() => setOpen(open === r.id ? null : r.id)}>
                    {open === r.id ? 'Hide preview' : 'Preview'}
                  </Button>
                )}
              </div>
              {open === r.id && (
                <div className="mt-3">
                  <RecalcPreview
                    pendingRecalcId={r.id}
                    interactionId={reviews.get(String(r.id))}
                    onDone={() => {
                      setOpen(null)
                      setWaitUntil(Date.now() + 10_000)
                    }}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
