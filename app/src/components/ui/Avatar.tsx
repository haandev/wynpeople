const PALETTE = [
  'from-emerald-400 to-emerald-600',
  'from-sky-400 to-sky-600',
  'from-violet-400 to-violet-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-teal-400 to-teal-600',
  'from-indigo-400 to-indigo-600',
  'from-lime-500 to-green-600',
]

export const initials = (name: string | null | undefined) =>
  (name ?? '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toLocaleUpperCase('tr')).join('')

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

const SIZES = { xs: 'h-7 w-7 text-[10px]', sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-16 w-16 text-lg', xl: 'h-24 w-24 text-3xl' }

/** Initials on a colour picked from the name, or the photo when there is one. */
export function Avatar({ name, src, size = 'sm', ring = false }: { name: string | null | undefined; src?: string | null; size?: keyof typeof SIZES; ring?: boolean }) {
  const cls = `${SIZES[size]} shrink-0 rounded-full ${ring ? 'ring-4 ring-white' : ''}`
  if (src) return <img src={src} alt="" className={`${cls} object-cover`} />
  return (
    <span className={`${cls} grid place-items-center bg-gradient-to-br font-semibold text-white ${PALETTE[hash(name ?? '') % PALETTE.length]}`} aria-hidden>
      {initials(name)}
    </span>
  )
}
