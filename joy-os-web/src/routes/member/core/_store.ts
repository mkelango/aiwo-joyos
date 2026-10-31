import { useCallback, useSyncExternalStore } from 'react'
import type { LedgerEntry, TermKey, TermScore } from '@/domain/types'
import { LEDGER, LEDGER_WEEK, MEMBER } from '@/data/member'

// Lane-local persisted state for the member core (Today, Index, Ledger, VIVA).
// Per-viewer conveniences in localStorage, every access wrapped in try/catch so the
// screens still render in a private window. Shaped so it can move to the BFF later.

const PREFIX = 'joyos:core:'
const EVT = 'joyos:core-change'
const memory = new Map<string, unknown>()
const cache = new Map<string, { raw: string | null; value: unknown }>()

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key)
  } catch {
    return null
  }
}

export function readLocal<T>(key: string, initial: T): T {
  if (memory.has(key)) return memory.get(key) as T
  const raw = readRaw(key)
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.value as T
  let value: T = initial
  if (raw != null) {
    try {
      value = JSON.parse(raw) as T
    } catch {
      value = initial
    }
  }
  cache.set(key, { raw, value })
  return value
}

export function writeLocal<T>(key: string, value: T) {
  try {
    if (value === undefined || value === null) localStorage.removeItem(PREFIX + key)
    else localStorage.setItem(PREFIX + key, JSON.stringify(value))
    memory.delete(key)
  } catch {
    memory.set(key, value) // storage unavailable or full: keep it for this session
  }
  window.dispatchEvent(new CustomEvent(EVT, { detail: key }))
}

function subscribe(cb: () => void) {
  const on = () => cb()
  window.addEventListener(EVT, on)
  window.addEventListener('storage', on)
  return () => {
    window.removeEventListener(EVT, on)
    window.removeEventListener('storage', on)
  }
}

/** useState that persists under joyos:core:<key> and stays in sync across components. */
export function useLocal<T>(key: string, initial: T) {
  const value = useSyncExternalStore(
    subscribe,
    () => readLocal<T>(key, initial),
    () => initial,
  )
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readLocal<T>(key, initial)
      const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
      writeLocal(key, v)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )
  return [value, set] as const
}

// ─── The specimen calendar ──────────────────────────────────────────────────
// The member's world runs on the loop: Day N of 90 from MEMBER.loopStarted.
// "Today" in the specimen is that day, so seed data and new entries share one clock.
export function addDays(iso: string, n: number) {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`)
  d.setDate(d.getDate() + n)
  return localDay(d)
}
export function localDay(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export const SPECIMEN_TODAY = addDays(MEMBER.loopStarted, MEMBER.dayOfLoop)
export const IN_REMEASURE_WINDOW = MEMBER.dayOfLoop >= 76

// ─── Joy Ledger helpers ─────────────────────────────────────────────────────
const SEED_IDS = new Set(LEDGER.map((e) => e.id))
export const isSeed = (e: LedgerEntry) => SEED_IDS.has(e.id)

/**
 * The entry's moment on the specimen clock. Seed entries keep their date; entries
 * kept in this browser are placed on the specimen today at the real local time.
 */
export function specimenAt(e: LedgerEntry) {
  if (isSeed(e)) return e.at.length === 16 ? `${e.at}:00` : e.at
  const d = new Date(e.at)
  if (Number.isNaN(d.getTime())) return e.at
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${SPECIMEN_TODAY}T${hh}:${mm}:${ss}`
}

/** Entries the member has removed (kept on the device as a tombstone until sync). */
export function useLedgerRemoved() {
  return useLocal<string[]>('ledger-removed', [])
}

/** Live Ledger, newest first, on the specimen clock, without removed entries. */
export function liveLedger(ledger: LedgerEntry[], removed: string[]) {
  const gone = new Set(removed)
  return ledger
    .filter((e) => !gone.has(e.id))
    .map((e) => ({ ...e, at: specimenAt(e) }))
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
}

/** Monday-to-Sunday days of the specimen week. */
export function specimenWeek() {
  const d = new Date(`${SPECIMEN_TODAY}T12:00:00`)
  const offset = (d.getDay() + 6) % 7 // Monday = 0
  return Array.from({ length: 7 }, (_, i) => addDays(SPECIMEN_TODAY, i - offset))
}

/**
 * Where joy came from this week: the specimen baseline (LEDGER_WEEK, which already
 * includes the seed entries) plus anything kept here, minus anything removed.
 */
export function weekCounts(ledger: LedgerEntry[], removed: string[]) {
  const counts = new Map(LEDGER_WEEK.map((r) => [r.tag, r.count]))
  const week = new Set(specimenWeek())
  const gone = new Set(removed)
  for (const e of ledger) {
    const day = specimenAt(e).slice(0, 10)
    if (!week.has(day)) continue
    const sign = isSeed(e) ? (gone.has(e.id) ? -1 : 0) : gone.has(e.id) ? 0 : 1
    if (!sign) continue
    for (const t of e.tags) counts.set(t, Math.max(0, (counts.get(t) ?? 0) + sign))
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}

// ─── Ledger prompt schedule ─────────────────────────────────────────────────
export interface ScheduleRow {
  prompt: 1 | 2 | 3
  time: string
  label: string
  on: boolean
}

// ─── Index result from a sitting ────────────────────────────────────────────
export interface MeasuredIndex {
  takenOn: string
  value: number
  gm: number
  burden: number
  terms: TermScore[]
  lowestTerm: TermKey
  preview: boolean
  phqFlag: boolean
}
export function useMeasured() {
  return useLocal<MeasuredIndex | null>('measured-index', null)
}
