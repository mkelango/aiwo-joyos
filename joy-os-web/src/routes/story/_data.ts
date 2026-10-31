import type { TermKey } from '@/domain/types'

// Story lane data: the module map (Memo p.16), the architecture (Memo p.28), the
// journeys in detail (Memo p.22), the ninety-day loop (Memo p.13) and the deck's
// tables (Memo p.24, p.27, p.35–38, p.42; competitive-analysis.md §4–5).

export const ALL_TERMS: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

// ─── Surfaces and outcomes ───────────────────────────────────────────────────
export type SurfaceKey = 'app' | 'web' | 'whatsapp' | 'watch' | 'coach' | 'clinical' | 'partner' | 'tenant' | 'science' | 'ops'
export const SURFACES: { key: SurfaceKey; name: string; sub: string; group: 'member' | 'console'; to: string }[] = [
  { key: 'app', name: 'Member app', sub: 'iOS · Android', group: 'member', to: '/app' },
  { key: 'web', name: 'Joy OS web', sub: 'Index, plans, events', group: 'member', to: '/app/index' },
  { key: 'whatsapp', name: 'WhatsApp', sub: 'Check · Ledger · reminders', group: 'member', to: '/app/whatsapp' },
  { key: 'watch', name: 'Watch', sub: 'Ledger complication · J3', group: 'member', to: '/app/devices' },
  { key: 'coach', name: 'Coach console', sub: 'Caseload · drift tasks', group: 'console', to: '/console/coach' },
  { key: 'clinical', name: 'Clinical portal', sub: 'Physicians · psychologists', group: 'console', to: '/console/clinical' },
  { key: 'partner', name: 'Partner console', sub: 'Venues · no health data', group: 'console', to: '/console/partner' },
  { key: 'tenant', name: 'Tenant admin', sub: 'Aggregates only, ≥ 50', group: 'console', to: '/console/tenant' },
  { key: 'science', name: 'Science Office', sub: 'Methods · cohorts', group: 'console', to: '/console/science' },
  { key: 'ops', name: 'Control plane', sub: 'Flags · evals · SLOs', group: 'console', to: '/console/ops' },
]

export type OutcomeKey = 'delta' | 'remeasure' | 'cost'
export const OUTCOMES: { key: OutcomeKey; name: string; measure: string; now: string; target: string; why: string }[] = [
  { key: 'delta', name: 'Day-90 delta', measure: 'Share improving their lowest term at Day 90', now: '57%', target: '≥ 50% · the falsifier', why: 'Proves the loop raises the term it names.' },
  { key: 'remeasure', name: 'Re-measure rate', measure: 'Day-90 re-score of each cohort', now: '74%', target: '≥ 70% · the Milk gate', why: 'Re-measure rate is the product.' },
  { key: 'cost', name: 'Cost per member', measure: 'Cost per active member-year', now: '₹3,420', target: '≤ ₹1,500 by FY31', why: 'The cost curve has to bend 250×.' },
]

// ─── The fourteen modules (Memo p.16) ────────────────────────────────────────
export type Release = 'J0' | 'J1' | 'J2' | 'J3' | 'J4'
export interface Module {
  n: string
  name: string
  what: string
  terms: TermKey[]
  termNote: string
  release: Release
  releaseNote: string
  kept: string
  surfaces: SurfaceKey[]
  outcomes: OutcomeKey[]
  data: string[]
  arch: string[]
  test: { raise: string; know: string; miss: string }
  routes: { label: string; to: string }[]
}

export const MODULES: Module[] = [
  {
    n: '01', name: 'Index engine', what: 'Instrument registry, questionnaires, scoring, bands and method versions; Check → Index → Clinical; JALY as a research metric only.',
    terms: ALL_TERMS, termNote: 'All six', release: 'J0', releaseNote: 'J0 · Edition 01', kept: 'LONGEVIS scoring pattern',
    surfaces: ['app', 'web', 'whatsapp', 'science', 'clinical'], outcomes: ['delta', 'remeasure'],
    data: ['IndexScore (method pinned)', 'InstrumentResponse', 'MethodVersion · weights · λ'],
    arch: ['index', 'ops-db', 'research'],
    test: { raise: 'All six, by making each one measurable: it is how every term is known.', know: 'Re-measure rate and test–retest reliability per instrument.', miss: 'Without it there is no number that can go down, and so no product.' },
    routes: [{ label: 'The Check', to: '/check' }, { label: 'Your Index', to: '/app/index' }, { label: 'The method', to: '/app/method' }],
  },
  {
    n: '02', name: 'Today', what: 'Home: the Index, the Wheel, the lowest term, one action, the circle, the next measure date.',
    terms: ['D'], termNote: 'Lowest term (today: Daily Pleasure)', release: 'J1', releaseNote: 'J1 · Joy OS 1.0', kept: '—',
    surfaces: ['app', 'web', 'watch'], outcomes: ['delta', 'remeasure'],
    data: ['Action shown · done · not today', 'Loop day', 'Next measure date'],
    arch: ['today', 'bff'],
    test: { raise: 'The lowest term, one action at a time.', know: 'Completion of the one action, and the lowest term at Day 90.', miss: 'Yes: it is the two minutes a day.' },
    routes: [{ label: 'Today', to: '/app' }],
  },
  {
    n: '03', name: 'Six term spaces', what: 'Body, Purpose, People, Freedom, Pleasure, Ease, each with its framework tool, history and actions.',
    terms: ALL_TERMS, termNote: 'One each', release: 'J1', releaseNote: 'J1 · Joy OS 1.0', kept: 'Body uses LifeOS data',
    surfaces: ['app', 'web'], outcomes: ['delta'],
    data: ['Term history', 'Framework tool entries (Ikigai map, orbit, No list…)', 'Biomarker vault (Body)'],
    arch: ['terms'],
    test: { raise: 'Each space raises its own term.', know: 'Its term score at Day 90, like for like.', miss: 'Yes, on the days a member wants to go deeper.' },
    routes: [{ label: 'Spaces', to: '/app/spaces' }, { label: 'People', to: '/app/spaces/people' }, { label: 'Ease', to: '/app/spaces/ease' }],
  },
  {
    n: '04', name: 'Next best action', what: 'Action library, selection rules, later a guarded bandit; drift rules that create human tasks.',
    terms: ALL_TERMS, termNote: 'All six', release: 'J1', releaseNote: 'J1 rules · J3 guarded bandit', kept: 'Alert rules',
    surfaces: ['app', 'coach', 'clinical', 'science'], outcomes: ['delta', 'cost'],
    data: ['~240 curated actions, 40 per term', 'Drift task · SLA · owner', 'Ranking explanation'],
    arch: ['today', 'nba', 'safety'],
    test: { raise: 'The lowest term, via the one action it chooses.', know: 'Term movement at Day 90 per action, never minutes in app.', miss: 'They would miss the call when something drifts.' },
    routes: [{ label: 'Why this, today', to: '/app' }, { label: 'Drift queue', to: '/console/coach' }],
  },
  {
    n: '05', name: '’Cation engine', what: 'Templates for all ten ’cations: pre-arrival, on-site itinerary, checkout hand-off, the 90 days, the Day-90 measure.',
    terms: ['H', 'P', 'R', 'F', 'D', 'B'], termNote: 'Primary per ’cation', release: 'J2', releaseNote: 'J2 · ’Cations', kept: 'Programme enrolment',
    surfaces: ['app', 'partner', 'coach'], outcomes: ['delta', 'remeasure'],
    data: ['’Cation template · primary term', 'Itinerary · Signal Point readings', 'Day-90 measure'],
    arch: ['cation', 'signal-points'],
    test: { raise: 'The primary term each ’cation names.', know: 'Its named Day-90 measure, signed.', miss: 'Yes: the stay becomes Day 0, not the end.' },
    routes: [{ label: '’Cation', to: '/app/cation' }, { label: 'Partner console', to: '/console/partner' }],
  },
  {
    n: '06', name: 'Joyspiration Practice', what: 'Eight-week course, five-minute audio in the Mentor’s voice, science notes, weekly circle, Index before and after.',
    terms: ['P', 'R', 'D', 'H', 'B', 'F'], termNote: 'Purpose · all', release: 'J2', releaseNote: 'J2 · ’Cations', kept: 'Content and CMS',
    surfaces: ['app', 'web'], outcomes: ['delta'],
    data: ['Practice week · audio played', 'Index before and after'],
    arch: ['practice', 'content'],
    test: { raise: 'Purpose first, then each term in its week.', know: 'Index before and after the eight weeks.', miss: 'Readers of the book would: it is the book, practised.' },
    routes: [{ label: 'The Practice', to: '/app/practice' }],
  },
  {
    n: '07', name: 'Joy Circles and community', what: 'Circles of eight, couples, families, Connections salons, coach-led weekly calls.',
    terms: ['R'], termNote: 'Relationships', release: 'J0', releaseNote: 'J0 · Edition 01', kept: 'Moai circles',
    surfaces: ['app', 'coach', 'web'], outcomes: ['delta', 'remeasure'],
    data: ['Circle of eight', 'Call attendance', 'Salon passes'],
    arch: ['circles'],
    test: { raise: 'Relationships.', know: 'UCLA-3 and LSNS-6 at Day 90; circle retention.', miss: 'Yes: switching would mean losing the circle.' },
    routes: [{ label: 'Circles', to: '/app/circles' }],
  },
  {
    n: '08', name: 'Events', what: 'The Joyspan Event Platform folded in: AIWO Joyspan, Sessions, passes, schedules, one login, one record.',
    terms: ALL_TERMS, termNote: 'All six', release: 'J0', releaseNote: 'J0 · Edition 01', kept: 'Event platform',
    surfaces: ['app', 'web', 'partner'], outcomes: ['remeasure'],
    data: ['Pass · schedule', 'Day-0 Index at the event'],
    arch: ['circles'],
    test: { raise: 'All six, through the flagship and Sessions.', know: 'Every guest leaves with an Index and a circle.', miss: 'Guests would: one login for the event and the year after.' },
    routes: [{ label: 'Events', to: '/app/events' }],
  },
  {
    n: '09', name: 'Care bridge', what: 'Consults, physicians, psychologists, clinical screens, lab orders and results, e-Rx, deep links into LifeOS.',
    terms: ['H', 'B'], termNote: 'Healthspan · Ease', release: 'J1', releaseNote: 'J1 · Joy OS 1.0', kept: 'Clinical core, as is',
    surfaces: ['app', 'clinical', 'coach'], outcomes: ['delta'],
    data: ['Consult · e-Rx (physician only)', 'Lab order and result (FHIR R4)', 'Screen threshold task'],
    arch: ['clinical', 'orders', 'fhir'],
    test: { raise: 'Healthspan, and Preventable Suffering falling.', know: 'Screens resolved within SLA; Ease at Day 90.', miss: 'Yes: a person behind every number.' },
    routes: [{ label: 'Care', to: '/app/care' }, { label: 'Clinical portal', to: '/console/clinical' }],
  },
  {
    n: '10', name: 'Signals', what: 'HealthKit, Health Connect, Terra, labs, Signal Points, Joy Ledger experience sampling, calendar (opt-in).',
    terms: ALL_TERMS, termNote: 'All six', release: 'J0', releaseNote: 'J0 · Edition 01', kept: 'Terra, labs, ABDM',
    surfaces: ['app', 'watch', 'whatsapp', 'ops'], outcomes: ['remeasure', 'cost'],
    data: ['Time series (sleep, HRV, steps)', 'Ledger entries', 'Device link · consent'],
    arch: ['device', 'terra', 'esm', 'signal-points', 'calendar', 'timeseries'],
    test: { raise: 'None directly: it makes every term cheaper to know.', know: 'Record capture cost per person-year, ₹40,000 → ₹400.', miss: 'They would notice re-measuring become harder.' },
    routes: [{ label: 'Devices', to: '/app/devices' }, { label: 'Joy Ledger', to: '/app/ledger' }],
  },
  {
    n: '11', name: 'VIVA tools', what: 'Index explainer, Ikigai coach, Second Arrow reflection, next-best-action narration, couples prompts.',
    terms: ALL_TERMS, termNote: 'All six', release: 'J1', releaseNote: 'J1 · Joy OS 1.0', kept: 'VIVA, six agents',
    surfaces: ['app', 'coach', 'ops'], outcomes: ['cost', 'delta'],
    data: ['Tool call · prompt version · inputs hash', 'Reviewer stored with output', '“What VIVA knows”'],
    arch: ['viva', 'evals'],
    test: { raise: 'Each tool names its term; nothing on a Suffering result.', know: 'Members per coach; evals by language; term movement.', miss: 'Coaches would: it is how they scale.' },
    routes: [{ label: 'VIVA', to: '/app/viva' }],
  },
  {
    n: '12', name: 'Commerce and memberships', what: 'Joy OS Plus, Circle, Clinical, Patron; ’cation and event payments; Joy Passport; prepaid partner stays.',
    terms: [], termNote: 'No term: it funds the loop', release: 'J1', releaseNote: 'J1 · Joy OS 1.0', kept: 'Razorpay, GST, entitlements',
    surfaces: ['app', 'web', 'partner'], outcomes: ['cost'],
    data: ['Entitlement', 'Invoice (GST)', 'Joy Passport balance'],
    arch: ['commerce'],
    test: { raise: 'None. It must never sit beside a score.', know: 'Renewal on the delta, not on urgency.', miss: 'Only if it got in the way, which is the test.' },
    routes: [{ label: 'Membership plans', to: '/app/membership' }, { label: 'Partner console', to: '/console/partner' }],
  },
  {
    n: '13', name: 'Households and tenants', what: 'Couples, families, Family Joy Office; Joyspan@Work, insurer, hospital, House and residence tenants; aggregate dashboards.',
    terms: ['R', 'H', 'P', 'F', 'D', 'B'], termNote: 'Relationships · all', release: 'J3', releaseNote: 'J3 households · J4 tenants', kept: 'Corporate portal, RLS',
    surfaces: ['app', 'tenant'], outcomes: ['remeasure', 'cost'],
    data: ['Household (partner answers private)', 'Tenant · eligibility · SSO', 'Aggregates, k ≥ 10, ≥ 50'],
    arch: ['households', 'identity', 'analytics'],
    test: { raise: 'Relationships at home; every term at scale.', know: 'CSI-4 per partner; tenant cohort deltas.', miss: 'Couples would, and every employer that licenses it.' },
    routes: [{ label: 'Household', to: '/app/household' }, { label: 'Tenant admin', to: '/console/tenant' }],
  },
  {
    n: '14', name: 'Trust centre', what: 'Who has seen my data, consents by purpose, export, delete, method pages, the claims log.',
    terms: [], termNote: 'No term: it protects all six', release: 'J1', releaseNote: 'J1 · Joy OS 1.0', kept: 'DPDP ledger, audit',
    surfaces: ['app', 'web', 'ops'], outcomes: ['remeasure'],
    data: ['Consent (Care · Data · Publishing)', 'Access event (7-year audit)', 'Rights request · export ≤ 72 h · erase ≤ 24 h'],
    arch: ['identity', 'audit'],
    test: { raise: 'None directly. It earns the right to measure the other six.', know: 'Consent withdrawal honoured within 24 h, 100%.', miss: 'For a ₹1,000-crore family, privacy is the product.' },
    routes: [{ label: 'Trust centre', to: '/app/trust' }, { label: 'Audit and rights requests', to: '/console/ops' }],
  },
]

// ─── Architecture on one page (Memo p.28) ────────────────────────────────────
export interface ArchBox { id: string; name: string; sub: string; shared?: boolean }
export const ARCH_LAYERS: { key: string; name: string; note: string; boxes: ArchBox[] }[] = [
  {
    key: 'channels', name: 'Channels', note: 'Where people meet Joy OS',
    boxes: [
      { id: 'ch-app', name: 'Joy OS app', sub: 'iOS · Android · watch' },
      { id: 'ch-web', name: 'Joy OS web', sub: 'Index, plans, events' },
      { id: 'ch-wa', name: 'WhatsApp', sub: 'Check · Ledger · reminders' },
      { id: 'ch-clin', name: 'Clinical portal', sub: 'Physicians, psychologists', shared: true },
      { id: 'ch-coach', name: 'Coach console', sub: 'Circles, drift tasks' },
      { id: 'ch-partner', name: 'Partner and tenant', sub: 'Venues, employers, insurers' },
      { id: 'ch-lifeos', name: 'LifeOS app', sub: 'Clinical members', shared: true },
    ],
  },
  {
    key: 'experience', name: 'Experience', note: 'One BFF per surface',
    boxes: [
      { id: 'bff', name: 'Joy OS BFF and gateway', sub: 'Per-surface views · auth · rate limits' },
      { id: 'notify', name: 'Notifications', sub: 'Push · WhatsApp · email · quiet hours', shared: true },
      { id: 'content', name: 'Content', sub: 'Practices · films · Letter · i18n' },
      { id: 'partner-api', name: 'Partner API', sub: 'FHIR IG · webhooks · SSO' },
    ],
  },
  {
    key: 'domain', name: 'Joyspan domain', note: 'The equation as services',
    boxes: [
      { id: 'index', name: 'Index engine', sub: 'Registry · scoring · methods' },
      { id: 'terms', name: 'Six term services', sub: 'Body … Ease' },
      { id: 'today', name: 'Today and NBA', sub: 'Actions · drift' },
      { id: 'cation', name: '’Cation engine', sub: 'Templates · 90 days' },
      { id: 'practice', name: 'Practice', sub: 'Joyspiration' },
      { id: 'circles', name: 'Circles and events', sub: 'Community' },
      { id: 'households', name: 'Households and tenants', sub: 'Couples · B2B' },
    ],
  },
  {
    key: 'core', name: 'Platform core', note: 'Shared with LifeOS',
    boxes: [
      { id: 'identity', name: 'Identity and consent', sub: 'AIWO ID · DPDP ledger', shared: true },
      { id: 'clinical', name: 'Clinical core', sub: 'SIIS · gates · LONGEVIS · e-Rx', shared: true },
      { id: 'orders', name: 'Orders and results', sub: 'Labs · FHIR R4 · ABDM', shared: true },
      { id: 'commerce', name: 'Commerce', sub: 'Razorpay · entitlements', shared: true },
      { id: 'safety', name: 'Safety', sub: 'Alerts · crisis routing', shared: true },
    ],
  },
  {
    key: 'signals', name: 'Signals', note: 'Device-independent',
    boxes: [
      { id: 'device', name: 'Device bridge', sub: 'HealthKit · Health Connect', shared: true },
      { id: 'terra', name: 'Wearable cloud', sub: 'Terra', shared: true },
      { id: 'esm', name: 'ESM and instruments', sub: 'Ledger · questionnaires' },
      { id: 'signal-points', name: 'Signal Points', sub: 'On-site devices' },
      { id: 'calendar', name: 'Calendar', sub: 'Opt-in, summarised' },
    ],
  },
  {
    key: 'intelligence', name: 'Intelligence', note: 'AI drafts, a person signs',
    boxes: [
      { id: 'viva', name: 'VIVA, six agents', sub: '+ Joy OS typed tools', shared: true },
      { id: 'nba', name: 'NBA and drift models', sub: 'Rules → guarded bandit' },
      { id: 'evals', name: 'Evaluation plane', sub: 'Registry · evals · human review' },
    ],
  },
  {
    key: 'data', name: 'Data and trust', note: 'India-resident by default',
    boxes: [
      { id: 'ops-db', name: 'Operational', sub: 'PostgreSQL + RLS', shared: true },
      { id: 'timeseries', name: 'Time series', sub: 'TimescaleDB' },
      { id: 'fhir', name: 'Clinical record', sub: 'FHIR store', shared: true },
      { id: 'research', name: 'Research registry', sub: 'De-identified cohort' },
      { id: 'analytics', name: 'Analytics', sub: 'Aggregates only' },
      { id: 'audit', name: 'Audit · residency · claims gate', sub: '7 years · India region', shared: true },
    ],
  },
]

export const TWO_APPS = {
  lifeos: { name: 'LifeOS', tag: 'Keeps its job', promise: 'Know and improve my biology', for: 'Clinical members, Healthcation alumni, physicians', by: 'Eleven pillars, LONGEVIS, SIIS 90-day cycle', scale: 'Thousands to tens of thousands', inside: 'Becomes the engine of the Body space and the Clinical grade of the Index' },
  joyos: { name: 'Joy OS', tag: 'New', promise: 'Know and raise how much of my life I am glad to live', for: 'Everyone: guests, couples, families, employees, policyholders, readers', by: 'The six terms of the equation and the Index', scale: 'Built for 100 M through partners', inside: 'Paper-first Identity Playbook theme; no dark gold' },
  core: ['Identity and households: one AIWO ID, couples and families as first-class objects', 'DPDP consent ledger, audit (7 years), AES-256-GCM PHI encryption', 'Clinical core: SIIS, physician gates, LONGEVIS, BioMAP, FHIR R4, ABDM, e-Rx, HITL', 'Signals: HealthKit, Health Connect, Terra, labs, CGM', 'VIVA: six agents, typed tools, emergency intercept', 'Commerce: Razorpay, GST invoicing, entitlements', 'Notifications: push, consented WhatsApp, email, quiet hours'],
}

// ─── Journeys, step by step (Memo p.22) ──────────────────────────────────────
export interface JourneyStep { when: string; what: string; does: string; who: string[]; term: TermKey | 'ALL'; surface: string; route: { label: string; to: string } }
export const JOURNEY_DETAIL: Record<string, { persona: string; arrives: string; lowest: string; steps: JourneyStep[] }> = {
  guest: {
    persona: 'Ravi and Lakshmi', arrives: 'Invited by AIWO to the flagship', lowest: 'Freedom (him) · Daily Pleasure (her)',
    steps: [
      { when: 'Dec', what: 'Invited; app installed with the concierge; consents; Index baseline', does: 'Creates one AIWO ID each, asks the three consents separately (Care, Data, Publishing), links the ring, and runs the Index in two sittings before arrival.', who: ['Concierge', 'Member'], term: 'ALL', surface: 'Member app', route: { label: 'Onboarding', to: '/onboarding' } },
      { when: '31 Dec – 5 Jan', what: 'Joycation and the Summit; Clinical Index card handed over; circle formed', does: 'Readings flow in from Signal Points on site; the physician signs the Clinical grade; the card is handed over in person; the circle of eight is formed before departure.', who: ['Physician', 'Venue', 'Coach'], term: 'ALL', surface: 'Partner console', route: { label: 'Partner console', to: '/console/partner' } },
      { when: '5 Jan', what: 'Lowest term Freedom for him, Pleasure for her; actions start', does: 'Each partner’s lowest term picks their own one action. Today shows one card, one reason, and “Not today” is never counted against them.', who: ['Member', 'Engine'], term: 'D', surface: 'Member app', route: { label: 'Today', to: '/app' } },
      { when: 'Day 60', what: 'Wealthcation suggested for him; Savourcation for her', does: 'The concierge holds the next-step conversation by the lowest term. No urgency, no scarcity: the suggestion is a reason, not a countdown.', who: ['Concierge'], term: 'F', surface: 'Member app', route: { label: '’Cation', to: '/app/cation' } },
      { when: 'Day 90', what: 'Re-measure; Patron membership renews on the delta', does: 'Like-for-like re-measure; the delta is signed and shown both ways. The household page shows only what both choose to share.', who: ['Engine', 'Physician'], term: 'ALL', surface: 'Member app', route: { label: 'Day 90', to: '/app/index/day-90' } },
    ],
  },
  couple: {
    persona: 'Suresh and Anita', arrives: 'Booked a Lovecation for their anniversary', lowest: 'Relationships (both)',
    steps: [
      { when: 'Day −14', what: 'Couples Check, each privately; CSI-4 per partner', does: 'Each partner answers alone on their own phone. Joy OS shows where they agree and differ, never who said what.', who: ['Each partner'], term: 'R', surface: 'Member app', route: { label: 'People space', to: '/app/spaces/people' } },
      { when: '3 nights', what: 'Signature dates; love maps; one shared step, two private ones', does: 'The ’cation itinerary runs offline on the floor; checkout hands off one shared step and one private step each.', who: ['Venue', 'Coach'], term: 'R', surface: 'Member app', route: { label: 'Lovecation', to: '/app/cation/lovecation' } },
      { when: 'Weekly', what: 'State of Us, 20 minutes, in the app', does: 'VIVA’s couples_prompt drafts the week’s three questions. It never reveals one partner to the other.', who: ['Both partners', 'VIVA'], term: 'R', surface: 'Member app', route: { label: 'People space', to: '/app/spaces/people' } },
      { when: 'Monthly', what: 'A date planned in the People space', does: 'One planned pleasure, shared. It lands in both calendars like a meeting.', who: ['Both partners'], term: 'D', surface: 'Member app', route: { label: 'Pleasure space', to: '/app/spaces/pleasure' } },
      { when: 'Day 90', what: 'CSI-4 re-score; household page shows only what both share', does: 'Each partner’s CSI-4 is re-scored privately. The household page shows only what both agreed to share.', who: ['Each partner', 'Engine'], term: 'R', surface: 'Member app', route: { label: 'Household', to: '/app/household' } },
    ],
  },
  founder: {
    persona: 'Karthik', arrives: 'Found the book in an airport', lowest: 'Purpose',
    steps: [
      { when: 'Book', what: 'Reads Joyspiration; QR opens the Check: Purpose thin', does: 'Eighteen statements in five minutes, no login. The result is bands only, never a number: Purpose THIN.', who: ['Reader'], term: 'P', surface: 'Web', route: { label: 'The Check', to: '/check' } },
      { when: 'App', what: 'Self-assessed Index; first practice free', does: 'The Check hands off to the app with its answers carried over; the self-assessed Index names Purpose as lowest.', who: ['Member', 'Engine'], term: 'P', surface: 'Member app', route: { label: 'Take the Index', to: '/app/index/take' } },
      { when: '8 weeks', what: 'Joy OS Plus; the Practice; founders’ circle', does: 'Five minutes of the Mentor’s voice a week, one practice, and a weekly founders’ circle of eight with a coach.', who: ['Coach', 'Circle of eight'], term: 'P', surface: 'Member app', route: { label: 'The Practice', to: '/app/practice' } },
      { when: '4 nights', what: 'Mindcation; 25-year statement drafted', does: 'VIVA’s ikigai_coach helps draft the 25-year statement. The member edits and keeps it; VIVA never signs it.', who: ['Coach', 'VIVA'], term: 'P', surface: 'Member app', route: { label: 'Purpose space', to: '/app/spaces/purpose' } },
      { when: 'Day 90', what: 'Ikigai-9 re-score; Executive Energy as continuation', does: 'Ikigai-9 and MLQ-Presence re-scored like for like; the next ninety days begin with the new lowest term.', who: ['Engine'], term: 'P', surface: 'Member app', route: { label: 'Your Index', to: '/app/index' } },
    ],
  },
  employee: {
    persona: 'Meena', arrives: 'Northwind Capital · Joyspan@Work', lowest: 'Freedom',
    steps: [
      { when: 'Invite', what: 'Employer or insurer sends a link; AIWO, not the employer, holds the data', does: 'Single sign-on proves eligibility only. The employer never sees an individual answer, score or name.', who: ['Tenant admin', 'Member'], term: 'ALL', surface: 'Tenant admin', route: { label: 'Tenant admin', to: '/console/tenant' } },
      { when: 'Index', what: 'Self-assessed; Ease flags route to an EAP or clinician', does: 'A screen over threshold becomes a clinician task within 48 hours, routed to the EAP if the employer offers one. No AI text on the result.', who: ['Clinician', 'Member'], term: 'B', surface: 'Member app', route: { label: 'Ease space', to: '/app/spaces/ease' } },
      { when: 'Daily', what: 'One action; circles with colleagues only if chosen', does: 'One action by the lowest term. Circles with colleagues are opt-in; nobody is ranked against anyone.', who: ['Member'], term: 'F', surface: 'Member app', route: { label: 'Freedom space', to: '/app/spaces/freedom' } },
      { when: 'Quarter', what: 'Re-measure; employer sees aggregates of 50+ only', does: 'The tenant dashboard shows aggregates of fifty or more, no cell under ten, no drill-down.', who: ['Tenant admin'], term: 'ALL', surface: 'Tenant admin', route: { label: 'Aggregates', to: '/console/tenant' } },
      { when: 'Year', what: 'Insurer pays for a measured fall in preventable suffering', does: 'The licence is priced on a measured outcome: Preventable Suffering falling across the cohort, published up and down.', who: ['Insurer', 'Science Office'], term: 'B', surface: 'Science Office', route: { label: 'Science Office · published cohorts', to: '/console/science' } },
    ],
  },
  reader: {
    persona: 'Anyone', arrives: 'A WhatsApp message from a friend', lowest: 'Whatever the Check names',
    steps: [
      { when: 'WhatsApp', what: '18 statements in 5 minutes; bands, never a number', does: 'The Check runs in a consented WhatsApp chat in their own language. Never clinical content in WhatsApp.', who: ['Reader'], term: 'ALL', surface: 'WhatsApp', route: { label: 'WhatsApp', to: '/app/whatsapp' } },
      { when: 'Door', what: 'Three doors: the Letter, a baseline, or the app', does: 'Value before data: the Joyspan Letter arrives first. Signing up is a choice, not a gate.', who: ['Reader'], term: 'ALL', surface: 'Web', route: { label: 'The Check', to: '/check' } },
      { when: 'App', what: 'Free Index and Joy Ledger; one practice', does: 'The free tier is complete: a self-assessed Index, the Ledger and one practice. No ads, ever.', who: ['Member'], term: 'D', surface: 'Member app', route: { label: 'Joy Ledger', to: '/app/ledger' } },
      { when: 'Upgrade', what: 'Plus, a Session, or a ’cation for the lowest term', does: 'The upgrade is offered by the lowest term, with a reason. Never a countdown.', who: ['Member', 'Concierge'], term: 'ALL', surface: 'Member app', route: { label: 'Membership', to: '/app/membership' } },
      { when: 'Count', what: 'Every consented re-measure adds to the joyful-years count', does: 'With Publishing consent, each re-measure joins the de-identified cohort and the audited count.', who: ['Science Office'], term: 'ALL', surface: 'Trust centre', route: { label: 'Trust centre · Publishing consent', to: '/app/trust' } },
    ],
  },
}

// ─── The ninety-day loop (Memo p.13) ─────────────────────────────────────────
export interface LoopStation { id: string; label: string; short: string; when: string; anchor: number; does: string; who: string; sees: string; route: { label: string; to: string } }
export const LOOP_STATIONS: LoopStation[] = [
  { id: 'pre', label: 'Consent', short: 'D−14', when: 'Day −14', anchor: -14, does: 'Consent, Index baseline, device link, home draw where needed, first hello to the cohort.', who: 'Member · concierge', sees: 'Three separate consents and one invitation, not a form.', route: { label: 'Onboarding', to: '/onboarding' } },
  { id: 'measure', label: 'Measure', short: 'D0', when: 'Day 0', anchor: 0, does: 'Index (or Clinical grade) issued; lowest term named; the Wheel on the home screen.', who: 'Engine · physician', sees: 'The Index, its band, its method and the next measure date.', route: { label: 'Your Index', to: '/app/index' } },
  { id: 'plan', label: 'Plan', short: 'Checkout', when: 'Checkout', anchor: 1, does: 'Protocol live for the primary term; coach and concierge named.', who: 'Coach', sees: 'Two named people and one protocol for one term.', route: { label: 'Care', to: '/app/care' } },
  { id: 'act', label: 'Act', short: 'Daily', when: 'Daily', anchor: 6, does: 'One action chosen by the lowest term; three Joy Ledger prompts; signals flow.', who: 'Member · engine', sees: 'One card, one Daybreak button, “Not today” always allowed.', route: { label: 'Today', to: '/app' } },
  { id: 'review', label: 'Review', short: 'D15 · 45', when: 'Day 15 · 45', anchor: 15, does: 'Reviews; drift on signals or Ledger becomes a call from a person, not a push.', who: 'Coach', sees: 'A call from Priya, never a red alert.', route: { label: 'Coach console', to: '/console/coach' } },
  { id: 'talk', label: 'Talk', short: 'D60', when: 'Day 60', anchor: 60, does: 'The next-step conversation, by the lowest term: the natural moment for the next ’cation or membership.', who: 'Concierge', sees: 'A suggestion with a reason, never a countdown.', route: { label: '’Cation', to: '/app/cation' } },
  { id: 'remeasure', label: 'Re-measure', short: 'D76 · 90', when: 'Day 76 · 90', anchor: 76, does: 'Re-measure like for like; signed delta; Index re-score; the card handed over or sent.', who: 'Engine · physician', sees: 'Movement both ways, as a sentence and a named person.', route: { label: 'Day 90', to: '/app/index/day-90' } },
  { id: 'publish', label: 'Publish', short: 'D90+', when: 'Day 90+', anchor: 90, does: 'Aggregate deltas published by term, up and down; the next loop begins.', who: 'Evidence Editor', sees: 'The cohort result, published even when it fell.', route: { label: 'Published cohorts', to: '/console/science' } },
]

export const DAY_IN_JOY_OS = [
  { at: '07:10', name: 'Wake', what: 'Sleep and HRV sync in the background from the ring. Nothing asks for attention.', to: '/app/devices' },
  { at: '08:00', name: 'Today', what: 'One card: “Ten minutes on the verandah with tea. Notice three things.” 30 seconds.', to: '/app' },
  { at: '12:40', name: 'Ledger 1', what: '“Anything good in the last few hours?” One tap, a word or a photo. 10 seconds.', to: '/app/ledger' },
  { at: '16:15', name: 'Ledger 2', what: 'Second prompt, sent only outside meetings and never in quiet hours.', to: '/app/ledger' },
  { at: '20:00', name: 'The action', what: 'Done, with the family. “Done for today.” No confetti; a quiet line of thanks.', to: '/app' },
  { at: '21:30', name: 'Ledger 3', what: 'Third prompt; the wind-down if Ease is live. Mindful minutes written back if allowed.', to: '/app/spaces/ease' },
  { at: 'Mon 19:00', name: 'The circle', what: 'Weekly 30-minute call with the circle of eight and Coach Priya.', to: '/app/circles' },
]

// ─── Deck tables ─────────────────────────────────────────────────────────────
export const COMPETITORS = ['Oura', 'WHOOP', 'Apple', 'Ultrahuman', 'Function', 'Superpower', 'Fountain', 'Blueprint', 'Headspace', 'Calm', 'Finch', 'Spring', 'Personify', 'HealthifyMe', 'cult.fit']
// f = strong / native · h = partial · o = absent. Joy OS column is the target design.
export const MATRIX: { cap: string; whole?: boolean; row: string }[] = [
  { cap: 'Composite wellbeing index', row: 'hhohohohoooohoo' },
  { cap: 'Explainability', row: 'fffhffhhohohoho' },
  { cap: 'Multi-brand wearables', row: 'oofoohhhoooofhh' },
  { cap: 'Labs and biomarkers', row: 'hhhfffffoooohho' },
  { cap: 'Clinician access', row: 'hhoohffhfhofhfo' },
  { cap: 'AI coach or companion', row: 'ffhfhfhffoofhfh' },
  { cap: 'Community or circles', row: 'ohhhooohoohofhf' },
  { cap: 'Purpose and meaning', whole: true, row: 'oooooooohhhhooo' },
  { cap: 'Relationships', whole: true, row: 'oooooooohhhhooh' },
  { cap: 'Financial and time freedom', whole: true, row: 'ooooooooooohhoo' },
  { cap: 'Pleasure and daily joy', whole: true, row: 'oohooooohhfoooh' },
  { cap: 'Suffering → care', row: 'hhhohhhoffhfhho' },
  { cap: 'Retreats and experiences', whole: true, row: 'oooooohoooooooh' },
  { cap: 'Employer offering', row: 'ffhhhhooffoffhh' },
  { cap: 'Family or household', row: 'oofhohhoffofhoo' },
  { cap: 'Privacy and consent', row: 'fhfhhhhhhhhfhhh' },
  { cap: 'India pricing (INR)', row: 'hohfoooohhhooff' },
]

export const WHITE_SPACE = [
  { h: 'The first measured index of a whole life', b: 'Five additive terms and a subtractor. Competitors score the body or screen the mind for illness; nobody scores flourishing.' },
  { h: 'Balance, rewarded', b: 'A geometric mean means superb biomarkers cannot hide no one to call at two in the morning.' },
  { h: 'An aggregator, not another device', b: 'Oura by default; WHOOP, Apple, Garmin and Health Connect via Terra. Joy OS sits above the hardware war.' },
  { h: 'Pleasure and meaning as practices', b: 'Daily pleasure and purpose practices tied to measured outcomes, without a single streak.' },
  { h: 'Real people and real places', b: 'A stepped ladder: practice → VIVA → circle → coach → physician or psychologist → ’cation, priced in rupees.' },
  { h: 'India-native rails', b: 'ABHA and ABDM, Indian labs, Razorpay and UPI, DPDP-grade consent, joint families and caregiving load.' },
  { h: 'An HR outcome that is not illness', b: 'Team Joyspan, aggregated (≥ 50, no cell under 10): a leading indicator, never a surveillance tool.' },
]

export const REJECTED = ['Streaks or streak recoveries', 'Pet or “joy jar” mechanics', 'Leaderboards and member comparisons', '“Joyspan days gained” as a headline (JALY stays research)', 'A different palette per space', 'Fear framing or loss aversion', 'Supplement commerce near a score', 'A phone-number gate before value']

export const MOATS = [
  { n: '01', k: 'The unit', h: 'Own the measure', b: 'Every score anywhere is a score in AIWO’s unit.' },
  { n: '02', k: 'The record', h: 'Own the longitudinal data', b: 'The only six-term, ninety-day consented cohort: 600 → 100,000.' },
  { n: '03', k: 'The standard', h: 'Own the interface', b: 'An open FHIR guide; the steward keeps the reference implementation.' },
  { n: '04', k: 'The habit', h: 'Own the ninety days', b: 'Switching means losing your history and your circle.' },
  { n: '05', k: 'The places', h: 'Own physical delivery', b: 'Real rooms, real clinicians, real stays, all measured.' },
  { n: '06', k: 'The channels', h: 'Own distribution', b: 'Insurers, employers and hospitals at ₹1,000 a year, not ₹7.5 lakh.' },
  { n: '07', k: 'The trust', h: 'Own the right to ask', b: 'Physicians who sign; results published up and down.' },
]

export const FLYWHEEL = ['More members measured', 'Bigger cohort record', 'Better-validated Index', 'Better next actions', 'Bigger measured deltas', 'Insurers and employers pay', 'Lower cost per member']

export const PRICE_LADDER = [
  { name: 'Joyspan Check', price: 'Free' },
  { name: 'Joy OS · self-assessed Index, Ledger, one practice', price: 'Free' },
  { name: 'Joy OS Plus · the Practice, devices, full spaces', price: '₹499 / mo' },
  { name: 'Licensed member (insurer, employer)', price: '≈ ₹1,000 / yr' },
  { name: 'Hospital unit · “Joyspan Inside”', price: 'Platform + per patient' },
  { name: 'Circle · Clinical · Patron', price: '₹1.5 L · 4.5 L · 12 L' },
  { name: 'Family Joy Office household', price: '₹50 L – 2 Cr / yr' },
]

export const REVENUE_BUILD = [
  { line: 'Plus subscribers', fy28: '3 k', fy31: '150 k', fy36: '1.5 M' },
  { line: '× net ₹ per year', fy28: '5,000', fy31: '5,000', fy36: '5,000' },
  { line: 'Licensed members', fy28: '5 k', fy31: '850 k', fy36: '8 M' },
  { line: '× ₹ per year', fy28: '1,000', fy31: '700', fy36: '1,000' },
  { line: 'Platform and hospital fees', fy28: '—', fy31: '₹15 Cr', fy36: '₹150 Cr' },
  { line: 'Joy OS revenue', fy28: '₹2 Cr', fy31: '₹150 Cr', fy36: '₹1,700 Cr', total: true },
  { line: 'Share of AIWO revenue', fy28: '2%', fy31: '15%', fy36: '31%' },
]

export const UNIT_ECONOMICS = [
  { k: 'Infrastructure and AI per active member-year', v: '≤ ₹60' },
  { k: 'Coaching per licensed member-year', v: '≤ ₹250' },
  { k: 'Cost per active member-year (kill line)', v: '≤ ₹1,500' },
  { k: 'Record capture per person-year', v: '₹40,000 → ₹400' },
  { k: 'Gross margin, licensed', v: '≥ 70%' },
]

export const REFUSE = ['Selling the Index to underwriters for individual pricing', 'Ad-funded free tiers', 'A league table of members', 'Vendor scores inside the Index', 'Any claim ahead of the evidence']

export const DECISIONS = [
  { n: 1, d: 'Joy OS as a separate app on a shared AIWO Platform Core; LifeOS kept as the clinical app', rec: 'Adopt; amends AIWO 3.1 decision 7', owner: 'CEO · CTO', by: '15 Nov' },
  { n: 2, d: 'Appoint a Head of Joy OS and fund the J0–J2 team of 15', rec: 'Hire or appoint now; interim from LifeOS product lead', owner: 'CEO', by: '15 Nov' },
  { n: 3, d: 'Freeze J0 scope: Index engine v1.0, events, circles, Health Connect, iOS beta', rec: 'Freeze; anything else to a dated J1 list', owner: 'CTO · Head of Joy OS', by: '15 Nov' },
  { n: 4, d: 'Index method v1.0 in the engine; licences for Ikigai-9, ISI and others in writing', rec: 'Adopt; Legal to confirm each licence', owner: 'Science · Legal', by: '30 Nov' },
  { n: 5, d: 'Product principles as release criteria', rec: 'Adopt as written', owner: 'Head of Joy OS · CMO', by: '15 Nov' },
  { n: 6, d: 'Stack and residency: TypeScript, Expo, PostgreSQL, India region primary', rec: 'Adopt as in the architecture', owner: 'CTO', by: '30 Nov' },
  { n: 7, d: 'Licensing first: Star Health as the first institutional tenant at J3', rec: 'Open the conversation in Q4 FY27', owner: 'CEO · Institutional', by: 'Mar 2027' },
  { n: 8, d: 'Publish the Index as an open FHIR guide after validation', rec: 'Approve in principle; publish at J4', owner: 'Science · CTO', by: 'FY28' },
]

export const GUARDRAILS = [
  'Emergency intercept first: a person and Tele-MANAS 14416 before any model runs',
  'No AI text on a Suffering result: pre-approved passages only',
  'No diagnosis, no treatment: physician gate',
  'No financial advice: money questions go to SEBI-registered advisers',
  'Claims-gated: refused words, fail closed',
  'Minimum data: no identifiers; never trains third-party models',
  'Every output attributable: model, prompt, tool, inputs hash, reviewer',
]

export const VIVA_TOOLS: { tool: string; term: TermKey | 'ALL'; does: string }[] = [
  { tool: 'index_explainer', term: 'ALL', does: 'Explains a score, its band and the lowest term' },
  { tool: 'next_best_action', term: 'ALL', does: 'Narrates why today’s action was chosen' },
  { tool: 'ikigai_coach', term: 'P', does: 'Guides the Ikigai map and the Tomorrow Question' },
  { tool: 'couples_prompt', term: 'R', does: 'State of Us; never reveals one partner to the other' },
  { tool: 'second_arrow_reflection', term: 'B', does: 'Reflects journal text; no advice on screens' },
  { tool: 'ledger_weekly_story', term: 'D', does: 'Where joy came from this week, in two sentences' },
  { tool: 'practice_companion', term: 'P', does: 'Answers on the week’s practice' },
  { tool: 'coach_digest', term: 'ALL', does: 'Summarises a quarter for the coach' },
]

// ─── Team and organisation (Memo p.39) ───────────────────────────────────────
export const TEAM_ROLES: { role: string; j02: number; j3: number; j4: number; owns: string }[] = [
  { role: 'Head of Joy OS (product)', j02: 1, j3: 1, j4: 1, owns: 'The six spaces, the Index engine in software, ’cations, devices; one roadmap for app, events and consoles' },
  { role: 'Product managers, by term pair', j02: 1, j3: 3, j4: 6, owns: 'Body + Ease, Purpose + Freedom, People + Pleasure' },
  { role: 'Mobile and health integrations', j02: 3, j3: 5, j4: 10, owns: 'Expo app, native modules, offline' },
  { role: 'Backend and data', j02: 3, j3: 6, j4: 14, owns: 'Domain services, Platform Core, pipelines' },
  { role: 'Design', j02: 2, j3: 3, j4: 5, owns: 'Tokens, the six spaces, research with 50+ members' },
  { role: 'QA and security', j02: 2, j3: 3, j4: 6, owns: 'Test automation, MASVS, pen tests' },
  { role: 'Clinical informatics', j02: 1, j3: 2, j4: 3, owns: 'Gates, screens, FHIR, safety' },
  { role: 'Content and translation', j02: 2, j3: 3, j4: 5, owns: 'The Practice, the action library, i18n' },
  { role: 'ML and evaluation', j02: 0, j3: 2, j4: 5, owns: 'Next best action, drift, the evaluation plane' },
  { role: 'Platform, SRE, partner engineering', j02: 0, j3: 2, j4: 8, owns: 'Tenants, regions, partner APIs' },
]

export const TEAM_GOVERNANCE: [string, string][] = [
  ['Head of Joy OS', 'Reports to the CTO; one of three new offices in AIWO 3.1, with Joyspan Science and Joyspiration.'],
  ['Head of Joyspan Science', 'Owns the Index method. Joy OS implements it and cannot change it.'],
  ['Medical Director', 'Signs every clinical rule and threshold in the app.'],
  ['CMO with Clinical', 'Own the joy lexicon and share the claims gate: every in-app sentence passes it.'],
  ['Head of Member Experience', 'Runs coaches, concierges and circles: the people behind drift.'],
  ['’Cation Leads · Evidence Editor', 'Each lead owns a template’s Day-90 delta; the Evidence Editor publishes cohorts up and down.'],
]

export const TEAM_SPEND: [string, string][] = [
  ['≈ ₹9–12 Cr', 'a year in Milk (FY27–FY28): team, cloud, licences'],
  ['≈ 9%', 'of AIWO spend in Milk'],
]
