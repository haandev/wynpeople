export type Meta = [string, string][]
export interface Column {
  key: string
  title: string
}
export type Row = Record<string, unknown>

export function exportMeta({ generatedBy, generatedAt, filters }: { generatedBy: string; generatedAt: Date; filters: Record<string, unknown> }): Meta {
  return [
    ['generated_by', generatedBy],
    ['generated_at', generatedAt.toISOString()],
    ...Object.entries(filters).map(([k, v]): [string, string] => [`filter.${k}`, v === null || v === undefined ? '' : String(v)]),
  ]
}

/** A cell as text; objects (nested balances) become JSON. */
export const cellText = (v: unknown) => (v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v))
