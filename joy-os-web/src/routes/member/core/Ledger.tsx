import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { BellOff, Camera, Check, EyeOff, Lock, MessageCircle, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { DaybreakButton, Eyebrow, MethodLine, SpecimenTag, TermChip } from '@/components/joy/primitives'
import { Button, Card, EmptyState, PageHeader, Pill, SectionTitle } from '@/components/ui'
import { INDEX_HISTORY, LEDGER, LEDGER_TAGS, MEMBER } from '@/data/member'
import type { LedgerEntry } from '@/domain/types'
import { interceptsCrisis, useApp } from '@/lib/store'
import { useT } from '@/lib/i18n'
import { LEDGER_CALENDAR, LEDGER_SCHEDULE, LEDGER_STORY } from './_data'
import { Provenance, Switch, TICK } from './_parts'
import { SPECIMEN_TODAY, addDays, isSeed, liveLedger, useLedgerRemoved, useLocal, weekCounts, type ScheduleRow } from './_store'

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
const fmtDay = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
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
  const { ledger } = useApp()
  const [removed, setRemoved] = useLedgerRemoved()
  const [rows, setRows] = useLocal<ScheduleRow[]>('ledger-schedule', DEFAULT_SCHEDULE)
  const live = useMemo(() => liveLedger(ledger, removed), [ledger, removed])
  const latest = INDEX_HISTORY[0]
  const d = latest.terms.find((t) => t.key === 'D')!
  const { active, current, next } = promptState(rows)
  const prompt: 1 | 2 | 3 = current?.prompt ?? 1

  return (
    <div>
      <PageHeader
        eyebrow="Daily Pleasure · The Joy Ledger"
        title={<>Anything good, <em>kept</em> in ten seconds.</>}
        lead="Three short prompts a day. Tap what it was, add a word if you like, and move on. Over a week, it shows you where joy came from."
        actions={
          <Pill tone="neutral">
            {active.length === 0 ? 'Prompts off · you can still keep a moment' : <>Prompt <span className="num">{prompt}</span> of <span className="num">3</span> today</>}
          </Pill>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-8">
        <PromptCard prompt={prompt} time={current?.time} next={next} live={live} />
        <ScheduleCard rows={rows} setRows={setRows} />
      </div>

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-2 lg:gap-8">
        <WeekCard ledger={ledger} removed={removed} />
        <CalendarCard live={live} />
      </div>

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[1.6fr_1fr] lg:gap-8">
        <EntriesCard live={live} onRemove={(id) => setRemoved((r) => [...new Set([...r, id])])} onRestore={(id) => setRemoved((r) => r.filter((x) => x !== id))} />
        <div className="flex flex-col gap-6">
          <Card tone="raised">
            <div className="flex items-center justify-between gap-3">
              <TermChip term="D" />
              <span className="num text-[2rem] font-light text-ink">{d.value}</span>
            </div>
            <p className="mt-3 text-[15px] text-ink-2">
              The Ledger feeds Daily Pleasure: <span className="num text-ink">D = 0.5·SPANE-B + 0.3·Joy moments + 0.2·Savouring</span>. Joy moments are counted, never judged.
            </p>
            <MethodLine className="mt-4" method={latest.method} grade={latest.grade} next={latest.nextMeasure} />
            <Link to="/app/spaces/pleasure" className="mt-3 inline-block text-[14px] text-ink underline-offset-4 hover:underline focus-ring">Open the Pleasure space</Link>
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
  const { ledger, addLedger, setCrisisOpen } = useApp()
  const [photos, setPhotos] = useLocal<Record<string, string>>('ledger-photos', {})
  const wordId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const pendingPhoto = useRef<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [showExtra, setShowExtra] = useState(false)
  const [word, setWord] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
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
    if (!file.type.startsWith('image/')) return setPhotoError('That file is not a photo. Choose a JPEG, PNG or HEIC image.')
    try {
      setPhoto(await toThumb(file))
      setPhotoError('')
    } catch {
      setPhotoError('That photo could not be read on this device. Try another.')
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
    setState('saved')
  }

  return (
    <Card tone="soft" className="flex flex-col" aria-labelledby="ledger-prompt">
      <div className="flex items-center justify-between gap-3">
        <Eyebrow tone="daybreak">Daily Pleasure · Prompt {prompt} of 3</Eyebrow>
        {time && <span className="num text-[13px] text-ink-3">{time}</span>}
      </div>
      <AnimatePresence mode="wait">
        {state === 'ask' ? (
          <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-1 flex-col">
            <h2 id="ledger-prompt" className="mt-4 text-[2rem] font-light leading-tight text-ink md:text-[2.4rem]">{t('ledgerPrompt')}</h2>
            <fieldset className="mt-6">
              <legend className="sr-only">What was it? Choose any that fit.</legend>
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
                      {tag}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            {!showExtra ? (
              <button onClick={() => setShowExtra(true)} className="mt-5 inline-flex items-center gap-1.5 self-start text-[15px] text-ink-2 underline-offset-4 hover:text-ink hover:underline focus-ring">
                <Plus size={15} /> Add a word or a photo (optional)
              </button>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label htmlFor={wordId} className="text-[14px] text-ink-2">A word or two</label>
                  <input
                    id={wordId}
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    maxLength={80}
                    placeholder="Lunch with Kavya"
                    className="mt-1 h-12 w-full rounded-lg border border-line-strong bg-paper-raised px-3 text-[17px] text-ink placeholder:text-ink-3 focus-ring"
                  />
                </div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={onFile} />
                {photo ? (
                  <span className="inline-flex h-14 items-center gap-2.5 rounded-lg border border-line-strong bg-paper-raised py-1 pl-1 pr-2 text-[14px] text-ink">
                    <img src={photo} alt="Your photo, kept on this phone" className="h-12 w-12 rounded-md object-cover" />
                    Photo added
                    <button onClick={() => setPhoto(null)} aria-label="Remove photo" className="rounded-full p-1 text-ink-3 hover:text-ink focus-ring"><X size={14} /></button>
                  </span>
                ) : (
                  <Button variant="secondary" onClick={() => fileRef.current?.click()} className="h-12"><Camera size={16} /> Add a photo</Button>
                )}
                {photoError ? (
                  <p role="alert" className="text-[13px] text-error sm:col-span-2">{photoError}</p>
                ) : (
                  <p className="text-[13px] text-ink-3 sm:col-span-2">Photos stay on this phone and are never read by AI.</p>
                )}
              </div>
            )}

            {touched && empty && <p role="alert" className="mt-4 text-[14px] text-error">Choose a tag, or add a word, to keep this moment.</p>}

            <div className="mt-auto flex flex-col gap-2 pt-7 sm:flex-row sm:items-center">
              <DaybreakButton onClick={save} className="w-full sm:flex-1">Save · 10 seconds</DaybreakButton>
              <Button variant="ghost" onClick={() => setState('later')} className="sm:px-6">Not now</Button>
            </div>
          </motion.div>
        ) : state === 'saved' ? (
          <motion.div key="saved" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col" role="status">
            <p className="mt-4 text-[2rem] font-light leading-tight text-ink">Kept. <em>Thank you.</em></p>
            <div className="mt-3 flex items-center gap-3">
              {photo && <img src={photo} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />}
              <p className="text-[17px] text-ink-2">
                {tags.length > 0 ? tags.join(' and ') : 'A moment'}{word.trim() ? `: “${word.trim()}”` : ''}. That is <span className="num text-ink">{todayCount}</span> {todayCount === 1 ? 'moment' : 'moments'} today.
              </p>
            </div>
            <p className="mt-2 text-[15px] text-ink-3">
              {next ? <>Next prompt at <span className="num">{next.time}</span>, if you want it.</> : 'That was the last prompt for today.'} It now shows in this week’s view and the calendar.
            </p>
            <Button variant="link" className="mt-auto self-start pt-6" onClick={reset}>Add another moment</Button>
          </motion.div>
        ) : state === 'held' ? (
          <motion.div key="held" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col" role="status">
            <p className="mt-4 text-[1.6rem] font-light leading-snug text-ink">We paused here, so a person can reach you first.</p>
            <p className="mt-3 text-[15px] text-ink-2">Your words were not saved and were not sent to any AI. Tele-MANAS is free on 14416, any time.</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-6">
              <Button variant="secondary" onClick={() => setCrisisOpen(true)}>Talk to someone now</Button>
              <Button variant="ghost" onClick={reset}>Back to the Ledger</Button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="later" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col" role="status">
            <p className="mt-4 text-[1.8rem] font-light leading-snug text-ink">That’s fine. <em>Nothing</em> is counted against you.</p>
            <p className="mt-3 text-[15px] text-ink-2">{next ? <>The next prompt is at <span className="num">{next.time}</span>.</> : 'That was the last prompt for today. Sleep well.'}</p>
            <Button variant="link" className="mt-auto self-start pt-6" onClick={reset}>Actually, add one</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

// ─── Prompt schedule and quiet hours ────────────────────────────────────────
function ScheduleCard({ rows, setRows }: { rows: ScheduleRow[]; setRows: (next: ScheduleRow[] | ((p: ScheduleRow[]) => ScheduleRow[])) => void }) {
  const [status, setStatus] = useState('')
  const active = rows.filter((r) => r.on).length
  const update = (i: number, patch: Partial<ScheduleRow>) => {
    const r = { ...rows[i], ...patch }
    setRows((rs) => rs.map((x, j) => (j === i ? r : x)))
    setStatus(
      !r.on
        ? `Saved · prompt ${r.prompt} is off`
        : inQuiet(r.time)
          ? `Saved · prompt ${r.prompt} at ${r.time} sits inside quiet hours, so it is paused until you move it`
          : `Saved · prompt ${r.prompt} at ${r.time}`,
    )
  }
  const changed = rows.some((r, i) => r.on !== DEFAULT_SCHEDULE[i].on || r.time !== DEFAULT_SCHEDULE[i].time)

  return (
    <Card tone="raised" className="min-w-0">
      <SectionTitle aside={<span className="num text-[13px] text-ink-3">{active} of 3 on</span>}>Prompts and quiet hours</SectionTitle>
      <ul className="space-y-5">
        {rows.map((r, i) => {
          const bad = r.on && inQuiet(r.time)
          const errId = `quiet-${r.prompt}`
          return (
            <li key={r.prompt}>
              <Switch checked={r.on} onChange={(v) => update(i, { on: v })} label={<>Prompt <span className="num">{r.prompt}</span> · {r.label}</>} />
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <label className="sr-only" htmlFor={`time-${r.prompt}`}>Time for prompt {r.prompt}</label>
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
                  <span id={errId} className="text-[13px] text-error">Inside your quiet hours. Choose a time before {QUIET_FROM}.</span>
                ) : (
                  <span className="text-[13px] text-ink-3">{r.on ? 'In the app' : 'Off'}</span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-4 flex min-h-[1.5rem] flex-wrap items-center justify-between gap-2">
        <p role="status" className="text-[13px] text-ink-2">{status}</p>
        {changed && (
          <Button variant="link" className="text-[13px]" onClick={() => { setRows(DEFAULT_SCHEDULE); setStatus('Saved · back to the usual three prompts') }}>
            Restore the usual times
          </Button>
        )}
      </div>
      <div className="mt-4 space-y-3 border-t border-line pt-5 text-[14px] text-ink-2">
        <p className="flex items-start gap-2.5"><BellOff size={16} className="mt-0.5 shrink-0 text-ink-3" /> <span>Quiet hours <span className="num text-ink">{MEMBER.quietHours}</span>. Nothing arrives inside them, and never more than three a day.</span></p>
        <p className="flex items-start gap-2.5"><MessageCircle size={16} className="mt-0.5 shrink-0 text-ink-3" /> <span>WhatsApp prompts are off. <Link to="/app/whatsapp" className="underline underline-offset-4 hover:text-ink">Turn them on</Link></span></p>
      </div>
    </Card>
  )
}

// ─── Where joy came from this week ──────────────────────────────────────────
function WeekCard({ ledger, removed }: { ledger: LedgerEntry[]; removed: string[] }) {
  const [hidden, setHidden] = useLocal<boolean>('ledger-story-hidden', false)
  const week = useMemo(() => weekCounts(ledger, removed), [ledger, removed])
  const total = week.reduce((a, r) => a + r.count, 0)
  const [first, second] = week
  return (
    <Card tone="raised" className="min-w-0">
      <SectionTitle aside={<SpecimenTag />}>This week · where joy came from</SectionTitle>
      <p className="text-[17px] text-ink">
        <span className="num">{total}</span> {total === 1 ? 'moment' : 'moments'} this week.
        {first && <> Joy came most from <span className="text-ink">{first.tag.toLowerCase()}</span>{second && <> and <span className="text-ink">{second.tag.toLowerCase()}</span></>}.</>}
      </p>
      {week.length > 0 ? (
        <div className="mt-4" style={{ height: Math.max(120, week.length * 32) }} aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={week} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }} barCategoryGap={6}>
              <XAxis type="number" hide domain={[0, 'dataMax']} />
              <YAxis type="category" dataKey="tag" tick={{ ...TICK, fontSize: 12, fill: 'var(--ink-2)' }} axisLine={false} tickLine={false} width={72} />
              <Bar dataKey="count" fill="var(--term-d)" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                <LabelList dataKey="count" position="right" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fill: 'var(--ink)' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4"><EmptyState title="Nothing kept this week yet." body="Quiet weeks are fine; they are not counted against you." /></div>
      )}
      <ul className="sr-only">
        {week.map((r) => <li key={r.tag}>{r.tag}: {r.count} moments</li>)}
      </ul>

      <div className="mt-5 border-t border-line pt-5">
        {hidden ? (
          <p className="flex items-center justify-between gap-3 text-[14px] text-ink-3">
            The weekly story is hidden. <Button variant="link" className="text-[14px]" onClick={() => setHidden(false)}>Show it</Button>
          </p>
        ) : (
          <>
            <p className="eyebrow text-ink-3">The week, in two sentences</p>
            <p className="mt-2 font-serif text-[1.2rem] italic leading-relaxed text-ink">{LEDGER_STORY.sentences}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <Provenance tool={LEDGER_STORY.tool} prompt={LEDGER_STORY.prompt} />
              <Button variant="ghost" size="sm" onClick={() => setHidden(true)}><EyeOff size={14} /> Hide</Button>
            </div>
            <p className="mt-2 text-[13px] text-ink-3">Drafted on Sunday from your tags and words only. Photos are never read. Moments kept since then appear in the chart, not in the story.</p>
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
  const weekdays = days.slice(0, 7).map((x) => x.d.toLocaleDateString('en-GB', { weekday: 'narrow' }))
  const shade = (n: number) => (n === 0 ? 'var(--paper-sunk)' : `color-mix(in srgb, var(--term-d) ${n === 1 ? 35 : n === 2 ? 65 : 100}%, var(--paper-sunk))`)

  return (
    <Card tone="raised" className="min-w-0">
      <SectionTitle aside={<span className="num text-[13px] text-ink-3">4 weeks</span>}>The last four weeks</SectionTitle>
      <p className="text-[17px] text-ink">
        Something kept on <span className="num">{withEntries}</span> of <span className="num">28</span> days. Quiet days are fine; they are not counted against you.
      </p>
      <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2" role="list" aria-label="Joy Ledger entries per day, last 28 days">
        {weekdays.map((w, i) => (
          <span key={`h${i}`} className="eyebrow text-center text-ink-3" aria-hidden>{w}</span>
        ))}
        {days.map(({ day, d, count, isToday }) => (
          <span
            key={day}
            role="listitem"
            aria-label={`${fmtDay(d)}: ${count} ${count === 1 ? 'entry' : 'entries'}${isToday ? ', today' : ''}`}
            title={`${fmtDay(d)} · ${count}`}
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
        <span>Fewer</span>
        {[0, 1, 2, 3].map((n) => <span key={n} className="h-3.5 w-3.5 rounded" style={{ background: shade(n) }} aria-hidden />)}
        <span>3 a day</span>
      </div>
    </Card>
  )
}

// ─── The entries ────────────────────────────────────────────────────────────
function EntriesCard({ live, onRemove, onRestore }: { live: LedgerEntry[]; onRemove: (id: string) => void; onRestore: (id: string) => void }) {
  const [photos] = useLocal<Record<string, string>>('ledger-photos', {})
  const [filter, setFilter] = useState<string | null>(null)
  const [undo, setUndo] = useState<{ id: string; label: string } | null>(null)
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
  const remove = (e: LedgerEntry) => {
    onRemove(e.id)
    setUndo({ id: e.id, label: `${fmtDay(asDate(dayKey(e.at)))}, ${fmtTime(e.at)}` })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setUndo(null), 8000)
  }

  return (
    <Card tone="raised" className="min-w-0">
      <SectionTitle aside={<span className="num text-[13px] text-ink-3">{rows.length} entries</span>}>Your entries</SectionTitle>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Filter by tag">
        <button onClick={() => setFilter(null)} aria-pressed={filter === null} className={clsx('shrink-0 rounded-full px-3 py-1.5 text-[14px] focus-ring', filter === null ? 'bg-ink text-paper' : 'bg-paper-sunk text-ink-2 hover:text-ink')}>All</button>
        {usedTags.map((t) => (
          <button key={t} onClick={() => setFilter(t)} aria-pressed={filter === t} className={clsx('shrink-0 rounded-full px-3 py-1.5 text-[14px] focus-ring', filter === t ? 'bg-ink text-paper' : 'bg-paper-sunk text-ink-2 hover:text-ink')}>{t}</button>
        ))}
      </div>
      <p role="status" className={clsx('text-[14px] text-ink-2', undo ? 'mt-3' : 'sr-only')}>
        {undo && (
          <>
            Removed the entry from {undo.label}.{' '}
            <button
              onClick={() => {
                onRestore(undo.id)
                setUndo(null)
              }}
              className="font-medium text-ink underline underline-offset-4 focus-ring"
            >
              Undo
            </button>
          </>
        )}
      </p>
      {groups.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title={filter ? `Nothing tagged ${filter} yet.` : 'Nothing kept yet.'}
            body={filter ? 'It will come. Joy rarely arrives on schedule.' : 'The next prompt will ask. Or keep a moment now, above.'}
          />
        </div>
      ) : (
        <div className="mt-5 space-y-6">
          {groups.map(([day, entries]) => (
            <section key={day} aria-label={fmtDay(asDate(day))}>
              <p className="eyebrow mb-2 text-ink-3">{day === SPECIMEN_TODAY ? 'Today · ' : ''}{fmtDay(asDate(day))}</p>
              <ul className="divide-y divide-line rounded-card border border-line">
                {entries.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 px-4 py-3 sm:gap-4">
                    <span className="num w-11 shrink-0 pt-0.5 text-[14px] text-ink-3">{fmtTime(e.at)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-1.5">
                        {e.tags.map((t) => <span key={t} className="rounded-full px-2.5 py-0.5 text-[13px] text-ink" style={{ background: 'var(--term-d-soft)' }}>{t}</span>)}
                      </div>
                      {e.word && <p className="mt-1.5 text-[16px] text-ink">“{e.word}”</p>}
                      {photos[e.id] ? (
                        <img src={photos[e.id]} alt={e.word ? `Photo: ${e.word}` : 'Your photo, kept on this phone'} className="mt-2 h-14 w-14 rounded-md object-cover" />
                      ) : (
                        e.photo && <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-3"><Camera size={13} aria-hidden /> Photo · on this phone only</p>
                      )}
                    </div>
                    <span className="eyebrow shrink-0 pt-1 text-ink-3">P{e.prompt}</span>
                    <button
                      onClick={() => remove(e)}
                      aria-label={`Remove entry from ${fmtTime(e.at)}`}
                      title="Remove"
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
  return (
    <Card tone="sunk">
      <div className="flex items-center gap-2">
        <Lock size={15} className="text-ink-3" aria-hidden />
        <Eyebrow>Private by default</Eyebrow>
      </div>
      <ul className="mt-3 space-y-2 text-[15px] text-ink-2">
        <li>Photos stay on this phone. They are excluded from AI, always.</li>
        <li>Tags are suggested on the device; words leave it only for your weekly story.</li>
        <li>Priya sees counts per week, never your words. Kavya sees nothing unless you share.</li>
        <li>Remove any entry here with its bin icon. A full export or deletion lives in the Trust centre.</li>
      </ul>
      <Link to="/app/trust" className="eyebrow mt-4 inline-block text-ink-3 underline-offset-4 hover:text-ink hover:underline focus-ring">Who has seen my data · Export · Delete</Link>
    </Card>
  )
}
