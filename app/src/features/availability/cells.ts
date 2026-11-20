export interface LeaveIn {
  startDate: string | null
  endDate: string | null
  category: string | null
  days: unknown
}
export interface PersonIn {
  country: string | null | unknown
  leave: readonly LeaveIn[] | null
}
export interface HolidayIn {
  country: unknown
  date: string | null
  name: string | null
}

export type Cell =
  | { kind: 'work' }
  | { kind: 'weekend' }
  | { kind: 'holiday'; label: string }
  | { kind: 'leave'; category: string; hours: number; partial: boolean }

const pad = (n: number) => String(n).padStart(2, '0')

/** Every date (YYYY-MM-DD) of a month; month is 0-based like Date. */
export function monthDays(year: number, month: number): string[] {
  const n = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: n }, (_, i) => `${year}-${pad(month + 1)}-${pad(i + 1)}`)
}

const isWeekend = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`).getDay()
  return d === 0 || d === 6
}

/** What each day is for one person: their approved leave, their country's public holidays, weekends, or work. */
export function dayCells(person: PersonIn, holidays: readonly HolidayIn[], dates: readonly string[], hoursPerDay = 8): Map<string, Cell> {
  const country = typeof person.country === 'string' ? person.country : null
  const hol = new Map(holidays.filter((h) => String(h.country ?? '') === country && h.date).map((h) => [String(h.date).slice(0, 10), h.name ?? 'Holiday']))
  const leave = new Map<string, { category: string; hours: number }>()
  for (const l of person.leave ?? []) {
    const days = Array.isArray(l.days) ? (l.days as { date: string; hours: number }[]) : []
    for (const d of days) leave.set(String(d.date).slice(0, 10), { category: l.category ?? 'custom', hours: Number(d.hours) })
  }
  const out = new Map<string, Cell>()
  for (const date of dates) {
    const lv = leave.get(date)
    if (hol.has(date)) out.set(date, { kind: 'holiday', label: hol.get(date) as string })
    else if (isWeekend(date)) out.set(date, { kind: 'weekend' })
    else if (lv) out.set(date, { kind: 'leave', category: lv.category, hours: lv.hours, partial: lv.hours < hoursPerDay })
    else out.set(date, { kind: 'work' })
  }
  return out
}

export const CATEGORY_STYLE: Record<string, string> = {
  vacation: 'bg-sky-500 text-white',
  sick: 'bg-red-500 text-white',
  personal: 'bg-purple-500 text-white',
  custom: 'bg-emerald-500 text-white',
  out: 'bg-slate-500 text-white',
}
export const categoryStyle = (c: string) => CATEGORY_STYLE[c] ?? CATEGORY_STYLE.custom
