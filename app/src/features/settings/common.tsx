import type { ReactNode } from 'react'

export const COUNTRIES = ['TR', 'DE', 'US'] as const

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap py-2 pr-4">
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

export const Td = ({ children, className = '' }: { children?: ReactNode; className?: string }) => <td className={`py-2 pr-4 ${className}`}>{children}</td>

export function ReadOnlyNote() {
  return <p className="mb-3 rounded-md bg-stone-100 px-3 py-2 text-xs text-stone-600">Read-only: only an HR admin can change this.</p>
}
