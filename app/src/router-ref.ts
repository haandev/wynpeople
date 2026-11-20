import type { AnyRouter } from '@tanstack/react-router'

let current: AnyRouter | undefined
export const setRouter = (r: AnyRouter) => {
  current = r
}
/** A thunk for the login route: route modules evaluate before the router exists. */
export const getRouter = () => {
  if (!current) throw new Error('router not ready')
  return current
}
