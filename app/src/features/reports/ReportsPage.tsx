import { useState } from 'react'
import { isHr } from '../../components/shell/nav'
import { useMe } from '../../lib/useMe'
import { REPORTS, type ReportKey } from './reports'
import { ReportView } from './ReportView'

export function ReportsPage() {
  const { me } = useMe()
  const roles = me?.roles ?? []
  const visible = REPORTS.filter((r) => (!r.adminOnly || roles.includes('hr_admin')) && (!r.hrOnly || isHr(roles)))
  const [key, setKey] = useState<ReportKey>('employeeDirectory')
  const def = visible.find((r) => r.key === key) ?? visible[0]
  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav className="space-y-1">
        <h1 className="mb-3 text-2xl font-semibold">Reports</h1>
        {visible.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setKey(r.key)}
            className={`block w-full rounded-md px-3 py-2 text-left text-sm ${r.key === def.key ? 'bg-brand-600 text-white' : 'hover:bg-stone-200'}`}
          >
            {r.title}
          </button>
        ))}
      </nav>
      <ReportView key={def.key} def={def} />
    </div>
  )
}
