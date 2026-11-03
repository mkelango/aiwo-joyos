import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useReduceMotion } from '../lib/store'
import { useTheme } from '../theme/ThemeProvider'
import { EASE_BRAND, fonts, motion } from '../theme/tokens'
import { WORDMARK_PARTS, WORDMARK_VIEWBOX } from './Wordmark'

// The animated mark (Playbook p53): "2.4 s · once per session" on the daybreak duration token.
//   0.0 s  Stroke    — the slanted Stroke draws down, in Daybreak.
//   0.8 s  A rises   — the A rises into place beside it.
//   1.6 s  Settle    — W and the leaning O settle in; the Stroke settles to Ink.
//   2.4 s  The line  — "Years Worth Living." arrives under the mark.
// Played over the first screen once per app session (once per browser tab on the web export),
// never under Reduce Motion (the system's or the member's own). A tap skips it. Decorative:
// hidden from screen readers, so VoiceOver and TalkBack go straight to the screen beneath.
// The same sequence as the web kit (joy-os-web/src/components/joy/DaybreakMark.tsx).

/** The brand line under the mark. A brand line: English in every language. */
export const BRAND_LINE = 'Years Worth Living.'

const S = motion.daybreak / 3 // 800 ms per phase
const ease = Easing.bezier(...EASE_BRAND)
const SESSION_KEY = 'joyos:daybreak:played'

// A native app session is the life of the JS runtime; the web export uses sessionStorage.
let playedInRuntime = false
function playedThisSession() {
  if (playedInRuntime) return true
  if (Platform.OS === 'web') {
    try {
      return window.sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {
      return true // no session storage: do not risk replaying on every load
    }
  }
  return false
}
function markPlayed() {
  playedInRuntime = true
  if (Platform.OS === 'web') {
    try {
      window.sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* ignore */
    }
  }
}

export function DaybreakMark({ onDone }: { onDone?: () => void }) {
  const { c } = useTheme()
  const reduce = useReduceMotion()
  const { width: winW } = useWindowDimensions()
  const [show, setShow] = useState(() => !playedThisSession())
  const { w, h } = WORDMARK_VIEWBOX
  const markW = Math.min(winW * 0.64, 340)
  const markH = (markW * h) / w
  const k = markH / h // viewBox units → points

  const draw = useRef(new Animated.Value(0)).current // the Stroke's pen, 0..1 down its height
  const aIn = useRef(new Animated.Value(0)).current
  const settle = useRef(new Animated.Value(0)).current
  const lineIn = useRef(new Animated.Value(0)).current
  const lift = useRef(new Animated.Value(1)).current

  // Reduce Motion (which the phone reports a moment after start) skips the mark outright.
  useEffect(() => {
    if (reduce && show) setShow(false)
  }, [reduce, show])

  useEffect(() => {
    if (!show) {
      onDone?.()
      return
    }
    markPlayed()
    const t = (v: Animated.Value, duration: number, delay = 0, native = true) =>
      Animated.timing(v, { toValue: 1, duration, delay, easing: ease, useNativeDriver: native })
    const seq = Animated.parallel([
      t(draw, S, 0, false), // height cannot use the native driver
      t(aIn, S, S),
      t(settle, S, 2 * S),
      t(lineIn, motion.d3, motion.daybreak - motion.d3),
    ])
    seq.start()
    // The line lands at 2.4 s; it holds a beat, then the paper lifts.
    const timer = setTimeout(() => {
      Animated.timing(lift, { toValue: 0, duration: motion.d3, easing: ease, useNativeDriver: true }).start(() => setShow(false))
    }, motion.daybreak + motion.d3)
    return () => {
      seq.stop()
      clearTimeout(timer)
    }
    // onDone is a notification only; re-running for a new callback identity would replay timers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  if (!show) return null

  const part = (d: string, fill: string) => (
    <Svg width={markW} height={markH} viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill}>
      <Path d={d} fill={fill} fillRule="evenodd" />
    </Svg>
  )
  const rise = (v: Animated.Value, units: number) => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [units * k, 0] }) }] })

  return (
    <Animated.View
      testID="daybreak-mark"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={[StyleSheet.absoluteFill, { zIndex: 70, elevation: 70, backgroundColor: c.paper, opacity: lift }]}
    >
      <Pressable onPress={() => setShow(false)} accessible={false} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: markW, height: markH }}>
          {/* The Stroke draws from its top down, like a pen: Daybreak first, then it settles to Ink. */}
          <Animated.View style={{ position: 'absolute', left: 0, top: 0, width: markW, overflow: 'hidden', height: draw.interpolate({ inputRange: [0, 1], outputRange: [0, markH] }) }}>
            <View style={{ width: markW, height: markH }}>
              {part(WORDMARK_PARTS.stroke, c.daybreak)}
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: settle }]}>{part(WORDMARK_PARTS.stroke, c.ink)}</Animated.View>
            </View>
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, rise(aIn, 36)]}>{part(WORDMARK_PARTS.a, c.ink)}</Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, rise(settle, 14)]}>
            {part(WORDMARK_PARTS.w, c.ink)}
            {part(WORDMARK_PARTS.o, c.ink)}
          </Animated.View>
        </View>
        <Animated.Text
          maxFontSizeMultiplier={1.4}
          style={[{ marginTop: 20, fontFamily: fonts.serifLightItalic, fontSize: 19, color: c.ink2 }, rise(lineIn, 6 / k)]}
        >
          {BRAND_LINE}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  )
}
