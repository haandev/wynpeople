import { initials } from '../../components/shell/UserMenu'
import { Badge, statusTone } from '../../components/ui/ui'
import { label } from '../../lib/format'
import type { ProfileRow } from './data'

export function ProfileHeader({ p }: { p: ProfileRow }) {
  const photo = Array.isArray(p.picture) ? (p.picture[0] as string | undefined) : undefined
  return (
    <div className="flex flex-col gap-4 rounded-lg bg-brand-700 p-6 text-white sm:flex-row sm:items-center">
      {photo ? (
        <img src={photo} alt="" className="h-24 w-24 rounded-full border-4 border-white/80 object-cover" />
      ) : (
        <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-white/80 bg-white text-3xl font-bold text-brand-700">
          {initials(p.name)}
        </div>
      )}
      <div className="flex-1">
        <h1 className="text-2xl font-semibold">
          {p.name} {p.preferredName && <span className="text-base font-normal text-white/80">“{p.preferredName}”</span>}
        </h1>
        <p className="text-white/90">{p.jobTitle}</p>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/85">
          <span>{p.department}</span>
          {p.productTeam && <span>{p.productTeam}</span>}
          <span>{p.office}</span>
          {p.manager && <span>Reports to {p.manager}</span>}
          {p.workEmail && <span>{p.workEmail}</span>}
        </div>
      </div>
      <div className="flex flex-col items-start gap-1 sm:items-end">
        <Badge tone={statusTone(p.status)}>{label(p.status)}</Badge>
        <span className="text-xs text-white/70">#{p.employeeNumber}</span>
      </div>
    </div>
  )
}
