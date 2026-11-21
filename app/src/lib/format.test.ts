import { expect, test } from 'vitest'
import { fmtDate } from './format'

// Run with TZ=Europe/Istanbul (UTC+3), the offices' clock.
test('a plain date is shown as that date', () => {
  expect(fmtDate('2026-11-21')).toBe('21 Nov 2026')
})

test('a timestamp is shown as its local date, not its UTC date', () => {
  // Local midnight on 21 Nov in Istanbul is 21:00 UTC on 20 Nov.
  expect(fmtDate('2026-11-20T21:00:00Z')).toBe('21 Nov 2026')
})
