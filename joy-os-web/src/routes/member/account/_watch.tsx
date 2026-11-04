import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Plus, Watch } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SpecimenTag } from '@/components/joy/primitives'
import { Button, Card, Pill } from '@/components/ui'
import { useDict, useLang } from '@/lib/i18n'
import { brandTransition, useReduceMotion } from '@/lib/motion'
import { useApp } from '@/lib/store'
import { useCore } from '@/routes/member/core/_i18n'
import { Toggle } from './_parts'
import { usePersisted } from './_util'
import { DEV } from './_i18n'

// THE WATCH COMPLICATION (platform map: Watch · Ledger complication · J3). A simulated watch
// face with a small + complication: tap it, pick one tag, and a real Joy Ledger entry is added
// through the app store, exactly as the Ledger screen adds one. No free text on the wrist, so
// nothing to intercept; no counts on the face, no streaks. Shown on /app/devices and on the
// WhatsApp and watch screen; both read the same 'joyos:acct:watch' record.

export interface WatchState { paired: boolean; complication: boolean; added: { at: string; tag: string }[] }
export const WATCH_DEFAULT: WatchState = { paired: true, complication: true, added: [] }
const WATCH_TAGS = ['People', 'Food', 'Movement', 'Rest']
const ON_GROUND = 'text-[color:var(--aiwo-stone)]'
const ON_GROUND_2 = 'text-[color:color-mix(in_srgb,var(--aiwo-stone)_62%,transparent)]'

/** The Ledger prompt for the time of day (12:40, 16:15, 21:30), as the Ledger schedule has it. */
function promptNow(d = new Date()): 1 | 2 | 3 {
  const m = d.getHours() * 60 + d.getMinutes()
  return m < 16 * 60 + 15 ? 1 : m < 21 * 60 + 30 ? 2 : 3
}
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

export function useWatch() {
  return usePersisted<WatchState>('watch', WATCH_DEFAULT)
}

/** The simulated watch and its controls. `compact` drops the pairing controls (WhatsApp screen). */
export function WatchComplication({ onToast, compact = false }: { onToast: (m: string) => void; compact?: boolean }) {
  const t = useDict(DEV)
  const reduce = useReduceMotion()
  const { tag: tagText } = useCore()
  const lang = useLang()
  const { addLedger } = useApp()
  const [w, setW] = useWatch()
  const [screen, setScreen] = useState<'face' | 'pick' | 'saved'>('face')
  const [now, setNow] = useState(() => new Date())
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000)
    return () => { window.clearInterval(id); window.clearTimeout(timer.current) }
  }, [])
  const live = w.paired && w.complication

  const add = (tag: string) => {
    addLedger({ prompt: promptNow(), tags: [tag] })
    setW((cur) => ({ ...cur, added: [{ at: new Date().toISOString(), tag }, ...cur.added].slice(0, 12) }))
    setScreen('saved')
    onToast(t('wxToast', { tag: tagText(tag) }))
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setScreen('face'), 1800)
  }

  const face = (
    <div className="flex shrink-0 flex-col items-center">
      <div className="rounded-[2.6rem] border-[7px] border-ink-ground bg-ink-ground shadow-lift ring-1 ring-line-strong" role="group" aria-label={t('wxFaceAria')}>
        <div className={clsx('relative flex h-[216px] w-[180px] flex-col items-center justify-center overflow-hidden rounded-[2.1rem] bg-ink-ground px-4', ON_GROUND)}>
          {!w.paired ? (
            <Watch size={30} className={ON_GROUND_2} aria-hidden />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {screen === 'face' && (
                <motion.div key="face" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={brandTransition(reduce, 150)} className="flex flex-col items-center">
                  <span className={clsx('eyebrow', ON_GROUND_2)}>{now.toLocaleDateString(lang === 'en' ? 'en-GB' : `${lang}-IN`, { weekday: 'short', day: 'numeric', numberingSystem: 'latn' })}</span>
                  <span className="num mt-1 text-[3rem] font-light leading-none">{hhmm(now)}</span>
                  {w.complication ? (
                    <button
                      type="button"
                      onClick={() => setScreen('pick')}
                      aria-label={t('wxComplAria')}
                      className="mt-5 flex h-12 w-12 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--aiwo-stone)_35%,transparent)] focus-ring"
                    >
                      <Plus size={22} />
                    </button>
                  ) : (
                    <span className="mt-5 h-12" aria-hidden />
                  )}
                </motion.div>
              )}
              {screen === 'pick' && (
                <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={brandTransition(reduce, 150)} className="flex w-full flex-col items-center">
                  <p className="text-[15px]">{t('wxAsk')}</p>
                  <div className="mt-3 grid w-full grid-cols-2 gap-1.5">
                    {WATCH_TAGS.map((tag) => (
                      <button key={tag} type="button" onClick={() => add(tag)} className="min-h-10 rounded-full bg-[color:color-mix(in_srgb,var(--aiwo-stone)_14%,transparent)] px-2 text-[13px] focus-ring">
                        {tagText(tag)}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setScreen('face')} className={clsx('mt-2 rounded-full px-3 py-1 text-[12px] focus-ring', ON_GROUND_2)}>{t('cancel')}</button>
                </motion.div>
              )}
              {screen === 'saved' && (
                <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={brandTransition(reduce, 150)} className="flex flex-col items-center text-center" role="status">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--aiwo-stone)_35%,transparent)]"><Check size={22} /></span>
                  <p className="mt-3 text-[16px]">{t('wxSaved')}</p>
                  <p className={clsx('text-[12px]', ON_GROUND_2)}>{t('wxSavedSub')}</p>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
      <p className="mt-3 max-w-[200px] text-center text-[13px] text-ink-3">{!w.paired ? t('wxPairHint') : w.complication ? t('wxTapHint') : t('wxNoFace')}</p>
    </div>
  )

  const recent = (
    <div>
      <p className="eyebrow text-ink-3">{t('wxToday')}</p>
      {w.added.length === 0 ? (
        <p className="mt-2 text-[14px] text-ink-2">{t('wxNone')}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {w.added.slice(0, 4).map((a) => (
            <li key={a.at} className="flex items-center justify-between gap-3 text-[15px]">
              <span className="text-ink">{tagText(a.tag)}</span>
              <span className="num text-[13px] text-ink-3">{hhmm(new Date(a.at))}</span>
            </li>
          ))}
        </ul>
      )}
      <Link to="/app/ledger" className="mt-3 inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">{t('wxSeeLedger')} <ArrowRight size={14} /></Link>
    </div>
  )

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {face}
        <div className="min-w-0 flex-1">{recent}</div>
      </div>
    )
  }

  return (
    <Card className="flex flex-col gap-8 md:flex-row md:items-start">
      {face}
      <div className="min-w-0 flex-1 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[17px] text-ink">{t('wxName')}</p>
            <p className="text-[14px] text-ink-2">{w.paired ? t('wxPaired') : t('wxUnpaired')}</p>
          </div>
          {live ? <Pill tone="positive"><Check size={12} /> {t('wxComplOn')}</Pill> : <SpecimenTag />}
        </div>
        <Toggle
          checked={w.complication}
          disabled={!w.paired}
          onChange={(v) => { setW((cur) => ({ ...cur, complication: v })); setScreen('face'); onToast(v ? t('wxComplOn') : t('wxComplOff')) }}
          label={<span className="text-[15px]">{t('wxCompl')}</span>}
          description={t('wxComplDesc')}
        />
        <div className="border-t border-line pt-5">{recent}</div>
        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          {w.paired ? (
            <Button size="sm" variant="ghost" onClick={() => { setW((cur) => ({ ...cur, paired: false })); setScreen('face'); onToast(t('wxUnpairedToast')) }}>{t('wxUnpair')}</Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => { setW((cur) => ({ ...cur, paired: true, complication: true })); onToast(t('wxPairedToast')) }}><Watch size={15} /> {t('wxPair')}</Button>
          )}
          <span className="text-[13px] text-ink-3">{t('wxSpecimen')}</span>
        </div>
      </div>
    </Card>
  )
}
