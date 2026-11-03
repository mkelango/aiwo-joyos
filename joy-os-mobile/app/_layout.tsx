import { IBMPlexMono_300Light } from '@expo-google-fonts/ibm-plex-mono/300Light'
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular'
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium'
import { Newsreader_300Light_Italic } from '@expo-google-fonts/newsreader/300Light_Italic'
import { Newsreader_400Regular_Italic } from '@expo-google-fonts/newsreader/400Regular_Italic'
import { NunitoSans_300Light } from '@expo-google-fonts/nunito-sans/300Light'
import { NunitoSans_400Regular } from '@expo-google-fonts/nunito-sans/400Regular'
import { NunitoSans_500Medium } from '@expo-google-fonts/nunito-sans/500Medium'
import { NunitoSans_600SemiBold } from '@expo-google-fonts/nunito-sans/600SemiBold'
import { NunitoSans_700Bold } from '@expo-google-fonts/nunito-sans/700Bold'
import Feather from '@expo/vector-icons/Feather'
import { useFonts } from 'expo-font'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider, router, type ErrorBoundaryProps } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo, useState } from 'react'
import { Linking, Platform, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { CrisisSheet } from '../src/components/CrisisSheet'
import { LockScreen } from '../src/components/LockScreen'
import { sessionStore, useStore } from '../src/screens/b/bStore'
import { kit } from '../src/components/_i18n'
import { AppProvider, useApp, type Lang } from '../src/lib/store'
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider'
import { fonts, palettes, radius, space } from '../src/theme/tokens'

SplashScreen.preventAutoHideAsync().catch(() => {})

export default function RootLayout() {
  const [loaded, error] = useFonts({
    NunitoSans_300Light,
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    Newsreader_300Light_Italic,
    Newsreader_400Regular_Italic,
    IBMPlexMono_300Light,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    ...Feather.font,
  })

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {})
  }, [loaded, error])

  if (!loaded && !error) return null

  return (
    <SafeAreaProvider>
      <AppProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </AppProvider>
    </SafeAreaProvider>
  )
}

function RootNavigator() {
  const { scheme, c } = useTheme()
  const { lang, locked } = useApp()
  const [session] = useStore(sessionStore)
  // Biometric lock: only a signed-in member has anything to lock.
  const showLock = locked && session.signedIn
  // Web: tell the browser (and screen readers) which language the page is in.
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.documentElement.lang = lang === 'en' ? 'en' : `${lang}-IN`
  }, [lang])
  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme
    return {
      ...base,
      dark: scheme === 'dark',
      colors: { ...base.colors, primary: c.daybreak, background: c.paper, card: c.paper, text: c.ink, border: c.line, notification: c.daybreak },
    }
  }, [scheme, c])

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <View
        style={{ flex: 1 }}
        accessibilityElementsHidden={showLock}
        importantForAccessibility={showLock ? 'no-hide-descendants' : 'auto'}
        aria-hidden={showLock || undefined}
      >
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.paper } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="index-take" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="check" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="welcome" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="+not-found" />
        </Stack>
      </View>
      {showLock ? <LockScreen /> : <CrisisSheet />}
    </NavThemeProvider>
  )
}

/**
 * Error boundary (Plan §4A.5: a failed screen is never blank). expo-router renders this in place
 * of the root layout when any screen throws, so it cannot lean on the app's providers: it reads
 * the member's language and theme straight from the phone and draws a calm, branded fallback.
 * One Daybreak: try again. Never red; the crisis line stays one tap away.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const system = useColorScheme()
  const [lang, setLang] = useState<Lang>('en')
  const [pref, setPref] = useState<'system' | 'light' | 'dark'>('system')
  const [showDetail, setShowDetail] = useState(false)
  useEffect(() => {
    AsyncStorage.multiGet(['joyos:lang', 'joyos:themePref'])
      .then(([[, l], [, th]]) => {
        try {
          const lv = l ? JSON.parse(l) : null
          if (lv === 'ta' || lv === 'hi' || lv === 'en') setLang(lv)
          const tv = th ? JSON.parse(th) : null
          if (tv === 'light' || tv === 'dark' || tv === 'system') setPref(tv)
        } catch {
          /* keep the defaults */
        }
      })
      .catch(() => {})
  }, [])
  const scheme = pref === 'system' ? (system === 'dark' ? 'dark' : 'light') : pref
  const c = palettes[scheme]
  const t = (k: Parameters<typeof kit>[1]) => kit(lang, k)
  const goHome = () => {
    retry()
      .then(() => {
        try {
          router.replace('/')
        } catch {
          /* the navigator is back on its own */
        }
      })
      .catch(() => {})
  }
  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.gutter, paddingTop: 72, paddingBottom: space.s5, gap: space.s3, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
        <Text style={{ fontFamily: fonts.mono, fontSize: 12, letterSpacing: 1.7, color: c.ink2 }}>AIWO · JOY OS</Text>
        <View style={{ gap: space.s1 }}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 12, letterSpacing: 1.7, textTransform: 'uppercase', color: c.daybreakInk }}>{t('errEyebrow')}</Text>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.sansLight, fontSize: 32, lineHeight: 40, color: c.ink }}>
            {t('errTitleA')}
            <Text style={{ fontFamily: fonts.serifLightItalic }}>{t('errTitleSerif')}</Text>
            {t('errTitleB')}
          </Text>
          <Text style={{ fontFamily: fonts.sans, fontSize: 17, lineHeight: 25, color: c.ink2 }}>{t('errLead')}</Text>
        </View>
        <Pressable
          onPress={() => retry().catch(() => {})}
          accessibilityRole="button"
          accessibilityLabel={t('errRetry')}
          style={({ pressed }) => ({ minHeight: 56, borderRadius: radius.pill, backgroundColor: c.daybreak, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, opacity: pressed ? 0.9 : 1 })}
        >
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 19, color: c.daybreakLabel }}>{t('errRetry')}</Text>
        </Pressable>
        <Pressable
          onPress={goHome}
          accessibilityRole="button"
          accessibilityLabel={t('errHome')}
          style={({ pressed }) => ({ minHeight: 48, borderRadius: radius.pill, borderWidth: 1, borderColor: c.lineStrong, backgroundColor: c.paperRaised, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}
        >
          <Text style={{ fontFamily: fonts.sansSemi, fontSize: 17, color: c.ink }}>{t('errHome')}</Text>
        </Pressable>
        <View style={{ backgroundColor: c.paperSunk, borderRadius: radius.card, padding: space.s2, gap: space.s1 }}>
          <Pressable
            onPress={() => setShowDetail((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showDetail }}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: fonts.sansSemi, fontSize: 15, color: c.ink, textDecorationLine: 'underline' }}>{t('errDetail')}</Text>
          </Pressable>
          {showDetail ? <Text selectable style={{ fontFamily: fonts.mono, fontSize: 13, lineHeight: 19, color: c.ink2 }}>{error?.message || String(error)}</Text> : null}
        </View>
        <Pressable onPress={() => Linking.openURL('tel:14416').catch(() => {})} accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 22, color: c.ink2, textDecorationLine: 'underline' }}>{t('errCrisis')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}
