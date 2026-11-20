import { categoryStyle } from './cells'

export function Legend() {
  const item = (cls: string, text: string) => (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-3 w-3 rounded-sm ${cls}`} />
      {text}
    </span>
  )
  return (
    <div className="flex flex-wrap gap-3 text-xs text-stone-600">
      {item(categoryStyle('vacation'), 'Vacation')}
      {item(categoryStyle('sick'), 'Sick')}
      {item(categoryStyle('personal'), 'Personal')}
      {item(categoryStyle('custom'), 'Other leave')}
      {item(categoryStyle('out'), 'On leave')}
      {item('bg-amber-300', 'Public holiday')}
      {item('bg-stone-200', 'Weekend')}
      {item('bg-gradient-to-r from-sky-500 from-50% to-white to-50% border border-sky-500', 'Partial day')}
    </div>
  )
}
