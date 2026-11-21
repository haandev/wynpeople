import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Combobox } from '../../components/ui/Combobox'
import { PersonPicker } from '../../components/ui/PersonPicker'
import { Button, Card, ErrorNote, Field, inputCls } from '../../components/ui/ui'
import { errorMessage, label, todayIso } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll, useOrgTree } from '../profile/data'
import { CURRENCIES, EMPLOYMENT_TYPES, PAY_PERIODS, PAY_TYPES, WORKER_TYPES } from '../profile/options'
import { type HireForm, REQUIRED, STEPS, usernameFromEmail } from './hireForm'

const initial: HireForm = {
  givenName: '', familyName: '', preferredName: '', email: '', username: '', hireDate: todayIso(), employeeNumber: '', jobTitle: '',
  departmentTeamId: '', productTeamId: '', officeTeamId: '', managerUserId: '', costCenter: '', employmentType: 'full_time',
  workerType: 'employee', payRate: '', currency: 'TRY', payType: 'salary', payPeriod: 'month',
}


export function HireWizard() {
  const navigate = useNavigate()
  const tree = useOrgTree()
  const [step, setStep] = useState(0)
  const [f, setF] = useState(initial)
  const manager = useQuery({ ...wyndbase.query.hr.searchPeople({ userId: f.managerUserId }), enabled: !!f.managerUserId })
  const [missing, setMissing] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const units = (kind: string) => (tree.data ?? []).filter((u) => u.kind === kind)
  const set = (k: keyof HireForm) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })
  const name = STEPS[step]

  const next = () => {
    const gaps = REQUIRED[name].filter((k) => !f[k].trim())
    setMissing(gaps)
    if (gaps.length === 0) setStep(step + 1)
  }
  const bad = (k: keyof HireForm) => (missing.includes(k) ? 'border-red-400! ring-2 ring-red-500/15' : '')

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await wyndbase.mutation.hr.hireEmployee({
        givenName: f.givenName.trim(),
        familyName: f.familyName.trim(),
        preferredName: f.preferredName.trim() || null,
        email: f.email.trim(),
        username: f.username.trim(),
        hireDate: f.hireDate,
        employeeNumber: f.employeeNumber.trim(),
        jobTitle: f.jobTitle.trim(),
        departmentTeamId: f.departmentTeamId,
        productTeamId: f.productTeamId || null,
        officeTeamId: f.officeTeamId,
        managerUserId: f.managerUserId || null,
        costCenter: f.costCenter.trim() || null,
        employmentType: f.employmentType as 'full_time' | 'part_time',
        workerType: f.workerType,
        payRate: Number(f.payRate),
        currency: f.currency,
        payType: f.payType as 'salary' | 'hourly',
        payPeriod: f.payPeriod as 'year' | 'month' | 'hour',
      })
      await refreshAll()
      const id = r[0]?.employeeId
      if (id) navigate({ to: '/people/$employeeId', params: { employeeId: id } })
      else navigate({ to: '/people' })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const text = (k: keyof HireForm, title: string, props: Record<string, string> = {}) => (
    <Field label={`${title}${Object.values(REQUIRED).flat().includes(k) ? ' *' : ''}`}>
      <input className={`${inputCls} ${bad(k)}`} value={f[k]} onChange={set(k)} {...props} />
    </Field>
  )
  const choose = (k: keyof HireForm, title: string, opts: { v: string; t: string }[], allowEmpty = true) => (
    <Field label={`${title}${Object.values(REQUIRED).flat().includes(k) ? ' *' : ''}`}>
      <select className={`${inputCls} ${bad(k)}`} value={f[k]} onChange={set(k)}>
        {allowEmpty && <option value="">—</option>}
        {opts.map((o) => (
          <option key={o.v} value={o.v}>
            {o.t}
          </option>
        ))}
      </select>
    </Field>
  )
  const pickUnit = (k: keyof HireForm, title: string, kind: string) => (
    <Field label={`${title}${Object.values(REQUIRED).flat().includes(k) ? ' *' : ''}`}>
      <Combobox
        value={f[k]}
        onChange={(v: string) => set(k)({ target: { value: v } })}
        emptyLabel="—"
        invalid={!!bad(k)}
        options={units(kind).filter((u) => u.teamId).map((u) => ({ value: u.teamId!, label: u.name ?? '—' }))}
      />
    </Field>
  )
  const nameOf = (kind: string, id: string) => units(kind).find((u) => u.teamId === id)?.name ?? '—'

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">New employee</h1>
      <ol className="flex gap-2 text-sm">
        {STEPS.map((s, i) => (
          <li key={s} className={`flex-1 rounded-md px-3 py-2 ${i === step ? 'bg-brand-600 text-white' : i < step ? 'bg-brand-100 text-brand-800' : 'bg-stone-200 text-stone-500'}`}>
            {i + 1}. {s}
          </li>
        ))}
      </ol>
      <Card>
        {name === 'Personal' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {text('givenName', 'First name')}
            {text('familyName', 'Last name')}
            {text('preferredName', 'Preferred name')}
            <Field label="Work email *">
              <input
                type="email"
                className={`${inputCls} ${bad('email')}`}
                value={f.email}
                onChange={(e) => {
                  const email = e.target.value
                  // Keep suggesting the username from the email until someone types their own.
                  const suggested = f.username === '' || f.username === usernameFromEmail(f.email)
                  setF({ ...f, email, username: suggested ? usernameFromEmail(email) : f.username })
                }}
              />
            </Field>
            <Field label="Username *" hint="They sign in with it. Suggested from the work email; change it if you like.">
              <input className={`${inputCls} ${bad('username')}`} value={f.username} onChange={set('username')} />
            </Field>
            <p className="text-xs text-stone-500 sm:col-span-2">Saving sends a set-password link to the work email.</p>
          </div>
        )}
        {name === 'Job' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {text('hireDate', 'Hire date', { type: 'date' })}
            {text('employeeNumber', 'Employee #', { placeholder: 'E-1016' })}
            {text('jobTitle', 'Job title')}
            {pickUnit('departmentTeamId', 'Department', 'department')}
            {pickUnit('productTeamId', 'Product team', 'product_team')}
            {pickUnit('officeTeamId', 'Location', 'office')}
            <Field label={`Reports to${Object.values(REQUIRED).flat().includes('managerUserId') ? ' *' : ''}`}>
              <PersonPicker value={f.managerUserId} onChange={(v: string) => set('managerUserId')({ target: { value: v } })} emptyLabel="—" invalid={!!bad('managerUserId')} />
            </Field>
            {text('costCenter', 'Cost center')}
            {choose('employmentType', 'Employment type', EMPLOYMENT_TYPES.map((t) => ({ v: t, t: label(t) })), false)}
            {choose('workerType', 'Worker type', WORKER_TYPES.map((t) => ({ v: t, t: label(t) })), false)}
          </div>
        )}
        {name === 'Compensation' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {text('payRate', 'Pay rate', { type: 'number', min: '0', step: '0.01' })}
            {choose('currency', 'Currency', CURRENCIES.map((c) => ({ v: c, t: c })), false)}
            {choose('payType', 'Pay type', PAY_TYPES.map((t) => ({ v: t, t: label(t) })), false)}
            {choose('payPeriod', 'Per', PAY_PERIODS.map((t) => ({ v: t, t: label(t) })), false)}
          </div>
        )}
        {name === 'Review' && (
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {[
              ['Name', `${f.givenName} ${f.familyName}${f.preferredName ? ` (“${f.preferredName}”)` : ''}`],
              ['Work email', f.email],
              ['Hire date', f.hireDate],
              ['Employee #', f.employeeNumber],
              ['Job title', f.jobTitle],
              ['Department', nameOf('department', f.departmentTeamId)],
              ['Product team', f.productTeamId ? nameOf('product_team', f.productTeamId) : '—'],
              ['Location', nameOf('office', f.officeTeamId)],
              ['Reports to', (f.managerUserId && manager.data?.[0]?.name) || '—'],
              ['Employment', `${label(f.employmentType)} · ${label(f.workerType)}`],
              ['Pay', `${f.payRate} ${f.currency} / ${f.payPeriod} (${f.payType})`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-stone-500">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}
        {missing.length > 0 && <p className="mt-3 text-sm text-red-600">Please fill in the required fields.</p>}
        <div className="mt-4">
          <ErrorNote error={error} />
        </div>
        <div className="mt-5 flex justify-between">
          <Button variant="secondary" onClick={() => (step === 0 ? navigate({ to: '/people' }) : setStep(step - 1))}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {name === 'Review' ? (
            <Button onClick={submit} disabled={busy}>
              {busy ? 'Hiring…' : 'Hire employee'}
            </Button>
          ) : (
            <Button onClick={next}>Next</Button>
          )}
        </div>
      </Card>
    </div>
  )
}
