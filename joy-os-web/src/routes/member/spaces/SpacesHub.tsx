import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BellRing, Lock, Watch } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { BandLabel, Delta, Eyebrow, MethodLine, SpecimenTag, TermDot } from '@/components/joy/primitives'
import { Card, PageHeader, Pill } from '@/components/ui'
import { INDEX_HISTORY } from '@/data/member'
import { TERMS, termByKey, termColor } from '@/data/terms'
import type { TermKey } from '@/domain/types'
import { ROOM_PLAIN, ROOM_VERDICT, actionsFor } from './_data'
import { Reveal, TermRule, softColor } from './_SpaceShell'
import { useSpaceText } from './_i18n'
import { useIsMinor } from '@/lib/minor'
import { SABBATH_DAYS, SABBATH_KEY, nextSabbathOn, readSpaceState, type SabbathPlan } from './_state'

// SPACES HUB (Memo p.19): six rooms, named in plain words. Each with its Spectrum
// colour and name, score, band, delta and framework. The Wheel selects a petal.
// The lowest term is highlighted: start here. One Daybreak button.
// Under 18 nothing is scored (the minors gate): no Index, Wheel values, scores, bands or
// deltas; the Wheel stays empty, each room says so, and no room is ranked as the lowest.
export default function SpacesHub() {
  const latest = INDEX_HISTORY[0]
  const minor = useIsMinor()
  // A minor's Wheel: every petal unscored (drawn as an outline), no numeral in the centre.
  const wheelTerms = useMemo(() => (minor ? latest.terms.map((x) => ({ ...x, value: null, delta: undefined })) : latest.terms), [minor, latest.terms])
  // Without scores there is no lowest term to start from; Pleasure opens the hub instead.
  const lowest = minor ? 'D' : latest.lowestTerm
  const [selected, setSelected] = useState<TermKey>(lowest)
  const sel = termByKey(selected)
  const selScore = latest.terms.find((t) => t.key === selected)!
  const lowTerm = termByKey(lowest)
  const firstAction = actionsFor(selected)[0]
  const { t, tt, d, r, wdm } = useSpaceText()
  const tx = t
  // The digital sabbath kept in Freedom: the in-app reminder of the next one (no calendar holds it).
  const sabbath = readSpaceState<SabbathPlan | null>(SABBATH_KEY, null)
  const nextSabbath = sabbath && SABBATH_DAYS.includes(sabbath.day) && /^\d{2}:\d{2}$/.test(sabbath.from) && /^\d{2}:\d{2}$/.test(sabbath.to) ? sabbath : null

  return (
    <div>
      <PageHeader
        eyebrow={t('hub.eyebrow')}
        title={<>{r('hub.title', { e: <em>{t('hub.titleE')}</em> })}</>}
        lead={minor ? t('mn.hubLead') : t('hub.lead')}
        actions={<Link to={`/app/spaces/${lowTerm.slug}`} className="btn-daybreak focus-ring">{minor ? t('hub.open', { space: tt.space(lowest) }) : t('hub.startHereSpace', { space: tt.space(lowest) })} <ArrowRight size={18} /></Link>}
      />

      {nextSabbath && (
        <p role="note" className="-mt-2 mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-line bg-paper-raised px-4 py-3 text-[14px] text-ink-2">
          <BellRing size={15} className="shrink-0 text-ink-3" aria-hidden />
          <span className="text-ink">{r('fr.sb.next', { date: wdm(nextSabbathOn(nextSabbath.day)), from: <span className="num">{nextSabbath.from}</span>, to: <span className="num">{nextSabbath.to}</span> })}</span>
          <span>{t('fr.sb.nextB')}</span>
          <Link to="/app/spaces/freedom" className="inline-flex items-center gap-1 rounded text-ink underline underline-offset-4 focus-ring">{t('fr.sb.open')} <ArrowRight size={13} aria-hidden /></Link>
        </p>
      )}

      {/* The Wheel and the selected room */}
      <Reveal>
        <Card className="grid gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-10">
          <div className="flex flex-col items-center">
            <JoyspanWheel terms={wheelTerms} size={260} value={minor ? undefined : latest.value} showLabels highlight={selected} onSelect={setSelected} />
            <p className="mt-2 max-w-[30ch] text-center text-[13px] text-ink-3">{minor ? t('mn.wheel') : t('hub.tapPetal', { ease: tt.space('B') })}</p>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Eyebrow>{minor ? t('mn.hub') : <>{t('hub.yourIndex')} · <span className="num">{latest.value}</span> · {t(`band.${latest.band}`)}</>}</Eyebrow>
              <SpecimenTag className="hidden sm:inline-flex" />
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={selected} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <TermDot term={selected} size={12} />
                  <span className="text-[1.6rem] font-light text-ink">{tt.space(selected)}</span>
                  {sel.name !== sel.space && <span className="text-[15px] text-ink-3">· {tt.name(selected)}</span>}
                  {selected === lowest && !minor && <Pill tone="daybreak" className="ml-1">{t('hub.startHere')}</Pill>}
                </div>
                <p className="mt-1 text-[15px] text-ink-2">{d(ROOM_PLAIN[selected])}</p>
                {minor ? (
                  <p className="mt-5 rounded-2xl bg-paper-sunk px-4 py-3 text-[15px] text-ink-2">{t('mn.title')}</p>
                ) : (
                  <div className="mt-5 flex items-end gap-4">
                    <span className="num text-[4.5rem] font-light leading-[0.85] text-ink">{selected === 'B' ? '−' : ''}{selScore.value}</span>
                    <span className="mb-1 flex flex-col gap-1">
                      <Delta value={selScore.delta} inverse={selected === 'B'} />
                      <BandLabel band={selScore.band} />
                    </span>
                  </div>
                )}
                <p className="mt-4 max-w-[52ch] text-[17px] text-ink">{minor ? t(`mn.lead.${selected}`) : d(ROOM_VERDICT[selected])}</p>
                <TermRule term={selected} className="my-5 max-w-[12rem]" />
                <p className="break-words text-[14px] text-ink-2"><span className="eyebrow mr-2 text-ink-3">{t('sh.framework')}</span>{d(sel.framework)}</p>
                <p className="mt-2 text-[14px] text-ink-2"><span className="eyebrow mr-2 text-ink-3">{t('hub.firstStep')}</span>{d(firstAction.title)}</p>
                <Link to={`/app/spaces/${sel.slug}`} className="mt-5 inline-flex items-center gap-1.5 text-[16px] text-ink underline-offset-4 hover:underline focus-ring rounded">
                  {t('hub.open', { space: tt.space(selected) })} <ArrowRight size={16} />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </Card>
      </Reveal>

      {/* The six rooms */}
      <section className="mt-12" aria-labelledby="rooms">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="rooms" className="eyebrow text-ink-3">{t('hub.rooms')}</h2>
          {minor ? <p className="text-[13px] text-ink-3">{t('mn.body')}</p> : <MethodLine method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />}
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TERMS.map((t, i) => {
            const s = latest.terms.find((x) => x.key === t.key)!
            const isLow = t.key === lowest && !minor
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
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-[1.35rem] font-light text-ink"><TermDot term={t.key} size={11} /> {tt.space(t.key)}</p>
                        <p className="mt-0.5 break-words text-[14px] text-ink-3">{t.space === t.name ? t.instruments.map(d).join(' · ') : tt.name(t.key)}</p>
                      </div>
                      {isLow && <Pill tone="daybreak" className="shrink-0">{tx('hub.startHere')}</Pill>}
                    </div>
                    <p className="mt-3 text-[15px] text-ink-2">{d(ROOM_PLAIN[t.key])}</p>
                    {minor ? (
                      <p className="mt-5 text-[14px] text-ink-3">{tx('mn.room')}</p>
                    ) : (
                      <>
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
                      </>
                    )}
                    <p className="mt-4 break-words text-[13px] leading-snug text-ink-3">{d(t.framework)}</p>
                    <span className="mt-auto flex items-center gap-1.5 pt-5 text-[14px] text-ink">
                      {tx('hub.enter', { space: tt.space(t.key) })} <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
              </motion.li>
            )
          })}
        </ul>
      </section>

      {/* How rooms work */}
      <section className="mt-12 grid gap-5 md:grid-cols-3" aria-labelledby="how-spaces">
        <h2 id="how-spaces" className="sr-only">{t('hub.how')}</h2>
        <Card tone="sunk">
          <Watch size={18} className="text-ink-2" aria-hidden />
          <h3 className="mt-3 text-[17px] font-normal text-ink">{t('hub.c1t')}</h3>
          <p className="mt-1.5 text-[15px] text-ink-2">{t('hub.c1b', { body: tt.space('H'), pleasure: tt.space('D'), ease: tt.space('B') })}</p>
        </Card>
        <Card tone="sunk">
          <Lock size={18} className="text-ink-2" aria-hidden />
          <h3 className="mt-3 text-[17px] font-normal text-ink">{t('hub.c2t')}</h3>
          <p className="mt-1.5 text-[15px] text-ink-2">{t('hub.c2b', { purpose: tt.space('P'), people: tt.space('R'), freedom: tt.space('F') })}</p>
        </Card>
        <Card tone="sunk">
          <span className="flex items-center gap-1.5" aria-hidden><TermDot term="B" size={14} /><span className="num text-ink-2">−</span></span>
          <h3 className="mt-3 text-[17px] font-normal text-ink">{t('hub.c3t', { ease: tt.space('B') })}</h3>
          <p className="mt-1.5 text-[15px] text-ink-2">{t('hub.c3b', { bname: tt.name('B'), ease: tt.space('B') })}</p>
        </Card>
      </section>
    </div>
  )
}
