import { useSyncExternalStore } from 'react'

// Motion, the brand way (Playbook p53): "Rise. Settle. Measure." One easing, four durations,
// plus the 2.4 s daybreak for the animated mark. Reduced motion is the member's OS setting OR
// the app's own "Reduce motion" in Settings (which marks <html data-motion="reduce">); under
// either, every animation becomes a 120 ms fade.

export const EASE_BRAND = [0.2, 0, 0, 1] as const
export const DUR = { instant: 120, settle: 240, step: 480, bloom: 960, daybreak: 2400 } as const

const QUERY = '(prefers-reduced-motion: reduce)'

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (document.documentElement.dataset.motion === 'reduce') return true
    return window.matchMedia?.(QUERY).matches ?? false
  } catch {
    return false
  }
}

function subscribe(cb: () => void) {
  if (typeof window === 'undefined') return () => {}
  const mq = window.matchMedia?.(QUERY)
  mq?.addEventListener?.('change', cb)
  const mo = new MutationObserver(cb)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] })
  return () => {
    mq?.removeEventListener?.('change', cb)
    mo.disconnect()
  }
}

/** true under the OS reduced-motion setting or the app's Reduce motion preference. */
export function useReduceMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false)
}

/** cubic-bezier(x1, y1, x2, y2) as a function of progress 0–1 (Newton, then bisection). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t
  const sy = (t: number) => ((ay * t + by) * t + cy) * t
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x
      if (Math.abs(e) < 1e-5) return sy(t)
      const d = dx(t)
      if (Math.abs(d) < 1e-6) break
      t -= e / d
    }
    let lo = 0, hi = 1
    t = x
    for (let i = 0; i < 24; i++) {
      const v = sx(t)
      if (Math.abs(v - x) < 1e-5) break
      if (v < x) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return sy(t)
  }
}

export const easeBrand = cubicBezier(...EASE_BRAND)
