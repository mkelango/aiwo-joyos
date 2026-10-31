import type { Band, MethodVersion, TermKey, TermScore } from './types'

// Index method registry. Weights and λ are configuration, not code (Memo p.10).
export const METHODS: Record<MethodVersion, { lambda: number; label: string; published: string; status: string }> = {
  'v1.0': { lambda: 0.25, label: 'Method v1.0', published: '2026-10-22', status: 'In use' },
  'v1.1': { lambda: 0.22, label: 'Method v1.1 (calibration)', published: '2027-06-30', status: 'Planned · J3' },
  'v2.0': { lambda: 0.2, label: 'Index v2 (adaptive, <₹100)', published: 'FY29', status: 'Planned · J4' },
}

export const FIVE: TermKey[] = ['H', 'P', 'R', 'F', 'D']

/** Geometric mean of the five positive terms — rewards balance (HDI 2010 method). */
export function geometricMean(values: number[]): number {
  const logs = values.map((v) => Math.log(Math.max(1, v)))
  return Math.exp(logs.reduce((a, b) => a + b, 0) / values.length)
}

/** JI = GM(H, P, R, F, D) − λ·B, bounded 0–100. Returns null if any term is not yet measured. */
export function joyspanIndex(terms: TermScore[], method: MethodVersion = 'v1.0') {
  const get = (k: TermKey) => terms.find((t) => t.key === k)?.value ?? null
  const five = FIVE.map(get)
  const b = get('B')
  if (five.some((v) => v === null) || b === null) return null
  const gm = geometricMean(five as number[])
  const lambda = METHODS[method].lambda
  const value = Math.max(0, Math.min(100, gm - lambda * b))
  return { gm: round1(gm), burden: round1(lambda * b), lambda, value: Math.round(value) }
}

export function lowestTerm(terms: TermScore[]): TermKey {
  // Burden is inverted (higher is worse) so compare 100−B against the other terms.
  let lowest: TermKey = 'H'
  let min = Infinity
  for (const t of terms) {
    if (t.value === null) continue
    const effective = t.key === 'B' ? 100 - t.value : t.value
    if (effective < min) {
      min = effective
      lowest = t.key
    }
  }
  return lowest
}

export function bandFor(value: number | null, inverse = false): Band {
  if (value === null) return 'not-yet-measured'
  const v = inverse ? 100 - value : value
  if (v >= 70) return 'steady'
  if (v >= 50) return 'uneven'
  return 'thin'
}

/** JALY — research metric only, never a marketing claim (Memo p.11). */
export function jaly(remainingLifeExpectancy: number, ji: number) {
  return round1((remainingLifeExpectancy * ji) / 100)
}

const round1 = (n: number) => Math.round(n * 10) / 10
