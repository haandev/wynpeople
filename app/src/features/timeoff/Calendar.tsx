import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, Card, inputCls } from '../../components/ui/ui'
import { wyndbase } from '../../wyndbase'
import { useOrgTree } from '../profile/data'

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const COLORS: Record<string, string> = { vacation: 'bg-sky-100 text-sky-800', sick: 'bg-red-100 text-red-700', personal: 'bg-purple-100 text-purple-800', custom: 'bg-emerald-100 text-emerald-800' }

/** Month grid of who's out (approved and pending requests the caller may see). */
export function Calendar() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [office, setOffice] = useState('')
  const tree = useOrgTree()
  const first = new Date(month)
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const out = useQuery(wyndbase.query.pto.whoIsOut({ from: iso(first), to: iso(last), officeTeamId: office || null }))
  const lead = (first.getDay() + 6) % 7
  const cells = Array.from({ length: lead + last.getDate() }, (_, i) => (i < lead ? null : new Date(month.getFullYear(), month.getMonth(), i - lead + 1)))
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))

  return (
    <Card
      title={month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
      actions={
        <>
          <select className={`${inputCls} w-40`} value={office} onChange={(e) => setOffice(e.target.value)}>
            <option value="">All locations</option>
            {(tree.data ?? [])
              .filter((u) => u.kind === 'office')
              .map((u) => (
                <option key={u.unitId} value={u.teamId ?? ''}>
                  {u.name}
                </option>
              ))}
          </select>
          <Button variant="secondary" onClick={() => shift(-1)} aria-label="Previous month">
            ‹
          </Button>
          <Button variant="secondary" onClick={() => shift(1)} aria-label="Next month">
            ›
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-stone-200 bg-stone-200 text-xs">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="bg-stone-50 px-2 py-1 font-medium text-stone-500">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          const day = d ? iso(d) : ''
          const who = d ? (out.data ?? []).filter((o) => o.startDate <= day && o.endDate >= day) : []
          const weekend = d && (d.getDay() === 0 || d.getDay() === 6)
          return (
            <div key={i} className={`min-h-20 p-1 ${d ? (weekend ? 'bg-stone-50' : 'bg-white') : 'bg-stone-100'}`}>
              {d && <div className={`mb-1 text-right ${day === iso(new Date()) ? 'font-bold text-brand-700' : 'text-stone-400'}`}>{d.getDate()}</div>}
              {!weekend &&
                who.slice(0, 3).map((o, j) => (
                  <div key={j} className={`mb-0.5 truncate rounded px-1 ${COLORS[o.category ?? 'custom'] ?? COLORS.custom}`} title={o.name ?? ''}>
                    {o.name}
                  </div>
                ))}
              {!weekend && who.length > 3 && <div className="text-stone-400">+{who.length - 3} more</div>}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
