import { Redirect } from 'expo-router'
import { Tabs } from 'expo-router/js-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, type IconName } from '../../src/components/Icon'
import { useT } from '../../src/lib/i18n'
import { sessionStore, useStore } from '../../src/screens/b/bStore'
import { useTheme } from '../../src/theme/ThemeProvider'

// Five tabs (Technical Architecture): Today · Spaces · ’Cation · Practice · Care.
const TABS: { name: string; key: 'today' | 'spaces' | 'cation' | 'practice' | 'care'; icon: IconName }[] = [
  { name: 'index', key: 'today', icon: 'sun' },
  { name: 'spaces', key: 'spaces', icon: 'aperture' },
  { name: 'cation', key: 'cation', icon: 'map' },
  { name: 'practice', key: 'practice', icon: 'book-open' },
  { name: 'care', key: 'care', icon: 'heart' },
]

export default function TabLayout() {
  const { c, fonts } = useTheme()
  const t = useT()
  const insets = useSafeAreaInsets()
  const [session] = useStore(sessionStore)
  // Signed out (Settings or Profile → Sign out): the member tabs are closed until the member
  // signs in again or finishes onboarding. Wait for the stored session before deciding.
  if (sessionStore.hydrated() && !session.signedIn) return <Redirect href="/welcome" />
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.ink,
        tabBarInactiveTintColor: c.ink3,
        tabBarStyle: { backgroundColor: c.paper, borderTopColor: c.line, borderTopWidth: 1, elevation: 0, height: 70 + insets.bottom, paddingTop: 6, paddingBottom: Math.max(8, insets.bottom) },
        tabBarLabelStyle: { fontFamily: fonts.sansSemi, fontSize: 12, lineHeight: 16 },
        tabBarAllowFontScaling: true,
        sceneStyle: { backgroundColor: c.paper },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.key),
            tabBarAccessibilityLabel: t(tab.key),
            tabBarIcon: ({ color }) => <Icon name={tab.icon} size={22} color={typeof color === "string" ? color : undefined} />,
          }}
        />
      ))}
    </Tabs>
  )
}
