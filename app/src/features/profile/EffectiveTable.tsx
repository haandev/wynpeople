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
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
            <th className="py-2 pr-4">Effective</th>
            {columns.map((c) => (
              <th key={c.key} className="py-2 pr-4">
                {c.title}
              </th>
            ))}
            <th className="py-2 pr-4">Reason</th>
            {onCorrect && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.effectiveFrom} className={`border-b border-stone-100 ${i === 0 ? 'font-medium' : 'text-stone-600'}`}>
              <td className="whitespace-nowrap py-2 pr-4">
                {fmtDate(r.effectiveFrom)}
                {r.effectiveFrom > new Date().toISOString().slice(0, 10) && <span className="ml-1 text-xs text-amber-600">(future)</span>}
              </td>
              {columns.map((c) => (
                <td key={c.key} className="py-2 pr-4">
                  {c.enumLike ? label(r.values[c.key] as string) : text(r.values[c.key])}
                </td>
              ))}
              <td className="py-2 pr-4 text-stone-500">{r.reasons.join('; ') || '—'}</td>
              {onCorrect && (
                <td className="py-2 text-right">
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
