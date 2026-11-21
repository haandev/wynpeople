export interface Period {
  value: unknown
  reason: string | null
  _effectiveFrom: string | null
  _effectiveTo: string | null
}

export type History = Record<string, readonly Period[] | null | undefined>

export interface GroupedRow {
  effectiveFrom: string
  effectiveTo: string | null
  values: Record<string, unknown>
  reasons: string[]
}

const activeAt = (periods: readonly Period[], date: string) =>
  periods.find((p) => (p._effectiveFrom ?? '') <= date && (p._effectiveTo === null || date < p._effectiveTo))

/** BambooHR-style "Job Information" rows: one row per distinct start date, newest first,
 *  holding every column's value on that date (unchanged values carried forward). */
export function groupPeriods(history: History, columns: readonly string[]): GroupedRow[] {
  const starts = new Set<string>()
  for (const c of columns) for (const p of history[c] ?? []) if (p._effectiveFrom) starts.add(p._effectiveFrom)
  const sorted = [...starts].sort().reverse()
  return sorted.map((from, i) => {
    const values: Record<string, unknown> = {}
    const reasons: string[] = []
    for (const c of columns) {
      const periods = history[c] ?? []
      const hit = activeAt(periods, from)
      values[c] = hit?.value ?? null
      // One change writes its reason on every column it changes: show each reason once.
      for (const p of periods) if (p._effectiveFrom === from && p.reason && !reasons.includes(p.reason)) reasons.push(p.reason)
    }
    return { effectiveFrom: from, effectiveTo: i === 0 ? null : sorted[i - 1], values, reasons }
  })
}

/** Index of the row in effect today in a newest-first list of start dates: the newest that has started. -1 when all are in the future. */
export const currentIndex = (starts: readonly (string | null | undefined)[], today: string) => starts.findIndex((s) => (s ?? '') <= today)
