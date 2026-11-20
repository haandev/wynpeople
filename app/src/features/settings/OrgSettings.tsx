import { Combobox } from '../../components/ui/Combobox'
import { useState } from 'react'
import { Button, Card, ErrorNote, Field, inputCls } from '../../components/ui/ui'
import { errorMessage, label, todayIso } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll, useOrgTree } from '../profile/data'
import { COUNTRIES, ReadOnlyNote } from './common'
import { OrgTree } from './OrgTree'

const KINDS = ['department', 'product_team', 'office'] as const

export function OrgSettings({ canEdit }: { canEdit: boolean }) {
  const tree = useOrgTree()
  const [form, setForm] = useState({ kind: 'department', name: '', code: '', parentTeamId: '', costCenter: '', country: '', effectiveFrom: todayIso() })
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
        <OrgTree
          canEdit={canEdit}
          onAddChild={(p) => {
            setForm({ ...form, kind: p.kind, parentTeamId: p.isRoot ? '' : p.id, name: '', code: '' })
            const name = document.getElementById('new-unit-name')
            name?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            name?.focus({ preventScroll: true })
          }}
        />
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
              <input id="new-unit-name" className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Code">
              <input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="DEP-XYZ" />
            </Field>
            <Field label="Parent (optional)">
              <Combobox value={form.parentTeamId} onChange={(v) => setForm({ ...form, parentTeamId: v })} emptyLabel="— top level —" placeholder="— top level —" options={(parents).filter((u) => u.teamId).map((u) => ({ value: u.teamId!, label: u.name ?? '—' }))} />
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
