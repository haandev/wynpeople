import { useQuery } from '@tanstack/react-query'
import type { Role } from '../components/shell/nav'
import { wyndbase } from '../wyndbase'

export interface Me {
  userId: string | null
  employeeId: string | null
  name: string | null
  jobTitle: string | null
  office: string | null
  officeTeamId: string | null
  roles: Role[]
  isManager: boolean
}

const KNOWN: readonly Role[] = ['hr_admin', 'hr_manager', 'employee']

/** The signed-in person: their employee row (`hr.me`) and their roles in this base. */
export function useMe() {
  const row = useQuery(wyndbase.query.hr.me())
  const roles = useQuery(wyndbase.account.getMyRoles({ baseId: wyndbase.baseRef }))
  const r = row.data?.[0]
  const me: Me | undefined =
    row.data && roles.data
      ? {
          userId: r?.userId ?? null,
          employeeId: r?.employeeId ?? null,
          name: r?.name ?? null,
          jobTitle: r?.jobTitle ?? null,
          office: r?.office ?? null,
          officeTeamId: r?.officeTeamId ?? null,
          roles: roles.data.roles.filter((x): x is Role => (KNOWN as readonly string[]).includes(x)),
          isManager: (r?.directReports ?? 0) > 0,
        }
      : undefined
  return { me, isLoading: row.isLoading || roles.isLoading, error: row.error ?? roles.error }
}
