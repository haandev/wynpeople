import { useState } from 'react'
import { SkeletonProfile } from '../../components/ui/Skeleton'
import { Empty, Tabs } from '../../components/ui/ui'
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
  if (q.isLoading) return <SkeletonProfile />
  if (!p) return <Empty>This person could not be found.</Empty>

  const isSelf = me?.employeeId === p.employeeId
  // The server is the authority; this only decides which buttons to show.
  // Display only: the server decides (HR for the person's office; nobody on their own record).
  const canEdit = !!me && !isSelf && (me.roles.includes('hr_admin') || (me.roles.includes('hr_manager') && me.officeTeamId === p.officeTeamId))
  const canSeeTimeOff = isSelf || canEdit || me?.userId === p.managerUserId

  return (
    <div className="space-y-6">
      <ProfileHeader p={p} />
      <Tabs tabs={TABS.filter((t) => t !== 'Time Off' || canSeeTimeOff)} value={tab} onChange={setTab} />
      {tab === 'Personal' && <PersonalTab key={p.employeeId} p={p} isSelf={isSelf} canEdit={canEdit} />}
      {tab === 'Job' && <JobTab p={p} canEdit={canEdit} />}
      {tab === 'Reporting line' && <ReportingLine key={p.employeeId} employeeId={p.employeeId} />}
      {tab === 'Availability' && <AvailabilityCalendar employeeId={p.employeeId} />}
      {tab === 'Time Off' && <TimeOffTab employeeId={p.employeeId} />}
      {tab === 'History' && <HistoryTab employeeId={p.employeeId} />}
    </div>
  )
}
