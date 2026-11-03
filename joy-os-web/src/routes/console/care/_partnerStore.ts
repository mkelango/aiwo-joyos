import { useState, useSyncExternalStore } from 'react'
import { consoleNowMs } from './_parts'

// The venue's work in the partner console (arrivals, Signal Points, passes, zones, itineraries,
// webhooks), kept in localStorage so it survives leaving the console, like the coach and
// clinical stores. A published itinerary is also written where the member's 'Cation detail
// reads it (joyos:partner:published) and where the concierge desk sees the arrival. Specimen data.

const KEY = 'joyos:partner:v1'
export const PUBLISHED_KEY = 'joyos:partner:published'

/** The published schedule, as the member app reads it. */
export type PublishedItinerary = { cation: string; venue: string; days: { day: number; items: { time: string; title: string }[] }[]; at: string }
/** One guest's published itinerary, for the concierge's pre-arrival list. */
export type GuestPublished = PublishedItinerary & { guestId: string; guest: string; room: string; v: number; clock: string }

type State = Record<string, unknown> & { published?: Record<string, GuestPublished> }

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    const p = raw ? JSON.parse(raw) : null
    return p && typeof p === 'object' ? (p as State) : {}
  } catch {
    return {}
  }
}

let state: State = load()
const listeners = new Set<() => void>()

function emit(next: State) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable: keep in memory */
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

/**
 * One piece of venue work, persisted. Works like useState: the seed is used until the venue
 * changes something, and a reset of the specimen goes back to it.
 */
export function usePartnerField<T>(field: string, seed: () => T): [T, (f: T | ((cur: T) => T)) => void] {
  const [initial] = useState(seed)
  const saved = useSyncExternalStore(subscribe, () => state[field], () => state[field]) as T | undefined
  const value = saved ?? initial
  const set = (f: T | ((cur: T) => T)) => {
    const cur = (state[field] as T | undefined) ?? initial
    const next = typeof f === 'function' ? (f as (c: T) => T)(cur) : f
    emit({ ...state, [field]: next })
  }
  return [value, set]
}

export const partner = {
  /** Publish a guest's itinerary: kept per guest for the concierge, and written for the member app. */
  publish(p: Omit<GuestPublished, 'at'>) {
    const entry: GuestPublished = { ...p, at: new Date(consoleNowMs()).toISOString() }
    emit({ ...state, published: { ...(state.published ?? {}), [p.guestId]: entry } })
    const { cation, venue, days, at } = entry
    try {
      localStorage.setItem(PUBLISHED_KEY, JSON.stringify({ cation, venue, days, at } satisfies PublishedItinerary))
    } catch {
      /* storage unavailable */
    }
  },
  /** Back to the specimen start. What was published stays published. */
  reset() {
    emit({ published: state.published })
  },
}

const EMPTY: Record<string, GuestPublished> = {}
/** Every guest itinerary the venue has published, by guest id. */
export function usePartnerPublished() {
  return useSyncExternalStore(subscribe, () => state.published ?? EMPTY, () => state.published ?? EMPTY)
}

/** The venue's arrivals as last saved (check-ins), if the venue has changed any. */
export function usePartnerSaved<T>(field: string) {
  return useSyncExternalStore(subscribe, () => state[field], () => state[field]) as T | undefined
}
