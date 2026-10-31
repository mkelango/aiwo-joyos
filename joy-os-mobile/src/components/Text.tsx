import { createContext, useContext, type ReactNode } from 'react'
import { Text as RNText, type StyleProp, type TextProps, type TextStyle } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { palettes } from '../theme/tokens'

// Typography for Joy OS. "Sans for life, serif for joy, mono for measure."
// Every component honours Dynamic Type (allowFontScaling, capped per role) and the
// in-app text size preference (theme.textScale).

export type Tone = 'ink' | 'ink2' | 'ink3' | 'daybreak' | 'error' | 'onInk'

/** Set by <Card tone="ink"> so text on an Ink ground flips to light ink colours. */
export const InkSurface = createContext(false)

export function useToneColor(tone: Tone): string {
  const { c } = useTheme()
  const onInk = useContext(InkSurface)
  // On an Ink ground use the dark palette's text colours, whatever the scheme.
  const p = onInk ? palettes.dark : c
  switch (tone) {
    case 'ink':
    case 'onInk':
      return onInk ? p.ink : tone === 'onInk' ? c.onInk : c.ink
    case 'ink2':
      return p.ink2
    case 'ink3':
      return p.ink3
    case 'daybreak':
      return p.daybreakInk
    case 'error':
      return c.error
  }
}

/** Tamil or Devanagari text. Letter-spacing breaks their joined shapes, so tracking is dropped. */
const INDIC = /[\u0900-\u097F\u0B80-\u0BFF]/
function hasIndic(children: ReactNode): boolean {
  if (typeof children === 'string') return INDIC.test(children)
  if (Array.isArray(children)) return children.some((c) => typeof c === 'string' && INDIC.test(c))
  return false
}

type Weight = 'light' | 'regular' | 'medium' | 'semibold' | 'bold'

interface BaseProps extends Omit<TextProps, 'style'> {
  children?: ReactNode
  tone?: Tone
  /** Explicit colour (e.g. a term ink colour). Overrides tone. */
  color?: string
  size?: number
  style?: StyleProp<TextStyle>
  align?: TextStyle['textAlign']
}

/** Body copy — Nunito Sans, 17pt minimum for reading text. Use size 15 only for meta. */
export function Body({ children, tone = 'ink', color, size, weight = 'regular', style, align, ...rest }: BaseProps & { weight?: Weight }) {
  const t = useTheme()
  const col = useToneColor(tone)
  const fs = (size ?? t.type.body) * t.textScale
  const family = { light: t.fonts.sansLight, regular: t.fonts.sans, medium: t.fonts.sansMedium, semibold: t.fonts.sansSemi, bold: t.fonts.sansBold }[weight]
  return (
    <RNText
      maxFontSizeMultiplier={t.maxScale.body}
      {...rest}
      style={[{ fontFamily: family, fontSize: fs, lineHeight: Math.round(fs * 1.45), color: color ?? col, textAlign: align }, style]}
    >
      {children}
    </RNText>
  )
}

/** Secondary / meta copy (15pt). Never for reading text. */
export function Meta(props: BaseProps & { weight?: Weight }) {
  const t = useTheme()
  return <Body tone="ink2" {...props} size={props.size ?? t.type.meta} />
}

/** Eyebrow / kicker — IBM Plex Mono caps, 12pt, +14% tracking. */
export function Eyebrow({ children, tone = 'ink3', color, size, style, align, ...rest }: BaseProps) {
  const t = useTheme()
  const col = useToneColor(tone)
  const fs = (size ?? t.type.label) * t.textScale
  const indic = hasIndic(children)
  return (
    <RNText
      maxFontSizeMultiplier={t.maxScale.label}
      {...rest}
      style={[
        { fontFamily: t.fonts.mono, fontSize: fs, lineHeight: Math.round(fs * (indic ? 1.7 : 1.5)), letterSpacing: indic ? 0 : fs * 0.14, textTransform: 'uppercase', color: color ?? col, textAlign: align },
        style,
      ]}
    >
      {children}
    </RNText>
  )
}

/** Numeral — IBM Plex Mono 300, tabular. Every measurement; never bold. */
export function Numeral({ children, tone = 'ink', color, size = 96, style, align, weight = 'light', ...rest }: BaseProps & { weight?: 'light' | 'regular' | 'medium' }) {
  const t = useTheme()
  const col = useToneColor(tone)
  const fs = size * t.textScale
  const family = weight === 'light' ? t.fonts.monoLight : weight === 'medium' ? t.fonts.monoMedium : t.fonts.mono
  return (
    <RNText
      maxFontSizeMultiplier={size >= 40 ? t.maxScale.numeral : t.maxScale.body}
      {...rest}
      style={[
        { fontFamily: family, fontSize: fs, lineHeight: Math.round(fs * (size >= 40 ? 1.02 : 1.4)), letterSpacing: size >= 40 ? -fs * 0.03 : 0, color: color ?? col, fontVariant: ['tabular-nums'], textAlign: align },
        style,
      ]}
    >
      {children}
    </RNText>
  )
}

/** Mono inline figure at reading sizes (scores in rows, dates, D-numbers). */
export function Mono(props: BaseProps & { weight?: 'light' | 'regular' | 'medium' }) {
  const t = useTheme()
  return <Numeral weight="regular" {...props} size={props.size ?? t.type.meta} />
}

/** Newsreader italic — the one joy word in a headline. Nest inside Body/Title; inherits size. */
export function Serif({ children, size, color, style }: { children: ReactNode; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  const t = useTheme()
  return <RNText style={[{ fontFamily: t.fonts.serifItalic, fontSize: size ? size * t.textScale : undefined, color }, style]}>{children}</RNText>
}

/** Headline — Nunito Sans Light. One per screen via ScreenHeader; also card headlines. */
export function Title({ children, tone = 'ink', color, size, style, align, ...rest }: BaseProps) {
  const t = useTheme()
  const col = useToneColor(tone)
  const fs = (size ?? t.type.heading) * t.textScale
  return (
    <RNText
      maxFontSizeMultiplier={t.maxScale.body}
      {...rest}
      style={[{ fontFamily: t.fonts.sansLight, fontSize: fs, lineHeight: Math.round(fs * 1.22), letterSpacing: -fs * 0.01, color: color ?? col, textAlign: align }, style]}
    >
      {children}
    </RNText>
  )
}
