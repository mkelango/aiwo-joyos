import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { DUR, easeBrand, useReduceMotion } from '@/lib/motion'

// "Numbers count to their value, up or down, at the same speed" (Playbook p53). A count always
// takes the bloom duration, 960 ms on the brand easing, so a fall moves exactly as fast as a
// rise. Under reduced motion (OS or the app's setting) the final value fades in over 120 ms.

const pow = (d: number) => 10 ** d
const round = (v: number, d: number) => Math.round(v * pow(d)) / pow(d)

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
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DUR.bloom)
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

/**
 * A number that counts to its value in Mono. Screen readers get the final value only.
 * `<CountUp value={64} />` · `<CountUp value={-3} from={0} />` · `<CountUp value={4.2} decimals={1} />`
 */
export function CountUp({ value, decimals = 0, from = 0, animate = true, className, format }: {
  value: number | null | undefined
  decimals?: number
  from?: number
  /** false draws the value at once (thumbnails, print). */
  animate?: boolean
  className?: string
  /** Optional formatting of the drawn number (e.g. a leading minus for Burden). */
  format?: (v: number) => string
}) {
  const { shown, reduce, text } = useCountUp(value, { from, decimals, enabled: animate })
  const final = value === null || value === undefined ? '—' : format ? format(value) : value.toFixed(decimals)
  const drawn = shown === null ? '—' : format ? format(shown) : text
  return (
    <span className={clsx('font-mono tabular-nums', className)}>
      {reduce && animate ? (
        <motion.span key={final} aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: DUR.instant / 1000, ease: [0.2, 0, 0, 1] }}>
          {final}
        </motion.span>
      ) : (
        <span aria-hidden>{drawn}</span>
      )}
      <span className="sr-only">{final}</span>
    </span>
  )
}
