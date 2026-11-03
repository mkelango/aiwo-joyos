import clsx from 'clsx'
import type { SVGProps } from 'react'

// The AIWO wordmark, reproduced from the vector master in the Brand Identity Playbook
// (p20: "Kept exactly. Geometry, weight, tracking and the oblique O are reproduced from the
// vector artwork"; "Never re-typeset"). These outlines are the Playbook's own artwork, lifted
// from the PDF and moved to a 0,0 origin; nothing here is set in a font. Cap height X runs from
// y 2.61 to 105.03; the oblique O overshoots it slightly, as drawn.

export const WORDMARK_VIEWBOX = { w: 538.52, h: 107.64 }

/** One path per part, so the animated mark can move them separately (Playbook p53). */
export const WORDMARK_PARTS = {
  /** A — geometric, open; the counter is cut by the second subpath. */
  a: 'M47.08 2.61L59 2.61L104.43 105.03L89.62 105.03L78.75 79.84L25.35 79.84L14.33 105.03L0 105.03ZM52.8 18.2L52.52 18.2L30.34 68.56L73.96 68.56Z',
  /** The Stroke — one slanted line in place of the I, 18° from vertical. */
  stroke: 'M140.16 2.61L154.02 2.61L187.31 105.03L173.46 105.03Z',
  /** W — four strokes, pointed vertices. */
  w: 'M227.53 2.61L241.41 2.61L272.17 90.96L272.52 89.3L301.87 2.61L317.72 2.61L346.89 90.96L347.24 89.3L378.47 2.61L391.52 2.61L354.64 105.03L339.3 105.03L309.78 18.2L309.43 18.2L279.76 105.03L264.26 105.03Z',
  /** The leaning O — drawn on a forward slant. */
  o: 'M470.5 107.64C462.37 107.64 455.16 106.27 448.9 103.57C442.64 100.87 437.5 97.15 433.46 92.36C429.43 87.59 426.66 81.9 425.23 75.29C423.77 68.69 423.8 61.54 425.29 53.82C426.85 46.1 429.65 38.92 433.71 32.31C437.78 25.7 442.77 20.02 448.71 15.25C454.62 10.48 461.26 6.73 468.57 4.04C475.9 1.34 483.62 0 491.79 0C499.92 0 507.13 1.34 513.39 4.04C519.65 6.73 524.8 10.48 528.83 15.25C532.87 20.02 535.63 25.7 537.09 32.31C538.52 38.92 538.49 46.1 537 53.82C535.44 61.54 532.64 68.69 528.58 75.29C524.51 81.9 519.52 87.59 513.58 92.36C507.67 97.15 501.03 100.87 493.73 103.57C486.39 106.27 478.67 107.64 470.5 107.64ZM469.52 95.63C475.75 96.07 481.75 95.37 487.5 93.56C493.28 91.75 498.55 89.08 503.32 85.52C508.09 82 512.21 77.77 515.68 72.85C519.14 67.93 521.68 62.55 523.27 56.77C524.89 50.99 525.37 45.46 524.73 40.25C524.1 35.04 522.45 30.41 519.78 26.34C517.11 22.3 513.52 19 508.95 16.46C504.4 13.92 499 12.42 492.77 11.98C486.55 11.54 480.54 12.23 474.79 14.04C469.01 15.86 463.73 18.55 458.97 22.08C454.2 25.61 450.07 29.83 446.61 34.76C443.15 39.71 440.61 45.05 439.02 50.83C437.4 56.61 436.92 62.14 437.56 67.35C438.2 72.56 439.84 77.2 442.52 81.27C445.18 85.33 448.77 88.61 453.35 91.15C457.89 93.72 463.29 95.18 469.52 95.63Z',
} as const

/** Minimum on screen is 72 px wide (Playbook p22). */
export const WORDMARK_MIN_WIDTH = 72

/**
 * The wordmark as vector artwork, in currentColor (Ink by default; pass a text colour class to
 * change it, e.g. Stone on an Ink ground). `height` is the drawn height in px.
 */
export function Wordmark({ height = 16, className, title = 'AIWO', ...rest }: { height?: number; className?: string; title?: string } & Omit<SVGProps<SVGSVGElement>, 'height' | 'width'>) {
  const { w, h } = WORDMARK_VIEWBOX
  const width = Math.max(WORDMARK_MIN_WIDTH, (height * w) / h)
  const drawnH = (width * h) / w
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={width}
      height={drawnH}
      role="img"
      aria-label={title}
      className={clsx('inline-block shrink-0 overflow-visible align-middle text-ink', className)}
      {...rest}
    >
      <path d={`${WORDMARK_PARTS.a}${WORDMARK_PARTS.stroke}${WORDMARK_PARTS.w}${WORDMARK_PARTS.o}`} fill="currentColor" />
    </svg>
  )
}
