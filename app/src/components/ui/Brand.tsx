/**
 * wynPeople brand — standalone. No imports beyond React; drop it into any React project.
 *
 * Artboard (user units; `size` maps to height):
 * - viewBox height: 40
 * - logomark: 40 × 40 — the shared wyn mountain (currentColor) plus the violet figure
 * - word: Arial Bold at fontSize 30, centered on y 20; x is 50 beside the mark, 0 alone
 *
 * The mountain and the word use `currentColor`, so set `color` on a parent
 * (dark text on light backgrounds, light text on dark ones). The figure keeps its violet.
 */

export type WynPeopleBrandProps = {
  /** CSS height in px; scales the 40-unit artboard. @defaultValue 26 */
  size?: number
  /** Which parts mount. @defaultValue 'logo' */
  variant?: 'logo' | 'logomark' | 'logoword'
}

const VARIANTS = {
  logo: { title: 'wynPeople', viewBox: '0 0 206.72 40' },
  logomark: { title: 'wynPeople logomark', viewBox: '0 0 40 40' },
  logoword: { title: 'wynPeople logoword', viewBox: '0 0 156.72 40' },
} as const

export function WynPeopleBrand({ size = 26, variant = 'logo' }: WynPeopleBrandProps) {
  const { title, viewBox } = VARIANTS[variant]

  return (
    <svg fill="none" height={size} viewBox={viewBox} xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      {variant !== 'logoword' ? (
        <g>
          {/* Figure with raised arms: two leaves and a head */}
          <path d="M28.6 21.8C23.4 18.8 21.2 12.6 21.8 6.4C26.8 9.4 29.2 15 28.6 21.8Z" fill="#6B3FC9" />
          <path d="M28.6 21.8C28.8 14.6 33 7.6 39.4 4.6C39.8 11.4 35.6 18.2 28.6 21.8Z" fill="#9F7AEA" />
          <circle cx="29.8" cy="4.4" fill="#6B3FC9" r="3.2" />
          {/* Shared wyn mountain */}
          <path
            d="M20.441 11.258L21.582 30.195L13.074 39.689L2.698 39.741C1.038 39.741 0 37.977 0.83 36.576L16.446 10.272C17.484 8.508 20.337 9.131 20.441 11.258Z"
            fill="currentColor"
          />
          <path
            d="M21.582 30.195L27.912 23.035C28.742 22.101 30.246 22.205 30.921 23.243L39.118 36.42C40 37.821 38.962 39.637 37.25 39.637H21.946L21.582 30.195Z"
            fill="currentColor"
          />
        </g>
      ) : null}
      {variant !== 'logomark' ? (
        <text dominantBaseline="central" fill="currentColor" fontFamily="Arial" fontSize="30" fontWeight="bold" x={variant === 'logo' ? 50 : 0} y="20">
          wynPeople
        </text>
      ) : null}
    </svg>
  )
}

export default WynPeopleBrand
