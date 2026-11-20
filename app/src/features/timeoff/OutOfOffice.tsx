import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge, Button, Card, ErrorNote, Field, inputCls } from '../../components/ui/ui'
import { errorMessage, fmtDate, todayIso } from '../../lib/format'
import { PersonPicker } from '../../components/ui/PersonPicker'
import { useMe } from '../../lib/useMe'
import { wyndbase } from '../../wyndbase'
import { refreshAll, useDirectory } from '../profile/data'

const KEY = 'pto.requestApproval.ask.answer'

/** Out of office: lend my time-off approvals to a colleague for a period (Wyndbase DELEGATE). */
export function OutOfOffice() {
  const { me } = useMe()
  const dir = useDirectory()
  // userId is needed: without it the query answers an empty list.
  const granted = useQuery({ ...wyndbase.query.auth.listGrantedDelegations({ userId: me?.userId }), enabled: !!me?.userId })
  const nameOf = (id: string | null) => dir.data?.find((p) => p.userId === id)?.name ?? null
  const [f, setF] = useState({ delegateId: '', from: todayIso(), until: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const now = new Date().toISOString()
  const active = (granted.data ?? []).filter((d) => d.key === KEY && !d.revokedAt && (d.endsAt ?? '') > now)

  const lend = async () => {
    setBusy(true)
    setError(null)
    try {
      await wyndbase.mutation.auth.createDelegation({
        key: KEY,
        delegatorId: me?.userId,
        delegateId: f.delegateId,
        startsAt: new Date(`${f.from}T00:00:00`).toISOString(),
        endsAt: new Date(`${f.until}T23:59:59`).toISOString(),
      })
      setF({ delegateId: '', from: todayIso(), until: '' })
      await refreshAll()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  const end = async (id: string) => {
    setError(null)
    try {
      await wyndbase.mutation.auth.revokeMyDelegation({ _id: id })
      await refreshAll()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <Card title="Out of office" actions={active.length > 0 && <Badge tone="blue">{active.length} active</Badge>}>
      <p className="mb-4 text-sm text-stone-500">Away for a while? Lend your time-off approvals to a colleague; they see and answer your team's requests until the end date.</p>
      {active.length > 0 && (
        <ul className="mb-4 space-y-2">
          {active.map((d) => (
            <li key={d._id} className="flex items-center justify-between gap-3 rounded-lg bg-sky-50 px-3 py-2 text-sm">
              <span>
                <span className="font-medium">{nameOf(d.delegateId) ?? d.delegateName}</span> answers for you · {fmtDate(d.startsAt)} – {fmtDate(d.endsAt)}
              </span>
              <Button variant="ghost" onClick={() => end(d._id)}>
                End now
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <Field label="Who answers for me">
          <PersonPicker value={f.delegateId} onChange={(delegateId) => setF({ ...f, delegateId })} exclude={[me?.userId]} placeholder="Type a colleague's name…" />
        </Field>
        <Field label="From">
          <input type="date" className={inputCls} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />
        </Field>
        <Field label="Until">
          <input type="date" className={inputCls} min={f.from} value={f.until} onChange={(e) => setF({ ...f, until: e.target.value })} />
        </Field>
        <Button onClick={lend} disabled={busy || !f.delegateId || !f.until || f.until < f.from}>
          {busy ? 'Saving…' : 'Lend approvals'}
        </Button>
      </div>
      <div className="mt-3">
        <ErrorNote error={error} />
      </div>
    </Card>
  )
}
