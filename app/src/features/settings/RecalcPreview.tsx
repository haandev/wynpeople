import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Card, Empty, ErrorNote } from '../../components/ui/ui'
import { errorMessage, fmtDate, fmtHours, label } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll } from '../profile/data'
import { Table, Td } from './common'

/** Preview of one pending recalculation (who and how many periods), with Apply / Dismiss. */
export function RecalcPreview({ pendingRecalcId, onDone }: { pendingRecalcId: string; onDone?: () => void }) {
  const q = useQuery(wyndbase.query.pto.previewRecalc({ pendingRecalcId }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const act = async (kind: 'apply' | 'dismiss') => {
    setBusy(true)
    setError(null)
    try {
      if (kind === 'apply') await wyndbase.mutation.pto.applyRecalc({ pendingRecalcId })
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
        <Empty>Calculating preview…</Empty>
      ) : (q.data ?? []).length === 0 ? (
        <Empty>No employee is affected.</Empty>
      ) : (
        <Table head={['Employee', 'Employment', 'From', 'Periods to re-accrue', 'Currently accrued in range']}>
          {q.data?.map((r) => (
            <tr key={r.employeeId} className="border-b border-stone-100">
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
  const q = useQuery(wyndbase.query.pto.listPendingRecalcs({ status: null }))
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
                  </p>
                </div>
                {canEdit && r.status === 'open' && (
                  <Button variant="secondary" onClick={() => setOpen(open === r.id ? null : r.id)}>
                    {open === r.id ? 'Hide preview' : 'Preview'}
                  </Button>
                )}
              </div>
              {open === r.id && (
                <div className="mt-3">
                  <RecalcPreview pendingRecalcId={r.id} onDone={() => setOpen(null)} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
