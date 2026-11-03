import { INDEX_HISTORY } from '@/data/member'
import type { TermKey } from '@/domain/types'

const SPEC = INDEX_HISTORY[0].terms.map((t) => t.value) as [number, number, number, number, number, number]

// SPECIMEN DATA for the platform consoles. Not real members, tenants' real figures or results.
// Sources: Technical Memorandum (p.25, p.30–42) and Technical Architecture (p.20, p.24–27).
// The console clock matches the care consoles: 28 January 2027, 21:10 IST.

export const BIZ_NOW = '2027-01-28'

// ─── Tenant admin ─────────────────────────────────────────────────────────

export const TENANT_PROFILE = {
  id: 'tnt_northwind',
  legal: 'Northwind Capital Advisors Pvt Ltd',
  edition: 'Joyspan@Work · Team Joyspan edition',
  stage: 'Design-partner pilot ahead of J3',
  cycle: 'Cycle 1 · Day 0 on 23 Oct 2026 · Day 90 closed 21 Jan 2027',
  admin: 'Rhea Kapoor · Head of People',
  region: 'India · Mumbai cell (pooled)',
  recovery: 'Hyderabad',
  keys: 'Pooled region key · per-tenant data key from J4',
  contract: 'Per member per year · aggregate outcomes only',
  lastPublished: '2027-01-22',
}

// Cycle 1 Day 0 is 23 Oct 2026, the day after method v1.0 was published (22 Oct), so every Day-0 figure is on v1.0.
// Wave 3 is the one reminder, sent to the 241 invited in waves 1–2 who had not enrolled (900 − 659); 812 enrolled in all.
export const INVITE_WAVES = [
  { id: 'w1', name: 'Wave 1 · Engineering and Operations', sent: '2026-10-07', invited: 420, opened: 372, enrolled: 318 },
  { id: 'w2', name: 'Wave 2 · Sales, Finance, People & Legal', sent: '2026-10-14', invited: 480, opened: 401, enrolled: 341 },
  { id: 'w3', name: 'Wave 3 · Gentle reminder, all not yet enrolled', sent: '2026-10-19', invited: 241, opened: 198, enrolled: 153 },
]

// EAP routing volume — counts only; Ease flags are routed by AIWO, never shown to the employer.
export const EAP_ROUTING = [
  { month: 'Oct', eap: 14, clinician: 6 },
  { month: 'Nov', eap: 19, clinician: 11 },
  { month: 'Dec', eap: 17, clinician: 8 },
  { month: 'Jan', eap: 12, clinician: 4 },
]

export const TENANT_FLAGS = [
  { key: 'circles_with_colleagues', label: 'Circles with colleagues', state: 'On · by member choice', on: true, note: 'A member joins a team circle only if they choose to.' },
  { key: 'eap_routing', label: 'EAP routing for Ease flags', state: 'On', on: true, note: 'Routed by AIWO to the EAP provider; the employer sees monthly counts only.' },
  { key: 'whatsapp_check', label: 'Joyspan Check on WhatsApp', state: 'On', on: true, note: 'Free Check; bands, never a number.' },
  { key: 'languages', label: 'Languages', state: 'EN · TA · HI (J3)', on: true, note: 'Tamil and Hindi follow the J3 release.' },
  { key: 'team_leaderboards', label: 'Team leaderboards or member comparisons', state: 'Never', on: false, note: 'Not a setting. Joy OS has no league tables.' },
  { key: 'individual_export', label: 'Individual-level export', state: 'Never', on: false, note: 'Tenants receive aggregates of 50 or more only.' },
  { key: 'ease_detail', label: 'Ease screens, journals or any term below aggregate', state: 'Never', on: false, note: 'Architecture p.24: tenants never receive these.' },
]

export const ELIGIBILITY_COLUMNS = [
  { name: 'employee_ref', note: 'Your own hashed reference. Not a name.' },
  { name: 'work_email', note: 'Used once, for the invitation.' },
  { name: 'department', note: 'For aggregates of 50 or more only.' },
  { name: 'location', note: 'City; never a desk or team.' },
  { name: 'eligible_from', note: 'ISO date.' },
]

// Insurer view — Star Health, J3 first institutional tenant (Memo p.25, decision 7).
// The pilot is still in conversation (Decision 7 open, tenant routes off), so the outcome figures below are a
// J3 PROJECTION for the pilot conversation, not measured results. The earliest possible Day 90 is 2 Mar 2027.
const INSURER_BASE = {
  name: 'Star Health · Joy OS policy benefit',
  stage: 'Pilot cohort in conversation · J3',
  enrolled: 5000,
  measured: 3860,
  remeasureRate: 0.68,
  burdenD0: 41,
  burdenD90: 35,
  burdenFalling: 0.58,
  pricePerMember: 1000,
  outcomeShare: 0.3,
  bands: [
    { label: 'Burden fell ≥5', share: 0.39 },
    { label: 'Burden fell 1–4', share: 0.19 },
    { label: 'Unchanged', share: 0.24 },
    { label: 'Burden rose', share: 0.18 },
  ],
}
export const INSURER = {
  ...INSURER_BASE,
  /** Everyone whose Burden rose is offered a clinician call, so the count of offers is that share of the re-measured. */
  routed: Math.round(INSURER_BASE.measured * INSURER_BASE.remeasureRate * INSURER_BASE.bands[3].share),
  projection: true,
  firstDay90: '2 Mar 2027',
}

// ─── Science Office ───────────────────────────────────────────────────────

export const SIGNERS = [
  { id: 's1', name: 'Dr Lakshmi Raghavan', role: 'Head of Joyspan Science', initials: 'LR' },
  { id: 's2', name: 'Dr Arvind Natesan', role: 'Medical Director', initials: 'AN' },
]

export type WeightSet = Record<TermKey, { label: string; w: number }[]>

export const WEIGHTS_V10: WeightSet = {
  H: [{ label: 'LE8 self-report', w: 0.5 }, { label: 'Capacity battery', w: 0.3 }, { label: 'Self-rated health', w: 0.2 }],
  P: [{ label: 'Ikigai-9', w: 0.6 }, { label: 'MLQ-Presence', w: 0.4 }],
  R: [{ label: '100 − UCLA-3', w: 0.4 }, { label: 'LSNS-6', w: 0.3 }, { label: 'Support items', w: 0.3 }],
  F: [{ label: 'Autonomy (BPNSFS)', w: 0.4 }, { label: 'Time affluence', w: 0.3 }, { label: 'CFPB Financial WB', w: 0.3 }],
  D: [{ label: 'SPANE balance', w: 0.5 }, { label: 'Joy moments', w: 0.3 }, { label: 'Savouring', w: 0.2 }],
  B: [{ label: 'Mood (PHQ-4)', w: 0.3 }, { label: 'Sleep (ISI)', w: 0.25 }, { label: 'Stress (PSS-4)', w: 0.2 }, { label: 'Pain', w: 0.15 }, { label: 'Avoidance', w: 0.1 }],
}

// Calibration proposal from the 612-record cohort (draft; illustrative).
export const WEIGHTS_V11_PROPOSAL: WeightSet = {
  H: [{ label: 'LE8 self-report', w: 0.45 }, { label: 'Capacity battery', w: 0.35 }, { label: 'Self-rated health', w: 0.2 }],
  P: [{ label: 'Ikigai-9', w: 0.55 }, { label: 'MLQ-Presence', w: 0.45 }],
  R: [{ label: '100 − UCLA-3', w: 0.4 }, { label: 'LSNS-6', w: 0.25 }, { label: 'Support items', w: 0.35 }],
  F: [{ label: 'Autonomy (BPNSFS)', w: 0.4 }, { label: 'Time affluence', w: 0.35 }, { label: 'CFPB Financial WB', w: 0.25 }],
  D: [{ label: 'SPANE balance', w: 0.5 }, { label: 'Joy moments', w: 0.3 }, { label: 'Savouring', w: 0.2 }],
  B: [{ label: 'Mood (PHQ-4)', w: 0.3 }, { label: 'Sleep (ISI)', w: 0.3 }, { label: 'Stress (PSS-4)', w: 0.2 }, { label: 'Pain', w: 0.1 }, { label: 'Avoidance', w: 0.1 }],
}

export const METHOD_V10_META = {
  hash: 'sha256:9c41…e07a',
  engine: 'engine 1.0.4',
  signed: ['Dr Lakshmi Raghavan · 20 Oct 2026', 'Dr Arvind Natesan · 21 Oct 2026'],
  bands: 'Steady ≥70 · Uneven 50–69 · Thin <50',
  scores: 1180,
}

/** Golden-file cases: inputs H, P, R, F, D, B → expected JI (method v1.0, λ 0.25). */
export const GOLDEN_CASES: { id: string; name: string; t: [number | null, number | null, number | null, number | null, number | null, number | null] }[] = [
  { id: 'gf-001', name: 'Balanced profile', t: [70, 70, 70, 70, 70, 20] },
  { id: 'gf-002', name: 'Specimen member, Jan 2027', t: SPEC },
  { id: 'gf-003', name: 'One thin term (balance is rewarded)', t: [85, 85, 85, 30, 85, 20] },
  { id: 'gf-004', name: 'Heavy burden', t: [60, 55, 58, 50, 52, 78] },
  { id: 'gf-005', name: 'Burden at ceiling, bounded at 0', t: [10, 12, 8, 10, 9, 100] },
  { id: 'gf-006', name: 'Term not yet measured: never imputed', t: [70, null, 68, 60, 62, 25] },
  { id: 'gf-007', name: 'Floor of 1 inside the log', t: [0, 60, 60, 60, 60, 10] },
  { id: 'gf-008', name: 'High and even', t: [92, 90, 94, 88, 91, 6] },
]

export const RESEARCH = [
  { id: 'RR-01', title: 'Reliability and validity of the Joyspan Index v1.0', ethics: 'IEC-AIWO-2026-014', records: 612, status: 'Collecting', lead: 'Dr Lakshmi Raghavan', output: 'Validation paper · J3 gate' },
  { id: 'RR-02', title: 'Couples Check agreement and CSI-4 change after Lovecation', ethics: 'IEC-AIWO-2026-019', records: 96, status: 'Protocol approved', lead: 'Dr Meera Iyer', output: 'Case series' },
  { id: 'RR-03', title: 'Sleep regularity and the Burden term', ethics: 'IEC-AIWO-2026-021', records: 210, status: 'Analysis', lead: 'Dr Sanjay Menon', output: 'Pre-registered analysis' },
  { id: 'RR-04', title: 'India Joy Report 2027 · national aggregates', ethics: 'Aggregate, de-identified', records: 1180, status: 'Drafting', lead: 'Science Office', output: 'Public report' },
]

export const DATA_REQUESTS = [
  { id: 'DRQ-114', who: 'IIT Madras · behavioural science group', purpose: 'Term covariance, de-identified', rows: 'Aggregates, cells ≥10', status: 'Approved' },
  { id: 'DRQ-117', who: 'Internal · next-best-action team', purpose: 'Action → term delta, by action', rows: 'De-identified, pseudonymous', status: 'Approved' },
  { id: 'DRQ-121', who: 'Insurer prospect', purpose: 'Burden by policyholder', rows: 'Individual rows requested', status: 'Refused · individual underwriting' },
]

export const REFUSED = ['add years', 'reverse ageing', 'reverse aging', 'cure', 'happiness guaranteed']
export const NEEDS_CITATION = ['clinically proven', 'proven to', 'doctor-approved', 'scientifically shown']

export const CLAIMS_LOG = [
  { at: '28 Jan · 18:42', surface: 'Lovecation landing · hero', text: 'Come back closer, and add years to your marriage.', match: 'add years', verdict: 'refused' as const, by: 'Gate · auto', fix: 'Come back closer. Measured at Day 90, for each of you.' },
  { at: '28 Jan · 16:05', surface: 'VIVA · index_explainer · HI', text: 'Your Index rose four points; your lowest term is Freedom.', match: null, verdict: 'passed' as const, by: 'Gate · auto', fix: null },
  { at: '27 Jan · 11:20', surface: 'Sleepcation brochure', text: 'A clinically proven way to cure insomnia in four nights.', match: 'cure', verdict: 'refused' as const, by: 'Clinical · Dr Natesan', fix: 'Four nights to rebuild sleep; ISI measured before and at Day 90.' },
  { at: '26 Jan · 09:48', surface: 'Partner email · Fairmont', text: 'Joyspan: happiness guaranteed this New Year.', match: 'happiness guaranteed', verdict: 'refused' as const, by: 'Gate · auto', fix: 'Begin the year with your Joyspan Index.' },
  { at: '25 Jan · 15:31', surface: 'Healthcation page', text: 'Our programme can reverse ageing at the cellular level.', match: 'reverse ageing', verdict: 'refused' as const, by: 'Brand · CMO office', fix: 'Know your body, measured, and give it a reason to matter.' },
  { at: '25 Jan · 10:02', surface: 'VIVA · ledger_weekly_story · TA', text: 'Joy came most from family meals and morning walks this week.', match: null, verdict: 'passed' as const, by: 'Gate · auto', fix: null },
  { at: '24 Jan · 17:15', surface: 'Investor note draft', text: 'Doctor-approved programme for lasting joy.', match: 'doctor-approved', verdict: 'rewritten' as const, by: 'Clinical · Dr Natesan', fix: 'Programme designed with AIWO physicians; results published up and down.' },
]

export const JOY_REPORT = {
  edition: 'India Joy Report 2027',
  window: 'Oct – Dec 2026',
  publish: '2027-05-15',
  records: 1180,
  states: [
    { name: 'Maharashtra', n: 402, ji: 61, lowest: 'F' as TermKey },
    { name: 'Tamil Nadu', n: 310, ji: 63, lowest: 'D' as TermKey },
    { name: 'Karnataka', n: 168, ji: 60, lowest: 'F' as TermKey },
    { name: 'Delhi NCR', n: 121, ji: 58, lowest: 'B' as TermKey },
    { name: 'Telangana', n: 96, ji: 62, lowest: 'R' as TermKey },
    { name: 'Gujarat', n: 74, ji: 59, lowest: 'F' as TermKey },
    { name: 'Kerala', n: 7, ji: null, lowest: null },
    { name: 'Goa', n: 2, ji: null, lowest: null },
  ],
  checklist: [
    { item: 'Method pinned on every figure (v1.0)', done: true },
    { item: 'No cell under ten; suppression and rounding applied', done: true },
    { item: 'Results published up and down, including the Sleepcation falsifier', done: true },
    { item: 'Claims gate run on every sentence', done: true },
    { item: 'Science Council review (may dissent, in print)', done: false },
    { item: 'Differential-privacy noise on national figures', done: false, note: 'From J4' },
  ],
}

// ─── Control plane ───────────────────────────────────────────────────────

export const AI_TOOLS = [
  { key: 'index_explainer', what: 'Explains a score, its band and the lowest term', owner: 'Index team', term: 'ALL' as const, on: true, langs: { EN: 0.98, TA: 0.95, HI: 0.96 }, calls: 4120 },
  { key: 'next_best_action', what: 'Narrates why today’s action was chosen', owner: 'Today team', term: 'ALL' as const, on: true, langs: { EN: 0.97, TA: 0.94, HI: 0.95 }, calls: 9860 },
  { key: 'ikigai_coach', what: 'Guides the Ikigai map and the Tomorrow Question', owner: 'Purpose squad', term: 'P' as const, on: true, langs: { EN: 0.96, TA: 0.91, HI: 0.93 }, calls: 1340 },
  { key: 'couples_prompt', what: 'State of Us prompts; never reveals one partner to the other', owner: 'People squad', term: 'R' as const, on: true, langs: { EN: 0.99, TA: 0.97, HI: 0.98 }, calls: 610 },
  { key: 'second_arrow_reflection', what: 'Reflects journal text back; ACT-informed; no advice', owner: 'Ease squad · Clinical', term: 'B' as const, on: true, langs: { EN: 0.97, TA: 0.89, HI: 0.92 }, calls: 780 },
  { key: 'ledger_weekly_story', what: 'Where joy came from this week, in two sentences', owner: 'Pleasure squad', term: 'D' as const, on: true, langs: { EN: 0.98, TA: 0.96, HI: 0.97 }, calls: 2210 },
  { key: 'time_audit_summary', what: 'Time audit in plain words; no financial advice', owner: 'Freedom squad', term: 'F' as const, on: true, langs: { EN: 0.97, TA: 0.93, HI: 0.94 }, calls: 520 },
  { key: 'practice_companion', what: 'Answers on the week’s practice from the book and notes', owner: 'Practice team', term: 'ALL' as const, on: true, langs: { EN: 0.96, TA: 0.92, HI: 0.94 }, calls: 1730 },
  { key: 'coach_digest', what: 'Summarises a member’s quarter for the coach', owner: 'Coach console', term: 'ALL' as const, on: true, langs: { EN: 0.98, TA: 0.0, HI: 0.0 }, calls: 312 },
  { key: 'explain_biomarker', what: 'Explains a panel value in plain words; physician signs', owner: 'Body squad · Clinical', term: 'H' as const, on: false, langs: { EN: 0.94, TA: 0.86, HI: 0.88 }, calls: 0, hold: 'Dr Arvind Natesan · Medical Director' },
]

export const RELEASE_FLAGS = [
  { key: 'health_connect_v2', label: 'Health Connect periodic sync v2', scope: 'All · India', state: '100%', on: true },
  { key: 'healthkit_background', label: 'HealthKit background delivery', scope: 'All · India', state: '100%', on: true },
  { key: 'oura_via_terra', label: 'Oura via Terra (default device)', scope: 'All · India', state: '100%', on: true },
  { key: 'couples_check', label: 'Couples Check', scope: 'Lovecation cohorts', state: 'Cohort', on: true },
  { key: 'ui_tamil_hindi', label: 'Tamil and Hindi interface', scope: 'Beta cohort', state: '5%', on: true },
  { key: 'nba_bandit', label: 'Guarded next-best-action bandit (Ease excluded)', scope: 'J3', state: 'Off', on: false },
  { key: 'tenant_star_health', label: 'Star Health tenant routes', scope: 'J3', state: 'Off', on: false },
  // Architecture p.34 leaves open whether the public Check stays anonymous or asks for a phone number: a flag, so either ships.
  { key: 'check_asks_phone', label: 'Public Check asks for a phone number', scope: 'Public Check · India', state: 'Off', on: false },
]

/** Shared with the public Check (entry lane): JSON boolean, default false = anonymous. */
export const CHECK_PHONE_KEY = 'joyos:flag:check-asks-phone'
/** Shared with the member layout (shell lane): JSON { tagline }, empty string = none. Northwind is the live employer tenant. */
export const TENANT_BRANDING_KEY = 'joyos:tenant:branding'

export const RED_TEAM = [
  { suite: 'Crisis intercept', cases: 420, passed: 420, required: 1, last: '27 Jan', note: 'Self-harm and medical-emergency language routes to a person and Tele-MANAS 14416 before any model runs.' },
  { suite: 'Couples leakage', cases: 260, passed: 260, required: 1, last: '27 Jan', note: 'No prompt may contain a partner’s private answers.' },
  { suite: 'Coercion and pressure', cases: 180, passed: 177, required: 0.98, last: '26 Jan', note: 'Three soft-pressure phrasings in Tamil rewritten; re-run passes.' },
  { suite: 'Jailbreaks and prompt injection', cases: 340, passed: 336, required: 0.98, last: '25 Jan', note: 'Four role-play escapes; output guard held, model text discarded.' },
  { suite: 'Claims and refused words', cases: 300, passed: 300, required: 1, last: '27 Jan', note: 'Fail closed on any refused word.' },
]

export const HUMAN_REVIEW = { sampled: 210, reviewed: 210, reviewers: 'Two psychologists, one physician · EN, TA, HI', findings: [{ kind: 'Tone, too brisk', n: 4 }, { kind: 'Claims rewrite', n: 1 }, { kind: 'Wrong term named', n: 1 }, { kind: 'Safety', n: 0 }] }

export const SLOS = [
  { key: 'today', journey: 'Open Today', target: '99.9% · p95 300 ms', objective: 0.999, actual: 0.99942, p95: '212 ms', budgetLeft: 0.42, burn: [100, 96, 93, 90, 86, 80, 77, 74, 70, 66, 61, 55, 49, 42] },
  { key: 'index', journey: 'Submit Check / Index', target: '99.95% · score ≤2 s', objective: 0.9995, actual: 0.99971, p95: '1.1 s', budgetLeft: 0.58, burn: [100, 98, 96, 93, 91, 88, 84, 80, 76, 72, 68, 65, 61, 58] },
  { key: 'ledger', journey: 'Ledger write', target: '99.9% · offline-safe', objective: 0.999, actual: 0.99881, p95: '180 ms', budgetLeft: 0, burn: [100, 92, 84, 77, 70, 61, 50, 39, 27, 15, 4, 0, 0, 0] },
  { key: 'signals', journey: 'Signals fresh', target: '95% ≤15 min', objective: 0.95, actual: 0.962, p95: '11 min', budgetLeft: 0.71, burn: [100, 99, 97, 96, 94, 92, 90, 87, 85, 82, 79, 76, 74, 71] },
  { key: 'p0', journey: 'P0 safety route', target: '100% to a human', objective: 1, actual: 1, p95: '3 m 40 s', budgetLeft: 1, burn: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100] },
  { key: 'day90', journey: 'Day-90 report', target: '≤24 h after sign-off', objective: 1, actual: 1, p95: '6 h 12 m', budgetLeft: 1, burn: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100] },
]

// Infra + AI ₹ per active member-year, by service. Mountain target ≤ ₹60 in total.
export const COSTS = [
  { service: 'VIVA · model gateway', now: 19, budget: 14 },
  { service: 'signals-ingest', now: 13, budget: 10 },
  { service: 'core-api · identity, consent, audit', now: 9, budget: 8 },
  { service: 'BFF · Today', now: 6, budget: 6 },
  { service: 'index-engine', now: 4, budget: 4 },
  { service: 'notifications · WhatsApp', now: 6, budget: 5 },
  { service: 'ledger', now: 3, budget: 3 },
  { service: 'research registry · warehouse', now: 5, budget: 6 },
  { service: 'events · passes', now: 3, budget: 4 },
]

// Members and tenants per cell are derived from TENANTS in the console, so the card and the table agree.
export const CELLS = [
  { name: 'India · Mumbai', status: 'Live', when: 'Now', region: 'ap-south-1', recovery: 'Hyderabad', law: 'DPDP Act 2023 · ABDM' },
  { name: 'GCC · Dubai', status: 'Planned', when: 'J4 · FY29', region: 'me-central-1', recovery: 'In region', law: 'UAE PDPL · DHA licensing' },
  { name: 'UK · London', status: 'Planned', when: 'FY30', region: 'eu-west-2', recovery: 'In region', law: 'UK GDPR · CQC partner' },
  { name: 'Singapore', status: 'Planned', when: 'FY30', region: 'ap-southeast-1', recovery: 'In region', law: 'PDPA' },
  { name: 'US diaspora', status: 'Later', when: 'FY31+', region: 'us-east-1', recovery: 'In region', law: 'HIPAA-aligned · state law' },
]

// budget = infra + AI ₹ per active member-year for that tenant. Member-weighted mean:
// (1,180 × 70 + 812 × 64 + 140 × 75) / 2,132 = 145,068 / 2,132 ≈ ₹68, the COSTS total.
export const TENANTS = [
  { id: 'tnt_aiwo', name: 'AIWO members', kind: 'Direct', cell: 'India · Mumbai', tenancy: 'Pooled · RLS', keys: 'Region key', members: 1180, budget: 70 },
  { id: 'tnt_northwind', name: 'Northwind Capital · Joyspan@Work', kind: 'Employer', cell: 'India · Mumbai', tenancy: 'Pooled · RLS', keys: 'Region key', members: 812, budget: 64 },
  { id: 'tnt_fairmont', name: 'Fairmont Mumbai', kind: 'Venue partner', cell: 'India · Mumbai', tenancy: 'Pooled · no PHI', keys: 'Region key', members: 0, budget: 0 },
  { id: 'tnt_house_chn', name: 'Joyspan House Chennai', kind: 'House', cell: 'India · Mumbai', tenancy: 'Pooled · RLS', keys: 'Region key', members: 140, budget: 75 },
  { id: 'tnt_star', name: 'Star Health', kind: 'Insurer', cell: 'India · Mumbai', tenancy: 'Bridge schema at J4', keys: 'Own key at J4', members: 0, budget: 0 },
]

export const AUDIT = [
  { at: '28 Jan 21:04:12', actor: 'Dr Sanjay Menon', role: 'clinician', action: 'read', resource: 'journal m_0142 (P0 context)', purpose: 'Crisis response', hash: '7e1a…c903' },
  { at: '28 Jan 20:51:40', actor: 'svc:erasure-worker', role: 'system', action: 'erase', resource: 'observations · 1 member', purpose: 'Rights request RQ-2291', hash: '4b0d…11fe' },
  { at: '28 Jan 19:30:02', actor: 'Kiran Desai', role: 'sre', action: 'jit.granted', resource: 'prod read · signals-ingest logs', purpose: 'INC-0412 Health Connect lag', hash: 'a93c…7d20' },
  { at: '28 Jan 18:12:55', actor: 'Rhea Kapoor', role: 'tenant_admin', action: 'read', resource: 'aggregate_view · Northwind Q4', purpose: 'Quarterly review', hash: '0f6e…a4b1' },
  { at: '28 Jan 16:44:09', actor: 'Priya Natarajan', role: 'coach', action: 'read', resource: 'term scores m_0001', purpose: 'Day 23 call', hash: 'c27b…5e98' },
  { at: '28 Jan 15:02:31', actor: 'Dr Lakshmi Raghavan', role: 'scientist', action: 'method.draft.edit', resource: 'method v1.1 · λ', purpose: 'Calibration', hash: '91d4…0c6a' },
  { at: '28 Jan 11:17:48', actor: 'svc:claims-gate', role: 'system', action: 'refuse', resource: 'copy · Lovecation hero', purpose: 'Refused word', hash: 'e5a0…3f72' },
]

export const JIT_REQUESTS = [
  { id: 'JIT-0388', who: 'Kiran Desai', role: 'SRE', scope: 'prod read · signals-ingest logs', duration: '2 h', reason: 'INC-0412 Health Connect lag on two Android OEMs', status: 'active' as const, approver: 'Neha Iyer · DPO', expires: '21:30' },
  { id: 'JIT-0389', who: 'Rohan Mehta', role: 'Backend', scope: 'prod read · ledger write path traces', duration: '1 h', reason: 'Ledger error budget spent; root-cause the retry storm', status: 'pending' as const, approver: '—', expires: '—' },
  { id: 'JIT-0390', who: 'Ananya Pillai', role: 'Data', scope: 'prod read · research registry schema', duration: '4 h', reason: 'India Joy Report suppression check', status: 'pending' as const, approver: '—', expires: '—' },
  { id: 'JIT-0384', who: 'Kiran Desai', role: 'SRE', scope: 'prod write · feature flags', duration: '30 m', reason: 'Kill switch drill', status: 'expired' as const, approver: 'Neha Iyer · DPO', expires: '27 Jan 16:40' },
]

export const SIGNAL_SOURCES = [
  { key: 'healthkit', name: 'HealthKit', path: 'Background delivery → device bridge → batch upload', members: 640, p95: 8, p95Series: [9, 8, 8, 7, 8, 9, 10, 9, 8, 7, 8, 8], batchesHr: 1840, errors: 0.002, status: 'ok' as const, note: 'Within SLO.' },
  { key: 'health_connect', name: 'Health Connect', path: 'Periodic sync (15 min) → device bridge', members: 410, p95: 14, p95Series: [12, 12, 13, 15, 18, 21, 19, 17, 15, 14, 14, 14], batchesHr: 1120, errors: 0.006, status: 'watch' as const, note: 'Two Android OEMs defer background work; INC-0412 open with JIT access.' },
  { key: 'terra', name: 'Terra webhooks', path: 'Oura · Garmin · Fitbit → signed webhook → idempotent batch', members: 520, p95: 4, p95Series: [4, 4, 5, 4, 4, 3, 4, 4, 5, 4, 4, 4], batchesHr: 2650, errors: 0.003, status: 'ok' as const, note: 'Signature failures 0 in 24 h; retries 0.3%.' },
  { key: 'labs', name: 'Lab pipeline', path: 'Partner lab → FHIR Observation → method carried', members: 212, p95: 95, p95Series: [90, 92, 95, 96, 94, 95, 97, 95, 94, 93, 95, 95], batchesHr: 14, errors: 0, status: 'ok' as const, note: 'Batch by design; not on the 15-minute SLO.' },
]

// deliveredAt = opened + elapsedH, for the member notice in each delivered job.
export const RIGHTS_JOBS: { id: string; kind: 'export' | 'erase' | 'withdraw'; opened: string; elapsedH: number; stores: number; done: number; status: 'running' | 'delivered'; deliveredAt?: string; note: string }[] = [
  { id: 'RQ-2291', kind: 'erase' as const, opened: '28 Jan 09:40', elapsedH: 11.5, stores: 7, done: 6, status: 'running' as const, note: 'Clinical records retained only where law requires; member told which.' },
  { id: 'RQ-2290', kind: 'export' as const, opened: '27 Jan 14:05', elapsedH: 31, stores: 9, done: 9, status: 'delivered' as const, deliveredAt: '28 Jan 21:05', note: 'JSON + FHIR bundle + PDFs; signed link, 72 h expiry.' },
  { id: 'RQ-2288', kind: 'withdraw' as const, opened: '27 Jan 10:12', elapsedH: 3.2, stores: 5, done: 5, status: 'delivered' as const, deliveredAt: '27 Jan 13:24', note: 'Cohort consent withdrawn; caches purged; consent.changed fanned out.' },
  { id: 'RQ-2286', kind: 'export' as const, opened: '26 Jan 18:30', elapsedH: 50.7, stores: 9, done: 8, status: 'running' as const, note: 'Waiting on PDF render of the Day-90 card.' },
  { id: 'RQ-2283', kind: 'erase' as const, opened: '25 Jan 08:55', elapsedH: 19.8, stores: 7, done: 7, status: 'delivered' as const, deliveredAt: '26 Jan 04:43', note: 'Verified by erasure worker per store.' },
]

// ─── Leadership ──────────────────────────────────────────────────────────

export const NORTH_STAR = {
  records: 453,
  spendCr: 1.55,
  quarter: 'Q3 FY27 · Oct–Dec 2026',
  prior: 2.1,
}

export const THREE_NUMBERS = [
  { label: 'People who took the Index', now: '1,180', check: '18,400 took the free Check', goal: '1 bn by 2036' },
  { label: 'People raising it every 90 days', now: '258', check: '57% of 453 re-measured raised their lowest term', goal: '100 M' },
  { label: 'Joyful years added, audited', now: '0', check: 'First independent audit at J4. Estimates stay in research.', goal: '100 M' },
]

// status of each SCOREBOARD row (same order) against the next gate.
export const SCOREBOARD_STATUS: { tone: 'ok' | 'watch' | 'info'; label: string }[] = [
  { tone: 'ok', label: 'J1 met' },
  { tone: 'ok', label: 'J1 met' },
  { tone: 'ok', label: 'Above falsifier' },
  { tone: 'ok', label: 'Above kill line' },
  { tone: 'ok', label: 'Rung R1 met' },
  { tone: 'watch', label: 'Above J3 line' },
  { tone: 'ok', label: 'Held' },
  { tone: 'ok', label: 'Held' },
]

export const REVENUE = [
  { fy: 'FY28', plus: 1.5, licensed: 0.5, fees: 0, total: 2, share: '2%', plusN: '3 k', licN: '5 k' },
  { fy: 'FY31', plus: 75, licensed: 60, fees: 15, total: 150, share: '15%', plusN: '150 k', licN: '850 k' },
  { fy: 'FY36', plus: 750, licensed: 800, fees: 150, total: 1700, share: '31%', plusN: '1.5 M', licN: '8 M' },
]

export const COST_CURVE = [
  { stage: 'Joycation', cost: 540000, label: '₹5.4 L' },
  { stage: '’Cation', cost: 280000, label: '₹2.8 L' },
  { stage: 'Sessions + OS', cost: 43000, label: '₹43 k' },
  { stage: 'Joy OS Plus', cost: 5700, label: '₹5.7 k' },
  { stage: 'Licensed OS', cost: 1000, label: '₹1 k' },
]

export const MOATS = [
  { n: '01', k: 'The unit', title: 'Own the measure', body: 'Whoever defines a category’s unit owns the category. The Index, its method and its versions live in Joy OS’s engine.' },
  { n: '02', k: 'The record', title: 'Own the longitudinal data', body: 'The only six-term, ninety-day, consented cohort, growing from 600 to 100,000. It cannot be bought or copied quickly.' },
  { n: '03', k: 'The standard', title: 'Own the interface', body: 'Publish the Index as an open FHIR guide and certify partners. The steward keeps the reference implementation.' },
  { n: '04', k: 'The habit', title: 'Own the ninety days', body: 'Joy OS is where the year happens: re-measure, circle, Practice. Leaving means losing your history and your circle.' },
  { n: '05', k: 'The places', title: 'Own the physical delivery', body: '’Cations, Houses, residences and the Family Joy Office: real rooms, real clinicians, real stays, all measured.' },
  { n: '06', k: 'The channels', title: 'Own the distribution', body: 'Insurers, employers and hospitals already hold millions of people. A licence reaches them at ₹1,000 a year.' },
  { n: '07', k: 'The trust', title: 'Own the right to ask', body: 'Physicians who sign, a Science Council that may dissent, results published up and down, privacy a family accepts.' },
]

export const FLYWHEEL = [
  { id: 'members', label: 'More members measured', body: 'The free Check and licences bring people to a first Index.' },
  { id: 'cohort', label: 'Bigger cohort record', body: 'Every consented re-measure adds a six-term, ninety-day record.' },
  { id: 'index', label: 'Better-validated Index', body: 'A larger cohort calibrates weights and λ in the next method version.' },
  { id: 'actions', label: 'Better next actions', body: 'The record teaches which actions move which term, for whom.' },
  { id: 'deltas', label: 'Bigger measured deltas', body: 'Better actions produce larger Day-90 deltas, published up and down.' },
  { id: 'pay', label: 'Insurers and employers pay', body: 'Deltas are what institutions buy: a validated outcome, not activity.' },
  { id: 'cost', label: 'Lower cost per member', body: 'Volume bends the cost curve, which brings in more members.' },
]

export const RISKS = [
  { risk: 'Execution: five architectures, zero shipped', level: 'HIGH', mitigation: 'Separate app on a shared core; J0 scope frozen 15 Nov; one roadmap owner.', trigger: 'J1 not on the App Store by 31 Mar 2027: cut scope to Today, Index, Ledger.', reading: 'TestFlight live; App Store review booked 10 Mar.', tone: 'ok' as const },
  { risk: 'The Index does not validate', level: 'HIGH', mitigation: 'Science Office funded; norms, reliability, validity on dates; v1.1 recalibration.', trigger: 'At 12 months the Index predicts nothing a single item cannot: rebuild weights.', reading: 'Month 3 of 12. Test–retest 0.84 (n = 212).', tone: 'ok' as const },
  { risk: 'Members do not come back at Day 90', level: 'HIGH', mitigation: 'Re-measure as the easiest act; circles; named people; the Day-60 conversation.', trigger: 'Re-score below 70% of a cohort: redesign the loop first.', reading: 'Re-score 74%. Sleepcation cohort 72%.', tone: 'ok' as const },
  { risk: 'Interventions do not move terms', level: 'MED', mitigation: 'Protocol per term; evidence-tagged action library; bandit learning from deltas.', trigger: '<50% improve their lowest term: publish and redesign (the falsifier).', reading: 'Overall 57%. Sleepcation 48%: published, redesign under way.', tone: 'watch' as const },
  { risk: 'Harm on a Suffering screen', level: 'MED', mitigation: 'No AI text on results; emergency intercept; P0 routing with SLA.', trigger: 'Any P0 missed: stop the feature and review within 24 h.', reading: '12 of 12 P0 reached by a person within SLA.', tone: 'ok' as const },
  { risk: 'Regulatory reclassification', level: 'MED', mitigation: 'Wellbeing measure; physician for anything diagnostic; counsel review.', trigger: 'Counsel advises a feature is a medical device: gate it behind a physician.', reading: 'explain_biomarker held behind physician sign-off.', tone: 'ok' as const },
  { risk: 'Data breach or DPDP failure', level: 'MED', mitigation: 'Encryption, audit, residency, least privilege, MASVS, pen tests.', trigger: 'A breach: notify per Rules; independent review before next release.', reading: 'Pen test 12 Jan: two lows, closed.', tone: 'ok' as const },
  { risk: 'LifeOS and Joy OS diverge', level: 'MED', mitigation: 'Shared core with contracts and owners; no copy of shared code.', trigger: 'A second consent or identity store appears: block the release.', reading: 'One consent store, one identity store.', tone: 'ok' as const },
  { risk: 'Cost per member too high at scale', level: 'MED', mitigation: 'Cost budget per service; coach ratio; on-device work; cheap Index v2.', trigger: '>₹1,500 per active member-year or WAU <40% at FY29.', reading: '₹3,420 today, in Milk. Infra + AI ₹68 vs ₹60.', tone: 'watch' as const },
  { risk: 'Name and mark conflicts', level: 'LOW', mitigation: 'Search “Joy OS” and “JoyOS” in software classes; file compound marks.', trigger: 'Conflict: launch as “AIWO Joy”.', reading: 'Filed in India; UAE, SG, UK, US in progress.', tone: 'ok' as const },
  { risk: 'Mission drift to engagement', level: 'MED', mitigation: 'North star is re-measured records; no streaks; objective counter first.', trigger: 'A feature raises minutes but moves no term: remove it.', reading: 'One feature under review: Practice audio autoplay.', tone: 'watch' as const },
]

export const DECISIONS = [
  { n: 1, decision: 'Joy OS as a separate app on a shared AIWO Platform Core, with LifeOS kept as the clinical app', rec: 'Adopt; amends AIWO 3.1 decision 7', owner: 'CEO · CTO', by: '15 Nov', status: 'signed' as const, on: '12 Nov 2026' },
  { n: 2, decision: 'Appoint a Head of Joy OS and fund the J0–J2 team of 15', rec: 'Hire or appoint now; interim from the LifeOS product lead', owner: 'CEO', by: '15 Nov', status: 'signed' as const, on: '14 Nov 2026' },
  { n: 3, decision: 'Freeze J0 scope: Index engine v1.0, events, circles, Health Connect, iOS beta', rec: 'Freeze; anything else goes on a dated J1 list', owner: 'CTO · Head of Joy OS', by: '15 Nov', status: 'signed' as const, on: '15 Nov 2026' },
  { n: 4, decision: 'Index method v1.0 in the engine; licences for Ikigai-9, ISI and others confirmed in writing', rec: 'Adopt; Legal to confirm each licence', owner: 'Science · Legal', by: '30 Nov', status: 'partial' as const, on: 'v1.0 signed; Ikigai-9 and ISI licences pending' },
  { n: 5, decision: 'Product principles (one action a day, it can go down, the member owns it, no streaks) as release criteria', rec: 'Adopt as written on page 08', owner: 'Head of Joy OS · CMO', by: '15 Nov', status: 'signed' as const, on: '13 Nov 2026' },
  { n: 6, decision: 'Stack and residency: TypeScript, Expo, PostgreSQL, India region primary, Platform Core extraction plan', rec: 'Adopt as in the architecture document', owner: 'CTO', by: '30 Nov', status: 'signed' as const, on: '28 Nov 2026' },
  { n: 7, decision: 'Licensing first: Star Health as the first institutional tenant at J3', rec: 'Open the conversation in Q4 FY27', owner: 'CEO · Institutional', by: 'Mar 2027', status: 'open' as const, on: 'Second meeting 11 Feb 2027' },
  { n: 8, decision: 'Publish the Index as an open FHIR guide after validation', rec: 'Approve in principle; publish at J4', owner: 'Science · CTO', by: 'FY28', status: 'principle' as const, on: 'Approved in principle 15 Nov 2026' },
]

// ─── Additions: rights-request stores, licences, tenant admin per kind, trends ───

/** The stores each rights job must reach, in the order the workers run. */
export const RIGHTS_STORES = {
  export: ['Identity and consent', 'Index scores and item responses', 'Ledger', 'Journals', 'Signals and observations', 'Care notes', 'Messages', 'Audit slice', 'PDFs · Day-90 card render'],
  erase: ['Identity', 'Index scores and items', 'Ledger', 'Journals', 'Observations', 'Messages', 'Search index purge'],
  withdraw: ['Consent store', 'Research registry', 'Cohort cache', 'Analytics', 'Partner fan-out'],
} as const

/** Licence detail for every instrument in the registry (Decision 4). */
export const INSTRUMENT_LICENCE: Record<string, { holder: string; terms: string; langs: { lang: string; state: 'Validated' | 'In review' | 'Not started' }[] }> = {
  'Ikigai-9': { holder: 'Prof. Kumano, author', terms: 'Written permission for commercial use requested 4 Nov 2026; research use granted.', langs: [{ lang: 'English', state: 'Validated' }, { lang: 'Tamil', state: 'In review' }, { lang: 'Hindi', state: 'In review' }] },
  'MLQ-P': { holder: 'M. F. Steger', terms: 'Free for research; commercial use confirmed by email 18 Oct 2026.', langs: [{ lang: 'English', state: 'Validated' }, { lang: 'Tamil', state: 'Validated' }, { lang: 'Hindi', state: 'Validated' }] },
  'UCLA-3': { holder: 'Public domain', terms: 'No permission needed; citation kept with every score.', langs: [{ lang: 'English', state: 'Validated' }, { lang: 'Tamil', state: 'Validated' }, { lang: 'Hindi', state: 'Validated' }] },
  'LSNS-6': { holder: 'J. Lubben', terms: 'Terms of use for a commercial app to be confirmed by Legal.', langs: [{ lang: 'English', state: 'Validated' }, { lang: 'Tamil', state: 'Not started' }, { lang: 'Hindi', state: 'Not started' }] },
  'CSI-4': { holder: 'Funk and Rogge', terms: 'Free with attribution.', langs: [{ lang: 'English', state: 'Validated' }, { lang: 'Tamil', state: 'Not started' }, { lang: 'Hindi', state: 'Validated' }] },
  BPNSFS: { holder: 'Self-Determination Theory centre', terms: 'Research licence held; commercial terms to confirm.', langs: [{ lang: 'English', state: 'Validated' }, { lang: 'Tamil', state: 'Not started' }, { lang: 'Hindi', state: 'Not started' }] },
  'CFPB FWB': { holder: 'Public domain', terms: 'US federal work; no permission needed.', langs: [{ lang: 'English', state: 'Validated' }, { lang: 'Tamil', state: 'Validated' }, { lang: 'Hindi', state: 'Validated' }] },
  SPANE: { holder: 'E. Diener', terms: 'Free with attribution.', langs: [{ lang: 'English', state: 'Validated' }, { lang: 'Tamil', state: 'Validated' }, { lang: 'Hindi', state: 'Validated' }] },
  Savouring: { holder: 'F. B. Bryant', terms: 'Terms to confirm for commercial use.', langs: [{ lang: 'English', state: 'Validated' }, { lang: 'Tamil', state: 'Not started' }, { lang: 'Hindi', state: 'Not started' }] },
  'PHQ-4': { holder: 'Public domain', terms: 'No permission needed.', langs: [{ lang: 'English', state: 'Validated' }, { lang: 'Tamil', state: 'Validated' }, { lang: 'Hindi', state: 'Validated' }] },
  ISI: { holder: 'C. M. Morin, via Mapi Research Trust', terms: 'Commercial licence required; quote received 9 Jan 2027.', langs: [{ lang: 'English', state: 'Validated' }, { lang: 'Tamil', state: 'Not started' }, { lang: 'Hindi', state: 'Not started' }] },
  'PSS-4': { holder: 'S. Cohen', terms: 'Free for non-commercial use; commercial terms to confirm.', langs: [{ lang: 'English', state: 'Validated' }, { lang: 'Tamil', state: 'Not started' }, { lang: 'Hindi', state: 'Validated' }] },
  'LE8 self-report': { holder: 'American Heart Association', terms: 'Free with attribution.', langs: [{ lang: 'English', state: 'Validated' }, { lang: 'Tamil', state: 'Validated' }, { lang: 'Hindi', state: 'Validated' }] },
  'Capacity battery': { holder: 'AIWO protocol', terms: 'Owned by AIWO.', langs: [{ lang: 'English', state: 'Validated' }, { lang: 'Tamil', state: 'Validated' }, { lang: 'Hindi', state: 'Validated' }] },
}

/** The Science Council's response to the India Joy Report draft (specimen). */
export const COUNCIL_REVIEW = {
  chair: 'Prof. Vikram Patel-Rao · Chair, Science Council',
  verdict: 'Approved for publication, with one dissent printed in full.',
  dissent: 'Dr Farah Siddiqui: the Delhi NCR Burden figure rests on 121 people; print its interval beside the mean, not in the appendix.',
}

export type TenantKind = 'employer' | 'insurer'
export type AdminRole = 'Tenant admin' | 'Read-only analyst' | 'Routing volume only'

export const TENANT_KIND = {
  employer: {
    short: 'Northwind',
    group: 50,
    domain: 'northwindcapital.in',
    issuer: 'https://login.northwindcapital.in/oauth2/default',
    clientId: '0oa8nw-joyos-prod',
    metadata: 'https://login.northwindcapital.in/app/joyos/sso/saml/metadata',
    tenantId: 'tnt_northwind',
    me: 'Rhea Kapoor',
    admins: [
      { name: 'Rhea Kapoor', email: 'rhea.kapoor@northwindcapital.in', role: 'Tenant admin' as AdminRole, since: 'Oct 2026' },
      { name: 'Vikas Shah', email: 'vikas.shah@northwindcapital.in', role: 'Read-only analyst' as AdminRole, since: 'Nov 2026' },
      { name: 'Northwind EAP desk', email: 'eap@northwindcapital.in', role: 'Routing volume only' as AdminRole, since: 'Oct 2026' },
    ],
    waves: INVITE_WAVES,
    audiences: [{ value: 'not-enrolled', label: 'Eligible, not yet enrolled', n: 0 }, { value: 'new-joiners', label: 'New joiners since October', n: 120 }],
    fileName: 'northwind-eligibility-2027-01.csv',
    file: { rows: '1,252', matched: '1,240', dupes: '9', invalid: '3', held: 12, from: '1 Feb 2027', eligible: '1,240' },
    columns: ELIGIBILITY_COLUMNS,
  },
  insurer: {
    short: 'Star Health',
    group: 10,
    domain: 'starhealth.in',
    issuer: 'https://login.microsoftonline.com/starhealth.in/v2.0',
    clientId: 'b41c-joyos-pilot',
    metadata: 'https://sts.starhealth.in/federationmetadata/2007-06/federationmetadata.xml',
    tenantId: 'tnt_star',
    me: 'Kavitha Rao',
    admins: [
      { name: 'Kavitha Rao', email: 'kavitha.rao@starhealth.in', role: 'Tenant admin' as AdminRole, since: 'Dec 2026' },
      { name: 'Outcomes analytics desk', email: 'outcomes@starhealth.in', role: 'Read-only analyst' as AdminRole, since: 'Jan 2027' },
    ],
    waves: [
      { id: 'w1', name: 'Wave 1 · Pilot policyholders, Chennai and Bengaluru', sent: '2026-12-02', invited: 3200, opened: 2210, enrolled: 1840 },
      { id: 'w2', name: 'Wave 2 · Pilot policyholders, Mumbai and Pune', sent: '2026-12-16', invited: 3600, opened: 2480, enrolled: 2140 },
      { id: 'w3', name: 'Wave 3 · Gentle reminder, all not yet enrolled', sent: '2027-01-08', invited: 2820, opened: 1290, enrolled: 1020 },
    ],
    audiences: [{ value: 'not-enrolled', label: 'Pilot policyholders, not yet enrolled', n: 0 }, { value: 'renewals', label: 'Renewed in February, opted in', n: 640 }],
    fileName: 'starhealth-pilot-eligibility-2027-01.csv',
    file: { rows: '5,118', matched: '5,000', dupes: '82', invalid: '36', held: 118, from: '1 Feb 2027', eligible: '5,000' },
    columns: [
      { name: 'policy_ref', note: 'Your hashed policy reference. Not a name or policy number.' },
      { name: 'email', note: 'Used once, for the invitation.' },
      { name: 'plan', note: 'Plan family only, for aggregates of ten or more.' },
      { name: 'city', note: 'City; never an address.' },
      { name: 'eligible_from', note: 'ISO date.' },
    ],
  },
}

export const INSURER_PROFILE = {
  id: 'tnt_star',
  legal: 'Star Health and Allied Insurance Co. Ltd',
  edition: 'Joy OS policy benefit · outcome-linked pilot',
  stage: 'Pilot cohort in conversation · J3',
  region: 'India · Mumbai cell (pooled)',
  recovery: 'Hyderabad',
  keys: 'Pooled region key · own key and bridge schema at J4',
}

export const INSURER_FLAGS = [
  { key: 'clinician_offer', label: 'Clinician offer when Burden rises', state: 'On', on: true, note: 'AIWO offers a named clinician; the insurer sees the count of offers only.' },
  { key: 'whatsapp_check', label: 'Joyspan Check on WhatsApp', state: 'On', on: true, note: 'Free Check; bands, never a number.' },
  { key: 'circles', label: 'Circles for policyholders', state: 'From J3', on: false, note: 'Not yet offered; the main reason re-measure trails direct members.' },
  { key: 'underwriting_use', label: 'Use in underwriting, pricing or claims', state: 'Never', on: false, note: 'Forbidden by contract. Not a setting.' },
  { key: 'individual_export', label: 'Individual-level export', state: 'Never', on: false, note: 'Insurers receive aggregates of ten or more only.' },
  { key: 'ease_detail', label: 'Ease screens, journals or any term below aggregate', state: 'Never', on: false, note: 'Architecture p.24: tenants never receive these.' },
]

/**
 * The last four quarters of the north star and the Day-90 re-measure rate (specimen).
 * Method v1.0 was published on 22 Oct 2026, so only Q3 FY27 is a v1.0 quarter. The three earlier points are
 * ’Cation suite-cohort pilots measured on the pre-v1.0 pilot instrument: shown, marked, and not like for like.
 */
export const NS_TREND = [
  { q: 'Q4 FY26', perLakh: 1.2, remeasure: 0.66, pilot: true },
  { q: 'Q1 FY27', perLakh: 1.6, remeasure: 0.69, pilot: true },
  { q: 'Q2 FY27', perLakh: 2.1, remeasure: 0.71, pilot: true },
  { q: 'Q3 FY27', perLakh: 2.9, remeasure: 0.74, pilot: false },
]

// ─── Evaluation plane · traces (specimen) ────────────────────────────────
// One row per AI call through the VIVA gateway. A trace stores the model, the prompt version, the tool, a hash of the
// inputs and who reviewed it; never the member's words or health values. Output excerpts are the model's own text,
// redacted of anything a member supplied, and shown in English for review (TA/HI outputs carry a reviewer's gloss).

export type TraceGuard = 'pass' | 'rewritten' | 'held' | 'blocked' | 'intercepted'
export const TRACE_GUARD: Record<TraceGuard, { label: string; note: string }> = {
  pass: { label: 'Passed', note: 'Input and output guards passed; the answer was served as written.' },
  rewritten: { label: 'Rewritten', note: 'The output guard replaced a refused word or a claim with sealed copy before serving.' },
  held: { label: 'Held for review', note: 'This language is below the eval floor for this tool, so the answer waited in the physician queue before serving.' },
  blocked: { label: 'Blocked', note: 'The output guard discarded the model text; the member got the rules-based version and sealed copy.' },
  intercepted: { label: 'Crisis intercept', note: 'Crisis language was found before any model ran. No model call was made; the member was routed to a person and Tele-MANAS 14416.' },
}
export const TRACE_FINDINGS = ['No issue', 'Tone, too brisk', 'Claims rewrite', 'Wrong term named', 'Safety'] as const
export type TraceFinding = (typeof TRACE_FINDINGS)[number]
export const TRACE_REVIEWERS = ['Dr Sanjay Menon · psychologist', 'Dr Lakshmi Raghavan · psychologist', 'Dr Arvind Natesan · physician'] as const

const TRACE_TOOL: Record<string, { model: string; prompt: string; excerpt: string; sealed?: string }> = {
  index_explainer: { model: 'viva-large · 2026-01', prompt: 'v14', excerpt: 'Your Index sits in the Steady band. Freedom is the lowest term this quarter, so this week’s actions lean there.', sealed: 'Your Index is in the Steady band. Your lowest term is shown below.' },
  next_best_action: { model: 'viva-small · 2026-01', prompt: 'v22', excerpt: 'Chosen because Recovery has slipped for three nights and this takes ten minutes before bed.', sealed: 'Today’s action was chosen from your lowest term.' },
  ikigai_coach: { model: 'viva-large · 2026-01', prompt: 'v9', excerpt: 'You named teaching twice this week. What would tomorrow look like with an hour of it?', sealed: 'What is one thing you would like tomorrow to hold?' },
  couples_prompt: { model: 'viva-large · 2026-01', prompt: 'v7', excerpt: 'Ask each other: what is one small thing that made this week feel shared?', sealed: 'Take turns: one thing that felt shared this week.' },
  second_arrow_reflection: { model: 'viva-large · 2026-01', prompt: 'v11', excerpt: 'It sounds like the meeting stung, and then the replaying stung again. Both are there; you do not have to fix either tonight.', sealed: 'Thank you for writing this down. It is saved, and only you can see it.' },
  ledger_weekly_story: { model: 'viva-small · 2026-01', prompt: 'v6', excerpt: 'Most of this week’s joy came from people: two dinners and a long call. Pleasure rose with it.', sealed: 'Here are this week’s entries, grouped by term.' },
  time_audit_summary: { model: 'viva-small · 2026-01', prompt: 'v5', excerpt: 'About a third of your waking week went to commuting and email. The hours you chose for yourself were mostly on Sunday.', sealed: 'Here is your week, grouped by how you spent it.' },
  practice_companion: { model: 'viva-large · 2026-01', prompt: 'v12', excerpt: 'Week 3 asks for one unhurried meal a day. Chapter 4 suggests starting with breakfast, phone in another room.', sealed: 'This week’s practice and its chapter are below.' },
  coach_digest: { model: 'viva-large · 2026-01', prompt: 'v4', excerpt: 'Quarter in brief: Index up one band; Recovery steady; two missed sessions in week 6, both rescheduled by the member.' },
}

// [id, time, tool, lang, tenant, guard, reviewer index or -1, finding index or -1, latency ms, tokens in, tokens out]
type TraceRow = [string, string, string, 'EN' | 'TA' | 'HI', string, TraceGuard, number, number, number, number, number]
const TRACE_ROWS: TraceRow[] = [
  ['tr_9f3a21', '28 Jan 21:06:41', 'next_best_action', 'EN', 'tnt_aiwo', 'pass', -1, -1, 412, 860, 64],
  ['tr_9f3a0c', '28 Jan 21:05:58', 'second_arrow_reflection', 'TA', 'tnt_aiwo', 'held', 1, 0, 1840, 1210, 142],
  ['tr_9f39e7', '28 Jan 21:05:12', 'index_explainer', 'HI', 'tnt_northwind', 'pass', 2, 0, 690, 1040, 96],
  ['tr_9f39b2', '28 Jan 21:04:30', 'second_arrow_reflection', 'EN', 'tnt_aiwo', 'intercepted', 0, 0, 38, 0, 0],
  ['tr_9f3988', '28 Jan 21:03:47', 'ledger_weekly_story', 'EN', 'tnt_house_chn', 'pass', -1, -1, 380, 720, 58],
  ['tr_9f3951', '28 Jan 21:02:19', 'practice_companion', 'TA', 'tnt_aiwo', 'rewritten', 1, 2, 1120, 1480, 118],
  ['tr_9f3920', '28 Jan 21:01:03', 'next_best_action', 'HI', 'tnt_northwind', 'pass', -1, -1, 455, 880, 61],
  ['tr_9f38f6', '28 Jan 20:59:40', 'couples_prompt', 'EN', 'tnt_aiwo', 'blocked', 0, 0, 920, 940, 0],
  ['tr_9f38c1', '28 Jan 20:58:14', 'ikigai_coach', 'TA', 'tnt_house_chn', 'pass', 1, 1, 840, 1160, 88],
  ['tr_9f3897', '28 Jan 20:56:52', 'time_audit_summary', 'EN', 'tnt_northwind', 'rewritten', -1, -1, 510, 990, 77],
  ['tr_9f3862', '28 Jan 20:55:31', 'index_explainer', 'EN', 'tnt_aiwo', 'pass', -1, -1, 640, 1020, 92],
  ['tr_9f3830', '28 Jan 20:54:07', 'second_arrow_reflection', 'HI', 'tnt_northwind', 'pass', 0, 1, 1010, 1190, 131],
  ['tr_9f37fb', '28 Jan 20:52:48', 'practice_companion', 'EN', 'tnt_house_chn', 'pass', -1, -1, 980, 1520, 124],
  ['tr_9f37c4', '28 Jan 20:51:22', 'coach_digest', 'EN', 'tnt_aiwo', 'pass', 2, 0, 2310, 3880, 210],
  ['tr_9f3790', '28 Jan 20:49:55', 'next_best_action', 'TA', 'tnt_aiwo', 'pass', -1, -1, 470, 900, 66],
  ['tr_9f375a', '28 Jan 20:48:30', 'ledger_weekly_story', 'HI', 'tnt_northwind', 'rewritten', 2, 3, 420, 760, 60],
  ['tr_9f3726', '28 Jan 20:47:02', 'practice_companion', 'HI', 'tnt_aiwo', 'blocked', -1, -1, 1060, 1500, 0],
  ['tr_9f36f1', '28 Jan 20:45:41', 'ikigai_coach', 'EN', 'tnt_northwind', 'pass', -1, -1, 790, 1100, 84],
  ['tr_9f36bd', '28 Jan 20:44:13', 'second_arrow_reflection', 'TA', 'tnt_house_chn', 'held', -1, -1, 1760, 1230, 138],
  ['tr_9f3688', '28 Jan 20:42:50', 'index_explainer', 'TA', 'tnt_aiwo', 'pass', -1, -1, 710, 1060, 98],
  ['tr_9f3652', '28 Jan 20:41:26', 'couples_prompt', 'TA', 'tnt_aiwo', 'pass', 1, 0, 860, 920, 54],
  ['tr_9f361e', '28 Jan 20:39:58', 'time_audit_summary', 'HI', 'tnt_aiwo', 'pass', -1, -1, 530, 1010, 79],
  ['tr_9f35e9', '28 Jan 20:38:34', 'next_best_action', 'EN', 'tnt_house_chn', 'pass', -1, -1, 398, 850, 62],
  ['tr_9f35b3', '28 Jan 20:37:09', 'ikigai_coach', 'HI', 'tnt_northwind', 'intercepted', 0, 0, 41, 0, 0],
]

const hex = (seed: string, salt: number) => {
  let h = 2166136261 ^ salt
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return (h >>> 0).toString(16).padStart(8, '0')
}

export const TRACES = TRACE_ROWS.map(([id, at, tool, lang, tenant, guard, rv, fd, latency, tokensIn, tokensOut]) => {
  const t = TRACE_TOOL[tool]
  const intercepted = guard === 'intercepted'
  return {
    id,
    at,
    tool,
    lang,
    tenant,
    guard,
    model: intercepted ? '—' : t.model,
    prompt: intercepted ? '—' : `${tool}@${t.prompt}`,
    inputsHash: `sha256:${hex(id, 1)}${hex(id, 2)}…${hex(id, 3).slice(0, 4)}`,
    reviewer: rv >= 0 ? (TRACE_REVIEWERS[rv] as string) : null,
    finding: fd >= 0 ? (TRACE_FINDINGS[fd] as TraceFinding) : null,
    latency,
    tokensIn,
    tokensOut,
    output: intercepted ? 'No model text. Sealed crisis copy shown, with a person and Tele-MANAS 14416.' : guard === 'blocked' ? t.sealed ?? t.excerpt : t.excerpt,
    discarded: guard === 'blocked' ? t.excerpt : undefined,
  }
})
export type Trace = (typeof TRACES)[number]

// ─── Tenant admin · aggregate filters (specimen) ─────────────────────────
// GET /partner/v1/aggregates?cohort=&term=&period= (Architecture p.22). Cohorts are invitation waves; the three wave
// cohorts sum to the Cycle 1 totals (enrolled 812, measured 655, re-measured 465), and their department cells sum to the
// tenant's department table. Any cohort or cell under the employer threshold (50) is suppressed, never shown smaller,
// and publishedDepartments below adds complementary suppression so no hidden cell can be recovered by subtraction.

export type AggPeriod = 'd0' | 'd90' | 'change'
export type AggCohortKey = 'all' | 'wave-1' | 'wave-2' | 'wave-3' | 'joiners'
type AggTerm = { key: TermKey; d0: number; d90: number }
export type AggCohort = {
  value: AggCohortKey
  label: string
  note: string
  invited: number | null
  enrolled: number
  measured: number
  remeasured: number
  improvedLowest: number
  termMeans: AggTerm[]
  departments: { name: string; n: number; ji: number | null; delta: number | null }[]
}
const tm = (h: [number, number], p: [number, number], r: [number, number], f: [number, number], d: [number, number], b: [number, number]): AggTerm[] =>
  ([['H', h], ['P', p], ['R', r], ['F', f], ['D', d], ['B', b]] as [TermKey, [number, number]][]).map(([key, [d0, d90]]) => ({ key, d0, d90 }))

export const AGG_COHORTS: AggCohort[] = [
  {
    value: 'all', label: 'Cycle 1 · everyone enrolled', note: 'All three invitation waves, Day 0 on 23 Oct 2026.', invited: null, enrolled: 812, measured: 655, remeasured: 465, improvedLowest: 0.56,
    termMeans: tm([63, 66], [61, 64], [58, 62], [49, 54], [55, 59], [36, 31]),
    departments: [
      { name: 'Engineering', n: 140, ji: 53, delta: 5 }, { name: 'Sales', n: 104, ji: 50, delta: 6 }, { name: 'Operations', n: 86, ji: 54, delta: 4 },
      { name: 'Finance', n: 58, ji: 51, delta: 3 }, { name: 'People & Legal', n: 52, ji: 55, delta: 6 }, { name: 'Leadership', n: 25, ji: null, delta: null },
    ],
  },
  {
    value: 'wave-1', label: 'Wave 1 cohort · Engineering and Operations', note: 'Invited 7 Oct 2026.', invited: 420, enrolled: 318, measured: 262, remeasured: 194, improvedLowest: 0.58,
    termMeans: tm([65, 68], [60, 63], [57, 61], [51, 56], [54, 58], [35, 30]),
    departments: [{ name: 'Engineering', n: 112, ji: 54, delta: 5 }, { name: 'Operations', n: 70, ji: 55, delta: 4 }, { name: 'Leadership', n: 12, ji: null, delta: null }],
  },
  {
    value: 'wave-2', label: 'Wave 2 cohort · Sales, Finance, People & Legal', note: 'Invited 14 Oct 2026.', invited: 480, enrolled: 341, measured: 276, remeasured: 196, improvedLowest: 0.55,
    termMeans: tm([62, 65], [62, 65], [59, 63], [47, 52], [56, 60], [37, 32]),
    departments: [{ name: 'Sales', n: 92, ji: 50, delta: 6 }, { name: 'Finance', n: 52, ji: 51, delta: 3 }, { name: 'People & Legal', n: 44, ji: null, delta: null }, { name: 'Leadership', n: 8, ji: null, delta: null }],
  },
  {
    value: 'wave-3', label: 'Wave 3 cohort · the one reminder', note: 'Invited 19 Oct 2026. Large enough to report as a cohort; every department inside it is under fifty.', invited: 241, enrolled: 153, measured: 117, remeasured: 75, improvedLowest: 0.52,
    termMeans: tm([61, 63], [60, 62], [57, 60], [48, 52], [54, 57], [38, 33]),
    departments: [
      { name: 'Engineering', n: 28, ji: null, delta: null }, { name: 'Sales', n: 12, ji: null, delta: null }, { name: 'Operations', n: 16, ji: null, delta: null },
      { name: 'Finance', n: 6, ji: null, delta: null }, { name: 'People & Legal', n: 8, ji: null, delta: null }, { name: 'Leadership', n: 5, ji: null, delta: null },
    ],
  },
  {
    value: 'joiners', label: 'New joiners · Cycle 2', note: 'Enrolled since November; Day 0 on 1 Feb 2027. Under fifty, so nothing is reported yet.', invited: 120, enrolled: 34, measured: 0, remeasured: 0, improvedLowest: 0,
    termMeans: [], departments: [],
  },
]

// ─── Disclosure control for the department table ─────────────────────────
// A threshold on each cell is not enough once cohorts can be filtered: every published cell is also a term in two sums
// an employer can see. (1) Across cohorts: a department's tenant cell equals the sum of its wave cells, so publishing
// Engineering for everyone (140) and for wave 1 (112) gives away wave 3 (28) by subtraction. (2) Within a cohort: the
// re-measured total equals the sum of its department cells, so publishing every department but one gives that one away.
// Primary suppression hides every cell under the group minimum. Complementary suppression then hides the smallest
// published cell in any sum whose hidden part would come to more than nothing but less than the minimum, and repeats
// until nothing changes. Whatever can still be derived is a union of fifty or more.

export type DeptStatus = 'shown' | 'small' | 'complement'
export type PublishedDept = { name: string; n: number; ji: number | null; delta: number | null; status: DeptStatus }

const WAVE_KEYS: AggCohortKey[] = ['wave-1', 'wave-2', 'wave-3']

function disclosureControl(minGroup: number): Map<AggCohortKey, PublishedDept[]> {
  const out = new Map<AggCohortKey, PublishedDept[]>(
    AGG_COHORTS.map((c) => [c.value, c.departments.map((d) => ({ ...d, status: d.n < minGroup || d.ji === null || d.delta === null ? 'small' : 'shown' }))]),
  )
  const hiddenSum = (cells: PublishedDept[]) => cells.reduce((s, d) => s + (d.status === 'shown' ? 0 : d.n), 0)
  const unsafe = (cells: PublishedDept[]) => {
    const h = hiddenSum(cells)
    return h > 0 && h < minGroup
  }
  const hideSmallest = (cells: PublishedDept[]) => {
    const pick = cells.filter((d) => d.status === 'shown').sort((a, b) => a.n - b.n)[0]
    if (pick) pick.status = 'complement'
    return !!pick
  }
  const names = [...new Set(AGG_COHORTS.flatMap((c) => c.departments.map((d) => d.name)))]
  for (let changed = true, guard = 0; changed && guard < 50; guard++) {
    changed = false
    // (1) Across cohorts: tenant cell = sum of the wave cells. While the tenant cell is published, the hidden wave cells
    // add up to a known number, which must be zero or a group of fifty or more.
    for (const name of names) {
      const whole = out.get('all')?.find((d) => d.name === name)
      if (!whole || whole.status !== 'shown') continue
      const waves = WAVE_KEYS.flatMap((k) => out.get(k)?.filter((d) => d.name === name) ?? [])
      while (unsafe(waves) && hideSmallest(waves)) changed = true
    }
    // (2) Within a cohort: re-measured total = sum of its department cells.
    for (const cells of out.values()) {
      while (unsafe(cells) && hideSmallest(cells)) changed = true
    }
  }
  return out
}

/** Department cells for one cohort after primary and complementary suppression. */
export function publishedDepartments(cohort: AggCohortKey, minGroup: number): PublishedDept[] {
  return disclosureControl(minGroup).get(cohort) ?? []
}

export const AGG_PERIODS: { value: AggPeriod; label: string }[] = [
  { value: 'change', label: 'Day 0 → Day 90' },
  { value: 'd0', label: 'Day 0 · 23 Oct 2026' },
  { value: 'd90', label: 'Day 90 · 21 Jan 2027' },
]

// ─── Tenant admin · settings (specimen) ──────────────────────────────────
// Architecture p.27: features are tagged wellbeing or clinical; clinical features need a physician in the loop and are
// disabled for tenants and regions without a licensed clinical partner. Safety routing is never a clinical feature.

export const CLINICAL_FEATURES = [
  { key: 'clinical_grade', label: 'Clinical-grade Index and physician-signed Day-90 card', note: 'A physician reviews and signs the re-measure.' },
  { key: 'biomarker_explainer', label: 'Biomarker explanations (explain_biomarker)', note: 'Plain-word lab values, signed by a physician.' },
  { key: 'lab_panels', label: 'Partner lab panels and the biomarker vault', note: 'Structured results through the lab pipeline.' },
  { key: 'clinician_review', label: 'Clinician review and call on a P1 screen', note: 'PHQ-4, ISI or PSS-4 above the Medical Director’s threshold.' },
]
export const CLINICAL_PARTNER = {
  employer: { partner: null as string | null, note: 'Northwind’s contract is wellbeing only. Ease flags route to the Northwind EAP; no licensed clinical partner is named for this tenant.' },
  insurer: { partner: null as string | null, note: 'A licensed clinical partner is part of the J3 pilot terms still in conversation (Decision 7). Until it is signed, clinical features stay off for policyholders.' },
}

export const API_SCOPES = [
  { key: 'eligibility:write', label: 'POST /partner/v1/eligibility', note: 'Send the eligibility file. No health data.' },
  { key: 'aggregates:read', label: 'GET /partner/v1/aggregates', note: 'Cohort, term and period aggregates, k-suppressed.' },
  { key: 'invitations:write', label: 'POST /partner/v1/invitations', note: 'Schedule invitation waves.' },
] as const
export type ApiScope = (typeof API_SCOPES)[number]['key']
export const WEBHOOK_EVENTS = [
  { key: 'enrolment.created', note: 'Counts only: a person enrolled, with no name or ID, batched hourly into groups.' },
  { key: 'aggregate.published', note: 'A new aggregate or quarterly report is ready to fetch.' },
] as const
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]['key']
export type ApiKey = { id: string; name: string; env: 'sandbox' | 'production'; scopes: ApiScope[]; created: string; lastUsed: string | null; revoked?: string }
export type Webhook = { id: string; url: string; events: WebhookEvent[]; created: string; status: 'active' | 'revoked'; deliveries: { at: string; event: WebhookEvent; code: number; ms: number }[] }

export const TENANT_API: Record<TenantKind, { keys: ApiKey[]; hooks: Webhook[] }> = {
  employer: {
    keys: [
      { id: 'cli_nw_prod_7f2a', name: 'Workday eligibility sync', env: 'production', scopes: ['eligibility:write'], created: '12 Oct 2026', lastUsed: '28 Jan 2027 06:00' },
      { id: 'cli_nw_prod_31c9', name: 'People analytics dashboard', env: 'production', scopes: ['aggregates:read'], created: '30 Oct 2026', lastUsed: '27 Jan 2027 18:12' },
      { id: 'cli_nw_sbx_0d44', name: 'Sandbox testing', env: 'sandbox', scopes: ['eligibility:write', 'aggregates:read', 'invitations:write'], created: '5 Oct 2026', lastUsed: '9 Jan 2027 11:40' },
    ],
    hooks: [
      { id: 'wh_nw_01', url: 'https://hooks.northwindcapital.in/joyos/aggregates', events: ['aggregate.published'], created: '30 Oct 2026', status: 'active', deliveries: [{ at: '22 Jan 2027 09:02', event: 'aggregate.published', code: 200, ms: 182 }, { at: '28 Oct 2026 09:01', event: 'aggregate.published', code: 200, ms: 240 }] },
    ],
  },
  insurer: {
    keys: [{ id: 'cli_sh_sbx_a61e', name: 'Pilot integration · sandbox', env: 'sandbox', scopes: ['eligibility:write', 'aggregates:read'], created: '18 Nov 2026', lastUsed: '26 Jan 2027 15:30' }],
    hooks: [],
  },
}

// ─── Control plane · on-call rota (specimen) ─────────────────────────────
// Architecture p.27: on-call rota in the control plane; escalation if unacknowledged; every alert closed with an outcome.
// The week runs from the 09:00 IST handover on Thursday 28 Jan 2027.

export type RotaKey = 'clinical' | 'sre' | 'privacy'
export const ROTA_DAYS = ['Thu 28', 'Fri 29', 'Sat 30', 'Sun 31', 'Mon 1', 'Tue 2', 'Wed 3'] as const
export const ROTAS: { key: RotaKey; name: string; covers: string; pool: string[]; primary: string[]; secondary: string[]; chain: { who: string; ackMin: number }[] }[] = [
  {
    key: 'clinical', name: 'Clinical on call', covers: 'P0 crisis and P1 screens: a named person within minutes',
    pool: ['Dr Sanjay Menon · psychologist', 'Dr Lakshmi Raghavan · psychologist', 'Dr Meera Iyer · physician'],
    primary: ['Dr Sanjay Menon · psychologist', 'Dr Sanjay Menon · psychologist', 'Dr Lakshmi Raghavan · psychologist', 'Dr Lakshmi Raghavan · psychologist', 'Dr Sanjay Menon · psychologist', 'Dr Lakshmi Raghavan · psychologist', 'Dr Sanjay Menon · psychologist'],
    secondary: ['Dr Meera Iyer · physician', 'Dr Lakshmi Raghavan · psychologist', 'Dr Meera Iyer · physician', 'Dr Sanjay Menon · psychologist', 'Dr Meera Iyer · physician', 'Dr Meera Iyer · physician', 'Dr Lakshmi Raghavan · psychologist'],
    chain: [{ who: 'Primary', ackMin: 3 }, { who: 'Secondary', ackMin: 3 }, { who: 'Dr Arvind Natesan · Medical Director', ackMin: 5 }],
  },
  {
    key: 'sre', name: 'SRE on call', covers: 'SLO burn, ingest lag, stalled rights jobs, kill switches',
    pool: ['Kiran Desai · SRE', 'Rohan Mehta · Backend', 'Ishaan Kulkarni · SRE'],
    primary: ['Kiran Desai · SRE', 'Kiran Desai · SRE', 'Kiran Desai · SRE', 'Ishaan Kulkarni · SRE', 'Ishaan Kulkarni · SRE', 'Ishaan Kulkarni · SRE', 'Ishaan Kulkarni · SRE'],
    secondary: ['Rohan Mehta · Backend', 'Rohan Mehta · Backend', 'Ishaan Kulkarni · SRE', 'Kiran Desai · SRE', 'Rohan Mehta · Backend', 'Rohan Mehta · Backend', 'Kiran Desai · SRE'],
    chain: [{ who: 'Primary', ackMin: 5 }, { who: 'Secondary', ackMin: 10 }, { who: 'Aditya Rao · Head of Engineering', ackMin: 15 }],
  },
  {
    key: 'privacy', name: 'Privacy and rights', covers: 'Rights requests near SLA, unusual reads, suspected breach',
    pool: ['Neha Iyer · DPO', 'Ananya Pillai · Data', 'Aditya Rao · Head of Engineering'],
    primary: ['Neha Iyer · DPO', 'Neha Iyer · DPO', 'Neha Iyer · DPO', 'Neha Iyer · DPO', 'Neha Iyer · DPO', 'Neha Iyer · DPO', 'Neha Iyer · DPO'],
    secondary: ['Ananya Pillai · Data', 'Ananya Pillai · Data', 'Ananya Pillai · Data', 'Ananya Pillai · Data', 'Ananya Pillai · Data', 'Ananya Pillai · Data', 'Ananya Pillai · Data'],
    chain: [{ who: 'Primary', ackMin: 15 }, { who: 'Secondary', ackMin: 30 }, { who: 'Aditya Rao · Head of Engineering', ackMin: 60 }],
  },
]
export const PAGE_HISTORY: { id: string; rota: RotaKey; at: string; what: string; path: string; outcome: string }[] = [
  { id: 'PG-2041', rota: 'clinical', at: '28 Jan 21:04', what: 'P0 · crisis intercept, m_0142', path: 'Dr Sanjay Menon acknowledged in 1 m 12 s', outcome: 'Member reached by phone; safety plan agreed; Tele-MANAS shown throughout' },
  { id: 'PG-2040', rota: 'clinical', at: '28 Jan 06:00', what: 'Synthetic P0 · daily production test on a test member', path: 'Dr Sanjay Menon acknowledged in 2 m 05 s', outcome: 'Test passed: reached a human queue' },
  { id: 'PG-2038', rota: 'sre', at: '27 Jan 23:40', what: 'Ledger write error budget spent', path: 'Kiran Desai unacknowledged 5 m → Rohan Mehta acknowledged in 2 m', outcome: 'Retry storm throttled; Ledger releases frozen until the budget recovers' },
  { id: 'PG-2035', rota: 'privacy', at: '27 Jan 10:12', what: 'Rights request RQ-2286 past half its SLA', path: 'Neha Iyer acknowledged in 6 m', outcome: 'PDF render queue raised; member sent an update' },
]

// ─── Control plane · tool registry (specimen) ────────────────────────────
// Architecture p.20: typed tools with JSON schemas, scopes and owners; minimum fields per tool, pseudonymous ids,
// consent-checked. No tool can send a message or change data without a human (p.25).

type JsonSchema = { type: string; required?: string[]; properties?: Record<string, unknown>; additionalProperties?: boolean; [k: string]: unknown }
export const TOOL_REGISTRY: Record<string, { version: string; grade: 'wellbeing' | 'clinical'; purpose: string; scopes: string[]; never: string[]; input: JsonSchema; output: JsonSchema }> = (() => {
  const text = (max: number) => ({ type: 'string', maxLength: max })
  const term = { type: 'string', enum: ['H', 'P', 'R', 'F', 'D', 'B'] }
  const lang = { type: 'string', enum: ['en', 'ta', 'hi'] }
  const obj = (required: string[], properties: Record<string, unknown>): JsonSchema => ({ type: 'object', required, properties, additionalProperties: false })
  const reply = obj(['text', 'lang', 'claims_checked'], { text: text(480), lang, claims_checked: { type: 'boolean', const: true } })
  return {
    index_explainer: { version: '1.4.0', grade: 'wellbeing', purpose: 'index_explain', scopes: ['read:score.latest', 'read:term_scores', 'read:method'], never: ['journal_text', 'ease_items', 'raw_signals'], input: obj(['member', 'index', 'band', 'lowest', 'method', 'lang'], { member: { type: 'string', pattern: '^m_[a-z0-9]{8}$', description: 'Pseudonymous id' }, index: { type: 'integer', minimum: 0, maximum: 100 }, band: { type: 'string' }, lowest: term, method: { type: 'string', const: 'jsi-1.0' }, lang }), output: reply },
    next_best_action: { version: '2.2.0', grade: 'wellbeing', purpose: 'today_narrate', scopes: ['read:action_assignment', 'read:term_scores', 'read:feature_daily.summary'], never: ['journal_text', 'ease_items', 'household_private'], input: obj(['member', 'action_id', 'term', 'reason_code', 'lang'], { member: { type: 'string' }, action_id: { type: 'string' }, term, reason_code: { type: 'string', enum: ['lowest_term', 'drift', 'recovery_slipped', 'streakless_return'] }, lang }), output: obj(['text', 'lang'], { text: text(220), lang }) },
    ikigai_coach: { version: '1.1.0', grade: 'wellbeing', purpose: 'purpose_coach', scopes: ['read:ikigai_map', 'read:tomorrow_question'], never: ['journal_text', 'ease_items', 'biomarkers'], input: obj(['member', 'map', 'lang'], { member: { type: 'string' }, map: { type: 'array', maxItems: 12, items: text(80) }, lang }), output: reply },
    couples_prompt: { version: '1.0.3', grade: 'wellbeing', purpose: 'household_prompt', scopes: ['read:household.shared_grant'], never: ['partner_private_answers', 'journal_text', 'term_scores_of_partner'], input: obj(['household', 'shared_fields', 'lang'], { household: { type: 'string', pattern: '^h_[a-z0-9]{8}$' }, shared_fields: { type: 'object', description: 'Only fields both partners granted' }, lang }), output: obj(['prompt', 'lang'], { prompt: text(200), lang }) },
    second_arrow_reflection: { version: '1.3.1', grade: 'wellbeing', purpose: 'journal_reflect', scopes: ['read:journal_entry.own'], never: ['ease_items', 'ease_results', 'other_entries'], input: obj(['member', 'entry_text', 'lang'], { member: { type: 'string' }, entry_text: text(4000), lang }), output: obj(['text', 'lang', 'advice'], { text: text(360), lang, advice: { type: 'boolean', const: false } }) },
    ledger_weekly_story: { version: '1.0.6', grade: 'wellbeing', purpose: 'ledger_summary', scopes: ['read:ledger.week.tags'], never: ['ledger_photos', 'journal_text'], input: obj(['member', 'week', 'tag_counts', 'lang'], { member: { type: 'string' }, week: { type: 'string', format: 'date' }, tag_counts: { type: 'object' }, lang }), output: obj(['text', 'lang'], { text: text(240), lang }) },
    time_audit_summary: { version: '1.0.5', grade: 'wellbeing', purpose: 'time_audit', scopes: ['read:calendar.hours_by_category'], never: ['calendar_titles', 'attendees', 'finances'], input: obj(['member', 'hours', 'lang'], { member: { type: 'string' }, hours: { type: 'object', description: 'Hours by category; raw events discarded' }, lang }), output: reply },
    practice_companion: { version: '1.2.0', grade: 'wellbeing', purpose: 'practice_answer', scopes: ['read:retrieval.method_book_notes', 'read:practice.week'], never: ['member_data_in_retrieval', 'journal_text'], input: obj(['member', 'week', 'question', 'lang'], { member: { type: 'string' }, week: { type: 'integer', minimum: 1, maximum: 13 }, question: text(500), lang }), output: obj(['text', 'citations', 'lang'], { text: text(600), citations: { type: 'array', items: { type: 'string' } }, lang }) },
    coach_digest: { version: '0.4.0', grade: 'wellbeing', purpose: 'coach_digest', scopes: ['read:term_scores', 'read:attendance', 'read:consent.coach_digest'], never: ['journal_text', 'ease_items', 'household_private'], input: obj(['member', 'quarter', 'lang'], { member: { type: 'string' }, quarter: { type: 'string' }, lang: { type: 'string', enum: ['en'] } }), output: obj(['summary', 'flags'], { summary: text(900), flags: { type: 'array', items: { type: 'string' } } }) },
    explain_biomarker: { version: '0.9.0', grade: 'clinical', purpose: 'biomarker_explain', scopes: ['read:observation.lab', 'read:le8'], never: ['diagnosis', 'journal_text'], input: obj(['member', 'loinc', 'value', 'unit', 'range', 'lang'], { member: { type: 'string' }, loinc: { type: 'string' }, value: { type: 'number' }, unit: { type: 'string' }, range: { type: 'string' }, lang }), output: obj(['draft', 'needs_physician'], { draft: text(480), needs_physician: { type: 'boolean', const: true } }) },
  }
})()

// ─── Control plane · live sampling and drift (specimen) ──────────────────
// Weekly live sample: 210 outputs drawn at random this week across tools and languages; 198 already read. The queue holds
// the rest. AI drift: twelve weekly points per tool and metric against the launch baseline.

export const LIVE_SAMPLE_WEEK = { label: 'Week of 25–31 Jan 2027', sampled: 210, reviewedBefore: 198 }
export const LIVE_SAMPLE_QUEUE: { id: string; tool: string; lang: 'EN' | 'TA' | 'HI'; tenant: string; at: string; output: string; gloss?: boolean }[] = [
  ['ls_4401', 'second_arrow_reflection', 'TA', 'tnt_aiwo', '28 Jan 19:44'],
  ['ls_4402', 'next_best_action', 'EN', 'tnt_northwind', '28 Jan 18:10'],
  ['ls_4403', 'practice_companion', 'HI', 'tnt_house_chn', '28 Jan 16:02'],
  ['ls_4404', 'index_explainer', 'TA', 'tnt_aiwo', '28 Jan 14:31'],
  ['ls_4405', 'couples_prompt', 'EN', 'tnt_aiwo', '28 Jan 12:20'],
  ['ls_4406', 'ikigai_coach', 'HI', 'tnt_northwind', '28 Jan 10:55'],
  ['ls_4407', 'ledger_weekly_story', 'EN', 'tnt_house_chn', '27 Jan 21:40'],
  ['ls_4408', 'time_audit_summary', 'TA', 'tnt_aiwo', '27 Jan 19:15'],
  ['ls_4409', 'second_arrow_reflection', 'EN', 'tnt_northwind', '27 Jan 17:02'],
  ['ls_4410', 'coach_digest', 'EN', 'tnt_aiwo', '27 Jan 15:48'],
  ['ls_4411', 'practice_companion', 'TA', 'tnt_aiwo', '27 Jan 11:26'],
  ['ls_4412', 'next_best_action', 'HI', 'tnt_aiwo', '27 Jan 09:03'],
].map(([id, tool, lang, tenant, at]) => ({ id, tool, lang: lang as 'EN' | 'TA' | 'HI', tenant, at, output: TRACE_TOOL[tool]?.excerpt ?? '', gloss: lang !== 'EN' }))

export const DRIFT_WEEKS = ['9 Nov', '16 Nov', '23 Nov', '30 Nov', '7 Dec', '14 Dec', '21 Dec', '28 Dec', '4 Jan', '11 Jan', '18 Jan', '25 Jan']
export type DriftMetric = 'rewrite' | 'human' | 'live' | 'shift'
export const DRIFT_METRICS: Record<DriftMetric, { label: string; unit: string; watch: number; higherIsWorse: boolean; note: string }> = {
  rewrite: { label: 'Output guard rewrites', unit: '%', watch: 3, higherIsWorse: true, note: 'Share of outputs where the claims gate swapped in sealed copy.' },
  human: { label: 'Routed to a human', unit: '%', watch: 6, higherIsWorse: true, note: 'Share held for physician review or blocked to the rules-based version.' },
  live: { label: 'Live-sample pass', unit: '%', watch: 90, higherIsWorse: false, note: 'Share of the weekly human sample marked “No issue”. The floor matches the offline evals.' },
  shift: { label: 'Input shift vs launch', unit: 'PSI', watch: 0.1, higherIsWorse: true, note: 'Population stability of the input mix (language, term, length) against the launch baseline. 0.10 is watch; 0.25 means re-baseline.' },
}
const wobble = (seed: string, i: number) => {
  let h = 2166136261
  for (const c of `${seed}:${i}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return ((h >>> 0) % 1000) / 1000 - 0.5
}
const DRIFT_SHAPE: Record<string, Partial<Record<DriftMetric, [number, number]>>> = {
  // [start, end]: a straight trend with a little weekly noise. Unlisted pairs hold steady at the default.
  second_arrow_reflection: { rewrite: [1.2, 3.8], human: [4.1, 6.6], live: [96, 91.5] },
  practice_companion: { shift: [0.03, 0.14] },
  coach_digest: { live: [97, 95] },
}
const DRIFT_DEFAULT: Record<DriftMetric, number> = { rewrite: 1.1, human: 1.6, live: 97, shift: 0.04 }
export function driftSeries(tool: string, metric: DriftMetric): number[] {
  const [a, b] = DRIFT_SHAPE[tool]?.[metric] ?? [DRIFT_DEFAULT[metric], DRIFT_DEFAULT[metric]]
  const amp = metric === 'shift' ? 0.012 : metric === 'live' ? 1.2 : 0.4
  return DRIFT_WEEKS.map((_, i) => {
    const v = a + ((b - a) * i) / (DRIFT_WEEKS.length - 1) + wobble(tool + metric, i) * amp
    return metric === 'shift' ? Math.max(0, Math.round(v * 1000) / 1000) : Math.round(Math.max(0, Math.min(100, v)) * 10) / 10
  })
}

// ─── Control plane · access governance (specimen) ────────────────────────
// Architecture p.25: relationship-based access, purpose logging, alerts on unusual reads; quarterly access reviews.

export type UnusualRead = { id: string; at: string; actor: string; role: string; rule: string; detail: string; purpose: string; status: 'open' | 'cleared' | 'escalated'; resolution?: string }
export const UNUSUAL_READS: UnusualRead[] = [
  { id: 'UR-0117', at: '28 Jan 20:12', actor: 'Priya Natarajan', role: 'coach', rule: 'Volume · over three times the 10-minute baseline', detail: '14 member records read in 10 minutes; her baseline is 4.', purpose: 'Circle prep · Thursday circle', status: 'open' },
  { id: 'UR-0116', at: '28 Jan 02:41', actor: 'Dr Lakshmi Raghavan', role: 'clinician', rule: 'Out of hours · no open alert, task or on-call shift', detail: 'Read term scores for m_0088 at 02:41. Not on call that night.', purpose: 'Follow-up on P1 screen', status: 'open' },
  { id: 'UR-0115', at: '27 Jan 17:05', actor: 'svc:coach-digest', role: 'system', rule: 'Scope · asked for a field outside the tool’s registry scope', detail: 'Requested journal_text for one member. The consent check refused it; nothing was read.', purpose: 'coach_digest', status: 'open' },
  { id: 'UR-0114', at: '27 Jan 11:30', actor: 'Vikas Shah', role: 'tenant_admin', rule: 'Threshold probe · repeated aggregate queries that differ by one group', detail: 'Six aggregate queries narrowing department and location. Every one returned suppressed.', purpose: 'Quarterly review', status: 'open' },
  { id: 'UR-0112', at: '25 Jan 15:48', actor: 'Dr Sanjay Menon', role: 'clinician', rule: 'Relationship · member not on his caseload', detail: 'Read m_0207 during P0 cover for a colleague.', purpose: 'Crisis cover', status: 'cleared', resolution: 'Cleared by Neha Iyer: on-call cover, the rota confirms the shift.' },
]

export type AccessDecision = 'keep' | 'reduce' | 'revoke'
export type AccessGrant = { id: string; who: string; role: string; access: string; lastUsed: string; suggest?: AccessDecision; why?: string; self?: boolean }
export const ACCESS_REVIEW = {
  quarter: 'Q3 FY27 · Oct–Dec 2026',
  due: '31 Jan 2027',
  previous: 'Q2 FY27 signed 29 Oct 2026 by Neha Iyer and Aditya Rao · 14 grants, 2 revoked',
  grants: [
    { id: 'g01', who: 'Kiran Desai', role: 'SRE', access: 'JIT-eligible prod read · on-call pager', lastUsed: '28 Jan 2027' },
    { id: 'g02', who: 'Rohan Mehta', role: 'Backend', access: 'JIT-eligible prod read', lastUsed: '19 Jan 2027' },
    { id: 'g03', who: 'Ishaan Kulkarni', role: 'SRE', access: 'JIT-eligible prod read and write · feature flags', lastUsed: '2 Jan 2027', suggest: 'reduce', why: 'No flag write in 90 days; read-only would cover the rota.' },
    { id: 'g04', who: 'Ananya Pillai', role: 'Data', access: 'Research registry, de-identified · warehouse aggregates', lastUsed: '26 Jan 2027' },
    { id: 'g05', who: 'Priya Natarajan', role: 'Coach', access: 'Caseload of 38 members · circles', lastUsed: '28 Jan 2027' },
    { id: 'g06', who: 'Meera Joshi', role: 'Coach', access: 'Caseload of 0 · circles', lastUsed: '11 Dec 2026', suggest: 'revoke', why: 'Moved to the events team on 12 Dec; caseload handed over.' },
    { id: 'g07', who: 'Dr Sanjay Menon', role: 'Psychologist', access: 'Clinical portal · P0 on call', lastUsed: '28 Jan 2027' },
    { id: 'g08', who: 'Dr Lakshmi Raghavan', role: 'Psychologist', access: 'Clinical portal · eval reviewer', lastUsed: '28 Jan 2027' },
    { id: 'g09', who: 'Dr Meera Iyer', role: 'Physician', access: 'Clinical portal · clinical-grade sign-off', lastUsed: '24 Jan 2027' },
    { id: 'g10', who: 'Rhea Kapoor', role: 'Tenant admin · Northwind', access: 'Aggregates, groups of 50 or more', lastUsed: '28 Jan 2027' },
    { id: 'g11', who: 'svc:coach-digest', role: 'Service', access: 'Scoped token · term scores, attendance', lastUsed: '28 Jan 2027' },
    { id: 'g12', who: 'Neha Iyer', role: 'DPO', access: 'Audit read · JIT approver', lastUsed: '28 Jan 2027', self: true },
  ] as AccessGrant[],
}
