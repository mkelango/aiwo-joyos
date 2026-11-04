import type { TermKey } from '@/shared/types'
import { CATIONS } from '@/shared/platform'
import { SPECIMEN_NOW } from './accountData'

// Lane data for ’Cation, Practice, Circles and Events (Memo p.20–21).
// SPECIMEN — shaped like the future API; never a real member.

// ─── The member's current ’cation ─────────────────────────────────────────

export const MY_CATION = {
  slug: 'joycation',
  edition: 'AIWO Joyspan 2027',
  venue: 'Fairmont Mumbai',
  room: 'Ocean Suite 1412',
  arrived: '2026-12-31',
  checkedOut: '2027-01-05',
  bookingRef: 'JC-FMB-2701-0142',
  /** The named outcome on the booking, in the guest’s own words (non-negotiable 1). */
  namedOutcome: 'I want to come home from work and actually be there. Evenings with Kavya, not with my inbox.',
  outcomeWritten: '2026-12-17',
  /** The protocol goes live for the member’s lowest term at checkout. */
  protocolTerm: 'D' as TermKey,
  protocol: 'Daily Pleasure protocol v1.2 · savouring, planned pleasures, the Joy Ledger',
  firstAction: { on: '2027-01-05', what: 'Ten minutes on the verandah with tea. Notice three things.' },
  clinicianPresent: 'Dr Meera Iyer',
}

/** Readings captured on site from Signal Points; each flows into the record. */
export const SIGNAL_READINGS: { id: string; term: TermKey; label: string; value: string; unit: string; baseline?: string; point: string; at: string; note?: string }[] = [
  { id: 'r1', term: 'H', label: 'Grip strength', value: '38', unit: 'kg', baseline: '36', point: 'Signal Point 2 · Wellness floor', at: '2027-01-01T09:40' },
  { id: 'r2', term: 'H', label: 'Five sit-to-stands', value: '9.8', unit: 's', baseline: '10.6', point: 'Signal Point 2 · Wellness floor', at: '2027-01-01T09:46' },
  { id: 'r3', term: 'H', label: 'VO₂max, estimated', value: '34', unit: 'ml/kg/min', point: 'Signal Point 4 · Fitness studio', at: '2027-01-02T07:15' },
  { id: 'r4', term: 'H', label: 'Blood pressure, seated', value: '128/82', unit: 'mmHg', baseline: '134/86', point: 'Signal Point 1 · Clinic suite', at: '2027-01-01T08:55', note: 'Reviewed by Dr Meera Iyer' },
  { id: 'r5', term: 'B', label: 'Sleep efficiency, five nights', value: '86', unit: '%', baseline: '81', point: 'Oura Ring via Terra · Room 1412', at: '2027-01-05T06:30' },
  { id: 'r6', term: 'H', label: 'HRV, overnight average', value: '41', unit: 'ms', baseline: '37', point: 'Oura Ring via Terra · Room 1412', at: '2027-01-05T06:30' },
  { id: 'r7', term: 'D', label: 'SPANE balance', value: '+6', unit: 'of ±24', baseline: '+3', point: 'Signal Point 3 · Quiet room tablet', at: '2027-01-04T17:20' },
  { id: 'r8', term: 'P', label: 'Ikigai map', value: 'Drafted', unit: '', point: 'Faculty session · Harbour room', at: '2027-01-03T11:00', note: 'Saved to your Purpose space' },
]

// ─── Per-’cation detail (the template is configuration, not code) ─────────

export type ItemKind = 'Room' | 'Treatment' | 'Measure' | 'Circle' | 'Meal' | 'Talk' | 'Movement'

interface Session { title: string; where: string; kind: ItemKind; term: TermKey }

export interface CationDetailData {
  secondary: TermKey[]
  clinician: { name: string; role: string; note: string }
  signature: Session[]
  windows: string[]
  beforeExtra: string
  note?: string
  outcomePlaceholder: string
}

export const CATION_DETAIL: Record<string, CationDetailData> = {
  joycation: {
    secondary: [],
    clinician: { name: 'Dr Meera Iyer', role: 'Physician · AIWO Clinical', note: 'On the floor every day of the edition, not on call. Signs your Clinical-grade Index before checkout.' },
    signature: [
      { title: 'AIWO panel draw and Clinical intake', where: 'Clinic suite', kind: 'Measure', term: 'H' },
      { title: 'The Ikigai map, with the faculty', where: 'Harbour room', kind: 'Talk', term: 'P' },
      { title: 'State of Us, for two', where: 'Your suite', kind: 'Room', term: 'R' },
      { title: 'Time audit and the No list', where: 'Library', kind: 'Talk', term: 'F' },
      { title: 'The slow dinner, phones in the basket', where: 'Terrace', kind: 'Meal', term: 'D' },
      { title: 'Sleep plan and wind-down ritual', where: 'Your suite', kind: 'Treatment', term: 'B' },
      { title: 'Capacity battery: grip, sit-to-stand, VO₂max', where: 'Signal Points 2 and 4', kind: 'Measure', term: 'H' },
      { title: 'The Summit: the Mentor’s address', where: 'Grand ballroom', kind: 'Talk', term: 'P' },
      { title: 'Abhyanga, ninety minutes', where: 'Spa, level 2', kind: 'Treatment', term: 'D' },
      { title: 'Connections table: the people who matter', where: 'Sea lounge', kind: 'Circle', term: 'R' },
    ],
    windows: ['31 Dec 2027 – 5 Jan 2028 · AIWO Joyspan 2028', '14 – 19 Mar 2027 · Joyspan House Chennai edition', '10 – 15 Oct 2027 · Fairmont Mumbai'],
    beforeExtra: 'A Clinical-grade baseline: AIWO panel drawn at home, Oura Ring posted and linked.',
    outcomePlaceholder: 'e.g. I want to come home from work and actually be there.',
  },
  healthcation: {
    secondary: ['B', 'D'],
    clinician: { name: 'Dr Meera Iyer', role: 'Physician · AIWO Clinical', note: 'Reads your panel with you on day one and again before you leave.' },
    signature: [
      { title: 'AIWO panel review and LE8 walk-through', where: 'Clinic suite', kind: 'Measure', term: 'H' },
      { title: 'Capacity battery', where: 'Signal Point 2', kind: 'Measure', term: 'H' },
      { title: 'Strength for the next thirty years', where: 'Fitness studio', kind: 'Movement', term: 'H' },
      { title: 'The LE8 plate: a kitchen class', where: 'Show kitchen', kind: 'Meal', term: 'H' },
      { title: 'Sleep and recovery reading', where: 'Your room', kind: 'Measure', term: 'B' },
      { title: 'Why the body matters: a Purpose hour', where: 'Library', kind: 'Talk', term: 'P' },
      { title: 'Recovery massage, sixty minutes', where: 'Spa', kind: 'Treatment', term: 'D' },
    ],
    windows: ['8 – 12 Mar 2027', '19 – 23 Apr 2027', '7 – 11 Jun 2027'],
    beforeExtra: 'A home blood draw for the AIWO panel; LE8 self-report; device posted and linked.',
    outcomePlaceholder: 'e.g. I want to climb the stairs at the temple without stopping.',
  },
  slimcation: {
    secondary: ['D', 'B'],
    clinician: { name: 'Dr Karthik Raman', role: 'Endocrinologist', note: 'Present for the week; reviews your CGM trace each morning.' },
    signature: [
      { title: 'Body composition scan (DEXA)', where: 'Clinic', kind: 'Measure', term: 'H' },
      { title: 'Continuous glucose monitor fitted and explained', where: 'Clinic', kind: 'Measure', term: 'H' },
      { title: 'Metabolic consult with Dr Karthik', where: 'Clinic', kind: 'Talk', term: 'H' },
      { title: 'The ten-thousand-step morning', where: 'Estate trail', kind: 'Movement', term: 'H' },
      { title: 'Cooking for HbA1c, with the chef', where: 'Kitchen garden', kind: 'Meal', term: 'H' },
      { title: 'Food without guilt: a savouring lunch', where: 'Garden pavilion', kind: 'Meal', term: 'D' },
      { title: 'Stress and the evening snack', where: 'Quiet room', kind: 'Talk', term: 'B' },
    ],
    windows: ['14 – 21 Feb 2027', '21 – 28 Mar 2027', '9 – 16 May 2027'],
    beforeExtra: 'HbA1c or HOMA-IR drawn at home; visceral fat baseline booked.',
    outcomePlaceholder: 'e.g. I want my HbA1c out of the pre-diabetic range.',
  },
  fitcation: {
    secondary: ['D', 'B'],
    clinician: { name: 'Dr Neha Kulkarni', role: 'Sports physician', note: 'Clears every session against your capacity battery.' },
    signature: [
      { title: 'Capacity battery and VO₂max test', where: 'Performance lab', kind: 'Measure', term: 'H' },
      { title: 'Grip, balance and the floor test', where: 'Performance lab', kind: 'Measure', term: 'H' },
      { title: 'Sea swim with a coach', where: 'Beach', kind: 'Movement', term: 'H' },
      { title: 'Zone 2 cycle through the villages', where: 'Hinterland route', kind: 'Movement', term: 'H' },
      { title: 'Mobility and breath', where: 'Shala', kind: 'Movement', term: 'B' },
      { title: 'The long lunch', where: 'Beach shack', kind: 'Meal', term: 'D' },
    ],
    windows: ['Opens FY28 · register interest'],
    beforeExtra: 'Capacity battery self-test at home; physician clearance where needed.',
    outcomePlaceholder: 'e.g. I want to carry my grandchildren without thinking about my back.',
  },
  mindcation: {
    secondary: ['B', 'F'],
    clinician: { name: 'Dr Sanjay Menon', role: 'Psychologist', note: 'Holds the PSS-4 secondary measure and any screen that needs a person.' },
    signature: [
      { title: 'The Ikigai map, in its original sense', where: 'River room', kind: 'Talk', term: 'P' },
      { title: 'The 25-year statement, first draft', where: 'Library', kind: 'Talk', term: 'P' },
      { title: 'A silent morning by the Ganga', where: 'Ghat', kind: 'Movement', term: 'B' },
      { title: 'The Tomorrow Question, practised', where: 'Garden', kind: 'Talk', term: 'P' },
      { title: 'The Practice, weeks one and two in full', where: 'Shala', kind: 'Circle', term: 'P' },
      { title: 'The No list: room for what matters', where: 'Library', kind: 'Talk', term: 'F' },
    ],
    windows: ['Opens FY28 · register interest'],
    beforeExtra: 'Ikigai-9 and MLQ-Presence at home; the Joyspiration book posted.',
    outcomePlaceholder: 'e.g. I want a direction for the next ten years that I can say out loud.',
  },
  lovecation: {
    secondary: ['D', 'B'],
    clinician: { name: 'Dr Anjali Desai', role: 'Couples psychologist', note: 'Leads the Couples Check debrief. Shows where you agree and differ, never who said what.' },
    signature: [
      { title: 'Couples Check debrief: agree and differ', where: 'Lake pavilion', kind: 'Talk', term: 'R' },
      { title: 'Love maps, an evening for two', where: 'Your suite', kind: 'Room', term: 'R' },
      { title: 'The signature date: a boat at sunset', where: 'Lake Pichola', kind: 'Room', term: 'D' },
      { title: 'The repair conversation, practised', where: 'Garden room', kind: 'Talk', term: 'R' },
      { title: 'Couples abhyanga', where: 'Spa', kind: 'Treatment', term: 'D' },
      { title: 'One shared step, two private ones', where: 'Lake pavilion', kind: 'Talk', term: 'R' },
    ],
    windows: ['12 – 15 Feb 2027', '26 – 29 Mar 2027', '23 – 26 Apr 2027'],
    beforeExtra: 'The Couples Check, each partner privately; CSI-4 for each of you.',
    note: 'Made for two. Each partner keeps their own record and answers; neither sees the other’s.',
    outcomePlaceholder: 'e.g. We want to talk about something other than the children.',
  },
  wealthcation: {
    secondary: ['P', 'B'],
    clinician: { name: 'Dr Sanjay Menon', role: 'Psychologist', note: 'Present for the stress and autonomy sessions. This ’cation never gives financial or investment advice.' },
    signature: [
      { title: 'The time audit, with your real calendar', where: 'Board room', kind: 'Talk', term: 'F' },
      { title: 'The No list: three things to stop', where: 'Library', kind: 'Talk', term: 'F' },
      { title: 'Peace-of-mind checklist: papers, people, places', where: 'Board room', kind: 'Talk', term: 'F' },
      { title: 'A digital sabbath, sunrise to sunset', where: 'Anywhere but a screen', kind: 'Room', term: 'F' },
      { title: 'Enough: a conversation about purpose', where: 'Terrace', kind: 'Talk', term: 'P' },
      { title: 'The worry hour, held by a psychologist', where: 'Quiet room', kind: 'Talk', term: 'B' },
    ],
    windows: ['5 – 8 Mar 2027', '16 – 19 Apr 2027', '14 – 17 May 2027'],
    beforeExtra: 'Autonomy, time affluence and CFPB Financial Well-Being at home; calendar summary, if you allow it.',
    note: 'Time and choice, not portfolios. No financial or investment advice is given.',
    outcomePlaceholder: 'e.g. I want two evenings a week that belong to no one but me.',
  },
  beautycation: {
    secondary: ['H', 'B'],
    clinician: { name: 'Dr Ritu Malhotra', role: 'Dermatologist', note: 'Reads your skin imaging on arrival and re-reads it at Day 90.' },
    signature: [
      { title: 'Skin imaging and a dermatologist’s reading', where: 'Clinic suite', kind: 'Measure', term: 'H' },
      { title: 'The savouring facial, ninety minutes', where: 'Spa', kind: 'Treatment', term: 'D' },
      { title: 'Moments of Joy: a short film, your own', where: 'Garden', kind: 'Room', term: 'D' },
      { title: 'Jasmine, coffee and the morning market', where: 'Mylapore', kind: 'Movement', term: 'D' },
      { title: 'Sleep, skin and the wind-down', where: 'Your room', kind: 'Treatment', term: 'B' },
    ],
    windows: ['19 – 22 Feb 2027', '12 – 15 Mar 2027', '9 – 12 Apr 2027'],
    beforeExtra: 'Skin imaging booked; SPANE at home; your Joy Ledger opened a week early.',
    outcomePlaceholder: 'e.g. I want to notice the good parts of my day again.',
  },
  savourcation: {
    secondary: ['R', 'B'],
    clinician: { name: 'Dr Sanjay Menon', role: 'Psychologist', note: 'Present for all three days; holds any Ease screen that needs a person.' },
    signature: [
      { title: 'A dawn savouring walk on the backwaters', where: 'Kettuvallam jetty', kind: 'Movement', term: 'D' },
      { title: 'The slow meal: Kerala sadya, eaten in silence then together', where: 'Lake house', kind: 'Meal', term: 'D' },
      { title: 'The Joy Ledger, a masterclass', where: 'Library', kind: 'Talk', term: 'D' },
      { title: 'Don’t Postpone Joy: Practice week four, in full', where: 'Verandah', kind: 'Circle', term: 'D' },
      { title: 'Music on the water: a Carnatic evening', where: 'Houseboat', kind: 'Room', term: 'R' },
      { title: 'Ayurvedic shirodhara', where: 'Spa', kind: 'Treatment', term: 'B' },
    ],
    windows: ['5 – 8 Mar 2027', '2 – 5 Apr 2027', '7 – 10 May 2027'],
    beforeExtra: 'Your Joy Ledger opened a week early; SPANE and the savouring scale at home.',
    outcomePlaceholder: 'e.g. I want to stop saving the good things for later.',
  },
  sleepcation: {
    secondary: ['H', 'D'],
    clinician: { name: 'Dr Vivek Raghavan', role: 'Sleep physician', note: 'Reads the home sleep test. Any apnoea is routed to care, never left in a report.' },
    signature: [
      { title: 'Home sleep test review', where: 'Clinic', kind: 'Measure', term: 'B' },
      { title: 'CBT-I informed session: the sleep window', where: 'Quiet room', kind: 'Talk', term: 'B' },
      { title: 'The wind-down, built for your house', where: 'Your cottage', kind: 'Room', term: 'B' },
      { title: 'Morning light walk through the coffee estate', where: 'Estate', kind: 'Movement', term: 'H' },
      { title: 'Warm oil and a long bath', where: 'Spa', kind: 'Treatment', term: 'D' },
    ],
    windows: ['22 – 26 Feb 2027', '22 – 26 Mar 2027', '19 – 23 Apr 2027'],
    beforeExtra: 'ISI at home; a home sleep test posted where apnoea is suspected.',
    outcomePlaceholder: 'e.g. I want to wake up before the alarm and feel rested.',
  },
}

export interface ItinDay { day: number; title: string; items: { time: string; title: string; where: string; kind: ItemKind; term?: TermKey }[] }

/** Builds the day-by-day room and treatment schedule from the template. */
export function buildItinerary(slug: string): ItinDay[] {
  const c = CATIONS.find((x) => x.slug === slug)
  const d = CATION_DETAIL[slug]
  if (!c || !d) return []
  const nights = parseInt(c.nights, 10) || 3
  const days: ItinDay[] = []
  days.push({
    day: 1,
    title: 'Arrival',
    items: [
      { time: '12:00', title: 'Welcome, your card handed over in person', where: 'Arrival lounge', kind: 'Room' },
      { time: '14:00', title: `Intake with ${d.clinician.name}`, where: 'Clinic suite', kind: 'Talk', term: c.primary === 'ALL' ? undefined : c.primary },
      { time: '16:00', title: 'Baseline readings at the Signal Points', where: 'Signal Points 1–3', kind: 'Measure' },
      { time: '19:30', title: 'First dinner with your cohort', where: 'Terrace', kind: 'Meal', term: 'R' },
    ],
  })
  let s = 0
  for (let n = 2; n <= nights; n++) {
    const a = d.signature[s++ % d.signature.length]
    const b = d.signature[s++ % d.signature.length]
    days.push({
      day: n,
      title: a.title.split(':')[0].split(',')[0],
      items: [
        { time: '06:45', title: n % 2 ? 'Morning movement, at your pace' : 'Sunrise breath and stretch', where: 'Lawn', kind: 'Movement', term: 'H' },
        { time: '09:30', title: a.title, where: a.where, kind: a.kind, term: a.term },
        { time: '13:00', title: 'Lunch, unhurried', where: 'Garden pavilion', kind: 'Meal', term: 'D' },
        { time: '15:30', title: b.title, where: b.where, kind: b.kind, term: b.term },
        { time: '18:30', title: 'Circle, thirty minutes', where: 'Sea lounge', kind: 'Circle', term: 'R' },
      ],
    })
  }
  days.push({
    day: nights + 1,
    title: 'Hand-off and checkout',
    items: [
      { time: '08:00', title: 'Readings re-taken, like for like', where: 'Signal Points 1–3', kind: 'Measure' },
      { time: '10:00', title: 'Hand-off with your coach and concierge', where: 'Library', kind: 'Talk' },
      { time: '11:00', title: 'Your circle of eight, formed before departure', where: 'Sea lounge', kind: 'Circle', term: 'R' },
      { time: '12:00', title: 'Checkout; first action scheduled for tonight', where: 'Arrival lounge', kind: 'Room' },
    ],
  })
  return days
}

// ─── Joy Passport ─────────────────────────────────────────────────────────

export const PASSPORT = {
  number: 'JP-2027-0142',
  issued: '2026-12-31',
  issuedAt: 'Fairmont Mumbai',
  stamps: [
    { id: 's1', place: 'Fairmont Mumbai', what: 'Joycation · AIWO Joyspan 2027', when: '31 Dec 2026 – 5 Jan 2027', date: '2026-12-31', to: '2027-01-05' as string | undefined, kind: '’Cation', term: 'ALL' as const, done: true },
    { id: 's2', place: 'Joyspan House Chennai', what: 'Joyspan Session', when: 'Sat 20 Feb 2027', date: '2027-02-20', to: undefined as string | undefined, kind: 'House', term: 'R' as TermKey, done: false },
  ],
  // needs: what opens it. 'plus' comes with Joy OS Plus (and Patron); 'circle' with Circle membership.
  entitlements: [
    { label: 'Named coach and concierge', detail: 'Priya Natarajan · Ravi Shankar', used: null as null | string, needs: 'circle' as PassportNeed },
    { label: 'Quarterly Index', detail: 'Next re-measure opens Day 76', used: '1 of 4 this year', needs: 'circle' as PassportNeed },
    { label: 'Joyspan Sessions', detail: 'Any city, any House', used: '1 of 4 booked', needs: 'circle' as PassportNeed },
    { label: 'Circle of eight', detail: 'Mondays 7 pm with Priya', used: null, needs: 'plus' as PassportNeed },
    { label: 'The Joyspiration Practice', detail: 'All eight weeks, audio offline', used: null, needs: 'plus' as PassportNeed },
    { label: 'Joyspan House access', detail: 'Chennai · Mumbai opens FY28', used: null, needs: 'circle' as PassportNeed },
  ],
}

export type PassportNeed = 'plus' | 'circle'

/**
 * Each account's own Passport (L2). Arjun's was issued at the flagship; Lakshmi's when her son
 * became her helper; the account made in onboarding gets one in the app the day it joins, its
 * number taken from its AIWO ID.
 */
export function passportFor(account: 'arjun' | 'lakshmi' | 'new', aiwoId: string): { number: string; issued: string; issuedAt: string | null } {
  if (account === 'arjun') return { number: PASSPORT.number, issued: PASSPORT.issued, issuedAt: PASSPORT.issuedAt }
  if (account === 'lakshmi') return { number: 'JP-2027-0311', issued: '2027-01-08', issuedAt: null }
  return { number: `JP-2027-${aiwoId.replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase()}`, issued: SPECIMEN_NOW, issuedAt: null }
}

// ─── The Joyspiration Practice ────────────────────────────────────────────

export interface PracticeContent {
  week: number
  mentorLine: string
  audioTitle: string
  seconds: number
  transcript: string[]
  science: { title: string; body: string; faculty: string; ref: string }
  daily: string
  weekly: string
  yearly: string
  circlePrompt: string
  reflection: string
}

export const PRACTICE_CONTENT: PracticeContent[] = [
  {
    week: 1, mentorLine: 'Before you change anything, see it clearly.', audioTitle: 'The story your numbers tell', seconds: 292,
    transcript: ['Good morning. This week we begin not by changing anything, but by looking.', 'You have taken the Check, and perhaps the Index. Six terms. Some steady, some uneven. None of them is a verdict on you.', 'Read your Wheel slowly. Which petal surprised you? Which one did you already know?', 'Write one sentence that tells the story of your Wheel. Only one. That sentence is where we start.'],
    science: { title: 'Why we measure before we act', body: 'People who see a baseline across several life domains choose goals that are more specific and more balanced than those who start with a single goal. A composite index rewards balance: raising the lowest term moves the geometric mean more than raising the highest.', faculty: 'Prof. Lakshmi Narayanan, Science Office', ref: 'Joy OS method v1.0, §2 · geometric-mean aggregation' },
    daily: 'Look at your Wheel once each day, without judging it.', weekly: 'Write the one-sentence story of your Wheel.', yearly: 'Keep this sentence; read it again at your fourth Index.',
    circlePrompt: 'Which petal of your Wheel surprised you, and why?', reflection: 'Write the one sentence that tells the story of your Wheel.',
  },
  {
    week: 2, mentorLine: 'A good day begins the evening before.', audioTitle: 'The Tomorrow Question', seconds: 301,
    transcript: ['This week there is one question, and you ask it every evening.', 'What would make tomorrow worth waking up for?', 'Not the whole year. Not your life’s purpose. Tomorrow.', 'Purpose is not found in one great discovery. It is built, a day at a time, from small reasons to rise.'],
    science: { title: 'Meaning is felt in the near term', body: 'Presence of meaning (MLQ-P) tracks daily experiences of purposeful activity more closely than abstract life goals. Anticipating one valued activity raises next-day meaning ratings in experience-sampling studies.', faculty: 'Dr Sanjay Menon, Psychologist', ref: 'MLQ-Presence · Steger et al., 2006' },
    daily: 'Each evening, answer the Tomorrow Question in a sentence.', weekly: 'Read your seven answers on Sunday. What repeats?', yearly: 'Once a year, ask it of the next ten years.',
    circlePrompt: 'Share one answer to the Tomorrow Question that came true.', reflection: 'What would make tomorrow worth waking up for?',
  },
  {
    week: 3, mentorLine: 'You cannot hold a grudge and a hand at the same time.', audioTitle: 'Release the Ledger', seconds: 288,
    transcript: ['We all keep a ledger of what others owe us. An apology. A phone call. A thank-you that never came.', 'This week, look at that ledger honestly. Not to settle it. To close it.', 'Choose one entry. Only one. And let it go: not because they deserve it, but because you do.', 'Then call someone you have not spoken to this month.'],
    science: { title: 'Forgiveness and connection', body: 'Releasing a held grievance is associated with lower perceived stress and with more contact in one’s close network. Loneliness (UCLA-3) responds to frequency of warm contact more than to the number of contacts.', faculty: 'Dr Anjali Desai, Couples psychologist', ref: 'UCLA-3 · LSNS-6 · forgiveness interventions review' },
    daily: 'Notice one moment you felt owed something, and let it pass.', weekly: 'Close one entry in your ledger. Call one person from your 15.', yearly: 'On your birthday, write to someone you had drifted from.',
    circlePrompt: 'Without naming anyone, describe an entry you chose to close.', reflection: 'Which entry in your ledger are you ready to close?',
  },
  {
    week: 4, mentorLine: 'Your circumstances are part of your life. They do not have to become the whole of your life.', audioTitle: 'Don’t Postpone Joy', seconds: 300,
    transcript: ['There is a cupboard in many of our homes where the good things wait. The best plates. The silk saree. The bottle saved for a special day.', 'This week, I ask you to open that cupboard.', 'Your circumstances are part of your life. They do not have to become the whole of your life. The heavy quarter at work, the worry about a parent, the long list: they are real. And so is the tea on the verandah.', 'Each day, plan one small pleasure and keep the appointment as you would keep a meeting. Then notice three things about it, slowly.', 'Joy postponed is not joy saved. It is joy lost. Begin this evening.'],
    science: { title: 'Savouring is a skill, and it can be practised', body: 'Savouring — deliberately attending to and prolonging a positive experience — raises positive affect in randomised studies, with effects visible within two to four weeks. Planning the pleasure in advance roughly doubles the chance it happens. Your Daily Pleasure term weights SPANE balance, joy moments in the Ledger and the savouring scale.', faculty: 'Dr Sanjay Menon, Psychologist', ref: 'Bryant & Veroff, 2007 · SPANE (Diener et al., 2010) · Joy OS method v1.0' },
    daily: 'Plan one small pleasure; keep it like a meeting; notice three things.', weekly: 'Open the cupboard: use one thing you have been saving for “a special day”.', yearly: 'Choose one joy you have postponed for years, and put a date on it.',
    circlePrompt: 'Name one pleasure you have been saving for “later”. When is later?', reflection: 'What have you been saving for a special day, and what day will you use it?',
  },
  {
    week: 5, mentorLine: 'A ship reaches port by a thousand small corrections.', audioTitle: 'Continuous Correction', seconds: 296,
    transcript: ['No one walks a straight line to health. We drift and we correct.', 'This week, choose one signal from your body: sleep, steps, a sit-to-stand time. Watch it, and make one small correction each day.', 'Not a new regime. A correction.'],
    science: { title: 'Small corrections compound', body: 'Life’s Essential 8 scores improve most when members change one behaviour at a time and receive feedback within a day. Capacity measures such as five sit-to-stands respond to two short sessions a week within six weeks.', faculty: 'Dr Meera Iyer, Physician', ref: 'AHA Life’s Essential 8 · WHO ICOPE' },
    daily: 'Look at one body signal and make one small correction.', weekly: 'Re-time your five sit-to-stands.', yearly: 'Take the capacity battery at every Index.',
    circlePrompt: 'Which small correction surprised you by how much it helped?', reflection: 'Which one signal will you watch this week, and what is your correction?',
  },
  {
    week: 6, mentorLine: 'The first arrow is life. The second we fire ourselves.', audioTitle: 'The Two Questions', seconds: 304,
    transcript: ['When something hurts, ask two questions. First: what happened? Second: what am I adding to it?', 'The first arrow is the event. The second arrow is the story we tell about it, again and again.', 'This week, we practise putting down the second arrow.'],
    science: { title: 'The second arrow and acceptance', body: 'Acceptance and commitment approaches reduce experiential avoidance and perceived stress. Separating the event from rumination about it is associated with better sleep onset. This week is practice, not treatment: any screen that needs a person goes to a clinician.', faculty: 'Dr Sanjay Menon, Psychologist', ref: 'ACT review · PSS-4 · ISI' },
    daily: 'When something stings, ask the two questions.', weekly: 'Write one Second Arrow entry in your Ease space.', yearly: 'Review your Second Arrow journal with your psychologist, if you have one.',
    circlePrompt: 'Describe a second arrow you noticed yourself about to fire.', reflection: 'What happened, and what did you add to it?',
  },
  {
    week: 7, mentorLine: 'Curiosity is the opposite of fear, not of knowledge.', audioTitle: 'Stay Curious · Own Your Emotional Life', seconds: 298,
    transcript: ['Freedom is not only money and time. It is the freedom to choose how you respond.', 'This week, meet one strong feeling with curiosity instead of a verdict.', 'And write your No list: three things you will stop, so that there is room for what matters.'],
    science: { title: 'Autonomy and time affluence', body: 'Autonomy satisfaction (BPNSFS) and the feeling of having enough time predict wellbeing independently of income. Removing obligations raises time affluence more than adding efficiency tools.', faculty: 'Prof. Lakshmi Narayanan, Science Office', ref: 'BPNSFS · time affluence (Whillans et al.)' },
    daily: 'Meet one strong feeling with a question, not a verdict.', weekly: 'Write the No list: three things to stop this quarter.', yearly: 'Take one digital sabbath each season.',
    circlePrompt: 'What is on your No list, and what will you do with the time?', reflection: 'Which three things will you stop this quarter?',
  },
  {
    week: 8, mentorLine: 'Measure again. Then begin again.', audioTitle: 'The next ninety days', seconds: 306,
    transcript: ['Eight weeks ago you looked at your Wheel. This week, you take the Index again.', 'Whatever the number says, it is useful. If it rose, we learn what helped. If it fell, we learn that too, and a person will call you.', 'Then we choose the next ninety days, together.'],
    science: { title: 'Why we re-measure like for like', body: 'A change is only meaningful if measured the same way twice. Your Day-90 Index uses the same method version, the same instruments and the same grade, and the result joins the published cohort aggregate whether it rose or fell.', faculty: 'Prof. Lakshmi Narayanan, Science Office', ref: 'Joy OS method v1.0 · cohort publication rule' },
    daily: 'Read your Week 1 sentence once more.', weekly: 'Re-take the Index.', yearly: 'Choose the next ninety days with your coach.',
    circlePrompt: 'What will you carry into the next ninety days?', reflection: 'What will you carry into the next ninety days?',
  },
]

/** Joy moments a day (Ledger), averaged by Practice week — specimen. */
export const PRACTICE_PULSE = [
  { week: 'W1', moments: 2.1 },
  { week: 'W2', moments: 2.4 },
  { week: 'W3', moments: 2.6 },
  { week: 'W4', moments: 2.9 },
]

// ─── Circles ──────────────────────────────────────────────────────────────

export const CIRCLE_NEXT = { date: '2027-02-01', time: '19:00', week: 4, room: 'circle-fmb-jan-08' }

export const CIRCLE_SESSIONS = [
  { week: 3, date: '2027-01-25', title: 'Release the Ledger', attended: 8, note: 'Five of us closed one entry. Thomas will call his brother before Sunday.', you: true },
  { week: 2, date: '2027-01-18', title: 'The Tomorrow Question', attended: 7, note: 'Answers that came true: a walk, a phone call, finishing a book. Deepa joined by audio from a train.', you: true },
  { week: 1, date: '2027-01-11', title: 'The Check, the Index and the story', attended: 8, note: 'Eight one-sentence stories. We agreed to keep cameras optional and first names only.', you: true },
  { week: 0, date: '2027-01-05', title: 'Formed at Fairmont Mumbai', attended: 8, note: 'Formed in person before checkout, with Priya. Mondays at 7 pm for ninety days.', you: true },
]

export const OTHER_CIRCLES = [
  { id: 'couples', name: 'Couples circle', who: 'Four couples · with Kavya', when: 'Alternate Thursdays · 8 pm', lead: 'Dr Anjali Desai', status: 'Invited' as const, note: 'Each partner’s answers stay private to that partner.' },
  { id: 'family', name: 'Family circle', who: 'The Rao household · three generations', when: 'First Sunday · 11 am', lead: 'Priya Natarajan', status: 'Open' as const, note: 'Lakshmi joins in elder mode; large type and voice.' },
  { id: 'founders', name: 'Founders’ circle', who: 'Eight founders after an exit or a transition', when: 'Wednesdays · 7.30 am', lead: 'Coach Rahul Menon', status: 'Open' as const, note: 'Formed by life stage and language.' },
  { id: 'alumni', name: 'Fairmont alumni circle', who: 'Guests of AIWO Joyspan 2027', when: 'Monthly · last Saturday', lead: 'Ravi Shankar', status: 'Member' as const, note: 'For everyone who was there; join any month.' },
]

export const SALONS = [
  { id: 'sa1', title: 'Food & memory', host: 'Chef Revathi', when: 'Thu 4 Mar 2027 · 19:30', date: '2027-03-04', time: '19:30', where: 'Adyar, Chennai', term: 'D' as TermKey, seats: 16 },
  { id: 'sa2', title: 'Old friends, new questions', host: 'Priya Natarajan', when: 'Sat 20 Mar 2027 · 17:00', date: '2027-03-20', time: '17:00', where: 'Joyspan House Chennai', term: 'R' as TermKey, seats: 20 },
  { id: 'sa3', title: 'Music we grew up with', host: 'Vidwan T. Krishnan', when: 'Sun 11 Apr 2027 · 18:00', date: '2027-04-11', time: '18:00', where: 'Mylapore, Chennai', term: 'D' as TermKey, seats: 24 },
]

// ─── Events ───────────────────────────────────────────────────────────────

export const PASSES = [
  { id: 'ev2', code: 'JS-CHN-0220-0142', gate: 'Gate B · East lawn', seat: 'Open seating', holder: 'Arjun Rao', status: 'Valid' as const },
  { id: 'ev1', code: 'AJ27-FMB-0142', gate: 'Grand ballroom', seat: 'Table 14', holder: 'Arjun Rao', status: 'Used' as const },
]

export const SESSION_SCHEDULE = [
  { time: '09:30', title: 'Arrival; the Check at the door for guests', where: 'East lawn', term: undefined as TermKey | undefined, mine: true },
  { time: '10:00', title: 'Opening: the Mentor, in conversation', where: 'Main hall', term: 'P' as TermKey, mine: true },
  { time: '11:00', title: 'Experience Zone: Pleasure', where: 'Courtyard', term: 'D' as TermKey, mine: true },
  { time: '11:45', title: 'Experience Zone: Body · capacity battery', where: 'Studio', term: 'H' as TermKey, mine: false },
  { time: '12:30', title: 'Lunch with your circle', where: 'Garden', term: 'R' as TermKey, mine: true },
  { time: '14:00', title: 'Freedom: the time audit, live', where: 'Library', term: 'F' as TermKey, mine: false },
  { time: '14:00', title: 'Ease: the sleep plan, with Dr Vivek', where: 'Quiet room', term: 'B' as TermKey, mine: true },
  { time: '15:30', title: 'Your Index review with Priya, ten minutes', where: 'Room 3', term: undefined, mine: true },
]

export const ZONES: { term: TermKey; title: string; what: string; where: string }[] = [
  { term: 'H', title: 'Body Zone', what: 'Capacity battery stations: grip, sit-to-stand, balance; blood pressure at Signal Point 1.', where: 'Studio' },
  { term: 'P', title: 'Purpose Zone', what: 'The Ikigai wall; write your Tomorrow Question on a card and keep it.', where: 'Main hall foyer' },
  { term: 'R', title: 'People Zone', what: 'The Connections table; the Couples Check booth, each partner privately.', where: 'Garden' },
  { term: 'F', title: 'Freedom Zone', what: 'The time-audit lab and the No list. Never financial advice.', where: 'Library' },
  { term: 'D', title: 'Pleasure Zone', what: 'Tasting, music and the Joy Ledger. Ten seconds, three times a day.', where: 'Courtyard' },
  { term: 'B', title: 'Ease Zone', what: 'Sleep pods, the quiet room and a psychologist present all day.', where: 'Quiet room' },
]

/** ISO dates for the shared EVENTS (src/shared/platform.ts keeps English display strings), so
 *  dates render through the member's language with fmtDate. */
export const EVENT_DATES: Record<string, { date: string; to?: string; time?: string }> = {
  ev1: { date: '2026-12-31', to: '2027-01-05' },
  ev2: { date: '2027-02-20', time: '10:00' },
  ev3: { date: '2027-03-04', time: '19:30' },
  ev4: { date: '2027-04-09', time: '10:00' },
}

export const SESSIONS_OPEN = [
  { id: 'ev4', city: 'Dubai', when: 'Fri 9 Apr 2027 · 10:00', date: '2027-04-09', time: '10:00', where: 'Dubai (GCC region)', price: 'Included · Circle' },
  { id: 'ev5', city: 'Bengaluru', when: 'Sat 15 May 2027 · 10:00', date: '2027-05-15', time: '10:00', where: 'Bengaluru', price: 'Included · Circle' },
  { id: 'ev6', city: 'Coimbatore', when: 'Sat 12 Jun 2027 · 10:00', date: '2027-06-12', time: '10:00', where: 'Coimbatore', price: 'Included · Circle' },
]

export const FLAGSHIP_RECAP = {
  guests: 600,
  indexOn: '2027-01-02',
  cardHanded: '2027-01-04',
  circleFormed: '2027-01-05',
  sessionsAttended: ['The Summit: the Mentor’s address', 'Experience Zone: Pleasure', 'Capacity battery', 'The Ikigai map', 'The slow dinner'],
}

/**
 * New Year's Eve at AIWO Joyspan 2027 (Playbook p61): the evening ends with the Declaration at
 * 23:50, then the sun rises on the stage at midnight. Display text in i18n/journey NYE_TEXT.
 */
export const NYE_PROGRAMME: { time: string; title: string; where: string; term?: TermKey; declaration?: boolean }[] = [
  { time: '19:30', title: 'The slow dinner at the Long Table', where: 'The Long Table', term: 'D' },
  { time: '21:30', title: 'The Summit: the Mentor’s address', where: 'Main hall', term: 'P' },
  { time: '23:00', title: 'The quiet hour: the Wardrobe and the Quiet Pods', where: 'Pavilion' },
  { time: '23:50', title: 'The Declaration', where: 'Main hall', declaration: true },
  { time: '00:00', title: 'Begin {y} with joy: the sun rises on the stage', where: 'Main hall' },
]

/** The next flagship edition, open for requests (specimen). */
export const FLAGSHIP_NEXT = {
  id: 'ev7',
  name: 'AIWO Joyspan 2028',
  date: '2027-12-31',
  to: '2028-01-05',
  where: 'Fairmont Mumbai',
  guests: 600,
  confirmFrom: '2027-06-01',
}

/** What each person says in the specimen circle call, shown as live captions. People's own words stay in English. */
export const CAPTIONS: Record<string, string> = {
  Priya: 'Welcome, everyone. A minute of quiet first, then this week’s prompt. No one has to answer.',
  Kavya: 'Mine is the good dinner set from our wedding. Later, apparently, is when the children visit.',
  Nikhil: 'A trek in Ladakh. I have said “next year” for nine years now. I am putting a date on it tonight.',
  Farah: 'My grandmother’s recipe book. I keep it wrapped up so it stays nice. It should be stained, really.',
  Deepa: 'I am on audio again, sorry. Mine is a whole Sunday with no plans. Later is never, if I am honest.',
  Shalini: 'The veena in the corner. I stopped playing when I started working. Fifteen minutes on Saturday.',
  Vikram: 'Driving to the coast with my father while he still enjoys the drive. I am calling him after this.',
  Thomas: 'I will listen this week, if that is all right. Thank you for the notes on last week.',
}
