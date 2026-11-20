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
        <div className="mb-4 px-1"><h1 className="text-2xl font-semibold tracking-tight text-stone-900">Reports</h1><p className="mt-1 text-xs text-stone-500">Filter, review and export. Every export is logged.</p></div>
        {visible.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setKey(r.key)}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${r.key === def.key ? 'bg-white font-medium text-brand-800 shadow-card ring-1 ring-stone-200' : 'text-stone-600 hover:bg-white/70 hover:text-stone-900'}`}
          >
            {r.title}
          </button>
        ))}
      </nav>
      <ReportView key={def.key} def={def} />
    </div>
  )
}
