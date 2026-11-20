import { useRef, useState } from 'react'
import { Avatar } from '../../components/ui/Avatar'
import { Badge, statusTone } from '../../components/ui/ui'
import { errorMessage, label } from '../../lib/format'
import { useMe } from '../../lib/useMe'
import { wyndbase } from '../../wyndbase'
import { refreshAll } from './data'
import type { ProfileRow } from './data'
import { Layers, Mail, MapPin, UserRound, type LucideIcon } from 'lucide-react'

const Meta = ({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5">
    <Icon className="h-4 w-4 text-stone-400" aria-hidden />
    {children}
  </span>
)

export function ProfileHeader({ p }: { p: ProfileRow }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-card">
      <div className="h-24 bg-gradient-to-r from-brand-800 via-brand-600 to-brand-400" />
      <div className="flex flex-col gap-4 px-6 pb-5 sm:flex-row sm:items-end">
        <div className="-mt-12">
          <Avatar name={p.name} picture={p.picture} size="xl" ring />
          <PhotoControls p={p} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{p.name}</h1>
            {p.preferredName && <span className="text-sm text-stone-500">“{p.preferredName}”</span>}
            <Badge tone={statusTone(p.status)}>{label(p.status)}</Badge>
          </div>
          <p className="text-stone-600">{p.jobTitle}</p>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600">
            <Meta icon={Layers}>{[p.department, p.productTeam].filter(Boolean).join(' · ')}</Meta>
            <Meta icon={MapPin}>{p.office}</Meta>
            {p.manager && <Meta icon={UserRound}>Reports to {p.manager}</Meta>}
            {p.workEmail && <Meta icon={Mail}>{p.workEmail}</Meta>}
          </div>
        </div>
        <span className="text-xs font-medium text-stone-400">#{p.employeeNumber}</span>
      </div>
    </div>
  )
}

/** Your own photo: the built-in profile picture (auth.users.picture), uploaded with storage.attach and set with auth.setMyPicture. */
function PhotoControls({ p }: { p: ProfileRow }) {
  const { me } = useMe()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!me?.userId || me.userId !== p.userId) return null
  const hasPhoto = Array.isArray(p.picture) && p.picture.length > 0

  const save = async (picture: string[]) => {
    await wyndbase.mutation.auth.setMyPicture({ picture })
    await refreshAll()
  }
  const upload = async (file: File) => {
    setBusy(true)
    setError(null)
    try {
      const { attachmentId } = await wyndbase.storage.attach(file, { column: 'auth.users.picture', record: me.userId!, silent: true })
      await save([attachmentId])
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }
  const remove = async () => {
    setBusy(true)
    setError(null)
    try {
      await save([])
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-2 flex flex-col items-start gap-1 text-xs">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="font-medium text-brand-700 hover:underline disabled:text-stone-400">
          {busy ? 'Saving…' : hasPhoto ? 'Change photo' : 'Add photo'}
        </button>
        {hasPhoto && !busy && (
          <button type="button" onClick={remove} className="text-stone-500 hover:underline">
            Remove
          </button>
        )}
      </div>
      {error && <p className="max-w-[12rem] text-red-600">{error}</p>}
    </div>
  )
}
