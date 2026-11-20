import type { ReactNode } from 'react'

export const COUNTRIES = ['TR', 'DE', 'US'] as const

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
