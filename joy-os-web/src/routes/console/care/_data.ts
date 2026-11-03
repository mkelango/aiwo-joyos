import type { Band, MethodVersion, TermKey, TermScore } from '@/domain/types'
import { bandFor } from '@/domain/indexEngine'
import { CASELOAD } from '@/data/platform'
import { INDEX_HISTORY, TODAY_ACTION } from '@/data/member'

// SPECIMEN DATA for the care consoles (coach, clinical, partner).
// Shaped like the future API; never a real member. Values that already exist in
// src/data are imported, not repeated.

/** The specimen "now" for every console clock. SLA countdowns tick from here. */
export const CONSOLE_NOW = '2027-01-28T21:10:00+05:30'

export const PRIYA = { name: 'Priya Natarajan', role: 'Coach · Circle lead', initials: 'PN', tone: 'var(--term-r)' }
export const MEERA = { name: 'Dr Meera Iyer', role: 'Physician · Medical Director', initials: 'MI', tone: 'var(--term-h)' }

// ─── Coach console ─────────────────────────────────────────────────────────

export interface CaseRow { id: string; name: string; day: number; index: number; lowest: TermKey; trend: number; cation: string; nextCall: string; risk: string }

/** Rest of Priya's caseload beyond the platform specimen (same shape as CASELOAD). */
export const EXTRA_CASELOAD: CaseRow[] = [
  { id: 'm_0221', name: 'Ananya Krishnan', day: 14, index: 63, lowest: 'P', trend: 2, cation: 'Mindcation', nextCall: 'Day 15 review · Fri', risk: 'low' },
  { id: 'm_0234', name: 'Rahul Menon', day: 44, index: 57, lowest: 'F', trend: -1, cation: 'Wealthcation', nextCall: 'Day 45 review · Fri', risk: 'medium' },
  { id: 'm_0256', name: 'Meenakshi Sundaram', day: 59, index: 69, lowest: 'D', trend: 3, cation: 'Beautycation', nextCall: 'Day 60 talk · Fri', risk: 'low' },
  { id: 'm_0262', name: 'Sameer Joshi', day: 6, index: 52, lowest: 'R', trend: 0, cation: 'Lovecation', nextCall: 'Thu 18:30', risk: 'low' },
  { id: 'm_0287', name: 'Leela Thomas', day: 79, index: 66, lowest: 'B', trend: 2, cation: 'Sleepcation', nextCall: 'Re-measure due', risk: 'low' },
  { id: 'm_0291', name: 'Karthik Raman', day: 27, index: 60, lowest: 'H', trend: 1, cation: 'Healthcation', nextCall: 'Tue 08:00', risk: 'low' },
]

export const COACH_CASELOAD: CaseRow[] = [...CASELOAD, ...EXTRA_CASELOAD]

export const CIRCLES_LED = [
  { id: 'c1', name: 'Circle of eight · Fairmont January', when: 'Mon 1 Feb · 19:00', week: 4, of: 8, members: 8, theme: 'Week 4 · Don’t Postpone Joy', term: 'D' as TermKey, room: 'In-app video · recordings off' },
  { id: 'c2', name: 'Founders after exit', when: 'Thu 28 Jan · 21:30', week: 6, of: 8, members: 7, theme: 'Week 6 · The Two Questions', term: 'B' as TermKey, room: 'In-app video · recordings off' },
  { id: 'c3', name: 'Circle of eight · January starters', when: 'Wed 3 Feb · 07:00', week: 2, of: 8, members: 8, theme: 'Week 2 · The Tomorrow Question', term: 'P' as TermKey, room: 'In-app video · recordings off' },
]

/** Day-N milestones (Memo p.13): reviews at 15 and 45, the talk at 60, re-measure opens at 76. */
export const DAY_N = [
  { day: 15, name: 'Day 15 review', what: 'First review. Is the action landing?', window: [10, 15] as [number, number] },
  { day: 45, name: 'Day 45 review', what: 'Mid-loop review. Adjust the protocol.', window: [40, 45] as [number, number] },
  { day: 60, name: 'Day 60 talk', what: 'The next step, by lowest term.', window: [55, 60] as [number, number] },
  { day: 76, name: 'Re-measure', what: 'Window open, Day 76 to 90. Like for like.', window: [76, 90] as [number, number] },
]

type ActionLog = { date: string; title: string; term: TermKey; outcome: 'done' | 'not-today' | 'open' }
export interface CoachDigest {
  id: string
  name: string
  firstName: string
  age: number
  city: string
  circle: string
  cation: string
  day: number
  method: MethodVersion
  takenOn: string
  nextMeasure: string
  /** When Care consent v3 was granted: the checkout or Day 0 of this member's loop. */
  consentGranted: string
  terms: TermScore[]
  index: number
  band: Band
  summary: string[]
  summaryPaused?: string
  actions: ActionLog[]
  ledgerWeeks: { week: string; moments: number }[]
  ledgerByPrompt: { prompt: string; count: number }[]
  calls: { at: string; outcome: string; note: string }[]
  currentAction: { id: string; title: string; term: TermKey }
  safetyHold?: string
}

const t = (vals: [number, number, number, number, number, number], deltas?: [number, number, number, number, number, number]): TermScore[] =>
  (['H', 'P', 'R', 'F', 'D', 'B'] as TermKey[]).map((key, i) => ({ key, value: vals[i], band: bandFor(vals[i], key === 'B'), delta: deltas?.[i] }))

const arjunIx = INDEX_HISTORY[0]

export const COACH_DIGESTS: Record<string, CoachDigest> = {
  m_0001: {
    id: 'm_0001', name: 'Arjun Rao', firstName: 'Arjun', age: 52, city: 'Chennai', circle: 'Circle of eight · Fairmont January', cation: 'Joycation',
    day: 23, method: arjunIx.method, takenOn: arjunIx.takenOn, nextMeasure: arjunIx.nextMeasure, consentGranted: '05 Jan 2027', terms: arjunIx.terms, index: arjunIx.value, band: arjunIx.band,
    summary: [
      'Arjun’s Index rose from 61 to 64 at the January measure. Daily Pleasure is still his lowest term, though it moved most this quarter (53 → 58).',
      'He has done the evening verandah action on 6 of the last 9 days, usually with Kavya. Both “Not today” days were Thursdays, when he travels for work.',
      'Freedom fell by 4. He named “a heavy quarter at work” on the Day 15 call. Worth asking whether the No list from Week 7 would help now rather than later.',
    ],
    actions: [
      { date: 'Thu 28 Jan', title: TODAY_ACTION.title, term: 'D', outcome: 'open' },
      { date: 'Wed 27 Jan', title: TODAY_ACTION.title, term: 'D', outcome: 'done' },
      { date: 'Tue 26 Jan', title: 'Plan one pleasure for this evening.', term: 'D', outcome: 'done' },
      { date: 'Mon 25 Jan', title: TODAY_ACTION.title, term: 'D', outcome: 'done' },
      { date: 'Sun 24 Jan', title: 'Call one person you have not spoken to this month.', term: 'R', outcome: 'done' },
      { date: 'Sat 23 Jan', title: TODAY_ACTION.title, term: 'D', outcome: 'done' },
      { date: 'Fri 22 Jan', title: 'Plan one pleasure for this evening.', term: 'D', outcome: 'done' },
      { date: 'Thu 21 Jan', title: TODAY_ACTION.title, term: 'D', outcome: 'not-today' },
      { date: 'Wed 20 Jan', title: TODAY_ACTION.title, term: 'D', outcome: 'done' },
      { date: 'Thu 14 Jan', title: 'Plan one pleasure for this evening.', term: 'D', outcome: 'not-today' },
    ],
    ledgerWeeks: [{ week: 'W1', moments: 11 }, { week: 'W2', moments: 16 }, { week: 'W3', moments: 19 }, { week: 'W4', moments: 21 }],
    ledgerByPrompt: [{ prompt: 'Midday', count: 24 }, { prompt: 'Afternoon', count: 17 }, { prompt: 'Evening', count: 26 }],
    calls: [
      { at: '20 Jan · Day 15 review', outcome: 'Reached', note: 'Action landing. Evenings with Kavya work; Thursdays do not. Keep as is.' },
      { at: '05 Jan · Checkout hand-off', outcome: 'Reached', note: 'Named outcome in his words: “to enjoy the evenings I already have.” Circle formed.' },
    ],
    currentAction: { id: TODAY_ACTION.id, title: TODAY_ACTION.title, term: TODAY_ACTION.term },
  },
  m_0002: {
    id: 'm_0002', name: 'Kavya Rao', firstName: 'Kavya', age: 55, city: 'Chennai', circle: 'Circle of eight · Fairmont January', cation: 'Joycation',
    day: 23, method: 'v1.0', takenOn: '2027-01-02', nextMeasure: '2027-04-05', consentGranted: '05 Jan 2027', terms: t([69, 78, 81, 58, 72, 14], [1, 2, 0, 1, 3, -2]), index: 68, band: 'uneven',
    summary: [
      'Kavya’s Index is 68, up 2. Freedom is her lowest term at 58; the time-audit summary shows most evenings given to her mother’s care.',
      'She has done her action on 7 of the last 9 days. She asked on the Day 15 call for an action she can do before 8 am.',
    ],
    actions: [
      { date: 'Thu 28 Jan', title: 'Write the No list.', term: 'F', outcome: 'open' },
      { date: 'Wed 27 Jan', title: 'Write the No list.', term: 'F', outcome: 'done' },
      { date: 'Tue 26 Jan', title: 'Plan one pleasure for this evening.', term: 'D', outcome: 'done' },
      { date: 'Mon 25 Jan', title: 'Write the No list.', term: 'F', outcome: 'done' },
      { date: 'Sun 24 Jan', title: 'Write the No list.', term: 'F', outcome: 'not-today' },
    ],
    ledgerWeeks: [{ week: 'W1', moments: 14 }, { week: 'W2', moments: 15 }, { week: 'W3', moments: 18 }, { week: 'W4', moments: 17 }],
    ledgerByPrompt: [{ prompt: 'Midday', count: 22 }, { prompt: 'Afternoon', count: 19 }, { prompt: 'Evening', count: 23 }],
    calls: [{ at: '20 Jan · Day 15 review', outcome: 'Reached', note: 'Wants a morning action. Offered the No list at 7 am.' }],
    currentAction: { id: 'a_f_003', title: 'Write the No list.', term: 'F' },
  },
  m_0142: {
    id: 'm_0142', name: 'Nikhil Sharma', firstName: 'Nikhil', age: 47, city: 'Pune', circle: 'Founders after exit', cation: 'Mindcation',
    day: 41, method: 'v1.0', takenOn: '2026-12-18', nextMeasure: '2027-03-18', consentGranted: '18 Dec 2026', terms: t([64, 58, 62, 66, 63, 54], [-2, -5, -3, 0, -4, 6]), index: 49, band: 'thin',
    summary: [],
    summaryPaused: 'A safety task is open and held by the clinical team. VIVA does not draft a digest while a P0 is open, and Ease results are never summarised by AI. Dr Sanjay Menon leads; your role is to stay in touch as his coach once the clinician says so.',
    safetyHold: 'Held by Dr Sanjay Menon · P0 opened 21:04',
    actions: [
      { date: 'Thu 28 Jan', title: 'Begin the wind-down at 22:00.', term: 'B', outcome: 'open' },
      { date: 'Wed 27 Jan', title: 'Answer the Tomorrow Question.', term: 'P', outcome: 'not-today' },
      { date: 'Tue 26 Jan', title: 'Answer the Tomorrow Question.', term: 'P', outcome: 'not-today' },
      { date: 'Mon 25 Jan', title: 'Answer the Tomorrow Question.', term: 'P', outcome: 'done' },
    ],
    ledgerWeeks: [{ week: 'W3', moments: 9 }, { week: 'W4', moments: 6 }, { week: 'W5', moments: 4 }, { week: 'W6', moments: 2 }],
    ledgerByPrompt: [{ prompt: 'Midday', count: 8 }, { prompt: 'Afternoon', count: 6 }, { prompt: 'Evening', count: 7 }],
    calls: [{ at: '08 Jan · Day 21 check-in', outcome: 'Reached', note: 'Quieter than usual. Agreed to keep the circle on Thursdays.' }],
    currentAction: { id: 'a_b_004', title: 'Begin the wind-down at 22:00.', term: 'B' },
  },
  m_0088: {
    id: 'm_0088', name: 'Farah Khan', firstName: 'Farah', age: 39, city: 'Mumbai', circle: 'Circle of eight · January starters', cation: 'Sleepcation',
    day: 12, method: 'v1.0', takenOn: '2027-01-16', nextMeasure: '2027-04-16', consentGranted: '16 Jan 2027', terms: t([68, 73, 70, 58, 61, 44], [0, 1, -1, -2, -1, 3]), index: 55, band: 'uneven',
    summary: [
      'Farah’s Index is 55. A screen result has been routed to the clinical team; you see that a review is open, never the answers.',
      'Her wind-down action is done on 5 of 8 nights. She prefers voice notes to calls.',
    ],
    actions: [
      { date: 'Thu 28 Jan', title: 'Begin the wind-down at 22:00.', term: 'B', outcome: 'open' },
      { date: 'Wed 27 Jan', title: 'Begin the wind-down at 22:00.', term: 'B', outcome: 'done' },
      { date: 'Tue 26 Jan', title: 'Begin the wind-down at 22:00.', term: 'B', outcome: 'not-today' },
    ],
    ledgerWeeks: [{ week: 'W1', moments: 8 }, { week: 'W2', moments: 10 }],
    ledgerByPrompt: [{ prompt: 'Midday', count: 7 }, { prompt: 'Afternoon', count: 5 }, { prompt: 'Evening', count: 6 }],
    calls: [{ at: '16 Jan · Checkout hand-off', outcome: 'Reached', note: 'Named outcome: “to wake up without dread.” Prefers voice notes.' }],
    currentAction: { id: 'a_b_004', title: 'Begin the wind-down at 22:00.', term: 'B' },
  },
  m_0203: {
    id: 'm_0203', name: 'Deepa Venkat', firstName: 'Deepa', age: 49, city: 'Bengaluru', circle: 'Completed eight weeks · Healthcation December', cation: 'Healthcation',
    day: 58, method: 'v1.0', takenOn: '2026-12-01', nextMeasure: '2027-03-01', consentGranted: '01 Dec 2026', terms: t([72, 80, 78, 74, 79, 42], [2, 1, 0, 1, 2, 1]), index: 66, band: 'uneven',
    summary: [],
    summaryPaused: 'A lab result is held by the clinical team tonight. VIVA does not draft a digest while a P0 is open on the member. Dr Meera Iyer leads; your Day 60 talk on Friday goes ahead unless she says otherwise.',
    safetyHold: 'Held by Dr Meera Iyer · P0 opened 20:55 · reached 21:01',
    actions: [
      { date: 'Thu 28 Jan', title: 'Begin the wind-down at 22:00.', term: 'B', outcome: 'open' },
      { date: 'Wed 27 Jan', title: 'Begin the wind-down at 22:00.', term: 'B', outcome: 'not-today' },
      { date: 'Tue 26 Jan', title: 'Begin the wind-down at 22:00.', term: 'B', outcome: 'not-today' },
      { date: 'Mon 25 Jan', title: 'Begin the wind-down at 22:00.', term: 'B', outcome: 'done' },
      { date: 'Sun 24 Jan', title: 'Plan one pleasure for this evening.', term: 'D', outcome: 'done' },
      { date: 'Sat 23 Jan', title: 'Begin the wind-down at 22:00.', term: 'B', outcome: 'done' },
    ],
    ledgerWeeks: [{ week: 'W5', moments: 15 }, { week: 'W6', moments: 14 }, { week: 'W7', moments: 12 }, { week: 'W8', moments: 11 }],
    ledgerByPrompt: [{ prompt: 'Midday', count: 19 }, { prompt: 'Afternoon', count: 14 }, { prompt: 'Evening', count: 19 }],
    calls: [
      { at: '15 Jan · Day 45 review', outcome: 'Reached', note: 'Night shifts at the hospital again this month. Keeping the wind-down, moving it to 23:00 on shift weeks.' },
      { at: '16 Dec · Day 15 review', outcome: 'Reached', note: 'Named outcome: “to sleep like I did before the children.” Action landing.' },
    ],
    currentAction: { id: 'a_b_004', title: 'Begin the wind-down at 22:00.', term: 'B' },
  },
  m_0175: {
    id: 'm_0175', name: 'Thomas Mathew', firstName: 'Thomas', age: 58, city: 'Kochi', circle: 'Founders after exit', cation: 'Savourcation',
    day: 34, method: 'v1.0', takenOn: '2026-12-25', nextMeasure: '2027-03-25', consentGranted: '25 Dec 2026', terms: t([78, 82, 80, 76, 66, 22], [1, 0, -1, 1, -1, 0]), index: 71, band: 'steady',
    summary: [
      'Thomas’s Index is 71, unchanged. Daily Pleasure is his lowest term at 66; the savouring dinners at the stay were the moments he named most.',
      'His Joy Ledger has been quiet for ten days, after four steady weeks. He has kept doing his action on most days, so the quiet looks like the logging, not the living.',
      'The circle lead has a gentle check-in open. A voice note may suit him better than a prompt; he said at checkout that he dislikes “filling in forms”.',
    ],
    actions: [
      { date: 'Thu 28 Jan', title: 'Savour one meal without a screen.', term: 'D', outcome: 'open' },
      { date: 'Wed 27 Jan', title: 'Savour one meal without a screen.', term: 'D', outcome: 'done' },
      { date: 'Tue 26 Jan', title: 'Plan one pleasure for this evening.', term: 'D', outcome: 'done' },
      { date: 'Mon 25 Jan', title: 'Savour one meal without a screen.', term: 'D', outcome: 'done' },
      { date: 'Sun 24 Jan', title: 'Savour one meal without a screen.', term: 'D', outcome: 'not-today' },
    ],
    ledgerWeeks: [{ week: 'W2', moments: 13 }, { week: 'W3', moments: 12 }, { week: 'W4', moments: 3 }, { week: 'W5', moments: 0 }],
    ledgerByPrompt: [{ prompt: 'Midday', count: 9 }, { prompt: 'Afternoon', count: 6 }, { prompt: 'Evening', count: 13 }],
    calls: [{ at: '09 Jan · Day 15 review', outcome: 'Reached', note: 'Cooking for the family on Sundays is his anchor. Keep the savouring action; no change.' }],
    currentAction: { id: 'c_d_savour', title: 'Savour one meal without a screen.', term: 'D' },
  },
  m_0119: {
    id: 'm_0119', name: 'Vikram Patel', firstName: 'Vikram', age: 44, city: 'Ahmedabad', circle: 'Completed eight weeks · Lovecation November', cation: 'Lovecation',
    day: 77, method: 'v1.0', takenOn: '2026-11-12', nextMeasure: '2027-02-10', consentGranted: '12 Nov 2026', terms: t([70, 76, 61, 70, 72, 30], [2, 3, 6, 1, 3, -2]), index: 62, band: 'uneven',
    summary: [
      'Vikram’s Index rose 4 to 62. Relationships is still his lowest term at 61, though it moved most, after the weekly walk with Priti that came out of the stay.',
      'His re-measure window opened yesterday and closes on Day 90. The panel was drawn at home that morning, like for like with his first, and is awaiting Dr Meera’s Clinical-grade signature. Nothing is shown to him until it is signed.',
      'A sleep review was routed to the clinical team last week and has since been closed by the clinician. He books calls in the early morning; offer an early slot for the Day 90 talk once the score is signed.',
    ],
    actions: [
      { date: 'Thu 28 Jan', title: 'Call one person you have not spoken to this month.', term: 'R', outcome: 'open' },
      { date: 'Wed 27 Jan', title: 'Walk with one person, phones away.', term: 'R', outcome: 'done' },
      { date: 'Tue 26 Jan', title: 'Call one person you have not spoken to this month.', term: 'R', outcome: 'done' },
      { date: 'Mon 25 Jan', title: 'Walk with one person, phones away.', term: 'R', outcome: 'done' },
      { date: 'Sun 24 Jan', title: 'Walk with one person, phones away.', term: 'R', outcome: 'done' },
    ],
    ledgerWeeks: [{ week: 'W8', moments: 16 }, { week: 'W9', moments: 18 }, { week: 'W10', moments: 17 }, { week: 'W11', moments: 19 }],
    ledgerByPrompt: [{ prompt: 'Midday', count: 22 }, { prompt: 'Afternoon', count: 21 }, { prompt: 'Evening', count: 27 }],
    calls: [
      { at: '22 Jan · Day 71 check-in', outcome: 'Reached', note: 'Re-measure explained; wants the same lab partner. Sleep review now closed by Dr Meera.' },
      { at: '27 Dec · Day 45 review', outcome: 'Reached', note: 'Walks with Priti twice a week. Keep as is.' },
    ],
    currentAction: { id: 'a_r_007', title: 'Call one person you have not spoken to this month.', term: 'R' },
  },
  m_0310: {
    id: 'm_0310', name: 'Shalini Iyer', firstName: 'Shalini', age: 51, city: 'Chennai', circle: 'Completed eight weeks · Wealthcation November', cation: 'Wealthcation',
    day: 88, method: 'v1.0', takenOn: '2026-11-01', nextMeasure: '2027-01-30', consentGranted: '01 Nov 2026', terms: t([79, 84, 83, 69, 78, 17], [4, 3, 3, 5, 3, -4]), index: 74, band: 'steady',
    summary: [
      'Shalini’s Index rose 5 to 74 at her Index-grade check. Freedom remains her lowest term at 69, and it moved most this quarter (64 → 69).',
      'Her Day 90 re-measure is drafted and waiting for Dr Meera’s Clinical-grade signature. Nothing is shown to her until it is signed.',
      'At the Day 60 talk she named “one unhurried morning a week” as the next step. The next loop could start from Freedom again, or move to Body if the signed panel says so.',
    ],
    actions: [
      { date: 'Thu 28 Jan', title: 'Write the No list.', term: 'F', outcome: 'done' },
      { date: 'Wed 27 Jan', title: 'Protect one unhurried morning.', term: 'F', outcome: 'done' },
      { date: 'Tue 26 Jan', title: 'Write the No list.', term: 'F', outcome: 'done' },
      { date: 'Mon 25 Jan', title: 'Write the No list.', term: 'F', outcome: 'not-today' },
      { date: 'Sun 24 Jan', title: 'Protect one unhurried morning.', term: 'F', outcome: 'done' },
    ],
    ledgerWeeks: [{ week: 'W9', moments: 20 }, { week: 'W10', moments: 22 }, { week: 'W11', moments: 21 }, { week: 'W12', moments: 24 }],
    ledgerByPrompt: [{ prompt: 'Midday', count: 28 }, { prompt: 'Afternoon', count: 25 }, { prompt: 'Evening', count: 34 }],
    calls: [
      { at: '25 Jan · Re-measure booked', outcome: 'Reached', note: 'Panel drawn at home 26 Jan. Sign-off pending; talk booked for Day 90.' },
      { at: '31 Dec · Day 60 talk', outcome: 'Reached', note: 'Next step by lowest term: Freedom. “One unhurried morning a week.”' },
    ],
    currentAction: { id: 'a_f_003', title: 'Write the No list.', term: 'F' },
  },
  m_0221: {
    id: 'm_0221', name: 'Ananya Krishnan', firstName: 'Ananya', age: 34, city: 'Hyderabad', circle: 'Circle of eight · January starters', cation: 'Mindcation',
    day: 14, method: 'v1.0', takenOn: '2027-01-14', nextMeasure: '2027-04-14', consentGranted: '14 Jan 2027', terms: t([72, 59, 71, 69, 72, 22], [1, 3, 0, 1, 2, -1]), index: 63, band: 'uneven',
    summary: [
      'Ananya’s Index is 63. Purpose is her lowest term at 59; at checkout she said she wants to know “what the work is for”.',
      'She has answered the Tomorrow Question on 5 of the last 7 evenings. The two misses were both late office nights.',
      'Her Day 15 review is tomorrow. A good first question: which answers to the Tomorrow Question surprised her.',
    ],
    actions: [
      { date: 'Thu 28 Jan', title: 'Answer the Tomorrow Question.', term: 'P', outcome: 'open' },
      { date: 'Wed 27 Jan', title: 'Answer the Tomorrow Question.', term: 'P', outcome: 'done' },
      { date: 'Tue 26 Jan', title: 'Answer the Tomorrow Question.', term: 'P', outcome: 'not-today' },
      { date: 'Mon 25 Jan', title: 'Answer the Tomorrow Question.', term: 'P', outcome: 'done' },
      { date: 'Sun 24 Jan', title: 'Answer the Tomorrow Question.', term: 'P', outcome: 'done' },
    ],
    ledgerWeeks: [{ week: 'W1', moments: 9 }, { week: 'W2', moments: 12 }],
    ledgerByPrompt: [{ prompt: 'Midday', count: 6 }, { prompt: 'Afternoon', count: 5 }, { prompt: 'Evening', count: 10 }],
    calls: [{ at: '14 Jan · Checkout hand-off', outcome: 'Reached', note: 'Named outcome: “to know what the work is for.” Circle formed; prefers WhatsApp.' }],
    currentAction: { id: 'a_p_005', title: 'Answer the Tomorrow Question.', term: 'P' },
  },
  m_0234: {
    id: 'm_0234', name: 'Rahul Menon', firstName: 'Rahul', age: 46, city: 'Kochi', circle: 'Founders after exit', cation: 'Wealthcation',
    day: 44, method: 'v1.0', takenOn: '2026-12-15', nextMeasure: '2027-03-15', consentGranted: '15 Dec 2026', terms: t([68, 66, 70, 54, 64, 28], [0, -1, -2, -2, 0, 1]), index: 57, band: 'uneven',
    summary: [],
    summaryPaused: 'You raised a concern after today’s call, and it is with Dr Sanjay Menon for review within 48 hours. VIVA pauses the digest while a clinical review is open. Stay in touch as usual; the Day 45 review on Friday goes ahead.',
    actions: [
      { date: 'Thu 28 Jan', title: 'Write the No list.', term: 'F', outcome: 'open' },
      { date: 'Wed 27 Jan', title: 'Write the No list.', term: 'F', outcome: 'not-today' },
      { date: 'Tue 26 Jan', title: 'Write the No list.', term: 'F', outcome: 'not-today' },
      { date: 'Mon 25 Jan', title: 'Write the No list.', term: 'F', outcome: 'done' },
      { date: 'Sun 24 Jan', title: 'Protect one unhurried morning.', term: 'F', outcome: 'done' },
    ],
    ledgerWeeks: [{ week: 'W3', moments: 11 }, { week: 'W4', moments: 9 }, { week: 'W5', moments: 8 }, { week: 'W6', moments: 6 }],
    ledgerByPrompt: [{ prompt: 'Midday', count: 12 }, { prompt: 'Afternoon', count: 9 }, { prompt: 'Evening', count: 13 }],
    calls: [
      { at: '28 Jan · Day 44 call', outcome: 'Reached', note: 'Sounded more withdrawn than at Day 15. Raised a coach concern for the clinical team.' },
      { at: '30 Dec · Day 15 review', outcome: 'Reached', note: 'The exit has left long empty afternoons. No list agreed.' },
    ],
    currentAction: { id: 'a_f_003', title: 'Write the No list.', term: 'F' },
  },
  m_0256: {
    id: 'm_0256', name: 'Meenakshi Sundaram', firstName: 'Meenakshi', age: 61, city: 'Madurai', circle: 'Completed eight weeks · Beautycation December', cation: 'Beautycation',
    day: 59, method: 'v1.0', takenOn: '2026-11-30', nextMeasure: '2027-02-28', consentGranted: '30 Nov 2026', terms: t([78, 80, 81, 74, 67, 29], [2, 1, 1, 0, 4, -2]), index: 69, band: 'uneven',
    summary: [
      'Meenakshi’s Index rose 3 to 69. Daily Pleasure is her lowest term at 67, and it moved most, up 4 since the stay.',
      'She has kept “three good things” on most evenings and often logs music and the temple garden in her Ledger.',
      'The Day 60 talk is on Friday. The next step, by lowest term, is still Daily Pleasure; she has asked about a short Savourcation with her sister.',
    ],
    actions: [
      { date: 'Thu 28 Jan', title: 'Three good things before sleep.', term: 'D', outcome: 'open' },
      { date: 'Wed 27 Jan', title: 'Three good things before sleep.', term: 'D', outcome: 'done' },
      { date: 'Tue 26 Jan', title: 'Three good things before sleep.', term: 'D', outcome: 'done' },
      { date: 'Mon 25 Jan', title: 'Plan one pleasure for this evening.', term: 'D', outcome: 'done' },
      { date: 'Sun 24 Jan', title: 'Three good things before sleep.', term: 'D', outcome: 'done' },
    ],
    ledgerWeeks: [{ week: 'W5', moments: 17 }, { week: 'W6', moments: 19 }, { week: 'W7', moments: 18 }, { week: 'W8', moments: 21 }],
    ledgerByPrompt: [{ prompt: 'Midday', count: 21 }, { prompt: 'Afternoon', count: 22 }, { prompt: 'Evening', count: 32 }],
    calls: [{ at: '14 Jan · Day 45 review', outcome: 'Reached', note: 'Three good things works. Asked about a trip with her sister for the next loop.' }],
    currentAction: { id: 'c_d_three', title: 'Three good things before sleep.', term: 'D' },
  },
  m_0262: {
    id: 'm_0262', name: 'Sameer Joshi', firstName: 'Sameer', age: 38, city: 'Pune', circle: 'Circle of eight · January starters', cation: 'Lovecation',
    day: 6, method: 'v1.0', takenOn: '2027-01-22', nextMeasure: '2027-04-22', consentGranted: '22 Jan 2027', terms: t([64, 62, 50, 60, 63, 32]), index: 52, band: 'uneven',
    summary: [
      'Sameer’s Day 0 Index is 52. Relationships is his lowest term at 50; at checkout he and Neha named “an evening that is ours” as the outcome.',
      'Six days in, he has done his action on 4 of 5 days. What Neha answered as his partner stays private to her and is not part of this digest.',
    ],
    actions: [
      { date: 'Thu 28 Jan', title: 'Walk with one person, phones away.', term: 'R', outcome: 'open' },
      { date: 'Wed 27 Jan', title: 'Walk with one person, phones away.', term: 'R', outcome: 'done' },
      { date: 'Tue 26 Jan', title: 'Walk with one person, phones away.', term: 'R', outcome: 'done' },
      { date: 'Mon 25 Jan', title: 'Walk with one person, phones away.', term: 'R', outcome: 'not-today' },
      { date: 'Sun 24 Jan', title: 'Walk with one person, phones away.', term: 'R', outcome: 'done' },
    ],
    ledgerWeeks: [{ week: 'W1', moments: 7 }],
    ledgerByPrompt: [{ prompt: 'Midday', count: 2 }, { prompt: 'Afternoon', count: 1 }, { prompt: 'Evening', count: 4 }],
    calls: [{ at: '22 Jan · Checkout hand-off', outcome: 'Reached', note: 'Named outcome: “an evening that is ours.” First call booked for Thursday 18:30.' }],
    currentAction: { id: 'c_r_walk', title: 'Walk with one person, phones away.', term: 'R' },
  },
  m_0287: {
    id: 'm_0287', name: 'Leela Thomas', firstName: 'Leela', age: 56, city: 'Thiruvananthapuram', circle: 'Completed eight weeks · Sleepcation November', cation: 'Sleepcation',
    day: 79, method: 'v1.0', takenOn: '2026-11-10', nextMeasure: '2027-02-08', consentGranted: '10 Nov 2026', terms: t([74, 79, 76, 72, 75, 38], [1, 0, 1, 2, 1, -3]), index: 66, band: 'uneven',
    summary: [],
    summaryPaused: 'A sleep screen result is with the clinical team for routing. You see that a review is open, never the answers, and VIVA does not summarise an Ease result. Her re-measure window is open; book it as usual.',
    actions: [
      { date: 'Thu 28 Jan', title: 'Begin the wind-down at 22:00.', term: 'B', outcome: 'open' },
      { date: 'Wed 27 Jan', title: 'Begin the wind-down at 22:00.', term: 'B', outcome: 'done' },
      { date: 'Tue 26 Jan', title: 'Begin the wind-down at 22:00.', term: 'B', outcome: 'done' },
      { date: 'Mon 25 Jan', title: 'Same wake time, seven days.', term: 'B', outcome: 'done' },
      { date: 'Sun 24 Jan', title: 'Begin the wind-down at 22:00.', term: 'B', outcome: 'not-today' },
    ],
    ledgerWeeks: [{ week: 'W8', moments: 14 }, { week: 'W9', moments: 15 }, { week: 'W10', moments: 13 }, { week: 'W11', moments: 16 }],
    ledgerByPrompt: [{ prompt: 'Midday', count: 18 }, { prompt: 'Afternoon', count: 16 }, { prompt: 'Evening', count: 24 }],
    calls: [{ at: '20 Jan · Day 71 check-in', outcome: 'Reached', note: 'Sleeping later on weekends again. Re-measure explained in Malayalam; she prefers Tamil forms.' }],
    currentAction: { id: 'a_b_004', title: 'Begin the wind-down at 22:00.', term: 'B' },
  },
  m_0291: {
    id: 'm_0291', name: 'Karthik Raman', firstName: 'Karthik', age: 42, city: 'Coimbatore', circle: 'Circle of eight · Fairmont January', cation: 'Healthcation',
    day: 27, method: 'v1.0', takenOn: '2027-01-01', nextMeasure: '2027-04-01', consentGranted: '01 Jan 2027', terms: t([58, 72, 74, 68, 70, 34], [2, 0, 1, 0, 1, -1]), index: 60, band: 'uneven',
    summary: [
      'Karthik’s Index is 60. Healthspan is his lowest term at 58; his capacity battery at the stay put grip and sit-to-stand below his age norm.',
      'He has done the morning sit-to-stands on 6 of the last 7 days, before his 08:00 call. His Ledger moments are mostly about his daughter’s cricket.',
      'The Day 15 review went well. Worth asking whether he wants to add a second movement action now, or keep one until the re-measure.',
    ],
    actions: [
      { date: 'Thu 28 Jan', title: 'Five sit-to-stands, timed.', term: 'H', outcome: 'done' },
      { date: 'Wed 27 Jan', title: 'Five sit-to-stands, timed.', term: 'H', outcome: 'done' },
      { date: 'Tue 26 Jan', title: 'Five sit-to-stands, timed.', term: 'H', outcome: 'done' },
      { date: 'Mon 25 Jan', title: 'A ten-minute walk after lunch.', term: 'H', outcome: 'not-today' },
      { date: 'Sun 24 Jan', title: 'Five sit-to-stands, timed.', term: 'H', outcome: 'done' },
    ],
    ledgerWeeks: [{ week: 'W1', moments: 10 }, { week: 'W2', moments: 13 }, { week: 'W3', moments: 14 }, { week: 'W4', moments: 15 }],
    ledgerByPrompt: [{ prompt: 'Midday', count: 15 }, { prompt: 'Afternoon', count: 12 }, { prompt: 'Evening', count: 25 }],
    calls: [{ at: '15 Jan · Day 15 review', outcome: 'Reached', note: 'Sit-to-stands are landing before the 08:00 call. Keep as is.' }],
    currentAction: { id: 'a_h_011', title: 'Five sit-to-stands, timed.', term: 'H' },
  },
}

export const digestFor = (id: string | undefined): CoachDigest | undefined => (id ? COACH_DIGESTS[id] : undefined)

/** Reasons a coach may override the next-best action (logged with the override). */
export const OVERRIDE_REASONS = ['Member asked for a different time of day', 'Travel or schedule this week', 'Action not landing after two weeks', 'Coach judgement after the call']

// ─── Clinical portal ───────────────────────────────────────────────────────

export interface SafetyAlert {
  id: string
  member: string
  memberId: string
  priority: 'P0' | 'P1'
  kind: string
  detail: string
  openedAt: string
  slaMinutes: number
  owner: string
  status: 'open' | 'acknowledged' | 'closed'
  ackAt?: string
  outcome?: string
}

export const SAFETY_ALERTS: SafetyAlert[] = [
  { id: 's1', member: 'Nikhil Sharma', memberId: 'm_0142', priority: 'P0', kind: 'Self-harm language · intercept', detail: 'Second Arrow journal matched the crisis intercept before any model ran. Tele-MANAS 14416 shown to the member; on-call paged.', openedAt: '2027-01-28T21:04:00+05:30', slaMinutes: 15, owner: 'Dr Sanjay Menon', status: 'open' },
  { id: 's2', member: 'Deepa Venkat', memberId: 'm_0203', priority: 'P0', kind: 'Critical lab value', detail: 'Serum potassium 6.2 mmol/L (critical ≥ 6.0). Result final from the lab partner 20:52; repeat sample advised.', openedAt: '2027-01-28T20:55:00+05:30', slaMinutes: 60, owner: 'Dr Meera Iyer', status: 'acknowledged', ackAt: '2027-01-28T21:01:00+05:30' },
  { id: 's3', member: 'Farah Khan', memberId: 'm_0088', priority: 'P1', kind: 'Screen threshold · PHQ-4', detail: 'PHQ-4 = 7 (threshold ≥ 6). Clinician review required within 48 h.', openedAt: '2027-01-28T09:12:00+05:30', slaMinutes: 48 * 60, owner: 'Dr Sanjay Menon', status: 'open' },
  { id: 's4', member: 'Rahul Menon', memberId: 'm_0234', priority: 'P1', kind: 'Coach concern', detail: 'Raised by Priya Natarajan after a call: “sounded more withdrawn than at Day 15.” Attached: PHQ-4 = 6 (threshold ≥ 6), taken 27 Jan.', openedAt: '2027-01-28T13:40:00+05:30', slaMinutes: 48 * 60, owner: 'Dr Sanjay Menon', status: 'open' },
  { id: 's5', member: 'Vikram Patel', memberId: 'm_0119', priority: 'P1', kind: 'Screen threshold · ISI', detail: 'ISI = 16 (threshold ≥ 15). Sleep study suggested.', openedAt: '2027-01-24T15:20:00+05:30', slaMinutes: 48 * 60, owner: 'Dr Meera Iyer', status: 'closed', outcome: 'Tele-consult held; home sleep study ordered.' },
]

export const CLOSE_OUTCOMES = ['Reached the member; safe; plan agreed', 'Reached; referred to psychologist / psychiatry', 'Reached; emergency services involved', 'Repeat test ordered; member informed', 'Not reached; emergency contact called', 'False positive after review']

export const SCREEN_QUEUE = [
  { id: 'q1', member: 'Nikhil Sharma', instrument: 'PHQ-4', score: 10, threshold: 6, max: 12, taken: '28 Jan · 20:58', lang: 'EN', route: 'P0 open · Dr Sanjay Menon' },
  { id: 'q2', member: 'Farah Khan', instrument: 'PHQ-4', score: 7, threshold: 6, max: 12, taken: '28 Jan · 09:05', lang: 'EN', route: 'P1 open · Dr Sanjay Menon' },
  { id: 'q3', member: 'Leela Thomas', instrument: 'ISI', score: 18, threshold: 15, max: 28, taken: '27 Jan · 22:40', lang: 'TA', route: 'Unassigned' },
  { id: 'q4', member: 'Rahul Menon', instrument: 'PHQ-4', score: 6, threshold: 6, max: 12, taken: '27 Jan · 18:10', lang: 'HI', route: 'P1 open · Dr Sanjay Menon' },
  { id: 'q5', member: 'Vikram Patel', instrument: 'ISI', score: 16, threshold: 15, max: 28, taken: '24 Jan · 15:02', lang: 'EN', route: 'Closed · sleep study' },
]

export const SCREEN_ROUTES = ['Psychologist tele-consult (48 h)', 'Physician consult', 'Home sleep study', 'EAP / partner counsellor', 'Watchful waiting · re-screen in 14 days']

export interface SignoffItem {
  id: string
  member: string
  memberId: string
  occasion: string
  method: MethodVersion
  engine: string
  drafted: string
  prev: TermScore[]
  now: TermScore[]
  labs: { name: string; value: string; unit: string; ref: string; flag?: 'H' | 'L' }[]
  notes: string[]
}

export const SIGNOFF_QUEUE: SignoffItem[] = [
  {
    id: 'so1', member: 'Shalini Iyer', memberId: 'm_0310', occasion: 'Day 90 · Wealthcation', method: 'v1.0', engine: 'engine 1.0.4', drafted: '28 Jan · 18:20',
    // prev is the Day 0 measure the coach digest compares against (digest term − delta).
    prev: t([75, 81, 80, 64, 75, 21]), now: t([78, 84, 83, 70, 78, 17]),
    labs: [
      { name: 'HbA1c', value: '5.6', unit: '%', ref: '< 5.7' },
      { name: 'LDL-C', value: '118', unit: 'mg/dL', ref: '< 100', flag: 'H' },
      { name: 'ApoB', value: '92', unit: 'mg/dL', ref: '< 90', flag: 'H' },
      { name: 'hs-CRP', value: '1.1', unit: 'mg/L', ref: '< 2.0' },
      { name: 'Blood pressure', value: '124/78', unit: 'mmHg', ref: '< 130/80' },
      { name: 'VO₂max (est.)', value: '31', unit: 'mL/kg/min', ref: 'age norm 28–34' },
    ],
    notes: [],
  },
  {
    id: 'so2', member: 'Kavya Rao', memberId: 'm_0002', occasion: 'Day 23 · Joycation interim panel', method: 'v1.0', engine: 'engine 1.0.4', drafted: '28 Jan · 16:05',
    prev: t([68, 76, 81, 57, 69, 16]), now: t([69, 78, 81, 58, 72, 15]),
    labs: [
      { name: 'HbA1c', value: '6.1', unit: '%', ref: '< 5.7', flag: 'H' },
      { name: 'TSH', value: '2.4', unit: 'mIU/L', ref: '0.4–4.0' },
      { name: 'Vitamin D (25-OH)', value: '18', unit: 'ng/mL', ref: '30–100', flag: 'L' },
      { name: 'Haemoglobin', value: '12.6', unit: 'g/dL', ref: '12–15.5' },
      { name: 'Blood pressure', value: '132/84', unit: 'mmHg', ref: '< 130/80', flag: 'H' },
    ],
    notes: ['Ravi (concierge): home draw done 06:40, fasting confirmed.'],
  },
  {
    id: 'so3', member: 'Vikram Patel', memberId: 'm_0119', occasion: 'Re-measure · Lovecation (window Day 76–90)', method: 'v1.0', engine: 'engine 1.0.4', drafted: '27 Jan · 11:30',
    prev: t([68, 73, 55, 69, 69, 32]), now: t([70, 76, 62, 70, 72, 30]),
    labs: [
      { name: 'HbA1c', value: '5.4', unit: '%', ref: '< 5.7' },
      { name: 'LDL-C', value: '96', unit: 'mg/dL', ref: '< 100' },
      { name: 'Blood pressure', value: '128/82', unit: 'mmHg', ref: '< 130/80', flag: 'H' },
    ],
    notes: [],
  },
]

/** Raw clinical values — the clinical portal is the only console where these appear. */
export const MEMBER_LABS = [
  { name: 'HbA1c', unit: '%', ref: '< 5.7', series: [5.9, 5.8, 5.6], flag: undefined },
  { name: 'Fasting glucose', unit: 'mg/dL', ref: '70–99', series: [104, 101, 97], flag: undefined },
  { name: 'LDL-C', unit: 'mg/dL', ref: '< 100', series: [142, 118, 104], flag: 'H' as const },
  { name: 'ApoB', unit: 'mg/dL', ref: '< 90', series: [108, 96, 91], flag: 'H' as const },
  { name: 'hs-CRP', unit: 'mg/L', ref: '< 2.0', series: [2.8, 1.9, 1.4], flag: undefined },
  { name: 'eGFR', unit: 'mL/min/1.73m²', ref: '≥ 90', series: [94, 92, 93], flag: undefined },
  { name: 'Vitamin D (25-OH)', unit: 'ng/mL', ref: '30–100', series: [17, 24, 29], flag: 'L' as const },
  { name: 'Blood pressure', unit: 'mmHg', ref: '< 130/80', series: ['138/88', '131/84', '127/80'], flag: undefined },
]
export const LAB_DATES = ['06 Jul 2026', '04 Oct 2026', '02 Jan 2027']

export const CURRENT_MEDS = [
  { drug: 'Telmisartan', dose: '40 mg', freq: 'Once daily, morning', since: 'Mar 2024', by: 'Dr Meera Iyer' },
  { drug: 'Atorvastatin', dose: '10 mg', freq: 'Once daily, night', since: 'Oct 2026', by: 'Dr Meera Iyer' },
  { drug: 'Cholecalciferol', dose: '60,000 IU', freq: 'Once weekly × 8', since: 'Oct 2026', by: 'Dr Meera Iyer' },
]

/** A small formulary with mock RxNav interaction results against CURRENT_MEDS. */
export const FORMULARY: { drug: string; strengths: string[]; interactions: { with: string; severity: 'major' | 'moderate' | 'minor'; note: string }[] }[] = [
  { drug: 'Atorvastatin', strengths: ['10 mg', '20 mg', '40 mg'], interactions: [{ with: 'Atorvastatin', severity: 'major', note: 'Duplicate therapy: already on Atorvastatin 10 mg. Adjust the existing order instead.' }] },
  { drug: 'Clarithromycin', strengths: ['250 mg', '500 mg'], interactions: [{ with: 'Atorvastatin', severity: 'major', note: 'Strong CYP3A4 inhibition raises atorvastatin exposure; risk of myopathy and rhabdomyolysis. Consider azithromycin or pause the statin.' }] },
  { drug: 'Ibuprofen', strengths: ['200 mg', '400 mg'], interactions: [{ with: 'Telmisartan', severity: 'moderate', note: 'NSAIDs may reduce the antihypertensive effect and, with ARBs, affect renal function. Monitor BP and creatinine.' }] },
  { drug: 'Melatonin', strengths: ['2 mg PR', '3 mg'], interactions: [] },
  { drug: 'Ezetimibe', strengths: ['10 mg'], interactions: [{ with: 'Atorvastatin', severity: 'minor', note: 'Commonly co-prescribed. Additive LDL lowering; monitor liver enzymes as usual.' }] },
  { drug: 'Azithromycin', strengths: ['250 mg', '500 mg'], interactions: [] },
]

export const HITL_QUEUE = [
  {
    id: 'h1', tool: 'explain_biomarker', member: 'Arjun Rao', lang: 'EN', why: 'Explains a lab result · clinical output', drafted: '28 Jan · 19:42',
    text: 'Your LDL cholesterol is 104 mg/dL, down from 142 in July. It is now close to the target Dr Meera set with you. The statin and the evening walks are both part of that. Your next panel is in April.',
    attribution: { model: 'gateway · frontier-coach (ap-south-1)', prompt: 'explain_biomarker@1.3.0', tool: 'explain_biomarker', inputs: 'sha256:9f2c…a71e', rag: 'clinical-rag v28 · 3 passages' },
    guard: { claims: 'pass', refused: 0, pii: 'pass' },
  },
  {
    id: 'h2', tool: 'le8_coach', member: 'Kavya Rao', lang: 'HI', why: 'Non-English reply · physician review by default', drafted: '28 Jan · 18:15',
    text: 'आपकी नींद का स्कोर पिछले महीने से बेहतर है। सोने से पहले 30 मिनट फ़ोन दूर रखने की आदत को जारी रखें। रक्तचाप के बारे में डॉ. मीरा आपसे बात करेंगी।',
    attribution: { model: 'gateway · frontier-coach (ap-south-1)', prompt: 'le8_coach@2.0.1', tool: 'le8_coach', inputs: 'sha256:41be…0c93', rag: 'clinical-rag v28 · 2 passages' },
    guard: { claims: 'pass', refused: 0, pii: 'pass' },
  },
  {
    id: 'h3', tool: 'explain_biomarker', member: 'Shalini Iyer', lang: 'EN', why: 'Explains a lab result · clinical output', drafted: '28 Jan · 17:58',
    text: 'Your ApoB is slightly above the range we aim for. This is common and often responds to food and movement changes. Dr Meera will decide with you whether anything else is needed.',
    attribution: { model: 'gateway · frontier-coach (ap-south-1)', prompt: 'explain_biomarker@1.3.0', tool: 'explain_biomarker', inputs: 'sha256:c07d…5b12', rag: 'clinical-rag v28 · 4 passages' },
    guard: { claims: 'flag', refused: 1, pii: 'pass' },
    flagged: '“often responds” — claims ladder requires a cited source for an efficacy statement.',
  },
]

export const MD_CONFIG = {
  active: { version: 'v3', signedOn: '12 Jan 2027', signers: ['Dr Meera Iyer · Medical Director', 'Dr Sanjay Menon · Lead Psychologist'], hash: 'cfg:3a91…e04d' },
  thresholds: [
    { key: 'phq4', label: 'PHQ-4 screen → clinician review', unit: 'score ≥', value: 6, min: 3, max: 12 },
    { key: 'isi', label: 'ISI screen → clinician review', unit: 'score ≥', value: 15, min: 8, max: 28 },
    { key: 'pss4', label: 'PSS-4 screen → coach check-in', unit: 'score ≥', value: 10, min: 4, max: 16 },
    { key: 'p0', label: 'P0 alert → a person reaches the member', unit: 'minutes ≤', value: 15, min: 5, max: 30 },
    { key: 'p1', label: 'P1 alert → clinician review', unit: 'hours ≤', value: 48, min: 4, max: 72 },
    { key: 'k', label: 'Critical potassium → P0', unit: 'mmol/L ≥', value: 6.0, min: 5.5, max: 7.0 },
  ],
  history: [
    { version: 'v3', date: '12 Jan 2027', change: 'P0 SLA 20 → 15 minutes', signers: 'Dr Meera Iyer, Dr Sanjay Menon', hash: 'cfg:3a91…e04d' },
    { version: 'v2', date: '04 Nov 2026', change: 'ISI threshold added (≥ 15); PSS-4 routed to coach', signers: 'Dr Meera Iyer, Dr Sanjay Menon', hash: 'cfg:77c0…19af' },
    { version: 'v1', date: '22 Oct 2026', change: 'First signed configuration with method v1.0', signers: 'Dr Meera Iyer, Head of Joyspan Science', hash: 'cfg:0b2e…8d55' },
  ],
}

// ─── Partner & venue console ───────────────────────────────────────────────

export const VENUE = { name: 'Fairmont Mumbai', kind: 'Partner hotel · Joycation and Healthcation venue', contact: 'Rhea D’Souza · Guest Experience', today: 'Thu 28 Jan 2027', inHouse: 14 }

export const ARRIVALS = [
  { id: 'g1', name: 'Mr Anand & Mrs Lalitha Pillai', room: '1204', eta: '14:30', cation: 'Healthcation', nights: 4, dietary: 'Vegetarian · no onion, no garlic', first: 'Welcome & card · 16:00', status: 'arrived' },
  { id: 'g2', name: 'Ms Sunita Rao', room: '1206', eta: '15:10', cation: 'Healthcation', nights: 4, dietary: 'Eggetarian', first: 'Welcome & card · 16:00', status: 'arrived' },
  { id: 'g3', name: 'Mr Imran Siddiqui', room: '1208', eta: '17:45', cation: 'Healthcation', nights: 4, dietary: 'Halal', first: 'Sunrise walk · Fri 06:15', status: 'expected' },
  { id: 'g4', name: 'Dr Neha & Mr Karan Bhatia', room: '1402', eta: '18:30', cation: 'Joycation', nights: 5, dietary: 'No preference noted', first: 'Circle formation · Fri 10:00', status: 'expected' },
  { id: 'g5', name: 'Mrs Revathi Narayanan', room: '1210', eta: '19:20', cation: 'Healthcation', nights: 4, dietary: 'Vegetarian · Jain', first: 'Sunrise walk · Fri 06:15', status: 'expected' },
  { id: 'g6', name: 'Mr George Mathew', room: '1212', eta: '22:05', cation: 'Healthcation', nights: 4, dietary: 'No shellfish', first: 'Sunrise walk · Fri 06:15', status: 'delayed' },
]

export const BLOCK_LIBRARY = [
  { id: 'b1', name: 'Welcome & the Index card', minutes: 45, place: 'Library lounge', kind: 'Ritual' },
  { id: 'b2', name: 'Sunrise walk', minutes: 60, place: 'Sea-facing lawn', kind: 'Movement' },
  { id: 'b3', name: 'Capacity battery session', minutes: 40, place: 'Signal Point studio · L3', kind: 'Measure' },
  { id: 'b4', name: 'Clinician consult', minutes: 30, place: 'Clinical suite · L3', kind: 'Clinical' },
  { id: 'b5', name: 'Ikigai workshop', minutes: 90, place: 'Salon B', kind: 'Purpose' },
  { id: 'b6', name: 'Savouring dinner', minutes: 120, place: 'Spectral · private room', kind: 'Pleasure' },
  { id: 'b7', name: 'Spa ritual', minutes: 75, place: 'Willow Stream Spa', kind: 'Rest' },
  { id: 'b8', name: 'Circle formation', minutes: 60, place: 'Salon A', kind: 'People' },
  { id: 'b9', name: 'Wind-down & sleep room set-up', minutes: 30, place: 'Guest room', kind: 'Rest' },
  { id: 'b10', name: 'Checkout hand-off', minutes: 45, place: 'Library lounge', kind: 'Ritual' },
]

export const SIGNAL_POINTS = [
  { id: 'sp1', name: 'Body composition station', place: 'Signal Point studio · L3', status: 'online', lastSync: '21:06', today: 14, battery: null },
  { id: 'sp2', name: 'Grip dynamometer · 2 units', place: 'Signal Point studio · L3', status: 'online', lastSync: '20:58', today: 22, battery: 82 },
  { id: 'sp3', name: 'Blood pressure station', place: 'Clinical suite · L3', status: 'calibration', lastSync: '18:40', today: 9, battery: null },
  { id: 'sp4', name: 'Sit-to-stand mat', place: 'Signal Point studio · L3', status: 'online', lastSync: '21:02', today: 18, battery: 64 },
  { id: 'sp5', name: 'Sleep room sensors · 1204–1212', place: 'Guest floor 12', status: 'online', lastSync: '21:09', today: 5, battery: 91 },
  { id: 'sp6', name: 'Cycle ergometer (VO₂ estimate)', place: 'Fitness centre', status: 'offline', lastSync: 'Yesterday 17:12', today: 0, battery: null },
]

export const ZONES = [
  { id: 'z1', name: 'Summit hall', capacity: 620, inside: 0, access: 'Event pass' },
  { id: 'z2', name: 'Signal Point studio · L3', capacity: 12, inside: 3, access: '’Cation guests · scheduled' },
  { id: 'z3', name: 'Clinical suite · L3', capacity: 6, inside: 1, access: 'Scheduled consult only · clinician escorts' },
  { id: 'z4', name: 'Willow Stream Spa', capacity: 24, inside: 7, access: '’Cation guests' },
  { id: 'z5', name: 'Spectral · private dining', capacity: 18, inside: 0, access: 'Savouring dinner pass' },
]

export const PASSES = [
  { code: 'JX-2401', name: 'Ms Sunita Rao', pass: 'Healthcation guest', zones: ['z2', 'z3', 'z4', 'z5'], checkedIn: true },
  { code: 'JX-2402', name: 'Mr Anand Pillai', pass: 'Healthcation guest', zones: ['z2', 'z3', 'z4', 'z5'], checkedIn: true },
  { code: 'JX-2403', name: 'Mrs Lalitha Pillai', pass: 'Healthcation guest', zones: ['z2', 'z3', 'z4', 'z5'], checkedIn: true },
  { code: 'JX-2404', name: 'Dr Neha Bhatia', pass: 'Joycation guest', zones: ['z1', 'z2', 'z3', 'z4', 'z5'], checkedIn: false },
  { code: 'EV-7710', name: 'Mr Rohan Kapoor', pass: 'AIWO Joyspan 2027 · Summit day pass', zones: ['z1'], checkedIn: false },
  { code: 'EV-7711', name: 'Ms Aisha Merchant', pass: 'AIWO Joyspan 2027 · Summit day pass', zones: ['z1'], checkedIn: false },
]

/** Prepaid packages at this venue. Hotel cost ≤ 40% of package price (Memo p.20). */
export const PACKAGES = [
  { name: 'Joycation · 5 nights · couple', price: 1500000, hotel: 578000, sold: 12 },
  { name: 'Healthcation · 4 nights', price: 450000, hotel: 171000, sold: 38 },
  { name: 'Healthcation · 4 nights · sea view', price: 520000, hotel: 213200, sold: 9 },
  { name: 'Joyspan Occasion · 60th birthday (draft)', price: 380000, hotel: 159600, sold: 0 },
]

export const RECEIVABLES = [
  { bucket: '0–15 days', amount: 2140000, invoices: 9 },
  { bucket: '16–30 days', amount: 860000, invoices: 3 },
  { bucket: 'Over 30 days', amount: 0, invoices: 0 },
]

/** Aggregate Day-90 deltas for cohorts that stayed at this venue. k ≥ 10 or suppressed. */
export const VENUE_COHORTS = [
  { id: 'vc1', name: 'Healthcation · Q4 2026', n: 58, remeasured: 0.79, improvedLowest: 0.6, deltas: { H: 4, P: 2, R: 1, F: 1, D: 3, B: -3 } as Record<TermKey, number> },
  { id: 'vc2', name: 'Joycation · October 2026', n: 24, remeasured: 0.83, improvedLowest: 0.58, deltas: { H: 2, P: 3, R: 4, F: -1, D: 5, B: -2 } as Record<TermKey, number> },
  { id: 'vc3', name: 'Healthcation · November 2026 (sea view)', n: 7, remeasured: null, improvedLowest: null, deltas: null },
  { id: 'vc4', name: 'AIWO Joyspan 2027 · Fairmont', n: 600, remeasured: null, improvedLowest: null, deltas: null, inLoop: 23 },
]

export const WEBHOOK_EVENTS = ['arrival.created', 'arrival.updated', 'itinerary.published', 'pass.checked_in', 'zone.capacity', 'signal_point.status']
export const WEBHOOKS = [
  { id: 'wh1', url: 'https://ops.fairmont-mumbai.example/joyos/hooks', events: ['arrival.created', 'arrival.updated', 'itinerary.published'], status: 'healthy', last: '21:04 · 200 · 142 ms' },
  { id: 'wh2', url: 'https://pms-bridge.example/aiwo', events: ['pass.checked_in', 'zone.capacity'], status: 'healthy', last: '20:51 · 200 · 88 ms' },
]

// ─── Coach console additions ───────────────────────────────────────────────

/**
 * Coach-side corrections to the platform drift specimen, so the queue agrees with the
 * digest. Arjun's Freedom fell by 4, below the ≥5 auto-rule, so Priya opened the task herself.
 */
export const DRIFT_OVERRIDES: Record<string, { detail?: string; label?: string }> = {
  d3: {
    label: 'Term fell at re-measure · opened by coach',
    detail: 'Freedom fell 4 at the January measure (66 → 62). Named “a heavy quarter at work” on the Day 15 call. Below the ≥5 rule; opened by Priya to follow up.',
  },
}

/** Claims-gated actions a coach may choose when overriding, beyond the member library. */
export interface CuratedAction { id: string; term: TermKey; title: string; minutes: number; evidence: string }
export const CURATED_ACTIONS: CuratedAction[] = [
  { id: 'c_h_walk', term: 'H', title: 'A ten-minute walk after lunch.', minutes: 10, evidence: 'Post-meal walking and glucose response (meta-analysis of trials).' },
  { id: 'c_h_stairs', term: 'H', title: 'Take the stairs for one floor, twice today.', minutes: 3, evidence: 'Exercise snacks and cardiorespiratory fitness.' },
  { id: 'c_p_mattered', term: 'P', title: 'Name one thing you did today that mattered to someone.', minutes: 3, evidence: 'Meaning presence (MLQ-P); prosocial purpose.' },
  { id: 'c_p_teach', term: 'P', title: 'Spend ten minutes teaching someone a thing you know well.', minutes: 10, evidence: 'Generativity (Loyola Generativity Scale).' },
  { id: 'c_r_walk', term: 'R', title: 'Walk with one person, phones away.', minutes: 20, evidence: 'Shared activity and relationship satisfaction.' },
  { id: 'c_r_thanks', term: 'R', title: 'Send one specific thank-you message.', minutes: 5, evidence: 'Gratitude expression (positive psychology trials).' },
  { id: 'c_f_morning', term: 'F', title: 'Protect one unhurried morning.', minutes: 60, evidence: 'Time affluence and well-being.' },
  { id: 'c_f_handoff', term: 'F', title: 'Hand off one chore you dislike this week.', minutes: 15, evidence: 'Autonomy satisfaction (BPNSFS); time use.' },
  { id: 'c_d_savour', term: 'D', title: 'Savour one meal without a screen.', minutes: 20, evidence: 'Savouring interventions (Bryant & Veroff).' },
  { id: 'c_d_three', term: 'D', title: 'Three good things before sleep.', minutes: 5, evidence: 'Three Good Things exercise (positive psychology trials).' },
  { id: 'c_b_wake', term: 'B', title: 'Same wake time, seven days.', minutes: 1, evidence: 'Sleep regularity and daytime function.' },
  { id: 'c_b_breath', term: 'B', title: 'Six slow breaths before the first meeting.', minutes: 2, evidence: 'Slow-paced breathing and perceived stress.' },
]

/** Who sits in each circle Priya leads. Members outside her caseload show without a digest link. */
export const CIRCLE_ROSTER: Record<string, { id?: string; name: string; coach?: string }[]> = {
  c1: [
    { id: 'm_0001', name: 'Arjun Rao' }, { id: 'm_0002', name: 'Kavya Rao' }, { id: 'm_0291', name: 'Karthik Raman' },
    { name: 'Rohit Bansal', coach: 'Anil Varghese' }, { name: 'Sneha Kulkarni', coach: 'Anil Varghese' }, { name: 'Imran Qureshi', coach: 'Anil Varghese' },
    { name: 'Lakshmi Pillai', coach: 'Anil Varghese' }, { name: 'Dev Malhotra', coach: 'Anil Varghese' },
  ],
  c2: [
    { id: 'm_0142', name: 'Nikhil Sharma' }, { id: 'm_0234', name: 'Rahul Menon' }, { id: 'm_0175', name: 'Thomas Mathew' },
    { name: 'Kabir Sethi', coach: 'Anil Varghese' }, { name: 'Maya Iyengar', coach: 'Anil Varghese' }, { name: 'Rohan Desai', coach: 'Anil Varghese' },
    { name: 'Zoya Kapoor', coach: 'Anil Varghese' },
  ],
  c3: [
    { id: 'm_0088', name: 'Farah Khan' }, { id: 'm_0221', name: 'Ananya Krishnan' }, { id: 'm_0262', name: 'Sameer Joshi' },
    { name: 'Priyanka Nair', coach: 'Fatima Sheikh' }, { name: 'Aditya Ghosh', coach: 'Fatima Sheikh' }, { name: 'Naveen Reddy', coach: 'Fatima Sheikh' },
    { name: 'Ritu Agarwal', coach: 'Fatima Sheikh' }, { name: 'Joseph Varghese', coach: 'Fatima Sheikh' },
  ],
}

// ─── Clinical portal additions ─────────────────────────────────────────────

export const MEMBER_IDS: Record<string, string> = {
  'Arjun Rao': 'm_0001', 'Kavya Rao': 'm_0002', 'Nikhil Sharma': 'm_0142', 'Farah Khan': 'm_0088', 'Deepa Venkat': 'm_0203',
  'Rahul Menon': 'm_0234', 'Vikram Patel': 'm_0119', 'Shalini Iyer': 'm_0310', 'Leela Thomas': 'm_0287',
}

type Lab = { name: string; unit: string; ref: string; series: (number | string)[]; flag?: 'H' | 'L' }
type Med = { drug: string; dose: string; freq: string; since: string; by: string }
export interface ClinicalRecord {
  id: string
  name: string
  age: number
  care: string
  labDates: string[]
  labs: Lab[]
  meds: Med[]
  chart: { lab: string; target: number; targetLabel: string; domain: [number, number]; sentence: string }
  orders: { test: string; when: string; status: string }[]
  suggestedOrder?: { test: string; urgency: string; why: string }
}

export const CLINICAL_RECORDS: Record<string, ClinicalRecord> = {
  m_0001: {
    id: 'm_0001', name: 'Arjun Rao', age: 52, care: 'Joycation · Day 23 · Dr Meera Iyer', labDates: LAB_DATES, labs: MEMBER_LABS, meds: CURRENT_MEDS,
    chart: { lab: 'LDL-C', target: 100, targetLabel: 'target 100', domain: [80, 160], sentence: 'LDL-C over three panels, with the target line at 100 mg/dL.' },
    orders: [{ test: 'Lipid panel + ApoB', when: 'Due 05 Apr 2027', status: 'Scheduled with the re-measure' }],
  },
  m_0203: {
    id: 'm_0203', name: 'Deepa Venkat', age: 49, care: 'Healthcation · Day 58 · Dr Meera Iyer', labDates: ['01 Dec 2026', '12 Jan 2027', '28 Jan 2027'],
    labs: [
      { name: 'Serum potassium', unit: 'mmol/L', ref: '3.5–5.0', series: [4.6, 4.9, 6.2], flag: 'H' },
      { name: 'Creatinine', unit: 'mg/dL', ref: '0.5–1.1', series: [0.9, 1.0, 1.2], flag: 'H' },
      { name: 'eGFR', unit: 'mL/min/1.73m²', ref: '≥ 90', series: [84, 76, 61], flag: 'L' },
      { name: 'Sodium', unit: 'mmol/L', ref: '135–145', series: [139, 138, 137] },
      { name: 'HbA1c', unit: '%', ref: '< 5.7', series: [6.4, 6.2, 6.1], flag: 'H' },
      { name: 'Blood pressure', unit: 'mmHg', ref: '< 130/80', series: ['146/92', '134/84', '128/80'] },
    ],
    meds: [
      { drug: 'Ramipril', dose: '5 mg', freq: 'Once daily, morning', since: 'Dec 2026', by: 'Dr Meera Iyer' },
      { drug: 'Spironolactone', dose: '25 mg', freq: 'Once daily', since: 'Jan 2027', by: 'Outside physician' },
      { drug: 'Metformin', dose: '500 mg', freq: 'Twice daily, with meals', since: 'Aug 2025', by: 'Outside physician' },
    ],
    chart: { lab: 'Serum potassium', target: 5.0, targetLabel: 'upper limit 5.0', domain: [3.5, 6.5], sentence: 'Serum potassium over three draws, with the upper limit of normal at 5.0 mmol/L. The latest is critical.' },
    orders: [{ test: 'Basic metabolic panel', when: '28 Jan 2027 · 20:52', status: 'Final · critical value called in' }],
    suggestedOrder: { test: 'Repeat serum potassium (non-haemolysed)', urgency: 'STAT · home draw tonight', why: 'Critical K⁺ 6.2 on an ACE inhibitor with spironolactone. Repeat before acting; exclude haemolysis.' },
  },
  m_0002: {
    id: 'm_0002', name: 'Kavya Rao', age: 55, care: 'Joycation · Day 23 · Dr Meera Iyer', labDates: ['06 Jul 2026', '04 Oct 2026', '28 Jan 2027'],
    labs: [
      { name: 'Vitamin D (25-OH)', unit: 'ng/mL', ref: '30–100', series: [22, 20, 18], flag: 'L' },
      { name: 'HbA1c', unit: '%', ref: '< 5.7', series: [5.9, 6.0, 6.1], flag: 'H' },
      { name: 'TSH', unit: 'mIU/L', ref: '0.4–4.0', series: [2.1, 2.2, 2.4] },
      { name: 'Haemoglobin', unit: 'g/dL', ref: '12–15.5', series: [12.4, 12.5, 12.6] },
      { name: 'Blood pressure', unit: 'mmHg', ref: '< 130/80', series: ['128/82', '130/84', '132/84'], flag: 'H' },
    ],
    meds: [{ drug: 'Amlodipine', dose: '5 mg', freq: 'Once daily', since: 'Feb 2025', by: 'Outside physician' }],
    chart: { lab: 'Vitamin D (25-OH)', target: 30, targetLabel: 'lower limit 30', domain: [0, 60], sentence: 'Vitamin D over three panels, with the lower limit of the range at 30 ng/mL.' },
    orders: [{ test: 'Day 23 interim panel · home draw', when: '28 Jan 2027 · 06:40', status: 'Final · awaiting your sign-off' }],
    suggestedOrder: { test: 'Vitamin D (25-OH) after loading', urgency: 'Routine · in 8 weeks', why: 'Low at 18 ng/mL on three panels. Recheck after a loading course.' },
  },
  m_0310: {
    id: 'm_0310', name: 'Shalini Iyer', age: 51, care: 'Wealthcation · Day 88 · Dr Meera Iyer', labDates: ['01 Nov 2026', '26 Jan 2027'],
    labs: [
      { name: 'LDL-C', unit: 'mg/dL', ref: '< 100', series: [131, 118], flag: 'H' },
      { name: 'ApoB', unit: 'mg/dL', ref: '< 90', series: [101, 92], flag: 'H' },
      { name: 'HbA1c', unit: '%', ref: '< 5.7', series: [5.7, 5.6] },
      { name: 'hs-CRP', unit: 'mg/L', ref: '< 2.0', series: [1.6, 1.1] },
      { name: 'Blood pressure', unit: 'mmHg', ref: '< 130/80', series: ['128/80', '124/78'] },
    ],
    meds: [],
    chart: { lab: 'LDL-C', target: 100, targetLabel: 'target 100', domain: [80, 160], sentence: 'LDL-C at Day 0 and at the Day 90 re-measure, with the target line at 100 mg/dL.' },
    orders: [{ test: 'Day 90 panel · home draw', when: '26 Jan 2027', status: 'Final · score drafted for sign-off' }],
  },
  m_0119: {
    id: 'm_0119', name: 'Vikram Patel', age: 44, care: 'Lovecation · Day 77 · Dr Meera Iyer', labDates: ['12 Nov 2026', '27 Jan 2027'],
    labs: [
      { name: 'HbA1c', unit: '%', ref: '< 5.7', series: [5.5, 5.4] },
      { name: 'LDL-C', unit: 'mg/dL', ref: '< 100', series: [104, 96] },
      { name: 'Blood pressure', unit: 'mmHg', ref: '< 130/80', series: ['134/86', '128/82'], flag: 'H' },
      { name: 'Ferritin', unit: 'ng/mL', ref: '30–400', series: [88, 92] },
    ],
    meds: [{ drug: 'Melatonin', dose: '2 mg PR', freq: 'At night × 4 weeks', since: 'Jan 2027', by: 'Dr Meera Iyer' }],
    chart: { lab: 'LDL-C', target: 100, targetLabel: 'target 100', domain: [80, 140], sentence: 'LDL-C at Day 0 and at the Day 76 re-measure, with the target line at 100 mg/dL.' },
    orders: [
      { test: 'Re-measure panel · home draw', when: '27 Jan 2027 · 06:30', status: 'Final · score drafted for sign-off' },
      { test: 'Home sleep study (level 3)', when: 'Booked 02 Feb 2027', status: 'Ordered after ISI review' },
    ],
  },
  m_0088: {
    id: 'm_0088', name: 'Farah Khan', age: 39, care: 'Sleepcation · Day 12 · Dr Sanjay Menon', labDates: ['16 Jan 2027'],
    labs: [
      { name: 'TSH', unit: 'mIU/L', ref: '0.4–4.0', series: [3.1] },
      { name: 'Haemoglobin', unit: 'g/dL', ref: '12–15.5', series: [11.6], flag: 'L' },
      { name: 'Ferritin', unit: 'ng/mL', ref: '15–150', series: [14], flag: 'L' },
      { name: 'Vitamin B12', unit: 'pg/mL', ref: '200–900', series: [310] },
    ],
    meds: [],
    chart: { lab: 'Haemoglobin', target: 12, targetLabel: 'lower limit 12', domain: [10, 14], sentence: 'Haemoglobin at the Day 0 panel, with the lower limit at 12 g/dL.' },
    orders: [{ test: 'Psychologist tele-consult', when: 'Within 48 h', status: 'P1 open · Dr Sanjay Menon · PHQ-4 review' }],
  },
  m_0142: {
    id: 'm_0142', name: 'Nikhil Sharma', age: 47, care: 'Mindcation · Day 41 · Dr Sanjay Menon', labDates: ['18 Dec 2026'],
    labs: [
      { name: 'TSH', unit: 'mIU/L', ref: '0.4–4.0', series: [2.0] },
      { name: 'HbA1c', unit: '%', ref: '< 5.7', series: [5.5] },
      { name: 'Vitamin D (25-OH)', unit: 'ng/mL', ref: '30–100', series: [27], flag: 'L' },
    ],
    meds: [],
    chart: { lab: 'Vitamin D (25-OH)', target: 30, targetLabel: 'lower limit 30', domain: [0, 60], sentence: 'Vitamin D at the Day 0 panel, with the lower limit at 30 ng/mL.' },
    orders: [{ test: 'Crisis contact and safety plan', when: 'Tonight', status: 'P0 open · Dr Sanjay Menon' }],
  },
  m_0234: {
    id: 'm_0234', name: 'Rahul Menon', age: 46, care: 'Wealthcation · Day 44 · Dr Sanjay Menon', labDates: ['15 Dec 2026'],
    labs: [
      { name: 'HbA1c', unit: '%', ref: '< 5.7', series: [5.8], flag: 'H' },
      { name: 'LDL-C', unit: 'mg/dL', ref: '< 100', series: [122], flag: 'H' },
      { name: 'TSH', unit: 'mIU/L', ref: '0.4–4.0', series: [1.8] },
    ],
    meds: [],
    chart: { lab: 'LDL-C', target: 100, targetLabel: 'target 100', domain: [80, 140], sentence: 'LDL-C at the Day 0 panel, with the target line at 100 mg/dL.' },
    orders: [{ test: 'Coach concern review', when: 'Within 48 h', status: 'P1 open · Dr Sanjay Menon' }],
  },
  m_0287: {
    id: 'm_0287', name: 'Leela Thomas', age: 56, care: 'Sleepcation · Day 79 · Dr Meera Iyer', labDates: ['10 Nov 2026'],
    labs: [
      { name: 'TSH', unit: 'mIU/L', ref: '0.4–4.0', series: [4.4], flag: 'H' },
      { name: 'Ferritin', unit: 'ng/mL', ref: '15–150', series: [42] },
      { name: 'HbA1c', unit: '%', ref: '< 5.7', series: [5.6] },
    ],
    meds: [{ drug: 'Levothyroxine', dose: '25 mcg', freq: 'Once daily, empty stomach', since: 'Nov 2026', by: 'Dr Meera Iyer' }],
    chart: { lab: 'TSH', target: 4, targetLabel: 'upper limit 4.0', domain: [0, 6], sentence: 'TSH at the Day 0 panel, with the upper limit at 4.0 mIU/L.' },
    orders: [{ test: 'ISI review', when: 'Within 48 h', status: 'Awaiting routing' }],
  },
}

/** Interactions beyond the base formulary, checked against each member's own medicines. */
export const EXTRA_INTERACTIONS: Record<string, { with: string; severity: 'major' | 'moderate' | 'minor'; note: string }[]> = {
  Ibuprofen: [
    { with: 'Ramipril', severity: 'moderate', note: 'NSAIDs with ACE inhibitors may reduce the antihypertensive effect and raise potassium and creatinine.' },
    { with: 'Spironolactone', severity: 'major', note: 'Raises the risk of hyperkalaemia and acute kidney injury. Avoid, especially with a high potassium.' },
  ],
  'Potassium chloride': [
    { with: 'Spironolactone', severity: 'major', note: 'Potassium-sparing diuretic with a potassium supplement: high risk of hyperkalaemia.' },
    { with: 'Ramipril', severity: 'major', note: 'ACE inhibitor with a potassium supplement raises serum potassium.' },
  ],
  Clarithromycin: [{ with: 'Amlodipine', severity: 'moderate', note: 'CYP3A4 inhibition raises amlodipine levels; watch for hypotension and oedema.' }],
}
export const EXTRA_FORMULARY = [{ drug: 'Potassium chloride', strengths: ['600 mg SR'] }, { drug: 'Cholecalciferol', strengths: ['60,000 IU'] }]

/** Who a screen route goes to. Psychological routes go to the psychologist on the rota. */
export const SCREEN_ROUTE_OWNER: Record<string, string> = {
  'Psychologist tele-consult (48 h)': 'Dr Sanjay Menon',
  'Physician consult': 'Dr Meera Iyer',
  'Home sleep study': 'Dr Meera Iyer',
  'EAP / partner counsellor': 'Dr Sanjay Menon',
  'Watchful waiting · re-screen in 14 days': 'Dr Sanjay Menon',
}

export const RETURN_REASONS = ['Repeat test needed', 'Lab value looks implausible', 'An input is missing']

// ─── Partner console additions ─────────────────────────────────────────────

/** Itinerary templates by ’cation. Day 1 is arrival; the last day is checkout. */
export const ITINERARY_TEMPLATES: Record<string, { blockId: string; day: number; start: string }[]> = {
  Healthcation: [
    { blockId: 'b1', day: 1, start: '16:00' }, { blockId: 'b7', day: 1, start: '17:30' }, { blockId: 'b9', day: 1, start: '21:30' },
    { blockId: 'b2', day: 2, start: '06:15' }, { blockId: 'b3', day: 2, start: '10:00' }, { blockId: 'b4', day: 2, start: '11:00' }, { blockId: 'b8', day: 2, start: '16:00' },
    { blockId: 'b5', day: 3, start: '10:00' }, { blockId: 'b6', day: 3, start: '19:30' },
    { blockId: 'b2', day: 4, start: '06:15' }, { blockId: 'b7', day: 4, start: '15:00' },
    { blockId: 'b10', day: 5, start: '10:00' },
  ],
  Joycation: [
    { blockId: 'b1', day: 1, start: '19:30' }, { blockId: 'b9', day: 1, start: '21:45' },
    { blockId: 'b8', day: 2, start: '10:00' }, { blockId: 'b3', day: 2, start: '12:00' }, { blockId: 'b7', day: 2, start: '16:00' },
    { blockId: 'b2', day: 3, start: '06:15' }, { blockId: 'b5', day: 3, start: '10:00' }, { blockId: 'b6', day: 3, start: '19:30' },
    { blockId: 'b4', day: 4, start: '11:00' }, { blockId: 'b7', day: 4, start: '15:00' },
    { blockId: 'b2', day: 5, start: '06:15' }, { blockId: 'b6', day: 5, start: '20:00' },
    { blockId: 'b10', day: 6, start: '10:00' },
  ],
}

// ─── Concierge desk (coach & concierge console) ────────────────────────────
// The concierge holds name, booking, dietary and schedule for a booked stay or visit: never
// raw clinical values. A home draw is a time and an address, not the test that was ordered.

export const RAVI = { name: 'Ravi Shankar', role: 'Concierge · Mumbai and South', initials: 'RS', tone: 'var(--ink-3)' }

export interface ConciergeBooking { id: string; memberId: string; member: string; what: string; where: string; when: string; note: string; alts: string[] }

export const CONCIERGE_BOOKINGS: ConciergeBooking[] = [
  { id: 'bk1', memberId: 'm_0175', member: 'Thomas Mathew', what: 'Savourcation · 3 nights', where: 'Joyspan House Chennai', when: 'Fri 12 Feb – Mon 15 Feb', note: 'Two guests · one vegetarian · arriving by road from Kochi', alts: ['Fri 19 Feb – Mon 22 Feb', 'Fri 26 Feb – Mon 1 Mar'] },
  { id: 'bk2', memberId: 'm_0256', member: 'Meenakshi Sundaram', what: 'Beautycation follow-up session · 90 min', where: 'Joyspan House Chennai', when: 'Sat 6 Feb · 10:00', note: 'Travelling from Madurai the evening before; asked for a ground-floor room', alts: ['Sat 6 Feb · 15:00', 'Sun 7 Feb · 10:00'] },
  { id: 'bk3', memberId: 'm_0221', member: 'Ananya Krishnan', what: 'Mindcation · 4 nights', where: 'Rishikesh', when: 'Thu 18 Feb – Mon 22 Feb', note: 'Travelling alone · wants a quiet room away from the river terrace', alts: ['Thu 25 Feb – Mon 1 Mar'] },
  { id: 'bk4', memberId: 'm_0001', member: 'Arjun Rao', what: 'Circle in person · Week 5', where: 'Fairmont Mumbai', when: 'Mon 1 Feb · 19:00', note: 'Flying in from Chennai that afternoon; Kavya joins', alts: [] },
]
/** Bookings already confirmed before tonight. */
export const CONFIRMED_AT_START = new Set(['bk4'])

export const PHLEBOTOMISTS = [
  { id: 'ph1', name: 'Sunita Kale', partner: 'Thyrocare', area: 'Mumbai West' },
  { id: 'ph2', name: 'Imran Shaikh', partner: 'Metropolis', area: 'Mumbai Central' },
  { id: 'ph3', name: 'Lakshmi Ravi', partner: 'Neuberg', area: 'Chennai' },
  { id: 'ph4', name: 'Harish Bhat', partner: 'Metropolis', area: 'Bengaluru' },
  { id: 'ph5', name: 'Kiran Desai', partner: 'Thyrocare', area: 'Ahmedabad' },
]
export const DRAW_SLOTS = ['Tonight · within 2 h', 'Fri 29 Jan · 06:30', 'Fri 29 Jan · 07:30', 'Sat 30 Jan · 06:30', 'Mon 1 Feb · 07:00']

export interface ConciergeDraw { id: string; memberId: string; member: string; city: string; reason: string; fasting: boolean; requested: string; by: string }
/** Home draws already on the desk. Draws the clinical portal orders tonight join them live. */
export const CONCIERGE_DRAWS: ConciergeDraw[] = [
  { id: 'hd1', memberId: 'm_0002', member: 'Kavya Rao', city: 'Chennai', reason: 'Day 23 interim panel', fasting: true, requested: '28 Jan · 06:40', by: 'Clinical team' },
  { id: 'hd2', memberId: 'm_0119', member: 'Vikram Patel', city: 'Ahmedabad', reason: 'Day 90 re-measure panel', fasting: true, requested: 'Fri 29 Jan · early morning', by: 'Re-measure window' },
  { id: 'hd3', memberId: 'm_0287', member: 'Leela Thomas', city: 'Chennai', reason: 'Re-measure panel · window open Day 76–90', fasting: true, requested: 'This week', by: 'Re-measure window' },
]
/** Kavya's draw was done this morning (the sign-off note says so). */
export const DRAWS_AT_START: Record<string, { status: 'at-lab'; phleb: string; slot: string; at: string }> = {
  hd1: { status: 'at-lab', phleb: 'Lakshmi Ravi · Neuberg', slot: 'Thu 28 Jan · 06:30', at: '06:40' },
}

export const PRE_ARRIVAL_STEPS = ['Airport or road transfer booked', 'Dietary note sent to the venue', 'Room and pillow preferences sent', 'Day 1 schedule shared with the guest', 'App, consents and pass checked with the guest']

export interface ConciergeArrival { id: string; memberId?: string; guest: string; cation: string; where: string; when: string; transfer: string; dietary: string; done: number[] }
export const CONCIERGE_ARRIVALS: ConciergeArrival[] = [
  { id: 'pa1', guest: 'Mr George Mathew', cation: 'Healthcation · 4 nights', where: 'Fairmont Mumbai', when: 'Tonight · 22:05 (flight delayed)', transfer: 'Re-time the car for the delayed flight', dietary: 'No shellfish', done: [1, 2, 4] },
  { id: 'pa2', memberId: 'm_0119', guest: 'Vikram Patel and Anjali Patel', cation: 'Lovecation · 3 nights', where: 'Udaipur', when: 'Sat 30 Jan · 12:40', transfer: 'Airport pick-up, AI 471', dietary: 'Vegetarian · Anjali, no mushroom', done: [0] },
  { id: 'pa3', memberId: 'm_0291', guest: 'Karthik Raman', cation: 'Healthcation · 4 nights', where: 'Fairmont Mumbai', when: 'Sun 31 Jan · 15:00', transfer: 'Road from Pune · own car, valet', dietary: 'No preference noted', done: [] },
]

export const TALK_SLOTS = ['Fri 29 Jan · 11:00', 'Fri 29 Jan · 17:30', 'Sat 30 Jan · 10:00', 'Mon 1 Feb · 12:00']
export const TALK_OUTCOMES = ['Booked the suggested ’cation', 'Continuing as a Circle member', 'Thinking it over · follow up in a week', 'Pausing after Day 90', 'Wants to talk it through with the coach first']
/** The Day 60 talk suggests the next step by the member's lowest term. */
export const NEXT_BY_TERM: Record<TermKey, { cation: string; where: string }> = {
  H: { cation: 'Healthcation', where: 'Fairmont Mumbai' },
  P: { cation: 'Mindcation', where: 'Rishikesh' },
  R: { cation: 'Lovecation', where: 'Udaipur' },
  F: { cation: 'Wealthcation', where: 'Fairmont Mumbai' },
  D: { cation: 'Savourcation', where: 'Joyspan House Chennai' },
  B: { cation: 'Sleepcation', where: 'Coimbatore' },
}
