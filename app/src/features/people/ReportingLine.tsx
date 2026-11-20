import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { initials } from '../../components/shell/UserMenu'
import { Card, Empty } from '../../components/ui/ui'
import { wyndbase } from '../../wyndbase'
import { managerChain, reportsOf } from './reportingChain'

type Node = { id: string; managerId: string | null; employeeId: string; name: string | null; jobTitle: string | null; department: string | null }

function PersonCard({ n, count, focus, open, onToggle, hint }: { n: Node; count: number; focus?: boolean; open?: boolean; onToggle?: () => void; hint?: string }) {
  return (
    <div className={`flex w-64 items-center gap-3 rounded-lg border bg-white px-3 py-2 shadow-sm ${focus ? 'border-brand-600 ring-2 ring-brand-200' : 'border-stone-200'}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">{initials(n.name)}</span>
      <div className="min-w-0 flex-1">
        {onToggle ? (
          <button type="button" onClick={onToggle} className="block w-full truncate text-left text-sm font-medium hover:text-brand-700" title={hint}>
            {n.name} <span className="text-xs text-stone-400">{open ? '▾' : '▸'}</span>
          </button>
        ) : (
          <span className="block truncate text-sm font-medium">{n.name}</span>
        )}
        <span className="block truncate text-xs text-stone-500">{n.jobTitle}</span>
      </div>
      <div className="flex flex-col items-end gap-0.5">
        {count > 0 && <span className="rounded-full bg-stone-100 px-1.5 text-[10px] text-stone-600">{count}</span>}
        {!focus && (
          <Link to="/people/$employeeId" params={{ employeeId: n.employeeId }} className="text-[11px] text-brand-700 hover:underline">
            Profile
          </Link>
        )}
      </div>
    </div>
  )
}

const Line = () => <div className="mx-auto h-4 w-px bg-stone-300" />

function Reports({ rows, managerId, open, toggle }: { rows: Node[]; managerId: string; open: Set<string>; toggle: (id: string) => void }) {
  const list = reportsOf(rows, managerId)
  if (list.length === 0) return null
  return (
    <ul className="space-y-2 border-l border-stone-300 pl-5">
      {list.map((r) => {
        const kids = reportsOf(rows, r.id).length
        const isOpen = open.has(r.id)
        return (
          <li key={r.id} className="relative">
            <span className="absolute -left-5 top-6 h-px w-5 bg-stone-300" />
            <PersonCard n={r} count={kids} open={isOpen} onToggle={kids > 0 ? () => toggle(r.id) : undefined} hint={kids > 0 ? (isOpen ? 'Hide their reports' : 'Show their reports') : undefined} />
            {isOpen && (
              <div className="mt-2">
                <Reports rows={rows} managerId={r.id} open={open} toggle={toggle} />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/** Someone's reporting line: managers above (open one level at a time) and reports below (expandable). */
export function ReportingLine({ employeeId }: { employeeId: string }) {
  const q = useQuery(wyndbase.query.rpt.employeeDirectory({ status: null }))
  const rows: Node[] = useMemo(
    () =>
      (q.data ?? [])
        .filter((r) => r.status !== 'terminated' && r.userId)
        .map((r) => ({ id: r.userId as string, managerId: r.managerUserId, employeeId: r.employeeId, name: r.name, jobTitle: r.jobTitle, department: r.department })),
    [q.data],
  )
  const me = rows.find((r) => r.employeeId === employeeId)
  const [upShown, setUpShown] = useState(1)
  const [open, setOpen] = useState<Set<string>>(new Set())
  if (q.isLoading) return <Empty>Loading…</Empty>
  if (!me) return <Empty>This person is not in the active reporting line.</Empty>

  const chain = managerChain(rows, me.id) // nearest first
  const shown = chain.slice(0, upShown).reverse() // topmost first
  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  return (
    <Card title="Reporting line">
      <p className="mb-4 text-xs text-stone-500">Click a name to open or close the next level; “Profile” opens the person.</p>
      <div className="flex flex-col items-center">
        {chain.length > upShown && <p className="mb-1 text-[11px] text-stone-400">{chain.length - upShown} more above — click the top name</p>}
        {shown.map((m, i) => {
          // i = 0 is the topmost shown; its index in the chain (nearest first) is upShown - 1 - i.
          const level = upShown - i
          const isTop = i === 0
          const canGoUp = isTop && chain.length > upShown
          return (
            <div key={m.id} className="flex flex-col items-center">
              <PersonCard
                n={m}
                count={reportsOf(rows, m.id).length}
                open={!isTop || !canGoUp}
                onToggle={canGoUp ? () => setUpShown(upShown + 1) : level > 1 ? () => setUpShown(level - 1) : undefined}
                hint={canGoUp ? 'Show who they report to' : level > 1 ? 'Hide the levels above' : undefined}
              />
              <Line />
            </div>
          )
        })}
        {chain.length === 0 && <p className="mb-2 text-xs text-stone-400">Reports to no one</p>}
        <PersonCard n={me} count={reportsOf(rows, me.id).length} focus />
      </div>
      <div className="mt-4 flex justify-center">
        {reportsOf(rows, me.id).length === 0 ? (
          <p className="text-xs text-stone-400">No direct reports</p>
        ) : (
          <div>
            <p className="mb-2 text-xs font-medium text-stone-500">Direct reports</p>
            <Reports rows={rows} managerId={me.id} open={open} toggle={toggle} />
          </div>
        )}
      </div>
    </Card>
  )
}
