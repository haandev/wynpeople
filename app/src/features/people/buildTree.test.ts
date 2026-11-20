import { describe, expect, it } from 'vitest'
import { buildTree } from './buildTree'

describe('buildTree', () => {
  it('builds a two-level tree and keeps an orphan as its own root', () => {
    const rows = [
      { id: 'ceo', managerId: null },
      { id: 'a', managerId: 'ceo' },
      { id: 'b', managerId: 'ceo' },
      { id: 'a1', managerId: 'a' },
      { id: 'orphan', managerId: 'gone' },
    ]
    const roots = buildTree(rows)
    expect(roots.map((r) => r.row.id)).toEqual(['ceo', 'orphan'])
    expect(roots[0].children.map((c) => c.row.id)).toEqual(['a', 'b'])
    expect(roots[0].children[0].children.map((c) => c.row.id)).toEqual(['a1'])
  })

  it('does not loop on a cycle A↔B', () => {
    const roots = buildTree([
      { id: 'A', managerId: 'B' },
      { id: 'B', managerId: 'A' },
    ])
    const count = (n: { children: unknown[] }[]): number =>
      n.reduce((s, x) => s + 1 + count(x.children as { children: unknown[] }[]), 0)
    expect(count(roots)).toBe(2)
    expect(roots.length).toBeGreaterThanOrEqual(1)
  })
})
