import { Mukta_300Light } from '@expo-google-fonts/mukta/300Light'
import { Mukta_400Regular } from '@expo-google-fonts/mukta/400Regular'
import { Mukta_500Medium } from '@expo-google-fonts/mukta/500Medium'
import { Mukta_600SemiBold } from '@expo-google-fonts/mukta/600SemiBold'
import { Mukta_700Bold } from '@expo-google-fonts/mukta/700Bold'
import { MuktaMalar_300Light } from '@expo-google-fonts/mukta-malar/300Light'
import { MuktaMalar_400Regular } from '@expo-google-fonts/mukta-malar/400Regular'
import { MuktaMalar_500Medium } from '@expo-google-fonts/mukta-malar/500Medium'
import { MuktaMalar_600SemiBold } from '@expo-google-fonts/mukta-malar/600SemiBold'
import { MuktaMalar_700Bold } from '@expo-google-fonts/mukta-malar/700Bold'
import { NotoSerifTamil_300Light_Italic } from '@expo-google-fonts/noto-serif-tamil/300Light_Italic'
import { NotoSerifTamil_400Regular_Italic } from '@expo-google-fonts/noto-serif-tamil/400Regular_Italic'
import { TiroDevanagariHindi_400Regular_Italic } from '@expo-google-fonts/tiro-devanagari-hindi/400Regular_Italic'
import * as Font from 'expo-font'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { useApp } from '../lib/store'
import type { TermKey } from '../shared/types'
import { fonts, indicFonts, indicStep, type FontSet, indicType, maxScale, motion, palettes, radius, resolveColor, type Script, space, termColors, tracking, type, type Palette, type Scheme, vizColors, vizSeriesColor, type VizColors } from './tokens'

export { scriptFamily, scriptOfText, type Script } from './tokens'

export interface Theme {
  scheme: Scheme
  /** The palette for the active scheme. */
  c: Palette
  /** Font families for the member's language: Mukta Malar (Tamil) or Mukta (Hindi) for sans and serif. */
  fonts: FontSet
  /** True in Tamil and Hindi: reading text is set one step larger with +10% leading. */
  indic: boolean
  /** Size and leading multipliers for reading text (1 in English). */
  script: { scale: number; leading: number }
  /** The app language's script ('ta' or 'hi'), or null in English. */
  scriptLang: Script | null
  /** Which script sets have loaded. Both load at start, so Tamil shown in English (the
   *  Thirukkural, a language picker's தமிழ்) still draws in its own face. */
  scripts: Record<Script, boolean>
  /** The family for a role in a given script, in any app language. Until that set is in, the
   *  role's current family stands and the phone draws the glyphs for that moment. */
  scriptFamily: (s: Script, role: keyof FontSet) => string
  /** A label size one step up in Tamil and Hindi (eyebrow 12→13, Daybreak 19→20, tab bar
   *  12→13); the size itself in English. Pair it with script.leading for the line height. */
  step: (pt: number) => number
  /** Neutral chart colours for non-term series (Ink, Slate, Bronze, Mist). Never the Spectrum. */
  viz: VizColors
  /** The nth non-term line series colour: Ink, Slate, Bronze, then wraps. */
  vizSeries: (n: number) => string
  type: typeof type
  tracking: typeof tracking
  space: typeof space
  radius: typeof radius
  motion: typeof motion
  maxScale: typeof maxScale
  /** In-app text size preference on top of the system Dynamic Type setting. */
  textScale: number
  /** Resolve 'var(--term-r)' strings from the shared data files to a colour. */
  resolve: (cssVarOrColour: string) => string
  /** Spectrum main / soft / ink colours for a term. */
  term: (k: TermKey) => { main: string; soft: string; ink: string }
}

const ThemeCtx = createContext<Theme | null>(null)

const TEXT_SCALE = { default: 1, large: 1.125, xlarge: 1.25 } as const

// Both script sets load at start, whatever the language: Tamil and Hindi appear outside their own
// mode (the Thirukkural on Practice, தமிழ் and हिन्दी in the language pickers), and a sample in the
// phone's system font would misdraw the brand. Until a set is in, the Latin families stay, and the
// phone draws the Indic glyphs with its own font for that moment.
const SCRIPT_FONTS = {
  ta: { MuktaMalar_300Light, MuktaMalar_400Regular, MuktaMalar_500Medium, MuktaMalar_600SemiBold, MuktaMalar_700Bold, NotoSerifTamil_300Light_Italic, NotoSerifTamil_400Regular_Italic },
  hi: { Mukta_300Light, Mukta_400Regular, Mukta_500Medium, Mukta_600SemiBold, Mukta_700Bold, TiroDevanagariHindi_400Regular_Italic },
} as const
const scriptLoaded = (l: 'ta' | 'hi') => Object.keys(SCRIPT_FONTS[l]).every((n) => Font.isLoaded(n))

function useScriptFonts() {
  const [ready, setReady] = useState<Record<Script, boolean>>(() => ({ ta: scriptLoaded('ta'), hi: scriptLoaded('hi') }))
  useEffect(() => {
    let alive = true
    for (const l of ['ta', 'hi'] as const) {
      if (scriptLoaded(l)) continue
      Font.loadAsync(SCRIPT_FONTS[l])
        .then(() => alive && setReady((r) => ({ ...r, [l]: true })))
        .catch(() => {
          /* keep the system font */
        })
    }
    return () => {
      alive = false
    }
  }, [])
  return ready
}

/** Follows the system scheme; the member can override it in Settings (themePref). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const { themePref, textSize, lang } = useApp()
  const scripts = useScriptFonts()
  const scheme: Scheme = themePref === 'system' ? (system === 'dark' ? 'dark' : 'light') : themePref
  const value = useMemo<Theme>(() => {
    const c = palettes[scheme]
    const scriptLang: Script | null = lang === 'ta' || lang === 'hi' ? lang : null
    const indic = scriptLang !== null
    const set: FontSet = scriptLang && scripts[scriptLang] ? indicFonts[scriptLang] : fonts
    return {
      scheme,
      c,
      fonts: set,
      indic,
      script: indic ? indicType : { scale: 1, leading: 1 },
      scriptLang,
      scripts,
      scriptFamily: (s, role) => (scripts[s] ? indicFonts[s][role] : set[role]),
      step: (pt) => (indic ? indicStep(pt) : pt),
      viz: vizColors(c),
      vizSeries: (n) => vizSeriesColor(c, n),
      type,
      tracking,
      space,
      radius,
      motion,
      maxScale,
      textScale: TEXT_SCALE[textSize],
      resolve: (v) => resolveColor(c, v),
      term: (k) => termColors(c, k),
    }
  }, [scheme, textSize, lang, scripts])
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export function useTheme(): Theme {
  const v = useContext(ThemeCtx)
  if (!v) throw new Error('useTheme must be used inside <ThemeProvider>')
  return v
}
