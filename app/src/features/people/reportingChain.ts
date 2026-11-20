type R = { id: string; managerId: string | null | undefined }

/** The managers above someone, nearest first; stops at the top or on a cycle. */
export function managerChain<T extends R>(rows: readonly T[], id: string): T[] {
  const byId = new Map(rows.map((r) => [r.id, r]))
  const seen = new Set([id])
  const out: T[] = []
  let cur = byId.get(id)?.managerId
  while (cur && !seen.has(cur) && byId.has(cur)) {
    seen.add(cur)
    const m = byId.get(cur) as T
    out.push(m)
    cur = m.managerId
  }
  return out
}

/** Direct reports of someone, in the given order. */
export const reportsOf = <T extends R>(rows: readonly T[], id: string): T[] => rows.filter((r) => r.managerId === id && r.id !== id)
