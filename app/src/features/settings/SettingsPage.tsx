import { useState } from 'react'
import { Empty } from '../../components/ui/ui'
import { useMe } from '../../lib/useMe'
import { REPORTS } from '../reports/reports'
import { ReportView } from '../reports/ReportView'
import { RetentionSettings, UserSettings } from './AdminSettings'
import { HolidaySettings, PayPeriodSettings, TypeSettings } from './CalendarSettings'
import { OrgSettings } from './OrgSettings'
import { PolicySettings } from './PolicySettings'
import { RecalcSettings } from './RecalcPreview'

const SECTIONS = [
  { key: 'org', title: 'Organization' },
  { key: 'types', title: 'Time off types' },
  { key: 'policies', title: 'Policies' },
  { key: 'pay-periods', title: 'Pay periods' },
  { key: 'holidays', title: 'Holidays' },
  { key: 'recalc', title: 'Recalculations' },
  { key: 'users', title: 'Users & roles', admin: true },
  { key: 'retention', title: 'Data retention', admin: true },
  { key: 'audit', title: 'Audit log', admin: true },
] as const

export function SettingsPage() {
  const { me } = useMe()
  const admin = !!me?.roles.includes('hr_admin')
  const hr = admin || !!me?.roles.includes('hr_manager')
  const [key, setKey] = useState<(typeof SECTIONS)[number]['key']>('org')
  if (!hr) return <Empty>Settings are for HR.</Empty>
  const visible = SECTIONS.filter((s) => !('admin' in s) || admin)
  // hr_manager sees configuration read-only; recalculations of their office they may apply.
  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav className="space-y-1">
        <h1 className="mb-3 text-2xl font-semibold">Settings</h1>
        {visible.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setKey(s.key)}
            className={`block w-full rounded-md px-3 py-2 text-left text-sm ${key === s.key ? 'bg-brand-600 text-white' : 'hover:bg-stone-200'}`}
          >
            {s.title}
          </button>
        ))}
      </nav>
      <div>
        {key === 'org' && <OrgSettings canEdit={admin} />}
        {key === 'types' && <TypeSettings canEdit={admin} />}
        {key === 'policies' && <PolicySettings canEdit={admin} />}
        {key === 'pay-periods' && <PayPeriodSettings canEdit={admin} />}
        {key === 'holidays' && <HolidaySettings canEdit={admin} />}
        {key === 'recalc' && <RecalcSettings canEdit={hr} />}
        {key === 'users' && admin && <UserSettings />}
        {key === 'retention' && admin && <RetentionSettings />}
        {key === 'audit' && admin && <ReportView def={REPORTS.find((r) => r.key === 'auditLog')!} />}
      </div>
    </div>
  )
}
