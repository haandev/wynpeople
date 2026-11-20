import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { wyndbase } from '../../wyndbase'
import { Avatar } from './Avatar'
import { Combobox } from './Combobox'

/**
 * Pick a person by typing part of their name, employee number or job title. Searches on the
 * server (hr.searchPeople, at most 20 rows) so it stays fast with hundreds of employees.
 * The value is the person's userId.
 */
export function PersonPicker({
  value,
  onChange,
  exclude = [],
  emptyLabel,
  placeholder = 'Type a name…',
  invalid,
}: {
  value: string
  onChange: (userId: string) => void
  /** userIds not to offer (e.g. yourself, or the employee being edited). */
  exclude?: (string | null | undefined)[]
  emptyLabel?: string
  placeholder?: string
  invalid?: boolean
}) {
  const [term, setTerm] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 200)
    return () => clearTimeout(t)
  }, [term])

  const results = useQuery({ ...wyndbase.query.hr.searchPeople({ term: debounced }), placeholderData: keepPreviousData })
  const chosen = useQuery({ ...wyndbase.query.hr.searchPeople({ userId: value }), enabled: !!value })

  const options = (results.data ?? [])
    .filter((p) => p.userId && !exclude.includes(p.userId))
    .map((p) => ({
      value: p.userId!,
      label: p.name ?? '—',
      hint: [p.jobTitle, p.office].filter(Boolean).join(' · '),
      icon: <Avatar name={p.name} picture={p.picture} size="xs" />,
    }))

  return (
    <Combobox
      value={value}
      onChange={onChange}
      options={options}
      onSearch={setTerm}
      selectedLabel={chosen.data?.[0]?.name}
      emptyLabel={emptyLabel}
      placeholder={placeholder}
      loading={results.isFetching && !results.data}
      invalid={invalid}
    />
  )
}
