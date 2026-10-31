// Joy OS domain model — front-end mock contract.
// Mirrors the Technical Memorandum (Parts II–IV) and the Technical Architecture.
// Every score carries its method version; nothing is silently recomputed.

export type TermKey = 'H' | 'P' | 'R' | 'F' | 'D' | 'B'
export type SpaceSlug = 'body' | 'purpose' | 'people' | 'freedom' | 'pleasure' | 'ease'
export type Band = 'steady' | 'uneven' | 'thin' | 'not-yet-measured'
export type Grade = 'check' | 'index' | 'clinical'
export type MethodVersion = 'v1.0' | 'v1.1' | 'v2.0'

export interface Term {
  key: TermKey
  name: string // "Healthspan"
  space: string // "Body"
  slug: SpaceSlug
  framework: string
  formula: string
  instruments: string[]
  leadCations: string[]
  practiceWeek: string
  viva: string[]
  whatMoves: string
  /** Burden is inverse: higher is worse */
  inverse?: boolean
}

export interface TermScore {
  key: TermKey
  value: number | null // null = not yet measured, never imputed
  band: Band
  delta?: number
}

export interface IndexScore {
  id: string
  memberId: string
  grade: Grade
  method: MethodVersion
  engineBuild: string
  takenOn: string // ISO date
  nextMeasure: string
  terms: TermScore[]
  gm: number
  lambda: number
  value: number // JI, 0–100
  band: Band
  lowestTerm: TermKey
  signedBy?: string // clinical grade only
}

export interface Action {
  id: string
  term: TermKey
  title: string
  detail: string
  minutes: 2 | 10 | 30
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any'
  shared: boolean
  evidence: string
  why: string
}

export interface LedgerEntry {
  id: string
  at: string
  prompt: 1 | 2 | 3
  tags: string[]
  word?: string
  photo?: boolean
}

export interface Person {
  id: string
  name: string
  role: string
  avatar?: string
  initials: string
  tone: string // css colour token
}

export type DriftSignal =
  | 'index-fall'
  | 'sleep-regularity'
  | 'ledger-silent'
  | 'screen-threshold'
  | 'self-harm-language'

export interface DriftTask {
  id: string
  memberId: string
  memberName: string
  signal: DriftSignal
  detail: string
  priority: 'P0' | 'P1' | 'P2'
  slaHours: number
  openedAt: string
  owner: string
  status: 'open' | 'in-progress' | 'done'
  term: TermKey
}

export interface Cation {
  slug: string
  name: string
  primary: TermKey | 'ALL'
  day90Measure: string
  status: 'LIVE' | 'FY28' | 'NEW'
  promise: string
  nights: string
  priceFrom: string
  venues: string[]
}

export interface Consent {
  id: string
  name: string
  purpose: string
  scope: 'core' | 'device' | 'calendar' | 'whatsapp' | 'cohort' | 'partner'
  granted: boolean
  since?: string
}

export interface AccessEvent {
  id: string
  at: string
  who: string
  role: string
  what: string
  purpose: string
}

export type Role =
  | 'member'
  | 'coach'
  | 'clinician'
  | 'partner'
  | 'tenant'
  | 'science'
  | 'exec'
  | 'ops'
