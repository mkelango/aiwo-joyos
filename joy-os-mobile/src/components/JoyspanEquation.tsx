import { Newsreader_300Light } from '@expo-google-fonts/newsreader/300Light'
import * as Font from 'expo-font'
import { useContext, useEffect, useState } from 'react'
import { Text, type StyleProp, type TextStyle } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { brand, palettes } from '../theme/tokens'
import { InkSurface } from './Text'

// The Joyspan equation (Playbook p44, p47): "Set once. Set verbatim. Forever."
//  · Verbatim, always: one line of copy, never edited for fit; fixed order, fixed capitals, the
//    true minus sign (U+2212), never a hyphen. It is a brand line, so it stays English in every
//    language of the app (same as the web kit, joy-os-web/src/components/joy/JoyspanEquation.tsx).
//  · Newsreader Roman 300 on Umber, Ink or Paper.
//  · The minus in Amber (on Paper) or Amber Light #E3A86E (on dark): the only colour in the line.
//  · One break only: before "Freedom" or before the minus, never inside a term. Every other
//    space is non-breaking.

const NB = ' '
export const JOYSPAN_EQUATION = 'Joyspan = Healthspan + Purpose + Relationships + Freedom + Daily Pleasure − Preventable Suffering'
const SPOKEN = 'Joyspan equals Healthspan plus Purpose plus Relationships plus Freedom plus Daily Pleasure minus Preventable Suffering'

// Newsreader Roman is only needed here, so it loads with the first equation, not at app start.
const SERIF_ROMAN = 'Newsreader_300Light'
function useSerifRoman() {
  const [ready, setReady] = useState(() => Font.isLoaded(SERIF_ROMAN))
  useEffect(() => {
    if (ready) return
    let alive = true
    Font.loadAsync({ [SERIF_ROMAN]: Newsreader_300Light })
      .then(() => alive && setReady(true))
      .catch(() => {
        /* keep the italic serif that is already loaded */
      })
    return () => {
      alive = false
    }
  }, [ready])
  return ready
}

export function JoyspanEquation({ size = 19, onDark, align, style }: {
  size?: number
  /** On an Ink or Umber ground in the light theme (the Index card back): Stone text, Amber Light minus.
   *  Defaults to true inside an Ink card (InkSurface). */
  onDark?: boolean
  align?: TextStyle['textAlign']
  style?: StyleProp<TextStyle>
}) {
  const { c, fonts, textScale } = useTheme()
  const inkGround = useContext(InkSurface)
  const dark = onDark ?? inkGround
  const roman = useSerifRoman()
  const fs = size * textScale
  const ink = dark ? brand.stone : c.ink
  const minus = dark ? palettes.dark.minusAmber : c.minusAmber
  return (
    <Text
      accessible
      accessibilityRole="text"
      accessibilityLabel={SPOKEN}
      maxFontSizeMultiplier={1.6}
      style={[{ fontFamily: roman ? SERIF_ROMAN : fonts.serifLightItalic, fontSize: fs, lineHeight: Math.round(fs * 1.4), color: ink, textAlign: align }, style]}
    >
      {`Joyspan${NB}=${NB}Healthspan${NB}+${NB}Purpose${NB}+${NB}Relationships${NB}+`}
      {/* break point 1: before Freedom */}
      {' '}
      {`Freedom${NB}+${NB}Daily${NB}Pleasure`}
      {/* break point 2: before the minus */}
      {' '}
      <Text style={{ color: minus }}>{'−'}</Text>
      {`${NB}Preventable${NB}Suffering`}
    </Text>
  )
}
