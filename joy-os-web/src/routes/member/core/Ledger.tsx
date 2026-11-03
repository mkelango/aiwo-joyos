import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { BellOff, Camera, Check, CloudOff, EyeOff, Lock, MessageCircle, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { DaybreakButton, Eyebrow, MethodLine, SpecimenTag, TermChip } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill, SectionTitle } from '@/components/ui'
import { INDEX_HISTORY, LEDGER, LEDGER_TAGS, MEMBER } from '@/data/member'
import type { LedgerEntry } from '@/domain/types'
import { interceptsCrisis, useApp } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { LEDGER_CALENDAR, LEDGER_SCHEDULE, LEDGER_STORY } from './_data'
import { Provenance, Switch, TICK } from './_parts'
import { SPECIMEN_TODAY, addDays, isSeed, liveLedger, localDay, useKeptPrompts, useLedgerRemoved, useLocal, usePlannedPleasures, weekCounts, weekEntryCount, type ScheduleRow } from './_store'
import { useX } from './_i18nX'
import { formulaText } from './_extra'
import { EmptyIllustration } from '@/components/joy/EmptyIllustration'
import { termByKey } from '@/data/terms'
import { PLANNED_START } from '@/routes/member/spaces/_data'
import { useSpaceText } from '@/routes/member/spaces/_i18n'
import { SCHEDULE_LABEL, STORY_TEXT, fmtLocal, rich, useCore } from './_i18n'
import type { Lang } from '@/lib/store'
import { playSound } from '@/lib/sound'

// THE JOY LEDGER (Memo p.17 screen 03, p.19 Pleasure; Plan §4B).
// Three ten-second prompts a day on a Daybreak-soft ground; tags, an optional word or
// photo; a weekly view of where joy came from. Free text passes the crisis intercept first.

const [QUIET_FROM, QUIET_TO] = MEMBER.quietHours.split('–').map((s) => s.trim())
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const inQuiet = (hhmm: string) => {
  const t = toMin(hhmm)
  return t >= toMin(QUIET_FROM) || t < toMin(QUIET_TO)
}
const dayKey = (iso: string) => iso.slice(0, 10)
const asDate = (day: string) => new Date(`${day}T12:00:00`)
const fmtDay = (d: Date, lang: Lang = 'en') => fmtLocal(d, lang, { weekday: 'short', day: 'numeric', month: 'short' })
const fmtTime = (iso: string) => iso.slice(11, 16)
const nowHHMM = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const DEFAULT_SCHEDULE: ScheduleRow[] = LEDGER_SCHEDULE.map((s) => ({ ...s, on: true }))
const SEED_FIRST_DAY = LEDGER.map((e) => dayKey(e.at)).sort()[0]

/** Which prompt is current, and which comes next, from the member's own schedule. */
function promptState(rows: ScheduleRow[], now = nowHHMM()) {
  const active = rows.filter((r) => r.on && !inQuiet(r.time)).sort((a, b) => toMin(a.time) - toMin(b.time))
  const passed = active.filter((r) => toMin(r.time) <= toMin(now))
  const current = passed[passed.length - 1] ?? active[0] ?? null
  const next = active.find((r) => toMin(r.time) > toMin(now) && r !== current) ?? null
  return { active, current, next }
}

/** Shrink a photo on the device to a small thumbnail (it never leaves the phone). */
async function toThumb(file: File, max = 320): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(img.naturalWidth * r))
    c.height = Math.max(1, Math.round(img.naturalHeight * r))
    c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.78)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function Ledger() {
  const { ledger, syncQueue, queueSync, unqueueSync } = useApp()
  const [removed, setRemoved] = useLedgerRemoved()
  const [rows, setRows] = useLocal<ScheduleRow[]>('ledger-schedule', DEFAULT_SCHEDULE)
  const live = useMemo(() => liveLedger(ledger, removed), [ledger, removed])
  const latest = INDEX_HISTORY[0]
  const d = latest.terms.find((t) => t.key === 'D')!
  const { active, current, next } = promptState(rows)
  const prompt: 1 | 2 | 3 = current?.prompt ?? 1
  const { t: c, name, space, lang } = useCore()

  return (
    <div>
      <PageHeader
        eyebrow={`${name('D')} · ${c('lgName')}`}
        title={rich(c('lgTitle'))}
        lead={c('lgLead')}
        actions={
          <Pill tone="neutral">
            {active.length === 0 ? c('lgPromptsOff') : rich(c('lgPromptToday'), { p: <span className="num">{prompt}</span>, n: <span className="num">3</span> })}
          </Pill>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-8">
        <PromptCard prompt={prompt} time={current?.time} next={next} live={live} />
        <ScheduleCard rows={rows} setRows={setRows} />
      </div>

      <FollowUps />

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-2 lg:gap-8">
        <WeekCard ledger={ledger} removed={removed} />
        <CalendarCard live={live} />
      </div>

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
        <EntriesCard
          live={live}
          onRemove={(id) => {
            setRemoved((r) => [...new Set([...r, id])])
            // Offline: an entry added and removed before sync simply leaves the queue;
            // removing one that already synced queues the removal instead.
            if (syncQueue.some((q) => q.id === id)) unqueueSync(id)
            else queueSync({ id: `rm:${id}`, kind: 'ledger-remove' })
          }}
          onRestore={(id) => {
            setRemoved((r) => r.filter((x) => x !== id))
            if (syncQueue.some((q) => q.id === `rm:${id}`)) unqueueSync(`rm:${id}`)
            else {
              const e = ledger.find((x) => x.id === id)
              if (e && !isSeed(e)) queueSync({ id, kind: 'ledger' }) // only while offline
            }
          }}
        />
        <div className="flex flex-col gap-6">
          <Card tone="raised">
            <div className="flex items-center justify-between gap-3">
              <TermChip term="D" />
              <span className="num text-[2rem] font-light text-ink">{d.value}</span>
            </div>
            <p className="mt-3 text-[15px] text-ink-2">
              {rich(c('lgFeeds'), { term: name('D'), f: <span className="num text-ink">{formulaText(termByKey('D').formula, lang)}</span> })}
            </p>
            <MethodLine className="mt-4" method={latest.method} grade={latest.grade} next={latest.nextMeasure} />
            <Link to="/app/spaces/pleasure" className="mt-3 inline-block text-[14px] text-ink underline-offset-4 hover:underline focus-ring">{c('openSpace', { space: space('D') })}</Link>
          </Card>
          <PrivacyCard />
        </div>
      </div>
    </div>
  )
}

// ─── The prompt card (Daybreak soft ground) ─────────────────────────────────
function PromptCard({ prompt, time, next, live }: { prompt: 1 | 2 | 3; time?: string; next: ScheduleRow | null; live: LedgerEntry[] }) {
  const t = useT()
  const { t: c, lang, name, tag: tagText } = useCore()
  const { ledger, addLedger, setCrisisOpen, offline } = useApp()
  const [photos, setPhotos] = useLocal<Record<string, string>>('ledger-photos', {})
  const wordId = useId()
  const labelId = useId()
  const askId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const pendingPhoto = useRef<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [showExtra, setShowExtra] = useState(false)
  const [word, setWord] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<'' | 'lgNotPhoto' | 'lgUnreadable'>('')
  const [state, setState] = useState<'ask' | 'saved' | 'later' | 'held'>('ask')
  const [touched, setTouched] = useState(false)
  const todayCount = live.filter((e) => dayKey(e.at) === SPECIMEN_TODAY).length
  const empty = tags.length === 0 && word.trim() === '' && !photo

  // The store stamps the new entry; attach the on-device thumbnail to it.
  useEffect(() => {
    const top = ledger[0]
    if (!pendingPhoto.current || !top || isSeed(top) || photos[top.id]) return
    const url = pendingPhoto.current
    pendingPhoto.current = null
    setPhotos((p) => ({ ...p, [top.id]: url }))
  }, [ledger, photos, setPhotos])

  const toggleTag = (tag: string) => setTags((ts) => (ts.includes(tag) ? ts.filter((x) => x !== tag) : [...ts, tag]))
  const reset = () => {
    setTags([])
    setWord('')
    setPhoto(null)
    setPhotoError('')
    setShowExtra(false)
    setTouched(false)
    setState('ask')
  }
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) return setPhotoError('lgNotPhoto')
    try {
      setPhoto(await toThumb(file))
      setPhotoError('')
    } catch {
      setPhotoError('lgUnreadable')
    }
  }
  const save = () => {
    setTouched(true)
    if (empty) return
    // Emergency intercept runs before anything else touches free text (Memo p.24).
    if (word && interceptsCrisis(word)) {
      setCrisisOpen(true)
      setState('held')
      return
    }
    pendingPhoto.current = photo
    addLedger({ prompt, tags, word: word.trim() || undefined, photo: photo ? true : undefined })
    playSound('complete')
    setState('saved')
  }

  return (
    <Card tone="soft" className="flex flex-col" aria-labelledby={state === 'ask' ? `${labelId} ${askId}` : labelId}>
      <div className="flex items-start justify-between gap-3">
        {/* Always rendered, so the card keeps its name in every state. */}
        <div id={labelId} className="min-w-0"><Eyebrow tone="daybreak">{name('D')} · {c('lgPromptOf', { p: prompt, n: 3 })}</Eyebrow></div>
        {time && <span className="num text-[13px] text-ink-3">{time}</span>}
      </div>
      <AnimatePresence mode="wait">
        {state === 'ask' ? (
          <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col">
            <h2 id={askId} className="mt-4 text-[2rem] font-light leading-tight text-ink md:text-[2.4rem]">{t('ledgerPrompt')}</h2>
            <fieldset className="mt-6">
              <legend className="sr-only">{c('lgLegend')}</legend>
              <div className="flex flex-wrap gap-2">
                {LEDGER_TAGS.map((tag) => {
                  const on = tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      aria-pressed={on}
                      onClick={() => toggleTag(tag)}
                      className={clsx(
                        'inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-[16px] transition-colors focus-ring',
                        on ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-paper-raised text-ink hover:bg-paper-sunk',
                      )}
                    >
                      {on && <Check size={15} aria-hidden />}
                      {tagText(tag)}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            {!showExtra ? (
              <button onClick={() => setShowExtra(true)} className="mt-5 inline-flex min-h-[24px] items-center gap-1.5 self-start py-1 text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
                <Plus size={15} /> {c('lgAddExtra')}
              </button>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="min-w-0">
                  <label htmlFor={wordId} className="text-[14px] text-ink-2">{c('lgWordLabel')}</label>
                  <input
                    id={wordId}
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    maxLength={80}
                    placeholder={c('lgPlaceholder')}
                    className="mt-1 h-12 w-full rounded-lg border border-line-strong bg-paper-raised px-3 text-[17px] text-ink placeholder:text-ink-3 focus-ring"
                  />
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={onFile} />
                {photo ? (
                  <span className="inline-flex h-14 items-center gap-2.5 rounded-lg border border-line-strong bg-paper-raised py-1 pl-1 pr-2 text-[14px] text-ink">
                    <img src={photo} alt={c('lgPhotoAlt')} className="h-12 w-12 rounded-md object-cover" />
                    {c('lgPhotoAdded')}
                    <button onClick={() => setPhoto(null)} aria-label={c('lgRemovePhoto')} className="rounded-full p-1 text-ink-3 hover:text-ink focus-ring"><X size={14} /></button>
                  </span>
                ) : (
                  <Button variant="secondary" onClick={() => fileRef.current?.click()} className="h-12"><Camera size={16} /> {c('lgAddPhoto')}</Button>
                )}
                {photoError ? (
                  <p role="alert" className="text-[13px] text-error sm:col-span-2">{c(photoError)}</p>
                ) : (
                  <p className="text-[13px] text-ink-3 sm:col-span-2">{c('lgPhotosStay')}</p>
                )}
              </div>
            )}

            {touched && empty && <p role="alert" className="mt-4 text-[14px] text-error">{c('lgEmpty')}</p>}

            <div className="mt-auto flex flex-col gap-2 pt-7 sm:flex-row sm:items-center">
              <DaybreakButton onClick={save} className="w-full sm:flex-1">{c('lgSave')}</DaybreakButton>
              <Button variant="ghost" onClick={() => setState('later')} className="sm:px-6">{c('lgNotNow')}</Button>
            </div>
          </motion.div>
        ) : state === 'saved' ? (
          <motion.div key="saved" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col" role="status">
            <p className="mt-4 text-[2rem] font-light leading-tight text-ink">{rich(c('lgKept'))}</p>
            <div className="mt-3 flex items-center gap-3">
              {photo && <img src={photo} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />}
              <p className="min-w-0 break-words text-[17px] text-ink-2">
                {rich(c(todayCount === 1 ? 'lgSaved1' : 'lgSavedN'), { what: tags.length > 0 ? tags.map((x) => (lang === 'en' ? x : tagText(x))).join(c('lgAnd')) : c('lgAMoment'), word: word.trim() ? `: “${word.trim()}”` : '', n: <span className="num text-ink">{todayCount}</span> })}
              </p>
            </div>
            <p className="mt-2 text-[15px] text-ink-3">
              {next ? rich(c('lgNextAt'), { t: <span className="num">{next.time}</span> }) : c('lgLastToday')}{c('lgNowShows')}
            </p>
            {offline && <p className="mt-2 flex items-center gap-1.5 text-[14px] text-ink-2"><CloudOff size={14} aria-hidden className="shrink-0" /> {c('oqLedger')}</p>}
            <Button variant="link" className="mt-auto self-start pt-6" onClick={reset}>{c('lgAddAnother')}</Button>
          </motion.div>
        ) : state === 'held' ? (
          <motion.div key="held" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col" role="status">
            <p className="mt-4 text-[1.6rem] font-light leading-snug text-ink">{c('lgHeld')}</p>
            <p className="mt-3 text-[15px] text-ink-2">{c('lgHeldNote')}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-6">
              <Button variant="secondary" onClick={() => setCrisisOpen(true)}>{c('lgTalkNow')}</Button>
              <Button variant="ghost" onClick={reset}>{c('lgBackLedger')}</Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="later" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col" role="status">
            <p className="mt-4 text-[1.8rem] font-light leading-snug text-ink">{rich(c('lgLater'))}</p>
            <p className="mt-3 text-[15px] text-ink-2">{next ? rich(c('lgNextIs'), { t: <span className="num">{next.time}</span> }) : c('lgSleepWell')}</p>
            <Button variant="link" className="mt-auto self-start pt-6" onClick={reset}>{c('lgActually')}</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// ─── Prompt schedule and quiet hours ────────────────────────────────────────
function ScheduleCard({ rows, setRows }: { rows: ScheduleRow[]; setRows: (next: ScheduleRow[] | ((p: ScheduleRow[]) => ScheduleRow[])) => void }) {
  const { t: c, pick } = useCore()
  const [status, setStatus] = useState<{ k: 'scOff' | 'scQuiet' | 'scAt' | 'scUsual'; p?: number; t?: string } | null>(null)
  const active = rows.filter((r) => r.on).length
  const update = (i: number, patch: Partial<ScheduleRow>) => {
    const r = { ...rows[i], ...patch }
    setRows((rs) => rs.map((x, j) => (j === i ? r : x)))
    setStatus({ k: !r.on ? 'scOff' : inQuiet(r.time) ? 'scQuiet' : 'scAt', p: r.prompt, t: r.time })
  }
  const changed = rows.some((r, i) => r.on !== DEFAULT_SCHEDULE[i].on || r.time !== DEFAULT_SCHEDULE[i].time)

  return (
    <Card tone="raised" className="min-w-0">
      <SectionTitle aside={<span className="num text-[13px] text-ink-3">{c('scOnCount', { n: active })}</span>}>{c('scTitle')}</SectionTitle>
      <ul className="space-y-5">
        {rows.map((r, i) => {
          const bad = r.on && inQuiet(r.time)
          const errId = `quiet-${r.prompt}`
          return (
            <li key={r.prompt}>
              <Switch checked={r.on} onChange={(v) => update(i, { on: v })} label={rich(c('scRow'), { p: <span className="num">{r.prompt}</span>, label: pick(SCHEDULE_LABEL[r.prompt], r.label) })} />
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <label className="sr-only" htmlFor={`time-${r.prompt}`}>{c('scTimeFor', { p: r.prompt })}</label>
                <input
                  id={`time-${r.prompt}`}
                  type="time"
                  value={r.time}
                  disabled={!r.on}
                  aria-invalid={bad}
                  aria-describedby={bad ? errId : undefined}
                  onChange={(e) => e.target.value && update(i, { time: e.target.value })}
                  className={clsx('num h-10 rounded-lg border bg-paper-raised px-3 text-[15px] text-ink focus-ring disabled:opacity-50', bad ? 'border-error' : 'border-line-strong')}
                />
                {bad ? (
                  <span id={errId} className="min-w-0 text-[13px] text-error">{c('scInside', { q: QUIET_FROM })}</span>
                ) : (
                  <span className="text-[13px] text-ink-3">{r.on ? c('scInApp') : c('scOffShort')}</span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-4 flex min-h-[1.5rem] flex-wrap items-center justify-between gap-2">
        <p role="status" className="min-w-0 text-[13px] text-ink-2">{status ? c(status.k, { p: status.p ?? '', t: status.t ?? '' }) : ''}</p>
        {changed && (
          <Button variant="link" className="min-h-[24px] text-[13px]" onClick={() => { setRows(DEFAULT_SCHEDULE); setStatus({ k: 'scUsual' }) }}>
            {c('scRestore')}
          </Button>
        )}
      </div>
      <div className="mt-4 space-y-3 border-t border-line pt-5 text-[14px] text-ink-2">
        <p className="flex items-start gap-2.5"><BellOff size={16} className="mt-0.5 shrink-0 text-ink-3" /> <span>{rich(c('scQuietLine'), { q: <span className="num text-ink">{MEMBER.quietHours}</span> })}</span></p>
        <p className="flex items-start gap-2.5"><MessageCircle size={16} className="mt-0.5 shrink-0 text-ink-3" /> <span>{rich(c('scWhatsApp'), { link: <Link to="/app/whatsapp" className="underline underline-offset-4 hover:text-ink">{c('scTurnOn')}</Link> })}</span></p>
      </div>
    </Card>
  )
}

// ─── Where joy came from this week ──────────────────────────────────────────
function WeekCard({ ledger, removed }: { ledger: LedgerEntry[]; removed: string[] }) {
  const [hidden, setHidden] = useLocal<boolean>('ledger-story-hidden', false)
  const week = useMemo(() => weekCounts(ledger, removed), [ledger, removed])
  // The headline counts moments (entries); one entry can carry several tags, so the
  // per-tag sum is for the bars only.
  const total = useMemo(() => weekEntryCount(ledger, removed), [ledger, removed])
  const [first, second] = week
  const { t: c, lang, pick, tag } = useCore()
  const tagWord = (s: string) => (lang === 'en' ? s.toLowerCase() : tag(s))
  return (
    <Card tone="raised" className="min-w-0">
      <SectionTitle aside={<SpecimenTag />}>{c('wkTitle')}</SectionTitle>
      <p className="text-[17px] text-ink">
        {rich(c(total === 1 ? 'wkCount1' : 'wkCountN'), { n: <span className="num">{total}</span> })}
        {first && <> {second ? rich(c('joyFromTwo'), { a: <span className="text-ink">{tagWord(first.tag)}</span>, b: <span className="text-ink">{tagWord(second.tag)}</span> }) : rich(c('joyFromOne'), { a: <span className="text-ink">{tagWord(first.tag)}</span> })}</>}
      </p>
      {week.length > 0 ? (
        <div className="mt-4" style={{ height: Math.max(120, week.length * 32) }} aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart accessibilityLayer={false} data={week} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }} barCategoryGap={6}>
              <XAxis type="number" hide domain={[0, 'dataMax']} />
              <YAxis type="category" dataKey="tag" tick={{ ...TICK, fontSize: 12, fill: 'var(--ink-2)' }} tickFormatter={(v: string) => tag(v)} axisLine={false} tickLine={false} width={lang === 'en' ? 72 : 104} />
              <Bar dataKey="count" fill="var(--term-d)" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                <LabelList dataKey="count" position="right" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fill: 'var(--ink)' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4"><LedgerEmpty title={c('wkEmptyTitle')} body={c('wkEmptyBody')} /></div>
      )}
      <ul className="sr-only">
        {week.map((r) => <li key={r.tag}>{c('wkSr', { tag: tag(r.tag), n: r.count })}</li>)}
      </ul>

      <div className="mt-5 border-t border-line pt-5">
        {hidden ? (
          <p className="flex items-center justify-between gap-3 text-[14px] text-ink-3">
            {c('wkHidden')} <Button variant="link" className="min-h-[24px] text-[14px]" onClick={() => setHidden(false)}>{c('wkShow')}</Button>
          </p>
        ) : (
          <>
            <p className="eyebrow text-ink-3">{c('wkTwo')}</p>
            <p className="mt-2 font-serif text-[1.2rem] italic leading-relaxed text-ink">{pick(STORY_TEXT, LEDGER_STORY.sentences)}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <Provenance tool={LEDGER_STORY.tool} prompt={LEDGER_STORY.prompt} />
              <Button variant="ghost" size="sm" onClick={() => setHidden(true)}><EyeOff size={14} /> {c('hide')}</Button>
            </div>
            <p className="mt-2 text-[13px] text-ink-3">{c('wkDrafted')}</p>
          </>
        )}
      </div>
    </Card>
  )
}

// ─── Four-week calendar heat (marigold) ─────────────────────────────────────
function CalendarCard({ live }: { live: LedgerEntry[] }) {
  const days = useMemo(() => {
    const perDay = new Map<string, number>()
    for (const e of live) perDay.set(dayKey(e.at), (perDay.get(dayKey(e.at)) ?? 0) + 1)
    return Array.from({ length: 28 }, (_, i) => {
      const day = addDays(SPECIMEN_TODAY, i - 27)
      // Before the first kept entry on this device the specimen baseline stands in.
      const count = day >= SEED_FIRST_DAY ? perDay.get(day) ?? 0 : LEDGER_CALENDAR[i] ?? 0
      return { day, d: asDate(day), count, isToday: i === 27 }
    })
  }, [live])
  const withEntries = days.filter((x) => x.count > 0).length
  const { t: c, lang } = useCore()
  const weekdays = days.slice(0, 7).map((x) => fmtLocal(x.d, lang, { weekday: 'narrow' }))
  const shade = (n: number) => (n === 0 ? 'var(--paper-sunk)' : `color-mix(in srgb, var(--term-d) ${n === 1 ? 35 : n === 2 ? 65 : 100}%, var(--paper-sunk))`)

  return (
    <Card tone="raised" className="min-w-0">
      <SectionTitle aside={<span className="num text-[13px] text-ink-3">{c('calWeeks')}</span>}>{c('calTitle')}</SectionTitle>
      <p className="text-[17px] text-ink">
        {rich(c('calLine'), { a: <span className="num">{withEntries}</span>, b: <span className="num">28</span> })}
      </p>
      <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2" role="list" aria-label={c('calAria')}>
        {weekdays.map((w, i) => (
          <span key={`h${i}`} className="eyebrow text-center text-ink-3" aria-hidden>{w}</span>
        ))}
        {days.map(({ day, d, count, isToday }) => (
          <span
            key={day}
            role="listitem"
            aria-label={`${c(count === 1 ? 'calCell1' : 'calCellN', { day: fmtDay(d, lang), n: count })}${isToday ? c('calToday') : ''}`}
            title={`${fmtDay(d, lang)} · ${count}`}
            className={clsx('flex aspect-square items-end justify-end rounded-md p-1', isToday && 'ring-2 ring-ink ring-offset-2 ring-offset-paper-raised')}
            style={{ background: shade(Math.min(3, count)) }}
          >
            {/* Marigold takes Ink text only; lighter cells keep the theme's ink. */}
            <span className={clsx('num text-[10px]', count === 1 ? 'text-ink-2' : count === 0 && 'text-ink-3')} style={count >= 2 ? { color: 'var(--aiwo-ink)' } : undefined}>
              {d.getDate()}
            </span>
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-end gap-2 text-[12px] text-ink-3">
        <span>{c('calFewer')}</span>
        {[0, 1, 2, 3].map((n) => <span key={n} className="h-3.5 w-3.5 rounded" style={{ background: shade(n) }} aria-hidden />)}
        <span>{c('calThree')}</span>
      </div>
    </Card>
  )
}

// ─── The entries ────────────────────────────────────────────────────────────
function EntriesCard({ live, onRemove, onRestore }: { live: LedgerEntry[]; onRemove: (id: string) => void; onRestore: (id: string) => void }) {
  const [photos, setPhotos] = useLocal<Record<string, string>>('ledger-photos', {})
  const { syncQueue, syncState } = useApp()
  const queuedIds = useMemo(() => new Set(syncQueue.map((q) => q.id)), [syncQueue])
  const [filter, setFilter] = useState<string | null>(null)
  // A removed entry's on-device photo leaves storage at once; Undo puts it back.
  const [undo, setUndo] = useState<{ id: string; label: string; photo?: string } | null>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const rows = filter ? live.filter((e) => e.tags.includes(filter)) : live
  const groups = useMemo(() => {
    const m = new Map<string, LedgerEntry[]>()
    for (const e of rows) {
      const k = dayKey(e.at)
      m.set(k, [...(m.get(k) ?? []), e])
    }
    return [...m.entries()]
  }, [rows])
  const usedTags = LEDGER_TAGS.filter((t) => live.some((e) => e.tags.includes(t)))
  const { t: c, lang, tag } = useCore()
  const tr = useT()
  const remove = (e: LedgerEntry) => {
    onRemove(e.id)
    const photo = photos[e.id]
    if (photo) {
      setPhotos((p) => {
        const next = { ...p }
        delete next[e.id]
        return next
      })
    }
    setUndo({ id: e.id, label: `${fmtDay(asDate(dayKey(e.at)), lang)}, ${fmtTime(e.at)}`, photo })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setUndo(null), 8000)
  }

  return (
    <Card tone="raised" className="min-w-0">
      <SectionTitle aside={<span className="num text-[13px] text-ink-3">{c('enCount', { n: rows.length })}</span>}>{c('enTitle')}</SectionTitle>
      <div className={clsx('-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1', lang !== 'en' && 'sm:flex-wrap')} role="group" aria-label={c('enFilter')}>
        <button onClick={() => setFilter(null)} aria-pressed={filter === null} className={clsx('shrink-0 rounded-full px-3 py-1.5 text-[14px] focus-ring', filter === null ? 'bg-ink text-paper' : 'bg-paper-sunk text-ink-2 hover:text-ink')}>{c('enAll')}</button>
        {usedTags.map((t) => (
          <button key={t} onClick={() => setFilter(t)} aria-pressed={filter === t} className={clsx('shrink-0 rounded-full px-3 py-1.5 text-[14px] focus-ring', filter === t ? 'bg-ink text-paper' : 'bg-paper-sunk text-ink-2 hover:text-ink')}>{tag(t)}</button>
        ))}
      </div>
      <p role="status" className={clsx('text-[14px] text-ink-2', undo ? 'mt-3' : 'sr-only')}>
        {undo && (
          <>
            {c('enRemoved', { label: undo.label })}{' '}
            <button
              onClick={() => {
                onRestore(undo.id)
                const { id, photo } = undo
                if (photo) setPhotos((p) => ({ ...p, [id]: photo }))
                window.clearTimeout(timer.current)
                setUndo(null)
              }}
              className="font-medium text-ink underline underline-offset-4 focus-ring"
            >
              {c('undo')}
            </button>
          </>
        )}
      </p>
      {groups.length === 0 ? (
        <div className="mt-5">
          <LedgerEmpty
            title={filter ? c('enNoneTag', { tag: tag(filter) }) : c('enNone')}
            body={filter ? c('enNoneTagBody') : c('enNoneBody')}
          />
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {groups.map(([day, entries]) => (
            <section key={day} aria-label={fmtDay(asDate(day), lang)}>
              <p className="eyebrow mb-2 text-ink-3">{day === SPECIMEN_TODAY ? `${tr('today')} · ` : ''}{fmtDay(asDate(day), lang)}</p>
              <ul className="divide-y divide-line rounded-card border border-line">
                {entries.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 px-4 py-3 sm:gap-4">
                    <span className="num w-11 shrink-0 pt-0.5 text-[14px] text-ink-3">{fmtTime(e.at)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1.5">
                        {e.tags.map((t) => <span key={t} className="rounded-full px-2.5 py-0.5 text-[13px] text-ink" style={{ background: 'var(--term-d-soft)' }}>{tag(t)}</span>)}
                      </div>
                      {e.word && <p className="mt-1.5 text-[16px] text-ink">“{e.word}”</p>}
                      {queuedIds.has(e.id) && (
                        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-ink-3">
                          {syncState === 'syncing' ? <RefreshCw size={12} className="animate-spin motion-reduce:animate-none" aria-hidden /> : <CloudOff size={12} aria-hidden />}
                          {c(syncState === 'syncing' ? 'oqSyncing' : 'oqWaiting')}
                        </p>
                      )}
                      {photos[e.id] ? (
                        <img src={photos[e.id]} alt={e.word ? c('enPhotoOf', { word: e.word }) : c('lgPhotoAlt')} className="mt-2 h-14 w-14 rounded-md object-cover" />
                      ) : (
                        e.photo && <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-3"><Camera size={13} aria-hidden /> {c('enPhotoOnly')}</p>
                      )}
                    </div>
                    <span className="eyebrow shrink-0 pt-1 text-ink-3">P{e.prompt}</span>
                    <button
                      onClick={() => remove(e)}
                      aria-label={c('enRemoveAria', { t: fmtTime(e.at) })}
                      title={c('enRemove')}
                      className="-mr-1 -mt-0.5 shrink-0 rounded-full p-1.5 text-ink-3 hover:bg-paper-sunk hover:text-ink focus-ring"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Card>
  )
}

function PrivacyCard() {
  const { t: c } = useCore()
  const tr = useT()
  return (
    <Card tone="sunk">
      <div className="flex items-center gap-2">
        <Lock size={15} className="text-ink-3" aria-hidden />
        <Eyebrow>{c('pvTitle')}</Eyebrow>
      </div>
      <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
        <li>{c('pv1')}</li>
        <li>{c('pv2')}</li>
        <li>{c('pv3')}</li>
        <li>{c('pv4')}</li>
      </ul>
      <Link to="/app/trust" className="eyebrow mt-4 inline-block text-ink-3 underline-offset-4 hover:text-ink hover:underline focus-ring">{tr('trust')}</Link>
    </Card>
  )
}

// ─── Empty: the Playbook's editorial line drawing, one Daybreak fill (p51) ──
function LedgerEmpty({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-card border border-dashed border-line-strong px-6 py-8 text-center">
      <EmptyIllustration kind="ledger" width={140} />
      <p className="mt-4 text-[17px] text-ink">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-2">{body}</p>}
    </div>
  )
}

// ─── The evening follow-up: "How was it?" (the Pleasure space's kept prompt and
// planned pleasure, read from its own records). An answer is kept as a Ledger entry;
// "It didn't happen" adds nothing. The word passes the crisis intercept first. ──────
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const EVENING = '18:00'
const addMin = (hhmm: string, n: number) => {
  const t = Math.min(23 * 60 + 59, toMin(hhmm) + n)
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}
type Outcome = 'fuGood' | 'fuFine' | 'fuMissed'
interface FollowUp {
  key: string
  kind: 'kept' | 'planned'
  what: string
  /** When the follow-up asks: the evening for a kept prompt, the end of a planned pleasure. */
  asks: string
  time?: string
}

function FollowUps() {
  const kept = useKeptPrompts()
  const planned = usePlannedPleasures() ?? PLANNED_START
  const [done, setDone] = useLocal<Record<string, { outcome: Outcome; at: string }>>('ledger-followups', {})
  const today = new Set([SPECIMEN_TODAY, localDay(new Date())])
  const weekday = WEEKDAY[new Date(`${SPECIMEN_TODAY}T12:00:00`).getDay()]
  const items: FollowUp[] = [
    ...kept.filter((k) => today.has(k.date)).map((k) => ({ key: `kept:${k.date}:${k.id}`, kind: 'kept' as const, what: k.text, asks: EVENING })),
    ...planned
      .filter((p) => p.day === weekday)
      .map((p) => ({ key: `planned:${SPECIMEN_TODAY}:${p.id}`, kind: 'planned' as const, what: p.what, time: p.time, asks: addMin(p.time, p.minutes || 0) })),
  ]
  const x = useX()
  const { name } = useCore()
  if (items.length === 0) return null
  return (
    <Card tone="soft" className="mt-6 lg:mt-8" aria-label={x('fuTitle')}>
      <Eyebrow tone="daybreak">{x('fuEyebrow', { term: name('D') })}</Eyebrow>
      <h2 className="mt-2 text-[1.8rem] font-light leading-tight text-ink">{x('fuTitle')}</h2>
      <ul className="mt-4 divide-y divide-line">
        {items.map((f) => (
          <FollowUpRow key={f.key} f={f} done={done[f.key] ?? null} onDone={(outcome) => setDone((d) => ({ ...d, [f.key]: { outcome, at: new Date().toISOString() } }))} />
        ))}
      </ul>
    </Card>
  )
}

function FollowUpRow({ f, done, onDone }: { f: FollowUp; done: { outcome: Outcome } | null; onDone: (o: Outcome) => void }) {
  const x = useX()
  const { t: c, tag: tagText } = useCore()
  const { addLedger, setCrisisOpen } = useApp()
  const { d } = useSpaceText()
  // A kept prompt is the product's own savouring copy, so it reads in the member's language;
  // a planned pleasure is the member's own words and stays as written.
  const what = f.kind === 'kept' ? d(f.what) : f.what
  const due = nowHHMM() >= f.asks
  const [open, setOpen] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [word, setWord] = useState('')
  const [held, setHeld] = useState(false)
  const wordId = useId()
  const save = () => {
    if (!outcome) return
    if (outcome === 'fuMissed') return onDone(outcome)
    const w = word.trim()
    // Emergency intercept runs before anything else touches free text (Memo p.24).
    if (w && interceptsCrisis(w)) {
      setCrisisOpen(true)
      setHeld(true)
      return
    }
    // The member's own word, or the pleasure itself, kept as an evening moment.
    addLedger({ prompt: 3, tags, word: (w || what).slice(0, 80) })
    playSound('complete')
    onDone(outcome)
  }
  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <p className="eyebrow text-ink-3">{f.kind === 'kept' ? x('fuKept') : rich(x('fuPlanned'), { time: <span className="num">{f.time}</span> })}</p>
      {/* The prompt or the pleasure as it was written. */}
      <p className="mt-1 text-[17px] text-ink">{what}</p>
      {done ? (
        <p role="status" className="mt-2 flex items-center gap-1.5 text-[14px] text-ink-2"><Check size={14} aria-hidden /> {x(done.outcome)} · {done.outcome === 'fuMissed' ? x('fuMissedSaved') : x('fuSaved')}</p>
      ) : !due && !open ? (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-3">
          {rich(x('fuAsks'), { t: <span className="num">{f.asks}</span> })}
          <Button variant="link" className="min-h-[24px] text-[14px]" onClick={() => setOpen(true)}>{x('fuNow')}</Button>
        </p>
      ) : (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={x('fuAria', { what })}>
            {(['fuGood', 'fuFine', 'fuMissed'] as const).map((o) => (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={outcome === o}
                onClick={() => { setOutcome(o); setHeld(false) }}
                className={clsx('inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-[15px] focus-ring', outcome === o ? 'border-ink bg-ink text-paper' : 'border-line-strong bg-paper-raised text-ink hover:bg-paper-sunk')}
              >
                {outcome === o && <Check size={14} aria-hidden />} {x(o)}
              </button>
            ))}
          </div>
          {outcome && outcome !== 'fuMissed' && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={c('lgLegend')}>
                {LEDGER_TAGS.map((t) => {
                  const on = tags.includes(t)
                  return (
                    <button key={t} type="button" aria-pressed={on} onClick={() => setTags((ts) => (on ? ts.filter((v) => v !== t) : [...ts, t]))} className={clsx('rounded-full border px-3 py-1 text-[14px] focus-ring', on ? 'border-ink bg-ink text-paper' : 'border-line bg-paper-raised text-ink-2 hover:text-ink')}>
                      {tagText(t)}
                    </button>
                  )
                })}
              </div>
              <label htmlFor={wordId} className="mt-3 block text-[14px] text-ink-2">{x('fuWord')}</label>
              <input id={wordId} value={word} onChange={(e) => { setWord(e.target.value); setHeld(false) }} maxLength={80} className="mt-1 h-11 w-full rounded-lg border border-line-strong bg-paper-raised px-3 text-[16px] text-ink focus-ring" />
            </div>
          )}
          {held && (
            <div role="status" className="mt-3 rounded-lg bg-paper-sunk px-3 py-2.5 text-[14px] text-ink-2">
              <p>{c('lgHeld')}</p>
              <Button variant="secondary" size="sm" className="mt-2" onClick={() => setCrisisOpen(true)}>{c('lgTalkNow')}</Button>
            </div>
          )}
          <Button variant="ink" className="mt-3" onClick={save} disabled={!outcome}>{outcome === 'fuMissed' ? x('fuNoteIt') : x('fuSave')}</Button>
        </div>
      )}
    </li>
  )
}
