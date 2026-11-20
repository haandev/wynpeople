import { useSyncExternalStore } from 'react'
import { Button, Modal } from './ui'

/**
 * The app's own confirmation dialog. `window.confirm` is not used: embedded browsers (and some
 * webviews) answer it with `false` at once without showing anything, so the action silently does nothing.
 *   if (await askConfirm('Delete 12 pay periods?', { confirmLabel: 'Delete', danger: true })) …
 */
interface Ask {
  message: string
  confirmLabel: string
  danger: boolean
  resolve: (ok: boolean) => void
}

let current: Ask | null = null
const listeners = new Set<() => void>()
const set = (a: Ask | null) => {
  current = a
  listeners.forEach((l) => l())
}

export function askConfirm(message: string, opts: { confirmLabel?: string; danger?: boolean } = {}): Promise<boolean> {
  current?.resolve(false) // a newer question replaces an unanswered one
  return new Promise((resolve) => set({ message, confirmLabel: opts.confirmLabel ?? 'Confirm', danger: opts.danger ?? false, resolve }))
}

/** Mounted once at the root; renders the open question, if any. */
export function ConfirmHost() {
  const ask = useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
  if (!ask) return null
  const answer = (ok: boolean) => {
    set(null)
    ask.resolve(ok)
  }
  return (
    <Modal
      title="Are you sure?"
      onClose={() => answer(false)}
      footer={
        <>
          <Button variant="secondary" onClick={() => answer(false)}>
            Cancel
          </Button>
          <Button variant={ask.danger ? 'danger' : 'primary'} autoFocus onClick={() => answer(true)}>
            {ask.confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-stone-700">{ask.message}</p>
    </Modal>
  )
}
