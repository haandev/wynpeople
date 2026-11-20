import { Button } from '../../components/ui/ui'
import { fmtDate, label, text } from '../../lib/format'
import { groupPeriods, type History } from './groupPeriods'

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
            <tr key={r.effectiveFrom} className={i === 0 ? 'font-medium' : 'text-stone-600'}>
              <td className="whitespace-nowrap">
                {fmtDate(r.effectiveFrom)}
                {r.effectiveFrom > new Date().toISOString().slice(0, 10) && <span className="ml-1 text-xs text-amber-600">(future)</span>}
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
