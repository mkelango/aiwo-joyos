import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, ArrowUpRight, Expand, LayoutGrid, NotebookText, Printer, RotateCw, X } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent, type RefObject } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AiwoMark } from '@/components/joy/Brand'
import { DEMO_ROLES } from '@/layouts/DemoBar'
import { ThemeToggle } from '@/layouts/shared'
import { useApp } from '@/lib/store'
import { ROLE_ACCOUNTS } from '@/routes/entry/_data'
import { DeckCtx, H, SLIDES, SlideFrame, W } from './_deck'
import { brandTransition, useReduceMotion } from '@/lib/motion'

// CREDS (Plan §4E): the Joy OS credentials deck — 16:9 slides scaled to the viewport,
// a plain-text reading view on phones, demo sign-in by role (overview and last slide),
// ←/→ and click navigation, a counter, a progress bar, a thumbnail overview (G),
// speaker notes (N), print-to-PDF with one slide per page. Full screen, no layout.
const N = SLIDES.length

const DECK_CSS = `
.deck-ink {
  --ink: var(--aiwo-stone);
  --ink-2: color-mix(in srgb, var(--aiwo-stone) 80%, var(--ink-ground));
  --ink-3: color-mix(in srgb, var(--aiwo-stone) 60%, var(--ink-ground));
  --line: color-mix(in srgb, var(--aiwo-stone) 14%, var(--ink-ground));
  --line-strong: color-mix(in srgb, var(--aiwo-stone) 26%, var(--ink-ground));
  --paper: var(--ink-ground);
  --paper-raised: color-mix(in srgb, var(--aiwo-stone) 7%, var(--ink-ground));
  --paper-sunk: color-mix(in srgb, var(--aiwo-stone) 4%, var(--ink-ground));
  --daybreak-ink: color-mix(in srgb, var(--aiwo-daybreak) 78%, var(--aiwo-stone));
  --term-h-soft: color-mix(in srgb, var(--term-h) 26%, var(--ink-ground));
  --term-p-soft: color-mix(in srgb, var(--term-p) 30%, var(--ink-ground));
  --term-r-soft: color-mix(in srgb, var(--term-r) 30%, var(--ink-ground));
  --term-f-soft: color-mix(in srgb, var(--term-f) 26%, var(--ink-ground));
  --term-d-soft: color-mix(in srgb, var(--term-d) 22%, var(--ink-ground));
  --term-b-soft: color-mix(in srgb, var(--term-b) 26%, var(--ink-ground));
  --wheel-guide: color-mix(in srgb, var(--aiwo-stone) 16%, transparent);
  background: var(--ink-ground);
  color: var(--ink);
}
.deck-print { display: none; }
@media print {
  @page { size: 1600px 900px; margin: 0; }
  html, body { background: var(--paper) !important; margin: 0 !important; }
  .deck-screen { display: none !important; }
  .deck-print { display: block !important; }
  .deck-print .print-slide { width: 1600px; height: 900px; overflow: hidden; break-after: page; page-break-after: always; break-inside: avoid; }
  .deck-print .print-slide:last-child { break-after: auto; page-break-after: auto; }
  *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; animation: none !important; transition: none !important; }
}
`

function readHash(hash: string) {
  const n = parseInt(hash.replace('#', ''), 10)
  return Number.isFinite(n) && n >= 1 && n <= N ? n - 1 : 0
}

export default function Creds() {
  const { hash } = useLocation()
  const nav = useNavigate()
  const reduce = useReduceMotion()
  const [i, setI] = useState(() => readHash(hash))
  const [dir, setDir] = useState(1)
  const [overview, setOverview] = useState(false)
  const [notes, setNotes] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 1200, h: 700 })
  const narrow = box.w < 768
  const overviewBtn = useRef<HTMLButtonElement>(null)
  const wasOverview = useRef(false)

  // keep the slide in the URL (#4) so a link opens on the same slide
  useEffect(() => {
    nav({ hash: `#${i + 1}` }, { replace: true })
  }, [i, nav])

  // follow the hash when it changes while the deck is open (a /creds#N link, or an edited URL)
  useEffect(() => {
    const n = readHash(hash)
    setI((c) => {
      if (c === n) return c
      setDir(n > c ? 1 : -1)
      return n
    })
  }, [hash])

  useEffect(() => {
    document.title = `${SLIDES[i].title} · Joy OS credentials`
  }, [i])

  // restore the tab title when the deck closes (captured before the first slide title is set)
  const [prevTitle] = useState(() => document.title)
  useEffect(() => () => { document.title = prevTitle }, [prevTitle])

  // return focus to the Overview button when the overview closes
  useEffect(() => {
    if (wasOverview.current && !overview) overviewBtn.current?.focus()
    wasOverview.current = overview
  }, [overview])

  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const go = useCallback((n: number) => {
    setI((cur) => {
      const next = Math.max(0, Math.min(N - 1, n))
      setDir(next >= cur ? 1 : -1)
      return next
    })
  }, [])
  const next = useCallback(() => setI((c) => { setDir(1); return Math.min(N - 1, c + 1) }), [])
  const prev = useCallback(() => setI((c) => { setDir(-1); return Math.max(0, c - 1) }), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // a control on the slide (e.g. a Wheel petal) already handled this key
      if (e.defaultPrevented) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      const k = e.key
      // Space / Enter activate whatever control has focus; only arrows and paging keys page the deck from there
      const onControl = !!t?.closest?.('button, a, [role="button"], select, [data-no-advance]')
      if (overview) {
        if (k === 'Escape' || k === 'g' || k === 'G') { e.preventDefault(); setOverview(false) }
        return
      }
      if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !onControl)) { e.preventDefault(); next() }
      else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); prev() }
      else if (k === 'Home') { e.preventDefault(); go(0) }
      else if (k === 'End') { e.preventDefault(); go(N - 1) }
      else if (k === 'g' || k === 'G') { e.preventDefault(); setOverview(true) }
      else if (k === 'n' || k === 'N') { e.preventDefault(); setNotes((v) => !v) }
      else if (k === 'p' || k === 'P') { e.preventDefault(); window.print() }
      else if (k === 'f' || k === 'F') { e.preventDefault(); toggleFullscreen() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [overview, next, prev, go])

  const onSlideClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest('a, button, input, select, textarea, [role="button"], [data-no-advance]')) return
    const r = e.currentTarget.getBoundingClientRect()
    if (e.clientX - r.left < r.width * 0.3) prev()
    else next()
  }

  // slide scale: fit the stage; on narrow screens fit the width and let notes follow
  const showNotes = notes || narrow
  const gutter = narrow ? 32 : 64
  const s = narrow ? (box.w - gutter) / W : Math.min((box.w - gutter) / W, (box.h - 40) / H)
  const scale = Math.max(0.1, s)
  const slide = SLIDES[i]

  return (
    <>
      <style>{DECK_CSS}</style>
      <DeckCtx.Provider value={{ isStatic: false }}>
        <div className="deck-screen fixed inset-0 flex flex-col bg-paper-sunk text-ink">
          <h1 className="sr-only">Joy OS credentials deck</h1>
          {/* progress */}
          <div className="h-[3px] w-full bg-line" role="progressbar" aria-label="Deck progress" aria-valuemin={1} aria-valuemax={N} aria-valuenow={i + 1}>
            <motion.div className="h-full bg-ink" animate={{ width: `${((i + 1) / N) * 100}%` }} transition={{ duration: reduce ? 0 : 0.24, ease: [0.2, 0, 0, 1] }} />
          </div>

          {/* top bar */}
          <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-paper px-4 md:px-6">
            <Link to="/" className="flex items-center gap-3 rounded focus-ring" aria-label="AIWO Joy OS — home">
              <AiwoMark size={18} />
              <span className="house hidden text-ink-2 sm:inline">Joy OS · Credentials</span>
            </Link>
            <p className="hidden min-w-0 flex-1 truncate text-center text-[14px] text-ink-2 lg:block" aria-live="polite">{slide.title}</p>
            <div className="flex items-center gap-1">
              <span className="num mr-2 text-[14px] text-ink" aria-label={`Slide ${i + 1} of ${N}`}>
                {String(i + 1).padStart(2, '0')}<span className="text-ink-3"> / {N}</span>
              </span>
              <IconBtn label="Overview (G)" onClick={() => setOverview(true)} btnRef={overviewBtn}><LayoutGrid size={18} /></IconBtn>
              <IconBtn label="Speaker notes (N)" onClick={() => setNotes((v) => !v)} pressed={notes} className="hidden md:inline-flex"><NotebookText size={18} /></IconBtn>
              <IconBtn label="Print or save as PDF (P)" onClick={() => window.print()}><Printer size={18} /></IconBtn>
              <IconBtn label="Full screen (F)" onClick={toggleFullscreen} className="hidden md:inline-flex"><Expand size={18} /></IconBtn>
              <ThemeToggle />
              <Link
                to="/platform-map"
                onClick={(e) => {
                  // close back to wherever the deck was opened from (sign-in, the map, journeys); a cold open lands on the map
                  if ((window.history.state as { idx?: number } | null)?.idx) { e.preventDefault(); nav(-1) }
                }}
                className="ml-1 inline-flex h-9 items-center rounded-full p-2 text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring"
                aria-label="Close the deck"
                title="Close the deck"
              >
                <X size={18} />
              </Link>
            </div>
          </header>

          {/* stage */}
          <main className={clsx('flex min-h-0 flex-1 flex-col', narrow && 'overflow-y-auto')}>
            <div ref={stage} className={clsx('relative flex items-center justify-center', narrow ? 'shrink-0 pt-4' : 'min-h-0 flex-1')} style={narrow ? { height: H * scale + 16 } : undefined}>
              <div
                className="relative cursor-pointer overflow-hidden rounded-[6px] shadow-lift ring-1 ring-line"
                style={{ width: W * scale, height: H * scale }}
                onClick={onSlideClick}
                role="region"
                aria-roledescription="slide"
                aria-label={`Slide ${i + 1} of ${N}: ${slide.title}`}
              >
                <AnimatePresence initial={false} custom={dir} mode="popLayout">
                  <motion.div
                    key={slide.id}
                    custom={dir}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -24 }}
                    transition={brandTransition(reduce, 240)}
                    className="absolute inset-0"
                  >
                    <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: W, height: H }}>
                      <SlideFrame def={slide} n={i + 1} total={N} />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {narrow && (
              <div className="flex shrink-0 justify-center px-4 pt-3">
                <button onClick={landscape} className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-paper px-4 text-[14px] text-ink hover:bg-paper-raised focus-ring">
                  <RotateCw size={15} aria-hidden /> Full screen, landscape
                </button>
              </div>
            )}

            {narrow && (
              <section aria-label="Slide, as text" className="mx-auto w-full shrink-0 px-4 pt-5">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.article
                    key={slide.id}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={brandTransition(reduce, 180)}
                    className="rounded-card border border-line bg-paper-raised p-5"
                  >
                    <p className="eyebrow text-ink-3"><span className="num">{String(i + 1).padStart(2, '0')}</span> · {slide.section}</p>
                    <h2 className="mt-2 text-[1.45rem] font-light leading-snug text-ink">{slide.title}</h2>
                    <ul className="mt-4 space-y-3">
                      {slide.outline.map((line) => (
                        <li key={line} className="flex gap-3 text-[16px] leading-relaxed text-ink-2">
                          <span className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                    {slide.id === 'walk' && (
                      <p className="mt-5 border-t border-line pt-4 text-[15px] text-ink-2">
                        Open any role from the overview: <button onClick={() => setOverview(true)} className="text-ink underline underline-offset-4 focus-ring">Walk the platform</button>.
                      </p>
                    )}
                  </motion.article>
                </AnimatePresence>
              </section>
            )}

            {showNotes && (
              <section aria-label="Speaker notes" className={clsx('mx-auto w-full shrink-0 px-4 md:px-8', narrow ? 'py-5' : 'max-w-5xl pb-3 pt-1')}>
                <div className="rounded-card border border-line bg-paper p-4 md:p-5">
                  <p className="eyebrow text-ink-3"><span className="num">{String(i + 1).padStart(2, '0')}</span> · {slide.section} · notes</p>
                  <p className="mt-2 text-[17px] leading-relaxed text-ink">{slide.notes}</p>
                </div>
                {narrow && <p className="mt-3 text-center text-[14px] text-ink-3">Tap the right of a slide to go on, the left to go back.</p>}
              </section>
            )}
          </main>

          {/* bottom bar */}
          <footer className="flex h-14 shrink-0 items-center justify-between gap-3 border-t border-line bg-paper px-4 md:px-6">
            <button onClick={prev} disabled={i === 0} className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-[15px] text-ink-2 hover:bg-paper-sunk hover:text-ink disabled:opacity-40 focus-ring" aria-label="Previous slide">
              <ArrowLeft size={17} /> <span className="hidden sm:inline">Previous</span>
            </button>
            <ol className="hidden items-center gap-1.5 md:flex" aria-label="Slides">
              {SLIDES.map((sd, k) => (
                <li key={sd.id}>
                  <button
                    onClick={() => go(k)}
                    aria-label={`Go to slide ${k + 1}: ${sd.title}`}
                    aria-current={k === i ? 'step' : undefined}
                    className={clsx('block h-2 rounded-full transition-all duration-200 focus-ring', k === i ? 'w-6 bg-ink' : 'w-2 bg-line-strong hover:bg-ink-3')}
                  />
                </li>
              ))}
            </ol>
            <p className="hidden text-[13px] text-ink-3 xl:block">← → to move · G overview · N notes · P print</p>
            <button onClick={next} disabled={i === N - 1} className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-[15px] text-ink hover:bg-paper-sunk disabled:opacity-40 focus-ring" aria-label="Next slide">
              <span className="hidden sm:inline">Next</span> <ArrowRight size={17} />
            </button>
          </footer>

          <AnimatePresence>
            {overview && <Overview current={i} onPick={(k) => { go(k); setOverview(false) }} onClose={() => setOverview(false)} />}
          </AnimatePresence>
        </div>
      </DeckCtx.Provider>

      {/* print: every slide, one per page */}
      <DeckCtx.Provider value={{ isStatic: true }}>
        <div className="deck-print" aria-hidden>
          {SLIDES.map((sd, k) => (
            <div key={sd.id} className="print-slide">
              <SlideFrame def={sd} n={k + 1} total={N} />
            </div>
          ))}
        </div>
      </DeckCtx.Provider>
    </>
  )
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.()
  else document.documentElement.requestFullscreen?.().catch(() => {})
}

/** Phones: full screen, then try to lock landscape so the slide fills the screen. */
function landscape() {
  const lock = () => {
    const o = (screen as Screen & { orientation?: ScreenOrientation & { lock?: (o: string) => Promise<void> } }).orientation
    o?.lock?.('landscape').catch(() => {})
  }
  if (document.fullscreenElement) { lock(); return }
  const req = document.documentElement.requestFullscreen?.()
  if (req) req.then(lock).catch(() => {})
}

function IconBtn({ label, onClick, children, pressed, className, btnRef }: { label: string; onClick: () => void; children: React.ReactNode; pressed?: boolean; className?: string; btnRef?: RefObject<HTMLButtonElement | null> }) {
  return (
    <button
      ref={btnRef}
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={clsx('inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-2 hover:bg-paper-sunk hover:text-ink focus-ring', pressed && 'bg-paper-sunk text-ink', className)}
    >
      {children}
    </button>
  )
}

// ─── Overview: thumbnails, plus demo sign-in by role ─────────────────────────
function Overview({ current, onPick, onClose }: { current: number; onPick: (k: number) => void; onClose: () => void }) {
  const reduce = useReduceMotion()
  const ref = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  const { role, setRole } = useApp()
  const thumbW = 300
  const ts = thumbW / W
  useEffect(() => {
    const el = ref.current?.querySelector<HTMLButtonElement>(`[data-k="${current}"]`)
    el?.focus()
    el?.scrollIntoView({ block: 'center' })
  }, [current])
  // keep Tab inside the dialog
  const trap = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !ref.current) return
    const f = Array.from(ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')).filter((el) => !el.closest('[inert]'))
    if (f.length === 0) return
    const first = f[0]
    const last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
  const enter = (r: { role: (typeof DEMO_ROLES)[number]['role']; to: string }) => {
    setRole(r.role)
    nav(r.to)
  }
  // every demo role: the concierge (its own desk at the coach console) and Engineering & ops
  // (its own ops role, lands on /console/ops) included
  const accounts = ROLE_ACCOUNTS.flatMap((a) => {
    const r = DEMO_ROLES.find((d) => d.role === a.role)
    return r ? [{ key: a.key, role: a.role, title: a.title, email: a.email, who: r.who, to: r.to }] : []
  })
  return (
    <motion.div
      ref={ref}
      onKeyDown={trap}
      role="dialog"
      aria-modal="true"
      aria-label="Slide overview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={brandTransition(reduce, 200)}
      className="fixed inset-0 z-50 overflow-y-auto bg-paper"
    >
      <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow text-daybreak-ink">Overview · {N} slides</p>
            <h2 className="mt-1 text-[1.6rem] font-light text-ink">Joy OS credentials</h2>
          </div>
          <button onClick={onClose} className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-[15px] text-ink hover:bg-paper-sunk focus-ring" aria-label="Close overview">
            <X size={16} /> Close <span className="eyebrow hidden text-ink-3 sm:inline">Esc</span>
          </button>
        </div>
        <DeckCtx.Provider value={{ isStatic: true }}>
          <ol className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-5 gap-y-7">
            {SLIDES.map((sd, k) => (
              <li key={sd.id}>
                <button
                  data-k={k}
                  onClick={() => onPick(k)}
                  className={clsx('group block w-full text-left focus-ring rounded-[8px]')}
                  aria-label={`Slide ${k + 1}: ${sd.title}`}
                  aria-current={k === current ? 'true' : undefined}
                >
                  <span
                    className={clsx('relative block overflow-hidden rounded-[6px] ring-1 transition-shadow', k === current ? 'ring-2 ring-ink' : 'ring-line group-hover:ring-ink-3')}
                    style={{ width: thumbW, height: H * ts, maxWidth: '100%' }}
                    aria-hidden
                  >
                    <span className="pointer-events-none absolute left-0 top-0 block origin-top-left" style={{ transform: `scale(${ts})`, width: W, height: H }} inert>
                      <SlideFrame def={sd} n={k + 1} total={N} />
                    </span>
                  </span>
                  <span className="mt-2 flex items-baseline gap-2">
                    <span className="num text-[13px] text-ink-3">{String(k + 1).padStart(2, '0')}</span>
                    <span className={clsx('text-[15px]', k === current ? 'text-ink' : 'text-ink-2 group-hover:text-ink')}>{sd.title}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </DeckCtx.Provider>

        <section aria-labelledby="demo-h" className="mt-14 border-t border-line pt-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div>
              <p className="eyebrow text-ink-3">After the deck · demo sign-in</p>
              <h3 id="demo-h" className="mt-2 text-[1.5rem] font-light text-ink">Walk the platform as each role</h3>
              <p className="mt-2 text-[15px] text-ink-2">Specimen accounts for the demonstration. One click sets the role and opens its surface. No password, no real member data: every console opens on specimen data and is labelled so.</p>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                <Link to="/platform-map" className="inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">Platform map <ArrowUpRight size={15} /></Link>
                <Link to="/journeys" className="inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">Journeys <ArrowUpRight size={15} /></Link>
              </div>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {accounts.map((a) => {
                const current = role === a.role
                return (
                  <li key={a.key}>
                    <button
                      onClick={() => enter(a)}
                      aria-label={`Sign in as ${a.title}, ${a.who}, and open ${a.to}`}
                      className={clsx('flex w-full items-start justify-between gap-3 rounded-card border bg-paper-raised px-4 py-3 text-left transition-colors hover:border-line-strong focus-ring', current ? 'border-ink' : 'border-line')}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-[16px] text-ink">
                          {a.title}
                          {current && <span className="eyebrow rounded-full bg-paper-sunk px-2 py-0.5 text-ink-2">current</span>}
                        </span>
                        <span className="block text-[13px] text-ink-2">{a.who}</span>
                        <span className="num mt-1 block break-all text-[12px] text-ink-3">{a.email}</span>
                      </span>
                      <span className="num flex shrink-0 items-center gap-1 text-[12px] text-ink-3">{a.to} <ArrowUpRight size={13} aria-hidden /></span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      </div>
    </motion.div>
  )
}
