import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge, Button, ErrorNote, inputCls } from '../../components/ui/ui'
import { errorMessage } from '../../lib/format'
import { useMe } from '../../lib/useMe'
import { wyndbase } from '../../wyndbase'
import { refreshAll, useDirectory } from '../profile/data'

export interface Approval {
  interactionId: string
  name: string | null
  description: string | null
  params: { [k: string]: unknown } | null
}

/** One pending request: approve or deny with a note. HR answering in the approver's place is shown as an override. */
export function ApprovalCard({ a }: { a: Approval }) {
  const { me } = useMe()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<'approve' | 'deny' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const approver = (a.params?.approver as string | null | undefined) ?? null
  // Approvals someone lent me (out of office): answering those is not an HR override.
  const received = useQuery({ ...wyndbase.query.auth.listReceivedDelegations({ userId: me?.userId }), enabled: !!me?.userId })
  const dir = useDirectory()
  const lentBy = (received.data ?? []).find(
    (d) => d.delegatorId === approver && d.key === 'pto.requestApproval.ask.answer' && !d.revokedAt && (d.endsAt ?? '') > new Date().toISOString(),
  )
  const override = !!me && approver !== me.userId && !lentBy

  const answer = async (decision: 'approve' | 'deny') => {
    setBusy(decision)
    setError(null)
    try {
      await wyndbase.mutation.system.answerInteraction({ interactionId: a.interactionId, response: note ? { decision, note } : { decision } })
      await refreshAll()
      await wyndbase.inbox.markAllSeen().catch(() => undefined)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{a.name}</p>
          <p className="text-sm text-stone-500">{a.description}</p>
        </div>
        {lentBy ? (
          <Badge tone="blue">For {dir.data?.find((p) => p.userId === lentBy.delegatorId)?.name ?? lentBy.delegatorName}</Badge>
        ) : (
          override && <Badge tone="amber">{approver ? 'HR override' : 'No manager · HR decides'}</Badge>
        )}
      </div>
      <input className={`${inputCls} mt-3`} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="secondary" disabled={!!busy} onClick={() => answer('deny')}>
          {busy === 'deny' ? 'Denying…' : 'Deny'}
        </Button>
        <Button disabled={!!busy} onClick={() => answer('approve')}>
          {busy === 'approve' ? 'Approving…' : 'Approve'}
        </Button>
      </div>
      <ErrorNote error={error} />
    </div>
  )
}
