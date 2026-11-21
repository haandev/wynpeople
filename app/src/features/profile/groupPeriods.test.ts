import { describe, expect, it } from 'vitest'
import { currentIndex, groupPeriods } from './groupPeriods'

const p = (value: string, from: string, to: string | null, reason: string | null = null) => ({
  value,
  reason,
  _effectiveFrom: from,
  _effectiveTo: to,
})

describe('groupPeriods', () => {
  const history = {
    jobTitle: [p('Engineer', '2024-01-08', '2027-01-01', 'Hire'), p('Senior Engineer', '2027-01-01', null, 'Promotion')],
    department: [p('Engineering', '2024-01-08', '2026-06-01'), p('Platform', '2026-06-01', null, 'Re-org')],
    office: [p('Istanbul', '2024-01-08', '2027-01-01'), p('Berlin', '2027-01-01', null, 'Relocation')],
  }

  it('groups changes that share a start date into one row, newest first', () => {
    const rows = groupPeriods(history, ['jobTitle', 'department', 'office'])
    expect(rows.map((r) => r.effectiveFrom)).toEqual(['2027-01-01', '2026-06-01', '2024-01-08'])
    expect(rows[0].reasons).toEqual(['Promotion', 'Relocation'])
  })

  it('carries unchanged values forward into each row', () => {
    const rows = groupPeriods(history, ['jobTitle', 'department', 'office'])
    expect(rows[0].values).toEqual({ jobTitle: 'Senior Engineer', department: 'Platform', office: 'Berlin' })
    expect(rows[1].values).toEqual({ jobTitle: 'Engineer', department: 'Platform', office: 'Istanbul' })
    expect(rows[2].values).toEqual({ jobTitle: 'Engineer', department: 'Engineering', office: 'Istanbul' })
  })

  it('ends each row where the next one starts; the newest is open', () => {
    const rows = groupPeriods(history, ['jobTitle', 'department', 'office'])
    expect(rows.map((r) => r.effectiveTo)).toEqual([null, '2027-01-01', '2026-06-01'])
  })

  it('tolerates missing columns', () => {
    expect(groupPeriods({ jobTitle: null }, ['jobTitle', 'office'])).toEqual([])
  })

  it('shows a reason once when one change wrote it on several columns (WDB-4326)', () => {
    const h = {
      jobTitle: [p('Engineer', '2024-01-08', '2027-01-01', 'Hire'), p('Lead', '2027-01-01', null, 'Promotion')],
      department: [p('Engineering', '2024-01-08', '2027-01-01', 'Hire'), p('Platform', '2027-01-01', null, 'Promotion')],
    }
    const rows = groupPeriods(h, ['jobTitle', 'department'])
    expect(rows[0].reasons).toEqual(['Promotion'])
    expect(rows[1].reasons).toEqual(['Hire'])
  })
})

describe('currentIndex', () => {
  it('is the newest row that has started by today, not a future one (WDB-4326)', () => {
    const starts = ['2027-01-01', '2026-06-01', '2024-01-08']
    expect(currentIndex(starts, '2026-11-21')).toBe(1)
  })

  it('is the first row when nothing is in the future', () => {
    expect(currentIndex(['2026-06-01', '2024-01-08'], '2026-11-21')).toBe(0)
  })

  it('is none when every row is in the future', () => {
    expect(currentIndex(['2027-01-01'], '2026-11-21')).toBe(-1)
  })
})
