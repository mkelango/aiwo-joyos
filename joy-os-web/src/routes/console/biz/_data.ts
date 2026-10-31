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
  cycle: 'Cycle 1 · Day 0 on 21 Oct 2026 · Day 90 closed 19 Jan 2027',
  admin: 'Rhea Kapoor · Head of People',
  region: 'India · Mumbai cell (pooled)',
  recovery: 'Hyderabad',
  keys: 'Pooled region key · per-tenant data key from J4',
  contract: 'Per member per year · aggregate outcomes only',
  lastPublished: '2027-01-22',
}

export const INVITE_WAVES = [
  { id: 'w1', name: 'Wave 1 · Engineering and Operations', sent: '2026-10-07', invited: 420, opened: 372, enrolled: 318 },
  { id: 'w2', name: 'Wave 2 · Sales, Finance, People & Legal', sent: '2026-10-14', invited: 480, opened: 401, enrolled: 341 },
  { id: 'w3', name: 'Wave 3 · Gentle reminder, all not yet enrolled', sent: '2026-10-28', invited: 340, opened: 214, enrolled: 153 },
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
export const INSURER = {
  name: 'Star Health · Joy OS policy benefit',
  stage: 'Pilot cohort in conversation · J3',
  enrolled: 5000,
  measured: 3860,
  remeasureRate: 0.68,
  burdenD0: 41,
  burdenD90: 35,
  burdenFalling: 0.58,
  routed: 214,
  pricePerMember: 1000,
  outcomeShare: 0.3,
  bands: [
    { label: 'Burden fell ≥5', share: 0.39 },
    { label: 'Burden fell 1–4', share: 0.19 },
    { label: 'Unchanged', share: 0.24 },
    { label: 'Burden rose', share: 0.18 },
  ],
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
  window: 'Oct 2026 – Mar 2027',
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
]

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

export const CELLS = [
  { name: 'India · Mumbai', status: 'Live', when: 'Now', region: 'ap-south-1', recovery: 'Hyderabad', law: 'DPDP Act 2023 · ABDM', tenants: 4, members: '1,180' },
  { name: 'GCC · Dubai', status: 'Planned', when: 'J4 · FY29', region: 'me-central-1', recovery: 'In region', law: 'UAE PDPL · DHA licensing', tenants: 0, members: '—' },
  { name: 'UK · London', status: 'Planned', when: 'FY30', region: 'eu-west-2', recovery: 'In region', law: 'UK GDPR · CQC partner', tenants: 0, members: '—' },
  { name: 'Singapore', status: 'Planned', when: 'FY30', region: 'ap-southeast-1', recovery: 'In region', law: 'PDPA', tenants: 0, members: '—' },
  { name: 'US diaspora', status: 'Later', when: 'FY31+', region: 'us-east-1', recovery: 'In region', law: 'HIPAA-aligned · state law', tenants: 0, members: '—' },
]

export const TENANTS = [
  { id: 'tnt_aiwo', name: 'AIWO members', kind: 'Direct', cell: 'India · Mumbai', tenancy: 'Pooled · RLS', keys: 'Region key', members: 1180, budget: 64 },
  { id: 'tnt_northwind', name: 'Northwind Capital · Joyspan@Work', kind: 'Employer', cell: 'India · Mumbai', tenancy: 'Pooled · RLS', keys: 'Region key', members: 812, budget: 58 },
  { id: 'tnt_fairmont', name: 'Fairmont Mumbai', kind: 'Venue partner', cell: 'India · Mumbai', tenancy: 'Pooled · no PHI', keys: 'Region key', members: 0, budget: 0 },
  { id: 'tnt_house_chn', name: 'Joyspan House Chennai', kind: 'House', cell: 'India · Mumbai', tenancy: 'Pooled · RLS', keys: 'Region key', members: 140, budget: 71 },
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

export const RIGHTS_JOBS = [
  { id: 'RQ-2291', kind: 'erase' as const, opened: '28 Jan 09:40', elapsedH: 11.5, stores: 7, done: 6, status: 'running' as const, note: 'Clinical records retained only where law requires; member told which.' },
  { id: 'RQ-2290', kind: 'export' as const, opened: '27 Jan 14:05', elapsedH: 31, stores: 9, done: 9, status: 'delivered' as const, note: 'JSON + FHIR bundle + PDFs; signed link, 72 h expiry.' },
  { id: 'RQ-2288', kind: 'withdraw' as const, opened: '27 Jan 10:12', elapsedH: 3.2, stores: 5, done: 5, status: 'delivered' as const, note: 'Cohort consent withdrawn; caches purged; consent.changed fanned out.' },
  { id: 'RQ-2286', kind: 'export' as const, opened: '26 Jan 18:30', elapsedH: 50.7, stores: 9, done: 8, status: 'running' as const, note: 'Waiting on PDF render of the Day-90 card.' },
  { id: 'RQ-2283', kind: 'erase' as const, opened: '25 Jan 08:55', elapsedH: 19.8, stores: 7, done: 7, status: 'delivered' as const, note: 'Verified by erasure worker per store.' },
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
  { fy: 'FY31', plus: 75, licensed: 59.5, fees: 15, total: 150, share: '15%', plusN: '150 k', licN: '850 k' },
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

/** The last four quarters of the north star and the Day-90 re-measure rate (specimen). */
export const NS_TREND = [
  { q: 'Q4 FY26', perLakh: 1.2, remeasure: 0.66 },
  { q: 'Q1 FY27', perLakh: 1.6, remeasure: 0.69 },
  { q: 'Q2 FY27', perLakh: 2.1, remeasure: 0.71 },
  { q: 'Q3 FY27', perLakh: 2.9, remeasure: 0.74 },
]
