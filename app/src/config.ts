export const url = 'wyndbase://wynpeople-web@dev.wyndbase.dev/wynpeople'
export const loginPath = '/login'

/** The login page, carrying the current path so sign-in can return to it. */
export const loginUrl = () =>
  `${loginPath}?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`
