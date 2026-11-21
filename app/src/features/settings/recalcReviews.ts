import { useQuery } from '@tanstack/react-query'
import { useMe } from '../../lib/useMe'
import { wyndbase } from '../../wyndbase'

/** Open inbox requests of pto.recalcReview the caller may answer, by recalculation id. */
export function useRecalcReviews(enabled = true) {
  const q = useQuery({ ...wyndbase.query.pto.recalcReviews(), enabled })
  return new Map((q.data ?? []).map((r) => [String(r.pendingRecalcId), r.interactionId]))
}

/**
 * For an inbox item: true when it is a recalculation request, which is answered on
 * Settings → Recalculations rather than on Time off (where the time off approvals are).
 */
export function useIsRecalcRequest() {
  const { me } = useMe()
  const hr = !!me && (me.roles.includes('hr_admin') || me.roles.includes('hr_manager'))
  const ids = new Set(useRecalcReviews(hr).values())
  return (item: { target?: { kind: string; interactionId?: string } }) => item.target?.kind === 'interaction' && !!item.target.interactionId && ids.has(item.target.interactionId)
}
