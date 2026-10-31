import type { TermKey } from '@/domain/types'
import { TODAY_ACTION } from '@/data/member'

// SPECIMEN DATA for the Care, Trust and Account lane — not a real member.
// Shapes mirror the Technical Architecture (Care bridge, Signals, Commerce, Trust centre).
// Numbers that already exist in src/data are imported there, never copied here.

/** "Today" in the specimen world: Day 23 of the loop that started 5 Jan 2027. */
export const SPECIMEN_NOW = '2027-01-28'

// ─── Care ─────────────────────────────────────────────────────────────────

export const PEOPLE_DETAIL: Record<string, { languages: string; city: string; next: string; nextKind: string; since: string; line: string; clinical?: boolean; replies: string }> = {
  p_priya: { languages: 'English · Tamil', city: 'Chennai', next: 'Mon 1 Feb · 19:00', nextKind: 'Circle call', since: 'Jan 2027', line: 'Your coach for the ninety days. Reviews on Day 15 and 45, the Day 60 talk.', replies: 'Replies within 1 working day' },
  p_meera: { languages: 'English · Tamil · Hindi', city: 'Chennai', next: 'Thu 4 Feb · 18:30', nextKind: 'Video consult', since: 'Oct 2026', line: 'Signed your Clinical-grade Index. Reviews panels and writes e-prescriptions.', clinical: true, replies: 'Clinical replies within 2 working days' },
  p_sanjay: { languages: 'English · Malayalam', city: 'Video, anywhere in India', next: 'On referral', nextKind: 'Not booked', since: 'Jan 2027', line: 'Reviews Ease screens above threshold. On call for the P0 pathway.', clinical: true, replies: 'Within 48 h of a referral' },
  p_ravi: { languages: 'English · Tamil · Hindi', city: 'Mumbai', next: 'Fri 5 Feb · 11:00', nextKind: 'Session booking', since: 'Dec 2026', line: 'Bookings, ’cations, Sessions and anything that needs arranging.', replies: 'Replies the same day, 08:00–20:00' },
}

export type RungStatus = 'used' | 'here' | 'open'
export const CARE_LADDER: { key: string; name: string; who: string; what: string; status: RungStatus }[] = [
  { key: 'practice', name: 'Practice', who: 'You, five minutes a day', what: 'The Joyspiration Practice. Week 4 of 8.', status: 'used' },
  { key: 'viva', name: 'VIVA', who: 'AI companion, supervised', what: 'Explains your Index and today’s action. Drafts, never signs.', status: 'used' },
  { key: 'circle', name: 'Circle', who: 'Eight members and a lead', what: 'Monday 7 pm, thirty minutes, the same eight people.', status: 'used' },
  { key: 'coach', name: 'Coach', who: 'Priya Natarajan', what: 'Named, with an SLA. Drift becomes a call within 72 h.', status: 'here' },
  { key: 'clinician', name: 'Psychologist · Physician', who: 'Dr Sanjay Menon · Dr Meera Iyer', what: 'Screens above threshold reach a clinician within 48 h.', status: 'open' },
  { key: 'cation', name: '’Cation', who: 'A place and a protocol', what: 'Three to seven nights for your lowest term, then the ninety days.', status: 'open' },
]

export const CONSULTS = [
  { id: 'cs1', with: 'p_meera', title: 'Review of your January panel', mode: 'Video', when: 'Thu 4 Feb 2027', time: '18:30', minutes: 20, status: 'confirmed' as const, prep: 'Bring any questions about Vitamin D and LDL-C. No fasting needed.' },
  { id: 'cs2', with: 'p_sanjay', title: 'Sleep and stress — first conversation', mode: 'Video', when: 'Tue 9 Feb 2027', time: '17:00', minutes: 45, status: 'requested' as const, prep: 'Requested by Priya after your Day 15 review. Dr Sanjay will confirm.' },
]

export const PAST_CONSULTS = [
  { id: 'pc1', with: 'p_meera', title: 'Clinical-grade Index sign-off', when: '4 Oct 2026', note: 'Summary in your record · signed' },
  { id: 'pc2', with: 'p_meera', title: 'Healthcation hand-off', when: '5 Jan 2027', note: 'Protocol for Body, the ninety days' },
]

export interface Marker { name: string; value: string; unit: string; range: string; flag: 'in' | 'watch' }
export const RESULTS: { id: string; name: string; lab: string; drawn: string; status: 'signed' | 'awaiting'; signedBy?: string; signedOn?: string; note?: string; markers: Marker[] }[] = [
  {
    id: 'r1', name: 'AIWO Metabolic panel', lab: 'AIWO lab partner · home draw, Chennai', drawn: '2027-01-21', status: 'signed', signedBy: 'Dr Meera Iyer', signedOn: '2027-01-24',
    note: 'Steady overall. Vitamin D is low; I have written a short course and we will re-check at Day 90. LDL-C is a little above where I would like it — we will talk on Thursday. — Meera',
    markers: [
      { name: 'HbA1c', value: '5.6', unit: '%', range: '< 5.7', flag: 'in' },
      { name: 'Fasting glucose', value: '94', unit: 'mg/dL', range: '70 – 99', flag: 'in' },
      { name: 'LDL-C', value: '118', unit: 'mg/dL', range: '< 100', flag: 'watch' },
      { name: 'ApoB', value: '92', unit: 'mg/dL', range: '< 90', flag: 'watch' },
      { name: 'hs-CRP', value: '1.1', unit: 'mg/L', range: '< 2.0', flag: 'in' },
      { name: 'Vitamin D (25-OH)', value: '19', unit: 'ng/mL', range: '30 – 100', flag: 'watch' },
      { name: 'TSH', value: '2.1', unit: 'mIU/L', range: '0.4 – 4.0', flag: 'in' },
    ],
  },
  {
    id: 'r2', name: 'Sleep study (home, one night)', lab: 'AIWO sleep partner · WatchPAT', drawn: '2027-01-26', status: 'awaiting',
    markers: [],
  },
  {
    id: 'r3', name: 'Capacity battery', lab: 'Signal Point · Fairmont Mumbai', drawn: '2027-01-03', status: 'signed', signedBy: 'Dr Meera Iyer', signedOn: '2027-01-05',
    note: 'Grip and sit-to-stand are good for your age. Gait speed normal. Repeat at Day 90.',
    markers: [
      { name: 'Grip strength (best of 3)', value: '38', unit: 'kg', range: '≥ 32', flag: 'in' },
      { name: '5× sit-to-stand', value: '10.4', unit: 's', range: '≤ 12', flag: 'in' },
      { name: 'Gait speed (4 m)', value: '1.2', unit: 'm/s', range: '≥ 1.0', flag: 'in' },
    ],
  },
]

export const ERX = [
  { id: 'rx1', drug: 'Cholecalciferol 60,000 IU', sig: 'One sachet weekly, after a meal, for 8 weeks', by: 'Dr Meera Iyer', reg: 'TNMC 84213', on: '2027-01-24', until: '2027-03-21', check: 'RxNav interaction check · no interactions', status: 'active' as const },
  { id: 'rx2', drug: 'Melatonin 2 mg (prolonged release)', sig: 'One tablet at 22:00 for 3 weeks, then stop', by: 'Dr Meera Iyer', reg: 'TNMC 84213', on: '2026-10-04', until: '2026-10-25', check: 'RxNav interaction check · no interactions', status: 'completed' as const },
]

export const CLINICIANS = [
  { id: 'cl1', name: 'Dr Sanjay Menon', role: 'Psychologist', gender: 'Man', languages: ['English', 'Malayalam'], city: 'Video', focus: 'Sleep, stress, life transitions', next: 'Tue 9 Feb · 17:00', initials: 'SM', tone: 'var(--term-b)' },
  { id: 'cl2', name: 'Dr Anitha Krishnan', role: 'Psychologist', gender: 'Woman', languages: ['English', 'Tamil'], city: 'Chennai', focus: 'Couples, grief, caregiving', next: 'Mon 1 Feb · 11:00', initials: 'AK', tone: 'var(--term-r)' },
  { id: 'cl3', name: 'Dr Farhan Qureshi', role: 'Psychologist', gender: 'Man', languages: ['English', 'Hindi'], city: 'Mumbai', focus: 'Work stress, founders, burnout', next: 'Wed 3 Feb · 19:30', initials: 'FQ', tone: 'var(--term-f)' },
  { id: 'cl4', name: 'Dr Meera Iyer', role: 'Physician', gender: 'Woman', languages: ['English', 'Tamil', 'Hindi'], city: 'Chennai', focus: 'Preventive medicine, metabolic health', next: 'Thu 4 Feb · 18:30', initials: 'MI', tone: 'var(--term-h)' },
  { id: 'cl5', name: 'Dr Rohit Bansal', role: 'Physician', gender: 'Man', languages: ['English', 'Hindi'], city: 'Bengaluru', focus: 'Sports medicine, capacity', next: 'Fri 5 Feb · 09:00', initials: 'RB', tone: 'var(--term-p)' },
  { id: 'cl6', name: 'Dr Lalitha Subramaniam', role: 'Psychologist', gender: 'Woman', languages: ['English', 'Tamil', 'Hindi'], city: 'Video', focus: 'Later life, elders and families', next: 'Thu 4 Feb · 10:00', initials: 'LS', tone: 'var(--term-d)' },
  { id: 'cl7', name: 'Dr Neha Kapoor', role: 'Physician', gender: 'Woman', languages: ['English', 'Hindi'], city: 'Mumbai', focus: 'Women’s health, menopause, sleep', next: 'Tue 2 Feb · 16:00', initials: 'NK', tone: 'var(--term-r)' },
]

// ─── Messages ─────────────────────────────────────────────────────────────

export interface Msg { id: string; from: 'me' | 'them' | 'system'; at: string; body: string; drafted?: boolean; signed?: string; clinical?: boolean }
export interface Thread { id: string; personId: string; subject: string; clinical?: boolean; unread: number; messages: Msg[] }

/** Specimen replies used after a member writes (non-clinical people only — clinicians reply themselves, later). */
export const AUTO_REPLY: Record<string, string> = {
  p_priya: 'Thank you for writing, Arjun. I have read this. Shall we talk it through on Monday after circle, or would a short call before then help more?',
  p_ravi: 'Noted, Arjun. I will arrange it and confirm here by this evening, with anything you need to bring.',
}

export const THREADS: Thread[] = [
  {
    id: 't_priya', personId: 'p_priya', subject: 'Day 15 review and this week', unread: 1,
    messages: [
      { id: 'm1', from: 'them', at: '2027-01-20T18:05', body: 'Good to talk today, Arjun. As we agreed: one pleasure planned each evening, and the verandah tea with Kavya when you can. I have asked Dr Sanjay to see you about sleep — no rush, just a first conversation.', drafted: true, signed: 'Priya Natarajan' },
      { id: 'm2', from: 'me', at: '2027-01-20T21:12', body: 'Thank you. The tea worked twice already. Kavya liked it more than I expected.' },
      { id: 'm3', from: 'them', at: '2027-01-21T08:40', body: 'That is lovely to hear. Twice is plenty. Tell me on Monday what you noticed.', signed: 'Priya Natarajan' },
      { id: 'm4', from: 'me', at: '2027-01-26T22:04', body: 'Work has been heavy this week. I skipped two evenings.' },
      { id: 'm5', from: 'them', at: '2027-01-27T18:02', body: 'Skipping is allowed — it is never counted against you. I looked at your quarter digest: Ledger moments are still steady, mostly people and food. Shall we use Monday’s circle to talk about protecting one evening a week?', drafted: true, signed: 'Priya Natarajan' },
    ],
  },
  {
    id: 't_meera', personId: 'p_meera', subject: 'January panel · signed', clinical: true, unread: 1,
    messages: [
      { id: 'm1', from: 'them', at: '2027-01-24T10:22', body: 'Your January panel is signed and in your record. Vitamin D is low, so I have written a short course — you will find it under Prescriptions in Care. LDL-C is a little above where I would like it. We will go through both on Thursday.', signed: 'Dr Meera Iyer', clinical: true },
      { id: 'm2', from: 'me', at: '2027-01-24T12:15', body: 'Thank you, doctor. Should I change anything before Thursday?' },
      { id: 'm3', from: 'them', at: '2027-01-25T09:10', body: 'Nothing urgent. Keep your evening walks. Start the Vitamin D sachet this Sunday, after lunch.', signed: 'Dr Meera Iyer', clinical: true },
    ],
  },
  {
    id: 't_ravi', personId: 'p_ravi', subject: 'Joyspan Session · Chennai, 20 Feb', unread: 0,
    messages: [
      { id: 'm1', from: 'them', at: '2027-01-18T14:50', body: 'Two seats are held for you and Kavya at Joyspan House Chennai on Saturday 20 February, 10:00. I have noted no onion and garlic for Kavya at lunch. Parking is in the basement.', drafted: true, signed: 'Ravi Shankar' },
      { id: 'm2', from: 'me', at: '2027-01-18T19:30', body: 'Perfect. Could my mother come for the afternoon part? She uses a walking stick.' },
      { id: 'm3', from: 'them', at: '2027-01-19T10:05', body: 'Of course. I have added Lakshmi-amma for the afternoon, with a ground-floor seat near the door and a helper at arrival.', signed: 'Ravi Shankar' },
    ],
  },
]

// ─── Household ────────────────────────────────────────────────────────────

export const HOUSEHOLD_MINOR = { id: 'h_ananya', name: 'Ananya Rao', role: 'Daughter · 15', initials: 'AR', tone: 'var(--ink-2)' }

export type GrantScope = 'index' | TermKey
export interface Grant { id: string; scope: GrantScope[]; from: string; to: string; state: 'active' | 'waiting' | 'revoked'; since: string }

export const GRANTS: Grant[] = [
  { id: 'g1', scope: ['index'], from: 'Arjun', to: 'Kavya', state: 'active', since: '2027-01-06' },
  { id: 'g2', scope: ['index'], from: 'Kavya', to: 'Arjun', state: 'active', since: '2027-01-06' },
  { id: 'g3', scope: ['R'], from: 'Arjun', to: 'Kavya', state: 'active', since: '2027-01-12' },
  { id: 'g4', scope: ['R'], from: 'Kavya', to: 'Arjun', state: 'active', since: '2027-01-12' },
  { id: 'g5', scope: ['D'], from: 'Arjun', to: 'Kavya', state: 'waiting', since: '2027-01-27' },
]

/** What Kavya shares back — her own numbers, shown only where both agreed. */
export const KAVYA_SHARED: Record<TermKey, number> = { H: 74, P: 78, R: 81, F: 62, D: 70, B: 18 }

export const COUPLES_CHECK = {
  takenOn: '2027-01-10',
  instrument: 'Couples Check · 16 statements, each privately',
  themes: [
    { theme: 'Time together in the week', agree: true },
    { theme: 'How we spend evenings', agree: false },
    { theme: 'Money and security', agree: true },
    { theme: 'Family and parents', agree: true },
    { theme: 'Pace of work', agree: false },
    { theme: 'Affection and closeness', agree: true },
    { theme: 'The next ten years', agree: true },
    { theme: 'Faith and meaning', agree: true },
  ],
}

// ─── Trust centre ─────────────────────────────────────────────────────────

export const EXTRA_ACCESS = [
  { id: 'e6', at: '2027-01-10 08:20', who: 'Ravi Shankar', role: 'Concierge', what: 'Name, household, accessibility note', purpose: 'Joyspan Session booking' },
  { id: 'e7', at: '2027-01-06 07:58', who: 'Kavya Rao', role: 'Household', what: 'Your Index (shared by agreement)', purpose: 'Household page' },
  { id: 'e8', at: '2027-01-05 16:30', who: 'Fairmont Mumbai', role: 'Venue', what: 'Name, room, dietary note — no health data', purpose: '’Cation check-out' },
]

export const EXPORTS_PAST = [
  { id: 'x1', requested: '2026-10-06', format: 'FHIR R4 bundle', size: '2.4 MB', status: 'Downloaded · link expired' },
]

export const CLAIMS_LOG = [
  { claim: '“Measures and raises your lowest term.”', state: 'Approved', by: 'Science Office · claims gate', on: '2026-12-12', note: 'Supported by cohort deltas, published up and down.' },
  { claim: '“Joyspan Index, method v1.0.”', state: 'Approved', by: 'Science Office', on: '2026-07-01', note: 'Weights and λ published on the method page.' },
  { claim: '“Adds years to your life.”', state: 'Refused', by: 'Science Office · claims gate', on: '2026-09-03', note: 'Never used. JALY stays a research metric until validated.' },
  { claim: '“Reverses ageing.”', state: 'Refused', by: 'Science Office · claims gate', on: '2026-09-03', note: 'Never used, anywhere.' },
  { claim: '“Sleepcation improves sleep for most guests.”', state: 'Withdrawn', by: 'Science Office · falsifier', on: '2027-01-15', note: 'Q4 cohort: 48% improved, under the 50% line. Published and being redesigned.' },
]

// ─── Membership ───────────────────────────────────────────────────────────

export const INVOICES = [
  { id: 'INV-2027-000418', date: '2027-01-01', item: 'Joy OS Plus · January', total: 499, method: 'UPI', status: 'Paid' },
  { id: 'INV-2026-011872', date: '2026-12-15', item: 'Circle membership · 2027', total: 150000, method: 'Card', status: 'Paid' },
  { id: 'INV-2026-011203', date: '2026-12-01', item: 'Joy OS Plus · December', total: 499, method: 'UPI', status: 'Paid' },
  { id: 'INV-2026-010554', date: '2026-11-01', item: 'Joy OS Plus · November', total: 499, method: 'UPI', status: 'Paid' },
  { id: 'INV-2026-009912', date: '2026-10-01', item: 'Joy OS Plus · October', total: 499, method: 'UPI', status: 'Paid' },
]
export const GSTIN_AIWO = '33AAKCA4417M1Z2'
export const GST_RATE = 0.18

export const ENTITLEMENTS = [
  { name: 'All six spaces in full', from: 'Plus', use: 'Included' },
  { name: 'Devices and signals', from: 'Plus', use: 'Oura · Apple Health linked' },
  { name: 'The Joyspiration Practice', from: 'Plus', use: 'Week 4 of 8' },
  { name: 'Circle of eight', from: 'Plus', use: 'Mondays 19:00 with Priya' },
  { name: 'Named coach and concierge', from: 'Circle', use: 'Priya Natarajan · Ravi Shankar' },
  { name: 'Quarterly Index', from: 'Circle', use: 'Next: 2 Apr 2027' },
  { name: 'Joyspan Sessions', from: 'Circle', use: 'Two seats held · 20 Feb, Chennai' },
  { name: 'The ninety days, continued', from: 'Circle', use: 'Day 23 of 90' },
]

// ─── Devices ──────────────────────────────────────────────────────────────

export type DeviceState = 'connected' | 'available' | 'android'
export const DEVICES: { id: string; name: string; via: string; state: DeviceState; lastSync?: string; freshness?: 'fresh' | 'stale'; signals: string[]; terms: TermKey[]; note: string; isDefault?: boolean }[] = [
  { id: 'oura', name: 'Oura Ring Gen 4', via: 'via Terra', state: 'connected', lastSync: 'Today · 06:42', freshness: 'fresh', signals: ['Sleep stages', 'HRV (rMSSD)', 'Resting HR', 'Temperature trend', 'Sleep regularity'], terms: ['H', 'D', 'B'], note: 'Default device. Sleep, recovery signals and regularity.', isDefault: true },
  { id: 'apple', name: 'Apple Health', via: 'HealthKit · on this iPhone', state: 'connected', lastSync: 'Today · 07:10', freshness: 'fresh', signals: ['Steps', 'Workouts', 'VO₂max', 'Mindful minutes'], terms: ['H', 'D'], note: 'Read per type. Writes back only mindful minutes.' },
  { id: 'hc', name: 'Health Connect', via: 'Android', state: 'android', signals: ['Steps', 'Sleep', 'Heart rate', 'Exercise'], terms: ['H', 'B'], note: 'For Android phones. Replaces Google Fit, which ends in 2026.' },
  { id: 'whoop', name: 'WHOOP', via: 'via Terra', state: 'available', signals: ['Sleep', 'HRV', 'Resting HR'], terms: ['H', 'B'], note: 'Raw signals only.' },
  { id: 'garmin', name: 'Garmin', via: 'via Terra', state: 'available', signals: ['Steps', 'Workouts', 'Sleep', 'VO₂max'], terms: ['H'], note: 'Raw signals only.' },
  { id: 'ultrahuman', name: 'Ultrahuman Ring', via: 'via Terra', state: 'available', signals: ['Sleep', 'HRV', 'Movement'], terms: ['H', 'B'], note: 'Raw signals only.' },
]

export const HEALTHKIT_TYPES = [
  { id: 'steps', label: 'Steps', term: 'H' as TermKey, on: true },
  { id: 'workouts', label: 'Workouts', term: 'H' as TermKey, on: true },
  { id: 'vo2', label: 'VO₂max (estimate)', term: 'H' as TermKey, on: true },
  { id: 'rhr', label: 'Resting heart rate', term: 'H' as TermKey, on: false },
  { id: 'sleep', label: 'Sleep analysis', term: 'B' as TermKey, on: false },
  { id: 'mindful', label: 'Mindful minutes (read)', term: 'D' as TermKey, on: true },
]

/** Hours of ring wear per night, last 14 nights (15–28 Jan). 0 = no data. */
export const WEAR_NIGHTS = [
  { d: '15', h: 7.4 }, { d: '16', h: 7.9 }, { d: '17', h: 6.8 }, { d: '18', h: 0 }, { d: '19', h: 0 }, { d: '20', h: 7.1 }, { d: '21', h: 7.6 }, { d: '22', h: 8.0 }, { d: '23', h: 3.2 }, { d: '24', h: 7.3 }, { d: '25', h: 6.9 }, { d: '26', h: 7.2 }, { d: '27', h: 7.5 }, { d: '28', h: 7.8 },
]

// ─── Notifications (shared by Settings and the notification centre) ──────

export const NOTIF_TYPES = [
  { id: 'ledger', label: 'Joy Ledger prompts', desc: 'Ten-second prompts around 12:40, 16:15 and 21:30.', perDay: 3 },
  { id: 'action', label: 'Today’s one action', desc: 'A single nudge at the time it fits your day.', perDay: 1 },
  { id: 'circle', label: 'Circle reminders', desc: 'An hour before Monday’s call.', perDay: 0 },
  { id: 'people', label: 'Messages from your people', desc: 'When Priya, Ravi or a clinician writes.', perDay: 0 },
  { id: 'loop', label: 'Ninety-day milestones', desc: 'Day 15 and 45 reviews, the Day 76 re-measure window.', perDay: 0 },
] as const
export type NotifId = (typeof NOTIF_TYPES)[number]['id']
export type Channel = 'push' | 'whatsapp' | 'email' | 'letter'
export interface NotifPrefs { types: Record<NotifId, boolean>; ledgerCount: 1 | 2 | 3; channels: Record<Channel, boolean>; quietFrom: string; quietTo: string }
export const DEFAULT_NOTIF_PREFS: NotifPrefs = {
  types: { ledger: true, action: true, circle: true, people: true, loop: true },
  ledgerCount: 2,
  channels: { push: true, whatsapp: false, email: true, letter: true },
  quietFrom: '21:45',
  quietTo: '07:30',
}
export const LEDGER_TIMES: Record<1 | 2 | 3, string[]> = { 1: ['21:30'], 2: ['12:40', '21:30'], 3: ['12:40', '16:15', '21:30'] }
/** Pushes on the busiest day — the budget is three, across every channel. */
export function pushesPerDay(p: NotifPrefs) {
  return (p.types.ledger ? p.ledgerCount : 0) + (p.types.action ? 1 : 0)
}

export type NotifKind = 'ledger' | 'action' | 'circle' | 'people' | 'loop'
export interface Notif { id: string; kind: NotifKind; day: 'today' | 'week' | 'upcoming'; at: string; ago: string; title: string; body: string; to: string; personId?: string; read: boolean }
/** Specimen notifications for Thu 28 Jan 2027 (Day 23) and earlier that week. */
export const NOTIFICATIONS: Notif[] = [
  { id: 'n1', kind: 'ledger', day: 'today', at: '12:40', ago: '1 h ago', title: 'Anything good in the last few hours?', body: 'Ten seconds for your Joy Ledger. Skipping is never counted.', to: '/app/ledger', read: false },
  { id: 'n2', kind: 'people', day: 'today', at: '10:05', ago: '3 h ago', title: 'Priya Natarajan wrote', body: 'Shall we use Monday’s circle to talk about protecting one evening a week?', to: '/app/care/messages?p=p_priya', personId: 'p_priya', read: false },
  { id: 'n3', kind: 'action', day: 'today', at: '07:45', ago: '6 h ago', title: 'Today’s one action is ready', body: `${TODAY_ACTION.title} ${TODAY_ACTION.detail}`, to: '/app', read: true },
  { id: 'n4', kind: 'people', day: 'week', at: 'Mon 25 Jan · 09:10', ago: '3 days ago', title: 'Dr Meera Iyer wrote', body: 'Nothing urgent. Start the Vitamin D sachet this Sunday, after lunch.', to: '/app/care/messages?p=p_meera', personId: 'p_meera', read: false },
  { id: 'n5', kind: 'circle', day: 'week', at: 'Mon 25 Jan · 18:00', ago: '3 days ago', title: 'Your circle meets in an hour', body: 'Monday 19:00 with Priya — thirty minutes, the same eight people.', to: '/app/circles', read: true },
  { id: 'n6', kind: 'loop', day: 'week', at: 'Wed 20 Jan · 08:00', ago: '8 days ago', title: 'Day 15 review with Priya', body: 'Fifteen days in. A short look at what is working, with a person.', to: '/app/index', read: true },
  { id: 'n7', kind: 'loop', day: 'upcoming', at: 'Fri 19 Feb · 18:00', ago: 'in 22 days', title: 'Day 45 review with Priya', body: 'By video, thirty minutes. You will hear about it the day before — never at night.', to: '/app/index', read: true },
  { id: 'n8', kind: 'loop', day: 'upcoming', at: 'Mon 22 Mar · 08:00', ago: 'in 53 days', title: 'Day 76 · your re-measure window opens', body: 'Two weeks to take the Index again, ahead of Day 90 on 2 Apr.', to: '/app/index/day-90', read: true },
]

// ─── Profile ──────────────────────────────────────────────────────────────

export const DEFAULT_NOMINEE = { name: 'Kavya Rao', relation: 'Spouse', email: 'kavya.rao@example.in' }
export const DEFAULT_EMERGENCY = { name: 'Kavya Rao', relation: 'Spouse', phone: '+91 98400 31417', consented: true, since: '2026-07-06' }
