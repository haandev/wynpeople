/** wynPeople brand: a figure with raised arms (two leaves and a head), in the flat two-tone wyn style. */
function Logomark({ size }: { size: number }) {
  // The mark's own paths sit in x 21.5–39.6, y 1.2–21.8 of the 40×40 artboard; the viewBox frames them.
  return (
    <svg viewBox="19.5 0 22 23" width={size} height={size} role="img" aria-label="wynPeople logomark">
      <path d="M28.6 21.8C23.4 18.8 21.2 12.6 21.8 6.4C26.8 9.4 29.2 15 28.6 21.8Z" fill="#6B3FC9" />
      <path d="M28.6 21.8C28.8 14.6 33 7.6 39.4 4.6C39.8 11.4 35.6 18.2 28.6 21.8Z" fill="#9F7AEA" />
      <circle cx="29.8" cy="4.4" fill="#6B3FC9" r="3.2" />
    </svg>
  )
}

export function PeopleBrand({ size = 26, variant = 'logo' }: { size?: number; variant?: 'logo' | 'logomark' | 'logoword' }) {
  const word = (
    <span className="font-semibold tracking-tight text-stone-900" style={{ fontSize: size * 0.62 }}>
      <span className="text-[#6B3FC9]">wyn</span>People
    </span>
  )
  if (variant === 'logomark') return <Logomark size={size} />
  if (variant === 'logoword') return word
  return (
    <span className="inline-flex items-center gap-2" aria-label="wynPeople">
      <Logomark size={size} />
      {word}
    </span>
  )
}
