import { useMemo } from 'react'
import { ACTION_LIBRARY, INDEX_HISTORY, MEMBER, TODAY_ACTION } from '@/data/member'
import { METHODS, bandFor } from '@/domain/indexEngine'
import type { Action, IndexScore, TermKey, TermScore } from '@/domain/types'
import { useSpaceText } from '@/routes/member/spaces/_i18n'
import { DAY90_DATES } from './_data'
import { ACTION_TEXT, useCore } from './_i18n'
import { addDays, useRemeasure, type ClinicalRemeasure } from './_store'

// My Index follows the member's own measurement. Once the Day-90 Clinical-grade re-measure
// is signed in the clinical portal (joyos:core:clinical-remeasure, status 'signed') and
// every term is measured, it becomes the newest row of the history and the headline; until
// then the history is the specimen record. A record awaiting sign-off (or with a term not
// yet measured) is never shown as the member's Index.

export const OWN_DAY90_ID = 'ix_own_day90'

/** The signed re-measure as an IndexScore, or null while it is not signed or not complete. */
export function ownIndexScore(rec: ClinicalRemeasure | null): IndexScore | null {
  if (!rec || rec.status !== 'signed' || rec.value == null || !Array.isArray(rec.terms) || rec.terms.length !== 6) return null
  if (rec.terms.some((t) => t.value == null)) return null
  const day0 = INDEX_HISTORY[0]
  const terms: TermScore[] = rec.terms.map((t) => {
    const prev = day0.terms.find((p) => p.key === t.key)?.value
    return { key: t.key, value: t.value, band: bandFor(t.value!, t.key === 'B'), delta: prev == null ? undefined : t.value! - prev }
  })
  return {
    id: OWN_DAY90_ID,
    memberId: rec.memberId || MEMBER.id,
    grade: 'clinical',
    method: rec.method,
    engineBuild: rec.engine,
    takenOn: rec.takenOn ?? DAY90_DATES.day90,
    nextMeasure: addDays(DAY90_DATES.day90, 90),
    terms,
    gm: rec.gm ?? 0,
    lambda: METHODS[rec.method]?.lambda ?? 0.25,
    value: rec.value,
    band: bandFor(rec.value),
    lowestTerm: rec.lowestTerm ?? day0.lowestTerm,
    signedBy: rec.signedBy,
  }
}

/** The history as My Index shows it: the member's own signed re-measure first, when there is one. */
export function useIndexHistory() {
  const [rec] = useRemeasure()
  return useMemo(() => {
    const own = ownIndexScore(rec)
    const history = own ? [own, ...INDEX_HISTORY] : INDEX_HISTORY
    return { history, latest: history[0], previous: history[1], own: !!own, signedAt: own ? rec?.signedAt ?? null : null, surveyOnly: own ? !!rec?.surveyOnly : false }
  }, [rec])
}

// ─── Today's action follows the latest Index ────────────────────────────────
// The next-best action is the library's one action for the lowest term of the Index the member
// sees now (useIndexHistory().latest): the specimen's verandah tea while Daily Pleasure is
// lowest, and the same one next step My Index names (ns<term>) once a signed re-measure moves
// the lowest term. Today, My Index's "Start" and VIVA's "Why today's action" all read this.

/** The engine's one action for a lowest term. */
export function todayActionFor(term: TermKey): Action {
  if (term === TODAY_ACTION.term) return TODAY_ACTION
  return ACTION_LIBRARY.find((a) => a.term === term) ?? TODAY_ACTION
}

/** An action's words in the member's language: the core's own text, else the spaces' dictionary. */
export function useActionText() {
  const { pick } = useCore()
  const { d } = useSpaceText()
  return (a: Action, field: 'title' | 'detail' | 'why' | 'evidence') => {
    const own = ACTION_TEXT[a.id]
    return own ? pick(own[field], a[field]) : d(a[field])
  }
}
