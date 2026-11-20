import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button, Card, Empty } from '../../components/ui/ui'
import { fmtDate, label } from '../../lib/format'
import { ChangeDialog, type ChangeKind } from './ChangeDialog'
import { CorrectDialog, type CorrectTarget } from './CorrectDialog'
import { type ProfileRow, useCompensation, useHistory } from './data'
import { EffectiveTable } from './EffectiveTable'
import type { History } from './groupPeriods'

export function JobTab({ p, canEdit }: { p: ProfileRow; canEdit: boolean }) {
  const history = useHistory(p.employeeId)
  const comp = useCompensation(p.employeeId)
  const [change, setChange] = useState<{ kind: ChangeKind; status?: string } | null>(null)
  const [correct, setCorrect] = useState<CorrectTarget | null>(null)
  const [recalc, setRecalc] = useState(false)
  const h = (history.data?.[0] ?? {}) as unknown as History

  return (
    <div className="space-y-5">
      {recalc && (
        <div className="flex items-center justify-between rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span>This change affects time off accruals in the past. A recalculation is waiting for review.</span>
          <Link to="/settings" className="font-medium underline">
            Recalculate PTO
          </Link>
        </div>
      )}
      {canEdit && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={() => setChange({ kind: 'status', status: 'leave' })}>
            Change status
          </Button>
          {p.status !== 'terminated' && (
            <Button variant="danger" onClick={() => setChange({ kind: 'status', status: 'terminated' })}>
              Terminate
            </Button>
          )}
        </div>
      )}

      <Card title="Employment status" actions={canEdit && <Button variant="ghost" onClick={() => setChange({ kind: 'status', status: 'active' })}>Add change</Button>}>
        <EffectiveTable
          history={h}
          columns={[
            { key: 'status', title: 'Status', enumLike: true },
            { key: 'employmentType', title: 'Employment type', enumLike: true },
            { key: 'workerType', title: 'Worker type', enumLike: true },
            { key: 'leaveType', title: 'Leave type', enumLike: true },
            ...((h.terminationReason?.length ?? 0) > 0 ? [{ key: 'terminationReason', title: 'Termination reason', enumLike: true }] : []),
          ]}
          onCorrect={canEdit ? (periodStart) => setCorrect({ kind: 'status', periodStart }) : undefined}
        />
      </Card>

      <Card title="Job information" actions={canEdit && <Button variant="ghost" onClick={() => setChange({ kind: 'job' })}>Add change</Button>}>
        <EffectiveTable
          history={h}
          columns={[
            { key: 'jobTitle', title: 'Job title' },
            { key: 'department', title: 'Department' },
            { key: 'productTeam', title: 'Product team' },
            { key: 'office', title: 'Location' },
            { key: 'manager', title: 'Reports to' },
            { key: 'costCenter', title: 'Cost center' },
          ]}
          onCorrect={canEdit ? (periodStart) => setCorrect({ kind: 'job', periodStart }) : undefined}
        />
      </Card>

      {(comp.data?.length ?? 0) > 0 && (
        <Card title="Compensation" actions={canEdit && <Button variant="ghost" onClick={() => setChange({ kind: 'compensation' })}>Add change</Button>}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                <th className="py-2 pr-4">Effective</th>
                <th className="py-2 pr-4">Pay rate</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Reason</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {comp.data?.map((c, i) => (
                <tr key={c.periodId} className={`border-b border-stone-100 ${i === 0 ? 'font-medium' : 'text-stone-600'}`}>
                  <td className="py-2 pr-4">{fmtDate(c._effectiveFrom)}</td>
                  <td className="py-2 pr-4">
                    {Number(c.payRate).toLocaleString()} {c.currency} / {c.payPeriod}
                  </td>
                  <td className="py-2 pr-4">{label(c.payType)}</td>
                  <td className="py-2 pr-4 text-stone-500">{c.changeReason ?? '—'}</td>
                  {canEdit && (
                    <td className="py-2 text-right">
                      <Button variant="ghost" onClick={() => setCorrect({ kind: 'compensation', periodId: c.periodId, current: c })}>
                        Correct
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {history.isLoading && <Empty>Loading history…</Empty>}

      {change && (
        <ChangeDialog kind={change.kind} initialStatus={change.status} employeeId={p.employeeId} onClose={() => setChange(null)} onRecalc={() => setRecalc(true)} />
      )}
      {correct && <CorrectDialog target={correct} employeeId={p.employeeId} onClose={() => setCorrect(null)} onRecalc={() => setRecalc(true)} />}
    </div>
  )
}
