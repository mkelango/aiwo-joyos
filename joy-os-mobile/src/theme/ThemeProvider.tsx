import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { useApp } from '../lib/store'
import type { TermKey } from '../shared/types'
import { fonts, maxScale, motion, palettes, radius, resolveColor, space, termColors, tracking, type, type Palette, type Scheme } from './tokens'

export interface Theme {
  scheme: Scheme
  /** The palette for the active scheme. */
  c: Palette
  fonts: typeof fonts
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

/** Follows the system scheme; the member can override it in Settings (themePref). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme()
  const { themePref, textSize } = useApp()
  const scheme: Scheme = themePref === 'system' ? (system === 'dark' ? 'dark' : 'light') : themePref
  const value = useMemo<Theme>(() => {
    const c = palettes[scheme]
    return {
      scheme,
      c,
      fonts,
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
  }, [scheme, textSize])
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export function useTheme(): Theme {
  const v = useContext(ThemeCtx)
  if (!v) throw new Error('useTheme must be used inside <ThemeProvider>')
  return v
}
