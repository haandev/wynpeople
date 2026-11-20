import { type RefObject, useEffect } from 'react'

/** Calls `onOutside` on a click outside `ref` or on Escape while `active`. */
export function useClickOutside(ref: RefObject<HTMLElement | null>, active: boolean, onOutside: () => void) {
  useEffect(() => {
    if (!active) return
    const down = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onOutside()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onOutside()
    document.addEventListener('mousedown', down)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', down)
      document.removeEventListener('keydown', key)
    }
  }, [ref, active, onOutside])
}
