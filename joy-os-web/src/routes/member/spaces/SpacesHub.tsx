import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Lock, Watch } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { BandLabel, Delta, Eyebrow, MethodLine, SpecimenTag, TermDot } from '@/components/joy/primitives'
import { Card, PageHeader, Pill } from '@/components/ui'
import { INDEX_HISTORY } from '@/data/member'
import { TERMS, termByKey, termColor } from '@/data/terms'
import type { TermKey } from '@/domain/types'
import { ROOM_PLAIN, ROOM_VERDICT, actionsFor } from './_data'
import { Reveal, TermRule, softColor } from './_SpaceShell'

// SPACES HUB (Memo p.19): six rooms, named in plain words. Each with its Spectrum
// colour and name, score, band, delta and framework. The Wheel selects a petal.
// The lowest term is highlighted: start here. One Daybreak button.
export default function SpacesHub() {
  const latest = INDEX_HISTORY[0]
  const lowest = latest.lowestTerm
  const [selected, setSelected] = useState<TermKey>(lowest)
  const sel = termByKey(selected)
  const selScore = latest.terms.find((t) => t.key === selected)!
  const lowTerm = termByKey(lowest)
  const firstAction = actionsFor(selected)[0]

  return (
    <div>
      <PageHeader
        eyebrow="Spaces · six rooms, one life"
        title={<>Where each part of your life <em>lives</em></>}
        lead="Every term of the Joyspan equation has a room of its own, with its own tools, its own measure and its own people. Start with the lowest; visit any."
        actions={<Link to={`/app/spaces/${lowTerm.slug}`} className="btn-daybreak focus-ring">Start here · {lowTerm.space} <ArrowRight size={18} /></Link>}
      />

      {/* The Wheel and the selected room */}
      <Reveal>
        <Card className="grid gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-10">
          <div className="flex flex-col items-center">
            <JoyspanWheel terms={latest.terms} size={260} value={latest.value} showLabels highlight={selected} onSelect={setSelected} />
            <p className="mt-2 max-w-[30ch] text-center text-[13px] text-ink-3">Tap a petal to see its room here. Ease is hatched and counted as a minus.</p>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Eyebrow>Your Index · <span className="num">{latest.value}</span> · {latest.band}</Eyebrow>
              <SpecimenTag className="hidden sm:inline-flex" />
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={selected} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className="mt-5 flex items-center gap-2.5">
                  <TermDot term={selected} size={12} />
                  <span className="text-[1.6rem] font-light text-ink">{sel.space}</span>
                  {sel.name !== sel.space && <span className="text-[15px] text-ink-3">· {sel.name}</span>}
                  {selected === lowest && <Pill tone="daybreak" className="ml-1">Start here</Pill>}
                </div>
                <p className="mt-1 text-[15px] text-ink-2">{ROOM_PLAIN[selected]}</p>
                <div className="mt-5 flex items-end gap-4">
                  <span className="num text-[4.5rem] font-light leading-[0.85] text-ink">{selected === 'B' ? '−' : ''}{selScore.value}</span>
                  <span className="mb-1 flex flex-col gap-1">
                    <Delta value={selScore.delta} inverse={selected === 'B'} />
                    <BandLabel band={selScore.band} />
                  </span>
                </div>
                <p className="mt-4 max-w-[52ch] text-[17px] text-ink">{ROOM_VERDICT[selected]}</p>
                <TermRule term={selected} className="my-5 max-w-[12rem]" />
                <p className="text-[14px] text-ink-2"><span className="eyebrow mr-2 text-ink-3">Framework</span>{sel.framework}</p>
                <p className="mt-2 text-[14px] text-ink-2"><span className="eyebrow mr-2 text-ink-3">A first step</span>{firstAction.title}</p>
                <Link to={`/app/spaces/${sel.slug}`} className="mt-5 inline-flex items-center gap-1.5 text-[16px] text-ink underline-offset-4 hover:underline focus-ring rounded">
                  Open {sel.space} <ArrowRight size={16} />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </Card>
      </Reveal>

      {/* The six rooms */}
      <section className="mt-12" aria-labelledby="rooms">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="rooms" className="eyebrow text-ink-3">The six rooms</h2>
          <MethodLine method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TERMS.map((t, i) => {
            const s = latest.terms.find((x) => x.key === t.key)!
            const isLow = t.key === lowest
            const isB = t.key === 'B'
            return (
              <motion.li key={t.key} className="flex" initial={{ y: 8 }} animate={{ y: 0 }} transition={{ duration: 0.24, delay: i * 0.03 }}>
                  <Link
                    to={`/app/spaces/${t.slug}`}
                    onMouseEnter={() => setSelected(t.key)}
                    onFocus={() => setSelected(t.key)}
                    className={clsx(
                      'group relative flex w-full flex-col overflow-hidden rounded-card border bg-paper-raised p-5 shadow-card transition-[border-color,transform] duration-200 hover:-translate-y-0.5 focus-ring md:p-6',
                      isLow ? 'border-ink' : 'border-line hover:border-line-strong',
                    )}
                  >
                    <span aria-hidden className={clsx('absolute inset-x-0 top-0 h-1', isB && 'hatch-b')} style={isB ? undefined : { background: termColor[t.key] }} />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 text-[1.35rem] font-light text-ink"><TermDot term={t.key} size={11} /> {t.space}</p>
                        <p className="mt-0.5 text-[14px] text-ink-3">{t.space === t.name ? t.instruments.join(' · ') : t.name}</p>
                      </div>
                      {isLow && <Pill tone="daybreak">Start here</Pill>}
                    </div>
                    <p className="mt-3 text-[15px] text-ink-2">{ROOM_PLAIN[t.key]}</p>
                    <div className="mt-5 flex items-end gap-3">
                      <span className="num text-[3rem] font-light leading-none text-ink">{isB ? '−' : ''}{s.value}</span>
                      <span className="mb-0.5 flex flex-col gap-0.5">
                        <Delta value={s.delta} inverse={isB} className="text-[14px]" />
                        <BandLabel band={s.band} />
                      </span>
                    </div>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full" style={{ background: softColor[t.key] }} aria-hidden>
                      <div className={clsx('h-full rounded-full', isB && 'hatch-b')} style={{ width: `${s.value}%`, background: isB ? undefined : termColor[t.key] }} />
                    </div>
                    <p className="mt-4 text-[13px] leading-snug text-ink-3">{t.framework}</p>
                    <span className="mt-auto flex items-center gap-1.5 pt-5 text-[14px] text-ink">
                      Enter {t.space} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
              </motion.li>
            )
          })}
        </ul>
      </section>

      {/* How rooms work */}
      <section className="mt-12 grid gap-5 md:grid-cols-3" aria-labelledby="how-spaces">
        <h2 id="how-spaces" className="sr-only">How the spaces work</h2>
        <Card tone="sunk">
          <Watch size={18} className="text-ink-2" aria-hidden />
          <h3 className="mt-3 text-[17px] font-normal text-ink">Every room works without a device.</h3>
          <p className="mt-1.5 text-[15px] text-ink-2">A full Index comes from instruments. Your Oura and Apple Health enrich Body, Pleasure and Ease; they never gate them.</p>
        </Card>
        <Card tone="sunk">
          <Lock size={18} className="text-ink-2" aria-hidden />
          <h3 className="mt-3 text-[17px] font-normal text-ink">Sensitive by default.</h3>
          <p className="mt-1.5 text-[15px] text-ink-2">Purpose, People and Freedom answers are kept as carefully as biomarkers: encrypted, audited, never sold. Calendars are summarised, then dropped.</p>
        </Card>
        <Card tone="sunk">
          <span className="flex items-center gap-1.5" aria-hidden><TermDot term="B" size={14} /><span className="num text-ink-2">−</span></span>
          <h3 className="mt-3 text-[17px] font-normal text-ink">Ease counts as a minus.</h3>
          <p className="mt-1.5 text-[15px] text-ink-2">Preventable Suffering is subtracted from the other five: JI = GM(H, P, R, F, D) − 0.25·B. In Ease, lower is better.</p>
        </Card>
      </section>
    </div>
  )
}
