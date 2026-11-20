import { describe, expect, it } from 'vitest'
import { managerChain, reportsOf } from './reportingChain'

const rows = [
  { id: 'ceo', managerId: null },
  { id: 'vp', managerId: 'ceo' },
  { id: 'me', managerId: 'vp' },
  { id: 'r1', managerId: 'me' },
  { id: 'r2', managerId: 'me' },
  { id: 'r1a', managerId: 'r1' },
]

describe('reporting line', () => {
  it('walks the manager chain upwards, nearest first', () => {
    expect(managerChain(rows, 'me').map((r) => r.id)).toEqual(['vp', 'ceo'])
  })
  it('lists direct reports only', () => {
    expect(reportsOf(rows, 'me').map((r) => r.id)).toEqual(['r1', 'r2'])
    expect(reportsOf(rows, 'r1').map((r) => r.id)).toEqual(['r1a'])
  })
  it('stops on a cycle', () => {
    expect(managerChain([{ id: 'a', managerId: 'b' }, { id: 'b', managerId: 'a' }], 'a').map((r) => r.id)).toEqual(['b'])
  })
})
