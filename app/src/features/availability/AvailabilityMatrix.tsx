import { Combobox } from '../../components/ui/Combobox'
import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { Card, Empty, MonthNav } from '../../components/ui/ui'
import { label } from '../../lib/format'
import { useOrgTree } from '../profile/data'
import { categoryStyle, dayCells, monthDays } from './cells'
import { useAvailability, useHolidays } from './data'
import { Legend } from './Legend'

/** People × days for one month: who is available, on leave or on a public holiday of their country. */
export function AvailabilityMatrix() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [office, setOffice] = useState('')
  const [dept, setDept] = useState('')
  const tree = useOrgTree()
  const days = monthDays(month.getFullYear(), month.getMonth())
  const from = days[0]
  const to = days[days.length - 1]
  const q = useAvailability({ from, to, officeTeamId: office || null, departmentTeamId: dept || null })
  const hol = useHolidays(from, to)
  const rows = useMemo(() => (q.data ?? []).map((p) => ({ p, cells: dayCells(p, hol.data ?? [], days) })), [q.data, hol.data, days])
  const today = new Date().toISOString().slice(0, 10)
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))
  const units = (kind: string) => (tree.data ?? []).filter((u) => u.kind === kind)
  // People available per working day, for the footer row.
  const available = days.map((d) => rows.filter((r) => r.cells.get(d)?.kind === 'work').length)

  return (
    <Card
      title={`Team availability · ${month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`}
      actions={
        <>
          <div className="w-44"><Combobox value={office} onChange={(v) => setOffice(v)} emptyLabel="All locations" placeholder="All locations" options={(units('office')).filter((u) => u.teamId).map((u) => ({ value: u.teamId!, label: u.name ?? '—' }))} /></div>
          <div className="w-44"><Combobox value={dept} onChange={(v) => setDept(v)} emptyLabel="All departments" placeholder="All departments" options={(units('department')).filter((u) => u.teamId).map((u) => ({ value: u.teamId!, label: u.name ?? '—' }))} /></div>
          <MonthNav onPrev={() => shift(-1)} onNext={() => shift(1)} onToday={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} />
        </>
      }
    >
      {q.isLoading ? (
        <SkeletonTable rows={8} cols={8} />
      ) : rows.length === 0 ? (
        <Empty>No one matches these filters.</Empty>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-44 bg-white py-1 pr-3 text-left font-medium text-stone-500">Person</th>
                {days.map((d) => {
                  const dt = new Date(`${d}T00:00:00`)
                  const we = dt.getDay() === 0 || dt.getDay() === 6
                  return (
                    <th key={d} className={`w-7 min-w-7 px-0 py-1 text-center font-normal ${we ? 'text-stone-400' : 'text-stone-600'} ${d === today ? 'rounded-t bg-brand-100 font-bold text-brand-800' : ''}`}>
                      <div>{'SMTWTFS'[dt.getDay()]}</div>
                      <div>{dt.getDate()}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, cells }) => (
                <tr key={p.employeeId}>
                  <td className="sticky left-0 z-10 border-t border-stone-100 bg-white py-1 pr-3">
                    <Link to="/people/$employeeId" params={{ employeeId: p.employeeId }} className="font-medium text-stone-800 hover:text-brand-700">
                      {p.name}
                    </Link>
                    <div className="text-[11px] text-stone-400">
                      {p.office} · {String(p.country ?? '')}
                    </div>
                  </td>
                  {days.map((d) => {
                    const c = cells.get(d) ?? { kind: 'work' as const }
                    const title =
                      c.kind === 'holiday' ? `${d}: ${c.label}` : c.kind === 'leave' ? `${d}: ${label(c.category)} ${c.hours} h` : c.kind === 'weekend' ? `${d}: weekend` : `${d}: available`
                    const cls =
                      c.kind === 'holiday'
                        ? 'bg-amber-300'
                        : c.kind === 'weekend'
                          ? 'bg-stone-200'
                          : c.kind === 'leave'
                            ? c.partial
                              ? `bg-gradient-to-r from-50% to-50% to-white ${c.category === 'sick' ? 'from-red-500' : c.category === 'personal' ? 'from-purple-500' : c.category === 'vacation' ? 'from-sky-500' : c.category === 'out' ? 'from-slate-500' : 'from-emerald-500'}`
                              : categoryStyle(c.category)
                            : 'bg-brand-50'
                    return (
                      <td key={d} className="border-t border-stone-100 p-0.5">
                        <div className={`h-6 w-6 rounded ${cls}`} title={title} aria-label={title} />
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr>
                <td className="sticky left-0 z-10 border-t border-stone-200 bg-white py-1 pr-3 text-[11px] text-stone-500">Available</td>
                {days.map((d, i) => {
                  const dt = new Date(`${d}T00:00:00`)
                  const we = dt.getDay() === 0 || dt.getDay() === 6
                  return (
                    <td key={d} className="border-t border-stone-200 text-center text-[11px] text-stone-500">
                      {we ? '' : available[i]}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3">
        <Legend />
      </div>
    </Card>
  )
}
