// Chart colour, the brand way (Playbook p39, p62): the Joyspan Spectrum draws the six terms
// only, always with the term's name (data/terms termColor). Everything else a chart plots —
// a biomarker (HRV, resting heart rate, LDL), a sleep stage, a signal, Life's Essential 8 —
// is drawn in the neutrals: Ink leads, Slate and Bronze follow, Mist fills a band or a ghost.
// Daybreak never draws a series. Every value follows the theme (styles/tokens.css --viz-*).

export const VIZ = {
  /** The lead non-term series. */
  ink: 'var(--viz-ink)',
  /** The second series. */
  slate: 'var(--viz-slate)',
  /** The third series. */
  bronze: 'var(--viz-bronze)',
  /** A fill, range band or ghost line — never a thin line on Paper. */
  mist: 'var(--viz-mist)',
  /** A pale Mist ground for a reference range or a target band. */
  mistSoft: 'var(--viz-mist-soft)',
} as const

/** The neutral series in order, for charts with several non-term lines. */
export const VIZ_SERIES = [VIZ.ink, VIZ.slate, VIZ.bronze] as const

/** The colour of the nth non-term series (wraps after three). */
export function vizSeries(n: number): string {
  return VIZ_SERIES[((n % VIZ_SERIES.length) + VIZ_SERIES.length) % VIZ_SERIES.length]
}
