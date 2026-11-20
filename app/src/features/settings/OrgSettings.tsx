import { useState } from 'react'
import { Button, Card, ErrorNote, Field, inputCls, Modal } from '../../components/ui/ui'
import { errorMessage, label, todayIso } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll } from '../profile/data'
import { CountryPicker, ReadOnlyNote } from './common'
import { OrgTree, type OrgNode } from './OrgTree'

const CODE_HINT: Record<OrgNode['kind'], string> = { department: 'DEP-XYZ', product_team: 'PT-XYZ', office: 'OFF-XYZ' }

export function OrgSettings({ canEdit }: { canEdit: boolean }) {
  // The parent the new unit goes under: a unit (a sub-unit of the same kind) or one of the three roots (a top-level unit).
  const [adding, setAdding] = useState<OrgNode | null>(null)
  return (
    <Card title="Organization units">
      {!canEdit && <ReadOnlyNote />}
      <OrgTree canEdit={canEdit} onAddChild={setAdding} />
      {adding && <NewUnitModal parent={adding} onClose={() => setAdding(null)} />}
    </Card>
  )
}

function NewUnitModal({ parent, onClose }: { parent: OrgNode; onClose: () => void }) {
  const kind = parent.kind
  const [form, setForm] = useState({ name: '', code: '', costCenter: '', country: '', effectiveFrom: todayIso() })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ready = !!form.name.trim() && !!form.code.trim() && !!form.effectiveFrom && !busy

  const create = async () => {
    if (!ready) return
    setBusy(true)
    setError(null)
    try {
      await wyndbase.mutation.org.createUnit({
        kind,
        name: form.name.trim(),
        code: form.code.trim(),
        parentTeamId: parent.isRoot ? null : parent.id,
        costCenter: form.costCenter.trim() || null,
        country: form.country || null,
        effectiveFrom: form.effectiveFrom,
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
      title={parent.isRoot ? `New ${label(kind).toLowerCase()}` : `New sub-unit of ${parent.name}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!ready} onClick={create}>
            {busy ? 'Creating…' : 'Create'}
          </Button>
        </>
      }
    >
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          void create()
        }}
      >
        <Field label="Name">
          <input autoFocus className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Code">
          <input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder={CODE_HINT[kind]} />
        </Field>
        <Field label="Cost center">
          <input className={inputCls} value={form.costCenter} onChange={(e) => setForm({ ...form, costCenter: e.target.value })} />
        </Field>
        {kind === 'office' ? (
          <Field label="Country">
            <CountryPicker value={form.country} onChange={(c) => setForm({ ...form, country: c })} />
          </Field>
        ) : (
          <div className="hidden sm:block" />
        )}
        <Field label="Effective from">
          <input type="date" className={inputCls} value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
        </Field>
        <button type="submit" className="hidden" />
      </form>
      <ErrorNote error={error} />
    </Modal>
  )
}
