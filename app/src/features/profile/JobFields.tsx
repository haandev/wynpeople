import { Field, inputCls } from '../../components/ui/ui'
import { label } from '../../lib/format'
import { useDirectory, useOrgTree } from './data'
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

export function JobFields({ value, onChange, withEmploymentType = true }: { value: JobForm; onChange: (f: JobForm) => void; withEmploymentType?: boolean }) {
  const tree = useOrgTree()
  const dir = useDirectory()
  const units = (kind: string) => (tree.data ?? []).filter((u) => u.kind === kind)
  const set = (k: keyof JobForm) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value })
  const unitSelect = (k: keyof JobForm, kind: string) => (
    <select className={inputCls} value={value[k]} onChange={set(k)}>
      <option value="">— unchanged —</option>
      {units(kind).map((u) => (
        <option key={u.teamId ?? u.unitId} value={u.teamId ?? ''}>
          {u.name}
        </option>
      ))}
    </select>
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
        <select className={inputCls} value={value.managerUserId} onChange={set('managerUserId')}>
          <option value="">— unchanged —</option>
          {(dir.data ?? []).filter((e) => e.status !== 'terminated').map((e) => (
            <option key={e.employeeId} value={e.userId ?? ''}>
              {e.name}
            </option>
          ))}
        </select>
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
