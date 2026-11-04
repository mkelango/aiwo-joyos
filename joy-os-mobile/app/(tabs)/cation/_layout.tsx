import { Stack } from 'expo-router'
import { useReduceMotion } from '../../../src/lib/store'
import { useTheme } from '../../../src/theme/ThemeProvider'
import { motion } from '../../../src/theme/tokens'

// Stack inside the tab so detail screens keep the tab bar. Foundation-owned.
// Under Reduce Motion a push fades instead of sliding (Playbook p53), over 120 ms where the
// platform lets the duration be set (iOS; Android keeps its own short fade).
// A detail screen opened directly (deep link, reload) still has the hub beneath it, so its
// Back control returns to the hub rather than to Today.
export const unstable_settings = { anchor: 'index' }

export default function TabStackLayout() {
  const { c } = useTheme()
  const reduce = useReduceMotion()
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.paper }, ...(reduce ? { animation: 'fade' as const, animationDuration: motion.d1 } : null) }} />
}
