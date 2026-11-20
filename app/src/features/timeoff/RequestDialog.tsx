import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, ErrorNote, Field, inputCls, Modal } from '../../components/ui/ui'
import { errorMessage, fmtDate, fmtHours, todayIso } from '../../lib/format'
import { useMe } from '../../lib/useMe'
import { wyndbase } from '../../wyndbase'
import { refreshAll } from '../profile/data'
import { useMyBalances, useMyRequests, useTypes } from './data'
import { partialDays } from './partialDays'

const MIN_PARTIAL_HOURS = 2

export function RequestDialog({ onClose }: { onClose: () => void }) {
  const { me } = useMe()
  const types = useTypes()
  const balances = useMyBalances()
  const requests = useMyRequests()
  const [typeId, setTypeId] = useState('')
  const [start, setStart] = useState(todayIso())
  const [end, setEnd] = useState(todayIso())
  const [note, setNote] = useState('')
  const [perDay, setPerDay] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const type = types.data?.find((t) => t.typeId === typeId)
  const rangeOk = !!start && !!end && end >= start
  const preview = useQuery({
    ...wyndbase.query.pto.previewHours({
      startDate: start,
      endDate: end,
      typeCode: type?.code ?? null,
      partial: Object.keys(overrides).length ? overrides : null,
    }),
    enabled: !!me?.employeeId && rangeOk && !!type,
  })
  const days = (preview.data ?? []).filter((d) => d.date).map((d) => ({ date: String(d.date).slice(0, 10), hours: d.hours }))
  const total = days.reduce((s, d) => s + Number(d.hours ?? 0), 0)
  const balance = Number(balances.data?.find((b) => b.code === type?.code)?.balance ?? 0)
  const pending = (requests.data ?? [])
    .filter((r) => r.status === 'pending' && r.typeId === typeId)
    .reduce((s, r) => s + Number(r.totalHours ?? 0), 0)
  const check = partialDays(start, end, overrides, MIN_PARTIAL_HOURS)

  const submit = async () => {
    if (!check.ok) return setError(check.error ?? null)
    setBusy(true)
    setError(null)
    try {
      await wyndbase.mutation.pto.submitRequest({
        typeId,
        startDate: start,
        endDate: end,
        note: note || null,
        partial: Object.keys(overrides).length ? overrides : null,
      })
      await refreshAll()
      onClose()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title="Request time off"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !type || !rangeOk || total <= 0}>
            {busy ? 'Sending…' : 'Send request'}
          </Button>
        </>
      }
    >
      <Field label="Time off type">
        <select className={inputCls} value={typeId} onChange={(e) => setTypeId(e.target.value)}>
          <option value="">Choose…</option>
          {(types.data ?? [])
            .filter((t) => t.active)
            .map((t) => (
              <option key={t.typeId} value={t.typeId}>
                {t.name}
              </option>
            ))}
        </select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="From">
          <input type="date" className={inputCls} value={start} onChange={(e) => { setStart(e.target.value); setOverrides({}) }} />
        </Field>
        <Field label="To">
          <input type="date" className={inputCls} value={end} min={start} onChange={(e) => { setEnd(e.target.value); setOverrides({}) }} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={perDay} onChange={(e) => { setPerDay(e.target.checked); if (!e.target.checked) setOverrides({}) }} />
        Set hours per day (partial days)
      </label>
      {type && rangeOk && (
        <div className="rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
          {preview.isLoading ? (
            <p className="text-stone-500">Counting working hours…</p>
          ) : days.length === 0 ? (
            <p className="text-stone-500">No working days in this range (weekends and holidays are skipped).</p>
          ) : (
            <ul className="space-y-1">
              {days.map((d) => (
                <li key={d.date} className="flex items-center justify-between">
                  <span>{fmtDate(d.date)}</span>
                  {perDay ? (
                    <input
                      type="number"
                      min={0}
                      max={8}
                      step={0.5}
                      className="w-20 rounded border border-stone-300 px-2 py-0.5 text-right"
                      value={overrides[d.date] ?? Number(d.hours)}
                      onChange={(e) => setOverrides({ ...overrides, [d.date]: Number(e.target.value) })}
                    />
                  ) : (
                    <span>{fmtHours(d.hours)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex justify-between border-t border-stone-200 pt-2 font-medium">
            <span>Total</span>
            <span>{fmtHours(total)}</span>
          </div>
          {type.category !== 'sick' && (
            <p className="mt-1 text-xs text-stone-500">
              Balance now {fmtHours(balance)}
              {pending > 0 && ` · pending ${fmtHours(pending)}`} · after this request {fmtHours(balance - pending - total)} (future accruals are counted by the server)
            </p>
          )}
        </div>
      )}
      {!check.ok && Object.keys(overrides).length > 0 && <p className="text-sm text-red-600">{check.error}</p>}
      <Field label="Note for your approver">
        <textarea className={inputCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      <ErrorNote error={error} />
    </Modal>
  )
}
