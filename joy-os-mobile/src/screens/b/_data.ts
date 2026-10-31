// Lane B specimen data for sign-in, notifications, membership and the method page.
// SPECIMEN — not a real member, not real credentials.

/** The specimen one-time code. Any other six digits is "wrong" so the error path can be seen. */
export const SPECIMEN_OTP = '246810'
export const SPECIMEN_AIWO_ID = 'AIWO-7F3K-22Q9'

export const DEMO_ACCOUNTS = [
  { id: 'arjun', name: 'Arjun Rao', role: 'Member · Plus + Circle · Day 23 of 90', aiwoId: 'AIWO-7F3K-22Q9', initials: 'AR', tone: 'var(--term-f)' },
  { id: 'lakshmi', name: 'Lakshmi Rao', role: 'Elder mode · helper: Arjun', aiwoId: 'AIWO-3LK9-07M2', initials: 'LR', tone: 'var(--term-h)' },
]

export interface Notice {
  id: string
  group: 'Today' | 'Earlier'
  kind: 'action' | 'ledger' | 'circle' | 'message' | 'letter' | 'care'
  title: string
  body: string
  at: string
  href: string
  cta: string
}

export const NOTICES: Notice[] = [
  { id: 'n1', group: 'Today', kind: 'action', title: 'Today’s action', body: 'Ten minutes on the verandah with tea. Notice three things.', at: '07:45', href: '/', cta: 'Open Today' },
  { id: 'n3', group: 'Today', kind: 'ledger', title: 'Anything good in the last few hours?', body: 'Ten seconds for the Joy Ledger.', at: '16:30', href: '/ledger', cta: 'Add to the Ledger' },
  { id: 'n2', group: 'Earlier', kind: 'message', title: 'Priya replied', body: 'Skipping is allowed — it is never counted against you…', at: 'Yesterday', href: '/messages?t=t_priya', cta: 'Read the reply' },
  { id: 'n4', group: 'Earlier', kind: 'circle', title: 'Circle on Monday, 19:00', body: 'Week 4 · Don’t Postpone Joy. Thirty minutes with the same eight.', at: 'Yesterday', href: '/circles', cta: 'See the circle' },
  { id: 'n5', group: 'Earlier', kind: 'care', title: 'Your January panel is signed', body: 'Dr Meera Iyer signed it with a note in plain words.', at: '24 Jan', href: '/care', cta: 'See results' },
  { id: 'n6', group: 'Earlier', kind: 'letter', title: 'The Joyspan Letter · Winter', body: 'Published results, up and down, and what we changed.', at: '15 Jan', href: '/method', cta: 'Read the method' },
]

export const PLANS = [
  { key: 'Free' as const, name: 'Joy OS', price: 0, cadence: 'free', points: ['Self-assessed Index', 'Joy Ledger', 'One practice', 'Trust centre'] },
  { key: 'Plus' as const, name: 'Joy OS Plus', price: 499, cadence: '/ month', points: ['All six spaces in full', 'Devices and signals', 'The Joyspiration Practice', 'Circle of eight'] },
  { key: 'Patron' as const, name: 'Patron', price: 1200000, cadence: '/ year', points: ['Household of up to six', 'Annual ’cation', 'Family Joy Charter', 'Priority Houses and Residences'] },
]

export const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: n % 1 ? 2 : 0 })}`

export const GRADES = [
  { key: 'check', name: 'Check', what: '18 statements, five minutes, no login. Bands only, never a number.', who: 'Anyone' },
  { key: 'index', name: 'Index grade', what: 'Validated instruments per term, about twenty minutes. A number, 0–100, with the method on it.', who: 'Members' },
  { key: 'clinical', name: 'Clinical grade', what: 'The Index plus panels, the capacity battery and a physician’s signature.', who: 'Clinical members' },
]

export const DISPLAY_RULES = [
  'Every score carries its method, grade, date and next measure.',
  'Burden is hatched, never red. A fall is shown in ink, never in alarm colours.',
  'The lowest term is named; the others are not ranked.',
  'No streaks, badges or league tables. Skipping is never counted.',
  'A fall at re-measure is told to you by a person before you see it.',
]

export const NEVER_IMPORTED = ['Vendor readiness, strain or recovery scores', 'Biological or “body” age estimates', 'Sleep scores from any device', 'Calendar contents (only summarised, then discarded)']

export const AI_LIMITS = [
  'VIVA explains your Index and today’s action. It never diagnoses or prescribes.',
  'VIVA may draft a message; a named person reads and signs it.',
  'Crisis language opens Tele-MANAS 14416 and a person, before anything else.',
  'No model is trained on your record. Answers cite the method page.',
]
