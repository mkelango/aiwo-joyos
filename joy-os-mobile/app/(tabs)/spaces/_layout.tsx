import { Stack } from 'expo-router'
import { useTheme } from '../../../src/theme/ThemeProvider'

// Stack inside the tab so detail screens keep the tab bar. Foundation-owned.
// A detail screen opened directly (deep link, reload) still has the hub beneath it, so its
// Back control returns to the hub rather than to Today.
export const unstable_settings = { anchor: 'index' }

export default function TabStackLayout() {
  const { c } = useTheme()
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.paper } }} />
}
