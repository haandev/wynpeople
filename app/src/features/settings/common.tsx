import type { ReactNode } from 'react'
import { Combobox } from '../../components/ui/Combobox'

// Every ISO 3166-1 alpha-2 country the browser can name (about 250), so any office or rule
// can be set up for any country, not only the ones seeded. Codes that name a group, not a
// country (EU, UN, …) are left out.
const NOT_COUNTRIES = new Set(['EU', 'EZ', 'UN', 'QO', 'XA', 'XB', 'ZZ'])
const regionNames = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'none' })
export const COUNTRY_OPTIONS = (() => {
  const out: { value: string; label: string }[] = []
  for (let a = 65; a <= 90; a++)
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b)
      const name = NOT_COUNTRIES.has(code) ? undefined : regionNames.of(code)
      if (name && name !== code) out.push({ value: code, label: `${name} (${code})` })
    }
  return out.sort((x, y) => x.label.localeCompare(y.label, 'en'))
})()

export const countryName = (code: string | null | undefined) => (code ? (regionNames.of(code) ?? code) : '')

/** A searchable country picker: type "tur", "germ" or a code. */
export function CountryPicker({ value, onChange, optional = false }: { value: string; onChange: (code: string) => void; optional?: boolean }) {
  return <Combobox value={value} onChange={onChange} options={COUNTRY_OPTIONS} placeholder="Search a country…" emptyLabel={optional ? '—' : undefined} />
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export const Td = ({ children, className = '' }: { children?: ReactNode; className?: string }) => <td className={className}>{children}</td>

export function ReadOnlyNote() {
  return <p className="mb-4 flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600"><span aria-hidden>🔒</span>Read-only: only an HR admin can change this.</p>
}
