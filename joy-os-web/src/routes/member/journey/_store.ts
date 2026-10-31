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
}

const KEY = 'joyos:journey'

/** The specimen “today”: Day 23 of the loop that started at checkout. */
export const TODAY = (() => {
  const d = new Date(`${MEMBER.loopStarted}T12:00:00`)
  d.setDate(d.getDate() + MEMBER.dayOfLoop)
  return d.toISOString().slice(0, 10)
})()

export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

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
}

function load(): JourneyState {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return initial
    return { ...initial, ...(JSON.parse(raw) as Partial<JourneyState>) }
  } catch {
    return initial
  }
}

let state: JourneyState = typeof window === 'undefined' ? initial : load()
const listeners = new Set<() => void>()

function emit() {
  try { window.sessionStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage blocked: state lives in memory */ }
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

export const holderName = `${MEMBER.firstName} ${MEMBER.lastName}`
export const passCode = (prefix: string, city: string) => `${prefix}-${city.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()}-${MEMBER.id.slice(-4)}`
