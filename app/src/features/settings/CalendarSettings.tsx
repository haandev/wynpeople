import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge, Button, Card, Empty, ErrorNote, Field, inputCls, statusTone } from '../../components/ui/ui'
import { errorMessage, fmtDate, label, todayIso } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll } from '../profile/data'
import { CountryPicker, ReadOnlyNote, Table, Td } from './common'

function useRun() {
  const [error, setError] = useState<string | null>(null)
  const run = async (fn: () => Promise<unknown>) => {
    setError(null)
    try {
      await fn()
      await refreshAll()
    } catch (e) {
      setError(errorMessage(e))
    }
  }
  return { error, run }
}

function Pickers({ country, year, set }: { country: string; year: number; set: (c: string, y: number) => void }) {
  return (
    <div className="flex gap-2">
      <div className="w-56 shrink-0">
        <CountryPicker value={country} onChange={(c) => c && set(c, year)} />
      </div>
      <select className={`${inputCls} w-28 shrink-0`} value={year} onChange={(e) => set(country, Number(e.target.value))}>
        {[2025, 2026, 2027, 2028].map((y) => (
          <option key={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}

export function HolidaySettings({ canEdit }: { canEdit: boolean }) {
  const [country, setCountry] = useState('DE')
  const [year, setYear] = useState(new Date().getFullYear() + 1)
  const q = useQuery(wyndbase.query.pto.listHolidays({ country, year }))
  const { error, run } = useRun()
  const [draft, setDraft] = useState({ date: '', name: '' })
  const [editing, setEditing] = useState<{ holidayId: string; date: string; name: string } | null>(null)
  const drafts = (q.data ?? []).filter((h) => h.status === 'draft').length

  return (
    <Card
      title="Holidays"
      actions={<Pickers country={country} year={year} set={(c, y) => { setCountry(c); setYear(y) }} />}
    >
      {!canEdit && <ReadOnlyNote />}
      {canEdit && (
        <div className="mb-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => run(() => wyndbase.mutation.pto.copyHolidays({ country, fromYear: year - 1, toYear: year }))}>
            Copy from {year - 1}
          </Button>
          <Button disabled={drafts === 0} onClick={() => run(() => wyndbase.mutation.pto.activateHolidays({ country, year }))}>
            Activate {drafts} draft{drafts === 1 ? '' : 's'}
          </Button>
        </div>
      )}
      <ErrorNote error={error} />
      {(q.data ?? []).length === 0 ? (
        <Empty>No holidays for {country} {year}.</Empty>
      ) : (
        <Table head={['Date', 'Name', 'Status', '']}>
          {q.data?.map((h) =>
            editing?.holidayId === h.holidayId ? (
              <tr key={h.holidayId}>
                <Td>
                  <input type="date" className={inputCls} value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
                </Td>
                <Td>
                  <input className={inputCls} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                </Td>
                <Td />
                <Td className="text-right">
                  <Button
                    onClick={() =>
                      run(async () => {
                        // A date change is a new row: drop the old draft, save the new one.
                        if (editing.date !== String(h.date)) await wyndbase.mutation.pto.deleteHoliday({ holidayId: h.holidayId })
                        await wyndbase.mutation.pto.saveHoliday({ country, date: editing.date, name: editing.name, status: 'draft' })
                      }).then(() => setEditing(null))
                    }
                  >
                    Save
                  </Button>
                </Td>
              </tr>
            ) : (
              <tr key={h.holidayId}>
                <Td>{fmtDate(String(h.date))}</Td>
                <Td className="font-medium">{h.name}</Td>
                <Td>
                  <Badge tone={h.status === 'active' ? 'green' : statusTone(h.status)}>{label(h.status)}</Badge>
                </Td>
                <Td className="text-right">
                  {canEdit && h.status === 'draft' && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" onClick={() => setEditing({ holidayId: h.holidayId, date: String(h.date), name: h.name ?? '' })}>
                        Edit
                      </Button>
                      <Button variant="ghost" onClick={() => run(() => wyndbase.mutation.pto.deleteHoliday({ holidayId: h.holidayId }))}>
                        Delete
                      </Button>
                    </div>
                  )}
                </Td>
              </tr>
            ),
          )}
        </Table>
      )}
      {canEdit && (
        <div className="mt-4 flex items-end gap-2">
          <Field label="Date">
            <input type="date" className={inputCls} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </Field>
          <Field label="Name">
            <input className={inputCls} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </Field>
          <Button disabled={!draft.date || !draft.name} onClick={() => run(() => wyndbase.mutation.pto.saveHoliday({ country, ...draft, status: 'draft' })).then(() => setDraft({ date: '', name: '' }))}>
            Add draft
          </Button>
        </div>
      )}
    </Card>
  )
}

export function PayPeriodSettings({ canEdit }: { canEdit: boolean }) {
  const [country, setCountry] = useState('TR')
  const [year, setYear] = useState(new Date().getFullYear() + 1)
  const [frequency, setFrequency] = useState('monthly')
  const q = useQuery(wyndbase.query.pto.listPayPeriods({ country, year }))
  const { error, run } = useRun()
  return (
    <Card title="Pay periods" actions={<Pickers country={country} year={year} set={(c, y) => { setCountry(c); setYear(y) }} />}>
      {!canEdit && <ReadOnlyNote />}
      {canEdit && (
        <div className="mb-3 flex items-end gap-2">
          <Field label="Frequency">
            <select className={inputCls} value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              {['monthly', 'semi_monthly', 'biweekly'].map((f) => (
                <option key={f} value={f}>
                  {label(f)}
                </option>
              ))}
            </select>
          </Field>
          <Button onClick={() => run(() => wyndbase.mutation.pto.generatePayPeriods({ country, year, frequency }))}>Generate {year}</Button>
        </div>
      )}
      <ErrorNote error={error} />
      {(q.data ?? []).length === 0 ? (
        <Empty>No pay periods for {country} {year}.</Empty>
      ) : (
        <div className="space-y-4">
          {[...new Set((q.data ?? []).map((p) => p.frequency))].map((freq) => {
            const rows = (q.data ?? []).filter((p) => p.frequency === freq)
            // Only periods that have not ended can go: past ones drive accruals and recalculations.
            const upcoming = rows.filter((p) => String(p.periodEnd) >= todayIso()).length
            return (
              <div key={freq}>
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-stone-800">
                    {label(freq)} <span className="font-normal text-stone-500">· {rows.length} periods</span>
                  </h3>
                  {canEdit && upcoming > 0 && (
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() =>
                        confirm(
                          upcoming === rows.length
                            ? `Delete all ${rows.length} ${label(freq).toLowerCase()} pay periods for ${country} ${year}?`
                            : `Delete the ${upcoming} ${label(freq).toLowerCase()} pay periods of ${country} ${year} that have not ended? The ${rows.length - upcoming} past ones stay.`,
                        ) && run(() => wyndbase.mutation.pto.deletePayPeriods({ country, year, frequency: freq ?? '' }))
                      }
                    >
                      {upcoming === rows.length ? 'Delete set' : `Delete ${upcoming} upcoming`}
                    </Button>
                  )}
                </div>
                <Table head={['Start', 'End']}>
                  {rows.map((p) => (
                    <tr key={p.payPeriodId}>
                      <Td>{fmtDate(String(p.periodStart))}</Td>
                      <Td>{fmtDate(String(p.periodEnd))}</Td>
                    </tr>
                  ))}
                </Table>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

export function TypeSettings({ canEdit }: { canEdit: boolean }) {
  const q = useQuery(wyndbase.query.pto.listTypes())
  const { error, run } = useRun()
  const [f, setF] = useState({ code: '', name: '', category: 'custom', paid: true, color: '#10b981' })
  return (
    <Card title="Time off types">
      {!canEdit && <ReadOnlyNote />}
      <ErrorNote error={error} />
      <Table head={['', 'Code', 'Name', 'Category', 'Paid', 'Active', '']}>
        {(q.data ?? []).map((t) => (
          <tr key={t.typeId}>
            <Td>
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: t.color ?? '#999' }} />
            </Td>
            <Td>{t.code}</Td>
            <Td className="font-medium">{t.name}</Td>
            <Td>{label(t.category)}</Td>
            <Td>{t.paid ? 'Yes' : 'No'}</Td>
            <Td>{t.active ? 'Yes' : 'No'}</Td>
            <Td className="text-right">
              {canEdit && (
                <Button
                  variant="ghost"
                  onClick={() => run(() => wyndbase.mutation.pto.saveType({ code: t.code ?? '', name: t.name ?? '', category: t.category ?? 'custom', paid: t.paid, color: t.color, active: !t.active }))}
                >
                  {t.active ? 'Deactivate' : 'Activate'}
                </Button>
              )}
            </Td>
          </tr>
        ))}
      </Table>
      {canEdit && (
        <div className="mt-4 grid items-end gap-2 sm:grid-cols-6">
          <Field label="Code">
            <input className={inputCls} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} />
          </Field>
          <Field label="Name">
            <input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </Field>
          <Field label="Category">
            <select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {['vacation', 'sick', 'personal', 'custom'].map((c) => (
                <option key={c} value={c}>
                  {label(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Color">
            <input type="color" className="h-9 w-full" value={f.color} onChange={(e) => setF({ ...f, color: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input type="checkbox" checked={f.paid} onChange={(e) => setF({ ...f, paid: e.target.checked })} /> Paid
          </label>
          <Button disabled={!f.code || !f.name} onClick={() => run(() => wyndbase.mutation.pto.saveType({ ...f, active: true })).then(() => setF({ ...f, code: '', name: '' }))}>
            Save type
          </Button>
        </div>
      )}
    </Card>
  )
}
