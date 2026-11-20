/** Client-side pre-check of a request's per-day hours; the server stays authoritative. */
export function partialDays(
  start: string,
  end: string,
  overrides: Record<string, number>,
  minHours: number,
  hoursPerDay = 8,
): { ok: boolean; error?: string } {
  if (!start || !end) return { ok: false, error: 'Choose a start and an end date.' }
  if (end < start) return { ok: false, error: 'The end date is before the start date.' }
  for (const [date, hours] of Object.entries(overrides)) {
    if (date < start || date > end) return { ok: false, error: `${date} is outside the requested dates.` }
    if (!(hours > 0)) return { ok: false, error: `Hours for ${date} must be more than zero.` }
    if (hours < minHours) return { ok: false, error: `A partial day must be at least ${minHours} hours.` }
    if (hours > hoursPerDay) return { ok: false, error: `A day cannot exceed ${hoursPerDay} hours.` }
  }
  return { ok: true }
}
