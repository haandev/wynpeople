import { describe, expect, it } from 'vitest'
import { dayCells, monthDays } from './cells'

const person = {
  country: 'DE',
  leave: [{ startDate: '2026-12-21', endDate: '2026-12-22', category: 'vacation', days: [{ date: '2026-12-21', hours: 8 }, { date: '2026-12-22', hours: 4 }] }],
}
const holidays = [
  { country: 'DE', date: '2026-12-25', name: '1. Weihnachtstag' },
  { country: 'US', date: '2026-12-24', name: 'Not ours' },
]

describe('dayCells', () => {
  const cells = dayCells(person, holidays, monthDays(2026, 11))

  it('marks full and partial leave days with their hours', () => {
    expect(cells.get('2026-12-21')).toMatchObject({ kind: 'leave', category: 'vacation', hours: 8, partial: false })
    expect(cells.get('2026-12-22')).toMatchObject({ kind: 'leave', hours: 4, partial: true })
  })

  it("uses only the person's own country's holidays", () => {
    expect(cells.get('2026-12-25')).toMatchObject({ kind: 'holiday', label: '1. Weihnachtstag' })
    expect(cells.get('2026-12-24')?.kind).toBe('work')
  })

  it('marks weekends', () => {
    expect(cells.get('2026-12-26')?.kind).toBe('weekend')
  })

  it('lists every day of the month', () => {
    expect(monthDays(2026, 1)).toHaveLength(28)
    expect(monthDays(2026, 11)[0]).toBe('2026-12-01')
  })
})
