import { useQuery } from '@tanstack/react-query'
import { wyndbase } from '../../wyndbase'

export const useAvailability = (p: { from: string; to: string; employeeId?: string | null; officeTeamId?: string | null; departmentTeamId?: string | null }) =>
  useQuery(
    wyndbase.query.pto.availability({
      from: p.from,
      to: p.to,
      employeeId: p.employeeId ?? null,
      officeTeamId: p.officeTeamId ?? null,
      departmentTeamId: p.departmentTeamId ?? null,
    }),
  )

export const useHolidays = (from: string, to: string) => useQuery(wyndbase.query.pto.holidaysInRange({ from, to }))
