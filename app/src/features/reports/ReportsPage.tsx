import { ArrowLeft, Table2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { isHr } from '../../components/shell/nav'
import { useMe } from '../../lib/useMe'
import { wyndbase } from '../../wyndbase'
import { REPORTS, type ReportKey } from './reports'
import { ReportView } from './ReportView'
import { MyReports, useSavedReports } from './SavedReports'

type View = { kind: 'mine' } | { kind: 'report'; key: ReportKey } | { kind: 'saved'; id: string }

export function ReportsPage() {
  const { me } = useMe()
  const roles = me?.roles ?? []
  const visible = REPORTS.filter((r) => (!r.adminOnly || roles.includes('hr_admin')) && (!r.hrOnly || isHr(roles)))
  const saved = useSavedReports()
  const [view, setView] = useState<View>({ kind: 'mine' })
  const openSaved = (id: string) => setView({ kind: 'saved', id })

  const current = view.kind === 'saved' ? saved.data?.find((r) => r.savedReportId === view.id) : undefined
  // Opening a saved report counts as viewing it (the "Last viewed" column).
  useEffect(() => {
    if (view.kind === 'saved') void wyndbase.mutation.rpt.markReportViewed({ savedReportId: view.id }).then(() => wyndbase.queryClient.invalidateQueries({ queryKey: wyndbase.query.rpt.mySavedReports().queryKey }))
  }, [view])

  const navCls = (active: boolean) =>
    `block w-full rounded-lg px-3 py-2 text-left text-sm transition ${active ? 'bg-white font-medium text-brand-800 shadow-card ring-1 ring-stone-200' : 'text-stone-600 hover:bg-white/70 hover:text-stone-900'}`

  // A saved report of a type this person may not run (an HR report shared with an employee) opens as its type anyway:
  // the server answers with what they may see, or refuses.
  const savedDef = current && REPORTS.find((r) => r.key === current.reportKey)

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav className="space-y-1">
        <div className="mb-4 px-1">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Reports</h1>
          <p className="mt-1 text-xs text-stone-500">Filter, save, share and export. Every export is logged.</p>
        </div>
        <button type="button" onClick={() => setView({ kind: 'mine' })} className={`${navCls(view.kind === 'mine' || view.kind === 'saved')} flex items-center gap-2`}>
          <Table2 className="h-4 w-4" /> My reports
          {(saved.data?.length ?? 0) > 0 && <span className="ml-auto text-xs text-stone-400">{saved.data!.length}</span>}
        </button>
        <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Standard reports</p>
        {visible.map((r) => (
          <button key={r.key} type="button" onClick={() => setView({ kind: 'report', key: r.key })} className={navCls(view.kind === 'report' && view.key === r.key)}>
            {r.title}
          </button>
        ))}
      </nav>
      {view.kind === 'mine' && <MyReports onOpen={(r) => openSaved(r.savedReportId)} />}
      {view.kind === 'report' && <ReportView key={view.key} def={visible.find((r) => r.key === view.key) ?? visible[0]} onSaved={openSaved} />}
      {view.kind === 'saved' && current && savedDef && (
        <div className="space-y-2">
          <button type="button" onClick={() => setView({ kind: 'mine' })} className="text-sm font-medium text-brand-700 hover:underline">
            <ArrowLeft className="mr-1 inline h-4 w-4 align-[-3px]" />My reports
          </button>
          <h2 className="text-xl font-semibold text-stone-900">{current.name}</h2>
          <ReportView key={current.savedReportId} def={savedDef} saved={current} onSaved={openSaved} />
        </div>
      )}
    </div>
  )
}
