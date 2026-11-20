import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { type ReactElement, useMemo, useState } from 'react'
import { Avatar } from '../../components/ui/Avatar'
import { SkeletonTree } from '../../components/ui/Skeleton'
import { Card, Empty } from '../../components/ui/ui'
import { wyndbase } from '../../wyndbase'
import { managerChain, reportsOf } from './reportingChain'

type Node = { id: string; managerId: string | null; employeeId: string; name: string | null; jobTitle: string | null }

function NodeCard({ n, count, focus, toggle, open, hint }: { n: Node; count: number; focus?: boolean; toggle?: () => void; open?: boolean; hint?: string }) {
  return (
    <div className={`flex w-44 flex-col items-center rounded-xl border bg-white px-2 pb-2.5 pt-3.5 text-center shadow-card transition ${focus ? 'border-brand-500 ring-4 ring-brand-100' : 'border-stone-200 hover:border-brand-300'}`}>
      <Avatar name={n.name} size="md" />
      {toggle ? (
        <button type="button" onClick={toggle} title={hint} className="mt-1 max-w-full truncate text-sm font-medium hover:text-brand-700">
          {n.name}
        </button>
      ) : (
        <span className="mt-1 max-w-full truncate text-sm font-medium">{n.name}</span>
      )}
      <span className="max-w-full truncate text-[11px] text-stone-500">{n.jobTitle}</span>
      <div className="mt-1 flex items-center gap-2 text-[11px]">
        {toggle && (
          <button type="button" onClick={toggle} className="rounded-full bg-stone-100 px-1.5 text-stone-600 hover:bg-stone-200" aria-label={hint}>
            {open ? '−' : '+'} {count > 0 ? count : ''}
          </button>
        )}
        {!focus && (
          <Link to="/people/$employeeId" params={{ employeeId: n.employeeId }} className="text-brand-700 hover:underline">
            Profile
          </Link>
        )}
      </div>
    </div>
  )
}

/** A report and, when opened, their own reports as the next row. */
function Branch({ rows, n, open, flip }: { rows: Node[]; n: Node; open: Set<string>; flip: (id: string) => void }) {
  const kids = reportsOf(rows, n.id)
  const isOpen = open.has(n.id)
  return (
    <li>
      <NodeCard n={n} count={kids.length} open={isOpen} toggle={kids.length ? () => flip(n.id) : undefined} hint={isOpen ? 'Hide their reports' : 'Show their reports'} />
      {isOpen && kids.length > 0 && (
        <ul>
          {kids.map((k) => (
            <Branch key={k.id} rows={rows} n={k} open={open} flip={flip} />
          ))}
        </ul>
      )}
    </li>
  )
}

/** Someone's reporting line as a top-down chart: managers above (one level at a time), reports below (expandable). */
export function ReportingLine({ employeeId }: { employeeId: string }) {
  const q = useQuery(wyndbase.query.rpt.employeeDirectory({ status: null }))
  const rows: Node[] = useMemo(
    () =>
      (q.data ?? [])
        .filter((r) => r.status !== 'terminated' && r.userId)
        .map((r) => ({ id: r.userId as string, managerId: r.managerUserId, employeeId: r.employeeId, name: r.name, jobTitle: r.jobTitle })),
    [q.data],
  )
  const [upShown, setUpShown] = useState(1)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const me = rows.find((r) => r.employeeId === employeeId)
  if (q.isLoading) return <SkeletonTree />
  if (!me) return <Empty>This person is not in the active reporting line.</Empty>

  const chain = managerChain(rows, me.id) // nearest first
  const shown = Math.min(upShown, chain.length)
  const spine = chain.slice(0, shown).reverse() // topmost first
  const flip = (id: string) =>
    setOpen((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const reports = reportsOf(rows, me.id)

  // The focus person with their reports below.
  const focusItem = (
    <li>
      <NodeCard n={me} count={reports.length} focus />
      {reports.length > 0 && (
        <ul>
          {reports.map((r) => (
            <Branch key={r.id} rows={rows} n={r} open={open} flip={flip} />
          ))}
        </ul>
      )}
    </li>
  )
  // Wrap the focus in its managers, innermost (nearest) last.
  const tree = spine.reduceRight<ReactElement>((inner, m, i) => {
    const isTop = i === 0
    const canGoUp = isTop && chain.length > shown
    const level = shown - i // 1 = direct manager
    return (
      <li>
        <NodeCard
          n={m}
          count={reportsOf(rows, m.id).length}
          open={!canGoUp}
          toggle={canGoUp ? () => setUpShown(shown + 1) : isTop && level > 1 ? () => setUpShown(level - 1) : undefined}
          hint={canGoUp ? 'Show who they report to' : 'Hide this level'}
        />
        <ul>{inner}</ul>
      </li>
    )
  }, focusItem)

  return (
    <Card title="Reporting line">
      <p className="mb-4 text-xs text-stone-500">
        Click a name (or +) to open the next level, again to close it; “Profile” opens the person.
        {chain.length === 0 && ' Reports to no one.'}
        {chain.length > shown && ` ${chain.length - shown} more level${chain.length - shown > 1 ? 's' : ''} above.`}
      </p>
      <div className="overflow-x-auto pb-2">
        <div className="orgtree mx-auto w-max">
          <ul>{tree}</ul>
        </div>
      </div>
    </Card>
  )
}
