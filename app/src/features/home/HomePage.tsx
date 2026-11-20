import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button, PageHeader } from '../../components/ui/ui'
import { isoDate } from '../../lib/format'
import { useMe } from '../../lib/useMe'
import { Dashboard } from './Dashboard'

export function thisWeek(now = new Date()) {
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { from: isoDate(monday), to: isoDate(sunday) }
}

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export function HomePage() {
  const { me } = useMe()
  const [customizing, setCustomizing] = useState(false)
  const firstName = me?.name?.split(' ')[0]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${firstName ?? ''}`}
        subtitle={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        actions={
          <div className="flex gap-2">
            {!customizing && (
              <Button variant="secondary" onClick={() => setCustomizing(true)}>
                Customize
              </Button>
            )}
            <Link to="/time-off" className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700">
              Request time off
            </Link>
          </div>
        }
      />
      <Dashboard customizing={customizing} onDone={() => setCustomizing(false)} />
    </div>
  )
}
