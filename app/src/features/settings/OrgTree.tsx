import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Tree, type NodeApi, type NodeRendererProps } from 'react-arborist'
import { Badge, Button, ErrorNote, Field, inputCls, Modal } from '../../components/ui/ui'
import { errorMessage, label, todayIso } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll, useOrgTree } from '../profile/data'

type Kind = 'department' | 'product_team' | 'office'

export interface OrgNode {
  id: string // the team id: units point at their parent by team id
  name: string
  kind: Kind
  isRoot: boolean
  unitId?: string
  code?: string | null
  costCenter?: string | null
  head?: string | null
  country?: string | null
  inactive?: boolean
  children: OrgNode[] // always an array: react-arborist drops only into folders, so every unit is one
}

const ROOT_KIND: Record<string, Kind> = { Departments: 'department', 'Product Teams': 'product_team', Offices: 'office' }

/** Builds the three trees (Departments, Product Teams, Offices) from org.roots and org.tree. */
function useOrgNodes(): { nodes: OrgNode[]; isLoading: boolean } {
  const roots = useQuery(wyndbase.query.org.roots({}))
  const tree = useOrgTree()
  const nodes = useMemo(() => {
    const byTeam = new Map<string, OrgNode>()
    for (const r of roots.data ?? []) {
      if (!r.teamId || !ROOT_KIND[r.name ?? '']) continue
      byTeam.set(r.teamId, { id: r.teamId, name: r.name ?? '', kind: ROOT_KIND[r.name ?? ''], isRoot: true, children: [] })
    }
    for (const u of tree.data ?? []) {
      if (!u.teamId) continue
      byTeam.set(u.teamId, {
        id: u.teamId,
        name: u.name ?? '—',
        kind: u.kind as Kind,
        isRoot: false,
        unitId: u.unitId,
        code: u.code,
        costCenter: u.costCenter,
        head: u.head,
        country: u.country ? String(u.country) : null,
        inactive: u.status === 'inactive',
        children: [],
      })
    }
    const top: OrgNode[] = []
    for (const u of tree.data ?? []) {
      const node = u.teamId ? byTeam.get(u.teamId) : undefined
      const parent = u.parentTeamId ? byTeam.get(u.parentTeamId) : undefined
      if (node) (parent?.children ?? top).push(node)
    }
    const rootsInOrder = [...byTeam.values()].filter((n) => n.isRoot).sort((a, b) => Object.keys(ROOT_KIND).indexOf(a.name) - Object.keys(ROOT_KIND).indexOf(b.name))
    const sort = (list: OrgNode[]) => {
      list.sort((a, b) => a.name.localeCompare(b.name, 'tr'))
      list.forEach((n) => sort(n.children))
    }
    rootsInOrder.forEach((r) => sort(r.children))
    return [...rootsInOrder, ...top]
  }, [roots.data, tree.data])
  return { nodes, isLoading: roots.isLoading || tree.isLoading }
}

interface PendingMove {
  unit: OrgNode
  parent: OrgNode
  from: string
}

/**
 * The organization as a tree. HR admins drag a unit onto another unit of the same kind to move
 * it (from a date they confirm), double-click a name to rename it, and add or deactivate units
 * from each row. Everyone else sees the same tree read-only.
 */
export function OrgTree({ canEdit, onAddChild }: { canEdit: boolean; onAddChild: (parent: OrgNode) => void }) {
  const { nodes, isLoading } = useOrgNodes()
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState<PendingMove | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      await refreshAll()
      return true
    } catch (e) {
      setError(errorMessage(e))
      return false
    } finally {
      setBusy(false)
    }
  }

  const find = (id: string | null, list = nodes): OrgNode | undefined => {
    for (const n of list) {
      if (n.id === id) return n
      const hit = find(id, n.children)
      if (hit) return hit
    }
  }

  const Node = ({ node, style, dragHandle }: NodeRendererProps<OrgNode>) => {
    const d = node.data
    return (
      <div
        style={style}
        ref={dragHandle}
        className={`group flex h-full items-center gap-2 rounded-lg pr-2 text-sm ${node.isSelected ? 'bg-brand-50' : 'hover:bg-stone-50'} ${node.willReceiveDrop ? 'ring-2 ring-brand-400' : ''} ${d.inactive ? 'opacity-50' : ''}`}
      >
        <button type="button" onClick={() => node.toggle()} className={`grid h-5 w-5 place-items-center text-stone-400 ${d.children.length === 0 ? 'invisible' : ''}`} aria-label={node.isOpen ? 'Collapse' : 'Expand'}>
          {node.isOpen ? '▾' : '▸'}
        </button>
        {node.isEditing ? (
          <input
            autoFocus
            defaultValue={d.name}
            className="h-7 rounded border border-brand-300 px-2 text-sm"
            onFocus={(e) => e.currentTarget.select()}
            onBlur={() => node.reset()}
            onKeyDown={(e) => {
              e.stopPropagation() // the tree's own shortcuts (select all, arrows, …) must not act while typing
              if (e.key === 'Escape') node.reset()
              if (e.key === 'Enter') node.submit(e.currentTarget.value)
            }}
          />
        ) : (
          <span className={`truncate ${d.isRoot ? 'font-semibold text-stone-900' : 'font-medium text-stone-800'}`} onDoubleClick={() => canEdit && !d.isRoot && node.edit()}>
            {d.name}
          </span>
        )}
        {!d.isRoot && (
          <span className="hidden min-w-0 truncate text-xs text-stone-500 sm:inline">
            {[d.code, d.costCenter, d.head && `Head: ${d.head}`].filter(Boolean).join(' · ')}
          </span>
        )}
        {d.country && <Badge>{d.country}</Badge>}
        {d.inactive && <Badge>inactive</Badge>}
        {canEdit && !d.inactive && (
          <span className="ml-auto hidden shrink-0 gap-1 group-hover:flex">
            <button type="button" className="rounded px-2 py-0.5 text-xs text-brand-700 hover:bg-brand-100" onClick={() => onAddChild(d)}>
              {d.isRoot ? `+ Add ${label(d.kind).toLowerCase()}` : '+ Sub-unit'}
            </button>
            {!d.isRoot && (
              <>
                <button type="button" className="rounded px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-200" onClick={() => node.edit()}>
                  Rename
                </button>
                <button
                  type="button"
                  className="rounded px-2 py-0.5 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => confirm(`Deactivate ${d.name}?`) && run(() => wyndbase.mutation.org.deactivateUnit({ unitId: d.unitId!, reason: 'Deactivated in settings' }))}
                >
                  Deactivate
                </button>
              </>
            )}
          </span>
        )}
      </div>
    )
  }

  // A unit moves only inside its own tree (a department under a department or the Departments root),
  // never onto an inactive unit; react-arborist already refuses a drop into the unit's own subtree.
  const disableDrop = ({ parentNode, dragNodes }: { parentNode: NodeApi<OrgNode>; dragNodes: NodeApi<OrgNode>[] }) => {
    if (!canEdit || !parentNode || parentNode.isRoot) return true
    const target = parentNode.data
    if (!target || target.inactive) return true
    return dragNodes.some((n) => n.data.isRoot || n.data.kind !== target.kind)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input className={`${inputCls} max-w-xs`} placeholder="Search units…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {canEdit && <span className="text-xs text-stone-500">Hover a unit to add a sub-unit · drag to move · double-click to rename</span>}
      </div>
      <ErrorNote error={error} />
      {isLoading ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : (
        <div className="rounded-xl border border-stone-200 p-2">
          <Tree<OrgNode>
            data={nodes}
            openByDefault
            width="100%"
            height={Math.min(560, Math.max(240, countRows(nodes) * 34 + 8))}
            rowHeight={34}
            indent={22}
            searchTerm={search}
            searchMatch={(node, term) => node.data.name.toLocaleLowerCase('tr').includes(term.toLocaleLowerCase('tr'))}
            disableDrag={(d) => !canEdit || d.isRoot || !!d.inactive}
            disableDrop={disableDrop}
            disableEdit={(d) => !canEdit || d.isRoot}
            onMove={({ dragIds, parentId }) => {
              const unit = find(dragIds[0])
              const parent = find(parentId)
              if (!unit || !parent || unit.id === parent.id) return
              if (isChildOf(nodes, unit.id, parent.id)) return // dropped on its current parent: nothing to do
              setPending({ unit, parent, from: todayIso() })
            }}
            onRename={({ id, name }) => {
              const unit = find(id)
              if (!unit?.unitId || !name.trim() || name.trim() === unit.name) return
              void run(() => wyndbase.mutation.org.renameUnit({ unitId: unit.unitId!, name: name.trim() }))
            }}
          >
            {Node}
          </Tree>
          {canEdit && (
            <div className="mt-1 flex flex-wrap gap-1 border-t border-stone-100 pt-2">
              {nodes
                .filter((n) => n.isRoot)
                .map((root) => (
                  <button key={root.id} type="button" className="rounded-lg px-2.5 py-1 text-sm font-medium text-brand-700 hover:bg-brand-50" onClick={() => onAddChild(root)}>
                    + {label(root.kind)}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
      {pending && (
        <Modal
          title="Move unit"
          onClose={() => setPending(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setPending(null)}>
                Cancel
              </Button>
              <Button
                disabled={busy || !pending.from}
                onClick={async () => {
                  const ok = await run(() =>
                    wyndbase.mutation.org.moveUnit({ unitId: pending.unit.unitId!, newParentTeamId: pending.parent.id, effectiveFrom: pending.from }),
                  )
                  if (ok) setPending(null)
                }}
              >
                {busy ? 'Moving…' : 'Move'}
              </Button>
            </>
          }
        >
          <p className="text-sm text-stone-700">
            Move <strong>{pending.unit.name}</strong> ({label(pending.unit.kind)}) under <strong>{pending.parent.name}</strong>.
          </p>
          <Field label="Effective from">
            <input type="date" className={inputCls} value={pending.from} onChange={(e) => setPending({ ...pending, from: e.target.value })} />
          </Field>
          <p className="text-xs text-stone-500">The reporting line keeps its history: before this date the unit stays where it was.</p>
          <ErrorNote error={error} />
        </Modal>
      )}
    </div>
  )
}

const countRows = (list: OrgNode[]): number => list.reduce((s, n) => s + 1 + countRows(n.children), 0)

/** Whether `childId` is a direct child of `parentId` (a drop that changes nothing). */
function isChildOf(list: OrgNode[], childId: string, parentId: string): boolean {
  for (const n of list) {
    if (n.id === parentId) return n.children.some((c) => c.id === childId)
    if (isChildOf(n.children, childId, parentId)) return true
  }
  return false
}
