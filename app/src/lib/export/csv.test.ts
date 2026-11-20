import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

const meta: [string, string][] = [['generated_by', 'Lena']]
const cols = [{ key: 'name', title: 'Name' }, { key: 'note', title: 'Note' }]

describe('toCsv', () => {
  it('quotes a comma and doubles a quote', () => {
    const csv = toCsv(meta, cols, [{ name: 'Müller, Anna', note: 'say "hi"' }])
    expect(csv.split('\r\n').at(-1)).toBe('"Müller, Anna","say ""hi"""')
  })

  it('guards formula-leading cells', () => {
    const csv = toCsv(meta, cols, [{ name: '=SUM(A1)', note: '+1' }])
    expect(csv.split('\r\n').at(-1)).toBe("'=SUM(A1),'+1")
  })

  it('puts the meta lines first, then a blank line, then the header', () => {
    const lines = toCsv(meta, cols, [{ name: 'a', note: 'b' }]).split('\r\n')
    expect(lines.slice(0, 3)).toEqual(['generated_by,Lena', '', 'Name,Note'])
  })
})
