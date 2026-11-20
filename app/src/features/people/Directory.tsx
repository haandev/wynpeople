import { Combobox } from '../../components/ui/Combobox'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Avatar } from '../../components/ui/Avatar'
import { SkeletonTable } from '../../components/ui/Skeleton'
import { isHr } from '../../components/shell/nav'
import { Badge, Card, Empty, inputCls, PageHeader, Segmented, statusTone } from '../../components/ui/ui'
import { label } from '../../lib/format'
import { useMe } from '../../lib/useMe'
import { wyndbase } from '../../wyndbase'
import { useOrgTree } from '../profile/data'

const PAGE = 30
const countLabel = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`

export function Directory() {
  const { me } = useMe()
  const tree = useOrgTree()
  const [filters, setFilters] = useState({ departmentTeamId: '', officeTeamId: '', status: 'active' })
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'cards'>('list')
  // Search and filters run on the server; pages of PAGE people load as you scroll.
  const [term, setTerm] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setTerm(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])
  const params = {
    departmentTeamId: filters.departmentTeamId || null,
    officeTeamId: filters.officeTeamId || null,
    status: filters.status || null,
    term: term || null,
  }
  const q = useInfiniteQuery({
    queryKey: ['wynpeople', 'directoryPage', params],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => wyndbase.query.hr.directoryPage({ ...params, offset: pageParam, limit: PAGE }),
    getNextPageParam: (last, pages) => (last.length < PAGE ? undefined : pages.length * PAGE),
  })
  const count = useQuery(wyndbase.query.hr.directoryCount(params))
  const rows = q.data?.pages.flat() ?? []
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage()
    }, { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [q.hasNextPage, q.isFetchingNextPage, q.fetchNextPage, rows.length])
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
          <input className={`${inputCls} sm:col-span-2`} placeholder="Search name, title, email, employee #…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Combobox value={filters.departmentTeamId} onChange={(v) => setFilters({ ...filters, departmentTeamId: v })} emptyLabel="All departments" placeholder="All departments" options={(units('department')).filter((u) => u.teamId).map((u) => ({ value: u.teamId!, label: u.name ?? '—' }))} />
          <Combobox value={filters.officeTeamId} onChange={(v) => setFilters({ ...filters, officeTeamId: v })} emptyLabel="All locations" placeholder="All locations" options={(units('office')).filter((u) => u.teamId).map((u) => ({ value: u.teamId!, label: u.name ?? '—' }))} />
          <select className={inputCls} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="leave">On leave</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
        <div className="mb-3 flex items-center justify-between text-sm text-stone-500">
          <span>{countLabel(count.data?.[0]?.total ?? rows.length)}{q.hasNextPage ? ` · showing ${rows.length}` : ''}</span>
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
        <div ref={sentinel} aria-hidden className="h-px" />
        {q.isFetchingNextPage && <SkeletonTable rows={3} cols={6} />}
      </Card>
    </div>
  )
}
