import { describe, expect, it } from 'vitest'
import { exportMeta } from './meta'

describe('exportMeta', () => {
  it('lists who, when (ISO) and each filter', () => {
    const m = exportMeta({ generatedBy: 'Lena Schmidt', generatedAt: new Date('2026-11-20T10:00:00Z'), filters: { status: 'active', officeTeamId: null } })
    expect(m).toEqual([
      ['generated_by', 'Lena Schmidt'],
      ['generated_at', '2026-11-20T10:00:00.000Z'],
      ['filter.status', 'active'],
      ['filter.officeTeamId', ''],
    ])
  })
})
