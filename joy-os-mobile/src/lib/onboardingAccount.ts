import { createStore, onboardingStore } from '../screens/b/bStore'

// The AIWO ID made during onboarding (Plan §4B: welcome → AIWO ID → …). Specimen: no real
// account is created and nothing leaves the phone; the passkey and the one-time code are
// simulated. Kept on the phone so the flow resumes, Begin shows the ID, and Sign in knows it.

export type ContactVia = 'phone' | 'email'
export interface OnboardingAccount {
  name: string
  via: ContactVia
  phone: string
  email: string
  verified: null | 'passkey' | 'code'
  /** Issued once the ID is secured; shape AIWO-XXXX-XXXX like every AIWO ID. */
  aiwoId: string | null
  /** Household invitations made in onboarding (ids in the account store's invites). */
  invited: string[]
  /** Minors gate (Architecture: "no scoring; verifiable parental consent"). Null until answered. */
  age: null | 'adult' | 'minor'
  /** A parent or guardian's consent, verified by a code sent to their phone. Specimen. */
  guardian: GuardianConsent
}

export interface GuardianConsent {
  name: string
  phone: string
  /** sent: a code went to the guardian's phone · verified: they read it back. */
  status: null | 'sent' | 'verified'
  at?: string
}

export const EMPTY_GUARDIAN: GuardianConsent = { name: '', phone: '', status: null }

export const onboardingAccountStore = createStore<OnboardingAccount>('onbAccount', {
  name: '',
  via: 'phone',
  phone: '',
  email: '',
  verified: null,
  aiwoId: null,
  invited: [],
  age: null,
  guardian: EMPTY_GUARDIAN,
})

/** A member who said they are under 18: never scored, and only with a guardian's verified consent. */
export const isMinor = (a: Pick<OnboardingAccount, 'age'>) => a.age === 'minor'

/** The specimen code the guardian "receives" (shown on screen in the specimen). */
export const GUARDIAN_CODE = '418203'

/** Guardian problems as message keys, so the screen can translate them. */
export function guardianProblems(g: GuardianConsent) {
  const out: { name?: 'mgErrName'; phone?: 'mgErrPhone' } = {}
  if (g.name.trim().length < 2) out.name = 'mgErrName'
  const d = g.phone.replace(/\D/g, '')
  if (!(d.length === 10 || (d.length === 12 && d.startsWith('91')))) out.phone = 'mgErrPhone'
  return out
}

// ─── Onboarding step layout ───────────────────────────────────────────────
// The draft saves its step as an index. The first layout had six steps (Language, Intent,
// Consents, Device, Quiet hours, Begin); layout 2 adds AIWO ID after Language and Household
// before Begin. A draft saved on this phone under layout 1 is moved to the same step by name,
// once, so it resumes where the member actually left off.
export const ONB_LAYOUT = 2
const LAYOUT1_TO_2 = [0, 2, 3, 4, 5, 7]
export const onboardingLayoutStore = createStore<{ v: number }>('onbLayout', { v: 1 })

/** Runs once every store involved has been read. True once the draft is on the current layout. */
export function migrateOnboardingDraft(): boolean {
  if (!onboardingStore.hydrated() || !onboardingLayoutStore.hydrated() || !onboardingAccountStore.hydrated()) return false
  if (onboardingLayoutStore.get().v >= ONB_LAYOUT) return true
  const d = onboardingStore.get()
  const a = onboardingAccountStore.get()
  // Anything on the AIWO ID step means the draft was already made under layout 2.
  const madeUnderLayout2 = !!(a.name || a.phone || a.email || a.verified || a.aiwoId || a.invited.length)
  if (d.started && !d.completedAt && d.step > 0 && !madeUnderLayout2) {
    onboardingStore.set({ ...d, step: LAYOUT1_TO_2[Math.min(d.step, LAYOUT1_TO_2.length - 1)] })
  }
  onboardingLayoutStore.set({ v: ONB_LAYOUT })
  return true
}
// Migrate as soon as storage has been read, before any screen can resume the draft.
for (const st of [onboardingStore, onboardingLayoutStore, onboardingAccountStore] as const) {
  const off = st.subscribe(() => {
    if (migrateOnboardingDraft()) off()
  })
}

const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const block = () => Array.from({ length: 4 }, () => ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]).join('')
export const newAiwoId = () => `AIWO-${block()}-${block()}`

const digits = (s: string) => s.replace(/\D/g, '')
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Field problems as message keys, so the screen can translate them. */
export function accountProblems(a: OnboardingAccount) {
  const out: { name?: 'acErrName'; contact?: 'acErrPhone' | 'acErrEmail' | 'acErrEmailShape' } = {}
  if (a.name.trim().length < 2) out.name = 'acErrName'
  if (a.via === 'phone') {
    const d = digits(a.phone)
    if (!(d.length === 10 || (d.length === 12 && d.startsWith('91')))) out.contact = 'acErrPhone'
  } else if (!a.email.trim()) out.contact = 'acErrEmail'
  else if (!EMAIL_RE.test(a.email.trim())) out.contact = 'acErrEmailShape'
  return out
}

/** "+91 98400 12345" or the email, as typed. */
export function contactLabel(a: OnboardingAccount) {
  if (a.via === 'email') return a.email.trim()
  const d = digits(a.phone).slice(-10)
  return d.length === 10 ? `+91 ${d.slice(0, 5)} ${d.slice(5)}` : a.phone.trim()
}
