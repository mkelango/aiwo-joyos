import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, ArrowUpRight, CircleHelp, Layers, MonitorSmartphone, Presentation, Route } from 'lucide-react'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DaybreakButton, Eyebrow, SpecimenTag, TermDot } from '@/components/joy/primitives'
import { Card, PageHeader, Pill, Tabs } from '@/components/ui'
import { TERMS, termColor } from '@/data/terms'
import type { TermKey } from '@/domain/types'
import { ARCH_LAYERS, MODULES, OUTCOMES, SURFACES, TWO_APPS, type Module, type OutcomeKey, type SurfaceKey } from './_data'
import { LinkButton, StorySection, TermTraceButton, useEnterAs } from './_parts'
import { brandTransition, useReduceMotion } from '@/lib/motion'

/** A pinned trace: a term back to the modules that raise it, or a surface to the modules it carries. */
type Trace = { kind: 'term'; key: TermKey } | { kind: 'surface'; key: SurfaceKey } | null
const sameTrace = (a: Trace, b: Trace) => !!a && !!b && a.kind === b.kind && a.key === b.key
const isLg = () => window.matchMedia('(min-width: 1024px)').matches
const termName = (k: TermKey) => TERMS.find((t) => t.key === k)!.name
const surfaceName = (k: SurfaceKey) => SURFACES.find((s) => s.key === k)!.name
const modulesFor = (tr: NonNullable<Trace>) => MODULES.filter((m) => (tr.kind === 'term' ? m.terms.includes(tr.key) : m.surfaces.includes(tr.key)))

// PLATFORM MAP (Plan §4D; Memo p.8, p.16, p.28, p.6): fourteen modules, each answerable
// to a term; the surfaces that carry them; the outcomes they move; the architecture
// layer by layer; and what is shared with LifeOS.
export default function PlatformMap() {
  const [sel, setSel] = useState('01')
  const mod = MODULES.find((m) => m.n === sel)!
  const select = useCallback((n: string) => setSel(n), [])
  const [trace, setTrace] = useState<Trace>(null)
  // pressing the pinned trace again clears it
  const toggleTrace = useCallback((t: Trace) => setTrace((cur) => (sameTrace(cur, t) ? null : t)), [])
  // from the detail card: pin the term, then show the trace where it is drawn at this width
  const traceFromDetail = useCallback((k: TermKey) => {
    const next: Trace = { kind: 'term', key: k }
    const clearing = sameTrace(trace, next)
    toggleTrace(next)
    if (!clearing) document.getElementById(isLg() ? 'map' : 'module-trace')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [trace, toggleTrace])

  return (
    <div className="pb-8 pt-2 md:pt-6">
      <PageHeader
        eyebrow="Connecting the dots · Platform map"
        title={<>Fourteen modules, each answerable to a <em>term</em>.</>}
        lead="Every part of Joy OS must pass one test: which term does it raise, how will we know, and would a member miss it if it went? Choose a module to see its terms, the surfaces that carry it, the data it keeps, when it ships and what it keeps from LifeOS."
        actions={
          <>
            <LinkButton to="/journeys"><Route size={16} /> Journeys</LinkButton>
            <LinkButton to="/creds" variant="ink"><Presentation size={16} /> Credentials deck</LinkButton>
          </>
        }
      />

      <nav aria-label="On this page" className="mb-10 flex flex-wrap gap-2">
        {[['#map', 'The map'], ['#architecture', 'Architecture'], ['#two-apps', 'Two apps, one core'], ['#outcomes', 'Outcomes']].map(([href, label]) => (
          <a key={href} href={href} className="rounded-full border border-line px-3.5 py-1.5 text-[14px] text-ink-2 transition-colors hover:border-line-strong hover:text-ink focus-ring">{label}</a>
        ))}
      </nav>

      <section id="map" aria-labelledby="map-h" className="scroll-mt-24 pb-16">
        <h2 id="map-h" className="sr-only">The module map</h2>
        <div className="grid gap-6">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Eyebrow>Surfaces ↔ modules ↔ terms ↔ outcomes</Eyebrow>
              <p className="text-[14px] text-ink-3"><span className="lg:hidden">Choose a module, or trace a term or a surface</span><span className="hidden lg:inline">Choose a module · hover or click a term or a surface to trace it</span></p>
            </div>
            <ConnectionMap sel={sel} onSelect={select} trace={trace} onTrace={toggleTrace} />
            <MobileModulePicker sel={sel} onSelect={select} trace={trace} onTrace={toggleTrace} />
          </Card>
          <ModuleDetail mod={mod} trace={trace} onTraceTerm={traceFromDetail} />
        </div>
      </section>

      <ArchitectureSection mod={mod} />
      <TwoAppsSection />
      <OutcomesSection
        onSelect={(n) => {
          select(n)
          // desktop shows the traced map; below lg the map is a long picker, so go straight to the module's card
          const target = isLg() ? 'map' : 'module-detail'
          document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
        sel={sel}
      />
    </div>
  )
}

// ─── The connection map (desktop) ────────────────────────────────────────────
type Pt = { l: { x: number; y: number }; r: { x: number; y: number } }

function ConnectionMap({ sel, onSelect, trace, onTrace }: { sel: string; onSelect: (n: string) => void; trace: Trace; onTrace: (t: Trace) => void }) {
  const wrap = useRef<HTMLDivElement>(null)
  const nodes = useRef(new Map<string, HTMLElement>())
  const [pos, setPos] = useState<Record<string, Pt>>({})
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [hovered, setHovered] = useState<TermKey | null>(null)
  const [hoveredSurface, setHoveredSurface] = useState<SurfaceKey | null>(null)
  const enterAs = useEnterAs()
  const pinned = trace?.kind === 'term' ? trace.key : null
  const pinnedSurface = trace?.kind === 'surface' ? trace.key : null
  // a hover previews over the pin; a term hover wins over a surface hover
  const hoverTerm = hovered ?? (hoveredSurface ? null : pinned)
  const hoverSurface = hovered ? null : hoveredSurface ?? pinnedSurface
  const mod = MODULES.find((m) => m.n === sel)!
  const carried = hoverSurface ? MODULES.filter((m) => m.surfaces.includes(hoverSurface)) : []

  const reg = (id: string) => (el: HTMLElement | null) => {
    if (el) nodes.current.set(id, el)
    else nodes.current.delete(id)
  }

  useLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    const measure = () => {
      const base = el.getBoundingClientRect()
      const next: Record<string, Pt> = {}
      nodes.current.forEach((n, id) => {
        const r = n.getBoundingClientRect()
        const y = r.top - base.top + r.height / 2
        next[id] = { l: { x: r.left - base.left, y }, r: { x: r.right - base.left, y } }
      })
      setPos(next)
      setBox({ w: base.width, h: base.height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const curve = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = (b.x - a.x) * 0.5
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`
  }

  const lines: { d: string; stroke: string; w: number; o: number; dash?: string; key: string }[] = []
  if (Object.keys(pos).length) {
    // module → term, faint for all, strong for the selected module
    MODULES.forEach((m) => {
      const mp = pos[`m-${m.n}`]
      m.terms.forEach((t) => {
        const tp = pos[`t-${t}`]
        if (!mp || !tp) return
        const on = m.n === sel
        const traced = hoverTerm === t
        if (on) return
        const faded = hoverTerm ? !traced : hoverSurface ? !m.surfaces.includes(hoverSurface) : false
        lines.push({ key: `mt-${m.n}-${t}`, d: curve(mp.r, tp.l), stroke: traced ? termColor[t] : 'var(--line-strong)', w: traced ? 1.4 : 1, o: traced ? 0.9 : faded ? 0.12 : 0.45 })
      })
    })
    // surface → module: every module the traced surface carries, or the selected module's surfaces
    const sp0 = hoverSurface ? pos[`s-${hoverSurface}`] : undefined
    if (sp0) {
      carried.forEach((m) => {
        const cp = pos[`m-${m.n}`]
        if (cp) lines.push({ key: `sc-${m.n}`, d: curve(sp0.r, cp.l), stroke: 'var(--ink)', w: 1.4, o: 0.75 })
      })
    }
    const mp = pos[`m-${mod.n}`]
    if (mp) {
      if (!sp0) mod.surfaces.forEach((s) => {
        const sp = pos[`s-${s}`]
        if (sp) lines.push({ key: `sm-${s}`, d: curve(sp.r, mp.l), stroke: 'var(--ink)', w: 1.4, o: 0.75 })
      })
      mod.terms.forEach((t) => {
        const tp = pos[`t-${t}`]
        if (tp) lines.push({ key: `sel-${t}`, d: curve(mp.r, tp.l), stroke: termColor[t], w: 2, o: 0.95 })
      })
      mod.outcomes.forEach((o) => {
        const op = pos[`o-${o}`]
        if (!op) return
        if (mod.terms.length === 0) {
          lines.push({ key: `mo-${o}`, d: curve(mp.r, op.l), stroke: 'var(--ink)', w: 1.4, o: 0.7, dash: '4 4' })
        } else {
          mod.terms.forEach((t) => {
            const tp = pos[`t-${t}`]
            if (tp) lines.push({ key: `to-${t}-${o}`, d: curve(tp.r, op.l), stroke: 'var(--ink)', w: 1, o: 0.35 })
          })
        }
      })
    }
  }

  const termOn = (t: TermKey) => (hoverTerm ? hoverTerm === t : hoverSurface ? carried.some((m) => m.terms.includes(t)) : mod.terms.includes(t))
  const moduleOn = (m: Module) => (hoverTerm ? m.terms.includes(hoverTerm) : hoverSurface ? m.surfaces.includes(hoverSurface) : true)
  const surfaceOn = (k: SurfaceKey) => (hoverSurface ? hoverSurface === k : mod.surfaces.includes(k))

  return (
    <div ref={wrap} className="relative mt-6 hidden lg:block">
      <svg className="pointer-events-none absolute inset-0" width={box.w} height={box.h} aria-hidden>
        {lines.map((l) => (
          <path key={l.key} d={l.d} fill="none" stroke={l.stroke} strokeWidth={l.w} opacity={l.o} strokeDasharray={l.dash} style={{ transition: 'opacity 240ms var(--ease-brand)' }} />
        ))}
      </svg>
      <div className="relative grid grid-cols-[minmax(150px,0.9fr)_minmax(240px,1.3fr)_minmax(150px,0.8fr)_minmax(170px,0.9fr)] gap-x-14">
        {/* Surfaces */}
        <div className="flex flex-col">
          <p className="eyebrow mb-3 text-ink-3">Surfaces</p>
          <ul className="flex flex-1 flex-col justify-between gap-2">
            {SURFACES.map((s) => {
              const on = surfaceOn(s.key)
              const isPinned = pinnedSurface === s.key
              const n = MODULES.filter((m) => m.surfaces.includes(s.key)).length
              return (
                <li key={s.key} ref={reg(`s-${s.key}`)} className={clsx('flex items-stretch rounded-lg border bg-paper-raised transition-all duration-200', on || isPinned ? 'border-ink' : 'border-line')}>
                  {/* the box traces the surface; the arrow beside it opens the surface */}
                  <button
                    type="button"
                    onMouseEnter={() => setHoveredSurface(s.key)}
                    onMouseLeave={() => setHoveredSurface(null)}
                    onFocus={() => setHoveredSurface(s.key)}
                    onBlur={() => setHoveredSurface(null)}
                    onClick={() => { onTrace({ kind: 'surface', key: s.key }); setHoveredSurface(null) }}
                    aria-pressed={isPinned}
                    aria-label={`${s.name}: carries ${n} modules. ${isPinned ? 'Click to clear the trace.' : 'Click to pin the trace.'}`}
                    className={clsx('min-w-0 flex-1 rounded-l-lg px-3 py-2 text-left transition-opacity duration-200 focus-ring', !on && !isPinned && 'opacity-55', isPinned && 'bg-paper-sunk')}
                  >
                    <span className="block text-[14px] leading-tight text-ink">{s.name}</span>
                    <span className="mt-0.5 block text-[12px] leading-tight text-ink-3">{s.sub}</span>
                  </button>
                  <Link
                    to={s.to}
                    onClick={() => enterAs(s.to)}
                    title={`Open ${s.name}`}
                    aria-label={`Open ${s.name}`}
                    className="flex w-7 shrink-0 items-center justify-center rounded-r-lg text-ink-3 transition-colors hover:bg-paper-sunk hover:text-ink focus-ring"
                  >
                    <ArrowUpRight size={13} aria-hidden />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
        {/* Modules */}
        <div>
          <p className="eyebrow mb-3 text-ink-3">Fourteen modules</p>
          <ul className="flex flex-col gap-1.5" aria-label="Modules">
            {MODULES.map((m) => {
              const on = m.n === sel
              return (
                <li key={m.n} ref={reg(`m-${m.n}`)}>
                  <button
                    aria-pressed={on}
                    onClick={() => onSelect(m.n)}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[14px] transition-all duration-200 focus-ring',
                      on ? 'bg-ink text-paper' : 'text-ink hover:bg-paper-sunk',
                      !moduleOn(m) && !on && 'opacity-35',
                    )}
                  >
                    <span className={clsx('num text-[12px]', on ? 'text-paper/70' : 'text-ink-3')}>{m.n}</span>
                    <span className="flex-1 leading-tight">{m.name}</span>
                    <span className={clsx('num text-[11px]', on ? 'text-paper/70' : 'text-ink-3')}>{m.release}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
        {/* Terms */}
        <div className="flex flex-col">
          <p className="eyebrow mb-3 text-ink-3">Six terms</p>
          <ul className="flex flex-1 flex-col justify-around gap-3">
            {TERMS.map((t) => (
              <li key={t.key} ref={reg(`t-${t.key}`)}>
                <button
                  onMouseEnter={() => setHovered(t.key)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(t.key)}
                  onBlur={() => setHovered(null)}
                  onClick={() => { onTrace({ kind: 'term', key: t.key }); setHovered(null) }}
                  aria-pressed={pinned === t.key}
                  aria-label={`${t.name}: ${MODULES.filter((m) => m.terms.includes(t.key)).length} modules raise it. ${pinned === t.key ? 'Click to clear the trace.' : 'Click to pin the trace.'}`}
                  // always an opaque box, so a line routed across the column (Commerce, Trust centre) passes behind it;
                  // a dimmed term fades its text, never the box
                  className={clsx('w-full rounded-lg border bg-paper-raised px-3 py-2 text-left transition-all duration-200 focus-ring', pinned === t.key ? 'border-ink' : termOn(t.key) ? 'border-line-strong' : 'border-transparent')}
                >
                  <span className={clsx('flex items-center gap-2 text-[14px] text-ink transition-opacity duration-200', !termOn(t.key) && pinned !== t.key && 'opacity-40')}><TermDot term={t.key} /> {t.key === 'B' ? '− ' : ''}{t.name}</span>
                  <span className={clsx('mt-0.5 block pl-[18px] text-[12px] text-ink-3 transition-opacity duration-200', !termOn(t.key) && pinned !== t.key && 'opacity-40')}>{t.space} space</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* Outcomes */}
        <div className="flex flex-col">
          <p className="eyebrow mb-3 text-ink-3">Outcomes</p>
          <ul className="flex flex-1 flex-col justify-around gap-4">
            {OUTCOMES.map((o) => {
              const on = mod.outcomes.includes(o.key)
              return (
                <li key={o.key} ref={reg(`o-${o.key}`)}>
                  <button
                    onClick={() => document.getElementById(`outcome-${o.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    aria-label={`${o.name}: now ${o.now}, target ${o.target}. Show the modules that move it.`}
                    className={clsx('block w-full rounded-lg border px-3 py-3 text-left transition-all duration-200 hover:border-ink hover:opacity-100 focus-ring', on ? 'border-ink bg-paper-raised' : 'border-line opacity-50')}
                  >
                    <span className="block text-[14px] leading-tight text-ink">{o.name}</span>
                    <span className="num mt-1 block text-[22px] font-light leading-none text-ink">{o.now}</span>
                    <span className="mt-1 block text-[12px] leading-tight text-ink-3">{o.target}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      <p className="mt-6 border-t border-line pt-4 text-[13px] text-ink-3">
        Lines show what each module raises. {pinned ? <>Tracing <span className="text-ink">{termName(pinned)}</span> back to the <span className="num">{MODULES.filter((m) => m.terms.includes(pinned)).length}</span> modules that raise it: click it again to clear. </> : null}{pinnedSurface ? <>Tracing <span className="text-ink">{surfaceName(pinnedSurface)}</span> to the <span className="num">{MODULES.filter((m) => m.surfaces.includes(pinnedSurface)).length}</span> modules it carries: click it again to clear, or the arrow to open it. </> : null}Commerce and the trust centre raise no term: they fund the loop and earn the right to measure it, so they connect straight to their outcome. Outcome figures are specimen, from the scoreboard.
      </p>
    </div>
  )
}

// ─── Mobile: a compact picker instead of the line map ────────────────────────
// Below lg the line map is hidden, so the picker carries both traces: a term back to the
// modules that raise it, and a surface or console to the modules it carries.
function MobileModulePicker({ sel, onSelect, trace, onTrace }: { sel: string; onSelect: (n: string) => void; trace: Trace; onTrace: (t: Trace) => void }) {
  const hits = trace ? modulesFor(trace) : null
  const lit = (m: Module) => !hits || hits.includes(m)
  return (
    <div className="mt-5 lg:hidden">
      <div id="module-trace" className="scroll-mt-24 rounded-card border border-line p-4">
        <p id="trace-term-h" className="eyebrow text-ink-3">Trace a term back to its modules</p>
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-labelledby="trace-term-h">
          {TERMS.map((t) => {
            const on = trace?.kind === 'term' && trace.key === t.key
            const n = MODULES.filter((m) => m.terms.includes(t.key)).length
            return <TermTraceButton key={t.key} term={t.key} pressed={on} onClick={() => onTrace({ kind: 'term', key: t.key })} label={`${t.name}: ${n} modules raise it. ${on ? 'Press to clear the trace.' : 'Press to trace it.'}`} />
          })}
        </div>
        <p id="trace-surface-h" className="eyebrow mt-4 text-ink-3">Or a surface to the modules it carries</p>
        <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-labelledby="trace-surface-h">
          {SURFACES.map((sf) => {
            const on = trace?.kind === 'surface' && trace.key === sf.key
            return (
              <button
                key={sf.key}
                type="button"
                aria-pressed={on}
                onClick={() => onTrace({ kind: 'surface', key: sf.key })}
                className={clsx('rounded-full border px-2.5 py-1 text-[13px] text-ink transition-colors focus-ring', on ? 'border-ink bg-paper-sunk' : 'border-line bg-paper-raised hover:border-line-strong')}
              >
                {sf.name}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-3" aria-live="polite">
          <p className="text-[14px] text-ink-2">
            {!trace || !hits ? (
              'Nothing traced: every module shows.'
            ) : trace.kind === 'term' ? (
              <><span className="text-ink">{termName(trace.key)}</span> is raised by <span className="num">{hits.length}</span> of <span className="num">14</span> modules.</>
            ) : (
              <><span className="text-ink">{surfaceName(trace.key)}</span> carries <span className="num">{hits.length}</span> of <span className="num">14</span> modules.</>
            )}
          </p>
          {trace && (
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {trace.kind === 'surface' && (() => {
                const sf = SURFACES.find((x) => x.key === trace.key)!
                return <OpenSurface to={sf.to} name={sf.name} />
              })()}
              <button type="button" onClick={() => onTrace(trace)} className="link whitespace-nowrap text-[14px] focus-ring">Clear the trace</button>
            </span>
          )}
        </div>
      </div>
      <p id="module-pick-h" className="eyebrow mt-5 text-ink-3">Fourteen modules</p>
      <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2" aria-labelledby="module-pick-h">
        {MODULES.map((m) => {
          const on = m.n === sel
          return (
            <li key={m.n}>
              <button
                aria-pressed={on}
                onClick={() => {
                  onSelect(m.n)
                  document.getElementById('module-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className={clsx('flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-[15px] transition-opacity duration-200 focus-ring', on ? 'border-ink bg-ink text-paper' : lit(m) && hits ? 'border-ink text-ink' : 'border-line text-ink', !lit(m) && !on && 'opacity-40')}
              >
                <span className={clsx('num text-[12px]', on ? 'text-paper/70' : 'text-ink-3')}>{m.n}</span>
                <span className="flex-1">
                  {m.name}
                  {hits && <span className="sr-only">{lit(m) ? ' · in the trace' : ' · not in the trace'}</span>}
                  <span className="sr-only">{m.terms.length === 0 ? ' · raises no term' : ` · raises ${m.terms.map(termName).join(', ')}`}</span>
                </span>
                <span className="flex gap-0.5" aria-hidden>{m.terms.length === 0 ? <span className={clsx('eyebrow !text-[10px]', on ? 'text-paper/70' : 'text-ink-3')}>No term</span> : m.terms.slice(0, 6).map((t) => <TermDot key={t} term={t} size={7} />)}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function OpenSurface({ to, name }: { to: string; name: string }) {
  const enterAs = useEnterAs()
  return (
    <Link to={to} onClick={() => enterAs(to)} className="inline-flex items-center gap-1 whitespace-nowrap text-[14px] text-ink underline-offset-4 hover:underline focus-ring">
      Open {name} <ArrowUpRight size={14} aria-hidden />
    </Link>
  )
}

// ─── The module's detail card ────────────────────────────────────────────────
function ModuleDetail({ mod, trace, onTraceTerm }: { mod: Module; trace: Trace; onTraceTerm: (k: TermKey) => void }) {
  const reduce = useReduceMotion()
  const enterAs = useEnterAs()
  return (
    <div id="module-detail" className="scroll-mt-24" aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.div key={mod.n} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={brandTransition(reduce, 200)}>
          <Card tone="raised" className="grid gap-8 md:p-8 lg:grid-cols-[1.1fr_1fr_1fr] lg:gap-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Eyebrow tone="daybreak">Module {mod.n} of 14</Eyebrow>
                <Pill tone="ink"><span className="num">{mod.release}</span></Pill>
              </div>
              <h3 className="text-[1.9rem] font-light leading-tight text-ink">{mod.name}</h3>
              <p className="text-[17px] leading-relaxed text-ink-2">{mod.what}</p>
              <div>
                <p className="eyebrow text-ink-3">Terms it answers to · {mod.termNote}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {mod.terms.length === 0 && <span className="text-[15px] text-ink-2">None directly.</span>}
                  {/* each term is a control: it traces the term back to every module that raises it */}
                  {mod.terms.map((t) => {
                    const on = trace?.kind === 'term' && trace.key === t
                    return <TermTraceButton key={t} term={t} pressed={on} onClick={() => onTraceTerm(t)} label={`${termName(t)}: ${on ? 'clear the trace' : 'trace it back to every module that raises it'}`} />
                  })}
                </div>
                {mod.terms.length > 0 && <p className="mt-2 text-[13px] text-ink-3">Choose a term to trace it back to every module that raises it.</p>}
              </div>
            </div>

            <dl className="grid grid-cols-2 content-start gap-x-4 gap-y-5 text-[15px] lg:border-l lg:border-line lg:pl-10">
              <div>
                <dt className="eyebrow text-ink-3">Release</dt>
                <dd className="mt-1 text-ink">{mod.releaseNote}</dd>
              </div>
              <div>
                <dt className="eyebrow text-ink-3">Kept from LifeOS</dt>
                <dd className="mt-1 text-ink">{mod.kept}</dd>
              </div>
              <div className="col-span-2">
                <dt className="eyebrow text-ink-3">Surfaces and consoles</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {mod.surfaces.map((s) => {
                    const sf = SURFACES.find((x) => x.key === s)!
                    return <Link key={s} to={sf.to} onClick={() => enterAs(sf.to)} className="rounded-full bg-paper-sunk px-2.5 py-1 text-[13px] text-ink hover:bg-line focus-ring">{sf.name}</Link>
                  })}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="eyebrow text-ink-3">Outcomes it moves</dt>
                <dd className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
                  {mod.outcomes.map((k) => {
                    const o = OUTCOMES.find((x) => x.key === k)!
                    return (
                      <a key={k} href={`#outcome-${k}`} className="rounded-lg border border-line bg-paper px-3 py-2 transition-colors hover:border-line-strong focus-ring">
                        <span className="block text-[14px] text-ink">{o.name}</span>
                        <span className="mt-0.5 flex items-baseline gap-2">
                          <span className="num text-[18px] font-light text-ink">{o.now}</span>
                          <span className="num text-[12px] text-ink-3">target {o.target.split(' · ')[0]}</span>
                        </span>
                      </a>
                    )
                  })}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="eyebrow text-ink-3">Where it lives</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {mod.arch.map((id) => {
                    const hit = ARCH_LAYERS.flatMap((l) => l.boxes.map((b) => ({ ...b, layer: l.name }))).find((b) => b.id === id)
                    if (!hit) return null
                    return (
                      <a key={id} href="#architecture" className={clsx('rounded-full px-2.5 py-1 text-[13px] text-ink transition-colors hover:border-ink focus-ring', hit.shared ? 'border border-dashed border-ink-3' : 'border border-line-strong')}>
                        {hit.name} <span className="text-ink-3">· {hit.layer}</span>
                      </a>
                    )
                  })}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="eyebrow text-ink-3">Data it keeps</dt>
                <dd className="mt-2">
                  <ul className="space-y-1.5">
                    {mod.data.map((d) => <li key={d} className="flex gap-2 text-ink-2"><span className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-ink-3" />{d}</li>)}
                  </ul>
                </dd>
              </div>
            </dl>

            <div className="flex flex-col gap-5">
              <div className="rounded-card bg-paper-sunk p-5">
                <p className="eyebrow flex items-center gap-1.5 text-ink-3"><CircleHelp size={13} /> The one-line test</p>
                <dl className="mt-3 space-y-3 text-[15px]">
                  {[
                    ['Which term does it raise?', mod.test.raise],
                    ['How will we know?', mod.test.know],
                    ['Would a member miss it?', mod.test.miss],
                  ].map(([q, a]) => (
                    <div key={q}>
                      <dt className="font-medium text-ink">{q}</dt>
                      <dd className="mt-0.5 text-ink-2">{a}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {mod.routes.map((r) => (
                  <Link key={r.to} to={r.to} onClick={() => enterAs(r.to)} className="inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">
                    See {r.label} <ArrowUpRight size={15} />
                  </Link>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Architecture, layer by layer (Memo p.28) ────────────────────────────────
type ArchFilter = 'all' | 'new' | 'shared'
function ArchitectureSection({ mod }: { mod: Module }) {
  const [filter, setFilter] = useState<ArchFilter>('all')
  const counts = useMemo(() => {
    const all = ARCH_LAYERS.flatMap((l) => l.boxes)
    return { shared: all.filter((b) => b.shared).length, fresh: all.filter((b) => !b.shared).length }
  }, [])
  return (
    <StorySection
      id="architecture"
      eyebrow="The architecture on one page"
      title={<>Joy OS, layer by <em>layer</em>.</>}
      lead="Channels → experience → the Joyspan domain → the platform core → signals → intelligence → data and trust. Multi-tenant and region-celled, India-resident by default. TypeScript end to end."
      aside={
        <Tabs<ArchFilter>
          value={filter}
          onChange={setFilter}
          items={[
            { value: 'all', label: <span className="whitespace-nowrap">All · <span className="num">{counts.fresh + counts.shared}</span></span> },
            { value: 'new', label: <span className="whitespace-nowrap">New · <span className="num">{counts.fresh}</span></span> },
            { value: 'shared', label: <span className="whitespace-nowrap">Shared · <span className="num">{counts.shared}</span></span> },
          ]}
        />
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[14px] text-ink-2">
        <span className="flex items-center gap-2"><span className="h-4 w-6 rounded border border-line-strong bg-paper-raised" /> New for Joy OS</span>
        <span className="flex items-center gap-2"><span className="h-4 w-6 rounded border border-dashed border-ink-3 bg-paper-sunk" /> Kept or extended from LifeOS</span>
        <span className="flex items-center gap-2"><span className="h-4 w-6 rounded border-2 border-ink" /> Where module {mod.n} · {mod.name} lives</span>
      </div>
      <ol className="flex flex-col gap-2" aria-label="Architecture layers, top to bottom">
        {ARCH_LAYERS.map((layer, i) => (
          <li key={layer.key} className="grid gap-3 rounded-card border border-line p-3 md:grid-cols-[200px_1fr] md:items-center md:p-4">
            <div className="flex items-baseline gap-3 md:block">
              <p className="eyebrow text-ink">
                <span className="num mr-2 text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                {layer.name}
              </p>
              <p className="text-[13px] text-ink-3 md:mt-1">{layer.note}</p>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
              {layer.boxes.map((b) => {
                const dim = (filter === 'new' && b.shared) || (filter === 'shared' && !b.shared)
                const lit = mod.arch.includes(b.id)
                return (
                  <li
                    key={b.id}
                    className={clsx(
                      'rounded-lg px-3 py-2.5 transition-all duration-200',
                      b.shared ? 'border border-dashed border-ink-3 bg-paper-sunk' : 'border border-line-strong bg-paper-raised',
                      lit && 'outline outline-2 outline-offset-1 outline-ink',
                      dim && 'opacity-25',
                    )}
                  >
                    <p className="text-[14px] leading-tight text-ink">{b.name}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-ink-3">{b.sub}</p>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>
      <p className="mt-5 flex items-start gap-2 text-[14px] text-ink-3">
        <Layers size={15} className="mt-0.5 shrink-0" />
        Stack: TypeScript end to end; Expo / React Native for iOS and Android; Next.js for the web; Node services; PostgreSQL with row-level security. Detail, data model and sequences live in the Joy OS Technical Architecture.
      </p>
    </StorySection>
  )
}

// ─── Two apps, one core (Memo p.6) ───────────────────────────────────────────
function TwoAppsSection() {
  const app = (a: typeof TWO_APPS.lifeos, dashed?: boolean) => (
    <Card tone={dashed ? 'sunk' : 'raised'} className={clsx('flex flex-col gap-4', dashed && 'border border-dashed border-ink-3')}>
      <div className="flex items-center justify-between">
        <p className="text-[1.5rem] font-light text-ink">{a.name}</p>
        <Pill tone={dashed ? 'neutral' : 'ink'}>{a.tag}</Pill>
      </div>
      <p className="text-[19px] font-light leading-snug text-ink">“{a.promise}”</p>
      <dl className="space-y-3 border-t border-line pt-4 text-[14px]">
        {[['For', a.for], ['Organised by', a.by], ['Scale', a.scale], [dashed ? 'Inside Joy OS' : 'Brand', a.inside]].map(([k, v]) => (
          <div key={k}>
            <dt className="eyebrow text-ink-3">{k}</dt>
            <dd className="mt-0.5 text-ink-2">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
  return (
    <StorySection
      id="two-apps"
      eyebrow="Shared with LifeOS, and new"
      title={<>Two apps, one platform <em>core</em>.</>}
      lead="LifeOS stays the longevity clinic in your pocket. Joy OS ships as its own app, organised by the six terms. Both run on one AIWO Platform Core: one login, one record. A LifeOS member opening Joy OS finds their biomarkers already in the Body space; neither ever re-enters data."
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr_1fr]">
        {app(TWO_APPS.lifeos, true)}
        <Card tone="outline" className="flex flex-col">
          <div className="flex items-center gap-2">
            <MonitorSmartphone size={18} className="text-ink-2" />
            <p className="eyebrow text-ink">The AIWO Platform Core · shared</p>
          </div>
          <ul className="mt-4 flex-1 space-y-2.5">
            {TWO_APPS.core.map((c) => (
              <li key={c} className="flex gap-3 text-[15px] text-ink-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-lg bg-paper-sunk p-3 text-[14px] text-ink-2">
            Why not rename LifeOS? A rename forces a launched clinical app to change its promise under live members. Why not a fresh codebase? The hardest, most regulated parts already exist.
          </p>
        </Card>
        {app(TWO_APPS.joyos)}
      </div>
    </StorySection>
  )
}

// ─── Outcomes (Memo p.38) ────────────────────────────────────────────────────
function OutcomesSection({ onSelect, sel }: { onSelect: (n: string) => void; sel: string }) {
  const nav = useNavigate()
  return (
    <StorySection
      id="outcomes"
      eyebrow="What the modules are for"
      title={<>Three outcomes every module must <em>move</em>.</>}
      lead="Engagement is measured as re-measured members and terms that moved, not time in app. A feature that adds minutes without moving a term is removed."
      aside={<SpecimenTag />}
    >
      <div className="grid gap-5 md:grid-cols-3">
        {OUTCOMES.map((o) => {
          const mods = MODULES.filter((m) => m.outcomes.includes(o.key as OutcomeKey))
          return (
            <Card key={o.key} id={`outcome-${o.key}`} className="flex scroll-mt-24 flex-col">
              <Eyebrow>{o.name}</Eyebrow>
              <p className="mt-3 text-[15px] text-ink-2">{o.measure}</p>
              <div className="mt-4 flex items-end gap-3">
                <span className="num text-[3rem] font-light leading-none text-ink">{o.now}</span>
                <span className="mb-1 text-[14px] text-ink-3">target {o.target}</span>
              </div>
              <p className="mt-3 text-[15px] text-ink">{o.why}</p>
              <p className="eyebrow mt-5 border-t border-line pt-4 text-ink-3">Moved by {mods.length} modules</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {mods.map((m) => (
                  <li key={m.n}>
                    <button onClick={() => onSelect(m.n)} aria-pressed={m.n === sel} className={clsx('rounded-full px-2.5 py-1 text-[13px] transition-colors focus-ring', m.n === sel ? 'bg-ink text-paper' : 'bg-paper-sunk text-ink hover:bg-line')}>
                      <span className="num mr-1 opacity-60">{m.n}</span>{m.name}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>
      <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-card border border-line p-5 md:flex-row md:items-center md:p-6">
        <p className="max-w-2xl text-[17px] text-ink">See the same modules from the member’s side: five journeys, one loop, and a link from every step into the screen that serves it.</p>
        <DaybreakButton onClick={() => nav('/journeys')} className="shrink-0">Explore the journeys <ArrowRight size={16} /></DaybreakButton>
      </div>
    </StorySection>
  )
}
