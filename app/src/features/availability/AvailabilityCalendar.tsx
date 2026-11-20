import { useState } from 'react'
import { Bone } from '../../components/ui/Skeleton'
import { Card, MonthNav } from '../../components/ui/ui'
import { label, todayIso } from '../../lib/format'
import { categoryStyle, dayCells, monthDays } from './cells'
import { useAvailability, useHolidays } from './data'
import { Legend } from './Legend'

/** One person's month: approved leave and their country's public holidays. */
export function AvailabilityCalendar({ employeeId }: { employeeId: string }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const days = monthDays(month.getFullYear(), month.getMonth())
  const from = days[0]
  const to = days[days.length - 1]
  const q = useAvailability({ from, to, employeeId })
  const hol = useHolidays(from, to)
  const person = q.data?.[0]
  const cells = person ? dayCells(person, hol.data ?? [], days) : new Map()
  const lead = (month.getDay() + 6) % 7
  const today = todayIso()
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))
  const out = [...cells.values()].filter((c) => c.kind === 'leave').reduce((s, c) => s + (c.kind === 'leave' ? c.hours : 0), 0)

  return (
    <Card
      title={`${month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}${person?.country ? ` · ${person.country} holidays` : ''}`}
      actions={
        <>
          <MonthNav onPrev={() => shift(-1)} onNext={() => shift(1)} onToday={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} />
        </>
      }
    >
      {q.isLoading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => (
            <Bone key={i} className="h-16" />
          ))}
        </div>
      ) : (
      <div className="grid grid-cols-7 gap-1 text-xs">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="px-1 font-medium text-stone-500">
            {d}
          </div>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <div key={`x${i}`} />
        ))}
        {days.map((d) => {
          const c = cells.get(d) ?? { kind: 'work' as const }
          const base = 'min-h-16 rounded-md border p-1.5'
          const style =
            c.kind === 'holiday'
              ? 'border-amber-300 bg-amber-100'
              : c.kind === 'weekend'
                ? 'border-stone-200 bg-stone-100 text-stone-400'
                : c.kind === 'leave'
                  ? c.partial
                    ? 'border-sky-400 bg-white'
                    : `border-transparent ${categoryStyle(c.category)}`
                  : 'border-stone-200 bg-white'
          return (
            <div key={d} className={`${base} ${style} ${d === today ? 'ring-2 ring-brand-500' : ''}`}>
              <div className="text-right font-medium">{Number(d.slice(8))}</div>
              {c.kind === 'holiday' && <div className="truncate text-[11px] text-amber-900" title={c.label}>{c.label}</div>}
              {c.kind === 'leave' && (
                <div className={`truncate text-[11px] ${c.partial ? 'text-sky-700' : ''}`}>
                  {label(c.category)}
                  {c.partial && ` · ${c.hours} h`}
                </div>
              )}
            </div>
          )
        })}
      </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Legend />
        <span className="text-xs text-stone-500">{out} h of approved leave this month</span>
      </div>
    </Card>
  )
}
