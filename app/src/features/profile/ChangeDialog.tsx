import { useState } from 'react'
import { Button, ErrorNote, Field, inputCls, Modal } from '../../components/ui/ui'
import { errorMessage, label, todayIso } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll } from './data'
import { emptyJob, JobFields, jobParams } from './JobFields'
import { CURRENCIES, LEAVE_TYPES, PAY_PERIODS, PAY_TYPES, STATUSES, TERMINATION_REASONS, TERMINATION_TYPES } from './options'

export type ChangeKind = 'job' | 'status' | 'compensation'

/** "Add change": a new event from an effective date, with a reason. History is kept. */
export function ChangeDialog({
  kind,
  employeeId,
  onClose,
  onRecalc,
  initialStatus,
}: {
  kind: ChangeKind
  employeeId: string
  onClose: () => void
  onRecalc: () => void
  initialStatus?: string
}) {
  const [effectiveFrom, setEffectiveFrom] = useState(todayIso())
  const [reason, setReason] = useState('')
  const [job, setJob] = useState(emptyJob)
  const [status, setStatus] = useState({ status: initialStatus ?? 'leave', leaveType: '', terminationReason: '', terminationType: '', terminationNote: '' })
  const [comp, setComp] = useState({ payRate: '', currency: 'TRY', payType: 'salary', payPeriod: 'month' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      if (kind === 'job') {
        const params = jobParams(job)
        if (Object.keys(params).length === 0) throw new Error('Change at least one field.')
        const r = await wyndbase.mutation.hr.changeJob({ employeeId, effectiveFrom, reason: reason || null, ...params })
        if (r[0]?.recalcRequired) onRecalc()
      } else if (kind === 'status') {
        const r = await wyndbase.mutation.hr.changeStatus({
          employeeId,
          effectiveFrom,
          reason: reason || null,
          status: status.status,
          leaveType: status.status === 'leave' ? status.leaveType || null : null,
          terminationReason: status.status === 'terminated' ? status.terminationReason || null : null,
          terminationType: status.status === 'terminated' ? status.terminationType || null : null,
          terminationNote: status.status === 'terminated' ? status.terminationNote || null : null,
        })
        if (r[0]?.recalcRequired) onRecalc()
      } else {
        await wyndbase.mutation.hr.changeCompensation({
          employeeId,
          effectiveFrom,
          changeReason: reason || null,
          payRate: Number(comp.payRate),
          currency: comp.currency,
          payType: comp.payType as 'salary' | 'hourly',
          payPeriod: comp.payPeriod as 'year' | 'month' | 'hour',
        })
      }
      await refreshAll()
      onClose()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const title = kind === 'job' ? 'Job information change' : kind === 'status' ? (initialStatus === 'terminated' ? 'Terminate employee' : 'Change status') : 'Compensation change'
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy} variant={initialStatus === 'terminated' ? 'danger' : 'primary'}>
            {busy ? 'Saving…' : 'Save change'}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Effective date">
          <input type="date" className={inputCls} value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
        </Field>
        <Field label="Reason">
          <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Promotion" />
        </Field>
      </div>
      {kind === 'job' && <JobFields value={job} onChange={setJob} />}
      {kind === 'status' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Status">
            <select className={inputCls} value={status.status} onChange={(e) => setStatus({ ...status, status: e.target.value })}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ))}
            </select>
          </Field>
          {status.status === 'leave' && (
            <Field label="Leave type">
              <select className={inputCls} value={status.leaveType} onChange={(e) => setStatus({ ...status, leaveType: e.target.value })}>
                <option value="">—</option>
                {LEAVE_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {label(s)}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {status.status === 'terminated' && (
            <>
              <Field label="Termination reason">
                <select className={inputCls} value={status.terminationReason} onChange={(e) => setStatus({ ...status, terminationReason: e.target.value })}>
                  <option value="">—</option>
                  {TERMINATION_REASONS.map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Termination type">
                <select className={inputCls} value={status.terminationType} onChange={(e) => setStatus({ ...status, terminationType: e.target.value })}>
                  <option value="">—</option>
                  {TERMINATION_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Note (HR only)">
                  <textarea className={inputCls} rows={2} value={status.terminationNote} onChange={(e) => setStatus({ ...status, terminationNote: e.target.value })} />
                </Field>
              </div>
            </>
          )}
        </div>
      )}
      {kind === 'compensation' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Pay rate">
            <input type="number" min="0" step="0.01" className={inputCls} value={comp.payRate} onChange={(e) => setComp({ ...comp, payRate: e.target.value })} />
          </Field>
          <Field label="Currency">
            <select className={inputCls} value={comp.currency} onChange={(e) => setComp({ ...comp, currency: e.target.value })}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Pay type">
            <select className={inputCls} value={comp.payType} onChange={(e) => setComp({ ...comp, payType: e.target.value })}>
              {PAY_TYPES.map((c) => (
                <option key={c} value={c}>
                  {label(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Per">
            <select className={inputCls} value={comp.payPeriod} onChange={(e) => setComp({ ...comp, payPeriod: e.target.value })}>
              {PAY_PERIODS.map((c) => (
                <option key={c} value={c}>
                  {label(c)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
      <ErrorNote error={error} />
    </Modal>
  )
}
