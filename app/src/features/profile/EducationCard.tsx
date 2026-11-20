import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { askConfirm } from '../../components/ui/confirm'
import { SkeletonList } from '../../components/ui/Skeleton'
import { Button, Card, Empty, ErrorNote, Field, inputCls } from '../../components/ui/ui'
import { errorMessage, fmtDate } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { refreshAll } from './data'

type Row = NonNullable<ReturnType<typeof useEducation>['data']>[number]
const useEducation = (employeeId: string) => useQuery(wyndbase.query.hr.listEducation({ employeeId }))

interface Draft {
  educationId: string | null
  institution: string
  degree: string
  major: string
  gpa: string
  startDate: string
  endDate: string
}
const blank: Draft = { educationId: null, institution: '', degree: '', major: '', gpa: '', startDate: '', endDate: '' }
const toDraft = (r: Row): Draft => ({
  educationId: r.educationId,
  institution: r.institution ?? '',
  degree: r.degree ?? '',
  major: r.major ?? '',
  gpa: r.gpa ?? '',
  startDate: r.startDate ? String(r.startDate) : '',
  endDate: r.endDate ? String(r.endDate) : '',
})

/**
 * Education on the profile. The person keeps their own; HR for their office (and HR admins) can too;
 * their manager reads it. The rules on hr.education decide, so `canEdit` only shows or hides the buttons.
 */
export function EducationCard({ employeeId, canEdit, isSelf }: { employeeId: string; canEdit: boolean; isSelf: boolean }) {
  const q = useEducation(employeeId)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      await refreshAll()
      return true
    } catch (e) {
      setError(errorMessage(e))
      return false
    } finally {
      setBusy(false)
    }
  }

  const save = async () => {
    if (!draft) return
    const ok = await run(() =>
      wyndbase.mutation.hr.saveEducation({
        employeeId,
        educationId: draft.educationId,
        institution: draft.institution,
        degree: draft.degree || null,
        major: draft.major || null,
        gpa: draft.gpa || null,
        startDate: draft.startDate || null,
        endDate: draft.endDate || null,
      }),
    )
    if (ok) setDraft(null)
  }

  const badDates = !!draft?.startDate && !!draft?.endDate && draft.endDate < draft.startDate
  const rows = q.data ?? []

  const form = draft && (
    <form
      className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/40 p-4"
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <Field label="College / institution">
        <input autoFocus className={inputCls} value={draft.institution} onChange={(e) => setDraft({ ...draft, institution: e.target.value })} placeholder="e.g. Polytechnic University of Tirana" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_7rem]">
        <Field label="Degree">
          <input className={inputCls} value={draft.degree} onChange={(e) => setDraft({ ...draft, degree: e.target.value })} placeholder="e.g. Master's" />
        </Field>
        <Field label="Major / specialization">
          <input className={inputCls} value={draft.major} onChange={(e) => setDraft({ ...draft, major: e.target.value })} />
        </Field>
        <Field label="GPA">
          <input className={inputCls} value={draft.gpa} onChange={(e) => setDraft({ ...draft, gpa: e.target.value })} placeholder="3.6/4" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Start date">
          <input type="date" className={inputCls} value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} />
        </Field>
        <Field label="End date">
          <input type="date" className={inputCls} value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} />
        </Field>
      </div>
      {badDates && <p className="text-sm text-red-600">The end date is before the start date.</p>}
      <ErrorNote error={error} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setDraft(null)}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy || !draft.institution.trim() || badDates}>
          {busy ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )

  return (
    <Card title="Education" className="lg:col-span-2">
      {q.isLoading ? (
        <SkeletonList rows={2} />
      ) : (
        <div className="space-y-3">
          {rows.length === 0 && !draft && <Empty icon="🎓">{isSelf ? 'Add your education.' : canEdit ? 'No education on file.' : 'Not visible to you, or none on file.'}</Empty>}
          <ul className="divide-y divide-stone-100">
            {rows.map((r) =>
              draft?.educationId === r.educationId ? (
                <li key={r.educationId} className="py-3">
                  {form}
                </li>
              ) : (
                <li key={r.educationId} className="group flex items-start gap-3 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700" aria-hidden>
                    🎓
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900">{r.institution}</p>
                    <p className="text-sm text-stone-600">{[r.degree, r.major].filter(Boolean).join(' · ') || '—'}</p>
                    <p className="text-xs text-stone-500">
                      {[r.startDate || r.endDate ? `${r.startDate ? fmtDate(String(r.startDate)) : '…'} – ${r.endDate ? fmtDate(String(r.endDate)) : 'present'}` : null, r.gpa ? `GPA ${r.gpa}` : null].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  {(canEdit || isSelf) && !draft && (
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" onClick={() => setDraft(toDraft(r))}>
                        Edit
                      </Button>
                      <button
                        type="button"
                        className="grid h-9 w-9 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${r.institution}`}
                        onClick={async () => (await askConfirm(`Remove ${r.institution} from the profile?`, { confirmLabel: 'Remove', danger: true })) && run(() => wyndbase.mutation.hr.deleteEducation({ educationId: r.educationId }))}
                      >
                        🗑
                      </button>
                    </div>
                  )}
                </li>
              ),
            )}
          </ul>
          {draft && !draft.educationId && form}
          {!draft && <ErrorNote error={error} />}
          {(canEdit || isSelf) && !draft && (
            <button type="button" onClick={() => setDraft(blank)} className="text-sm font-medium text-brand-700 hover:underline">
              ⊕ Add education
            </button>
          )}
        </div>
      )}
    </Card>
  )
}
