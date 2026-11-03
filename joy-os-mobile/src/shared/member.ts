import type {
  AccessEvent,
  Action,
  Consent,
  IndexScore,
  LedgerEntry,
  Person,
} from './types'

// SPECIMEN DATA — not a real member (Memo p.11, p.18).
export const MEMBER = {
  id: 'm_0001',
  aiwoId: 'AIWO-7F3K-22Q9',
  firstName: 'Arjun',
  lastName: 'Rao',
  age: 52,
  city: 'Chennai',
  language: 'English',
  plan: 'Joy OS Plus',
  membership: 'Circle',
  household: 'The Rao household',
  dayOfLoop: 23,
  loopLength: 90,
  loopStarted: '2027-01-05',
  nextMeasure: '2027-04-05',
  cohort: 'AIWO Joyspan 2027 · Fairmont Mumbai',
  device: 'Oura Ring Gen 4',
  quietHours: '21:45 – 07:30',
  remainingLifeExpectancy: 30,
}

export const INDEX_HISTORY: IndexScore[] = [
  {
    id: 'ix_003',
    memberId: MEMBER.id,
    // Taken on site at the Joycation and signed by the physician before checkout.
    grade: 'clinical',
    method: 'v1.0',
    engineBuild: 'engine 1.0.4',
    takenOn: '2027-01-02',
    nextMeasure: '2027-04-05',
    terms: [
      { key: 'H', value: 71, band: 'steady', delta: 4 },
      { key: 'P', value: 84, band: 'steady', delta: 2 },
      { key: 'R', value: 77, band: 'steady', delta: 1 },
      { key: 'F', value: 62, band: 'uneven', delta: -4 },
      { key: 'D', value: 58, band: 'uneven', delta: 5 },
      { key: 'B', value: 24, band: 'steady', delta: -3 },
    ],
    gm: 69.8,
    lambda: 0.25,
    value: 64,
    band: 'uneven',
    lowestTerm: 'D',
    signedBy: 'Dr Meera Iyer',
  },
  {
    id: 'ix_002',
    memberId: MEMBER.id,
    grade: 'clinical',
    method: 'v1.0',
    engineBuild: 'engine 1.0.2',
    takenOn: '2026-10-04',
    nextMeasure: '2027-01-02',
    terms: [
      { key: 'H', value: 67, band: 'uneven' },
      { key: 'P', value: 82, band: 'steady' },
      { key: 'R', value: 76, band: 'steady' },
      { key: 'F', value: 66, band: 'uneven' },
      { key: 'D', value: 53, band: 'uneven' },
      { key: 'B', value: 27, band: 'steady' },
    ],
    gm: 68.1,
    lambda: 0.25,
    value: 61,
    band: 'uneven',
    lowestTerm: 'D',
    signedBy: 'Dr Meera Iyer',
  },
  {
    id: 'ix_001',
    memberId: MEMBER.id,
    grade: 'index',
    method: 'v1.0',
    engineBuild: 'engine 1.0.0',
    takenOn: '2026-07-06',
    nextMeasure: '2026-10-04',
    terms: [
      { key: 'H', value: 66, band: 'uneven' },
      { key: 'P', value: 79, band: 'steady' },
      { key: 'R', value: 74, band: 'steady' },
      { key: 'F', value: 64, band: 'uneven' },
      { key: 'D', value: 49, band: 'thin' },
      { key: 'B', value: 31, band: 'uneven' },
    ],
    gm: 65.5,
    lambda: 0.25,
    value: 58,
    band: 'uneven',
    lowestTerm: 'D',
  },
]

/**
 * History across methods (matches the web). The July 2026 baseline and the October measure
 * predate Method v1.0 (published 22 Oct 2026); they were scored with the pilot weights and are
 * shown as recorded, never recomputed.
 */
export const HISTORY_METHOD: Record<string, { method: string; pilot?: boolean }> = {
  ix_001: { method: 'v0.9 pilot', pilot: true },
  ix_002: { method: 'v0.9 pilot', pilot: true },
}
export const METHOD_V10_PUBLISHED = '2026-10-22'
/** The method a recorded measure was made with (the pilot for anything before v1.0). */
export const methodOf = (r: Pick<IndexScore, 'id' | 'method'>) => HISTORY_METHOD[r.id]?.method ?? r.method

/** The Day-90 re-measure specimen where the number went down (Memo p.18 screen 04). */
export const DAY90_SPECIMEN = {
  from: 64,
  to: 61,
  moved: [
    { key: 'F' as const, from: 62, to: 51 },
    { key: 'D' as const, from: 58, to: 60 },
    { key: 'H' as const, from: 71, to: 72 },
  ],
  sentence: 'Your Index moved from 64 to 61. Freedom fell after a heavy quarter at work. That is useful to know.',
  person: 'Dr Meera will call you on Thursday to plan the next ninety days.',
}

export const TODAY_ACTION: Action = {
  id: 'a_d_014',
  term: 'D',
  title: 'Ten minutes on the verandah with tea.',
  detail: 'Notice three things.',
  minutes: 10,
  timeOfDay: 'evening',
  shared: true,
  evidence: 'Savouring interventions raise positive affect (Bryant & Veroff, 2007).',
  why: 'Daily Pleasure is your lowest term. Your calendar is clear after 7 pm and Kavya is home.',
}

export const ACTION_LIBRARY: Action[] = [
  TODAY_ACTION,
  { id: 'a_d_002', term: 'D', title: 'Plan one pleasure for this evening.', detail: 'Put it in your calendar like a meeting.', minutes: 2, timeOfDay: 'morning', shared: false, evidence: 'Planned pleasant activities (behavioural activation).', why: 'Pleasure planned is pleasure kept.' },
  { id: 'a_r_007', term: 'R', title: 'Call one person you have not spoken to this month.', detail: 'Choose from your 15.', minutes: 10, timeOfDay: 'any', shared: false, evidence: 'Weak-tie contact predicts lower loneliness (UCLA-3).', why: 'Three people in your 15 have not been seen this month.' },
  { id: 'a_f_003', term: 'F', title: 'Write the No list.', detail: 'Three things to stop this quarter.', minutes: 10, timeOfDay: 'morning', shared: false, evidence: 'Autonomy satisfaction (BPNSFS).', why: 'Freedom fell after a heavy quarter.' },
  { id: 'a_p_005', term: 'P', title: 'Answer the Tomorrow Question.', detail: 'What would make tomorrow worth waking for?', minutes: 2, timeOfDay: 'evening', shared: false, evidence: 'Meaning presence (MLQ-P).', why: 'Weekly anchor for Purpose.' },
  { id: 'a_h_011', term: 'H', title: 'Five sit-to-stands, timed.', detail: 'Part of your capacity battery.', minutes: 2, timeOfDay: 'morning', shared: false, evidence: 'WHO ICOPE locomotor capacity.', why: 'Keeps your capacity reading current.' },
  { id: 'a_b_004', term: 'B', title: 'Begin the wind-down at 22:00.', detail: 'Lights low, phone in the basket.', minutes: 30, timeOfDay: 'evening', shared: true, evidence: 'CBT-I informed sleep hygiene.', why: 'Sleep regularity dipped this week.' },
]

export const LEDGER_TAGS = ['People', 'Food', 'Movement', 'Beauty', 'Learning', 'Rest', 'Nature', 'Music', 'Work', 'Faith']

export const LEDGER: LedgerEntry[] = [
  { id: 'l1', at: '2027-01-28T12:40', prompt: 1, tags: ['People', 'Food'], word: 'Lunch with Kavya' },
  { id: 'l2', at: '2027-01-28T16:15', prompt: 2, tags: ['Learning'] },
  { id: 'l3', at: '2027-01-27T21:30', prompt: 3, tags: ['Rest', 'Music'], word: 'MS Subbulakshmi' },
  { id: 'l4', at: '2027-01-27T12:41', prompt: 1, tags: ['People'] },
  { id: 'l5', at: '2027-01-26T16:20', prompt: 2, tags: ['Nature', 'Movement'], word: 'Beach walk', photo: true },
  { id: 'l6', at: '2027-01-26T21:32', prompt: 3, tags: ['Food', 'People'] },
  { id: 'l7', at: '2027-01-25T12:39', prompt: 1, tags: ['Beauty'] },
]

/** Joy moments per tag, this week — feeds "this week, joy came most from". */
// Tag counts of the seed LEDGER above (seven entries, 25 to 28 Jan), so the weekly bars and
// the Ledger list agree. One entry can carry several tags, so these add up to more than 7.
export const LEDGER_WEEK = [
  { tag: 'People', count: 3 },
  { tag: 'Food', count: 2 },
  { tag: 'Beauty', count: 1 },
  { tag: 'Learning', count: 1 },
  { tag: 'Movement', count: 1 },
  { tag: 'Music', count: 1 },
  { tag: 'Nature', count: 1 },
  { tag: 'Rest', count: 1 },
]

export const TEAM: Person[] = [
  { id: 'p_priya', name: 'Priya Natarajan', role: 'Coach', initials: 'PN', tone: 'var(--term-r)' },
  { id: 'p_meera', name: 'Dr Meera Iyer', role: 'Physician', initials: 'MI', tone: 'var(--term-h)' },
  { id: 'p_sanjay', name: 'Dr Sanjay Menon', role: 'Psychologist', initials: 'SM', tone: 'var(--term-b)' },
  { id: 'p_ravi', name: 'Ravi Shankar', role: 'Concierge', initials: 'RS', tone: 'var(--term-f)' },
]

export const HOUSEHOLD: Person[] = [
  { id: 'h_arjun', name: 'Arjun Rao', role: 'You', initials: 'AR', tone: 'var(--term-f)' },
  { id: 'h_kavya', name: 'Kavya Rao', role: 'Partner', initials: 'KR', tone: 'var(--term-p)' },
  { id: 'h_lakshmi', name: 'Lakshmi Rao', role: 'Mother · elder mode', initials: 'LR', tone: 'var(--term-h)' },
]

export const CONSENTS: Consent[] = [
  { id: 'c_care', name: 'Care', purpose: 'Use my data to look after me', scope: 'core', granted: true, since: '2026-07-06' },
  { id: 'c_data', name: 'Data', purpose: 'Keep my record and signals', scope: 'core', granted: true, since: '2026-07-06' },
  { id: 'c_pub', name: 'Publishing', purpose: 'Include me in aggregate, de-identified results', scope: 'cohort', granted: true, since: '2026-07-06' },
  { id: 'c_oura', name: 'Oura via Terra', purpose: 'Sleep, HRV and resting HR for Body, Pleasure and Ease', scope: 'device', granted: true, since: '2026-07-07' },
  { id: 'c_hk', name: 'Apple Health', purpose: 'Steps, workouts, VO₂max; write back mindful minutes', scope: 'device', granted: true, since: '2026-07-07' },
  { id: 'c_cal', name: 'Google Calendar', purpose: 'Time audit and planned pleasures — summarised, then discarded', scope: 'calendar', granted: true, since: '2027-01-10' },
  { id: 'c_wa', name: 'WhatsApp', purpose: 'Joy Ledger prompts and reminders', scope: 'whatsapp', granted: false },
  { id: 'c_star', name: 'Star Health (insurer)', purpose: 'Aggregate outcomes only, never individual', scope: 'partner', granted: false },
]

export const ACCESS_LOG: AccessEvent[] = [
  { id: 'e1', at: '2027-01-27 18:02', who: 'Priya Natarajan', role: 'Coach', what: 'Quarter digest, Ledger counts', purpose: 'Weekly review (Day 15 · 45)' },
  { id: 'e2', at: '2027-01-24 10:15', who: 'Dr Meera Iyer', role: 'Physician', what: 'Biomarker vault, LE8', purpose: 'Clinical grade sign-off' },
  { id: 'e3', at: '2027-01-20 09:00', who: 'Index engine', role: 'System', what: 'Instrument answers', purpose: 'Score computation · method v1.0' },
  { id: 'e4', at: '2027-01-18 14:44', who: 'Ravi Shankar', role: 'Concierge', what: 'Name, booking, dietary note', purpose: 'Savourcation pre-arrival' },
  { id: 'e5', at: '2027-01-12 11:30', who: 'Science Office', role: 'Research', what: 'De-identified six-term record', purpose: 'Cohort aggregate (Publishing consent)' },
]
