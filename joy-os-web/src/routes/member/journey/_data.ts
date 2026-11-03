import type { TermKey } from '@/domain/types'
import { CATIONS } from '@/data/platform'

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
  bookingRef: 'JC-FMB-2701-0001',
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
    clinician: { name: 'Dr Meera Iyer', role: 'Physician · AIWO Clinical', note: 'On the floor every day of the edition, not on call. Before checkout, reads your on-site Index with you against your Clinical-grade baseline.' },
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
    windows: ['14 – 19 Mar 2027 · Joyspan House Chennai edition', '10 – 15 Oct 2027 · Fairmont Mumbai', '31 Dec 2027 – 5 Jan 2028 · AIWO Joyspan 2028'],
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

/** `titleFrom`: the full session the day is named after (shown shortened). `tpl`/`vars`: a title with a name filled in. */
export interface ItinDay { day: number; title: string; titleFrom?: string; items: { time: string; title: string; tpl?: string; vars?: Record<string, string>; where: string; kind: ItemKind; term?: TermKey }[] }

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
      { time: '14:00', title: `Intake with ${d.clinician.name}`, tpl: 'Intake with {name}', vars: { name: d.clinician.name }, where: 'Clinic suite', kind: 'Talk', term: c.primary === 'ALL' ? undefined : c.primary },
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
      titleFrom: a.title,
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
  number: 'JP-2027-0001',
  issued: '2026-12-31',
  issuedAt: 'Fairmont Mumbai',
  stamps: [
    { id: 's1', place: 'Fairmont Mumbai', what: 'Joycation · AIWO Joyspan 2027', when: '31 Dec 2026 – 5 Jan 2027', kind: '’Cation', term: 'ALL' as const, done: true },
    { id: 's2', place: 'Joyspan House Chennai', what: 'Joyspan Session', when: 'Sat 20 Feb 2027', kind: 'House', term: 'R' as TermKey, done: false },
  ],
  entitlements: [
    { label: 'Named coach and concierge', detail: 'Priya Natarajan · Ravi Shankar', used: null as null | string },
    { label: 'Quarterly Index', detail: 'Next re-measure opens Day 76', used: '1 of 4 this year' },
    { label: 'Joyspan Sessions', detail: 'Any city, any House', used: '1 of 4 booked' },
    { label: 'Circle of eight', detail: 'Mondays 7 pm with Priya', used: null },
    { label: 'The Joyspiration Practice', detail: 'All eight weeks, audio offline', used: null },
    { label: 'Joyspan House access', detail: 'Chennai · Mumbai opens FY28', used: null },
  ],
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

// The Mentor’s five-minute scripts, about 550–650 words each, as spoken.
const T1 = [
  'Good morning. Welcome to the Joyspiration Practice. For the next eight weeks I will speak with you for five minutes at a time, and I will ask you to do one small thing each day. This first week we begin not by changing anything, but by looking. Before a doctor treats, she examines. Before a gardener plants, he walks the land. We will do the same with your life.',
  'You have taken the Check, and perhaps the Index. You have seen six terms: your body, your purpose, your people, your freedom, your daily pleasure, and the suffering that could be prevented. Some of them are steady. Some are uneven. I want to say this clearly at the start: none of them is a verdict on you. A number is a lamp, not a judge. It shows you the room; it does not tell you who you are.',
  'Let me tell you about a man I met in Coimbatore. He ran a textile business that his father had started, and he was proud, rightly, of what he had built. When he saw his Wheel for the first time, he laughed. Body, strong. Freedom, strong. And People, very small. He said, “I knew this. I have known it for ten years. I simply never had to look at it.”',
  'That is what this week is for. Not to discover something entirely new, but to look at what you already half-know, in good light, without hurrying away from it. Most of us are very skilled at not looking. We look at the phone instead. We look at the next task. We look at other people’s lives. This week, we look at our own.',
  'So here is the teaching. Your Index is a geometric mean. That sounds technical, but the idea is simple and very old. A chain is as strong as its weakest link. A meal is spoiled by one bad dish. In the same way, the lowest of your six terms pulls the whole Index down more than the highest one lifts it up. Balance matters more than brilliance in one corner.',
  'This means you do not need to become a different person. You need to give a little more light to the corner that has been in the dark. For one person that is sleep. For another it is an old friendship. For another it is ten minutes a day that belong to no one else.',
  'Here is your practice for this week. Each day, open your Wheel once. Look at it the way you would look at a photograph of your family: with attention, and without judgement. Ask yourself two questions. Which petal surprised me? And which petal did I already know? Do not try to fix anything yet. Only notice.',
  'Then, once this week, write one sentence. Only one. A sentence that tells the story of your Wheel. It might be, “I have looked after my work and forgotten my friends.” It might be, “My body is carrying a worry my mind will not name.” It might be, “I am more content than I thought, and more tired.” That sentence is where we start.',
  'Think of the morning kolam at the doorstep. The woman who draws it does not draw the whole design at once. She places the dots first, carefully, in the right places. Only then does she join them. This week you are placing the dots. Next week we begin to draw the line between them.',
  'On Monday you will meet your circle, and Priya will ask which petal surprised you. You may share the sentence, or you may keep it to yourself. Both are fine. The Practice is private unless you choose otherwise.',
  'Keep this sentence safe. In eight weeks, you will read it again, after your next Index, and you will see how the story has moved. Look gently this week. That is all. Begin today.',
]

const T2 = [
  'Good evening. This week there is one question, and I would like you to ask it every evening, just before you sleep. It is a small question, and it is a powerful one. What would make tomorrow worth waking up for?',
  'Notice what the question does not ask. It does not ask what your purpose in life is. It does not ask where you will be in ten years. It does not ask you to find your passion. Those are large questions, and they have their place. But large questions can freeze us. We stand in front of them like a traveller in front of a mountain, and we do not take the first step.',
  'Tomorrow is a step you can take. Not the whole year. Not your life’s purpose. Tomorrow.',
  'I learnt this from my grandmother. Every night, after the kitchen was closed, she would sit on the swing in the hall and say aloud what she would do in the morning. “I will make the payasam for your uncle; he is coming. I will go to the temple early, before the crowd.” She was not making a plan. She was giving herself a reason to rise. She lived to ninety-one, and she rose early every day of her life.',
  'Here is the teaching. Purpose is not found in one great discovery, like a treasure under the floor. It is built, a day at a time, from small reasons to rise. The research our faculty shares with you this week says the same thing in its own language: meaning is felt in the near term, in the activities we look forward to, more than in abstract goals we hold far away.',
  'Your answer can be very ordinary. A walk with your wife before the heat. Finishing the chapter you began. Calling your son before his exam. Teaching your daughter to ride the bicycle. Five quiet minutes with the newspaper before anyone else is awake. Ordinary is good. Ordinary is where most of life is lived.',
  'So here is your practice. Each evening, take a pen, or open the Ledger, and answer the question in one sentence. Write it down; do not keep it only in your head. The written word becomes a small promise to yourself, and we tend to keep the promises we can see.',
  'In the morning, do not check whether you were successful. Just live the day. Some answers will come true. Some will not, because life will interrupt, as it always does. That is fine. The question is not a test. It is a habit of looking forward.',
  'On Sunday, read your seven answers together. What repeats? If the same person appears three times, that person matters to you more than your calendar shows. If the same activity appears again and again, perhaps it deserves a regular place in your week. The repeats are where your purpose is speaking.',
  'Once a year, on your birthday or at the New Year, ask the larger version of the question. What would make the next ten years worth living? You will find it easier to answer after a year of small evenings.',
  'On Monday your circle will share one answer that came true. Bring yours. What would make tomorrow worth waking up for? Ask it tonight.',
]

const T3 = [
  'Good morning. Let us begin this week with an honest admission. We all keep a ledger. Not the one your accountant keeps. Another one, kept quietly in the heart, of what other people owe us.',
  'An apology that never came. A phone call that was not returned. A thank-you we deserved and did not receive. The relative who did not come to the wedding. The colleague who took the credit. The friend who was busy when we needed them. The entries are small, most of them, but they add up, and over the years the ledger becomes heavy.',
  'Here is the difficulty. You cannot hold a grudge and a hand at the same time. The hand that is clenched around an old debt cannot open to receive a new friendship, or even to keep an old one warm. Every entry in the ledger is a small wall between you and someone.',
  'I once spent eleven years not speaking to a cousin. It began with a property matter, the kind of thing that happens in every Indian family. By the end, I could not remember the exact amount. I could only remember that I was right. When we finally sat together, at his daughter’s wedding, we spoke for three hours. We did not mention the property once.',
  'This week, I ask you to look at your own ledger honestly. Not to settle it. Settling means proving who was right, and that rarely ends well. I ask you to close it. Choose one entry. Only one. And let it go: not because they deserve it, but because you do.',
  'Letting go does not mean pretending it did not happen. It does not mean you must call that person, or forgive them out loud, or trust them again. Sometimes it is wise to keep a distance. Closing the entry means only this: you stop carrying it. You put the bag down.',
  'Here is the practice for each day. Notice one moment when you feel owed something. It may be very small. The driver who did not wait. The family member who did not ask how your day was. Notice the feeling, name it quietly, “owed”, and let it pass, the way you let a car pass at a crossing.',
  'And once this week, do two things. Close one real entry. Write it down if that helps, and then write beside it, “closed”. Then call one person from your fifteen, the people closest to you, whom you have not spoken to this month. Not to discuss anything. Just to hear their voice.',
  'Our faculty will tell you that loneliness responds to how often we feel warm contact, more than to how many people we know. One call a week matters more than a hundred contacts in the phone.',
  'On your birthday each year, write to someone you had drifted from. A short message is enough. “I was thinking of you.” You will be surprised how many doors are only closed, not locked.',
  'In the circle on Monday, without naming anyone, you may describe an entry you chose to close. The ledger is lighter when it is shared. Begin today, with one entry.',
]

const T4 = [
  'Good evening. There is a cupboard in many of our homes where the good things wait. The best plates, the ones with the gold rim. The silk saree, still in its paper. The bottle saved for a special day. The good perfume, used only for weddings.',
  'We are a culture that saves. It is one of our strengths. Our parents saved, and their saving gave us schooling, homes, a start in life. I honour that. But somewhere along the way, many of us began to save not only money, but joy itself. We put pleasure in the cupboard and told it to wait.',
  'This week, I ask you to open that cupboard.',
  'Your circumstances are part of your life. They do not have to become the whole of your life. The heavy quarter at work, the worry about a parent, the long list of things to do: they are real, and I am not asking you to pretend otherwise. And so is the tea on the verandah. So is the jasmine at the gate. So is the evening light on the wall. Both are true at once.',
  'A woman in our first cohort told me about her mother’s Kanchipuram saree. It was given to her at her own wedding, and she wore it once, and then kept it for her daughter’s. Her daughter married abroad, in a registry office, in a winter coat. The saree was never worn again. “I was saving it,” she said, “and I did not know for what.”',
  'Joy postponed is not joy saved. It is joy lost. The special day we are saving for very often does not arrive in the form we imagined, and meanwhile three hundred ordinary days have passed without the good plates.',
  'Here is the teaching. Savouring is a skill, and like any skill it can be practised. To savour is to pay deliberate attention to something good, and to stay with it a little longer than you normally would. The faculty’s note this week explains that people who do this, on purpose, for a few minutes a day, feel the difference within two to four weeks. And planning the pleasure in advance makes it far more likely to happen.',
  'So here is your daily practice. Each morning, plan one small pleasure for the day. Small: ten minutes, not a holiday. Put it in your calendar and keep the appointment as you would keep a meeting with an important client. When the time comes, notice three things about it, slowly. The warmth of the cup. The sound of the birds. The taste of the second sip, which is always better than the first.',
  'Then, if you like, record it in your Joy Ledger. Ten seconds is enough. Over the weeks, the Ledger becomes a record of a life that was not postponed.',
  'Once this week, open the cupboard for real. Use one thing you have been saving for a special day. Eat on the good plates on an ordinary Tuesday. Wear the saree to dinner with your husband. Open the bottle with a friend. And once a year, choose one joy you have postponed for years, and put a date on it.',
  'In your circle on Monday, Priya will ask: what pleasure have you been saving for “later”, and when is later? Think about your answer this week. Joy postponed is joy lost. Begin this evening.',
]

const T5 = [
  'Good morning. This week we turn to the body, and I want to begin with a picture. A ship sailing from Chennai to Singapore does not travel in a straight line. The wind pushes it one way, the current another. The captain does not despair at this. He makes a small correction, and then another, and then another. A ship reaches port by a thousand small corrections.',
  'Our health works the same way. No one walks a straight line to health. We drift, and we correct. The weeks of travel and late dinners, the season of exams in the house, the month when a parent was in hospital: we drift. The question is not whether we drift. The question is whether we notice, and how quickly we turn the wheel.',
  'Many of us have tried the other way. The new regime that begins on the first of the month. The gym membership. The diet that removes everything we like. For a week or two, it works. And then life arrives, the regime breaks, and we feel we have failed. So we stop altogether until the next first of the month.',
  'This week I am not asking you for a new regime. I am asking for a correction.',
  'Here is the teaching. Your body is constantly giving you signals. How you slept. How many steps you walked. How long it takes you to stand up from a chair five times. These signals are not judgements. They are the wind and the current. The faculty’s note this week shows that people improve most when they change one behaviour at a time, and when they see feedback within a day.',
  'So choose one signal. Only one. If you wear a ring or a watch, it may be your sleep or your steps. If you do not, it may be the time it takes to climb the stairs at home, or your five sit-to-stands, which you can time with a phone and a dining chair.',
  'Each day this week, look at that one signal, and make one small correction. If you slept poorly, the correction may be to put the phone in the other room tonight. If you walked little, the correction may be to take the long way to the vegetable market. If the stairs felt heavy, the correction may be to climb them twice. Small. Always small.',
  'My friend in Madurai, a retired headmaster, began this way at sixty-eight. He timed his sit-to-stands on a Monday. It took him fourteen seconds. He did them twice a day, while the kettle boiled. Six weeks later it took him ten. He did not join a gym. He made a correction while the tea was being made.',
  'Once this week, re-time your five sit-to-stands and write the number down. Do not be disappointed if it has not changed. We are looking for direction, not miracles. And once a year, at every Index, take the full capacity battery with your coach, so you can see the long line of your corrections.',
  'If any signal worries you, a pain, a breathlessness, a reading that seems wrong, please do not correct it alone. Speak to your care team. That is what they are there for.',
  'In your circle, you will share which small correction surprised you. Choose your signal today. One signal, one correction. Begin now.',
]

const T6 = [
  'Good evening. This week is about the Ease term, the suffering that could be prevented, and I want to share an old teaching with you. It comes from the Buddha, though you will find the same wisdom in our own Gita, and in the words of every grandmother who ever told a child to stop crying over spilt milk.',
  'When something painful happens, it is like being struck by an arrow. That first arrow is life. It is real, and it hurts. A harsh word from your boss. A delayed payment. A diagnosis in the family. A child who will not call. We cannot always avoid the first arrow.',
  'But then, very often, we pick up a second arrow and fire it into ourselves. The second arrow is the story we tell about the first. “This always happens to me.” “I should have known.” “They do not respect me.” “What if it gets worse?” We tell the story again at dinner, and again at two in the morning, and each time the arrow goes a little deeper.',
  'The first arrow is life. The second we fire ourselves.',
  'This week, when something hurts, I ask you to stop and ask two questions. First: what actually happened? Only the facts, as a camera would record them. Second: what am I adding to it? The worry, the blame, the replaying, the imagining of the worst.',
  'Let me give you an example. A woman in our Chennai circle was passed over for a promotion. That was the first arrow, and it was painful. But by the evening she had decided that her manager disliked her, that her career was finished, and that she had wasted ten years. None of that had happened. When she asked the two questions, she found one fact and five stories. She put down the five stories, and slept for the first time in a week.',
  'Here is the teaching behind the practice. The faculty’s note explains that separating the event from rumination about the event is linked to lower stress and better sleep. You cannot always remove the first arrow. But you can learn, slowly, to put down the second.',
  'So each day, when something stings, ask the two questions. You may say them silently, or write them in the Ease space. What happened? What am I adding? Do not try to argue with your feelings. Simply notice which part is the arrow and which part is the story.',
  'Once this week, write one Second Arrow entry in your Ease space: the event in one line, and the story you added in another. Seeing them side by side is often enough to loosen the second arrow’s grip.',
  'I want to be very clear about one thing. This is a practice, not treatment. If you find that the pain is too heavy, that sleep has gone for many nights, or that you are thinking of harming yourself, please reach your care team, or the helpline in the app, today. A person will answer. There is no shame in this. It is what they are there for.',
  'In your circle on Monday, you may describe a second arrow you caught yourself about to fire. What happened, and what did you add to it? Ask the two questions tonight.',
]

const T7 = [
  'Good morning. This week we speak about freedom. When most people hear that word, they think of money, or time, or retirement. Those matter, and they are part of your Freedom term. But I want to speak about a deeper freedom: the freedom to choose how you respond to what you feel.',
  'Curiosity is the opposite of fear, not of knowledge. A child who sees a beetle on the path does not run from it, and does not pretend it is not there. The child crouches down and looks. What is it? Where is it going? What colour is its back in the sun? We were all that child once. Somewhere along the way, many of us learnt to meet our strong feelings not with curiosity, but with a verdict.',
  '“I am angry, so I am a bad person.” “I am anxious, so something must be wrong.” “I am sad, so I must be weak.” The verdict closes the door. And a feeling behind a closed door does not leave. It waits.',
  'This week, I ask you to meet one strong feeling each day with a question instead of a verdict. When anger comes, ask: what is this anger protecting? When anxiety comes, ask: what does it want me to notice? When sadness comes, ask: what have I lost, or what do I miss? You do not need perfect answers. The asking itself opens the door a little.',
  'A father in our Bengaluru circle told me that he would become furious every evening when his teenage son left his shoes in the hall. One evening he asked himself what the anger was protecting. The answer surprised him: he was afraid his son was growing up and no longer listened to him. The shoes were not the matter. The next evening he did not shout. He sat down and asked his son about his day.',
  'That is owning your emotional life. Not controlling every feeling, which no one can do. But choosing, more often, how you respond. That is a freedom no salary can buy.',
  'The second part of this week is practical, and it also concerns freedom. I would like you to write your No list. Three things you will stop this quarter, so that there is room for what matters. The faculty’s note explains something important: people feel richer in time when they remove obligations, much more than when they become more efficient at them.',
  'Your No list might include a committee you joined out of guilt. The second WhatsApp group that keeps you awake. The habit of checking email before breakfast. The Sunday visits to someone who drains you, made shorter. Each “no” is a quiet “yes” to something else.',
  'So here is the practice. Each day, meet one strong feeling with a question. Once this week, write your No list, three items, and decide what you will do with the time each one gives back. And once each season, take a digital sabbath: one day, sunrise to sunset, with the screens put away.',
  'This week is about choice, not portfolios. Nothing in it is financial advice, and your Freedom space never offers any.',
  'In your circle, Priya will ask what is on your No list, and what you will do with the time. Bring your three. Meet one feeling with curiosity today.',
]

const T8 = [
  'Good morning. We have come to the eighth week. Eight weeks ago you looked at your Wheel, perhaps for the first time with real attention, and you wrote one sentence about it. This week, you take the Index again.',
  'Before you do, read your Week 1 sentence once more. Read it slowly. Notice what has moved and what has not. You may find that the story you wrote then is still true. You may find it already feels like someone else’s story. Both are useful.',
  'Here is what I want you to remember about the Index. Whatever the number says, it is useful. If it rose, we learn what helped, and we keep doing it. If it fell, we learn that too, and it is not a failure. Life is not a straight line, as we said in Week 5. If it fell, a person will call you, not to judge, but to understand, and to help you choose what comes next.',
  'Our faculty’s note this week explains why we measure like for like: the same method, the same instruments, the same grade. A change only means something if it is measured the same way twice. And your result joins the published cohort aggregate whether it rose or fell. We do not hide the falls. Honesty is how we learn.',
  'Let me tell you what I have seen at the end of many Practices. A woman from Trichy, whose Pleasure term was her lowest, found it had risen by only a little. She was disappointed. Then she opened her Joy Ledger and saw ninety small entries she would never have noticed before. The number moved a little. Her days had moved a great deal. Both are true.',
  'Over these eight weeks you have practised looking clearly, asking the Tomorrow Question, closing an entry in your ledger, opening the cupboard, making small corrections, putting down the second arrow, and meeting your feelings with curiosity. You do not need to keep all seven. Choose the one or two that became yours.',
  'Here is your practice this week. Each day, read your Week 1 sentence once. Once this week, re-take the Index. Find a quiet half-hour; do not rush it. Answer honestly, as you are today, not as you wish to be.',
  'Then sit with your coach and choose the next ninety days, together. Look at your new Wheel. Which term is lowest now? It may be the same one, or it may have changed. Choose one thing for the next ninety days. One. The circle, the Ledger, a ’cation, a conversation that is overdue. Your coach will help you make it small enough to keep.',
  'Think again of the kolam at the doorstep. Every morning it is drawn fresh, and every evening it is swept away by feet and rain. The woman does not grieve this. She draws it again tomorrow. That is the Practice. Measure again. Then begin again.',
  'In your circle on Monday, the question is: what will you carry into the next ninety days? It has been a privilege to speak with you these eight weeks.',
  'Thank you for your attention. Thank you for your honesty. Begin again today.',
]

export const PRACTICE_CONTENT: PracticeContent[] = [
  {
    week: 1, mentorLine: 'Before you change anything, see it clearly.', audioTitle: 'The story your numbers tell', seconds: 292,
    transcript: T1,
    science: { title: 'Why we measure before we act', body: 'People who see a baseline across several life domains choose goals that are more specific and more balanced than those who start with a single goal. A composite index rewards balance: raising the lowest term moves the geometric mean more than raising the highest.', faculty: 'Prof. Lakshmi Narayanan, Science Office', ref: 'Joy OS method v1.0, §2 · geometric-mean aggregation' },
    daily: 'Look at your Wheel once each day, without judging it.', weekly: 'Write the one-sentence story of your Wheel.', yearly: 'Keep this sentence; read it again at your fourth Index.',
    circlePrompt: 'Which petal of your Wheel surprised you, and why?', reflection: 'Write the one sentence that tells the story of your Wheel.',
  },
  {
    week: 2, mentorLine: 'A good day begins the evening before.', audioTitle: 'The Tomorrow Question', seconds: 301,
    transcript: T2,
    science: { title: 'Meaning is felt in the near term', body: 'Presence of meaning (MLQ-P) tracks daily experiences of purposeful activity more closely than abstract life goals. Anticipating one valued activity raises next-day meaning ratings in experience-sampling studies.', faculty: 'Dr Sanjay Menon, Psychologist', ref: 'MLQ-Presence · Steger et al., 2006' },
    daily: 'Each evening, answer the Tomorrow Question in a sentence.', weekly: 'Read your seven answers on Sunday. What repeats?', yearly: 'Once a year, ask it of the next ten years.',
    circlePrompt: 'Share one answer to the Tomorrow Question that came true.', reflection: 'What would make tomorrow worth waking up for?',
  },
  {
    week: 3, mentorLine: 'You cannot hold a grudge and a hand at the same time.', audioTitle: 'Release the Ledger', seconds: 288,
    transcript: T3,
    science: { title: 'Forgiveness and connection', body: 'Releasing a held grievance is associated with lower perceived stress and with more contact in one’s close network. Loneliness (UCLA-3) responds to frequency of warm contact more than to the number of contacts.', faculty: 'Dr Anjali Desai, Couples psychologist', ref: 'UCLA-3 · LSNS-6 · forgiveness interventions review' },
    daily: 'Notice one moment you felt owed something, and let it pass.', weekly: 'Close one entry in your ledger. Call one person from your 15.', yearly: 'On your birthday, write to someone you had drifted from.',
    circlePrompt: 'Without naming anyone, describe an entry you chose to close.', reflection: 'Which entry in your ledger are you ready to close?',
  },
  {
    week: 4, mentorLine: 'Your circumstances are part of your life. They do not have to become the whole of your life.', audioTitle: 'Don’t Postpone Joy', seconds: 300,
    transcript: T4,
    science: { title: 'Savouring is a skill, and it can be practised', body: 'Savouring — deliberately attending to and prolonging a positive experience — raises positive affect in randomised studies, with effects visible within two to four weeks. Planning the pleasure in advance roughly doubles the chance it happens. Your Daily Pleasure term weights SPANE balance, joy moments in the Ledger and the savouring scale.', faculty: 'Dr Sanjay Menon, Psychologist', ref: 'Bryant & Veroff, 2007 · SPANE (Diener et al., 2010) · Joy OS method v1.0' },
    daily: 'Plan one small pleasure; keep it like a meeting; notice three things.', weekly: 'Open the cupboard: use one thing you have been saving for “a special day”.', yearly: 'Choose one joy you have postponed for years, and put a date on it.',
    circlePrompt: 'Name one pleasure you have been saving for “later”. When is later?', reflection: 'What have you been saving for a special day, and what day will you use it?',
  },
  {
    week: 5, mentorLine: 'A ship reaches port by a thousand small corrections.', audioTitle: 'Continuous Correction', seconds: 296,
    transcript: T5,
    science: { title: 'Small corrections compound', body: 'Life’s Essential 8 scores improve most when members change one behaviour at a time and receive feedback within a day. Capacity measures such as five sit-to-stands respond to two short sessions a week within six weeks.', faculty: 'Dr Meera Iyer, Physician', ref: 'AHA Life’s Essential 8 · WHO ICOPE' },
    daily: 'Look at one body signal and make one small correction.', weekly: 'Re-time your five sit-to-stands.', yearly: 'Take the capacity battery at every Index.',
    circlePrompt: 'Which small correction surprised you by how much it helped?', reflection: 'Which one signal will you watch this week, and what is your correction?',
  },
  {
    week: 6, mentorLine: 'The first arrow is life. The second we fire ourselves.', audioTitle: 'The Two Questions', seconds: 304,
    transcript: T6,
    science: { title: 'The second arrow and acceptance', body: 'Acceptance and commitment approaches reduce experiential avoidance and perceived stress. Separating the event from rumination about it is associated with better sleep onset. This week is practice, not treatment: any screen that needs a person goes to a clinician.', faculty: 'Dr Sanjay Menon, Psychologist', ref: 'ACT review · PSS-4 · ISI' },
    daily: 'When something stings, ask the two questions.', weekly: 'Write one Second Arrow entry in your Ease space.', yearly: 'Review your Second Arrow journal with your psychologist, if you have one.',
    circlePrompt: 'Describe a second arrow you noticed yourself about to fire.', reflection: 'What happened, and what did you add to it?',
  },
  {
    week: 7, mentorLine: 'Curiosity is the opposite of fear, not of knowledge.', audioTitle: 'Stay Curious · Own Your Emotional Life', seconds: 298,
    transcript: T7,
    science: { title: 'Autonomy and time affluence', body: 'Autonomy satisfaction (BPNSFS) and the feeling of having enough time predict wellbeing independently of income. Removing obligations raises time affluence more than adding efficiency tools.', faculty: 'Prof. Lakshmi Narayanan, Science Office', ref: 'BPNSFS · time affluence (Whillans et al.)' },
    daily: 'Meet one strong feeling with a question, not a verdict.', weekly: 'Write the No list: three things to stop this quarter.', yearly: 'Take one digital sabbath each season.',
    circlePrompt: 'What is on your No list, and what will you do with the time?', reflection: 'Which three things will you stop this quarter?',
  },
  {
    week: 8, mentorLine: 'Measure again. Then begin again.', audioTitle: 'The next ninety days', seconds: 306,
    transcript: T8,
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
  { id: 'sa1', title: 'Food & memory', host: 'Chef Revathi', when: 'Thu 4 Mar 2027 · 19:30', where: 'Adyar, Chennai', term: 'D' as TermKey, seats: 16 },
  { id: 'sa2', title: 'Old friends, new questions', host: 'Priya Natarajan', when: 'Sat 20 Mar 2027 · 17:00', where: 'Joyspan House Chennai', term: 'R' as TermKey, seats: 20 },
  { id: 'sa3', title: 'Music we grew up with', host: 'Vidwan T. Krishnan', when: 'Sun 11 Apr 2027 · 18:00', where: 'Mylapore, Chennai', term: 'D' as TermKey, seats: 24 },
]

// ─── Events ───────────────────────────────────────────────────────────────

/** The member's own specimen passes; the holder is the member's saved name (useMemberName). */
export const PASSES = [
  { id: 'ev2', code: 'JS-CHN-0220-0001', gate: 'Gate B · East lawn', seat: 'Open seating', status: 'Valid' as const },
  { id: 'ev1', code: 'AJ27-FMB-0001', gate: 'Grand ballroom', seat: 'Table 14', status: 'Used' as const },
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

export const SESSIONS_OPEN = [
  { id: 'ev4', city: 'Dubai', when: 'Fri 9 Apr 2027 · 10:00', where: 'Dubai (GCC region)', price: 'Included · Circle' },
  { id: 'ev5', city: 'Bengaluru', when: 'Sat 15 May 2027 · 10:00', where: 'Bengaluru', price: 'Included · Circle' },
  { id: 'ev6', city: 'Coimbatore', when: 'Sat 12 Jun 2027 · 10:00', where: 'Coimbatore', price: 'Included · Circle' },
]

export const FLAGSHIP_RECAP = {
  guests: 600,
  indexOn: '2027-01-02',
  cardHanded: '2027-01-04',
  circleFormed: '2027-01-05',
  sessionsAttended: ['The Summit: the Mentor’s address', 'Experience Zone: Pleasure', 'Capacity battery', 'The Ikigai map', 'The slow dinner'],
}

/**
 * New Year's Eve at AIWO Joyspan 2027 (Playbook p61): the evening ends with the
 * Declaration at 23:50, then the sun rises on the stage LED at midnight.
 */
export const NYE_PROGRAMME: { time: string; title: string; where: string; term?: TermKey; declaration?: boolean }[] = [
  { time: '19:30', title: 'The slow dinner at the Long Table', where: 'The Long Table', term: 'D' },
  { time: '21:30', title: 'The Summit: the Mentor’s address', where: 'Main hall', term: 'P' },
  { time: '23:00', title: 'The quiet hour: the Wardrobe and the Quiet Pods', where: 'Pavilion' },
  { time: '23:50', title: 'The Declaration', where: 'Main hall', declaration: true },
  { time: '00:00', title: 'Begin 2027 with joy: the sun rises on the stage', where: 'Main hall' },
]

/** Call-room captions — one line per member, first person, on this week’s prompt (specimen). */
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

/** The next flagship edition, open for requests (specimen). */
export const FLAGSHIP_NEXT = {
  id: 'ev7',
  name: 'AIWO Joyspan 2028',
  when: '31 Dec 2027 – 5 Jan 2028',
  where: 'Fairmont Mumbai',
  kind: 'Flagship' as const,
  what: 'Five nights at New Year: the Summit, the Experience Zones, your Index taken on site, and a new circle formed before checkout.',
  guests: 600,
  requestsOpen: 'Requests open now · places confirmed from 1 Jun 2027',
}

/** Sessions already booked this membership year, before anything booked here. */
export const SESSIONS_ALLOWANCE = { included: 4, bookedBefore: 1 }
