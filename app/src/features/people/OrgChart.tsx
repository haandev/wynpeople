import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Avatar } from '../../components/ui/Avatar'
import { SkeletonTree } from '../../components/ui/Skeleton'
import { Card, PageHeader } from '../../components/ui/ui'
import { wyndbase } from '../../wyndbase'
import { buildTree, type TreeNode } from './buildTree'
import { ArrowLeft } from 'lucide-react'

type Person = { id: string; managerId: string | null; employeeId: string; name: string | null; jobTitle: string | null; department: string | null }

function Node({ n, depth }: { n: TreeNode<Person>; depth: number }) {
  const [open, setOpen] = useState(depth < 2)
  return (
    <li className="relative">
      <div className="flex items-center gap-2">
        {n.children.length > 0 ? (
          <button type="button" onClick={() => setOpen((o) => !o)} className="h-5 w-5 rounded text-xs text-stone-500 hover:bg-stone-200" aria-label={open ? 'Collapse' : 'Expand'}>
            {open ? '−' : '+'}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <Link
          to="/people/$employeeId"
          params={{ employeeId: n.row.employeeId }}
          className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-card transition hover:border-brand-300"
        >
          <Avatar name={n.row.name} size="sm" />
          <span>
            <span className="block text-sm font-medium">{n.row.name}</span>
            <span className="block text-xs text-stone-500">
              {n.row.jobTitle} · {n.row.department}
            </span>
          </span>
          {n.children.length > 0 && <span className="ml-2 rounded-full bg-stone-100 px-2 text-xs text-stone-600">{n.children.length}</span>}
        </Link>
      </div>
      {open && n.children.length > 0 && (
        <ul className="ml-7 mt-2 space-y-2 border-l border-stone-200 pl-5">
          {n.children.map((c) => (
            <Node key={c.row.id} n={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

export function OrgChart() {
  const q = useQuery(wyndbase.query.rpt.employeeDirectory({ status: null }))
  const people: Person[] = (q.data ?? [])
    .filter((r) => r.status !== 'terminated' && r.userId)
    .map((r) => ({ id: r.userId as string, managerId: r.managerUserId, employeeId: r.employeeId, name: r.name, jobTitle: r.jobTitle, department: r.department }))
  const roots = buildTree(people)
  return (
    <div className="space-y-4">
      <PageHeader
        title="Org chart"
        subtitle="Who reports to whom across the company."
        actions={<Link to="/people" className="text-sm font-medium text-brand-700 hover:underline">
          <ArrowLeft className="mr-1 inline h-4 w-4 align-[-3px]" />Directory
        </Link>}
      />
      <Card>{q.isLoading ? <SkeletonTree /> : <ul className="space-y-3">{roots.map((r) => <Node key={r.row.id} n={r} depth={0} />)}</ul>}</Card>
    </div>
  )
}
