// Which Joy OS keys on a phone prove that someone was signed in on it (M1 signed-out gate).
// No imports, so the session store (bStore) and the launch check (onboardingAccount) can both
// read it without a cycle.
//
// Every launch writes the app's own settings ('joyos:themePref', 'joyos:lang' and the rest),
// and a signed-out phone writes more: the onboarding draft, its layout and AIWO ID, the
// household invitations and reminder choices made in onboarding, a reply to the Letter, the
// Check, the device-security demo. None of those says a member was ever signed in. Only the
// stores of member-only screens (and of sign-in itself) do. The same list as bStore's
// SESSION_PROOF, which decides the session's first guess.

/** Where bStore keeps the session (its 'joyos:b:' prefix plus 'session'). */
export const SESSION_STORAGE_KEY = 'joyos:b:session'

/** Lane B stores only a signed-in member's screens write (Trust, Messages, Settings, Devices…). */
const MEMBER_ONLY = new Set([
  'trust', 'consentHistory', 'accountSnapshots', 'messages', 'notifRead', 'practice', 'nominee', 'abha',
  'a11y', 'lock', 'devices', 'householdKind', 'charter', 'occasions', 'circleReports',
])

/** True when this key is only ever written by a signed-in member's screens. */
export function provesSession(key: string): boolean {
  return key.startsWith('joyos:b:') && MEMBER_ONLY.has(key.slice('joyos:b:'.length))
}
