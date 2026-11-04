import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, History, Pencil, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { DaybreakButton, Eyebrow, fmtDate } from '@/components/joy/primitives'
import { Button, Pill } from '@/components/ui'
import { MEMBER } from '@/data/member'
import { expandFade, useReduceMotion } from '@/lib/motion'
import { CONTRIBUTIONS, IKIGAI_START, SPACE_TODAY, STATEMENT_START, TOMORROW_ANSWERS } from './_data'
import { SpaceShell, ToolCard, useCrisisGuard, Toggle } from './_SpaceShell'
import { mono, useSpaceText, type SpKey } from './_i18n'
import { useSpaceState } from './_state'

// PURPOSE (Memo p.19): the Ikigai map (direction for ten years, contribution,
// daily anchors), the Tomorrow Question weekly, the 25-year statement from the
// Atelier revisited at Day 90, the contribution log, and an optional career Venn.
// The one Daybreak button: save this week's Tomorrow Question.
// The specimen map was last changed on this day (before the member edits it here).
const IKIGAI_CHANGED_ON = '2027-01-18'

export default function Purpose() {
  const { t, r } = useSpaceText()
  return (
    <SpaceShell term="P" title={<>{r('pur.title', { e: <em>{t('pur.titleE')}</em> })}</>}>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex lg:col-span-7"><IkigaiMap /></div>
        <div className="flex lg:col-span-5"><TomorrowQuestion /></div>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex lg:col-span-7"><Statement /></div>
        <div className="flex lg:col-span-5"><ContributionLog /></div>
      </div>
      <CareerVenn />
    </SpaceShell>
  )
}

const inputCls = 'w-full rounded-xl border border-line-strong bg-paper px-4 py-3 text-[16px] text-ink placeholder:text-ink-3 focus-ring'

// ─── Ikigai map ───────────────────────────────────────────────────────────

function IkigaiMap() {
  const guard = useCrisisGuard()
  const [map, setMap] = useSpaceState<typeof IKIGAI_START & { changedOn?: string }>('purpose.ikigai.v1', IKIGAI_START)
  const [draft, setDraft] = useState(IKIGAI_START)
  const [editing, setEditing] = useState(false)
  const [newAnchor, setNewAnchor] = useState('')
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<{ direction?: SpKey; contribution?: SpKey }>({})
  const { t, lang } = useSpaceText()

  const save = () => {
    const e: typeof err = {}
    if (!draft.direction.trim()) e.direction = 'pur.ik.errDirection'
    if (!draft.contribution.trim()) e.contribution = 'pur.ik.errContribution'
    setErr(e)
    if (e.direction || e.contribution) return
    // An anchor typed but not yet added with + is kept, not thrown away.
    const pending = newAnchor.trim()
    const anchors = [...draft.anchors, ...(pending && draft.anchors.length < 5 ? [pending] : [])].map((a) => a.trim()).filter(Boolean)
    if (guard(draft.direction, draft.contribution, ...anchors)) return
    setMap({ direction: draft.direction.trim(), contribution: draft.contribution.trim(), anchors, changedOn: SPACE_TODAY })
    setNewAnchor('')
    setEditing(false)
    setSaved(true)
  }
  const addAnchor = () => {
    if (!newAnchor.trim() || draft.anchors.length >= 5) return
    setDraft((d) => ({ ...d, anchors: [...d.anchors, newAnchor.trim()] }))
    setNewAnchor('')
  }

  const rows = [
    { key: 'direction' as const, scale: t('pur.ik.tenYears'), label: t('pur.ik.direction'), hint: t('pur.ik.directionHint') },
    { key: 'contribution' as const, scale: t('pur.ik.forOthers'), label: t('pur.ik.contribution'), hint: t('pur.ik.contributionHint') },
  ]

  return (
    <ToolCard
      className="w-full"
      eyebrow={t('pur.ik.eyebrow')}
      title={t('pur.ik.title')}
      sub={t('pur.ik.sub')}
      aside={!editing && <Button size="sm" onClick={() => { setDraft(map); setEditing(true); setSaved(false) }}><Pencil size={14} /> {t('pur.edit')}</Button>}
    >
      <ol className="relative space-y-5 border-l border-line pl-6">
        {rows.map((r) => (
          <li key={r.key} className="relative">
            <span aria-hidden className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-paper-raised bg-term-p" />
            <p className="eyebrow text-ink-3">{r.scale} · {r.label}</p>
            {editing ? (
              <label className="mt-2 block">
                <span className="sr-only">{r.label}</span>
                <textarea rows={2} value={draft[r.key]} onChange={(e) => { setDraft((d) => ({ ...d, [r.key]: e.target.value })); setErr((x) => ({ ...x, [r.key]: undefined })) }} aria-invalid={!!err[r.key]} aria-describedby={`ik-${r.key}`} className={inputCls} />
                <span id={`ik-${r.key}`} role={err[r.key] ? 'alert' : undefined} className={clsx('mt-1 block text-[13px]', err[r.key] ? 'text-error' : 'text-ink-3')}>{err[r.key] ? t(err[r.key]!) : r.hint}</span>
              </label>
            ) : (
              <p className="mt-1.5 text-[17px] leading-relaxed text-ink">{map[r.key]}</p>
            )}
          </li>
        ))}
        <li className="relative">
          <span aria-hidden className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-paper-raised bg-term-p" />
          <p className="eyebrow text-ink-3">{t('pur.ik.anchors')}</p>
          {(editing ? draft.anchors : map.anchors).length === 0 && <p className="mt-2 text-[15px] text-ink-3">{t('c.nothingYet')}</p>}
          <ul className="mt-2 flex flex-wrap gap-2 empty:hidden">
            {(editing ? draft.anchors : map.anchors).map((a, i) => (
              <li key={a + i} className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--term-p-soft)] px-3.5 py-1.5 text-[15px] text-[color:var(--term-p-ink)]">
                {a}
                {editing && (
                  <button aria-label={t('c.removeX', { x: a })} onClick={() => setDraft((d) => ({ ...d, anchors: d.anchors.filter((_, j) => j !== i) }))} className="rounded-full p-0.5 hover:bg-paper-raised/60 focus-ring">
                    <X size={13} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {editing && (
            <div className="mt-3 flex gap-2">
              <label className="flex-1">
                <span className="sr-only">{t('pur.ik.newAnchor')}</span>
                <input value={newAnchor} onChange={(e) => setNewAnchor(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAnchor() } }} placeholder={draft.anchors.length >= 5 ? t('pur.ik.plenty') : t('pur.ik.small')} disabled={draft.anchors.length >= 5} className={clsx(inputCls, 'h-11 py-0')} />
              </label>
              <Button onClick={addAnchor} disabled={!newAnchor.trim() || draft.anchors.length >= 5} aria-label={t('pur.ik.addAnchor')}><Plus size={15} /></Button>
            </div>
          )}
        </li>
      </ol>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
        {editing ? (
          <>
            <Button variant="ink" onClick={save}><Check size={15} /> {t('pur.ik.save')}</Button>
            <Button variant="ghost" onClick={() => { setEditing(false); setErr({}); setNewAnchor('') }}>{t('c.cancel')}</Button>
          </>
        ) : (
          <p className="text-[13px] text-ink-3" role="status">{saved ? t('pur.ik.saved') : mono(map.changedOn ? t('pur.ik.changedOn', { d: fmtDate(map.changedOn, lang) }) : t('pur.ik.lastChanged', { d: fmtDate(IKIGAI_CHANGED_ON, lang) }))}</p>
        )}
      </div>
    </ToolCard>
  )
}

// ─── The Tomorrow Question ────────────────────────────────────────────────

function TomorrowQuestion() {
  const guard = useCrisisGuard()
  const [answers, setAnswers] = useSpaceState('purpose.tomorrow.v1', TOMORROW_ANSWERS)
  const [text, setText] = useState('')
  const [err, setErr] = useState(false)
  const { t, r, lang, dm } = useSpaceText()
  // Changing this week's answer edits a draft; the saved answer stays in the record until the new one is saved.
  const [changing, setChanging] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const thisWeek = answers.find((a) => a.week === 4)
  const answeredThisWeek = !!thisWeek && !changing
  const save = () => {
    if (!text.trim()) return setErr(true)
    if (guard(text)) return
    setAnswers((a) => [{ week: 4, date: SPACE_TODAY, text: text.trim() }, ...a.filter((x) => x.week !== 4)])
    setText(''); setErr(false); setChanging(false); setJustSaved(true)
  }
  const change = () => { if (!thisWeek) return; setText(thisWeek.text); setChanging(true); setJustSaved(false) }
  const cancelChange = () => { setChanging(false); setText(''); setErr(false) }
  return (
    <ToolCard className="w-full" tone="soft" eyebrow={<>{r('pur.tq.eyebrow', { n: <span className="num">4</span> })}</>} title={<>{r('pur.tq.title', { e: <em>{t('pur.tq.titleE')}</em> })}</>}>
      <AnimatePresence mode="wait" initial={false}>
        {!answeredThisWeek ? (
          <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">
            <label>
              <span className="sr-only">{t('pur.tq.answer')}</span>
              <textarea rows={3} maxLength={200} value={text} onChange={(e) => { setText(e.target.value); setErr(false) }} placeholder={t('pur.tq.placeholder')} aria-invalid={!!err} aria-describedby="tq-help" className={clsx(inputCls, 'bg-paper-raised')} />
            </label>
            <div id="tq-help" className="mt-1.5 flex justify-between gap-3 text-[13px]">
              <span className={err ? 'text-error' : 'text-ink-3'} role={err ? 'alert' : undefined}>{err ? t('pur.tq.err') : t('pur.tq.help')}</span>
              <span className="num shrink-0 text-ink-3">{text.length}/200</span>
            </div>
            <DaybreakButton onClick={save} className="mt-4 w-full">{t('pur.tq.save')}</DaybreakButton>
            {changing && <Button variant="ghost" onClick={cancelChange} className="mt-2 self-center !whitespace-normal text-center">{t('pur.tq.keepEarlier')}</Button>}
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-paper-raised p-4">
            <p className="eyebrow text-daybreak-ink">{t('c.thisWeek')}</p>
            <p className="mt-1.5 text-[17px] text-ink">{thisWeek?.text}</p>
            {justSaved && <p role="status" className="mt-2 flex items-center gap-1.5 text-[14px] text-ink-2"><Check size={14} className="shrink-0" aria-hidden /> {mono(t('pur.tq.saved'))}</p>}
            <button onClick={change} className="mt-2 text-[14px] text-ink-2 underline underline-offset-4 focus-ring rounded">{t('pur.tq.changeIt')}</button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-6">
        <Eyebrow className="flex items-center gap-1.5"><History size={13} aria-hidden /> {t('pur.tq.earlier')}</Eyebrow>
        <ol className="mt-3 space-y-3">
          {answers.filter((a) => a.week !== 4).map((a) => (
            <li key={a.week} className={clsx('grid gap-3 text-[15px]', lang === 'en' ? 'grid-cols-[3.5rem_1fr]' : 'grid-cols-[4.75rem_1fr]')}>
              <span className="num text-[13px] text-ink-3">{mono(t('pur.tq.wk', { n: a.week }))}<span className="block">{dm(a.date)}</span></span>
              <span className="text-ink-2">{a.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </ToolCard>
  )
}

// ─── The 25-year statement ────────────────────────────────────────────────

function Statement() {
  const reduce = useReduceMotion()
  const guard = useCrisisGuard()
  const [versions, setVersions] = useSpaceState('purpose.statement.v1', [
    { v: 2, date: '2027-01-18', text: STATEMENT_START },
    { v: 1, date: '2027-01-04', text: STATEMENT_START.split('. ').slice(0, 3).join('. ') + '.' },
  ])
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(versions[0].text)
  const [showV, setShowV] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [revisit, setRevisit] = useSpaceState<string[]>('purpose.statement.revisit.v1', ['read'])
  const { t, r } = useSpaceText()
  const words = draft.trim().split(/\s+/).filter(Boolean).length
  const daysToRevisit = MEMBER.loopLength - MEMBER.dayOfLoop
  const save = () => {
    if (guard(draft)) return
    if (words < 10) return
    setVersions((v) => [{ v: v[0].v + 1, date: SPACE_TODAY, text: draft.trim() }, ...v])
    setEditing(false); setJustSaved(true)
  }
  const checks = [
    { id: 'read', label: t('pur.st.read') },
    { id: 'true', label: t('pur.st.true') },
    { id: 'changed', label: t('pur.st.changed') },
    { id: 'share', label: t('pur.st.share') },
  ]
  return (
    <ToolCard
      className="w-full"
      eyebrow={t('pur.st.eyebrow')}
      title={t('pur.st.title')}
      aside={<Pill tone="neutral" className="!whitespace-normal">{r('pur.st.revisit', { n: <span className="num">{daysToRevisit}</span> })}</Pill>}
    >
      {editing ? (
        <div>
          <label>
            <span className="sr-only">{mono(t('pur.st.label'))}</span>
            <textarea rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} aria-invalid={words < 10} aria-describedby="stmt-help" className={clsx(inputCls, 'font-serif text-[18px] leading-relaxed')} />
          </label>
          <div className="mt-1.5 flex justify-between gap-3 text-[13px] text-ink-3">
            <span id="stmt-help" className={words < 10 ? 'text-error' : undefined} role={words < 10 ? 'alert' : undefined}>{words < 10 ? t('pur.st.tooShort') : t('pur.st.help')}</span>
            <span className={clsx('num shrink-0', words < 10 && 'text-error')}>{words < 10 ? `${words}/10` : t('pur.st.words', { n: words })}</span>
          </div>
        </div>
      ) : (
        <>
          {justSaved && <p role="status" className="mb-3 flex items-center gap-1.5 text-[14px] text-ink-2"><Check size={14} className="shrink-0" aria-hidden /> <span>{r('pur.st.saved', { v: <span className="num">{versions[0].v}</span> })}</span></p>}
          <blockquote className="border-l-2 border-term-p pl-5 font-serif text-[1.25rem] font-light italic leading-relaxed text-ink">
            {versions[0].text}
          </blockquote>
          <div className="mt-6 rounded-2xl bg-paper-sunk p-4">
            <Eyebrow>{r('pur.st.before', { a: <span className="num">{revisit.length}</span>, b: checks.length })}</Eyebrow>
            <ul className="mt-2.5 space-y-1">
              {checks.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-[15px]">
                    <input type="checkbox" checked={revisit.includes(c.id)} onChange={() => setRevisit((r) => (r.includes(c.id) ? r.filter((x) => x !== c.id) : [...r, c.id]))} className="h-4 w-4 accent-[color:var(--ink)]" />
                    <span className={revisit.includes(c.id) ? 'text-ink-3 line-through' : 'text-ink'}>{c.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[13px] text-ink-3">{mono(revisit.length === checks.length ? t('pur.st.ready') : t('pur.st.opens'))}</p>
          </div>
        </>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button variant="ink" onClick={save} disabled={words < 10} aria-describedby="stmt-help">{mono(t('pur.st.saveAs', { v: versions[0].v + 1 }))}</Button>
              <Button variant="ghost" onClick={() => { setDraft(versions[0].text); setEditing(false) }}>{t('c.cancel')}</Button>
            </>
          ) : (
            <Button onClick={() => { setDraft(versions[0].text); setEditing(true); setJustSaved(false) }}><Pencil size={14} /> {t('pur.st.revise')}</Button>
          )}
          <Button variant="ghost" onClick={() => setShowV((s) => !s)} aria-expanded={showV}><History size={14} /> {mono(t('pur.st.versions', { n: versions.length }))}</Button>
        </div>
        <span className="text-[13px] text-ink-3">{mono(t('pur.st.version', { v: versions[0].v, date: fmtDate(versions[0].date) }))}</span>
      </div>
      <AnimatePresence initial={false}>
        {showV && (
          <motion.ol {...expandFade(reduce)} className="mt-4 space-y-3 overflow-hidden">
            {versions.map((v) => (
              <li key={v.v} className="rounded-xl bg-paper-sunk p-3.5 text-[14px]">
                <span className="eyebrow text-ink-3">{mono(t('pur.st.version', { v: v.v, date: fmtDate(v.date) }))}{v.v === 1 ? t('pur.st.atelier') : ''}</span>
                <p className="mt-1 line-clamp-2 text-ink-2">{v.text}</p>
              </li>
            ))}
          </motion.ol>
        )}
      </AnimatePresence>
    </ToolCard>
  )
}

// ─── Contribution log ─────────────────────────────────────────────────────

function ContributionLog() {
  const guard = useCrisisGuard()
  const [items, setItems] = useSpaceState('purpose.contributions.v1', CONTRIBUTIONS)
  const [what, setWhat] = useState('')
  const [who, setWho] = useState('')
  const [err, setErr] = useState(false)
  const { t, r, dm } = useSpaceText()
  const add = () => {
    if (!what.trim()) return setErr(true)
    if (guard(what, who)) return
    setItems((i) => [{ id: `c${Date.now()}`, date: SPACE_TODAY, what: what.trim(), who: who.trim() }, ...i])
    setWhat(''); setWho(''); setErr(false)
  }
  return (
    <ToolCard className="w-full" eyebrow={t('pur.cl.eyebrow')} title={<>{r('pur.cl.title', { n: <span className="num">{items.length}</span> })}</>} sub={t('pur.cl.sub')}>
      <form onSubmit={(e) => { e.preventDefault(); add() }} className="grid gap-2">
        <label>
          <span className="sr-only">{t('pur.cl.what')}</span>
          <input value={what} onChange={(e) => { setWhat(e.target.value); setErr(false) }} placeholder={t('pur.cl.what')} aria-invalid={!!err} className={clsx(inputCls, 'h-11 py-0')} />
        </label>
        <div className="flex gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{t('pur.cl.forWhom')}</span>
            <input value={who} onChange={(e) => setWho(e.target.value)} placeholder={t('pur.cl.forWhomOpt')} className={clsx(inputCls, 'h-11 py-0')} />
          </label>
          <Button type="submit" variant="ink" className="shrink-0"><Plus size={15} /> {t('pur.cl.log')}</Button>
        </div>
        {err && <p role="alert" className="text-[13px] text-error">{t('pur.cl.err')}</p>}
      </form>
      <ul className="mt-5 divide-y divide-line">
        {items.map((c) => (
          <motion.li key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-[15px] text-ink">{c.what}</p>
              <p className="text-[13px] text-ink-3">{c.who || t('pur.cl.notNamed')}</p>
            </div>
            <span className="num shrink-0 text-[12px] text-ink-3">{dm(c.date)}</span>
          </motion.li>
        ))}
      </ul>
    </ToolCard>
  )
}

// ─── Optional career Venn ─────────────────────────────────────────────────

type VennKey = 'love' | 'good' | 'paid' | 'needs'
const VENN: { key: VennKey; label: SpKey; cx: number; cy: number }[] = [
  { key: 'love', label: 'pur.v.love', cx: 150, cy: 105 },
  { key: 'good', label: 'pur.v.good', cx: 220, cy: 165 },
  { key: 'paid', label: 'pur.v.paid', cx: 150, cy: 225 },
  { key: 'needs', label: 'pur.v.needs', cx: 80, cy: 165 },
]
const VENN_START: Record<VennKey, string[]> = {
  love: ['Teaching young engineers', 'Carnatic music', 'Solving plant layouts'],
  good: ['Process design', 'Calm in a crisis', 'Explaining hard things simply'],
  paid: ['Advisory board seats', 'Plant turnarounds'],
  needs: ['Skilled manufacturing jobs in Tamil Nadu', 'Honest first-time founders'],
}

function CareerVenn() {
  const reduce = useReduceMotion()
  const guard = useCrisisGuard()
  const [on, setOn] = useState(false)
  const [sel, setSel] = useState<VennKey>('love')
  const [items, setItems] = useSpaceState('purpose.venn.v1', VENN_START)
  const [v, setV] = useState('')
  const [err, setErr] = useState<SpKey | ''>('')
  const { t } = useSpaceText()
  const [overlap, setOverlap] = useSpaceState('purpose.venn.overlap.v1', 'Teaching plant turnarounds to young engineers')
  // Focus is drawn by hand: :focus-visible on SVG shapes is unreliable across browsers.
  const [focused, setFocused] = useState<VennKey | null>(null)
  const [editOverlap, setEditOverlap] = useState(false)
  const [overlapDraft, setOverlapDraft] = useState('')
  const cur = VENN.find((x) => x.key === sel)!
  const curLabel = t(cur.label)
  const list = items[sel]
  const add = () => {
    const n = v.trim()
    if (!n) return setErr('pur.v.errEmpty')
    if (list.some((x) => x.toLowerCase() === n.toLowerCase())) return setErr('pur.v.errDup')
    if (list.length >= 6) return setErr('pur.v.errFull')
    if (guard(n)) return
    setItems((x) => ({ ...x, [sel]: [...x[sel], n] })); setV(''); setErr('')
  }
  return (
    <ToolCard eyebrow={t('pur.v.eyebrow')} title={t('pur.v.title')} sub={t('pur.v.sub')}>
      <Toggle checked={on} onChange={setOn} label={t('pur.v.show')} description={t('pur.v.private')} />
      <AnimatePresence initial={false}>
        {on && (
          <motion.div {...expandFade(reduce)} className="overflow-hidden">
            <div className="mt-6 grid items-start gap-6 md:grid-cols-[300px_1fr]">
              <svg viewBox="0 0 300 330" className="mx-auto w-full max-w-[300px]" role="group" aria-label={t('pur.v.aria', { list: VENN.map((x) => `${t(x.label)}: ${items[x.key].join(', ') || t('pur.v.nothingYet')}`).join('. ') })}>
                {VENN.map((x) => (
                  <circle
                    key={x.key}
                    cx={x.cx}
                    cy={x.cy}
                    r={78}
                    fill="var(--term-p)"
                    fillOpacity={sel === x.key ? 0.28 : 0.08}
                    stroke={focused === x.key ? 'var(--ink)' : 'var(--term-p)'}
                    strokeOpacity={focused === x.key ? 1 : sel === x.key ? 0.9 : 0.35}
                    strokeWidth={focused === x.key ? 2.5 : 1}
                    className="cursor-pointer transition-[fill-opacity] duration-200 focus:outline-none"
                    tabIndex={0}
                    role="button"
                    aria-label={t('pur.v.items', { label: t(x.label), n: items[x.key].length })}
                    aria-pressed={sel === x.key}
                    onFocus={() => setFocused(x.key)}
                    onBlur={() => setFocused((f) => (f === x.key ? null : f))}
                    onClick={() => { setSel(x.key); setErr('') }}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(x.key))}
                  />
                ))}
                <text x={150} y={45} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--ink-2)">{t('pur.v.LOVE')}</text>
                <text x={268} y={168} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--ink-2)">{t('pur.v.GOOD')}</text>
                <text x={150} y={292} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--ink-2)">{t('pur.v.PAID')}</text>
                <text x={32} y={168} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--ink-2)">{t('pur.v.NEEDED')}</text>
                <circle cx={150} cy={165} r={4} fill="var(--ink)" />
              </svg>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('pur.v.circles')}>
                  {VENN.map((x) => (
                    <button key={x.key} onClick={() => { setSel(x.key); setErr('') }} aria-pressed={sel === x.key} className={clsx('rounded-full px-3 py-1.5 text-[13px] focus-ring', sel === x.key ? 'bg-ink text-paper' : 'bg-paper-sunk text-ink-2')}>
                      {t(x.label)} <span className="num opacity-70">{items[x.key].length}</span>
                    </button>
                  ))}
                </div>
                <p className="eyebrow mt-5 text-ink-3">{curLabel}</p>
                <ul className="mt-2 space-y-1">
                  {list.map((i) => (
                    <li key={i} className="group flex items-center justify-between gap-2 rounded-lg py-1 text-[17px] text-ink">
                      <span className="flex min-w-0 items-center gap-2"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-term-p" aria-hidden /> {i}</span>
                      <button onClick={() => setItems((x) => ({ ...x, [sel]: x[sel].filter((y) => y !== i) }))} aria-label={t('c.removeX', { x: i })} className="rounded-full p-1 text-ink-3 hover:bg-paper-sunk focus-ring"><X size={14} /></button>
                    </li>
                  ))}
                  {list.length === 0 && <li className="text-[15px] text-ink-2">{t('pur.v.empty')}</li>}
                </ul>
                <form onSubmit={(e) => { e.preventDefault(); add() }} className="mt-3 flex gap-2">
                  <label className="min-w-0 flex-1">
                    <span className="sr-only">{mono(t('pur.v.addTo', { label: curLabel.toLowerCase() }))}</span>
                    <input value={v} onChange={(e) => { setV(e.target.value); setErr('') }} placeholder={t('pur.v.addTo', { label: curLabel.toLowerCase() })} aria-invalid={!!err} aria-describedby={err ? 'venn-err' : undefined} className={clsx(inputCls, 'h-11 py-0')} />
                  </label>
                  <Button type="submit" aria-label={t('pur.v.addTo', { label: curLabel })}><Plus size={15} /></Button>
                </form>
                {err && <p id="venn-err" role="alert" className="mt-2 text-[13px] text-error">{t(err)}</p>}
                <div className="mt-5 rounded-xl bg-paper-sunk p-3.5">
                  <p className="text-[14px] text-ink-2">{t('pur.v.dot')}</p>
                  {editOverlap ? (
                    <form onSubmit={(e) => { e.preventDefault(); const o = overlapDraft.trim(); if (o && !guard(o)) { setOverlap(o); setEditOverlap(false) } }} className="mt-2 flex gap-2">
                      <label className="min-w-0 flex-1"><span className="sr-only">{t('pur.v.overlap')}</span><input value={overlapDraft} onChange={(e) => setOverlapDraft(e.target.value)} className={clsx(inputCls, 'h-11 bg-paper-raised py-0')} /></label>
                      <Button type="submit" variant="ink" disabled={!overlapDraft.trim()}><Check size={15} /> {t('pur.v.keep')}</Button>
                    </form>
                  ) : (
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-[17px] text-ink">{overlap}<button onClick={() => { setOverlapDraft(overlap); setEditOverlap(true) }} className="rounded text-[14px] text-ink-2 underline underline-offset-4 focus-ring">{t('c.change')}</button></p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolCard>
  )
}
