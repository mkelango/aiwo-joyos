import { useEffect, useRef, useState } from 'react'
import { Animated, Easing } from 'react-native'
import { useReduceMotion } from '../lib/store'
import { motion, EASE_BRAND, easeBrand } from '../theme/tokens'
import { Numeral, type Tone } from './Text'

// "Numbers count to their value, up or down, at the same speed" (Playbook p53). A count always
// takes the bloom duration, 960 ms on the brand easing, so a fall moves exactly as fast as a
// rise, and the Index counts while the Wheel blooms. Under Reduce Motion (the system's or the
// member's own) the final value fades in over 120 ms instead. Same contract as the web kit
// (joy-os-web/src/components/joy/CountUp.tsx).

const round = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d

/**
 * The value to draw right now while counting to `target`. Starts from `from` (default 0) on
 * first show, then from wherever it stands whenever `target` changes, so an interrupted count
 * carries on from the number on screen. `enabled: false` draws the target at once.
 */
export function useCountUp(target: number | null | undefined, { from = 0, decimals = 0, enabled = true }: { from?: number; decimals?: number; enabled?: boolean } = {}) {
  const reduce = useReduceMotion()
  const animate = enabled && !reduce && target !== null && target !== undefined
  const [shown, setShown] = useState<number | null>(() => (target === null || target === undefined ? null : animate ? from : target))
  const cur = useRef<number | null>(shown)

  useEffect(() => {
    if (target === null || target === undefined) {
      cur.current = null
      setShown(null)
      return
    }
    const start = cur.current ?? from
    if (!animate || start === target) {
      cur.current = target
      setShown(target)
      return
    }
    let raf = 0
    let t0 = 0
    const tick = (now: number) => {
      if (!t0) t0 = now
      const p = Math.min(1, (now - t0) / motion.bloom)
      const v = p >= 1 ? target : round(start + (target - start) * easeBrand(p), decimals)
      cur.current = v
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, animate, decimals, from])

  return { shown, reduce, text: shown === null ? '—' : shown.toFixed(decimals) }
}

/** A 0→1 opacity that runs over 120 ms each time `key` changes (the reduced-motion fade). */
export function useFadeIn(key: unknown, enabled: boolean) {
  const op = useRef(new Animated.Value(enabled ? 0 : 1)).current
  useEffect(() => {
    if (!enabled) {
      op.setValue(1)
      return
    }
    op.setValue(0)
    Animated.timing(op, { toValue: 1, duration: motion.d1, easing: Easing.bezier(...EASE_BRAND), useNativeDriver: true }).start()
  }, [key, enabled, op])
  return op
}

/**
 * A number that counts to its value, set in Mono (Numeral). Screen readers get the final value
 * only. `<CountUp value={64} size={96} />` · `<CountUp value={-3} />` · `<CountUp value={4.2} decimals={1} />`
 */
export function CountUp({ value, decimals = 0, from = 0, animate = true, size = 96, tone = 'ink', color, weight = 'light', format, accessibilityLabel }: {
  value: number | null | undefined
  decimals?: number
  from?: number
  /** false draws the value at once (thumbnails, share images). */
  animate?: boolean
  size?: number
  tone?: Tone
  color?: string
  weight?: 'light' | 'regular' | 'medium'
  /** Optional formatting of the drawn number (e.g. a leading minus for Burden). */
  format?: (v: number) => string
  accessibilityLabel?: string
}) {
  const { shown, reduce, text } = useCountUp(value, { from, decimals, enabled: animate })
  const final = value === null || value === undefined ? '—' : format ? format(value) : value.toFixed(decimals)
  const drawn = shown === null ? '—' : format ? format(shown) : text
  const fading = reduce && animate
  const opacity = useFadeIn(final, fading)
  return (
    <Animated.View style={{ opacity }} accessible accessibilityRole="text" accessibilityLabel={accessibilityLabel ?? final}>
      <Numeral size={size} tone={tone} color={color} weight={weight}>
        {fading ? final : drawn}
      </Numeral>
    </Animated.View>
  )
}
