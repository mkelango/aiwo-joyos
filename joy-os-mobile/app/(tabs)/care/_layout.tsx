import { Stack } from 'expo-router'
import { useTheme } from '../../../src/theme/ThemeProvider'

// Stack inside the tab so detail screens keep the tab bar. Foundation-owned.
export default function TabStackLayout() {
  const { c } = useTheme()
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.paper } }} />
}
