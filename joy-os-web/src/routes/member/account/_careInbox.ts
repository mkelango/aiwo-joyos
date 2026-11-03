import { TEAM } from '@/data/member'
import { PEOPLE_DETAIL, THREADS, type Msg, type Thread } from './_data'
import { ACCT_CHANGED } from './_prefs'
import { readPersisted } from './_util'

// CARE INBOX (K1). Other member screens hand a message to the care team here: VIVA's
// "Send to Priya" relays, VIVA's no-diagnosis routing to Dr Meera, the Day-90 change-time
// request, the Body Daily stack "Ask about this" and "Add to my Day 45 review". The message
// is appended to the same thread record Messages reads ('joyos:acct:threads'), so it shows in
// /app/care/messages with the right person, as the member's own message (a VIVA relay is
// marked as such). Specimen only: nothing leaves the browser.

export type CareRecipient = 'coach' | 'physician' | 'concierge'

export interface CareMessage {
  to: CareRecipient
  subject: string
  body: string
  /** 'viva' when VIVA relays it on the member's behalf (the member still sees it as theirs). */
  from: 'member' | 'viva'
  /** What it is about (a supplement, a review), kept with the message for the care team. */
  ref?: string
}

/** The person each recipient reaches in the specimen care team. */
export const CARE_PERSON: Record<CareRecipient, string> = { coach: 'p_priya', physician: 'p_meera', concierge: 'p_ravi' }

/** Fired after a hand-off is written, so an open Messages screen picks it up. */
export const CARE_INBOX_CHANGED = 'joyos:care-inbox'

const KEY = 'joyos:acct:threads'

/** "Now" in the specimen world (Thu 28 Jan 2027) at today's clock time, so new messages sit after the seeded ones. */
export const specimenNow = () => { const d = new Date(); return new Date(2027, 0, 28, d.getHours(), d.getMinutes(), d.getSeconds()).toISOString() }

export const isClinicalPerson = (id: string) => { const r = TEAM.find((m) => m.id === id)?.role; return r !== 'Coach' && r !== 'Concierge' }

/** Where the thread with this recipient opens (for the confirmation's link). */
export function careThreadHref(to: CareRecipient) {
  return `/app/care/messages?p=${CARE_PERSON[to]}`
}

/** The "replies within" line for a person, as a key Messages translates when it draws it. */
export function replyKey(personId: string): NonNullable<Msg['sys']>['k'] {
  if (isClinicalPerson(personId)) return 'replyClinical'
  return PEOPLE_DETAIL[personId]?.replies.startsWith('Replies the same day') ? 'replySame' : 'replyDay'
}

const shortName = (name: string) => (name.startsWith('Dr') ? name.split(' ').slice(0, 2).join(' ') : name.split(' ')[0])

/** An existing conversation keeps its own title (Dr Meera's 'January panel' stays that); only an
 *  empty or untitled thread takes the hand-off's subject, as Messages does for a first message. */
const keepSubject = (t: Thread) => t.messages.some((x) => x.from !== 'system') && t.subject !== 'New conversation'

/** Append a member message to the care thread with `m.to` (creating the thread if needed). */
export function postCareMessage(m: CareMessage): void {
  const personId = CARE_PERSON[m.to]
  const person = TEAM.find((p) => p.id === personId)
  const body = m.body.trim()
  if (!person || !body) return
  const list = readPersisted<{ list: Thread[] }>('threads')?.list ?? THREADS
  const now = Date.now()
  const at = specimenNow()
  const msg: Msg = { id: `new_${now}`, from: 'me', at, body, ...(m.from === 'viva' ? { via: 'viva' as const } : {}), ...(m.ref ? { ref: m.ref } : {}) }
  const sys: Msg = { id: `sys_${now}`, from: 'system', at, body: '', sys: { k: replyKey(personId), name: shortName(person.name) } }
  const subject = m.subject.trim() || 'New conversation'
  const existing = list.find((t) => t.personId === personId)
  const next: Thread[] = existing
    ? list.map((t) => (t.id === existing.id ? { ...t, subject: keepSubject(t) ? t.subject : subject, messages: [...t.messages.filter((x) => x.from !== 'system'), msg, sys] } : t))
    : [{ id: `t_${personId}`, personId, subject, unread: 0, clinical: isClinicalPerson(personId), messages: [msg, sys] }, ...list]
  try {
    localStorage.setItem(KEY, JSON.stringify({ list: next }))
  } catch {
    return /* storage unavailable: nothing was written, so nothing is announced */
  }
  try {
    window.dispatchEvent(new CustomEvent(ACCT_CHANGED, { detail: 'threads' }))
    window.dispatchEvent(new CustomEvent(CARE_INBOX_CHANGED))
  } catch {
    /* no DOM events: Messages reads the record on its next mount */
  }
}
