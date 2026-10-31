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
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useMemo } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { CrisisSheet } from '../src/components/CrisisSheet'
import { AppProvider } from '../src/lib/store'
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider'

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
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.paper } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="index-take" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="check" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="welcome" options={{ presentation: 'fullScreenModal' }} />
      </Stack>
      <CrisisSheet />
    </NavThemeProvider>
  )
}
