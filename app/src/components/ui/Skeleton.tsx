/** Loading placeholders shaped like the content they stand in for. */
export const Bone = ({ className = '' }: { className?: string }) => <div className={`skeleton ${className}`} />

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <Bone key={i} className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="mb-2 flex gap-4 border-b border-stone-100 pb-3">
        {Array.from({ length: cols }, (_, i) => (
          <Bone key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-stone-50 py-3">
          <Bone className="h-7 w-7 rounded-full" />
          {Array.from({ length: cols - 1 }, (_, c) => (
            <Bone key={c} className={`h-3 flex-1 ${c % 2 ? 'max-w-24' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Bone className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Bone className="h-3 w-1/2" />
            <Bone className="h-2.5 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonStatCards({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border border-stone-200/80 bg-white p-5 shadow-card">
          <Bone className="h-2.5 w-20" />
          <Bone className="mt-3 h-7 w-24" />
          <Bone className="mt-2 h-2.5 w-32" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard({ lines = 4, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`rounded-xl border border-stone-200/80 bg-white p-5 shadow-card ${className}`} aria-busy="true" aria-label="Loading">
      <Bone className="mb-5 h-4 w-40" />
      <SkeletonText lines={lines} />
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading">
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-card">
        <Bone className="h-24 rounded-none" />
        <div className="flex items-end gap-4 px-6 pb-5">
          <Bone className="-mt-10 h-24 w-24 rounded-full ring-4 ring-white" />
          <div className="flex-1 space-y-2 pb-1">
            <Bone className="h-5 w-48" />
            <Bone className="h-3 w-32" />
          </div>
        </div>
      </div>
      <div className="flex gap-4 border-b border-stone-200 pb-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Bone key={i} className="h-3 w-16" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <SkeletonCard lines={6} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  )
}

export function SkeletonTree() {
  return (
    <div className="flex flex-col items-center gap-6 py-4" aria-busy="true" aria-label="Loading">
      <Bone className="h-24 w-44 rounded-lg" />
      <div className="flex gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Bone key={i} className="h-24 w-40 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

/** Whole-app placeholder while the signed-in person loads. */
export function SkeletonShell() {
  return (
    <div className="min-h-screen" aria-busy="true" aria-label="Loading">
      <div className="h-16 border-b border-stone-200 bg-white" />
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-8">
        <Bone className="h-7 w-56" />
        <SkeletonStatCards />
        <div className="grid gap-5 lg:grid-cols-3">
          <SkeletonCard lines={5} className="lg:col-span-2" />
          <SkeletonCard lines={5} />
        </div>
      </div>
    </div>
  )
}
