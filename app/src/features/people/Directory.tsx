import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { initials } from '../../components/shell/UserMenu'
import { isHr } from '../../components/shell/nav'
import { Badge, Card, Empty, inputCls, statusTone } from '../../components/ui/ui'
import { label } from '../../lib/format'
import { useMe } from '../../lib/useMe'
import { wyndbase } from '../../wyndbase'
import { useOrgTree } from '../profile/data'

export function Directory() {
  const { me } = useMe()
  const tree = useOrgTree()
  const [filters, setFilters] = useState({ departmentTeamId: '', officeTeamId: '', status: 'active' })
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'cards'>('list')
  const q = useQuery(
    wyndbase.query.rpt.employeeDirectory({
      departmentTeamId: filters.departmentTeamId || null,
      officeTeamId: filters.officeTeamId || null,
      status: filters.status || null,
    }),
  )
  const rows = useMemo(() => {
    const s = search.trim().toLowerCase()
    return (q.data ?? []).filter((r) => !s || [r.name, r.jobTitle, r.department, r.workEmail].some((v) => v?.toLowerCase().includes(s)))
  }, [q.data, search])
  const units = (kind: string) => (tree.data ?? []).filter((u) => u.kind === kind)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">People</h1>
        <div className="flex gap-2">
          <Link to="/people/org-chart" className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-stone-50">
            Org chart
          </Link>
          {me && isHr(me.roles) && (
            <Link to="/people/new" className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
              + New employee
            </Link>
          )}
        </div>
      </div>
      <Card>
        <div className="mb-4 grid gap-2 sm:grid-cols-5">
          <input className={`${inputCls} sm:col-span-2`} placeholder="Search name, title, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className={inputCls} value={filters.departmentTeamId} onChange={(e) => setFilters({ ...filters, departmentTeamId: e.target.value })}>
            <option value="">All departments</option>
            {units('department').map((u) => (
              <option key={u.unitId} value={u.teamId ?? ''}>
                {u.name}
              </option>
            ))}
          </select>
          <select className={inputCls} value={filters.officeTeamId} onChange={(e) => setFilters({ ...filters, officeTeamId: e.target.value })}>
            <option value="">All locations</option>
            {units('office').map((u) => (
              <option key={u.unitId} value={u.teamId ?? ''}>
                {u.name}
              </option>
            ))}
          </select>
          <select className={inputCls} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="leave">On leave</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
        <div className="mb-3 flex items-center justify-between text-sm text-stone-500">
          <span>{rows.length} people</span>
          <div className="flex overflow-hidden rounded-md border border-stone-300">
            {(['list', 'cards'] as const).map((v) => (
              <button key={v} type="button" onClick={() => setView(v)} className={`px-3 py-1 text-xs ${view === v ? 'bg-brand-600 text-white' : 'bg-white'}`}>
                {v === 'list' ? 'List' : 'Cards'}
              </button>
            ))}
          </div>
        </div>
        {q.isLoading ? (
          <Empty>Loading…</Empty>
        ) : rows.length === 0 ? (
          <Empty>No one matches these filters.</Empty>
        ) : view === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Job title</th>
                  <th className="py-2 pr-4">Department</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Reports to</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.employeeId} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="py-2 pr-4">
                      <Link to="/people/$employeeId" params={{ employeeId: r.employeeId }} className="font-medium text-brand-700 hover:underline">
                        {r.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{r.jobTitle}</td>
                    <td className="py-2 pr-4">{r.department}</td>
                    <td className="py-2 pr-4">{r.office}</td>
                    <td className="py-2 pr-4">{r.manager ?? '—'}</td>
                    <td className="py-2 pr-4 text-stone-500">{r.workEmail ?? '—'}</td>
                    <td className="py-2 pr-4">
                      <Badge tone={statusTone(r.status)}>{label(r.status)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rows.map((r) => (
              <Link
                key={r.employeeId}
                to="/people/$employeeId"
                params={{ employeeId: r.employeeId }}
                className="flex flex-col items-center rounded-lg border border-stone-200 p-4 text-center hover:border-brand-500"
              >
                <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">{initials(r.name)}</span>
                <span className="mt-2 font-medium">{r.name}</span>
                <span className="text-xs text-stone-500">{r.jobTitle}</span>
                <span className="text-xs text-stone-400">
                  {r.department} · {r.office}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
