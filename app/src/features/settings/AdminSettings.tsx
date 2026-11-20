import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge, Button, Card, Empty, ErrorNote, Field, inputCls } from '../../components/ui/ui'
import { errorMessage, fmtDate } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll } from '../profile/data'
import { COUNTRIES, Table, Td } from './common'

const ROLES = ['employee', 'hr_manager', 'hr_admin'] as const

export function UserSettings() {
  const accounts = useQuery(wyndbase.query.hr.listAccounts())
  const roles = useQuery(wyndbase.query.hr.listUserRoles())
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const rolesOf = (userId: string | null) => (roles.data ?? []).filter((r) => r.userId === userId).map((r) => r.role ?? '')
  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setError(null)
    setNote(null)
    try {
      await fn()
      await refreshAll()
      if (done) setNote(done)
    } catch (e) {
      setError(errorMessage(e))
    }
  }
  return (
    <Card title="Users and roles">
      <ErrorNote error={error} />
      {note && <p className="mb-2 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800">{note}</p>}
      <Table head={['Name', 'Username', 'Location', 'Roles', 'Account', '']}>
        {(accounts.data ?? []).map((a) => {
          const mine = rolesOf(a.userId)
          return (
            <tr key={a.employeeId} className="border-b border-stone-100">
              <Td className="font-medium">{a.name}</Td>
              <Td className="text-stone-500">{a.username}</Td>
              <Td>{a.office}</Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <label key={r} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={mine.includes(r)}
                        onChange={(e) =>
                          a.userId &&
                          run(() => wyndbase.mutation.hr.setRoles({ userId: a.userId as string, roles: e.target.checked ? [...mine, r] : mine.filter((x) => x !== r) }))
                        }
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </Td>
              <Td>{a.deactivatedAt ? <Badge tone="red">Deactivated {fmtDate(String(a.deactivatedAt))}</Badge> : <Badge tone="green">Active</Badge>}</Td>
              <Td className="text-right">
                {a.userId && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" onClick={() => run(() => wyndbase.mutation.hr.setAccountActive({ userId: a.userId as string, active: !!a.deactivatedAt }))}>
                      {a.deactivatedAt ? 'Reactivate' : 'Deactivate'}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => confirm(`Send a set-password link to ${a.name}?`) && run(() => wyndbase.mutation.hr.sendSetPasswordLink({ userId: a.userId as string }), `Set-password link sent to ${a.name}.`)}
                    >
                      Send link
                    </Button>
                  </div>
                )}
              </Td>
            </tr>
          )
        })}
      </Table>
    </Card>
  )
}

export function RetentionSettings() {
  const q = useQuery(wyndbase.query.gdpr.listRetentionPolicies())
  const [f, setF] = useState({ country: 'TR', years: '10' })
  const [error, setError] = useState<string | null>(null)
  const save = async () => {
    setError(null)
    try {
      await wyndbase.mutation.gdpr.saveRetentionPolicy({ country: f.country, years: Number(f.years) })
      await refreshAll()
    } catch (e) {
      setError(errorMessage(e))
    }
  }
  return (
    <Card title="Data retention">
      <p className="mb-3 text-sm text-stone-500">
        Each month, former employees past their country's retention period are offered to an HR admin to anonymize or keep.
      </p>
      {(q.data ?? []).length === 0 ? (
        <Empty>No retention policies.</Empty>
      ) : (
        <Table head={['Country', 'Keep for (years after termination)']}>
          {q.data?.map((p) => (
            <tr key={p.policyId} className="border-b border-stone-100">
              <Td className="font-medium">{p.country}</Td>
              <Td>{p.retainYearsAfterTermination}</Td>
            </tr>
          ))}
        </Table>
      )}
      <div className="mt-4 flex items-end gap-2">
        <Field label="Country">
          <select className={inputCls} value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}>
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Years">
          <input type="number" min={0} max={50} className={inputCls} value={f.years} onChange={(e) => setF({ ...f, years: e.target.value })} />
        </Field>
        <Button onClick={save}>Save</Button>
      </div>
      <ErrorNote error={error} />
    </Card>
  )
}
