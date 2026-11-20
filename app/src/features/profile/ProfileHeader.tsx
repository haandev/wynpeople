import { Avatar } from '../../components/ui/Avatar'
import { Badge, statusTone } from '../../components/ui/ui'
import { label } from '../../lib/format'
import type { ProfileRow } from './data'

const Meta = ({ icon, children }: { icon: string; children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="text-stone-400" aria-hidden>
      {icon}
    </span>
    {children}
  </span>
)

export function ProfileHeader({ p }: { p: ProfileRow }) {
  const photo = Array.isArray(p.picture) ? (p.picture[0] as string | undefined) : undefined
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-card">
      <div className="h-24 bg-gradient-to-r from-brand-800 via-brand-600 to-brand-400" />
      <div className="flex flex-col gap-4 px-6 pb-5 sm:flex-row sm:items-end">
        <div className="-mt-12">
          <Avatar name={p.name} src={photo} size="xl" ring />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{p.name}</h1>
            {p.preferredName && <span className="text-sm text-stone-500">“{p.preferredName}”</span>}
            <Badge tone={statusTone(p.status)}>{label(p.status)}</Badge>
          </div>
          <p className="text-stone-600">{p.jobTitle}</p>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600">
            <Meta icon="◧">{[p.department, p.productTeam].filter(Boolean).join(' · ')}</Meta>
            <Meta icon="⌖">{p.office}</Meta>
            {p.manager && <Meta icon="↑">Reports to {p.manager}</Meta>}
            {p.workEmail && <Meta icon="✉">{p.workEmail}</Meta>}
          </div>
        </div>
        <span className="text-xs font-medium text-stone-400">#{p.employeeNumber}</span>
      </div>
    </div>
  )
}
