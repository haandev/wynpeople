import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Card, ErrorNote, Field, inputCls, Modal } from '../../components/ui/ui'
import { errorMessage, fmtDate, label, todayIso } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll } from '../profile/data'
import { ReadOnlyNote, Table, Td } from './common'
import { RecalcPreview } from './RecalcPreview'

type Policy = NonNullable<ReturnType<typeof usePolicies>['data']>[number]
const usePolicies = () => useQuery(wyndbase.query.pto.listPolicies())

const NUM_FIELDS = [
  ['accrualHoursPerPeriod', 'Hours per period'], ['annualGrantHours', 'Annual grant (h)'], ['accrualCapPerYear', 'Cap per year (h)'],
  ['maxCarryover', 'Max carryover (h)'], ['carryoverExpiresAfterMonths', 'Carryover expires (months)'], ['negativeBalanceLimitHours', 'Negative limit (h)'],
  ['minPartialHours', 'Min partial day (h)'], ['hoursPerDay', 'Hours per day'],
] as const

function EditPolicy({ p, onClose }: { p: Policy; onClose: () => void }) {
  const [effectiveFrom, setEffectiveFrom] = useState(todayIso())
  const [v, setV] = useState<Record<string, string>>(() =>
    Object.fromEntries([...NUM_FIELDS.map(([k]) => [k, p[k] === null || p[k] === undefined ? '' : String(Number(p[k]))]), ['accrualMode', p.accrualMode ?? 'per_period'], ['payFrequency', p.payFrequency ?? ''], ['onTermination', p.onTermination ?? 'forfeit']]),
  )
  const [recalcId, setRecalcId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const num = (k: string) => (v[k] === '' ? null : Number(v[k]))

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await wyndbase.mutation.pto.changePolicy({
        effectiveFrom, typeId: p.typeId ?? '', country: String(p.country ?? ''), employmentType: p.employmentType ?? 'full_time', name: p.name ?? '',
        accrualMode: v.accrualMode, payFrequency: v.payFrequency || null, onTermination: v.onTermination || null,
        prorateFirstPeriod: p.prorateFirstPeriod, accrueDuringLeave: p.accrueDuringLeave,
        accrualHoursPerPeriod: num('accrualHoursPerPeriod'), annualGrantHours: num('annualGrantHours'), accrualCapPerYear: num('accrualCapPerYear'),
        maxCarryover: num('maxCarryover'), carryoverExpiresAfterMonths: num('carryoverExpiresAfterMonths'), negativeBalanceLimitHours: num('negativeBalanceLimitHours'),
        minPartialHours: num('minPartialHours'), hoursPerDay: num('hoursPerDay'),
      })
      await refreshAll()
      if (r[0]?.recalcRequired) {
        // Saving a back-dated rule queued a recalculation: open its preview at once.
        const open = await wyndbase.query.pto.listPendingRecalcs({ status: 'open' })
        setRecalcId(open[0]?.id ?? null)
        if (!open[0]) onClose()
      } else onClose()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={`Edit ${p.name}`} onClose={onClose} footer={!recalcId && <><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save from date'}</Button></>}>
      {recalcId ? (
        <>
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This change reaches back to {fmtDate(effectiveFrom)}. Review the recalculation before balances change.
          </p>
          <RecalcPreview pendingRecalcId={recalcId} onDone={onClose} />
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Effective from">
              <input type="date" className={inputCls} value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            </Field>
            <Field label="Accrual mode">
              <select className={inputCls} value={v.accrualMode} onChange={(e) => setV({ ...v, accrualMode: e.target.value })}>
                {['per_period', 'annual_grant', 'unlimited'].map((m) => (
                  <option key={m} value={m}>
                    {label(m)}
                  </option>
                ))}
              </select>
            </Field>
            {v.accrualMode === 'per_period' && (
              <Field label="Pay frequency">
                <select className={inputCls} value={v.payFrequency} onChange={(e) => setV({ ...v, payFrequency: e.target.value })}>
                  {['monthly', 'semi_monthly', 'biweekly'].map((m) => (
                    <option key={m} value={m}>
                      {label(m)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {NUM_FIELDS.map(([k, t]) => (
              <Field key={k} label={t}>
                <input type="number" step="0.5" className={inputCls} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
              </Field>
            ))}
            <Field label="On termination">
              <select className={inputCls} value={v.onTermination} onChange={(e) => setV({ ...v, onTermination: e.target.value })}>
                {['payout', 'forfeit'].map((m) => (
                  <option key={m} value={m}>
                    {label(m)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <ErrorNote error={error} />
        </>
      )}
    </Modal>
  )
}

export function PolicySettings({ canEdit }: { canEdit: boolean }) {
  const q = usePolicies()
  const [edit, setEdit] = useState<Policy | null>(null)
  return (
    <Card title="Accrual policies">
      {!canEdit && <ReadOnlyNote />}
      <Table head={['Country', 'Type', 'Employment', 'Name', 'Mode', 'Rule', 'Carryover', 'Since', '']}>
        {(q.data ?? []).map((p) => (
          <tr key={p.policyId} className="border-b border-stone-100">
            <Td>{String(p.country)}</Td>
            <Td>{p.typeName}</Td>
            <Td>{label(p.employmentType)}</Td>
            <Td className="font-medium">{p.name}</Td>
            <Td>{label(p.accrualMode)}</Td>
            <Td>
              {p.accrualMode === 'per_period'
                ? `${Number(p.accrualHoursPerPeriod)} h ${label(p.payFrequency).toLowerCase()}`
                : p.accrualMode === 'annual_grant'
                  ? `${Number(p.annualGrantHours)} h / year`
                  : 'No balance'}
            </Td>
            <Td>{p.maxCarryover === null ? '—' : `${Number(p.maxCarryover)} h`}</Td>
            <Td>{fmtDate(p._effectiveFrom)}</Td>
            <Td className="text-right">{canEdit && <Button variant="ghost" onClick={() => setEdit(p)}>Edit</Button>}</Td>
          </tr>
        ))}
      </Table>
      {edit && <EditPolicy p={edit} onClose={() => setEdit(null)} />}
    </Card>
  )
}
