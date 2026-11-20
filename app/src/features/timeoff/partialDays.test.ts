import { describe, expect, it } from 'vitest'
import { partialDays } from './partialDays'

describe('partialDays', () => {
  it('rejects a 1 h override when the minimum is 2 h', () => {
    const r = partialDays('2026-12-14', '2026-12-15', { '2026-12-14': 1 }, 2)
    expect(r.ok).toBe(false)
    expect(r.error).toContain('2 hours')
  })

  it('accepts overrides at or above the minimum', () => {
    expect(partialDays('2026-12-14', '2026-12-15', { '2026-12-14': 4 }, 2)).toEqual({ ok: true })
  })

  it('rejects an override outside the requested range', () => {
    const r = partialDays('2026-12-14', '2026-12-15', { '2026-12-20': 4 }, 2)
    expect(r.ok).toBe(false)
    expect(r.error).toContain('outside')
  })

  it('rejects an end date before the start date', () => {
    expect(partialDays('2026-12-15', '2026-12-14', {}, 2).ok).toBe(false)
  })
})
