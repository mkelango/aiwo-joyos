import { sessionStore, useStore } from '../screens/b/bStore'
import { isMinor, onboardingAccountStore } from './onboardingAccount'

// Minors gate (Architecture: "no scoring; verifiable parental consent"), shared contract M2.
// The age is answered on onboarding's AIWO ID step and kept on the phone. It applies to the
// account made in onboarding; signing in to a specimen account (Arjun, Lakshmi) is an adult.
// Screens that show a score, a band, a delta or a Wheel value hide it while this is true and
// say, calmly, that nothing is scored under 18.

export function useIsMinor(): boolean {
  const [account] = useStore(onboardingAccountStore)
  const [session] = useStore(sessionStore)
  // session.account arrives with the demo accounts (M1); before that, the onboarding answer stands.
  const who = (session as { account?: string }).account
  return isMinor(account) && (who === undefined || who === 'new')
}
