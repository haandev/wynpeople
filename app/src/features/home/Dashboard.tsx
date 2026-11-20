import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import ReactGridLayout, { useContainerWidth, verticalCompactor, type Layout } from 'react-grid-layout'
import { askConfirm } from '../../components/ui/confirm'
import { Button, ErrorNote, Modal } from '../../components/ui/ui'
import { errorMessage } from '../../lib/format'
import { useMe } from '../../lib/useMe'
import { wyndbase } from '../../wyndbase'
import { allowedFor, defaultLayout, pack, ROW_HEIGHT, widgetById, type Placed } from './widgets/catalog'

const MARGIN = 16
const NARROW = 768 // below this the widgets stack in one column, in their grid order

interface Saved {
  v: 1
  items: Placed[]
}

/**
 * The home page as a grid of widgets each person arranges for themselves: "Customize" lets them
 * drag widgets by their title, resize them from the corner, remove them and add others. The
 * arrangement is saved to their own row (home.saveMyLayout) and follows them to any device.
 */
export function Dashboard({ customizing, onDone }: { customizing: boolean; onDone: () => void }) {
  const { me } = useMe()
  const roles = useMemo(() => me?.roles ?? [], [me?.roles])
  const saved = useQuery(wyndbase.query.home.myLayout())
  const { width, containerRef, mounted } = useContainerWidth()
  const [items, setItems] = useState<Placed[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const allowed = useMemo(() => new Set(allowedFor(roles).map((w) => w.id)), [roles])

  // First load: the saved arrangement (minus widgets this person may no longer use), or the default for their role.
  useEffect(() => {
    if (items || !saved.data || !me) return
    const stored = (saved.data[0]?.layout as Saved | undefined)?.items
    setItems(stored?.length ? stored.filter((p) => allowed.has(p.i) && widgetById.has(p.i)) : defaultLayout(roles))
  }, [saved.data, me, items, allowed, roles])

  // Save a moment after the last change, so a drag or a resize is one write.
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const persist = (next: Placed[]) => {
    setItems(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      wyndbase.mutation.home
        .saveMyLayout({ layout: { v: 1, items: next } satisfies Saved })
        .then(() => setError(null))
        .catch((e) => setError(errorMessage(e)))
    }, 600)
  }

  if (!items) return <div ref={containerRef} className="h-64 animate-pulse rounded-xl bg-stone-100" />

  const narrow = mounted && width < NARROW
  const missing = [...allowed].filter((id) => !items.some((p) => p.i === id))
  const remove = (id: string) => persist(items.filter((p) => p.i !== id))
  const add = (id: string) => {
    const bottom = items.reduce((m, p) => Math.max(m, p.y + p.h), 0)
    persist([...items, ...pack([id], bottom)])
  }

  const card = (p: Placed) => {
    const def = widgetById.get(p.i)!
    const Body = def.component
    return (
      <section className={`flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-card ${customizing ? 'border-brand-300 ring-2 ring-brand-100' : 'border-stone-200/80'}`}>
        <header className={`widget-handle flex items-center gap-2 border-b border-stone-100 px-4 py-3 ${customizing && !narrow ? 'cursor-grab active:cursor-grabbing' : ''}`}>
          {customizing && !narrow && (
            <span className="text-stone-400" aria-hidden>
              ⠿
            </span>
          )}
          <span aria-hidden>{def.icon}</span>
          <h2 className="truncate text-[15px] font-semibold text-stone-900">{def.title}</h2>
          {customizing && (
            <button type="button" onClick={() => remove(p.i)} className="widget-nodrag ml-auto grid h-7 w-7 place-items-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${def.title}`}>
              ✕
            </button>
          )}
        </header>
        <div className={`min-h-0 flex-1 overflow-auto p-4 ${customizing ? 'pointer-events-none select-none' : ''}`}>
          <Body />
        </div>
      </section>
    )
  }

  const ordered = [...items].sort((a, b) => a.y - b.y || a.x - b.x)

  return (
    <div className="space-y-3">
      {customizing && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
          <span className="mr-auto">{narrow ? 'Remove or add widgets. Rearranging needs a wider screen.' : 'Drag a widget by its title, resize it from its corner, or remove it.'}</span>
          <Button variant="secondary" onClick={() => setAdding(true)} disabled={!missing.length}>
            + Add widget
          </Button>
          <Button
            variant="ghost"
            onClick={async () => (await askConfirm('Put every widget back where it started?', { confirmLabel: 'Reset' })) && persist(defaultLayout(roles))}
          >
            Reset
          </Button>
          <Button onClick={onDone}>Done</Button>
        </div>
      )}
      <ErrorNote error={error} />
      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">
          Your home is empty.{' '}
          <button type="button" className="font-medium text-brand-700 hover:underline" onClick={() => setAdding(true)}>
            Add a widget
          </button>
        </div>
      )}
      <div ref={containerRef}>
        {mounted &&
          (narrow ? (
            <div className="space-y-4">
              {ordered.map((p) => (
                <div key={p.i} style={{ height: p.h * ROW_HEIGHT + (p.h - 1) * MARGIN }}>
                  {card(p)}
                </div>
              ))}
            </div>
          ) : (
            <ReactGridLayout
              width={width}
              layout={items.map((p) => ({ ...p, minW: widgetById.get(p.i)?.minW, minH: widgetById.get(p.i)?.minH }))}
              gridConfig={{ cols: 12, rowHeight: ROW_HEIGHT, margin: [MARGIN, MARGIN], containerPadding: [0, 0] }}
              dragConfig={{ enabled: customizing, handle: '.widget-handle', cancel: '.widget-nodrag' }}
              resizeConfig={{ enabled: customizing, handles: ['se'] }}
              compactor={verticalCompactor}
              onLayoutChange={(layout: Layout) => {
                if (!customizing) return
                const next = layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))
                const same = next.length === items.length && next.every((n) => items.some((p) => p.i === n.i && p.x === n.x && p.y === n.y && p.w === n.w && p.h === n.h))
                if (!same) persist(next)
              }}
            >
              {items.map((p) => (
                <div key={p.i}>{card(p)}</div>
              ))}
            </ReactGridLayout>
          ))}
      </div>
      {adding && (
        <Modal title="Add a widget" onClose={() => setAdding(false)}>
          {missing.length === 0 ? (
            <p className="text-sm text-stone-500">Every widget is already on your home.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {missing.map((id) => {
                const d = widgetById.get(id)!
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => {
                        add(id)
                        setAdding(false)
                      }}
                      className="flex h-full w-full items-start gap-3 rounded-xl border border-stone-200 p-3 text-left hover:border-brand-300 hover:bg-brand-50"
                    >
                      <span className="text-xl" aria-hidden>
                        {d.icon}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-stone-900">{d.title}</span>
                        <span className="block text-xs text-stone-500">{d.description}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Modal>
      )}
    </div>
  )
}
