import type { Cation, DriftTask } from '@/domain/types'

// ’Cation engine — one engine, ten templates (Memo p.20).
export const CATIONS: Cation[] = [
  { slug: 'joycation', name: 'Joycation', primary: 'ALL', day90Measure: 'Full Joyspan Index re-score', status: 'LIVE', promise: 'The master ’cation. All six terms, measured and raised.', nights: '5 nights', priceFrom: '₹15 L', venues: ['Fairmont Mumbai', 'Joyspan House Chennai'] },
  { slug: 'healthcation', name: 'Healthcation', primary: 'H', day90Measure: 'LE8, capacity battery, panel delta', status: 'LIVE', promise: 'Know your body and give it a reason to matter.', nights: '4 nights', priceFrom: '₹4.5 L', venues: ['Fairmont Mumbai', 'Chennai'] },
  { slug: 'slimcation', name: 'Slimcation', primary: 'H', day90Measure: 'Visceral fat, ALMI, HbA1c or HOMA-IR', status: 'LIVE', promise: 'Metabolic change you can see on a panel.', nights: '7 nights', priceFrom: '₹3.2 L', venues: ['Coimbatore'] },
  { slug: 'fitcation', name: 'Fitcation', primary: 'H', day90Measure: 'Grip, sit-to-stand, VO₂max, ALMI', status: 'FY28', promise: 'Capacity for the next thirty years.', nights: '5 nights', priceFrom: '₹2.4 L', venues: ['Goa'] },
  { slug: 'mindcation', name: 'Mindcation', primary: 'P', day90Measure: 'Ikigai-9, MLQ-Presence; PSS-4 secondary', status: 'FY28', promise: 'A direction for the next ten years.', nights: '4 nights', priceFrom: '₹3.8 L', venues: ['Rishikesh'] },
  { slug: 'lovecation', name: 'Lovecation', primary: 'R', day90Measure: 'CSI-4 for each partner; Couples Check agreement', status: 'NEW', promise: 'Made for two. Come back closer.', nights: '3 nights', priceFrom: '₹2.9 L', venues: ['Udaipur'] },
  { slug: 'wealthcation', name: 'Wealthcation', primary: 'F', day90Measure: 'Autonomy, time affluence, CFPB', status: 'NEW', promise: 'Time and choice, not just money.', nights: '3 nights', priceFrom: '₹3.5 L', venues: ['Mumbai'] },
  { slug: 'beautycation', name: 'Beautycation', primary: 'D', day90Measure: 'Skin imaging re-read; SPANE; joy moments', status: 'LIVE', promise: 'Pleasure, noticed and kept.', nights: '3 nights', priceFrom: '₹1.56 L', venues: ['Chennai'] },
  { slug: 'savourcation', name: 'Savourcation', primary: 'D', day90Measure: 'Joy Ledger density, savouring, SPANE', status: 'NEW', promise: 'Learn to savour. Take it home.', nights: '3 nights', priceFrom: '₹1.9 L', venues: ['Kerala backwaters'] },
  { slug: 'sleepcation', name: 'Sleepcation', primary: 'B', day90Measure: 'ISI, sleep efficiency, apnoea routed', status: 'LIVE', promise: 'Sleep, returned to you.', nights: '4 nights', priceFrom: '₹2.2 L', venues: ['Coorg'] },
]

export const CATION_PHASES = [
  { key: 'pre', when: 'Day −14 → −1', name: 'Pre-arrival', what: 'Consent; Index baseline; device posted and linked; home draw where needed; first hello to the cohort; the named outcome in the guest’s words.' },
  { key: 'site', when: 'On site', name: 'Itinerary', what: 'Room and treatment schedule; readings flow into the record from Signal Points; the card handed over in person; offline-capable on the floor.' },
  { key: 'checkout', when: 'Checkout', name: 'Hand-off', what: 'Protocol live for the primary term; coach and concierge named; first action scheduled; the circle formed before departure.' },
  { key: 'review', when: 'Day 15 · 45', name: 'Reviews', what: 'Drift becomes a call; protocol adjusted by the coach; physician where clinical.' },
  { key: 'next', when: 'Day 60', name: 'Next step', what: 'The conversation by the lowest term: membership, the Practice or the next ’cation.' },
  { key: 'remeasure', when: 'Day 76 · 90', name: 'Re-measure', what: 'Like for like; signed delta; Index re-score; result into the cohort and the published aggregate.' },
]

// The Joyspiration Practice — eight weeks (Memo p.21).
export const PRACTICE_WEEKS = [
  { week: 1, title: 'The Check, the Index and the story', term: 'ALL' as const, minutes: 5 },
  { week: 2, title: 'The Tomorrow Question', term: 'P' as const, minutes: 5 },
  { week: 3, title: 'Release the Ledger', term: 'R' as const, minutes: 5 },
  { week: 4, title: 'Don’t Postpone Joy', term: 'D' as const, minutes: 5 },
  { week: 5, title: 'Continuous Correction', term: 'H' as const, minutes: 5 },
  { week: 6, title: 'The Two Questions', term: 'B' as const, minutes: 5 },
  { week: 7, title: 'Stay Curious · Own Your Emotional Life', term: 'F' as const, minutes: 5 },
  { week: 8, title: 'Re-take the Index; the next ninety days', term: 'ALL' as const, minutes: 5 },
]

export const CIRCLE = {
  name: 'Circle of eight · Fairmont January',
  coach: 'Priya Natarajan',
  when: 'Monday 7 pm',
  callMinutes: 30,
  members: ['Arjun', 'Kavya', 'Nikhil', 'Farah', 'Deepa', 'Thomas', 'Shalini', 'Vikram'],
  week: 4,
}

export const EVENTS = [
  { id: 'ev1', name: 'AIWO Joyspan 2027', when: '31 Dec 2026 – 5 Jan 2027', where: 'Fairmont Mumbai', kind: 'Flagship', status: 'Attended' },
  { id: 'ev2', name: 'Joyspan Session · Chennai', when: 'Sat 20 Feb 2027 · 10:00', where: 'Joyspan House Chennai', kind: 'Session', status: 'Booked' },
  { id: 'ev3', name: 'Connections salon · Food & memory', when: 'Thu 4 Mar 2027 · 19:30', where: 'Adyar, Chennai', kind: 'Salon', status: 'Open' },
  { id: 'ev4', name: 'Joyspan Session · Dubai', when: 'Fri 9 Apr 2027 · 10:00', where: 'Dubai (GCC region)', kind: 'Session', status: 'Open' },
]

export const MEMBERSHIPS = [
  { name: 'Joyspan Check', price: 'Free', cadence: '', points: ['18 statements, 5 minutes', 'No login', 'Bands, never a number', 'Web, book QR, WhatsApp'] },
  { name: 'Joy OS', price: 'Free', cadence: '', points: ['Self-assessed Index', 'Joy Ledger', 'One practice', 'Trust centre'] },
  { name: 'Joy OS Plus', price: '₹499', cadence: '/ month', points: ['All six spaces in full', 'Devices and signals', 'The Joyspiration Practice', 'Circle of eight'], featured: true },
  { name: 'Circle', price: '₹1.5 L', cadence: '/ year', points: ['Named coach and concierge', 'Quarterly Index', 'Circle and Sessions', 'The ninety days, continued'] },
  { name: 'Clinical', price: '₹4.5 L', cadence: '/ year', points: ['Clinical-grade Index', 'AIWO panels and capacity battery', 'Named physician and psychologist', 'LifeOS clinical bridge'] },
  { name: 'Patron', price: '₹12 L', cadence: '/ year', points: ['Household of up to six', 'Annual ’cation', 'Family Joy Charter', 'Priority Houses and Residences'] },
]

// ─── Consoles ──────────────────────────────────────────────────────────────

export const DRIFT_TASKS: DriftTask[] = [
  { id: 'd1', memberId: 'm_0142', memberName: 'Nikhil S.', signal: 'self-harm-language', detail: 'Language in Second Arrow journal matched crisis intercept. Tele-MANAS shown; named person paged.', priority: 'P0', slaHours: 0.25, openedAt: '2027-01-28 21:04', owner: 'Dr Sanjay Menon', status: 'in-progress', term: 'B' },
  { id: 'd2', memberId: 'm_0088', memberName: 'Farah K.', signal: 'screen-threshold', detail: 'PHQ-4 = 7 (threshold ≥ 6). Clinician review required.', priority: 'P1', slaHours: 48, openedAt: '2027-01-28 09:12', owner: 'Dr Sanjay Menon', status: 'open', term: 'B' },
  { id: 'd3', memberId: 'm_0001', memberName: 'Arjun R.', signal: 'index-fall', detail: 'Index fell 64 → 61 at re-measure. Freedom −11.', priority: 'P2', slaHours: 72, openedAt: '2027-01-27 18:30', owner: 'Priya Natarajan', status: 'open', term: 'F' },
  { id: 'd4', memberId: 'm_0203', memberName: 'Deepa V.', signal: 'sleep-regularity', detail: '14 days of sleep regularity below personal baseline.', priority: 'P2', slaHours: 72, openedAt: '2027-01-26 07:45', owner: 'Priya Natarajan', status: 'open', term: 'B' },
  { id: 'd5', memberId: 'm_0175', memberName: 'Thomas M.', signal: 'ledger-silent', detail: 'Joy Ledger silent for 10 days.', priority: 'P2', slaHours: 96, openedAt: '2027-01-25 08:00', owner: 'Circle lead · Shalini', status: 'open', term: 'D' },
  { id: 'd6', memberId: 'm_0119', memberName: 'Vikram P.', signal: 'screen-threshold', detail: 'ISI = 16 (threshold ≥ 15). Sleep study suggested.', priority: 'P1', slaHours: 48, openedAt: '2027-01-24 15:20', owner: 'Dr Meera Iyer', status: 'done', term: 'B' },
]

export const DRIFT_RULES = [
  { signal: 'Index or a term falls by ≥5 at re-measure', response: 'Named coach calls within 72 h', priority: 'P2' },
  { signal: '14 days of sleep regularity below personal baseline', response: 'Coach message, sleep plan offered', priority: 'P2' },
  { signal: 'Joy Ledger silent 10 days', response: 'Gentle check-in from the circle lead', priority: 'P2' },
  { signal: 'PHQ-4 ≥ 6 or ISI ≥ 15', response: 'Clinician review within 48 h', priority: 'P1' },
  { signal: 'Self-harm language anywhere', response: 'Immediate intercept; crisis line and named person; P0 alert', priority: 'P0' },
]

export const CASELOAD = [
  { id: 'm_0001', name: 'Arjun Rao', day: 23, index: 64, lowest: 'D' as const, trend: 3, cation: 'Joycation', nextCall: 'Mon 19:00 · circle', risk: 'low' },
  { id: 'm_0002', name: 'Kavya Rao', day: 23, index: 68, lowest: 'F' as const, trend: 2, cation: 'Joycation', nextCall: 'Mon 19:00 · circle', risk: 'low' },
  { id: 'm_0142', name: 'Nikhil Sharma', day: 41, index: 49, lowest: 'B' as const, trend: -6, cation: 'Mindcation', nextCall: 'Today 21:30', risk: 'high' },
  { id: 'm_0088', name: 'Farah Khan', day: 12, index: 55, lowest: 'B' as const, trend: -2, cation: 'Sleepcation', nextCall: 'Tomorrow 10:00', risk: 'medium' },
  { id: 'm_0203', name: 'Deepa Venkat', day: 58, index: 66, lowest: 'B' as const, trend: 1, cation: 'Healthcation', nextCall: 'Day 60 talk · Fri', risk: 'medium' },
  { id: 'm_0175', name: 'Thomas Mathew', day: 34, index: 71, lowest: 'D' as const, trend: 0, cation: 'Savourcation', nextCall: 'Wed 18:00', risk: 'low' },
  { id: 'm_0119', name: 'Vikram Patel', day: 77, index: 62, lowest: 'R' as const, trend: 4, cation: 'Lovecation', nextCall: 'Re-measure due', risk: 'low' },
  { id: 'm_0310', name: 'Shalini Iyer', day: 88, index: 74, lowest: 'F' as const, trend: 5, cation: 'Wealthcation', nextCall: 'Re-measure due', risk: 'low' },
]

// Tenant aggregates — never an individual, no cell under ten, ≥50 people (Memo p.25).
export const TENANT = {
  name: 'Northwind Capital · Joyspan@Work',
  kind: 'Employer',
  eligible: 1240,
  enrolled: 812,
  measured: 655,
  remeasureRate: 0.71,
  improvedLowest: 0.56,
  minCell: 10,
  minCohort: 50,
  termMeans: [
    { key: 'H' as const, d0: 63, d90: 66 },
    { key: 'P' as const, d0: 61, d90: 64 },
    { key: 'R' as const, d0: 58, d90: 62 },
    { key: 'F' as const, d0: 49, d90: 54 },
    { key: 'D' as const, d0: 55, d90: 59 },
    { key: 'B' as const, d0: 36, d90: 31 },
  ],
  departments: [
    { name: 'Engineering', n: 214, ji: 58, delta: 4 },
    { name: 'Sales', n: 162, ji: 54, delta: 6 },
    { name: 'Operations', n: 131, ji: 60, delta: 3 },
    { name: 'Finance', n: 88, ji: 57, delta: 2 },
    { name: 'People & Legal', n: 60, ji: 63, delta: 5 },
    { name: 'Leadership', n: 34, ji: null, delta: null },
  ],
}

export const INSTRUMENTS = [
  { code: 'Ikigai-9', term: 'P' as const, items: 9, licence: 'Author permission · pending', status: 'gated', translation: 'EN · TA, HI in review' },
  { code: 'MLQ-P', term: 'P' as const, items: 5, licence: 'Free for research · commercial confirmed', status: 'live', translation: 'EN · TA · HI' },
  { code: 'UCLA-3', term: 'R' as const, items: 3, licence: 'Public domain', status: 'live', translation: 'EN · TA · HI' },
  { code: 'LSNS-6', term: 'R' as const, items: 6, licence: 'Terms to confirm', status: 'review', translation: 'EN' },
  { code: 'CSI-4', term: 'R' as const, items: 4, licence: 'Free with attribution', status: 'live', translation: 'EN · HI' },
  { code: 'BPNSFS', term: 'F' as const, items: 8, licence: 'Terms to confirm', status: 'review', translation: 'EN' },
  { code: 'CFPB FWB', term: 'F' as const, items: 5, licence: 'Public domain', status: 'live', translation: 'EN · TA · HI' },
  { code: 'SPANE', term: 'D' as const, items: 12, licence: 'Free with attribution', status: 'live', translation: 'EN · TA · HI' },
  { code: 'Savouring', term: 'D' as const, items: 8, licence: 'Terms to confirm', status: 'review', translation: 'EN' },
  { code: 'PHQ-4', term: 'B' as const, items: 4, licence: 'Public domain', status: 'live', translation: 'EN · TA · HI' },
  { code: 'ISI', term: 'B' as const, items: 7, licence: 'Licence required', status: 'gated', translation: 'EN' },
  { code: 'PSS-4', term: 'B' as const, items: 4, licence: 'Terms to confirm', status: 'review', translation: 'EN · HI' },
  { code: 'LE8 self-report', term: 'H' as const, items: 8, licence: 'AHA · free', status: 'live', translation: 'EN · TA · HI' },
  { code: 'Capacity battery', term: 'H' as const, items: 3, licence: 'AIWO protocol', status: 'live', translation: 'EN · TA · HI' },
]

export const COHORTS = [
  { name: 'AIWO Joyspan 2027 · Fairmont', n: 600, day: 23, remeasure: null, improved: null, status: 'In loop' },
  { name: 'Healthcation · Q4 2026', n: 142, day: 90, remeasure: 0.78, improved: 0.61, status: 'Published' },
  { name: 'Sleepcation · Q4 2026', n: 64, day: 90, remeasure: 0.72, improved: 0.48, status: 'Falsifier flagged' },
  { name: 'Beautycation · Q3 2026', n: 88, day: 90, remeasure: 0.81, improved: 0.57, status: 'Published' },
]

// Scoreboard (Memo p.38).
export const SCOREBOARD = [
  { measure: 'Members with a current Index', now: '1,180', j1: '1,000', j3: '15,000', j4: '1.2 M', j5: '100 M', why: 'Size of the loop' },
  { measure: 'Day-90 re-measure rate', now: '74%', j1: '≥70%', j3: '≥75%', j4: '≥60%', j5: '≥50%', why: 'The Milk gate' },
  { measure: 'Share improving their lowest term at Day 90', now: '57%', j1: '≥50%', j3: '≥55%', j4: '≥55%', j5: '≥55%', why: 'The falsifier' },
  { measure: 'Weekly active, of members in a loop', now: '63%', j1: '≥60%', j3: '≥50%', j4: '≥40%', j5: '≥40%', why: 'Kill line at FY29' },
  { measure: 'Cohort records, consented', now: '612', j1: '600', j3: '10,000', j4: '100,000', j5: '10 M', why: 'Rung R1' },
  { measure: 'Cost per active member-year', now: '₹3,420', j1: '—', j3: '≤₹3,000', j4: '≤₹1,500', j5: '≤₹400', why: 'The cost curve' },
  { measure: 'P0 alerts reached by a person within SLA', now: '100%', j1: '100%', j3: '100%', j4: '100%', j5: '100%', why: 'Never traded off' },
  { measure: 'Consent withdrawal honoured within 24 h', now: '100%', j1: '100%', j3: '100%', j4: '100%', j5: '100%', why: 'Trust' },
]

export const RELEASES = [
  { id: 'J0', name: 'Edition 01', when: 'Now → Dec 2026', layer: 'Milk', ships: 'Index engine v1.0; Check → app hand-off; events module; circle of eight; Health Connect; iOS TestFlight', gate: 'Every January guest has an Index and a circle on 5 Jan' },
  { id: 'J1', name: 'Joy OS 1.0', when: 'Jan – Mar 2027', layer: 'Milk', ships: 'Standalone app; Today and six spaces; HealthKit; Oura via Terra; Joy Ledger; Day 15/45/90; trust centre; web', gate: 'Day-90 re-score ≥70% of the January cohort' },
  { id: 'J2', name: '’Cations', when: 'Apr – Sep 2027', layer: 'Milk', ships: '’Cation engine; coach console; Lovecation, Mindcation; the Practice; partner console; Plus', gate: 'Every ’cation’s 90 days run in Joy OS' },
  { id: 'J3', name: 'Index v1.1', when: 'Oct 2027 – Mar 2028', layer: 'Milk', ships: 'Calibrated weights and λ; JALY; Hindi and Tamil; Joyspan@Work; guarded bandit; Star Health', gate: 'Validation paper; 10,000 in the cohort' },
  { id: 'J4', name: 'Licensed Joy OS', when: 'FY29 – FY31', layer: 'Mountain', ships: 'Insurer, employer, hospital, House, Residence and Family Joy Office tenants; GCC, UK, SG; FHIR IG', gate: '1 M paid or licensed; Index v2 under ₹100' },
  { id: 'J5', name: 'Public Joy OS', when: 'FY32 → 2036', layer: 'Moonshot', ships: 'Free Check and Index in 12 languages; open standard and certification; audited joyful-year count', gate: '100 M re-measuring; 100 M joyful years audited' },
]

export const JOURNEYS = [
  { id: 'guest', title: 'The New Year guest', who: 'Promoter couple, 58 and 55 · AIWO Joyspan at Fairmont Mumbai', steps: [['Dec', 'Invited; app installed with the concierge; consents; Index baseline'], ['31 Dec – 5 Jan', 'Joycation and the Summit; Clinical Index card handed over; circle formed'], ['5 Jan', 'Lowest term Freedom for him, Pleasure for her; actions start'], ['Day 60', 'Wealthcation suggested for him; Savourcation for her'], ['Day 90', 'Re-measure; Patron membership renews on the delta']] },
  { id: 'couple', title: 'The couple', who: 'Married 31 years, empty nest · Lovecation', steps: [['Day −14', 'Couples Check, each privately; CSI-4 per partner'], ['3 nights', 'Signature dates; love maps; one shared step, two private ones'], ['Weekly', 'State of Us, 20 minutes, in the app'], ['Monthly', 'A date planned in the People space'], ['Day 90', 'CSI-4 re-score; household page shows only what both share']] },
  { id: 'founder', title: 'The founder after exit', who: 'Age 49, sold the company · Mindcation and the Practice', steps: [['Book', 'Reads Joyspiration; QR opens the Check: Purpose thin'], ['App', 'Self-assessed Index; first practice free'], ['8 weeks', 'Joy OS Plus; the Practice; founders’ circle'], ['4 nights', 'Mindcation; 25-year statement drafted'], ['Day 90', 'Ikigai-9 re-score; Executive Energy as continuation']] },
  { id: 'employee', title: 'The employee or policyholder', who: 'Senior manager, 41 · via Joyspan@Work or an insurer', steps: [['Invite', 'Employer or insurer sends a link; AIWO, not the employer, holds the data'], ['Index', 'Self-assessed; Ease flags route to an EAP or clinician'], ['Daily', 'One action; circles with colleagues only if chosen'], ['Quarter', 'Re-measure; employer sees aggregates of 50+ only'], ['Year', 'Insurer pays for a measured fall in preventable suffering']] },
  { id: 'reader', title: 'The reader, anywhere', who: 'Anyone, any language · the free Check', steps: [['WhatsApp', '18 statements in 5 minutes; bands, never a number'], ['Door', 'Three doors: the Letter, a baseline, or the app'], ['App', 'Free Index and Joy Ledger; one practice'], ['Upgrade', 'Plus, a Session, or a ’cation for the lowest term'], ['Count', 'Every consented re-measure adds to the joyful-years count']] },
]
