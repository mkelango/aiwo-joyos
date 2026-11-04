import { createContext, useContext, type ReactNode } from 'react'
import { Text as RNText, type StyleProp, type TextProps, type TextStyle } from 'react-native'
import { MonoNums } from '../lib/monoNums'
import { useTheme } from '../theme/ThemeProvider'
import { indicStep, indicType, palettes, scriptOfText, type FontSet, type Script } from '../theme/tokens'

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

/**
 * The Indic script a run of text is written in (Tamil or Devanagari), if any. Text in a script
 * takes that script's face in every app language: the Thirukkural on Practice and தமிழ் / हिन्दी in
 * the language pickers draw in Mukta Malar and Mukta while the app is in English. Letter-spacing
 * breaks their joined shapes, so tracking is dropped for them.
 */
function scriptOf(children: ReactNode): Script | null {
  if (typeof children === 'string') return scriptOfText(children)
  if (Array.isArray(children)) {
    for (const c of children) {
      const s = typeof c === 'string' ? scriptOfText(c) : null
      if (s) return s
    }
  }
  return null
}

/** The family for a role: the text's own script when it is Tamil or Devanagari, else the app's set. */
function useFamily(children: ReactNode) {
  const t = useTheme()
  const s = scriptOf(children)
  return { script: s, family: (role: keyof FontSet) => (s ? t.scriptFamily(s, role) : t.fonts[role]) }
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
  const f = useFamily(children)
  // Tamil and Hindi: one step larger, +10% leading (t.script is 1 in English; Indic text in
  // English takes the step too, as it is the script that sets larger, not the language).
  const sc = f.script ? indicType : t.script
  const fs = (size ?? t.type.body) * t.textScale * sc.scale
  const family = f.family(({ light: 'sansLight', regular: 'sans', medium: 'sansMedium', semibold: 'sansSemi', bold: 'sansBold' } as const)[weight])
  return (
    <RNText
      maxFontSizeMultiplier={t.maxScale.body}
      {...rest}
      style={[{ fontFamily: family, fontSize: fs, lineHeight: Math.round(fs * 1.45 * sc.leading), color: color ?? col, textAlign: align }, style]}
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

/** Eyebrow / kicker — IBM Plex Mono caps, 12pt, +14% tracking. In Tamil and Hindi one step
 *  larger (12→13, as the web's .eyebrow) with +10% leading. */
export function Eyebrow({ children, tone = 'ink3', color, size, style, align, ...rest }: BaseProps) {
  const t = useTheme()
  const col = useToneColor(tone)
  const f = useFamily(children)
  const indic = !!f.script
  const base = size ?? t.type.label
  const fs = (indic || t.indic ? indicStep(base) : base) * t.textScale
  return (
    <RNText
      maxFontSizeMultiplier={t.maxScale.label}
      {...rest}
      style={[
        // IBM Plex Mono has no Tamil or Devanagari: an Indic label takes the script's sans.
        { fontFamily: indic ? f.family('sansSemi') : t.fonts.mono, fontSize: fs, lineHeight: Math.round(fs * (indic ? 1.7 : 1.5 * t.script.leading)), letterSpacing: indic ? 0 : fs * 0.14, textTransform: 'uppercase', color: color ?? col, textAlign: align },
        style,
      ]}
    >
      {/* An Indic label is in the script's sans, so its figures ("நாள் 40") are set back in Mono. */}
      {indic && typeof children === 'string' ? <MonoNums text={children} /> : children}
    </RNText>
  )
}

/** Numeral — IBM Plex Mono 300, tabular. Every measurement; never bold. */
export function Numeral({ children, tone = 'ink', color, size = 96, style, align, weight = 'light', ...rest }: BaseProps & { weight?: 'light' | 'regular' | 'medium' }) {
  const t = useTheme()
  const col = useToneColor(tone)
  const fs = size * t.textScale
  const f = useFamily(children)
  // Words in Tamil or Devanagari inside a mono run (a translated "Day 15") take the script's sans.
  const family = f.script ? f.family('sans') : weight === 'light' ? t.fonts.monoLight : weight === 'medium' ? t.fonts.monoMedium : t.fonts.mono
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
  const f = useFamily(children)
  return <RNText style={[{ fontFamily: f.family('serifItalic'), fontSize: size ? size * t.textScale : undefined, color }, style]}>{children}</RNText>
}

/** Headline — Nunito Sans Light. One per screen via ScreenHeader; also card headlines. */
export function Title({ children, tone = 'ink', color, size, style, align, ...rest }: BaseProps) {
  const t = useTheme()
  const col = useToneColor(tone)
  const f = useFamily(children)
  const sc = f.script ? indicType : t.script
  const fs = (size ?? t.type.heading) * t.textScale * sc.scale
  return (
    <RNText
      maxFontSizeMultiplier={t.maxScale.body}
      {...rest}
      style={[{ fontFamily: f.family('sansLight'), fontSize: fs, lineHeight: Math.round(fs * 1.22 * sc.leading), letterSpacing: f.script ? 0 : -fs * 0.01, color: color ?? col, textAlign: align }, style]}
    >
      {children}
    </RNText>
  )
}

/**
 * Text set in a given script whatever the app language: the Thirukkural verse, a language
 * picker's native name and sample line. Sans (Mukta Malar / Mukta) or the script's serif italic
 * (Noto Serif Tamil / Tiro Devanagari Hindi), one step larger with +10% leading (Playbook p41).
 * Body, Title and Eyebrow already pick the face from the text itself; use this when the run
 * must take a script's face for sure, or for the serif face (face="serif").
 */
export function ScriptText({ script, face = 'sans', weight = 'regular', children, tone = 'ink', color, size, style, align, ...rest }: BaseProps & { script: Script; face?: 'sans' | 'serif'; weight?: Weight }) {
  const t = useTheme()
  const col = useToneColor(tone)
  const fs = (size ?? t.type.body) * t.textScale * indicType.scale
  const key: keyof FontSet =
    face === 'serif' ? (weight === 'light' ? 'serifLightItalic' : 'serifItalic') : ({ light: 'sansLight', regular: 'sans', medium: 'sansMedium', semibold: 'sansSemi', bold: 'sansBold' } as const)[weight]
  return (
    <RNText
      maxFontSizeMultiplier={t.maxScale.body}
      accessibilityLanguage={script}
      {...rest}
      style={[{ fontFamily: t.scriptFamily(script, key), fontSize: fs, lineHeight: Math.round(fs * 1.45 * indicType.leading), color: color ?? col, textAlign: align }, style]}
    >
      {children}
    </RNText>
  )
}
