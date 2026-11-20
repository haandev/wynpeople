import { useQuery } from '@tanstack/react-query'
import { wyndbase } from '../../wyndbase'

export const useProfile = (employeeId: string) => useQuery(wyndbase.query.hr.profile({ employeeId }))
export const useHistory = (employeeId: string) => useQuery(wyndbase.query.hr.employeeHistory({ employeeId }))
// Refused (403) for anyone but HR of that office; a refusal simply hides the table, so don't retry it.
export const useCompensation = (employeeId: string) => useQuery({ ...wyndbase.query.hr.compensationHistory({ employeeId }), retry: false })
export const useOrgTree = () => useQuery(wyndbase.query.org.tree({}))
export const useDirectory = () => useQuery(wyndbase.query.rpt.employeeDirectory({}))

/** Every read may be stale after a write; the cache is small, so refresh all of it. */
export const refreshAll = () => wyndbase.queryClient.invalidateQueries()

export type ProfileRow = NonNullable<ReturnType<typeof useProfile>['data']>[number]
