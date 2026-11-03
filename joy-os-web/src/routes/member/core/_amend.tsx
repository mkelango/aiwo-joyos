import clsx from 'clsx'
import { History } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { TermDot, useFmtDate } from '@/components/joy/primitives'
import { Button, Pill } from '@/components/ui'
import type { TermKey } from '@/domain/types'
import { interceptsCrisis, useApp } from '@/lib/store'
import { SITTINGS } from './_data'
import { rich, useCore } from './_i18n'
import { useX } from './_i18nX'
import { ITEM_TERM, scaleOf, scoreAnswers, type SittingResult } from './_scoring'
import { SPECIMEN_TODAY, amendedAnswers, type Amendment } from './_store'

// ─── Correct right: append-only amendments after scoring (Architecture p26) ──
// Shared by My Index (a sitting just measured) and Day 90 (the Clinical-grade re-measure).
// Before scoring the member edits answers freely on the review step; after scoring an
// answer is never overwritten: a correction is appended with what it replaced, when and
// why, the Index is re-scored from the answers as amended, and the first score is kept.
// The reason is free text, so the emergency intercept runs before anything is kept.

export const ALL_ITEMS = SITTINGS.flatMap((sit) => sit.blocks.flatMap((block) => block.sample.map((item) => ({ block, item }))))

/** On the specimen clock, like a Ledger entry: the specimen day at the real local time. */
export function specimenNow() {
  const now = new Date()
  return `${SPECIMEN_TODAY}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
}

/** An answer's label in its own scale (English, as the instrument is worded). */
export function answerLabel(id: string, v: number | null | undefined) {
  const r = ALL_ITEMS.find((a) => a.item.id === id)
  return r && v !== null && v !== undefined ? scaleOf(r.block, r.item).find((o) => o.value === v)?.label ?? '—' : null
}

export interface AmendSource {
  answers?: Record<string, number>
  amendments?: Amendment[]
  /** The Index now (null while a term is not yet measured). */
  value: number | null
  /** The Index as first issued. */
  firstValue: number | null
  takenOn: string
  signalsOff?: string[]
  skipped?: TermKey[]
}

export function AmendPanel({ src, onAppend, note }: { src: AmendSource; onAppend: (a: Amendment, r: SittingResult) => void; note?: ReactNode }) {
  const x = useX()
  const { t: c } = useCore()
  const { setCrisisOpen } = useApp()
  const fmtDate = useFmtDate()
  const amends = src.amendments ?? []
  const skipped = new Set(src.skipped ?? [])
  const items = ALL_ITEMS.filter((r) => !skipped.has(r.block.term))
  const current = src.answers ? amendedAnswers(src.answers, amends) : null
  const [itemId, setItemId] = useState<string>(items[0]?.item.id ?? '')
  const [to, setTo] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [done, setDone] = useState<{ v: number | null } | null>(null)
  const [held, setHeld] = useState(false)
  const sel = items.find((r) => r.item.id === itemId)
  const scale = sel ? scaleOf(sel.block, sel.item) : []
  const labelOf = (id: string, v: number | null | undefined) => answerLabel(id, v) ?? x('amNotAnswered')
  const textOf = (id: string) => ALL_ITEMS.find((a) => a.item.id === id)?.item.text ?? id
  const when = (at: string) => `${fmtDate(at.slice(0, 10))} · ${at.slice(11, 16)}`

  if (!current) return <p className="text-[15px] text-ink-2">{x('amNoAnswers')}</p>

  const was = current[itemId]
  const same = to !== null && to === was
  const append = () => {
    if (to === null || same || !src.answers) return
    const why = reason.trim()
    // Emergency intercept: runs before the reason is kept or shown back (Memo p.24).
    if (why && interceptsCrisis(why)) {
      setCrisisOpen(true)
      setHeld(true)
      return
    }
    const nextAnswers = { ...current, [itemId]: to }
    const r = scoreAnswers(nextAnswers, src.signalsOff ?? [], src.skipped ?? [])
    const a: Amendment = { id: `am_${Date.now().toString(36)}`, itemId, from: was ?? null, to, reason: why, at: specimenNow(), before: src.value, after: r.value }
    onAppend(a, r)
    setDone({ v: r.value })
    setTo(null)
    setReason('')
  }

  return (
    <div>
      <p className="text-[15px] leading-relaxed text-ink-2">{x('amLead')}</p>
      {note && <div className="mt-3 rounded-card border border-line px-4 py-3 text-[14px] text-ink-2">{note}</div>}
      <p className="mt-2 text-[13px] text-ink-3">{x('amBefore')}</p>

      <label className="mt-5 block">
        <span className="eyebrow text-ink-3">{x('amWhich')}</span>
        <select
          value={itemId}
          onChange={(e) => {
            setItemId(e.target.value)
            setTo(null)
            setDone(null)
            setHeld(false)
          }}
          className="mt-1.5 block w-full rounded-lg border border-line-strong bg-paper-raised px-3 py-2.5 text-[15px] text-ink focus-ring"
        >
          {SITTINGS.map((sit) => (
            <optgroup key={sit.n} label={c('ovSitting', { n: sit.n })}>
              {sit.blocks.filter((b) => !skipped.has(b.term)).flatMap((b) => b.sample.map((item) => (
                <option key={item.id} value={item.id} lang="en">{b.code} · {item.position} · {item.text.length > 64 ? `${item.text.slice(0, 62)}…` : item.text}</option>
              )))}
            </optgroup>
          ))}
        </select>
      </label>

      {sel && (
        <div className="mt-4 rounded-card border border-line p-4">
          <div className="flex items-center gap-2"><TermDot term={sel.block.term} /> <span lang="en" className="eyebrow text-ink-3">{sel.block.code} · {sel.block.timeframe}</span></div>
          {sel.item.stem && <p lang="en" className="mt-2 text-[14px] text-ink-2">{sel.item.stem}</p>}
          <p lang="en" className="mt-1 text-[17px] text-ink">{sel.item.text}</p>
          <p className="mt-2 text-[14px] text-ink-2">{x('amYour')} <span lang="en" className="text-ink">{labelOf(itemId, was)}</span></p>
          <fieldset className="mt-4">
            <legend className="eyebrow mb-2 text-ink-3">{x('amNew')}</legend>
            <div className="space-y-2">
              {scale.map((o) => {
                const on = to === o.value
                return (
                  <label key={o.value} className={clsx('flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-[15px] focus-within:ring-2 focus-within:ring-daybreak', on ? 'border-ink text-ink' : 'border-line text-ink-2')}>
                    <input type="radio" name="amend-to" className="sr-only" checked={on} onChange={() => { setTo(o.value); setDone(null); setHeld(false) }} />
                    <span className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded-full border', on ? 'border-ink' : 'border-line-strong')}>{on && <span className="h-2 w-2 rounded-full bg-ink" />}</span>
                    <span lang="en">{o.label}</span>
                    {o.value === was && <span className="ml-auto text-[13px] text-ink-3">{x('amCurrent')}</span>}
                  </label>
                )
              })}
            </div>
          </fieldset>
          <label className="mt-4 block">
            <span className="eyebrow text-ink-3">{x('amWhy')}</span>
            <textarea value={reason} onChange={(e) => { setReason(e.target.value); setHeld(false) }} rows={2} maxLength={200} placeholder={x('amWhyPh')} className="mt-1.5 block w-full rounded-lg border border-line-strong bg-paper-raised px-3 py-2 text-[15px] text-ink placeholder:text-ink-3 focus-ring" />
          </label>
          {same && <p className="mt-2 text-[14px] text-ink-2">{x('amSame')}</p>}
          <Button variant="ink" className="mt-4 w-full" onClick={append} disabled={to === null || same}>{x('amAppend')}</Button>
          {held && (
            <div role="status" className="mt-3 rounded-lg bg-paper-sunk px-3 py-2.5 text-[14px] text-ink-2">
              <p>{x('amHeld')}</p>
              <Button variant="secondary" size="sm" className="mt-2" onClick={() => setCrisisOpen(true)}>{x('amTalkNow')}</Button>
            </div>
          )}
          {done !== null && <p role="status" className="mt-3 text-[14px] text-ink-2">{done.v === null ? x('skNoIndex') : rich(x('amAdded'), { v: <span className="num text-ink">{done.v}</span> })}</p>}
        </div>
      )}

      <AmendHistory amends={amends} firstValue={src.firstValue} takenOn={src.takenOn} labelOf={labelOf} textOf={textOf} when={when} />
    </div>
  )
}

function AmendHistory({ amends, firstValue, takenOn, labelOf, textOf, when }: { amends: Amendment[]; firstValue: number | null; takenOn: string; labelOf: (id: string, v: number | null | undefined) => string; textOf: (id: string) => string; when: (at: string) => string }) {
  const x = useX()
  const fmtDate = useFmtDate()
  const num = (v: number | null) => (v === null ? '—' : v)
  return (
    <section className="mt-6" aria-label={x('amHistory')}>
      <p className="eyebrow mb-2 flex items-center gap-2 text-ink-3"><History size={13} aria-hidden /> {x('amHistory')} <Pill tone="neutral">{x('amAppendOnly')}</Pill></p>
      <ol className="divide-y divide-line rounded-card border border-line">
        <li className="px-4 py-3 text-[14px] text-ink-2">
          {rich(x('amScored'), { v: <span className="num text-ink">{num(firstValue)}</span>, date: <span className="num">{fmtDate(takenOn)}</span> })}
        </li>
        {amends.map((a, i) => (
          <li key={a.id} className="px-4 py-3">
            <p className="num text-[12px] text-ink-3">{String(i + 1).padStart(2, '0')} · {when(a.at)}</p>
            <p lang="en" className="mt-1 text-[14px] text-ink">{textOf(a.itemId)}</p>
            <p className="mt-0.5 text-[14px] text-ink-2"><span lang={a.from === null ? undefined : 'en'}>{labelOf(a.itemId, a.from)}</span> → <span lang="en" className="text-ink">{labelOf(a.itemId, a.to)}</span></p>
            {a.from === null && !a.reason && <p className="mt-0.5 text-[13px] text-ink-3">{x('amLater')}</p>}
            {/* The member's own words, kept as written. */}
            {a.reason && <p className="mt-0.5 text-[13px] text-ink-3">“{a.reason}”</p>}
            <p className="mt-0.5 text-[13px] text-ink-2">{rich(x('amIndexMoved'), { a: <span className="num">{num(a.before)}</span>, b: <span className="num text-ink">{num(a.after)}</span> })}</p>
          </li>
        ))}
        {amends.length === 0 && <li className="px-4 py-3 text-[14px] text-ink-3">{x('amNone')}</li>}
      </ol>
    </section>
  )
}

/** Items of a term that the sitting skipped, in order. */
export function itemsOfTerm(k: TermKey) {
  return ALL_ITEMS.filter((r) => ITEM_TERM[r.item.id] === k)
}
