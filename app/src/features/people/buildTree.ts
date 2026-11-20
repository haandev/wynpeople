export interface TreeNode<T> {
  row: T
  children: TreeNode<T>[]
}

/** Manager → reports forest. Roots are rows without a manager, or whose manager is
 *  not in the set; any row left unplaced (a cycle) becomes a root. Each id is visited once. */
export function buildTree<T extends { id: string; managerId: string | null | undefined }>(rows: readonly T[]): TreeNode<T>[] {
  const ids = new Set(rows.map((r) => r.id))
  const byManager = new Map<string, T[]>()
  for (const r of rows) {
    if (r.managerId && ids.has(r.managerId) && r.managerId !== r.id) {
      const list = byManager.get(r.managerId) ?? []
      list.push(r)
      byManager.set(r.managerId, list)
    }
  }
  const seen = new Set<string>()
  const grow = (row: T): TreeNode<T> => {
    seen.add(row.id)
    const children = (byManager.get(row.id) ?? []).filter((c) => !seen.has(c.id)).map(grow)
    return { row, children }
  }
  const roots: TreeNode<T>[] = []
  for (const r of rows) if (!r.managerId || !ids.has(r.managerId) || r.managerId === r.id) roots.push(grow(r))
  for (const r of rows) if (!seen.has(r.id)) roots.push(grow(r))
  return roots
}
