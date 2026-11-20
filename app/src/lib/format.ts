const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

export const fmtDate = (d: string | null | undefined) => (d ? dateFmt.format(new Date(`${d.slice(0, 10)}T00:00:00`)) : '—')

export const fmtHours = (h: string | number | null | undefined) => {
  const n = Number(h ?? 0)
  return `${Number.isInteger(n) ? n : n.toFixed(1)} h`
}

export const hoursToDays = (h: string | number | null | undefined, perDay = 8) => {
  const d = Number(h ?? 0) / perDay
  return `${Number.isInteger(d) ? d : d.toFixed(1)} d`
}

export const text = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v))

export const label = (v: string | null | undefined) =>
  v ? v.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '—'

export const todayIso = () => new Date().toISOString().slice(0, 10)

export const errorMessage = (e: unknown) => {
  if (!e) return ''
  const anyE = e as { description?: string; message?: string; response?: { data?: { error?: { message?: string }; message?: string } } }
  return anyE.response?.data?.error?.message ?? anyE.response?.data?.message ?? anyE.description ?? anyE.message ?? String(e)
}
