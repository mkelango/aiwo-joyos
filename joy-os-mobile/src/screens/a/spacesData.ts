// Ported from joy-os-web/src/routes/member/spaces/_data.ts (Lane A). SPECIMEN — not a real member.
import type { Action, TermKey } from '@/shared/types'
import { ACTION_LIBRARY, INDEX_HISTORY, TODAY_ACTION } from '@/shared/member'

// SPECIMEN DATA for the six spaces — not a real member (Memo p.19).
// Everything a space needs beyond the shared specimens lives here so the
// shared data layer stays untouched.

/** "Today" for the specimen member: Day 23 of the loop that started 5 Jan 2027. */
export const SPACE_TODAY = '2027-01-28'

/** SPACE_TODAY's weekday, Monday = 0 (28 Jan 2027 is a Thursday). Matches Today's TODAY_INDEX. */
export const SPACE_TODAY_INDEX = 3

/** A date-only ISO string ('YYYY-MM-DD') as a local Date, so no timezone shifts the day. */
export function localDay(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Plain-word names for the six rooms (the hub speaks in these, not in jargon). */
export const ROOM_PLAIN: Record<TermKey, string> = {
  H: 'How your body carries you',
  P: 'What you get up for',
  R: 'Who you would call',
  F: 'Whose time it is',
  D: 'What you notice, and keep',
  B: 'What you can put down',
}

export const ROOM_VERDICT: Record<TermKey, string> = {
  H: 'Your body is steady and rising. Sleep and vitamin D are the two things worth watching.',
  P: 'Purpose is your strongest term. Keep the anchors small and daily.',
  R: 'Your people are steady. Three in your fifteen have not been seen this month.',
  F: 'Freedom fell after a heavy quarter. Most of your week belonged to other people.',
  D: 'Daily Pleasure is your lowest term, and the one rising fastest. Start here.',
  B: 'Burden is easing. Sleep is the heaviest part of what is left.',
}

// ─── 90-day history ────────────────────────────────────────────────────────

/** Weekly short-form pulse across the last ninety days, ending on the specimen today (SPACE_TODAY). */
export function termHistory(key: TermKey) {
  const cur = INDEX_HISTORY[0].terms.find((t) => t.key === key)!.value ?? 0
  const prev = INDEX_HISTORY[1].terms.find((t) => t.key === key)!.value ?? cur
  const seed = key.charCodeAt(0)
  const end = localDay(SPACE_TODAY)
  return Array.from({ length: 14 }, (_, i) => {
    const p = i / 13
    // The ends are the two measured scores (so the line agrees with the delta); weeks between wobble.
    const wobble = i === 0 || i === 13 ? 0 : Math.round(Math.sin(seed * 1.7 + i * 1.3) * 1.6)
    // Local constructor (not ms arithmetic) so the last point is today in every timezone.
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (13 - i) * 7)
    return {
      label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      value: Math.round(prev + (cur - prev) * p + wobble),
    }
  })
}

// ─── Three actions per term (ACTION_LIBRARY first, then our own) ───────────
// Today's one action is never offered again here: planning it would only repeat it on Today.
// Action sizes are 2, 10 or 30 minutes (shared Action type), so each title names its own size.

const OWN_ACTIONS: Action[] = [
  { id: 'a_h_021', term: 'H', title: 'Walk after dinner for thirty minutes.', detail: 'With Kavya if she is free.', minutes: 30, timeOfDay: 'evening', shared: true, evidence: 'Post-meal walking lowers glucose excursions (LE8 · blood glucose).', why: 'HbA1c is at the edge of its range.' },
  { id: 'a_h_027', term: 'H', title: 'Ten minutes of morning sun.', detail: 'Arms and face, before 10 am.', minutes: 10, timeOfDay: 'morning', shared: false, evidence: 'Sun exposure supports vitamin D status; your physician advises on supplements.', why: 'Vitamin D was below range in January.' },
  { id: 'a_p_009', term: 'P', title: 'Write one line in the contribution log.', detail: 'Who did your work help today?', minutes: 2, timeOfDay: 'evening', shared: false, evidence: 'Prosocial contribution and meaning in life (MLQ-P).', why: 'Contribution is the quietest part of your Ikigai map.' },
  { id: 'a_p_012', term: 'P', title: 'Spend ten minutes learning something new.', detail: 'Stay Curious, Practice week 7.', minutes: 10, timeOfDay: 'any', shared: false, evidence: 'Curiosity predicts meaning presence (Kashdan & Steger).', why: 'Keeps the daily anchors alive.' },
  { id: 'a_r_011', term: 'R', title: 'Plan State of Us for Sunday.', detail: 'Twenty minutes, phones away.', minutes: 2, timeOfDay: 'any', shared: true, evidence: 'Weekly couple rituals (Gottman, “State of the Union”).', why: 'Your last State of Us was eleven days ago.' },
  { id: 'a_r_014', term: 'R', title: 'Send one voice note to someone in your 5.', detail: 'Not a forward. Your own voice.', minutes: 2, timeOfDay: 'any', shared: false, evidence: 'Close-tie contact and perceived support (LSNS-6).', why: 'Your 5 hold the most weight in your score.' },
  { id: 'a_f_007', term: 'F', title: 'Block one hour on Thursday that is yours.', detail: 'Name it. Defend it like a board meeting.', minutes: 2, timeOfDay: 'morning', shared: false, evidence: 'Time affluence and autonomy (Whillans; BPNSFS).', why: 'Nearly half of last fortnight was asked of you.' },
  { id: 'a_f_010', term: 'F', title: 'Schedule the succession conversation.', detail: 'Thirty minutes, with Kavya and your adviser.', minutes: 10, timeOfDay: 'any', shared: true, evidence: 'Choice and peace of mind (Freedom Triad · Choice).', why: 'It is the open item on your peace-of-mind list.' },
  { id: 'a_d_019', term: 'D', title: 'Savour one meal without a screen.', detail: 'Name the three best flavours.', minutes: 30, timeOfDay: 'any', shared: true, evidence: 'Sensory sharpening raises savouring (Bryant).', why: 'Food is your second-largest source of joy this week.' },
  { id: 'a_d_023', term: 'D', title: 'Listen to one raga all the way through.', detail: 'Headphones on, nothing else open.', minutes: 10, timeOfDay: 'evening', shared: false, evidence: 'Absorption deepens savouring (Bryant & Veroff).', why: 'Music is a quiet, steady joy in your Ledger.' },
  { id: 'a_b_009', term: 'B', title: 'Write the second arrow down.', detail: 'The problem, and the extra you are adding.', minutes: 10, timeOfDay: 'evening', shared: false, evidence: 'Cognitive defusion (ACT; Hayes).', why: 'Stress is your second-largest Burden part.' },
  { id: 'a_b_012', term: 'B', title: 'Move one “keep meaning to” item to done.', detail: 'The smallest one.', minutes: 10, timeOfDay: 'any', shared: false, evidence: 'Behavioural activation reduces avoidance.', why: 'Avoidance is small, but it is there.' },
]

export function actionsFor(key: TermKey): Action[] {
  const lib = ACTION_LIBRARY.filter((a) => a.term === key && a.id !== TODAY_ACTION.id)
  return [...lib, ...OWN_ACTIONS.filter((a) => a.term === key)].slice(0, 3)
}

/** A specimen VIVA draft per space — drafted by VIVA, a person signs. */
export const VIVA_DRAFT: Record<TermKey, { tool: string; ask: string; draft: string; reviewer: string } | null> = {
  H: { tool: 'explain_biomarker', ask: 'What is ApoB, in plain words?', draft: 'ApoB counts the particles that carry cholesterol in your blood. Yours is 92 mg/dL; the lab range is under 90. It is one number among several, and Dr Meera will talk it through with you at your panel review on 4 Feb. VIVA does not diagnose.', reviewer: 'Reviewed by Dr Meera Iyer' },
  P: { tool: 'ikigai_coach', ask: 'Help me make my daily anchors smaller.', draft: 'Your three anchors are good ones. “Teach the interns every Friday” could become “answer one intern question a day”. Small enough that a busy day cannot take it away.', reviewer: 'Coach Priya sees this in your digest' },
  R: { tool: 'couples_prompt', ask: 'Give us a State of Us prompt for this week.', draft: 'Each of you, separately: name one moment this week when you felt your partner was on your side. Then say it out loud to them, without explaining it.', reviewer: 'Never reveals one partner to the other' },
  F: { tool: 'time_audit_summary', ask: 'Summarise my time audit.', draft: 'Over two weeks, a little over a quarter of your planned hours were yours. Nearly half were asked of you by others, mostly in Tuesday and Wednesday meetings. Weekends were largely your own.', reviewer: 'Calendar entries discarded · totals only · never financial advice' },
  D: { tool: 'ledger_weekly_story', ask: 'Where did joy come from this week?', draft: 'This week joy came mostly from people and food, usually around lunch. Evenings were quieter than last week.', reviewer: 'Two sentences · from your Ledger only' },
  B: null,
}

// ─── Body ──────────────────────────────────────────────────────────────────

export const DEVICES = [
  { id: 'oura', name: 'Oura Ring Gen 4', via: 'via Terra', status: 'connected' as const, last: 'Synced 06:12 today', reads: 'Sleep, HRV, resting heart rate, temperature' },
  { id: 'hk', name: 'Apple Health', via: 'HealthKit', status: 'connected' as const, last: 'Synced 07:40 today', reads: 'Steps, workouts, VO₂max · writes mindful minutes' },
  { id: 'hc', name: 'Health Connect', via: 'Android', status: 'available' as const, last: 'Not linked', reads: 'For an Android phone' },
  { id: 'whoop', name: 'WHOOP', via: 'via Terra', status: 'available' as const, last: 'Not linked', reads: 'Strain, recovery features only' },
]

export type Le8Status = 'ideal' | 'good' | 'watch'
export const LE8 = [
  { key: 'diet', name: 'Diet', score: 70, status: 'good' as Le8Status, reading: 'MEPA 11 of 16', source: 'Self-report' },
  { key: 'activity', name: 'Physical activity', score: 90, status: 'ideal' as Le8Status, reading: '165 min / week', source: 'Apple Health' },
  { key: 'nicotine', name: 'Nicotine exposure', score: 100, status: 'ideal' as Le8Status, reading: 'Never', source: 'Self-report' },
  { key: 'sleep', name: 'Sleep health', score: 70, status: 'good' as Le8Status, reading: '6 h 40 m average', source: 'Oura' },
  { key: 'bmi', name: 'Body mass index', score: 70, status: 'good' as Le8Status, reading: '26.1 kg/m²', source: 'Clinic' },
  { key: 'lipids', name: 'Blood lipids', score: 60, status: 'watch' as Le8Status, reading: 'Non-HDL 146 mg/dL', source: 'Panel · Jan' },
  { key: 'glucose', name: 'Blood glucose', score: 60, status: 'watch' as Le8Status, reading: 'HbA1c 5.8%', source: 'Panel · Jan' },
  { key: 'bp', name: 'Blood pressure', score: 75, status: 'good' as Le8Status, reading: '128 / 82 mmHg', source: 'Home cuff' },
]

export type MarkerStatus = 'in range' | 'worth watching' | 'outside range'
export interface Marker {
  name: string
  panel: 'Metabolic' | 'Lipids' | 'Inflammation' | 'Vitamins' | 'Kidney & liver' | 'Blood & thyroid'
  value: number
  unit: string
  range: string
  prev: number | null
  status: MarkerStatus
  plain: string
}

export const BIOMARKERS: Marker[] = [
  { name: 'HbA1c', panel: 'Metabolic', value: 5.8, unit: '%', range: '< 5.7', prev: 5.9, status: 'worth watching', plain: 'Your average blood sugar over about three months.' },
  { name: 'Fasting glucose', panel: 'Metabolic', value: 98, unit: 'mg/dL', range: '70 – 99', prev: 102, status: 'in range', plain: 'Blood sugar after an overnight fast.' },
  { name: 'Fasting insulin', panel: 'Metabolic', value: 9.4, unit: 'µIU/mL', range: '2 – 20', prev: 11.2, status: 'in range', plain: 'How hard your body works to keep sugar steady.' },
  { name: 'LDL cholesterol', panel: 'Lipids', value: 118, unit: 'mg/dL', range: '< 100', prev: 124, status: 'worth watching', plain: 'Cholesterol carried by low-density particles.' },
  { name: 'ApoB', panel: 'Lipids', value: 92, unit: 'mg/dL', range: '< 90', prev: 96, status: 'worth watching', plain: 'The number of particles that carry cholesterol.' },
  { name: 'HDL cholesterol', panel: 'Lipids', value: 46, unit: 'mg/dL', range: '> 40', prev: 44, status: 'in range', plain: 'Cholesterol carried back to the liver.' },
  { name: 'Triglycerides', panel: 'Lipids', value: 142, unit: 'mg/dL', range: '< 150', prev: 161, status: 'in range', plain: 'Fats in the blood, sensitive to sugar and alcohol.' },
  { name: 'Lp(a)', panel: 'Lipids', value: 38, unit: 'nmol/L', range: '< 75', prev: null, status: 'in range', plain: 'A largely inherited lipid particle; measured once.' },
  { name: 'hs-CRP', panel: 'Inflammation', value: 1.4, unit: 'mg/L', range: '< 2.0', prev: 2.3, status: 'in range', plain: 'A sensitive sign of low-grade inflammation.' },
  { name: 'Homocysteine', panel: 'Inflammation', value: 11.2, unit: 'µmol/L', range: '< 15', prev: 12.0, status: 'in range', plain: 'An amino acid linked to B-vitamin status.' },
  { name: 'Vitamin D (25-OH)', panel: 'Vitamins', value: 24, unit: 'ng/mL', range: '30 – 100', prev: 19, status: 'outside range', plain: 'Made in skin with sunlight; stored in the body.' },
  { name: 'Vitamin B12', panel: 'Vitamins', value: 410, unit: 'pg/mL', range: '200 – 900', prev: 380, status: 'in range', plain: 'Needed for nerves and red blood cells.' },
  { name: 'Ferritin', panel: 'Vitamins', value: 120, unit: 'ng/mL', range: '30 – 400', prev: 132, status: 'in range', plain: 'Your body’s iron store.' },
  { name: 'eGFR', panel: 'Kidney & liver', value: 88, unit: 'mL/min/1.73m²', range: '> 60', prev: 90, status: 'in range', plain: 'How well the kidneys filter, estimated.' },
  { name: 'Creatinine', panel: 'Kidney & liver', value: 0.98, unit: 'mg/dL', range: '0.7 – 1.3', prev: 0.96, status: 'in range', plain: 'A waste product the kidneys clear.' },
  { name: 'ALT', panel: 'Kidney & liver', value: 31, unit: 'U/L', range: '< 41', prev: 38, status: 'in range', plain: 'A liver enzyme.' },
  { name: 'Uric acid', panel: 'Kidney & liver', value: 6.4, unit: 'mg/dL', range: '3.5 – 7.2', prev: 6.8, status: 'in range', plain: 'A breakdown product; high levels can cause gout.' },
  { name: 'Haemoglobin', panel: 'Blood & thyroid', value: 14.2, unit: 'g/dL', range: '13 – 17', prev: 14.0, status: 'in range', plain: 'Carries oxygen in red blood cells.' },
  { name: 'TSH', panel: 'Blood & thyroid', value: 2.1, unit: 'mIU/L', range: '0.4 – 4.0', prev: 2.4, status: 'in range', plain: 'The signal that runs the thyroid.' },
]

export const PANEL_META = { drawn: '2027-01-21', signed: '2027-01-24', signedBy: 'Dr Meera Iyer', lab: 'AIWO panel · NABL-accredited partner lab', previous: '2026-10-03' }

export const CAPACITY = [
  { key: 'grip', name: 'Grip strength', unit: 'kg', last: 38, prev: 36, better: 'higher', how: 'Dominant hand, best of three squeezes, elbow at 90°.', norm: 'Typical for men in their fifties: 36 – 44 kg' },
  { key: 'sts', name: '5× sit-to-stand', unit: 's', last: 10.8, prev: 11.6, better: 'lower', how: 'Arms crossed, stand fully five times from a firm chair, as quickly as is safe.', norm: 'Under 12 s is the WHO ICOPE screen' },
  { key: 'gait', name: 'Gait speed', unit: 'm/s', last: 1.12, prev: 1.08, better: 'higher', how: 'Walk 4 metres at your usual pace. We divide 4 by your time.', norm: 'Above 1.0 m/s is the usual line' },
] as const

/**
 * 28 days of signal features (not vendor scores), from Fri 1 Jan 2027. i % 7 === 1 is a Saturday
 * (HRV dips and resting HR bumps after late dinners); i % 7 === 2 is a Sunday (late nights cut regularity).
 */
export const SIGNALS = Array.from({ length: 28 }, (_, i) => {
  const d = new Date(2027, 0, 1 + i)
  return {
    label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    hrv: Math.round(38 + i * 0.18 + Math.sin(i * 0.9) * 4 + (i % 7 === 1 ? -6 : 0)),
    rhr: Math.round((60 - i * 0.06 + Math.cos(i * 0.8) * 1.6 + (i % 7 === 1 ? 3 : 0)) * 10) / 10,
    regularity: Math.round(78 + Math.sin(i * 0.6) * 6 - (i > 20 ? 7 : 0) + (i % 7 === 2 ? -5 : 0)),
  }
})

// ─── Purpose ───────────────────────────────────────────────────────────────

export const IKIGAI_START = {
  direction: 'Build a teaching practice that outlives the firm: forty young engineers who can run a plant better than I did.',
  contribution: 'Make it easier for the next generation in Chennai to start something honest.',
  anchors: ['Morning walk on Besant Nagar beach', 'Teach the interns every Friday', 'Carnatic music with Amma on Sundays'],
}

/** One kept Tomorrow Question answer. `id` keys the row (answers kept before ids existed have none). */
export interface TomorrowAnswer { id?: string; week: number; date: string; text: string }

export const TOMORROW_ANSWERS: TomorrowAnswer[] = [
  { id: 't3', week: 3, date: '2027-01-24', text: 'Sitting with Ishaan to review his plant layout before he presents it.' },
  { id: 't2', week: 2, date: '2027-01-17', text: 'Taking Amma to the Music Academy for the morning concert.' },
  { id: 't1', week: 1, date: '2027-01-10', text: 'The first walk after the Summit, with nothing to prove.' },
]

export const STATEMENT_START = 'In twenty-five years I will be seventy-seven. I want to be the person younger engineers in this city call before a hard decision. I want Kavya and I to still be walking the beach in the mornings, slower, still arguing about music. I want the plant to run without me, and the people I trained to be training others. I want to have said the things I meant to say to my mother while she could hear them.'

export const CONTRIBUTIONS = [
  { id: 'c1', date: '2027-01-27', what: 'Reviewed Ishaan’s plant-layout deck', who: 'Ishaan, graduate engineer' },
  { id: 'c2', date: '2027-01-25', what: 'Introduced Farah to a supplier in Hosur', who: 'Farah, circle member' },
  { id: 'c3', date: '2027-01-21', what: 'Taught the Friday safety session', who: 'Twelve interns' },
  { id: 'c4', date: '2027-01-14', what: 'Funded the school library shelf', who: 'Kalakshetra Colony school' },
]

// ─── People ────────────────────────────────────────────────────────────────

export interface CirclePerson { id: string; name: string; ring: 5 | 15; seen: boolean; note?: string }
export const CIRCLE_START: CirclePerson[] = [
  { id: 'k', name: 'Kavya', ring: 5, seen: true, note: 'Partner' },
  { id: 'a', name: 'Amma', ring: 5, seen: true, note: 'Mother' },
  { id: 'n', name: 'Nandini', ring: 5, seen: true, note: 'Daughter · Bengaluru' },
  { id: 's', name: 'Suresh', ring: 5, seen: true, note: 'Oldest friend' },
  { id: 'r', name: 'Ravi', ring: 5, seen: true, note: 'Brother' },
  { id: 'i', name: 'Ishaan', ring: 15, seen: true },
  { id: 'f', name: 'Farah', ring: 15, seen: true },
  { id: 'm', name: 'Mohan', ring: 15, seen: false },
  { id: 'p', name: 'Padma', ring: 15, seen: true },
  { id: 'v', name: 'Vikram', ring: 15, seen: true },
  { id: 'g', name: 'Geetha', ring: 15, seen: false },
  { id: 'd', name: 'Deepak', ring: 15, seen: true },
  { id: 'l', name: 'Lata', ring: 15, seen: true },
  { id: 'j', name: 'Joseph', ring: 15, seen: false },
  { id: 'h', name: 'Hari', ring: 15, seen: true },
]

export const TWO_AM_START = ['Kavya', 'Ravi', 'Suresh', 'Dr Meera Iyer']

export const STATE_OF_US = [
  { minutes: 5, title: 'Appreciations', prompt: 'Each of you names three things the other did this week that you noticed and liked. Specific, not general.' },
  { minutes: 5, title: 'What is working', prompt: 'One thing about the week, the house or the two of you that went well. Say why it worked.' },
  { minutes: 5, title: 'One thing that was hard', prompt: 'The speaker uses “I feel… about… and I need…”. The listener only reflects back. No fixing yet.' },
  { minutes: 5, title: 'Next week', prompt: 'One thing each of you would like next week. Put a date in the People space if it is a date.' },
]

/** Couples Check: only agreement is shown, never who said what. */
export const COUPLES_CHECK = [
  { area: 'How we spend weekends', agree: true },
  { area: 'Time with our families', agree: true },
  { area: 'How we handle money worries', agree: false },
  { area: 'How often we have fun together', agree: false },
  { area: 'Feeling heard in an argument', agree: true },
  { area: 'Plans for the next ten years', agree: true },
  { area: 'Affection and touch', agree: true },
  { area: 'Who carries the household load', agree: false },
]

export const CONNECTIONS = [
  { id: 'cx1', title: 'Connections salon · Food & memory', when: 'Thu 4 Mar · 19:30', where: 'Adyar, Chennai', who: 'Twelve members · hosted by Ravi Shankar', kind: 'Salon' },
  { id: 'cx2', title: 'Sunrise walk · Elliot’s Beach', when: 'Sun 7 Feb · 06:15', where: 'Besant Nagar', who: 'Eight members of the Fairmont cohort', kind: 'Walk' },
  { id: 'cx3', title: 'Couples supper · Lovecation alumni', when: 'Sat 20 Feb · 20:00', where: 'Joyspan House Chennai', who: 'Six couples', kind: 'Supper' },
]

// ─── Freedom ───────────────────────────────────────────────────────────────

export const TIME_KINDS = [
  { key: 'mine', label: 'Yours', note: 'Chosen by you, for you', color: 'var(--term-f)' },
  { key: 'chosenWork', label: 'Work you chose', note: 'Deep work you planned', color: 'var(--term-f-ink)' },
  { key: 'asked', label: 'Asked of you', note: 'Meetings and requests from others', color: 'var(--ink-3)' },
  { key: 'admin', label: 'Obligation', note: 'Travel, admin, errands', color: 'var(--line-strong)' },
] as const

export const TIME_AUDIT = [
  ['Mon 11', 2.0, 2.5, 7.5, 2.0], ['Tue 12', 1.5, 1.0, 9.5, 2.0], ['Wed 13', 1.0, 1.5, 9.0, 2.5], ['Thu 14', 2.0, 3.0, 6.5, 2.0],
  ['Fri 15', 2.5, 2.0, 6.0, 2.5], ['Sat 16', 8.0, 0.5, 1.5, 3.0], ['Sun 17', 9.0, 0.0, 1.0, 2.0],
  ['Mon 18', 1.5, 2.0, 8.5, 2.0], ['Tue 19', 1.0, 1.0, 10.0, 2.0], ['Wed 20', 1.5, 2.0, 8.5, 2.0], ['Thu 21', 2.0, 2.5, 7.0, 2.5],
  ['Fri 22', 3.0, 2.0, 5.5, 2.5], ['Sat 23', 7.0, 1.0, 2.0, 3.0], ['Sun 24', 9.5, 0.0, 0.5, 2.0],
].map(([day, mine, chosenWork, asked, admin]) => ({ day: day as string, mine: mine as number, chosenWork: chosenWork as number, asked: asked as number, admin: admin as number }))

export const NO_SUGGESTIONS = ['Saying yes to every Tuesday review', 'Checking email after 21:00', 'Board calls on Sundays', 'Weddings I do not want to attend', 'Being the default for every vendor escalation', 'The second coffee meeting of the day']

export const PEACE_OF_MIND = [
  { id: 'will', title: 'A registered will', detail: 'Drafted with your lawyer and registered. Executor named and told.', done: true },
  { id: 'directive', title: 'A health directive', detail: 'Who decides for you if you cannot, and what you would want. Shared with Dr Meera.', done: true },
  { id: 'nominees', title: 'Nominees on every account and policy', detail: 'A list of what exists, not of values. Your adviser holds the details.', done: false },
  { id: 'succession', title: 'The succession conversation', detail: 'With Kavya and Nandini: the firm, the house, Amma’s care. Thirty minutes is a start.', done: false },
  { id: 'where', title: 'Where everything is', detail: 'One page that says where the papers and passwords live. Not the passwords themselves.', done: true },
]

// ─── Pleasure ──────────────────────────────────────────────────────────────

export const PLANNED_START = [
  { id: 'pp1', day: 'Mon', time: '19:30', what: 'Tea on the verandah with Kavya', minutes: 10, with: 'Kavya' },
  { id: 'pp2', day: 'Tue', time: '13:00', what: 'Lunch at Murugan Idli, alone with a book', minutes: 30, with: '' },
  { id: 'pp3', day: 'Wed', time: '18:30', what: 'Play the veena for fifteen minutes', minutes: 15, with: '' },
]

export const SAVOURING_PROMPTS = [
  { kind: 'Sensory sharpening', text: 'At your next meal, close your eyes for the first mouthful. Name three flavours before you open them.' },
  { kind: 'Sharing with others', text: 'Tell someone tonight about one good moment from today, in more detail than feels necessary.' },
  { kind: 'Memory building', text: 'Take a mental photograph: pause for ten seconds and tell yourself “I want to remember this.”' },
  { kind: 'Absorption', text: 'Choose one song you love. Listen to the whole of it doing nothing else.' },
  { kind: 'Counting blessings', text: 'Before sleep, name one thing from today that you would be sorry to have missed.' },
  { kind: 'Temporal awareness', text: 'Notice something that will not last: the light at 18:10, a grandchild’s height. Stay with it a moment longer.' },
]

export const FILMS = [
  { id: 'f1', title: 'The first filter coffee', who: 'Lakshmi, 81 · Mylapore', minutes: '2:40', note: 'She has made it the same way for sixty years. She tells you why it still matters.' },
  { id: 'f2', title: 'Sunday cricket, age 63', who: 'Thomas · Kochi', minutes: '3:15', note: 'Twelve friends, one maidan, no scores kept.' },
  { id: 'f3', title: 'The last stretch of the backwaters', who: 'Deepa & Arun · Alleppey', minutes: '1:58', note: 'A Savourcation couple, twenty minutes before sunset.' },
  { id: 'f4', title: 'Learning the tabla at 55', who: 'Farah · Pune', minutes: '4:02', note: 'She is not good yet. That is the point.' },
]

// ─── Ease ──────────────────────────────────────────────────────────────────

export type EaseScreen = 'PHQ-4' | 'ISI' | 'PSS-4' | 'Pain'
export const SCREEN_META: Record<EaseScreen, { max: number; what: string; cadence: string; bands: { upTo: number; label: string; copy: string; route: boolean }[] }> = {
  'PHQ-4': {
    max: 12, what: 'Mood and worry, last two weeks', cadence: 'Every two weeks',
    bands: [
      { upTo: 2, label: 'Usual range', copy: 'Your answers are within the usual range.', route: false },
      { upTo: 5, label: 'Mild', copy: 'Your answers suggest mild distress. We will ask again in two weeks.', route: false },
      { upTo: 8, label: 'Moderate', copy: 'Your answers suggest moderate distress. A clinician will review them within 48 hours.', route: true },
      { upTo: 12, label: 'Severe', copy: 'Your answers suggest severe distress. A clinician will call you today.', route: true },
    ],
  },
  ISI: {
    max: 28, what: 'Insomnia severity, last two weeks', cadence: 'Every two weeks',
    bands: [
      { upTo: 7, label: 'No clinically significant insomnia', copy: 'Your answers do not suggest clinically significant insomnia.', route: false },
      { upTo: 14, label: 'Subthreshold', copy: 'Your answers suggest some difficulty with sleep. The sleep plan is a good place to start.', route: false },
      { upTo: 21, label: 'Moderate', copy: 'Your answers suggest moderate insomnia. A clinician will review them within 48 hours.', route: true },
      { upTo: 28, label: 'Severe', copy: 'Your answers suggest severe insomnia. A clinician will review them within 48 hours.', route: true },
    ],
  },
  'PSS-4': {
    max: 16, what: 'Perceived stress, last month', cadence: 'Monthly',
    bands: [
      { upTo: 5, label: 'Lower', copy: 'Your answers suggest lower perceived stress.', route: false },
      { upTo: 10, label: 'Moderate', copy: 'Your answers suggest moderate perceived stress.', route: false },
      { upTo: 16, label: 'Higher', copy: 'Your answers suggest higher perceived stress. Your coach will be in touch this week.', route: false },
    ],
  },
  Pain: {
    max: 10, what: 'Average pain, last week (0 – 10)', cadence: 'Weekly',
    bands: [
      { upTo: 0, label: 'None', copy: 'You reported no pain.', route: false },
      { upTo: 3, label: 'Mild', copy: 'You reported mild pain.', route: false },
      { upTo: 6, label: 'Moderate', copy: 'You reported moderate pain. Your physician will see this at your next review.', route: false },
      { upTo: 10, label: 'Severe', copy: 'You reported severe pain. Your physician will review it within 48 hours.', route: true },
    ],
  },
}

export const SCREEN_HISTORY: Record<EaseScreen, { date: string; score: number }[]> = {
  'PHQ-4': [{ date: '2026-07-06', score: 6 }, { date: '2026-10-04', score: 5 }, { date: '2027-01-02', score: 4 }, { date: '2027-01-16', score: 3 }],
  ISI: [{ date: '2026-07-06', score: 15 }, { date: '2026-10-04', score: 13 }, { date: '2027-01-02', score: 11 }, { date: '2027-01-16', score: 11 }],
  'PSS-4': [{ date: '2026-07-06', score: 9 }, { date: '2026-10-04', score: 8 }, { date: '2027-01-02', score: 7 }],
  Pain: [{ date: '2027-01-09', score: 3 }, { date: '2027-01-16', score: 2 }, { date: '2027-01-23', score: 2 }],
}

export const PHQ4_ITEMS = [
  'Feeling nervous, anxious or on edge',
  'Not being able to stop or control worrying',
  'Little interest or pleasure in doing things',
  'Feeling down, depressed or hopeless',
]
export const PHQ4_OPTIONS = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']

export const BURDEN_PARTS = [
  { key: 'Mood', weight: 0.3, value: 22 },
  { key: 'Sleep', weight: 0.25, value: 34 },
  { key: 'Stress', weight: 0.2, value: 29 },
  { key: 'Pain', weight: 0.15, value: 14 },
  { key: 'Avoidance', weight: 0.1, value: 12 },
]

export const WIND_DOWN = [
  { offset: 0, title: 'Lights low, screens to the basket', detail: 'Phone charges outside the bedroom.' },
  { offset: 15, title: 'Warm shower or wash', detail: 'A falling body temperature helps sleep come.' },
  { offset: 30, title: 'Write tomorrow down', detail: 'Three lines. Then the notebook closes.' },
  { offset: 45, title: 'Read on paper, or music', detail: 'Something you have read before is fine.' },
  { offset: 75, title: 'Into bed only when sleepy', detail: 'If you are awake after about twenty minutes, get up and return when sleepy.' },
]

export const KEEP_MEANING_START = [
  { id: 'k1', text: 'Book the eye check-up', done: false },
  { id: 'k2', text: 'Call Suresh about his knee surgery', done: false },
  { id: 'k3', text: 'Frame the photographs from Amma’s 80th', done: false },
  { id: 'k4', text: 'Return Padma’s book', done: true },
]

export const JOURNAL_START = [
  { id: 'j1', date: '2027-01-26', problem: 'The Hosur order slipped by two weeks.', arrow: 'Telling myself I am losing my touch and the team will notice.' },
  { id: 'j2', date: '2027-01-19', problem: 'Woke at 3 am again.', arrow: 'Lying there calculating how tired I will be at the board meeting.' },
]
