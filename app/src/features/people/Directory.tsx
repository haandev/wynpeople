import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Avatar } from '../../components/ui/Avatar'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { isHr } from '../../components/shell/nav'
import { Badge, Card, Empty, inputCls, PageHeader, Segmented, statusTone } from '../../components/ui/ui'
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
      <PageHeader
        title="People"
        subtitle="Everyone in the company, with their team and location."
        actions={
          <>
          <Link to="/people/org-chart" className="inline-flex h-9 items-center rounded-lg border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-700 shadow-sm transition hover:bg-stone-50">
            Org chart
          </Link>
          {me && isHr(me.roles) && (
            <Link to="/people/new" className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
              + New employee
            </Link>
          )}
          </>
        }
      />
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
          <Segmented
            options={[
              { value: 'list', label: 'List' },
              { value: 'cards', label: 'Cards' },
            ]}
            value={view}
            onChange={setView}
          />
        </div>
        {q.isLoading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : rows.length === 0 ? (
          <Empty>No one matches these filters.</Empty>
        ) : view === 'list' ? (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Job title</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Reports to</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.employeeId}>
                    <td>
                      <Link to="/people/$employeeId" params={{ employeeId: r.employeeId }} className="group flex items-center gap-3">
                        <Avatar name={r.name} picture={r.picture} size="xs" />
                        <span className="font-medium text-stone-900 group-hover:text-brand-700">{r.name}</span>
                      </Link>
                    </td>
                    <td>{r.jobTitle}</td>
                    <td>{r.department}</td>
                    <td>{r.office}</td>
                    <td>{r.manager ?? '—'}</td>
                    <td className="text-stone-500">{r.workEmail ?? '—'}</td>
                    <td>
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
                className="flex flex-col items-center rounded-xl border border-stone-200 p-5 text-center transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-card"
              >
                <Avatar name={r.name} picture={r.picture} size="lg" />
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
