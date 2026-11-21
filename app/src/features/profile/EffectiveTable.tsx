import { Button } from '../../components/ui/ui'
import { fmtDate, label, text, todayIso } from '../../lib/format'
import { currentIndex, groupPeriods, type History } from './groupPeriods'

/** One BambooHR-style history table: a row per effective date, columns carried forward. */
export function EffectiveTable({
  history,
  columns,
  onCorrect,
}: {
  history: History
  columns: { key: string; title: string; enumLike?: boolean }[]
  onCorrect?: (periodStart: string, values: Record<string, unknown>) => void
}) {
  const rows = groupPeriods(
    history,
    columns.map((c) => c.key),
  )
  if (rows.length === 0) return <p className="text-sm text-stone-400">No history.</p>
  // The row in effect today is the emphasised one; a future row above it is marked (future).
  const current = currentIndex(rows.map((r) => r.effectiveFrom), todayIso())
  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr>
            <th>Effective</th>
            {columns.map((c) => (
              <th key={c.key}>
                {c.title}
              </th>
            ))}
            <th>Reason</th>
            {onCorrect && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.effectiveFrom} className={i === current ? 'font-medium' : 'text-stone-600'}>
              <td className="whitespace-nowrap">
                {fmtDate(r.effectiveFrom)}
                {r.effectiveFrom > todayIso() && <span className="ml-1 text-xs text-amber-600">(future)</span>}
              </td>
              {columns.map((c) => (
                <td key={c.key}>
                  {c.enumLike ? label(r.values[c.key] as string) : text(r.values[c.key])}
                </td>
              ))}
              <td className="text-stone-500">{r.reasons.join('; ') || '—'}</td>
              {onCorrect && (
                <td className="text-right">
                  <Button variant="ghost" onClick={() => onCorrect(r.effectiveFrom, r.values)}>
                    Correct
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
