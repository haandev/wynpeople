import { useQuery } from '@tanstack/react-query'
import { wyndbase } from '../../wyndbase'

export const useTypes = () => useQuery(wyndbase.query.pto.listTypes())
export const useMyRequests = () => useQuery(wyndbase.query.pto.myRequests({}))
export const useMyBalances = () => useQuery(wyndbase.query.pto.balances({}))
export const useApprovals = () => useQuery(wyndbase.query.pto.myApprovals())

export interface DayHours {
  date: string
  hours: number
}

/** `days` arrives as jsonb: [{ date, hours }]. */
export const asDays = (v: unknown): DayHours[] =>
  Array.isArray(v) ? v.map((d) => ({ date: String((d as DayHours).date), hours: Number((d as DayHours).hours) })) : []
