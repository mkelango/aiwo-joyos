import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, History, Pencil, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { DaybreakButton, Eyebrow, fmtDate } from '@/components/joy/primitives'
import { Button, Pill } from '@/components/ui'
import { MEMBER } from '@/data/member'
import { CONTRIBUTIONS, IKIGAI_START, SPACE_TODAY, STATEMENT_START, TOMORROW_ANSWERS } from './_data'
import { SpaceShell, ToolCard, useCrisisGuard, Toggle } from './_SpaceShell'

// PURPOSE (Memo p.19): the Ikigai map (direction for ten years, contribution,
// daily anchors), the Tomorrow Question weekly, the 25-year statement from the
// Atelier revisited at Day 90, the contribution log, and an optional career Venn.
// The one Daybreak button: save this week's Tomorrow Question.
export default function Purpose() {
  return (
    <SpaceShell term="P" title={<>Small reasons to get up, and one <em>direction</em></>}>
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
  const [map, setMap] = useState(IKIGAI_START)
  const [draft, setDraft] = useState(IKIGAI_START)
  const [editing, setEditing] = useState(false)
  const [newAnchor, setNewAnchor] = useState('')
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<{ direction?: string; contribution?: string }>({})

  const save = () => {
    const e: typeof err = {}
    if (!draft.direction.trim()) e.direction = 'Write your direction in one sentence. It can change later.'
    if (!draft.contribution.trim()) e.contribution = 'Name who is better off because you are here. One person is enough.'
    setErr(e)
    if (e.direction || e.contribution) return
    if (guard(draft.direction, draft.contribution, ...draft.anchors)) return
    setMap({ ...draft, direction: draft.direction.trim(), contribution: draft.contribution.trim(), anchors: draft.anchors.filter((a) => a.trim()) })
    setEditing(false)
    setSaved(true)
  }
  const addAnchor = () => {
    if (!newAnchor.trim() || draft.anchors.length >= 5) return
    setDraft((d) => ({ ...d, anchors: [...d.anchors, newAnchor.trim()] }))
    setNewAnchor('')
  }

  const rows = [
    { key: 'direction' as const, scale: 'Ten years', label: 'Direction', hint: 'Where you are heading, in one sentence.' },
    { key: 'contribution' as const, scale: 'For others', label: 'Contribution', hint: 'Who is better off because you are here.' },
  ]

  return (
    <ToolCard
      className="w-full"
      eyebrow="Ikigai map · in its original sense"
      title="What makes a life worth living, at three distances"
      sub="Ikigai is not a career diagram. It is a direction, a contribution and the small daily anchors that make an ordinary Tuesday worth it."
      aside={!editing && <Button size="sm" onClick={() => { setDraft(map); setEditing(true); setSaved(false) }}><Pencil size={14} /> Edit</Button>}
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
                <span id={`ik-${r.key}`} role={err[r.key] ? 'alert' : undefined} className={clsx('mt-1 block text-[13px]', err[r.key] ? 'text-error' : 'text-ink-3')}>{err[r.key] ?? r.hint}</span>
              </label>
            ) : (
              <p className="mt-1.5 text-[17px] leading-relaxed text-ink">{map[r.key]}</p>
            )}
          </li>
        ))}
        <li className="relative">
          <span aria-hidden className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-paper-raised bg-term-p" />
          <p className="eyebrow text-ink-3">Every day · Anchors</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {(editing ? draft.anchors : map.anchors).map((a, i) => (
              <li key={a + i} className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--term-p-soft)] px-3.5 py-1.5 text-[15px] text-[color:var(--term-p-ink)]">
                {a}
                {editing && (
                  <button aria-label={`Remove ${a}`} onClick={() => setDraft((d) => ({ ...d, anchors: d.anchors.filter((_, j) => j !== i) }))} className="rounded-full p-0.5 hover:bg-paper-raised/60 focus-ring">
                    <X size={13} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {editing && (
            <div className="mt-3 flex gap-2">
              <label className="flex-1">
                <span className="sr-only">New daily anchor</span>
                <input value={newAnchor} onChange={(e) => setNewAnchor(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAnchor() } }} placeholder={draft.anchors.length >= 5 ? 'Five anchors is plenty' : 'A small daily anchor'} disabled={draft.anchors.length >= 5} className={clsx(inputCls, 'h-11 py-0')} />
              </label>
              <Button onClick={addAnchor} disabled={!newAnchor.trim() || draft.anchors.length >= 5} aria-label="Add anchor"><Plus size={15} /></Button>
            </div>
          )}
        </li>
      </ol>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
        {editing ? (
          <>
            <Button variant="ink" onClick={save}><Check size={15} /> Save the map</Button>
            <Button variant="ghost" onClick={() => { setEditing(false); setErr({}); setNewAnchor('') }}>Cancel</Button>
          </>
        ) : (
          <p className="text-[13px] text-ink-3" role="status">{saved ? 'Saved. Coach Priya sees that it changed, not what it says, unless you share it.' : 'Last changed 18 Jan 2027 · private to you'}</p>
        )}
      </div>
    </ToolCard>
  )
}

// ─── The Tomorrow Question ────────────────────────────────────────────────

function TomorrowQuestion() {
  const guard = useCrisisGuard()
  const [answers, setAnswers] = useState(TOMORROW_ANSWERS)
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const [restore, setRestore] = useState<(typeof TOMORROW_ANSWERS)[number] | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const answeredThisWeek = answers[0].week === 4
  const save = () => {
    if (!text.trim()) return setErr('Write a few words. One line is enough.')
    if (guard(text)) return
    setAnswers((a) => [{ week: 4, date: SPACE_TODAY, text: text.trim() }, ...a])
    setText(''); setErr(''); setRestore(null); setJustSaved(true)
  }
  const change = () => { setRestore(answers[0]); setText(answers[0].text); setAnswers((a) => a.slice(1)); setJustSaved(false) }
  const cancelChange = () => { if (restore) setAnswers((a) => [restore, ...a]); setRestore(null); setText(''); setErr('') }
  return (
    <ToolCard className="w-full" tone="soft" eyebrow={<>The Tomorrow Question · week <span className="num">4</span></>} title={<>What would make tomorrow <em>worth</em> waking for?</>}>
      <AnimatePresence mode="wait" initial={false}>
        {!answeredThisWeek ? (
          <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">
            <label>
              <span className="sr-only">Your answer</span>
              <textarea rows={3} maxLength={200} value={text} onChange={(e) => { setText(e.target.value); setErr('') }} placeholder="One thing, as plainly as you can." aria-invalid={!!err} aria-describedby="tq-help" className={clsx(inputCls, 'bg-paper-raised')} />
            </label>
            <div id="tq-help" className="mt-1.5 flex justify-between text-[13px]">
              <span className={err ? 'text-error' : 'text-ink-3'} role={err ? 'alert' : undefined}>{err || 'Asked every Sunday evening. Private to you.'}</span>
              <span className="num text-ink-3">{text.length}/200</span>
            </div>
            <DaybreakButton onClick={save} className="mt-4 w-full">Save this week’s answer</DaybreakButton>
            {restore && <Button variant="ghost" onClick={cancelChange} className="mt-2 self-center">Cancel · keep the earlier answer</Button>}
          </motion.div>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-paper-raised p-4">
            <p className="eyebrow text-daybreak-ink">This week</p>
            <p className="mt-1.5 text-[17px] text-ink">{answers[0].text}</p>
            {justSaved && <p role="status" className="mt-2 flex items-center gap-1.5 text-[14px] text-ink-2"><Check size={14} aria-hidden /> Saved. Tomorrow at 07:00 VIVA will remind you of it, once.</p>}
            <button onClick={change} className="mt-2 text-[14px] text-ink-2 underline underline-offset-4 focus-ring rounded">Change it</button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-6">
        <Eyebrow className="flex items-center gap-1.5"><History size={13} aria-hidden /> Earlier weeks</Eyebrow>
        <ol className="mt-3 space-y-3">
          {answers.filter((a) => a.week !== 4).map((a) => (
            <li key={a.week} className="grid grid-cols-[3.5rem_1fr] gap-3 text-[15px]">
              <span className="num text-[13px] text-ink-3">W{a.week}<span className="block">{fmtDate(a.date).slice(0, 6)}</span></span>
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
  const guard = useCrisisGuard()
  const [versions, setVersions] = useState([
    { v: 2, date: '2027-01-18', text: STATEMENT_START },
    { v: 1, date: '2027-01-04', text: STATEMENT_START.split('. ').slice(0, 3).join('. ') + '.' },
  ])
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(versions[0].text)
  const [showV, setShowV] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [revisit, setRevisit] = useState<string[]>(['read'])
  const words = draft.trim().split(/\s+/).filter(Boolean).length
  const daysToRevisit = MEMBER.loopLength - MEMBER.dayOfLoop
  const save = () => {
    if (guard(draft)) return
    if (words < 10) return
    setVersions((v) => [{ v: v[0].v + 1, date: SPACE_TODAY, text: draft.trim() }, ...v])
    setEditing(false); setJustSaved(true)
  }
  const checks = [
    { id: 'read', label: 'Read it aloud once, slowly' },
    { id: 'true', label: 'Mark the line that is truest now' },
    { id: 'changed', label: 'Notice one line that no longer fits' },
    { id: 'share', label: 'Decide whether Kavya reads this version' },
  ]
  return (
    <ToolCard
      className="w-full"
      eyebrow="The 25-year statement · from the Atelier"
      title="The person you are walking towards"
      aside={<Pill tone="neutral">Revisit at Day 90 · in <span className="num">{daysToRevisit}</span> days</Pill>}
    >
      {editing ? (
        <div>
          <label>
            <span className="sr-only">Your 25-year statement</span>
            <textarea rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} className={clsx(inputCls, 'font-serif text-[18px] leading-relaxed')} />
          </label>
          <div className="mt-1.5 flex justify-between gap-3 text-[13px] text-ink-3">
            <span id="stmt-help" className={words < 10 ? 'text-error' : undefined} role={words < 10 ? 'alert' : undefined}>{words < 10 ? 'At least ten words, please. A statement needs room to breathe.' : 'Write in the first person, in the present or future tense. Specific beats grand.'}</span>
            <span className={clsx('num shrink-0', words < 10 && 'text-error')}>{words < 10 ? `${words}/10` : `${words} words`}</span>
          </div>
        </div>
      ) : (
        <>
          {justSaved && <p role="status" className="mb-3 flex items-center gap-1.5 text-[14px] text-ink-2"><Check size={14} aria-hidden /> <span>Saved as version <span className="num">{versions[0].v}</span>. Earlier versions are kept below.</span></p>}
          <blockquote className="border-l-2 border-term-p pl-5 font-serif text-[1.25rem] font-light italic leading-relaxed text-ink">
            {versions[0].text}
          </blockquote>
          <div className="mt-6 rounded-2xl bg-paper-sunk p-4">
            <Eyebrow>Before the Day-90 revisit · <span className="num">{revisit.length}</span>/{checks.length}</Eyebrow>
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
            <p className="mt-2 text-[13px] text-ink-3">{revisit.length === checks.length ? 'Ready for Day 90. Coach Priya will open the statement with you.' : 'Coach Priya opens the statement with you at the Day-90 review.'}</p>
          </div>
        </>
      )}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button variant="ink" onClick={save} disabled={words < 10} aria-describedby="stmt-help">Save as version {versions[0].v + 1}</Button>
              <Button variant="ghost" onClick={() => { setDraft(versions[0].text); setEditing(false) }}>Cancel</Button>
            </>
          ) : (
            <Button onClick={() => { setDraft(versions[0].text); setEditing(true); setJustSaved(false) }}><Pencil size={14} /> Revise</Button>
          )}
          <Button variant="ghost" onClick={() => setShowV((s) => !s)} aria-expanded={showV}><History size={14} /> {versions.length} versions</Button>
        </div>
        <span className="text-[13px] text-ink-3">Version {versions[0].v} · {fmtDate(versions[0].date)}</span>
      </div>
      <AnimatePresence initial={false}>
        {showV && (
          <motion.ol initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 space-y-3 overflow-hidden">
            {versions.map((v) => (
              <li key={v.v} className="rounded-xl bg-paper-sunk p-3.5 text-[14px]">
                <span className="eyebrow text-ink-3">Version {v.v} · {fmtDate(v.date)}{v.v === 1 ? ' · drafted at the Atelier, Fairmont Mumbai' : ''}</span>
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
  const [items, setItems] = useState(CONTRIBUTIONS)
  const [what, setWhat] = useState('')
  const [who, setWho] = useState('')
  const [err, setErr] = useState('')
  const add = () => {
    if (!what.trim()) return setErr('What did you do? A few words.')
    if (guard(what, who)) return
    setItems((i) => [{ id: `c${Date.now()}`, date: SPACE_TODAY, what: what.trim(), who: who.trim() || 'Not named' }, ...i])
    setWhat(''); setWho(''); setErr('')
  }
  return (
    <ToolCard className="w-full" eyebrow="Contribution log" title={<><span className="num">{items.length}</span> times this month your work helped someone</>} sub="Not achievements. Who was better off, and how.">
      <form onSubmit={(e) => { e.preventDefault(); add() }} className="grid gap-2">
        <label>
          <span className="sr-only">What you did</span>
          <input value={what} onChange={(e) => { setWhat(e.target.value); setErr('') }} placeholder="What you did" aria-invalid={!!err} className={clsx(inputCls, 'h-11 py-0')} />
        </label>
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">For whom</span>
            <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="For whom (optional)" className={clsx(inputCls, 'h-11 py-0')} />
          </label>
          <Button type="submit" variant="ink"><Plus size={15} /> Log</Button>
        </div>
        {err && <p role="alert" className="text-[13px] text-error">{err}</p>}
      </form>
      <ul className="mt-5 divide-y divide-line">
        {items.map((c) => (
          <motion.li key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-[15px] text-ink">{c.what}</p>
              <p className="text-[13px] text-ink-3">{c.who}</p>
            </div>
            <span className="num shrink-0 text-[12px] text-ink-3">{fmtDate(c.date).slice(0, 6)}</span>
          </motion.li>
        ))}
      </ul>
    </ToolCard>
  )
}

// ─── Optional career Venn ─────────────────────────────────────────────────

type VennKey = 'love' | 'good' | 'paid' | 'needs'
const VENN: { key: VennKey; label: string; cx: number; cy: number }[] = [
  { key: 'love', label: 'What you love', cx: 150, cy: 105 },
  { key: 'good', label: 'What you are good at', cx: 220, cy: 165 },
  { key: 'paid', label: 'What you can be paid for', cx: 150, cy: 225 },
  { key: 'needs', label: 'What the world needs', cx: 80, cy: 165 },
]
const VENN_START: Record<VennKey, string[]> = {
  love: ['Teaching young engineers', 'Carnatic music', 'Solving plant layouts'],
  good: ['Process design', 'Calm in a crisis', 'Explaining hard things simply'],
  paid: ['Advisory board seats', 'Plant turnarounds'],
  needs: ['Skilled manufacturing jobs in Tamil Nadu', 'Honest first-time founders'],
}

function CareerVenn() {
  const guard = useCrisisGuard()
  const [on, setOn] = useState(false)
  const [sel, setSel] = useState<VennKey>('love')
  const [items, setItems] = useState(VENN_START)
  const [v, setV] = useState('')
  const [err, setErr] = useState('')
  const [overlap, setOverlap] = useState('Teaching plant turnarounds to young engineers')
  const [editOverlap, setEditOverlap] = useState(false)
  const cur = VENN.find((x) => x.key === sel)!
  const list = items[sel]
  const add = () => {
    const n = v.trim()
    if (!n) return setErr('Type a few words.')
    if (list.some((x) => x.toLowerCase() === n.toLowerCase())) return setErr('That is already in this circle.')
    if (list.length >= 6) return setErr('Six per circle is plenty. Remove one first.')
    if (guard(n)) return
    setItems((x) => ({ ...x, [sel]: [...x[sel], n] })); setV(''); setErr('')
  }
  return (
    <ToolCard eyebrow="Optional · career Venn" title="The four-circle diagram, if it helps" sub="Popular in the West as “ikigai”; we keep it optional and separate. Useful for one question: where does work overlap with what you love?">
      <Toggle checked={on} onChange={setOn} label="Show the career Venn" description="Private to you. It does not change your Purpose score." />
      <AnimatePresence initial={false}>
        {on && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24 }} className="overflow-hidden">
            <div className="mt-6 grid items-start gap-6 md:grid-cols-[300px_1fr]">
              <svg viewBox="0 0 300 330" className="mx-auto w-full max-w-[300px]" role="img" aria-label={`Career Venn: four overlapping circles. ${VENN.map((x) => `${x.label}: ${items[x.key].join(', ') || 'nothing yet'}`).join('. ')}.`}>
                {VENN.map((x) => (
                  <circle
                    key={x.key}
                    cx={x.cx}
                    cy={x.cy}
                    r={78}
                    fill="var(--term-p)"
                    fillOpacity={sel === x.key ? 0.28 : 0.08}
                    stroke="var(--term-p)"
                    strokeOpacity={sel === x.key ? 0.9 : 0.35}
                    className="cursor-pointer transition-[fill-opacity] duration-200"
                    tabIndex={0}
                    role="button"
                    aria-label={`${x.label}, ${items[x.key].length} items`}
                    onClick={() => { setSel(x.key); setErr('') }}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(x.key))}
                  />
                ))}
                <text x={150} y={45} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--ink-2)">LOVE</text>
                <text x={268} y={168} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--ink-2)">GOOD AT</text>
                <text x={150} y={292} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--ink-2)">PAID FOR</text>
                <text x={32} y={168} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono)" fill="var(--ink-2)">NEEDED</text>
                <circle cx={150} cy={165} r={4} fill="var(--ink)" />
              </svg>
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Circles">
                  {VENN.map((x) => (
                    <button key={x.key} onClick={() => { setSel(x.key); setErr('') }} aria-pressed={sel === x.key} className={clsx('rounded-full px-3 py-1.5 text-[13px] focus-ring', sel === x.key ? 'bg-ink text-paper' : 'bg-paper-sunk text-ink-2')}>
                      {x.label} <span className="num opacity-70">{items[x.key].length}</span>
                    </button>
                  ))}
                </div>
                <p className="eyebrow mt-5 text-ink-3">{cur.label}</p>
                <ul className="mt-2 space-y-1">
                  {list.map((i) => (
                    <li key={i} className="group flex items-center justify-between gap-2 rounded-lg py-1 text-[17px] text-ink">
                      <span className="flex min-w-0 items-center gap-2"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-term-p" aria-hidden /> {i}</span>
                      <button onClick={() => setItems((x) => ({ ...x, [sel]: x[sel].filter((y) => y !== i) }))} aria-label={`Remove ${i}`} className="rounded-full p-1 text-ink-3 hover:bg-paper-sunk focus-ring"><X size={14} /></button>
                    </li>
                  ))}
                  {list.length === 0 && <li className="text-[15px] text-ink-2">Nothing here yet. What belongs in this circle?</li>}
                </ul>
                <form onSubmit={(e) => { e.preventDefault(); add() }} className="mt-3 flex gap-2">
                  <label className="flex-1">
                    <span className="sr-only">Add to {cur.label.toLowerCase()}</span>
                    <input value={v} onChange={(e) => { setV(e.target.value); setErr('') }} placeholder={`Add to ${cur.label.toLowerCase()}`} aria-invalid={!!err} aria-describedby={err ? 'venn-err' : undefined} className={clsx(inputCls, 'h-11 py-0')} />
                  </label>
                  <Button type="submit" aria-label={`Add to ${cur.label}`}><Plus size={15} /></Button>
                </form>
                {err && <p id="venn-err" role="alert" className="mt-2 text-[13px] text-error">{err}</p>}
                <div className="mt-5 rounded-xl bg-paper-sunk p-3.5">
                  <p className="text-[14px] text-ink-2">The dot in the middle is where all four overlap. For you, today:</p>
                  {editOverlap ? (
                    <form onSubmit={(e) => { e.preventDefault(); if (overlap.trim() && !guard(overlap)) setEditOverlap(false) }} className="mt-2 flex gap-2">
                      <label className="flex-1"><span className="sr-only">Where all four overlap</span><input value={overlap} onChange={(e) => setOverlap(e.target.value)} className={clsx(inputCls, 'h-11 bg-paper-raised py-0')} /></label>
                      <Button type="submit" variant="ink" disabled={!overlap.trim()}><Check size={15} /> Keep</Button>
                    </form>
                  ) : (
                    <p className="mt-1 flex flex-wrap items-baseline gap-x-3 text-[17px] text-ink">{overlap}<button onClick={() => setEditOverlap(true)} className="rounded text-[14px] text-ink-2 underline underline-offset-4 focus-ring">Change</button></p>
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
