import type { Band, Role, TermKey } from '@/domain/types'
import { fill } from '@/lib/i18n'
import type { Lang } from '@/lib/store'
import { COUNTRY_KEY, E } from './_i18n'

// ─── The Joyspan Check ─────────────────────────────────────────────────────
// 18 statements, three per term, each on a five-point scale (Memo p.10).
// Plain English, written to be read aloud. Ease statements are phrased as
// burden (agreeing means more suffering) and are reversed when banded.

export interface CheckStatement {
  id: string
  term: TermKey
  text: string
  /** true for Ease (burden) items: agreement means more suffering */
  burden?: boolean
}

export const CHECK_STATEMENTS: CheckStatement[] = [
  { id: 'h1', term: 'H', text: 'Most days, my body lets me do the things I want to do.' },
  { id: 'p1', term: 'P', text: 'I have a reason to get up in the morning.' },
  { id: 'r1', term: 'R', text: 'There is someone I could call at two in the morning, and they would come.' },
  { id: 'f1', term: 'F', text: 'I have enough time for the things that matter to me.' },
  { id: 'd1', term: 'D', text: 'Most days hold at least one moment I genuinely enjoy.' },
  { id: 'b1', term: 'B', text: 'My sleep has been troubled, broken or too short.', burden: true },

  { id: 'h2', term: 'H', text: 'I move enough in a week to feel strong and steady on my feet.' },
  { id: 'p2', term: 'P', text: 'What I do most days feels like it matters to someone.' },
  { id: 'r2', term: 'R', text: 'I feel close to the people I live with, or love.' },
  { id: 'f2', term: 'F', text: 'Most of what fills my day is something I chose.' },
  { id: 'd2', term: 'D', text: 'When something good happens, I slow down long enough to enjoy it.' },
  { id: 'b2', term: 'B', text: 'Worry or low mood has got in the way of my days.', burden: true },

  { id: 'h3', term: 'H', text: 'I feel I am looking after my health for the next ten years, not only for today.' },
  { id: 'p3', term: 'P', text: 'I have a sense of where my life is heading over the next few years.' },
  { id: 'r3', term: 'R', text: 'I seldom feel left out, or alone in a room full of people.' },
  { id: 'f3', term: 'F', text: 'I feel settled, not anxious, when I think about the years ahead.' },
  { id: 'd3', term: 'D', text: 'I laughed properly, the kind that surprises you, at least once this week.' },
  { id: 'b3', term: 'B', text: 'Pain, tension or stress has kept me from things I would usually do.', burden: true },
]

export const SCALE = [
  { v: 1, label: 'Not at all' },
  { v: 2, label: 'A little' },
  { v: 3, label: 'Sometimes' },
  { v: 4, label: 'Mostly' },
  { v: 5, label: 'Completely' },
] as const

export const SCALE_BURDEN = [
  { v: 1, label: 'Not at all' },
  { v: 2, label: 'Rarely' },
  { v: 3, label: 'Some days' },
  { v: 4, label: 'Most days' },
  { v: 5, label: 'Nearly every day' },
] as const

/** One honest next step for each lowest term. Pre-approved copy, never generated. */
export const CHECK_NEXT_STEP: Record<TermKey, { step: string; why: string }> = {
  H: { step: 'Tomorrow morning, stand up from a chair five times without your hands, and notice how it felt.', why: 'Capacity is the part of health you can feel. Knowing where you start is the first move.' },
  P: { step: 'Tonight, write one line: what would make tomorrow worth waking for?', why: 'We call it the Tomorrow Question. A small reason, asked daily, is how purpose grows back.' },
  R: { step: 'Call one person you have not spoken to this month. Ten minutes is enough.', why: 'Loneliness eases fastest through the people already in your life, not new ones.' },
  F: { step: 'Write three things you will stop doing this quarter. Keep the list somewhere you can see it.', why: 'We call it the No list. Freedom is often won back by subtraction, not addition.' },
  D: { step: 'This evening, take ten minutes outside with something warm to drink, and notice three things.', why: 'Savouring a small pleasure, on purpose, is one of the best-studied ways to raise it.' },
  B: { step: 'Choose a wind-down time for tonight and keep it. Lights low, phone in another room.', why: 'Sleep sits under almost every other term. It is the kindest place to begin easing the load.' },
}

/** Band from five-point answers. Ease (burden) answers are reversed so every band reads the same way. */
export function checkBand(answers: number[], burden = false): Band {
  if (answers.length === 0) return 'not-yet-measured'
  const mean = answers.reduce((a, b) => a + b, 0) / answers.length
  const m = burden ? 6 - mean : mean
  if (m >= 3.8) return 'steady'
  if (m >= 2.8) return 'uneven'
  return 'thin'
}

/** Internal ordering only, never shown: 0–100 effective standing per term for naming the lowest. */
export function checkStanding(answers: number[], burden = false) {
  const mean = answers.reduce((a, b) => a + b, 0) / Math.max(1, answers.length)
  const m = burden ? 6 - mean : mean
  return ((m - 1) / 4) * 100
}

/** Petal fill for a band on the Wheel. The Check never shows these as numbers. */
export const BAND_PETAL: Record<Exclude<Band, 'not-yet-measured'>, number> = { steady: 86, uneven: 60, thin: 34 }
export const BAND_PETAL_BURDEN: Record<Exclude<Band, 'not-yet-measured'>, number> = { steady: 16, uneven: 42, thin: 70 }

export const BAND_WORDS: Record<Exclude<Band, 'not-yet-measured'>, string> = {
  steady: 'Holding well. Keep doing what you are doing.',
  uneven: 'Some days yes, some days no. Worth a closer look.',
  thin: 'Running low. The kindest place to start.',
}

// ─── Evidence · cohort term means, Day 0 vs Day 90 (specimen) ───────────────
// Published by term, up AND down (Memo p.13). Burden: lower is better.

export interface CohortTerms {
  cohort: string
  short: string
  primary: TermKey
  n: number
  rescored: number
  terms: { key: TermKey; d0: number; d90: number }[]
  note: string
}

export const COHORT_TERMS: CohortTerms[] = [
  {
    cohort: 'Healthcation · Q4 2026',
    short: 'Healthcation',
    primary: 'H',
    n: 142,
    rescored: 111,
    terms: [
      { key: 'H', d0: 61, d90: 67 },
      { key: 'P', d0: 66, d90: 68 },
      { key: 'R', d0: 64, d90: 65 },
      { key: 'F', d0: 57, d90: 55 },
      { key: 'D', d0: 59, d90: 62 },
      { key: 'B', d0: 33, d90: 29 },
    ],
    note: 'Healthspan rose as designed. Freedom fell by two: guests told us the protocol took time they did not have. The v1.1 Healthcation protocol trims the daily load to twenty minutes.',
  },
  {
    cohort: 'Sleepcation · Q4 2026',
    short: 'Sleepcation',
    primary: 'B',
    n: 64,
    rescored: 46,
    terms: [
      { key: 'H', d0: 60, d90: 61 },
      { key: 'P', d0: 63, d90: 62 },
      { key: 'R', d0: 62, d90: 62 },
      { key: 'F', d0: 55, d90: 56 },
      { key: 'D', d0: 54, d90: 56 },
      { key: 'B', d0: 44, d90: 41 },
    ],
    note: 'Burden eased on average, but only 48% improved their lowest term. Sleep held for four weeks after checkout, then slid back for many. The falsifier fired; the redesign adds a Day-15 sleep review and a CBT-I-informed home plan.',
  },
  {
    cohort: 'Beautycation · Q3 2026',
    short: 'Beautycation',
    primary: 'D',
    n: 88,
    rescored: 71,
    terms: [
      { key: 'H', d0: 66, d90: 66 },
      { key: 'P', d0: 64, d90: 65 },
      { key: 'R', d0: 67, d90: 69 },
      { key: 'F', d0: 60, d90: 59 },
      { key: 'D', d0: 55, d90: 61 },
      { key: 'B', d0: 30, d90: 28 },
    ],
    note: 'Daily Pleasure rose by six, mostly from the Joy Ledger habit carried home. Healthspan did not move, as we expected. Freedom slipped by one, within noise.',
  },
]

export const COHORT_GROWTH = [
  { n: 600, label: 'J1 · Jan 2027', rung: 'R1', what: 'The AIWO Joyspan 2027 guests, consented, measured on 5 January.' },
  { n: 10_000, label: 'J3 · Mar 2028', rung: 'R1 · R2', what: 'Enough to calibrate weights and λ, and submit the validation paper.' },
  { n: 100_000, label: 'J4 · FY31', rung: 'R2 · R4', what: 'An international cohort across members, employers, insurers and Houses.' },
  { n: 10_000_000, label: 'J5 · 2036', rung: 'R6', what: 'The free Check and Index in twelve languages; an audited joyful-year count.' },
]

// ─── Sign-in · specimen accounts per role ──────────────────────────────────

export interface DemoAccount {
  /** unique row key; equals the role */
  key: string
  /** the demo role the store is set to on entry */
  role: Role
  email: string
  title: string
  /** where the account lands */
  to: string
  who: string
  /** short verb for the button: "Enter as …" */
  short: string
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { key: 'member', role: 'member', email: 'arjun.rao@specimen.aiwo', title: 'Member', to: '/app', who: 'Arjun Rao · Day 23 of 90', short: 'member' },
  { key: 'coach', role: 'coach', email: 'priya.natarajan@specimen.aiwo', title: 'Coach & concierge', to: '/console/coach', who: 'Priya Natarajan', short: 'coach' },
  { key: 'clinician', role: 'clinician', email: 'meera.iyer@specimen.aiwo', title: 'Clinician', to: '/console/clinical', who: 'Dr Meera Iyer', short: 'clinician' },
  { key: 'partner', role: 'partner', email: 'fairmont.mumbai@specimen.aiwo', title: 'Partner venue', to: '/console/partner', who: 'Fairmont Mumbai', short: 'partner' },
  { key: 'tenant', role: 'tenant', email: 'admin.northwind@specimen.aiwo', title: 'Tenant admin', to: '/console/tenant', who: 'Northwind Capital', short: 'tenant' },
  { key: 'science', role: 'science', email: 'science.office@specimen.aiwo', title: 'Science Office', to: '/console/science', who: 'Head of Joyspan Science', short: 'science' },
  { key: 'exec', role: 'exec', email: 'leadership@specimen.aiwo', title: 'Leadership', to: '/console/exec', who: 'CEO · Head of Joy OS', short: 'leadership' },
]

// Engineering & ops: its own 'ops' role (the Control plane in the Demo switcher).
// Kept apart from DEMO_ACCOUNTS, which other lanes key by role; it lands on the
// Control plane console.
export const OPS_ACCOUNT: DemoAccount = { key: 'ops', role: 'ops', email: 'sre.oncall@specimen.aiwo', title: 'Engineering & ops', to: '/console/ops', who: 'SRE on call · DPO', short: 'ops' }

// Concierge: its own 'concierge' role, which acts at the concierge desk of the coach &
// concierge console (bookings, draws, arrivals), where the coach can only look. Kept
// apart from DEMO_ACCOUNTS for the same reason as OPS_ACCOUNT.
export const CONCIERGE_ACCOUNT: DemoAccount = { key: 'concierge', role: 'concierge', email: 'ravi.shankar@specimen.aiwo', title: 'Concierge', to: '/console/coach?desk=concierge', who: 'Ravi Shankar', short: 'concierge' }

// ─── Phone numbers (sign-in and account creation) ───────────────────────────

export const COUNTRIES = [
  { code: '+91', name: 'India', adj: 'Indian', len: 10, re: /^[6-9]\d{9}$/, placeholder: '98400 12345' },
  { code: '+971', name: 'UAE', adj: 'UAE', len: 9, re: /^5\d{8}$/, placeholder: '50 123 4567' },
  { code: '+44', name: 'United Kingdom', adj: 'UK', len: 10, re: /^7\d{9}$/, placeholder: '7700 900123' },
  { code: '+65', name: 'Singapore', adj: 'Singapore', len: 8, re: /^[89]\d{7}$/, placeholder: '8123 4567' },
] as const

export type CountryCode = (typeof COUNTRIES)[number]['code']
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Plain, grammatical validation copy for a mobile number. Returns null when valid. */
export function phoneError(code: CountryCode, raw: string, lang: Lang = 'en'): string | null {
  const c = COUNTRIES.find((x) => x.code === code)!
  const digits = raw.replace(/\D/g, '')
  if (!digits) return E.phoneEmpty[lang]
  if (!c.re.test(digits)) {
    const article = /^[aeiou]/i.test(c.adj) && c.adj !== 'UAE' && c.adj !== 'UK' ? 'an' : 'a'
    const adj = lang === 'en' ? c.adj : E[`adj_${COUNTRY_KEY[c.code]}`][lang]
    return fill(E.phoneBad[lang], { article, adj, len: c.len })
  }
  return null
}

/** Country name in the member's language, for the dialling-code pickers. */
export function countryName(code: string, lang: Lang) {
  const c = COUNTRIES.find((x) => x.code === code)
  if (!c) return code
  return lang === 'en' ? c.name : E[`c_${COUNTRY_KEY[c.code]}`][lang]
}

// ─── Onboarding ─────────────────────────────────────────────────────────────

export const INTENTS: { term: TermKey; title: string; line: string }[] = [
  { term: 'H', title: 'More energy in my body', line: 'Sleep better, move more, feel strong for the next thirty years.' },
  { term: 'P', title: 'A clearer reason to get up', line: 'Find what matters next, and give it a little time each day.' },
  { term: 'R', title: 'Closer to my people', line: 'Partner, family, friends: more of them, and more of it.' },
  { term: 'F', title: 'Time that feels like mine', line: 'Fewer obligations I did not choose; more of the ones I did.' },
  { term: 'D', title: 'More joy in ordinary days', line: 'Notice the good things, and plan a few on purpose.' },
  { term: 'B', title: 'Less weight to carry', line: 'Ease stress, worry, pain or poor sleep, gently.' },
]

export const DEVICES = [
  { id: 'oura', name: 'Oura Ring', reads: 'Sleep, HRV, resting heart rate, temperature', via: 'via Terra · AIWO-issued for ’cation guests', note: 'Recommended' },
  { id: 'apple', name: 'Apple Health', reads: 'Steps, workouts, VO₂max estimate, sleep; writes back mindful minutes if you allow', via: 'on your iPhone · HealthKit' },
  { id: 'hc', name: 'Health Connect', reads: 'Steps, sleep, heart rate from your Android phone and watch', via: 'on your Android phone' },
  { id: 'whoop', name: 'WHOOP', reads: 'Sleep, HRV, resting heart rate, workouts', via: 'via Terra' },
  { id: 'garmin', name: 'Garmin', reads: 'Steps, workouts, sleep, VO₂max estimate', via: 'via Terra' },
  { id: 'none', name: 'No device', reads: 'Every space works without one. Your Index comes from your answers; you can link a device later.', via: 'nothing to install' },
] as const

export type DeviceId = (typeof DEVICES)[number]['id']

// ─── Onboarding chrome in the three launch languages ───────────────────────
// Step names and footer buttons; the rest of setup reads from OB in _i18n.ts.
// Translations of the data below (intents, devices, next steps, notes) live in _i18n.ts.

export const ONBOARDING_STEPS = ['Welcome', 'Account', 'Age', 'Intent', 'Language', 'Consents', 'Device', 'Household', 'Quiet hours', 'Begin'] as const
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number]

export const ONBOARDING_COPY: Record<'en' | 'ta' | 'hi', { step: string; of: string; cont: string; back: string; skip: string; begin: string; later: string; saveExit: string; names: Record<OnboardingStep, string> }> = {
  en: {
    step: 'Step', of: 'of', cont: 'Continue', back: 'Back', skip: 'Skip for now', begin: 'Let’s begin', later: 'Link it later', saveExit: 'Save and exit',
    names: { Welcome: 'Welcome', Account: 'Your AIWO ID', Age: 'Your age', Intent: 'Intent', Language: 'Language', Consents: 'Three consents', Device: 'Device', Household: 'Household', 'Quiet hours': 'Quiet hours', Begin: 'Ready' },
  },
  ta: {
    step: 'படி', of: '/', cont: 'தொடரவும்', back: 'பின்செல்', skip: 'இப்போது தவிர்', begin: 'தொடங்குவோம்', later: 'பிறகு இணைக்கவும்', saveExit: 'சேமித்து வெளியேறு',
    names: { Welcome: 'வரவேற்பு', Account: 'AIWO ID', Age: 'உங்கள் வயது', Intent: 'நோக்கம்', Language: 'மொழி', Consents: 'ஒப்புதல்கள்', Device: 'சாதனம்', Household: 'குடும்பம்', 'Quiet hours': 'அமைதி நேரம்', Begin: 'தயார்' },
  },
  hi: {
    step: 'चरण', of: '/', cont: 'जारी रखें', back: 'वापस', skip: 'अभी छोड़ें', begin: 'शुरू करें', later: 'बाद में जोड़ें', saveExit: 'सहेजें और बाहर निकलें',
    names: { Welcome: 'स्वागत', Account: 'AIWO ID', Age: 'आपकी उम्र', Intent: 'उद्देश्य', Language: 'भाषा', Consents: 'सहमतियाँ', Device: 'डिवाइस', Household: 'परिवार', 'Quiet hours': 'शांत समय', Begin: 'तैयार' },
  },
}
