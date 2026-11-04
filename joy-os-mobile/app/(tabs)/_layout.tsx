import { Redirect } from 'expo-router'
import { Tabs } from 'expo-router/js-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, type IconName } from '../../src/components/Icon'
import { JoyIcon, type JoyIconName } from '../../src/components/JoyIcons'
import { useT } from '../../src/lib/i18n'
import { sessionStore, useStore } from '../../src/screens/b/bStore'
import { useTheme } from '../../src/theme/ThemeProvider'

// Five tabs (Technical Architecture): Today · Spaces · ’Cation · Practice · Care.
// Joy OS's own objects take the brand icon set (Playbook p51: ’Cation, Practice); the rest are
// the line icons, all at 1.5 px with round caps.
type TabIcon = { joy: JoyIconName } | { line: IconName }
const TABS: { name: string; key: 'today' | 'spaces' | 'cation' | 'practice' | 'care'; icon: TabIcon }[] = [
  { name: 'index', key: 'today', icon: { line: 'sun' } },
  { name: 'spaces', key: 'spaces', icon: { line: 'aperture' } },
  { name: 'cation', key: 'cation', icon: { joy: 'cation' } },
  { name: 'practice', key: 'practice', icon: { joy: 'practice' } },
  { name: 'care', key: 'care', icon: { line: 'heart' } },
]

export default function TabLayout() {
  const { c, fonts, step, script } = useTheme()
  const t = useT()
  const insets = useSafeAreaInsets()
  const [session] = useStore(sessionStore)
  // Tamil and Hindi labels: one step larger (12 → 13) with +10% leading (Playbook p40).
  const labelSize = step(12)
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
        tabBarLabelStyle: { fontFamily: fonts.sansSemi, fontSize: labelSize, lineHeight: Math.round(labelSize * (16 / 12) * script.leading) },
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
            tabBarIcon: ({ color }) => {
              const col = typeof color === 'string' ? color : undefined
              return 'joy' in tab.icon ? <JoyIcon name={tab.icon.joy} size={22} color={col} /> : <Icon name={tab.icon.line} size={22} color={col} />
            },
          }}
        />
      ))}
    </Tabs>
  )
}
