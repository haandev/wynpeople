import { useState } from 'react'
import { Badge, Button, Card, ErrorNote, Field, inputCls } from '../../components/ui/ui'
import { errorMessage, label, todayIso } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll, useOrgTree } from '../profile/data'
import { COUNTRIES, ReadOnlyNote, Table, Td } from './common'

const KINDS = ['department', 'product_team', 'office'] as const

export function OrgSettings({ canEdit }: { canEdit: boolean }) {
  const tree = useOrgTree()
  const [form, setForm] = useState({ kind: 'department', name: '', code: '', parentTeamId: '', costCenter: '', country: '', effectiveFrom: todayIso() })
  const [move, setMove] = useState<{ unitId: string; newParentTeamId: string } | null>(null)
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
  const units = tree.data ?? []
  const parents = units.filter((u) => u.kind === form.kind)

  return (
    <div className="space-y-5">
      <Card title="Organization units">
        {!canEdit && <ReadOnlyNote />}
        <ErrorNote error={error} />
        {KINDS.map((kind) => (
          <div key={kind} className="mb-5">
            <h3 className="mb-1 text-sm font-semibold text-stone-700">{label(kind)}s</h3>
            <Table head={['Name', 'Code', 'Parent', 'Head', 'Cost center', 'Country', '']}>
              {units
                .filter((u) => u.kind === kind)
                .map((u) => (
                  <tr key={u.unitId}>
                    <Td className="font-medium">{u.name}</Td>
                    <Td>{u.code}</Td>
                    <Td>{u.parentName ?? '—'}</Td>
                    <Td>{u.head ?? '—'}</Td>
                    <Td>{u.costCenter ?? '—'}</Td>
                    <Td>{u.country ? <Badge>{String(u.country)}</Badge> : '—'}</Td>
                    <Td className="text-right">
                      {canEdit && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" onClick={() => setMove({ unitId: u.unitId, newParentTeamId: '' })}>
                            Move
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => confirm(`Deactivate ${u.name}?`) && run(() => wyndbase.mutation.org.deactivateUnit({ unitId: u.unitId, reason: 'Deactivated in settings' }))}
                          >
                            Deactivate
                          </Button>
                        </div>
                      )}
                    </Td>
                  </tr>
                ))}
            </Table>
          </div>
        ))}
        {move && (
          <div className="flex items-end gap-2 rounded-md bg-stone-50 p-3">
            <Field label="New parent">
              <select className={inputCls} value={move.newParentTeamId} onChange={(e) => setMove({ ...move, newParentTeamId: e.target.value })}>
                <option value="">Choose…</option>
                {units
                  .filter((u) => u.unitId !== move.unitId && u.kind === units.find((x) => x.unitId === move.unitId)?.kind)
                  .map((u) => (
                    <option key={u.unitId} value={u.teamId ?? ''}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Button disabled={!move.newParentTeamId} onClick={() => run(() => wyndbase.mutation.org.moveUnit(move)).then(() => setMove(null))}>
              Move
            </Button>
            <Button variant="secondary" onClick={() => setMove(null)}>
              Cancel
            </Button>
          </div>
        )}
      </Card>
      {canEdit && (
        <Card title="New unit">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Kind">
              <select className={inputCls} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value, parentTeamId: '' })}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {label(k)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Name">
              <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Code">
              <input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="DEP-XYZ" />
            </Field>
            <Field label="Parent (optional)">
              <select className={inputCls} value={form.parentTeamId} onChange={(e) => setForm({ ...form, parentTeamId: e.target.value })}>
                <option value="">— top level —</option>
                {parents.map((u) => (
                  <option key={u.unitId} value={u.teamId ?? ''}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cost center">
              <input className={inputCls} value={form.costCenter} onChange={(e) => setForm({ ...form, costCenter: e.target.value })} />
            </Field>
            {form.kind === 'office' && (
              <Field label="Country">
                <select className={inputCls} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                  <option value="">—</option>
                  {COUNTRIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              disabled={!form.name || !form.code}
              onClick={() =>
                run(() =>
                  wyndbase.mutation.org.createUnit({
                    kind: form.kind as (typeof KINDS)[number],
                    name: form.name,
                    code: form.code,
                    parentTeamId: form.parentTeamId || null,
                    costCenter: form.costCenter || null,
                    country: form.country || null,
                    effectiveFrom: form.effectiveFrom,
                  }),
                ).then(() => setForm({ ...form, name: '', code: '' }))
              }
            >
              Create unit
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
