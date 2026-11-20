import { useState } from 'react'
import { Empty } from '../../components/ui/ui'
import { useMe } from '../../lib/useMe'
import { useProfile } from './data'
import { AvailabilityCalendar } from '../availability/AvailabilityCalendar'
import { ReportingLine } from '../people/ReportingLine'
import { HistoryTab } from './HistoryTab'
import { JobTab } from './JobTab'
import { PersonalTab } from './PersonalTab'
import { ProfileHeader } from './ProfileHeader'
import { TimeOffTab } from './TimeOffTab'

const TABS = ['Personal', 'Job', 'Reporting line', 'Availability', 'Time Off', 'History'] as const
type TabName = (typeof TABS)[number]

export function ProfilePage({ employeeId }: { employeeId: string }) {
  const { me } = useMe()
  const q = useProfile(employeeId)
  const [tab, setTab] = useState<TabName>('Personal')
  const p = q.data?.[0]
  if (q.isLoading) return <Empty>Loading…</Empty>
  if (!p) return <Empty>This person could not be found.</Empty>

  const isSelf = me?.employeeId === p.employeeId
  // The server is the authority; this only decides which buttons to show.
  const canEdit = !!me && (me.roles.includes('hr_admin') || (me.roles.includes('hr_manager') && me.officeTeamId === p.officeTeamId && !isSelf))
  const canSeeTimeOff = isSelf || canEdit || me?.userId === p.managerUserId

  return (
    <div className="space-y-5">
      <ProfileHeader p={p} />
      <div className="flex gap-1 border-b border-stone-200">
        {TABS.filter((t) => t !== 'Time Off' || canSeeTimeOff).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t ? 'border-brand-600 text-brand-800' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Personal' && <PersonalTab key={p.employeeId} p={p} isSelf={isSelf} />}
      {tab === 'Job' && <JobTab p={p} canEdit={canEdit} />}
      {tab === 'Reporting line' && <ReportingLine key={p.employeeId} employeeId={p.employeeId} />}
      {tab === 'Availability' && <AvailabilityCalendar employeeId={p.employeeId} />}
      {tab === 'Time Off' && <TimeOffTab employeeId={p.employeeId} />}
      {tab === 'History' && <HistoryTab employeeId={p.employeeId} />}
    </div>
  )
}
