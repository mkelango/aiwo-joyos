import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useId, useState } from 'react'
import { DUR, EASE_BRAND, prefersReducedMotion } from '@/lib/motion'
import { BRAND_LINE } from './Brand'
import { WORDMARK_PARTS, WORDMARK_VIEWBOX } from './Wordmark'

// The animated mark (Playbook p53): "2.4 s · once per session".
//   0.0 s  Stroke    — the slanted Stroke draws down, in Daybreak.
//   0.8 s  A rises   — the A rises into place beside it.
//   1.6 s  Settle    — W and the leaning O settle in; the Stroke settles to Ink.
//   2.4 s  The line  — "Years Worth Living." arrives under the mark.
// Played on app open, once per browser session, never under reduced motion (OS or the app's
// own setting). Any tap or key skips it. Decorative: hidden from assistive technology.

const SESSION_KEY = 'joyos:daybreak:played'
const S = DUR.daybreak / 1000 / 3 // 0.8 s per phase
const ease = EASE_BRAND as unknown as [number, number, number, number]

function playedThisSession() {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return true // no session storage: do not risk replaying on every page
  }
}
function markPlayed() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function DaybreakMark({ onDone }: { onDone?: () => void }) {
  const [show, setShow] = useState(() => typeof window !== 'undefined' && !playedThisSession() && !prefersReducedMotion())
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const { w, h } = WORDMARK_VIEWBOX

  useEffect(() => {
    if (!show) {
      onDone?.()
      return
    }
    markPlayed()
    // The line lands at 2.4 s; it holds a beat, then the paper lifts.
    const t = window.setTimeout(() => setShow(false), DUR.daybreak + DUR.step)
    const skip = () => setShow(false)
    window.addEventListener('keydown', skip)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('keydown', skip)
    }
    // onDone is a notification only; re-running for a new callback identity would replay timers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          aria-hidden
          data-testid="daybreak-mark"
          className="fixed inset-0 z-[70] flex cursor-pointer flex-col items-center justify-center bg-paper"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: DUR.settle / 1000, ease } }}
          onClick={() => setShow(false)}
        >
          <svg viewBox={`0 0 ${w} ${h}`} className="w-[min(64vw,340px)] overflow-visible">
            <defs>
              <clipPath id={`db-draw-${uid}`}>
                {/* The Stroke draws from its top down, like a pen. */}
                <motion.rect x={130} y={-4} width={70} initial={{ height: 0 }} animate={{ height: h + 8 }} transition={{ duration: S, ease }} />
              </clipPath>
            </defs>
            <g clipPath={`url(#db-draw-${uid})`}>
              {/* Daybreak first, then it settles to Ink. */}
              <motion.path d={WORDMARK_PARTS.stroke} fill="var(--daybreak)" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: S, delay: 2 * S, ease }} />
              <motion.path d={WORDMARK_PARTS.stroke} fill="var(--ink)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: S, delay: 2 * S, ease }} />
            </g>
            <motion.g initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: S, delay: S, ease }}>
              <path d={WORDMARK_PARTS.a} fill="var(--ink)" />
            </motion.g>
            <motion.g initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: S, delay: 2 * S, ease }}>
              <path d={WORDMARK_PARTS.w} fill="var(--ink)" />
              <path d={WORDMARK_PARTS.o} fill="var(--ink)" />
            </motion.g>
          </svg>
          <motion.p
            className="mt-5 font-serif text-[19px] font-light italic text-ink-2"
            lang="en"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.settle / 1000, delay: DUR.daybreak / 1000 - DUR.settle / 1000, ease }}
          >
            {BRAND_LINE}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
