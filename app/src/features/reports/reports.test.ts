import { describe, expect, it } from 'vitest'
import { availability, flattenBalances, leaveSummary, scheduledTimeOff } from './reports'

const usage = [
  { employee: 'Anna', employeeId: 'a', department: 'Product', productTeam: 'Growth', type: 'Vacation', status: 'approved', totalHours: 16, days: [{ date: '2027-01-11', hours: 8 }, { date: '2027-01-12', hours: 8 }] },
  { employee: 'Jonas', employeeId: 'j', department: 'Product', productTeam: 'Growth', type: 'Vacation', status: 'approved', totalHours: 8, days: [{ date: '2027-01-12', hours: 8 }] },
  { employee: 'Sophie', employeeId: 's', department: 'Engineering', productTeam: 'Core', type: 'Vacation', status: 'denied', totalHours: 8, days: [{ date: '2027-01-12', hours: 8 }] },
]

describe('report aggregations', () => {
  it('leaveSummary sums approved hours and counts people per group', () => {
    expect(leaveSummary(usage, 'department')).toEqual([{ group: 'Product', type: 'Vacation', totalHours: 24, people: 2 }])
  })
  it('availability lists one row per person per day within the range', () => {
    expect(availability(usage, '2027-01-12', '2027-01-12').map((r) => r.employee)).toEqual(['Anna', 'Jonas'])
  })
  it('flattenBalances joins pending by type code', () => {
    const rows = flattenBalances([{ employeeNumber: 'E1', employee: 'S', office: 'Berlin', balances: [{ code: 'VAC', name: 'Vacation', accrued: '240', used: 0, expired: 0, remaining: '240' }], pending: [{ code: 'VAC', hours: 16 }, { code: 'SICK', hours: 320 }] }])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ type: 'Vacation', pending: 16, remaining: 240 })
    expect(rows[1]).toMatchObject({ type: 'SICK', pending: 320 })
  })
  it('scheduledTimeOff keeps approved and pending leave that has not ended, soonest first', () => {
    const rows = [
      { employee: 'Past', status: 'approved', startDate: '2026-11-01', endDate: '2026-11-02' },
      { employee: 'Later', status: 'pending', startDate: '2026-12-10', endDate: '2026-12-11' },
      { employee: 'Denied', status: 'denied', startDate: '2026-11-25', endDate: '2026-11-25' },
      { employee: 'Ongoing', status: 'approved', startDate: '2026-11-20', endDate: '2026-11-22' },
    ]
    expect(scheduledTimeOff(rows, '2026-11-21').map((r) => r.employee)).toEqual(['Ongoing', 'Later'])
  })
})
