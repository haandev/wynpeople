import { useState } from 'react'
import { Button, ErrorNote, Field, inputCls, Modal } from '../../components/ui/ui'
import { errorMessage, fmtDate, label } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll } from './data'
import { emptyJob, JobFields, jobParams } from './JobFields'
import { CURRENCIES, EMPLOYMENT_TYPES, LEAVE_TYPES, PAY_PERIODS, PAY_TYPES, TERMINATION_REASONS, WORKER_TYPES } from './options'

export type CorrectTarget =
  | { kind: 'job'; periodStart: string }
  | { kind: 'status'; periodStart: string }
  | { kind: 'compensation'; periodId: string; current: { payRate: string | null; currency: string | null; payType: string | null; payPeriod: string | null; changeReason: string | null } }

/** "Correct": rewrites a past period in place. Kept visually distinct from "Add change". */
export function CorrectDialog({ target, employeeId, onClose, onRecalc }: { target: CorrectTarget; employeeId: string; onClose: () => void; onRecalc: () => void }) {
  const [reason, setReason] = useState('')
  const [job, setJob] = useState(emptyJob)
  const [st, setSt] = useState({ employmentType: '', workerType: '', leaveType: '', terminationReason: '' })
  const cur = target.kind === 'compensation' ? target.current : null
  const [comp, setComp] = useState({
    payRate: cur?.payRate ?? '',
    currency: cur?.currency ?? 'TRY',
    payType: cur?.payType ?? 'salary',
    payPeriod: cur?.payPeriod ?? 'month',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      if (target.kind === 'job') {
        const params = jobParams({ ...job, employmentType: '' })
        if (Object.keys(params).length === 0) throw new Error('Correct at least one field.')
        const r = await wyndbase.mutation.hr.correctJob({ employeeId, periodStart: target.periodStart, reason: reason || null, ...params })
        if (r[0]?.recalcRequired) onRecalc()
      } else if (target.kind === 'status') {
        const params = Object.fromEntries(Object.entries(st).filter(([, v]) => v))
        if (Object.keys(params).length === 0) throw new Error('Correct at least one field.')
        const r = await wyndbase.mutation.hr.correctStatus({ employeeId, periodStart: target.periodStart, reason: reason || null, ...params })
        if (r[0]?.recalcRequired) onRecalc()
      } else {
        await wyndbase.mutation.hr.correctCompensation({
          employeeId,
          periodId: target.periodId,
          changeReason: reason || cur?.changeReason || null,
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

  const sel = (k: keyof typeof st, opts: readonly string[], title: string) => (
    <Field label={title}>
      <select className={inputCls} value={st[k]} onChange={(e) => setSt({ ...st, [k]: e.target.value })}>
        <option value="">— unchanged —</option>
        {opts.map((o) => (
          <option key={o} value={o}>
            {label(o)}
          </option>
        ))}
      </select>
    </Field>
  )

  return (
    <Modal
      title={`Correct ${target.kind === 'compensation' ? 'compensation' : target.kind === 'job' ? 'job information' : 'employment status'}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? 'Saving…' : 'Save correction'}
          </Button>
        </>
      }
    >
      <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        This edits history; use Add change for new events.
      </p>
      {'periodStart' in target && <p className="text-sm text-stone-600">Period starting {fmtDate(target.periodStart)}</p>}
      <Field label="Why is this being corrected?">
        <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Typo in title" />
      </Field>
      {target.kind === 'job' && <JobFields value={job} onChange={setJob} withEmploymentType={false} />}
      {target.kind === 'status' && (
        <div className="grid gap-3 sm:grid-cols-2">
          {sel('employmentType', EMPLOYMENT_TYPES, 'Employment type')}
          {sel('workerType', WORKER_TYPES, 'Worker type')}
          {sel('leaveType', LEAVE_TYPES, 'Leave type')}
          {sel('terminationReason', TERMINATION_REASONS, 'Termination reason')}
        </div>
      )}
      {target.kind === 'compensation' && (
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
