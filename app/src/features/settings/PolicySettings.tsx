import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Card, ErrorNote, Field, inputCls, Modal } from '../../components/ui/ui'
import { errorMessage, fmtDate, label, todayIso } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll } from '../profile/data'
import { useTypes } from '../timeoff/data'
import { CountryPicker, countryName, ReadOnlyNote, Table, Td } from './common'
import { RecalcPreview } from './RecalcPreview'

type Policy = NonNullable<ReturnType<typeof usePolicies>['data']>[number]
const usePolicies = () => useQuery(wyndbase.query.pto.listPolicies())

const NUM_FIELDS = [
  ['accrualHoursPerPeriod', 'Hours per period'], ['annualGrantHours', 'Annual grant (h)'], ['accrualCapPerYear', 'Cap per year (h)'],
  ['maxCarryover', 'Max carryover (h)'], ['carryoverExpiresAfterMonths', 'Carryover expires (months)'], ['negativeBalanceLimitHours', 'Negative limit (h)'],
  ['minPartialHours', 'Min partial day (h)'], ['hoursPerDay', 'Hours per day'],
] as const

// A new policy starts from the usual defaults: 8-hour days, 2-hour minimum, monthly accrual.
const NEW_DEFAULTS: Record<string, string> = { minPartialHours: '2', hoursPerDay: '8', negativeBalanceLimitHours: '0' }

/** Edits a policy from a date, or (p == null) creates one: a policy is one per type, country and employment type. */
function EditPolicy({ p, onClose }: { p: Policy | null; onClose: () => void }) {
  const types = useTypes()
  const [effectiveFrom, setEffectiveFrom] = useState(todayIso())
  const [key, setKey] = useState({ typeId: p?.typeId ?? '', country: p ? String(p.country ?? '') : '', employmentType: p?.employmentType ?? 'full_time', name: p?.name ?? '' })
  const [v, setV] = useState<Record<string, string>>(() =>
    Object.fromEntries([
      ...NUM_FIELDS.map(([k]) => [k, !p ? (NEW_DEFAULTS[k] ?? '') : p[k] === null || p[k] === undefined ? '' : String(Number(p[k]))]),
      ['accrualMode', p?.accrualMode ?? 'per_period'], ['payFrequency', p?.payFrequency ?? (p ? '' : 'monthly')], ['onTermination', p?.onTermination ?? 'forfeit'],
    ]),
  )
  const policies = usePolicies()
  // changePolicy is an upsert on (type, country, employment): a "new" one with an existing key would silently replace it.
  const clash = !p && (policies.data ?? []).find((x) => x.typeId === key.typeId && String(x.country) === key.country && x.employmentType === key.employmentType)
  const keyReady = !!key.typeId && !!key.country && !!key.employmentType && !!key.name.trim() && !clash
  const [recalcId, setRecalcId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const num = (k: string) => (v[k] === '' ? null : Number(v[k]))

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await wyndbase.mutation.pto.changePolicy({
        effectiveFrom, typeId: key.typeId, country: key.country, employmentType: key.employmentType, name: key.name.trim(),
        accrualMode: v.accrualMode, payFrequency: v.payFrequency || null, onTermination: v.onTermination || null,
        prorateFirstPeriod: p?.prorateFirstPeriod ?? true, accrueDuringLeave: p?.accrueDuringLeave ?? false,
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
    <Modal title={p ? `Edit ${p.name}` : 'New accrual policy'} onClose={onClose} footer={!recalcId && <><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={busy || !keyReady}>{busy ? 'Saving…' : p ? 'Save from date' : 'Create'}</Button></>}>
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
            {!p && (
              <>
                <Field label="Time off type">
                  <select className={inputCls} value={key.typeId} onChange={(e) => setKey({ ...key, typeId: e.target.value })}>
                    <option value="">—</option>
                    {(types.data ?? []).filter((t) => t.active !== false).map((t) => (
                      <option key={t.typeId} value={t.typeId}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Country">
                  <CountryPicker value={key.country} onChange={(c) => setKey({ ...key, country: c })} />
                </Field>
                <Field label="Employment">
                  <select className={inputCls} value={key.employmentType} onChange={(e) => setKey({ ...key, employmentType: e.target.value })}>
                    {['full_time', 'part_time'].map((m) => (
                      <option key={m} value={m}>
                        {label(m)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Name">
                  <input className={inputCls} value={key.name} onChange={(e) => setKey({ ...key, name: e.target.value })} placeholder="e.g. Vacation · Spain" />
                </Field>
              </>
            )}
            {clash && (
              <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 sm:col-span-2">
                {clash.name} already covers this type, country and employment. Edit that policy instead.
              </p>
            )}
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
  const [edit, setEdit] = useState<Policy | 'new' | null>(null)
  return (
    <Card title="Accrual policies" actions={canEdit && <Button onClick={() => setEdit('new')}>+ New policy</Button>}>
      {!canEdit && <ReadOnlyNote />}
      <Table head={['Country', 'Type', 'Employment', 'Name', 'Mode', 'Rule', 'Carryover', 'Since', '']}>
        {(q.data ?? []).map((p) => (
          <tr key={p.policyId}>
            <Td title={countryName(String(p.country))}>{String(p.country)}</Td>
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
      {edit && <EditPolicy p={edit === 'new' ? null : edit} onClose={() => setEdit(null)} />}
    </Card>
  )
}
