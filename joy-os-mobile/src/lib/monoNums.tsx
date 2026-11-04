import { Fragment } from 'react'
import { Text } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'

// Mono for every number, including numbers inside sentences (Playbook: "mono for measure").
// <MonoNums text="…" /> goes inside a Body or Meta: each figure is set in IBM Plex Mono at the
// sentence's own size and leading; the words around it keep the sans of the member's language.
// A digit that is part of a name (PHQ-4, LE8, P0) stays as written; a day ("Day-90") is a figure, and
// so is a version ("v1.0", "v2"): Playbook p40 lists method versions among the Mono numbers.

const NUM = /v\d+(?:\.\d+)*|[−+]?\d+(?:[.,:]\d+)*%?/g
const LETTER = /[A-Za-z_]/
const CAP = /[A-Z]/

/** The text split into runs, `n` true for a figure. */
export function splitNums(s: string): { t: string; n: boolean }[] {
  const out: { t: string; n: boolean }[] = []
  let last = 0
  for (const m of s.matchAll(NUM)) {
    const i = m.index ?? 0
    const prev = s[i - 1] ?? ''
    // "PHQ-4", "LE8": a digit joined to a word is part of its name. After a hyphen only a
    // capital code (PHQ-, GAD-) names an instrument; "Day-90" and "Day-40" are figures.
    if (LETTER.test(prev) || (prev === '-' && CAP.test(s[i - 2] ?? ''))) continue
    if (i > last) out.push({ t: s.slice(last, i), n: false })
    out.push({ t: m[0], n: true })
    last = i + m[0].length
  }
  if (last < s.length) out.push({ t: s.slice(last), n: false })
  return out
}

export function MonoNums({ text }: { text: string }) {
  const { fonts } = useTheme()
  return (
    <>
      {splitNums(text).map((r, i) =>
        r.n ? (
          <Text key={i} style={{ fontFamily: fonts.mono, fontVariant: ['tabular-nums'] }}>
            {r.t}
          </Text>
        ) : (
          <Fragment key={i}>{r.t}</Fragment>
        ),
      )}
    </>
  )
}
