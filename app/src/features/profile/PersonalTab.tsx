import { useState } from 'react'
import { Button, Card, Empty, ErrorNote, Field, inputCls } from '../../components/ui/ui'
import { errorMessage, fmtDate, text } from '../../lib/format'
import { wyndbase } from '../../wyndbase'
import { type ProfileRow, refreshAll } from './data'

interface Contact {
  name: string
  relationship: string
  phone: string
  isPrimary: boolean
}

function Row({ k, v }: { k: string; v: unknown }) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1.5 text-sm">
      <dt className="text-stone-500">{k}</dt>
      <dd className="col-span-2">{text(v)}</dd>
    </div>
  )
}

export function PersonalTab({ p, isSelf }: { p: ProfileRow; isSelf: boolean }) {
  const [editing, setEditing] = useState(false)
  const [names, setNames] = useState({ nickname: p.preferredName ?? '', pronouns: p.pronouns ?? '' })
  const [contacts, setContacts] = useState<Contact[]>(
    (p.emergencyContacts ?? []).map((c) => ({ name: c.name ?? '', relationship: c.relationship ?? '', phone: c.phone ?? '', isPrimary: !!c.isPrimary })),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      await wyndbase.mutation.auth.updateMyProfile({ nickname: names.nickname || null, pronouns: names.pronouns || null })
      const clean = contacts.filter((c) => c.name.trim() && c.phone.trim())
      if (clean.length > 0) await wyndbase.mutation.hr.updateMyEmergencyContacts({ contacts: clean })
      await refreshAll()
      setEditing(false)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card
        title="Basic information"
        actions={isSelf && !editing && <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button>}
      >
        <dl className="divide-y divide-stone-100">
          <Row k="First name" v={p.givenName} />
          <Row k="Last name" v={p.familyName} />
          {editing ? (
            <div className="grid gap-3 py-2 sm:grid-cols-2">
              <Field label="Preferred name">
                <input className={inputCls} value={names.nickname} onChange={(e) => setNames({ ...names, nickname: e.target.value })} />
              </Field>
              <Field label="Pronouns">
                <input className={inputCls} value={names.pronouns} onChange={(e) => setNames({ ...names, pronouns: e.target.value })} />
              </Field>
            </div>
          ) : (
            <>
              <Row k="Preferred name" v={p.preferredName} />
              <Row k="Pronouns" v={p.pronouns} />
            </>
          )}
          <Row k="Work email" v={p.workEmail} />
          <Row k="Employee #" v={p.employeeNumber} />
          <Row k="Hire date" v={fmtDate(p.hireDate)} />
          <Row k="Original hire date" v={fmtDate(p.originalHireDate)} />
        </dl>
      </Card>

      <Card title="Addresses & phones">
        {(p.addresses ?? []).length === 0 && (p.phones ?? []).length === 0 ? (
          <Empty>{isSelf ? 'No addresses or phones on file.' : 'Not visible to you, or none on file.'}</Empty>
        ) : (
          <ul className="space-y-2 text-sm">
            {(p.addresses ?? []).map((a) => (
              <li key={a._id}>
                <span className="font-medium">{text(a.label ?? 'Address')}:</span>{' '}
                {[a.streetAddress, a.locality, a.region, a.postalCode, a.country].filter(Boolean).map(String).join(', ')}
              </li>
            ))}
            {(p.phones ?? []).map((ph) => (
              <li key={ph._id}>
                <span className="font-medium">{text(ph.label ?? 'Phone')}:</span> {text(ph.phone)}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Emergency contacts" className="lg:col-span-2">
        {editing ? (
          <div className="space-y-2">
            {contacts.map((c, i) => (
              <div key={i} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_auto_auto]">
                {(['name', 'relationship', 'phone'] as const).map((k) => (
                  <Field key={k} label={k[0].toUpperCase() + k.slice(1)}>
                    <input className={inputCls} value={c[k]} onChange={(e) => setContacts(contacts.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} />
                  </Field>
                ))}
                <label className="flex items-center gap-1 pb-2 text-sm">
                  <input type="radio" name="primary" checked={c.isPrimary} onChange={() => setContacts(contacts.map((x, j) => ({ ...x, isPrimary: j === i })))} />
                  Primary
                </label>
                <Button variant="ghost" onClick={() => setContacts(contacts.filter((_, j) => j !== i))}>
                  Remove
                </Button>
              </div>
            ))}
            <Button variant="secondary" onClick={() => setContacts([...contacts, { name: '', relationship: '', phone: '', isPrimary: contacts.length === 0 }])}>
              + Add contact
            </Button>
          </div>
        ) : (p.emergencyContacts ?? []).length === 0 ? (
          <Empty>{isSelf ? 'Add someone we can call in an emergency.' : 'Not visible to you, or none on file.'}</Empty>
        ) : (
          <ul className="space-y-1 text-sm">
            {(p.emergencyContacts ?? []).map((c) => (
              <li key={c._id}>
                <span className="font-medium">{c.name}</span> ({c.relationship ?? '—'}) · {c.phone} {c.isPrimary && <span className="text-xs text-brand-700">primary</span>}
              </li>
            ))}
          </ul>
        )}
        {editing && (
          <div className="mt-4 flex justify-end gap-2">
            <ErrorNote error={error} />
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
