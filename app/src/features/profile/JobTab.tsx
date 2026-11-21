import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { Button, Card } from '../../components/ui/ui'
import { fmtDate, label, todayIso } from '../../lib/format'
import { ChangeDialog, type ChangeKind } from './ChangeDialog'
import { CorrectDialog, type CorrectTarget } from './CorrectDialog'
import { type ProfileRow, useCompensation, useHistory } from './data'
import { EffectiveTable } from './EffectiveTable'
import { SubjectAccessButton } from './SubjectAccessButton'
import { currentIndex, type History } from './groupPeriods'

export function JobTab({ p, canEdit }: { p: ProfileRow; canEdit: boolean }) {
  const history = useHistory(p.employeeId)
  const comp = useCompensation(p.employeeId)
  // Pay periods come newest first; the one in effect today is emphasised, a later one is marked (future).
  const compCurrent = currentIndex((comp.data ?? []).map((c) => String(c._effectiveFrom ?? '')), todayIso())
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
          <SubjectAccessButton employeeId={p.employeeId} employeeNumber={p.employeeNumber} />
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

      {history.isLoading ? (
        <div className="space-y-5">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={4} />
        </div>
      ) : (
      <>
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
          <table className="tbl">
            <thead>
              <tr>
                <th>Effective</th>
                <th>Pay rate</th>
                <th>Type</th>
                <th>Reason</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {comp.data?.map((c, i) => (
                <tr key={c.periodId} className={i === compCurrent ? 'font-medium' : 'text-stone-600'}>
                  <td className="whitespace-nowrap">
                    {fmtDate(c._effectiveFrom)}
                    {String(c._effectiveFrom ?? '') > todayIso() && <span className="ml-1 text-xs text-amber-600">(future)</span>}
                  </td>
                  <td>
                    {Number(c.payRate).toLocaleString()} {c.currency} / {c.payPeriod}
                  </td>
                  <td>{label(c.payType)}</td>
                  <td className="text-stone-500">{c.changeReason ?? '—'}</td>
                  {canEdit && (
                    <td className="text-right">
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

      </>
      )}

      {change && (
        <ChangeDialog kind={change.kind} initialStatus={change.status} employeeId={p.employeeId} onClose={() => setChange(null)} onRecalc={() => setRecalc(true)} />
      )}
      {correct && <CorrectDialog target={correct} employeeId={p.employeeId} onClose={() => setCorrect(null)} onRecalc={() => setRecalc(true)} />}
    </div>
  )
}
