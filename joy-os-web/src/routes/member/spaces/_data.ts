import type { Action, IndexScore, TermKey } from '@/domain/types'
import { ACTION_LIBRARY, INDEX_HISTORY, TODAY_ACTION } from '@/data/member'

// SPECIMEN DATA for the six spaces — not a real member (Memo p.19).
// Everything a space needs beyond the shared specimens lives here so the
// shared data layer stays untouched.

/** "Today" for the specimen member: Day 23 of the loop that started 5 Jan 2027. */
export const SPACE_TODAY = '2027-01-28'

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

/**
 * Lines that would state a time-audit finding (whose time the week was) stand in for these
 * neutral ones until a calendar is connected and its consent (c_cal) is on: without one,
 * nothing has been read, so nothing calendar-derived is said.
 */
export const ROOM_VERDICT_NO_CAL: Partial<Record<TermKey, string>> = {
  F: 'Freedom fell after a heavy quarter. Connect a calendar and the time audit will show whose time your week was.',
}
export const WHY_NO_CAL: Record<string, string> = {
  a_f_007: 'An hour named as yours is the smallest way back to your own time.',
}
/** The room's verdict, calendar-aware. */
export function roomVerdict(key: TermKey, calendar: boolean) {
  return (!calendar && ROOM_VERDICT_NO_CAL[key]) || ROOM_VERDICT[key]
}
/** An action's "Why this?" reason, calendar-aware. */
export function actionWhy(a: Action, calendar: boolean) {
  return (!calendar && WHY_NO_CAL[a.id]) || a.why
}

// ─── 90-day history ────────────────────────────────────────────────────────

const DAY_MS = 86400000

/** 'YYYY-MM-DD' for a whole number of days after a calendar date (UTC, so no time-zone drift). */
function addDays(iso: string, n: number) {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10)
}

/**
 * Weekly short-form pulse across the last ninety days: fourteen weekly points
 * from 91 days before SPACE_TODAY up to today. The last point holds the current
 * value (the latest full measure). `on` is an ISO date; screens format it in the
 * member's language at render.
 */
export function termHistory(key: TermKey, history: IndexScore[] = INDEX_HISTORY) {
  const cur = history[0].terms.find((t) => t.key === key)!.value ?? 0
  const prev = history[1].terms.find((t) => t.key === key)!.value ?? cur
  const seed = key.charCodeAt(0)
  return Array.from({ length: 14 }, (_, i) => {
    const p = i / 13
    const wobble = i === 13 ? 0 : Math.round(Math.sin(seed * 1.7 + i * 1.3) * 1.6)
    return {
      on: addDays(SPACE_TODAY, (i - 13) * 7),
      value: Math.round(prev + (cur - prev) * p + wobble),
    }
  })
}

// ─── Three actions per term (ACTION_LIBRARY first, then our own) ───────────

const OWN_ACTIONS: Action[] = [
  { id: 'a_h_021', term: 'H', title: 'Walk after dinner for half an hour.', detail: 'With Kavya if she is free.', minutes: 30, timeOfDay: 'evening', shared: true, evidence: 'Post-meal walking lowers glucose excursions (LE8 · blood glucose).', why: 'HbA1c is at the edge of its range.' },
  { id: 'a_h_027', term: 'H', title: 'Ten minutes of morning sun.', detail: 'Arms and face, before 10 am.', minutes: 10, timeOfDay: 'morning', shared: false, evidence: 'Sun exposure supports vitamin D status; your physician advises on supplements.', why: 'Vitamin D was below range in January.' },
  { id: 'a_p_009', term: 'P', title: 'Write one line in the contribution log.', detail: 'Who did your work help today?', minutes: 2, timeOfDay: 'evening', shared: false, evidence: 'Prosocial contribution and meaning in life (MLQ-P).', why: 'Contribution is the quietest part of your Ikigai map.' },
  { id: 'a_p_012', term: 'P', title: 'Spend ten minutes learning something new.', detail: 'Stay Curious, Practice week 7.', minutes: 10, timeOfDay: 'any', shared: false, evidence: 'Curiosity predicts meaning presence (Kashdan & Steger).', why: 'Keeps the daily anchors alive.' },
  { id: 'a_r_011', term: 'R', title: 'Plan State of Us for Sunday.', detail: 'Twenty minutes, phones away.', minutes: 2, timeOfDay: 'any', shared: true, evidence: 'Weekly couple rituals (Gottman, “State of the Union”).', why: 'Your last State of Us was eleven days ago.' },
  { id: 'a_r_014', term: 'R', title: 'Send one voice note to someone in your 5.', detail: 'Not a forward. Your own voice.', minutes: 2, timeOfDay: 'any', shared: false, evidence: 'Close-tie contact and perceived support (LSNS-6).', why: 'Your 5 hold the most weight in your score.' },
  { id: 'a_f_007', term: 'F', title: 'Block one hour on Thursday that is yours.', detail: 'Name it. Defend it like a board meeting.', minutes: 2, timeOfDay: 'morning', shared: false, evidence: 'Time affluence and autonomy (Whillans; BPNSFS).', why: 'Nearly half of last fortnight was asked of you.' },
  { id: 'a_f_010', term: 'F', title: 'Schedule the succession conversation.', detail: 'Thirty minutes, with Kavya and your adviser.', minutes: 10, timeOfDay: 'any', shared: true, evidence: 'Choice and peace of mind (Freedom Triad · Choice).', why: 'It is the bigger of the two open items on your peace-of-mind list.' },
  { id: 'a_d_019', term: 'D', title: 'Savour one meal without a screen.', detail: 'Name the three best flavours.', minutes: 30, timeOfDay: 'any', shared: true, evidence: 'Sensory sharpening raises savouring (Bryant).', why: 'Food is your second-largest source of joy this week.' },
  { id: 'a_b_009', term: 'B', title: 'Write the second arrow down.', detail: 'The problem, and the extra you are adding.', minutes: 10, timeOfDay: 'evening', shared: false, evidence: 'Cognitive defusion (ACT; Hayes).', why: 'Stress is your second-largest Burden part.' },
  { id: 'a_b_012', term: 'B', title: 'Move one “keep meaning to” item to done.', detail: 'The smallest one.', minutes: 10, timeOfDay: 'any', shared: false, evidence: 'Behavioural activation reduces avoidance.', why: 'Avoidance is small, but it is there.' },
]

export function actionsFor(key: TermKey): Action[] {
  const lib = ACTION_LIBRARY.filter((a) => a.term === key)
  return [...lib, ...OWN_ACTIONS.filter((a) => a.term === key)].slice(0, 3)
}

/**
 * Today's one action for a lowest term: the specimen TODAY_ACTION for Daily Pleasure, else the
 * first of that term's actions (the same rule as the mobile app). Under 18, or with no Index,
 * it stays TODAY_ACTION. A space marks this action as today's instead of offering it again.
 */
export function todayActionFor(lowest: TermKey | null): Action {
  if (!lowest || lowest === TODAY_ACTION.term) return TODAY_ACTION
  return actionsFor(lowest)[0] ?? TODAY_ACTION
}

/** A specimen VIVA draft per space — drafted by VIVA, a person signs. */
export const VIVA_DRAFT: Record<TermKey, { tool: string; ask: string; draft: string; reviewer: string } | null> = {
  H: { tool: 'explain_biomarker', ask: 'What is ApoB, in plain words?', draft: 'ApoB counts the particles that carry cholesterol in your blood. Yours is 92 mg/dL; the lab range is under 90. It is one number among several, and Dr Meera will talk it through with you at your Day 45 review. VIVA does not diagnose.', reviewer: 'Reviewed by Dr Meera Iyer' },
  P: { tool: 'ikigai_coach', ask: 'Help me make my daily anchors smaller.', draft: 'Your three anchors are good ones. “Teach the interns every Friday” could become “answer one intern question a day”. Small enough that a busy day cannot take it away.', reviewer: 'Coach Priya sees this in your digest' },
  R: { tool: 'couples_prompt', ask: 'Give us a State of Us prompt for this week.', draft: 'Each of you, separately: name one moment this week when you felt your partner was on your side. Then say it out loud to them, without explaining it.', reviewer: 'Never reveals one partner to the other' },
  F: { tool: 'time_audit_summary', ask: 'Summarise my time audit.', draft: 'Over two weeks, a little over a quarter of your planned hours were yours. Nearly half were asked of you by others, mostly in Tuesday and Wednesday meetings. Weekends were largely your own.', reviewer: 'Calendar entries discarded · totals only · never financial advice' },
  D: { tool: 'ledger_weekly_story', ask: 'Where did joy come from this week?', draft: 'This week joy came mostly from people and food, usually around lunch. Evenings were quieter than last week.', reviewer: 'Two sentences · from your Ledger only' },
  B: null,
}

/**
 * The second named VIVA tool of each space (terms.ts lists two per space), each with a
 * canned specimen prompt and draft. le8_coach is drafted at ask time from the LE8 log.
 */
export const VIVA_MORE: Record<TermKey, { tool: string; ask: string; draft: string; reviewer: string }[]> = {
  H: [{ tool: 'le8_coach', ask: 'Which of my Essential 8 should I work on first?', draft: '', reviewer: 'Reviewed by Dr Meera Iyer' }],
  P: [{ tool: 'tomorrow_question', ask: 'Ask me this week’s Tomorrow question.', draft: 'What is one thing tomorrow that you would be sorry to miss? Write it down tonight, next to your earlier answers. Only you can read it.', reviewer: 'Coach Priya sees this in your digest' }],
  R: [{ tool: 'repair_conversation', ask: 'Help me start a repair after an argument.', draft: 'Start with your own part, in one sentence: “I was short with you, and I am sorry.” Then ask one question and only listen. A repair is not about who was right; it is about coming back.', reviewer: 'Never reveals one partner to the other' }],
  F: [{ tool: 'no_list_coach', ask: 'Help me say no to one thing this week.', draft: 'The Tuesday reviews take more of your week than anything else asked of you. You could try: “I will join the first fifteen minutes and read the notes after.” A smaller yes is still a no to the rest.', reviewer: 'Calendar entries discarded · totals only · never financial advice' }],
  D: [{ tool: 'savour_prompt', ask: 'Give me a savouring prompt for this evening.', draft: 'When the tea is poured tonight, wait ten seconds before the first sip. Notice the smell and the warmth of the cup. Then tell Kavya one thing from today you would be sorry to have missed.', reviewer: 'From the savouring library · no advice' }],
  B: [],
}

/** Words that send a question typed in a space's VIVA card to one of its tools (specimen matching). */
export const VIVA_MATCH: Record<string, RegExp> = {
  explain_biomarker: /apob|ldl|hdl|hba1c|marker|cholesterol|vitamin|biomarker|\blab\b|panel|ferritin|crp/i,
  le8_coach: /le8|essential|heart|blood pressure|\bbp\b|sleep|diet|bmi|weight|activity|walk|first/i,
  ikigai_coach: /ikigai|anchor|purpose|direction|meaning|contribut/i,
  tomorrow_question: /tomorrow|question/i,
  couples_prompt: /state of us|kavya|partner|couple|wife|husband|marriage/i,
  repair_conversation: /argu|fight|repair|sorry|apolog|upset|quarrel/i,
  time_audit_summary: /audit|hours|calendar|meeting|where.*time|my time/i,
  no_list_coach: /\bno\b|say no|declin|refus|boundar|too many/i,
  ledger_weekly_story: /ledger|where did joy|joy come|this week/i,
  savour_prompt: /savou?r|enjoy|evening|tea|meal|slow down/i,
}

// ─── Body ──────────────────────────────────────────────────────────────────

export const DEVICES = [
  { id: 'oura', name: 'Oura Ring Gen 4', via: 'via Terra', status: 'connected' as const, last: 'Synced 06:12 today', reads: 'Sleep, HRV, resting heart rate, temperature' },
  { id: 'hk', name: 'Apple Health', via: 'HealthKit', status: 'connected' as const, last: 'Synced 07:40 today', reads: 'Steps, workouts, VO₂max · writes mindful minutes' },
  { id: 'hc', name: 'Health Connect', via: 'Android', status: 'available' as const, last: 'Not linked', reads: 'For an Android phone' },
  { id: 'whoop', name: 'WHOOP', via: 'via Terra', status: 'available' as const, last: 'Not linked', reads: 'Strain, recovery features only' },
]

export type Le8Status = 'ideal' | 'good' | 'watch'
/** Scored on AHA Life's Essential 8 (2022): MEPA 12–14 → 80; ≥150 min → 100; 120–129 / <80 → 75. */
export const LE8 = [
  { key: 'diet', name: 'Diet', score: 80, status: 'good' as Le8Status, reading: 'MEPA 12 of 16', source: 'Self-report' },
  { key: 'activity', name: 'Physical activity', score: 100, status: 'ideal' as Le8Status, reading: '165 min / week', source: 'Apple Health' },
  { key: 'nicotine', name: 'Nicotine exposure', score: 100, status: 'ideal' as Le8Status, reading: 'Never', source: 'Self-report' },
  { key: 'sleep', name: 'Sleep health', score: 70, status: 'good' as Le8Status, reading: '6 h 40 m average', source: 'Oura' },
  { key: 'bmi', name: 'Body mass index', score: 70, status: 'good' as Le8Status, reading: '26.1 kg/m²', source: 'Clinic' },
  { key: 'lipids', name: 'Blood lipids', score: 60, status: 'watch' as Le8Status, reading: 'Non-HDL 146 mg/dL', source: 'Panel · Jan' },
  { key: 'glucose', name: 'Blood glucose', score: 60, status: 'watch' as Le8Status, reading: 'HbA1c 5.8%', source: 'Panel · Jan' },
  { key: 'bp', name: 'Blood pressure', score: 75, status: 'good' as Le8Status, reading: '128 / 78 mmHg', source: 'Home cuff' },
]

export type Le8Key = 'diet' | 'activity' | 'nicotine' | 'sleep' | 'bmi' | 'lipids' | 'glucose' | 'bp'
/**
 * One LE8 reading. `v` holds the raw values: diet [MEPA 0–16], activity [min/week],
 * nicotine [answer 0–4], sleep [minutes a night], bmi [weight kg], lipids [non-HDL mg/dL],
 * glucose [HbA1c %], bp [systolic, diastolic]. `mine` marks a reading the member logged here.
 */
export interface Le8Reading { id: string; key: Le8Key; on: string; v: number[]; source: string; mine?: boolean }

/** Clinic height for the specimen member; BMI is computed from a logged weight. */
export const LE8_HEIGHT_CM = 172
export const bmiOf = (kg: number) => Math.round((kg / (LE8_HEIGHT_CM / 100) ** 2) * 10) / 10

/** AHA Life's Essential 8 (2022) points, 0–100, from a reading's raw values. */
export function le8Score(key: Le8Key, v: number[]): number {
  const x = v[0]
  switch (key) {
    case 'diet': return x >= 15 ? 100 : x >= 12 ? 80 : x >= 8 ? 50 : x >= 4 ? 25 : 0
    case 'activity': return x >= 150 ? 100 : x >= 120 ? 90 : x >= 90 ? 80 : x >= 60 ? 60 : x >= 30 ? 40 : x >= 1 ? 20 : 0
    case 'nicotine': return [100, 75, 50, 25, 0][x] ?? 0
    case 'sleep': { const h = x / 60; return h >= 7 && h < 9 ? 100 : h >= 9 && h < 10 ? 90 : h >= 6 && h < 7 ? 70 : (h >= 5 && h < 6) || h >= 10 ? 40 : h >= 4 ? 20 : 0 }
    case 'bmi': { const b = bmiOf(x); return b < 25 ? 100 : b < 30 ? 70 : b < 35 ? 30 : b < 40 ? 15 : 0 }
    case 'lipids': return x < 130 ? 100 : x < 160 ? 60 : x < 190 ? 40 : x < 220 ? 20 : 0
    case 'glucose': return x < 5.7 ? 100 : x < 6.5 ? 60 : x < 7 ? 40 : x < 8 ? 30 : x < 9 ? 20 : x < 10 ? 10 : 0
    case 'bp': { const [s, d] = v; return s >= 160 || d >= 100 ? 0 : s >= 140 || d >= 90 ? 25 : s >= 130 || d >= 80 ? 50 : s >= 120 ? 75 : 100 }
  }
}
export const le8Status = (score: number): Le8Status => (score >= 90 ? 'ideal' : score >= 70 ? 'good' : 'watch')

/** Specimen LE8 history: July and October 2026 baselines, then the January 2027 readings shown above. */
export const LE8_LOG_START: Le8Reading[] = [
  { id: 'le8-diet-jul', key: 'diet', on: '2026-07-06', v: [9], source: 'Self-report' },
  { id: 'le8-act-jul', key: 'activity', on: '2026-07-06', v: [95], source: 'Apple Health' },
  { id: 'le8-nic-jul', key: 'nicotine', on: '2026-07-06', v: [0], source: 'Self-report' },
  { id: 'le8-sleep-jul', key: 'sleep', on: '2026-07-06', v: [366], source: 'Oura' },
  { id: 'le8-bmi-jul', key: 'bmi', on: '2026-07-06', v: [80.5], source: 'Clinic' },
  { id: 'le8-lip-jul', key: 'lipids', on: '2026-07-06', v: [162], source: 'Lab panel' },
  { id: 'le8-glu-jul', key: 'glucose', on: '2026-07-06', v: [6.0], source: 'Lab panel' },
  { id: 'le8-bp-jul', key: 'bp', on: '2026-07-06', v: [136, 84], source: 'Clinic' },
  { id: 'le8-diet-oct', key: 'diet', on: '2026-10-03', v: [11], source: 'Self-report' },
  { id: 'le8-act-oct', key: 'activity', on: '2026-10-03', v: [140], source: 'Apple Health' },
  { id: 'le8-sleep-oct', key: 'sleep', on: '2026-10-03', v: [384], source: 'Oura' },
  { id: 'le8-bmi-oct', key: 'bmi', on: '2026-10-03', v: [78.6], source: 'Clinic' },
  { id: 'le8-lip-oct', key: 'lipids', on: '2026-10-03', v: [151], source: 'Lab panel' },
  { id: 'le8-glu-oct', key: 'glucose', on: '2026-10-03', v: [5.9], source: 'Lab panel' },
  { id: 'le8-bp-oct', key: 'bp', on: '2026-10-03', v: [132, 80], source: 'Home cuff' },
  { id: 'le8-diet-jan', key: 'diet', on: '2027-01-22', v: [12], source: 'Self-report' },
  { id: 'le8-act-jan', key: 'activity', on: '2027-01-22', v: [165], source: 'Apple Health' },
  { id: 'le8-sleep-jan', key: 'sleep', on: '2027-01-22', v: [400], source: 'Oura' },
  { id: 'le8-bmi-jan', key: 'bmi', on: '2027-01-22', v: [77.2], source: 'Clinic' },
  { id: 'le8-lip-jan', key: 'lipids', on: '2027-01-22', v: [146], source: 'Panel · Jan' },
  { id: 'le8-glu-jan', key: 'glucose', on: '2027-01-22', v: [5.8], source: 'Panel · Jan' },
  { id: 'le8-bp-jan', key: 'bp', on: '2027-01-22', v: [128, 78], source: 'Home cuff' },
]
export const LE8_KEY = 'body.le8.v1'

/** Newest reading per metric on or before `upTo` (all readings when omitted). Same-day ties go to the later entry. */
export function le8Latest(log: Le8Reading[], upTo?: string) {
  const out: Partial<Record<Le8Key, Le8Reading>> = {}
  log.forEach((r) => {
    if (upTo && r.on > upTo) return
    const cur = out[r.key]
    if (!cur || r.on >= cur.on) out[r.key] = r
  })
  return out
}

/** The LE8 composite (mean of the eight) at every date a reading was logged, oldest first. */
export function le8Series(log: Le8Reading[]) {
  const dates = [...new Set(log.map((r) => r.on))].sort()
  return dates.flatMap((on) => {
    const latest = le8Latest(log, on)
    const scores = LE8.map((m) => latest[m.key as Le8Key]).filter(Boolean).map((r) => le8Score(r!.key, r!.v))
    return scores.length === LE8.length ? [{ on, value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) }] : []
  })
}

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

export const PANEL_META = { drawn: '2027-01-22', signed: '2027-01-24', signedBy: 'Dr Meera Iyer', lab: 'AIWO panel · NABL-accredited partner lab', previous: '2026-10-03' }

export const CAPACITY = [
  { key: 'grip', name: 'Grip strength', unit: 'kg', last: 38, prev: 36, better: 'higher', how: 'Dominant hand, best of three squeezes, elbow at 90°.', norm: 'Typical for men in their fifties: 36 – 44 kg' },
  { key: 'sts', name: '5× sit-to-stand', unit: 's', last: 10.8, prev: 11.6, better: 'lower', how: 'Arms crossed, stand fully five times from a firm chair, as quickly as is safe.', norm: 'Under 12 s is the WHO ICOPE screen' },
  { key: 'gait', name: 'Gait speed', unit: 'm/s', last: 1.12, prev: 1.08, better: 'higher', how: 'Walk 4 metres at your usual pace. We divide 4 by your time.', norm: 'Above 1.0 m/s is the usual line' },
] as const

/** Every home capacity test so far, oldest first (grip kg, sit-to-stand s, gait m/s). */
export const CAPACITY_HISTORY_START: { on: string; values: number[] }[] = [
  { on: '2026-07-06', values: [35, 12.4, 1.02] },
  { on: '2026-10-03', values: CAPACITY.map((c) => c.prev) },
  { on: '2027-01-02', values: CAPACITY.map((c) => c.last) },
]

/**
 * 28 days of signal features (not vendor scores), 1–28 Jan 2027. 1 Jan 2027 is a
 * Friday, so i % 7 === 1 falls on the Saturdays (2, 9, 16, 23 Jan): the late
 * dinners behind the HRV dips and the late nights behind the regularity dips.
 * `on` is an ISO date; screens format it in the member's language at render.
 */
export const SIGNALS = Array.from({ length: 28 }, (_, i) => {
  const sat = i % 7 === 1
  return {
    on: addDays('2027-01-01', i),
    hrv: Math.round(38 + i * 0.18 + Math.sin(i * 0.9) * 4 + (sat ? -6 : 0)),
    rhr: Math.round((60 - i * 0.06 + Math.cos(i * 0.8) * 1.6 + (sat ? 3 : 0)) * 10) / 10,
    regularity: Math.round(78 + Math.sin(i * 0.6) * 6 - (i > 20 ? 7 : 0) + (sat ? -5 : 0)),
  }
})

// ─── Purpose ───────────────────────────────────────────────────────────────

export const IKIGAI_START = {
  direction: 'Build a teaching practice that outlives the firm: forty young engineers who can run a plant better than I did.',
  contribution: 'Make it easier for the next generation in Chennai to start something honest.',
  anchors: ['Morning walk on Besant Nagar beach', 'Answer one intern question a day', 'Carnatic music with Amma on Sundays'],
}

export const TOMORROW_ANSWERS = [
  { week: 3, date: '2027-01-24', text: 'Sitting with Ishaan to review his plant layout before he presents it.' },
  { week: 2, date: '2027-01-17', text: 'Taking Amma to the Music Academy for the morning concert.' },
  { week: 1, date: '2027-01-10', text: 'The first walk after the Summit, with nothing to prove.' },
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
  { id: 'j', name: 'Joseph', ring: 15, seen: false },
]

export const TWO_AM_START = ['Kavya', 'Ravi', 'Suresh', 'Dr Meera Iyer']

/** The phone's own address book, as the simulated on-device picker shows it (Arch p.24:
 *  contacts never leave the phone; a circle keeps only the name the member picks or types). */
export const PHONE_CONTACTS = [
  'Anand Krishnan', 'Bhavna Shah', 'Deepa Menon', 'Farah Khan', 'Geetha Raman', 'Harish Kumar',
  'Ishaan Mehta', 'Joseph Thomas', 'Kavya Rao', 'Lakshmi Iyer', 'Meenakshi Sundaram', 'Mohan Das',
  'Nandini Rao', 'Padma Srinivasan', 'Pradeep Nair', 'Rekha Pillai', 'Sanjay Rao', 'Thomas Mathew',
  'Usha Devi', 'Vikram Shetty', 'Zainab Ali',
] as const

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

/** CSI-4 style items for this quarter's Couples Check. Each partner answers privately. */
export const COUPLES_ITEMS = [
  { area: 'How we spend weekends', q: 'I am happy with how we spend our weekends.' },
  { area: 'Time with our families', q: 'We balance time with our two families in a way that feels fair.' },
  { area: 'How we handle money worries', q: 'When money worries come up, we face them together.' },
  { area: 'How often we have fun together', q: 'We have fun together often enough.' },
  { area: 'Feeling heard in an argument', q: 'When we disagree, I feel heard.' },
  { area: 'Plans for the next ten years', q: 'We want roughly the same things from the next ten years.' },
  { area: 'Affection and touch', q: 'I am content with the affection between us.' },
  { area: 'Who carries the household load', q: 'The work of running our home is shared fairly.' },
]
export const COUPLES_OPTIONS = ['Not true', 'A little true', 'Mostly true', 'Completely true']
/** Earlier State of Us evenings (only the fact that you met is kept). */
export const STATE_OF_US_PAST = ['2027-01-17', '2027-01-10', '2027-01-03']

export const CONNECTIONS = [
  { id: 'cx1', title: 'Connections salon · Food & memory', on: '2027-03-04', at: '19:30', where: 'Adyar, Chennai', who: 'Twelve members · hosted by Ravi Shankar', kind: 'Salon' },
  { id: 'cx2', title: 'Sunrise walk · Elliot’s Beach', on: '2027-02-07', at: '06:15', where: 'Besant Nagar', who: 'Eight members of the Fairmont cohort', kind: 'Walk' },
  { id: 'cx3', title: 'Couples supper · Lovecation alumni', on: '2027-02-20', at: '20:00', where: 'Joyspan House Chennai', who: 'Six couples', kind: 'Supper' },
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
  { id: 'pp1', day: 'Mon', time: '19:30', what: 'Tea on the verandah', minutes: 10, with: 'Kavya' },
  { id: 'pp2', day: 'Tue', time: '13:00', what: 'Lunch at Murugan Idli, alone with a book', minutes: 30, with: '' },
  { id: 'pp3', day: 'Wed', time: '18:30', what: 'Play the veena for fifteen minutes', minutes: 10, with: '' },
]

export const SAVOURING_PROMPTS = [
  { id: 'sv-sensory', kind: 'Sensory sharpening', text: 'At your next meal, close your eyes for the first mouthful. Name three flavours before you open them.' },
  { id: 'sv-sharing', kind: 'Sharing with others', text: 'Tell someone tonight about one good moment from today, in more detail than feels necessary.' },
  { id: 'sv-memory', kind: 'Memory building', text: 'Take a mental photograph: pause for ten seconds and tell yourself “I want to remember this.”' },
  { id: 'sv-absorption', kind: 'Absorption', text: 'Choose one song you love. Listen to the whole of it doing nothing else.' },
  { id: 'sv-blessings', kind: 'Counting blessings', text: 'Before sleep, name one thing from today that you would be sorry to have missed.' },
  { id: 'sv-temporal', kind: 'Temporal awareness', text: 'Notice something that will not last: the light at 18:10, a grandchild’s height. Stay with it a moment longer.' },
]

export const FILMS = [
  { id: 'f1', title: 'The first filter coffee', who: 'Lakshmi, 81 · Mylapore', minutes: '2:40', note: 'She has made it the same way for sixty years. She tells you why it still matters.', captions: ['[kettle on the stove]', 'Lakshmi: “The decoction first. Always the decoction first.”', 'Lakshmi: “My husband liked it stronger. I still make one his way.”', 'Lakshmi: “Sixty years. It is still the best part of the morning.”', '[she pours it from a height, twice]'] },
  { id: 'f2', title: 'Sunday cricket, age 63', who: 'Thomas · Kochi', minutes: '3:15', note: 'Twelve friends, one maidan, no scores kept.', captions: ['[a tennis ball on a dry maidan]', 'Thomas: “Nobody keeps score. We stopped in 1998.”', 'Thomas: “George bowls slower every year. We pretend not to notice.”', '[laughter, a dog barks]', 'Thomas: “Then tea. The tea is the real match.”'] },
  { id: 'f3', title: 'The last stretch of the backwaters', who: 'Deepa & Arun · Alleppey', minutes: '1:58', note: 'A Savourcation couple, twenty minutes before sunset.', captions: ['[oars in still water]', 'Deepa: “Look, the kingfisher again.”', 'Arun: “Twenty minutes. Let us not talk for twenty minutes.”', '[the light goes orange over the paddy]'] },
  { id: 'f4', title: 'Learning the tabla at 55', who: 'Farah · Pune', minutes: '4:02', note: 'She is not good yet. That is the point.', captions: ['[a wrong note, then a laugh]', 'Farah: “Guruji says my left hand is lazy. He is right.”', 'Farah: “I practise at six, before anyone is awake.”', 'Farah: “I am not good yet. That is the point.”', '[a slow teen taal, almost even]'] },
]

// ─── Ease ──────────────────────────────────────────────────────────────────

export type Screen = 'PHQ-4' | 'ISI' | 'PSS-4' | 'Pain'
export const SCREEN_META: Record<Screen, { max: number; what: string; cadence: string; bands: { upTo: number; label: string; copy: string; route: boolean }[] }> = {
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
      { upTo: 16, label: 'Higher', copy: 'Your answers suggest higher perceived stress. Your coach will be in touch this week.', route: true },
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

export const SCREEN_HISTORY: Record<Screen, { date: string; score: number }[]> = {
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

/** Each screen's take-form: the stem, items, options and scoring. Pain is a single 0–10 rating. */
/** Each item scores 0 to options.length − 1; itemOptions[qi], when present, relabels item qi's options (same scoring). */
export const SCREEN_FORMS: Record<Screen, { stem: string; items: string[]; options: string[]; itemOptions?: Record<number, string[]>; reverse?: number[]; source: string; minutes: number }> = {
  'PHQ-4': { stem: 'Over the last two weeks, how often have you been bothered by…', items: PHQ4_ITEMS, options: PHQ4_OPTIONS, source: 'PHQ-4 · Kroenke et al., 2009 · public domain', minutes: 1 },
  ISI: {
    stem: 'Over the last two weeks, please rate…',
    items: [
      'Difficulty falling asleep',
      'Difficulty staying asleep',
      'Problems waking up too early',
      'How satisfied or dissatisfied you are with your current sleep pattern',
      'How noticeable your sleep problem is to others, in terms of your quality of life',
      'How worried or distressed you are about your current sleep problem',
      'How much your sleep problem interferes with your daily functioning',
    ],
    options: ['None', 'Mild', 'Moderate', 'Severe', 'Very severe'],
    // Items 4–7 have their own anchors in the ISI; all still score 0–4.
    itemOptions: {
      3: ['Very satisfied', 'Satisfied', 'Moderately satisfied', 'Dissatisfied', 'Very dissatisfied'],
      4: ['Not at all noticeable', 'A little', 'Somewhat', 'Much', 'Very much noticeable'],
      5: ['Not at all worried', 'A little', 'Somewhat', 'Much', 'Very much worried'],
      6: ['Not at all interfering', 'A little', 'Somewhat', 'Much', 'Very much interfering'],
    },
    source: 'Insomnia Severity Index · Morin et al., 2001 · licensed for Joy OS',
    minutes: 2,
  },
  'PSS-4': {
    stem: 'In the last month, how often have you felt…',
    items: [
      'That you were unable to control the important things in your life?',
      'Confident about your ability to handle your personal problems?',
      'That things were going your way?',
      'That difficulties were piling up so high that you could not overcome them?',
    ],
    options: ['Never', 'Almost never', 'Sometimes', 'Fairly often', 'Very often'],
    reverse: [1, 2],
    source: 'PSS-4 · Cohen et al., 1983 · free for non-commercial and clinical use',
    minutes: 1,
  },
  Pain: { stem: 'On average over the last week, how much pain have you had?', items: ['Average pain, last week'], options: [], source: 'Numeric rating scale, 0–10', minutes: 1 },
}

/** Weighted, these add to the Burden shown on the hero: 0.30·22 + 0.25·34 + 0.20·29 + 0.15·14 + 0.10·12 = 24.2 → 24. */
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
