import { useSyncExternalStore } from 'react'
import { MEMBER } from '@/data/member'

// Journey lane store — the member's own actions across ’Cation, Passport,
// Practice, Circles and Events, so a step taken on one screen shows on the
// others. Front-end only: kept in sessionStorage (wrapped; it may be blocked)
// and shaped like the future API. SPECIMEN.

export interface CationRequest {
  ref: string
  slug: string
  name: string
  dates: string | null
  venue: string
  guests: number
  outcome: string
  dietary: string
  interestOnly: boolean
  sentOn: string
}

export interface BookedPass {
  id: string
  name: string
  when: string
  where: string
  kind: 'Session' | 'Salon' | 'Flagship'
  code: string
  gate: string
  seat: string
  holder: string
  guests: number
}

export interface JourneyState {
  /** ISO dates on which the current week’s daily practice was kept. */
  practisedDays: string[]
  cationRequests: CationRequest[]
  /** Salon id → seats booked (1 or 2). */
  salonSeats: Record<string, number>
  /** Sessions, salons and editions booked in this session. */
  passes: BookedPass[]
  /** Wallet the pass was added to, if any. */
  wallet: null | 'apple' | 'google'
  /** Request for a place at the next flagship edition. */
  flagshipRequest: null | { ref: string; guests: number; note: string }
  /** Calendar holds the member accepted, by id. */
  calendar: Record<string, boolean>
  /** Other circles: invitation accepted or request to join sent, by circle id. */
  circleRequests: Record<string, boolean>
  /** Personal schedule at the next Session, by programme row; null = the specimen default. */
  schedule: Record<number, boolean> | null
  /** Private Practice reflections, by week. */
  reflections: Record<number, { text: string; savedAt: string }>
  /** Earlier Practice weeks the member has un-marked (all earlier weeks start as practised). */
  weeksUnmarked: number[]
  /** Practice weeks whose Mentor audio is kept on this device for offline play. */
  offlineWeeks: number[]
  /** Joyspan Occasion requests sent to the concierge. */
  occasionRequests: OccasionRequest[]
  /** Specimen switch: show the ’Cation tab as a member who has not taken a ’cation yet. */
  demoNoCation: boolean
}

export type OccasionGeneration = 'elders' | 'middle' | 'young'

export interface OccasionGuest {
  id: string
  name: string
  generation: OccasionGeneration
  /** Takes their own Day-0 Index at the Occasion (each guest consents for themselves). */
  measured: boolean
  /** Elder mode on the day: large type, voice-first, a family member helps. */
  elder: boolean
}

export interface OccasionRequest {
  ref: string
  template: 'birthday60' | 'anniversary' | 'homecoming'
  honoree: string
  window: string
  venue: string
  guests: OccasionGuest[]
  outcome: string
  sentOn: string
}

const KEY = 'joyos:journey'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * A local Date as YYYY-MM-DD from its local parts. Not toISOString(), which
 * gives the UTC date: at UTC+12 or more, local noon is the previous UTC day.
 */
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  d.setDate(d.getDate() + n)
  return isoDate(d)
}

/** The specimen “today”: Day 23 of the loop that started at checkout. */
export const TODAY = addDays(MEMBER.loopStarted, MEMBER.dayOfLoop)

/** Days already practised this week before today (specimen). */
const SEED_DAYS = [addDays(TODAY, -3), addDays(TODAY, -2)]

const initial: JourneyState = {
  practisedDays: SEED_DAYS,
  cationRequests: [],
  salonSeats: {},
  passes: [],
  wallet: null,
  flagshipRequest: null,
  calendar: {},
  circleRequests: {},
  schedule: null,
  reflections: {},
  weeksUnmarked: [],
  offlineWeeks: [],
  occasionRequests: [],
  demoNoCation: false,
}

// Offline audio is kept on the device, so its record lives in localStorage and
// survives closing the tab, unlike the rest of the session's journey state.
const OFFLINE_KEY = 'joyos:journey:offline'

function loadOffline(): number[] | null {
  try {
    const raw = window.localStorage.getItem(OFFLINE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as unknown
    return Array.isArray(v) ? v.filter((n): n is number => typeof n === 'number') : null
  } catch {
    return null
  }
}

function load(): JourneyState {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    const base: JourneyState = raw ? { ...initial, ...(JSON.parse(raw) as Partial<JourneyState>) } : initial
    const offline = loadOffline()
    return offline ? { ...base, offlineWeeks: offline } : base
  } catch {
    return initial
  }
}

let state: JourneyState = typeof window === 'undefined' ? initial : load()
const listeners = new Set<() => void>()

function emit() {
  try { window.sessionStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage blocked: state lives in memory */ }
  try { window.localStorage.setItem(OFFLINE_KEY, JSON.stringify(state.offlineWeeks)) } catch { /* storage blocked */ }
  listeners.forEach((l) => l())
}

export function setJourney(update: (s: JourneyState) => JourneyState) {
  state = update(state)
  emit()
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
const snapshot = () => state

export function useJourney(): JourneyState {
  return useSyncExternalStore(subscribe, snapshot, snapshot)
}

// ─── Actions ──────────────────────────────────────────────────────────────

export const practisedToday = (s: JourneyState) => s.practisedDays.includes(TODAY)

export function togglePractisedToday(on: boolean) {
  setJourney((s) => ({
    ...s,
    practisedDays: on ? Array.from(new Set([...s.practisedDays, TODAY])).sort() : s.practisedDays.filter((d) => d !== TODAY),
  }))
}

export function addCationRequest(r: CationRequest) {
  setJourney((s) => ({ ...s, cationRequests: [r, ...s.cationRequests.filter((x) => x.slug !== r.slug)] }))
}

export function withdrawCationRequest(slug: string) {
  setJourney((s) => ({ ...s, cationRequests: s.cationRequests.filter((x) => x.slug !== slug) }))
}

export function setSalon(id: string, seats: number, pass?: BookedPass) {
  setJourney((s) => ({
    ...s,
    salonSeats: { ...s.salonSeats, [id]: seats },
    passes: seats && pass ? [...s.passes.filter((p) => p.id !== id), pass] : s.passes.filter((p) => p.id !== id),
  }))
}

export function addPass(p: BookedPass) {
  setJourney((s) => ({ ...s, passes: [...s.passes.filter((x) => x.id !== p.id), p] }))
}

export function cancelPass(id: string) {
  setJourney((s) => {
    const salonSeats = { ...s.salonSeats }
    delete salonSeats[id]
    return { ...s, passes: s.passes.filter((p) => p.id !== id), salonSeats }
  })
}

export function setWallet(w: JourneyState['wallet']) {
  setJourney((s) => ({ ...s, wallet: w }))
}

export function setFlagshipRequest(r: JourneyState['flagshipRequest']) {
  setJourney((s) => ({ ...s, flagshipRequest: r }))
}

export function setCalendar(id: string, on: boolean) {
  setJourney((s) => ({ ...s, calendar: { ...s.calendar, [id]: on } }))
}

export function setCircleRequest(id: string, on: boolean) {
  setJourney((s) => ({ ...s, circleRequests: { ...s.circleRequests, [id]: on } }))
}

export function setSchedule(schedule: Record<number, boolean>) {
  setJourney((s) => ({ ...s, schedule }))
}

export function saveReflection(week: number, text: string, savedAt: string) {
  setJourney((s) => ({ ...s, reflections: { ...s.reflections, [week]: { text, savedAt } } }))
}

/** Earlier weeks are practised unless the member un-marked them. */
export const weekPractised = (s: JourneyState, week: number) => !s.weeksUnmarked.includes(week)

export function setWeekPractised(week: number, on: boolean) {
  setJourney((s) => ({ ...s, weeksUnmarked: on ? s.weeksUnmarked.filter((w) => w !== week) : Array.from(new Set([...s.weeksUnmarked, week])) }))
}

export function setOffline(week: number, on: boolean) {
  setJourney((s) => ({ ...s, offlineWeeks: on ? Array.from(new Set([...s.offlineWeeks, week])) : s.offlineWeeks.filter((w) => w !== week) }))
}

export function addOccasionRequest(r: OccasionRequest) {
  setJourney((s) => ({ ...s, occasionRequests: [r, ...s.occasionRequests.filter((x) => x.ref !== r.ref)] }))
}

export function withdrawOccasionRequest(ref: string) {
  setJourney((s) => ({ ...s, occasionRequests: s.occasionRequests.filter((x) => x.ref !== ref) }))
}

export function setDemoNoCation(on: boolean) {
  setJourney((s) => ({ ...s, demoNoCation: on }))
}

// ─── Circle reports (W6) ──────────────────────────────────────────────────
// A member's report about someone in their circle, read by the coach console
// as a moderation item. Shared contract: localStorage 'joyos:circle:reports',
// a JSON array of { id, about, reason, at }. SPECIMEN.

export interface CircleReport { id: string; about: string; reason: string; at: string }

const REPORTS_KEY = 'joyos:circle:reports'
const reportListeners = new Set<() => void>()
let reportsCache: CircleReport[] | null = null

function readReports(): CircleReport[] {
  try {
    const raw = window.localStorage.getItem(REPORTS_KEY)
    const v = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(v) ? (v as CircleReport[]).filter((x) => x && typeof x.id === 'string') : []
  } catch {
    return []
  }
}

function writeReports(next: CircleReport[]) {
  reportsCache = next
  try { window.localStorage.setItem(REPORTS_KEY, JSON.stringify(next)) } catch { /* storage blocked: kept in memory */ }
  reportListeners.forEach((l) => l())
}

const reportsSnapshot = () => (reportsCache ??= typeof window === 'undefined' ? [] : readReports())
const subscribeReports = (l: () => void) => {
  reportListeners.add(l)
  // Another tab (the coach console) may mark one as seen or remove it.
  const onStorage = (e: StorageEvent) => { if (e.key === REPORTS_KEY) { reportsCache = readReports(); l() } }
  window.addEventListener('storage', onStorage)
  return () => { reportListeners.delete(l); window.removeEventListener('storage', onStorage) }
}

export function useCircleReports(): CircleReport[] {
  return useSyncExternalStore(subscribeReports, reportsSnapshot, reportsSnapshot)
}

export function addCircleReport(about: string, reason: string) {
  const r: CircleReport = { id: `cr-${Date.now().toString(36)}`, about, reason, at: new Date().toISOString() }
  writeReports([r, ...readReports()])
  return r
}

export function withdrawCircleReport(id: string) {
  writeReports(readReports().filter((r) => r.id !== id))
}

export const holderName = `${MEMBER.firstName} ${MEMBER.lastName}`
export const passCode = (prefix: string, city: string) => `${prefix}-${city.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}-${MEMBER.id.slice(-4)}`
