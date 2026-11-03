import type { TermKey } from '@/domain/types'
import { ONBOARDING_KEY, readJSON, type SavedOnboarding } from '@/routes/entry/_store'
import { DEFAULT_NOTIF_PREFS, type NotifPrefs } from './_data'

// The onboarding hand-off. When a member finishes setup (/onboarding writes 'joyos:onboarding'),
// the account screens take over those choices the first time they read their own records:
// linked devices, household invitations, quiet hours and reminders, channels, consents and the
// member's name. Each finished setup is merged once (marked by its completedAt), so later
// changes on the account screens are never overwritten by an old setup.

const SEEDED_KEY = 'joyos:acct:seededFrom'
const ACCT = (k: string) => `joyos:acct:${k}`

/** The saved onboarding record, only once setup was finished. */
export function finishedOnboarding(): SavedOnboarding | null {
  const ob = readJSON<SavedOnboarding>(ONBOARDING_KEY)
  return ob && ob.completedAt ? ob : null
}

/** The member's sign-in contact as entered in setup ("+91 98400 12345" or an email). */
export function setupContact(ob: SavedOnboarding) {
  const a = ob.account
  return a.via === 'email' ? a.email.trim() : `${a.country} ${a.phone}`.trim()
}

/** Focus terms chosen in setup ("what you came for"). */
export function setupIntents(): TermKey[] {
  return finishedOnboarding()?.intents ?? []
}

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* storage unavailable: the screens fall back to their specimen defaults */
  }
}

/** Onboarding's "reminders a day" (0–3: today's action, then Ledger prompts) as notification prefs. */
function remindersToPrefs(perDay: number, cur: NotifPrefs): Pick<NotifPrefs, 'types' | 'ledgerCount'> {
  const n = Math.max(0, Math.min(3, Math.round(perDay)))
  return {
    types: { ...cur.types, action: n >= 1, ledger: n >= 2 },
    ledgerCount: n >= 3 ? 2 : n === 2 ? 1 : cur.ledgerCount,
  }
}

const INVITE_ROLE: Record<string, 'adult' | 'elder'> = { Parent: 'elder' }
const DEVICE_CONSENT: Record<string, string> = { oura: 'c_oura', apple: 'c_hk' }

/**
 * Merge a finished setup into the account records, once per finished setup. Called before any
 * account record is read (usePersisted, readNotifPrefs), so whichever screen opens first sees it.
 */
export function seedFromOnboarding() {
  const ob = finishedOnboarding()
  if (!ob || !ob.completedAt) return
  if (read<string>(SEEDED_KEY) === ob.completedAt) return

  // Devices: whatever was linked in setup shows as connected (same record and shape as /app/devices).
  if (ob.linked?.length) {
    const cur = read<{ states?: Record<string, unknown> }>(ACCT('devices')) ?? {}
    const states = { ...(cur.states ?? {}) }
    for (const id of ob.linked) states[id] = { state: 'connected', lastSync: 'Just now', freshness: 'fresh' }
    write(ACCT('devices'), { ...cur, states })
  }

  // Household: invitations sent in setup appear as waiting invitations.
  if (ob.invites?.length) {
    const cur = read<{ invites?: { contact: string }[] }>(ACCT('household')) ?? {}
    const have = new Set((cur.invites ?? []).map((i) => i.contact.replace(/\s+/g, '').toLowerCase()))
    const fresh = ob.invites
      .filter((i) => i.name.trim() && !have.has(i.contact.replace(/\s+/g, '').toLowerCase()))
      .map((i, n) => ({
        id: `iv-setup-${n}-${ob.completedAt}`,
        role: INVITE_ROLE[i.relation] ?? 'adult',
        name: i.name.trim(),
        contact: i.contact.trim(),
        link: `https://joy.aiwo.in/join/${Math.abs(hash(`${i.name}${i.contact}`)).toString(36).slice(0, 6).toUpperCase().padEnd(6, '0')}`,
        expires: '2027-02-04',
        fromSetup: true,
      }))
    if (fresh.length) write(ACCT('household'), { ...cur, invites: [...(cur.invites ?? []), ...fresh] })
  }

  // Notifications: quiet hours, reminders a day and channels (shared by Settings and the centre).
  // WhatsApp consent and the WhatsApp channel move together (see _util.syncWhatsAppChannel), and
  // consent is only ever given on the WhatsApp page or in the Trust centre. So choosing WhatsApp in
  // setup is recorded as a request: the channel stays off until consent is given, and Settings and
  // the WhatsApp page point the member there.
  {
    const wa = read<{ consented?: boolean; requested?: boolean }>(ACCT('wa')) ?? {}
    const waConsented = wa.consented === true
    if (ob.channels?.whatsapp && !waConsented) write(ACCT('wa'), { ...wa, consented: false, requested: true })
    const cur: NotifPrefs = { ...DEFAULT_NOTIF_PREFS, ...(read<Partial<NotifPrefs>>(ACCT('notifs')) ?? {}) }
    const next: NotifPrefs = {
      ...cur,
      ...remindersToPrefs(ob.perDay ?? 2, cur),
      quietFrom: ob.quiet?.from || cur.quietFrom,
      quietTo: ob.quiet?.to || cur.quietTo,
      channels: ob.channels
        ? { ...cur.channels, push: ob.channels.app, whatsapp: ob.channels.whatsapp && waConsented, email: ob.channels.email }
        : cur.channels,
    }
    if (next.quietFrom === next.quietTo) next.quietTo = cur.quietTo === next.quietFrom ? DEFAULT_NOTIF_PREFS.quietTo : cur.quietTo
    write(ACCT('notifs'), next)
  }

  // Trust centre: the consents given in setup, plus the device consents for what was linked.
  if (ob.consents) {
    const cur = read<Record<string, { on: boolean; pending?: boolean }>>(ACCT('consents')) ?? {}
    const next: Record<string, { on: boolean; pending?: boolean }> = { ...cur, c_care: { on: ob.consents.care }, c_data: { on: ob.consents.data }, c_pub: { on: ob.consents.publishing } }
    for (const id of ob.linked ?? []) if (DEVICE_CONSENT[id]) next[DEVICE_CONSENT[id]] = { on: true }
    write(ACCT('consents'), next)
  }

  // Profile: the name given in setup (the AIWO ID contact is read straight from the record).
  const name = ob.account?.name?.trim()
  if (name) {
    const [first, ...rest] = name.split(/\s+/)
    const cur = read<Record<string, string>>(ACCT('profile')) ?? {}
    write(ACCT('profile'), { ...cur, firstName: first, lastName: rest.join(' ') })
  }

  write(SEEDED_KEY, ob.completedAt)
}

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}
