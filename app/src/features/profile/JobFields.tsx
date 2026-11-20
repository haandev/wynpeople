import { Combobox } from '../../components/ui/Combobox'
import { PersonPicker } from '../../components/ui/PersonPicker'
import { Field, inputCls } from '../../components/ui/ui'
import { label } from '../../lib/format'
import { useOrgTree } from './data'
import { EMPLOYMENT_TYPES } from './options'

export interface JobForm {
  jobTitle: string
  departmentTeamId: string
  productTeamId: string
  officeTeamId: string
  managerUserId: string
  costCenter: string
  employmentType: string
}

export const emptyJob: JobForm = { jobTitle: '', departmentTeamId: '', productTeamId: '', officeTeamId: '', managerUserId: '', costCenter: '', employmentType: '' }

/** Only the fields the person filled in are sent; blank means "unchanged". */
export const jobParams = (f: JobForm) => {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(f)) if (v.trim()) out[k] = v.trim()
  return out
}

export function JobFields({ value, onChange, withEmploymentType = true, selfUserId }: { value: JobForm; onChange: (f: JobForm) => void; withEmploymentType?: boolean; selfUserId?: string | null }) {
  const tree = useOrgTree()
  const units = (kind: string) => (tree.data ?? []).filter((u) => u.kind === kind)
  const set = (k: keyof JobForm) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value })
  const unitSelect = (k: keyof JobForm, kind: string) => (
    <Combobox
      value={value[k]}
      onChange={(v) => onChange({ ...value, [k]: v })}
      emptyLabel="— unchanged —"
      placeholder="unchanged"
      options={units(kind).filter((u) => u.teamId).map((u) => ({ value: u.teamId!, label: u.name ?? '—' }))}
    />
  )
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Job title">
        <input className={inputCls} value={value.jobTitle} onChange={set('jobTitle')} placeholder="unchanged" />
      </Field>
      <Field label="Department">{unitSelect('departmentTeamId', 'department')}</Field>
      <Field label="Product team">{unitSelect('productTeamId', 'product_team')}</Field>
      <Field label="Office">{unitSelect('officeTeamId', 'office')}</Field>
      <Field label="Manager">
        <PersonPicker value={value.managerUserId} onChange={(managerUserId) => onChange({ ...value, managerUserId })} exclude={[selfUserId]} emptyLabel="— unchanged —" placeholder="unchanged" />
      </Field>
      <Field label="Cost center">
        <input className={inputCls} value={value.costCenter} onChange={set('costCenter')} placeholder="unchanged" />
      </Field>
      {withEmploymentType && (
        <Field label="Employment type">
          <select className={inputCls} value={value.employmentType} onChange={set('employmentType')}>
            <option value="">— unchanged —</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {label(t)}
              </option>
            ))}
          </select>
        </Field>
      )}
    </div>
  )
}
