import clsx from 'clsx'
import { ArrowRight, Check, Printer } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AiwoMark } from '@/components/joy/Brand'
import { EmptyIllustration } from '@/components/joy/EmptyIllustration'
import { DaybreakButton, Eyebrow, SpecimenTag, useFmtDate } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill } from '@/components/ui'
import { interceptsCrisis, useApp } from '@/lib/store'
import { PrintOnly } from './_parts'
import { SPECIMEN_TODAY, useLocal } from './_store'
import { rich, useCore } from './_i18n'
import { useX } from './_i18nX'

// THE JOYSPAN LETTER (Memo p17; Playbook p63, "The Mentor goes first").
// Monthly, in the Mentor's voice, with real numbers, his own included. Editorial and
// earthy: Newsreader, generous margins, Daybreak only as the ribbon. The Mentor writes in
// English; his words are his own and are not machine-translated, so the issues stay
// English in every language (the chrome around them is translated).
// The member reads every issue here and can write back; a reply is kept in this browser
// (specimen) as if sent to the Letter desk.

interface Issue {
  n: number
  month: string // ISO yyyy-mm
  title: string // one italic word, *like this*
  paras: string[]
  numbers: string
}

// Specimen issues, written for this front end in the Mentor's register.
const ISSUES: Issue[] = [
  {
    n: 3,
    month: '2027-01',
    title: 'What a *quiet* evening is worth',
    paras: [
      'In October my Index fell by two. In January it rose by four, to 63. Nothing dramatic happened in between. I stopped taking calls after seven, and I sat on the verandah with my wife for ten minutes most evenings, noticing three things before I said anything at all.',
      'Daily Pleasure moved most. Freedom moved a little. Healthspan did not move, and I am not going to pretend it did. I walk as much as I did; I simply walk less hurried.',
      'This month I am changing one thing: no meetings on Wednesday evenings, for a quarter. Write back and tell me the one thing you are changing before your next measure. I read every reply the desk sends me.',
    ],
    numbers: 'OCT 59 · JAN 63 · INDEX 63',
  },
  {
    n: 2,
    month: '2026-11',
    title: 'The number *can* go down',
    paras: [
      'My October measure came back two points lower than July. Freedom fell by six. I had said yes to too much, and the questionnaire noticed before I did.',
      'I am telling you because a method that shows only its rises would not deserve your trust, and neither would I. A fall is information. Mine told me which evenings I had given away.',
      'Dr Meera called me within two days, as she would call you. We did not talk about the number for long. We talked about Wednesdays.',
    ],
    numbers: 'JUL 61 · OCT 59 · FREEDOM −6',
  },
  {
    n: 1,
    month: '2026-10',
    title: 'Why I measured *myself* first',
    paras: [
      'Before we asked anyone to take the Joyspan Index, I took it. Then I took it again ninety days later, because one number is a photograph and two are a direction.',
      'I rose from 58 to 61. Purpose was already high; it usually is for people who start companies. Daily Pleasure was my lowest term, which surprised me and did not surprise my family at all.',
      'This Letter will come once a month. It will always carry real numbers, mine included, up and down.',
    ],
    numbers: 'APR 58 · JUL 61 · INDEX 61',
  },
]
const LATEST = ISSUES[0].n

interface Reply {
  id: string
  issue: number
  text: string
  at: string
}

const monthText = (ym: string, lang: string) =>
  new Date(`${ym}-15T12:00:00`).toLocaleDateString(lang === 'en' ? 'en-GB' : `${lang}-IN`, { month: 'short', year: 'numeric', numberingSystem: 'latn' } as Intl.DateTimeFormatOptions)

/** "*word*" in a title becomes the serif italic word. */
function titleParts(t: string) {
  return t.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith('*') && p.endsWith('*') ? <em key={i}>{p.slice(1, -1)}</em> : p))
}

export default function Letter() {
  const x = useX()
  const { lang } = useCore()
  const fmtDate = useFmtDate()
  const { setCrisisOpen } = useApp()
  const [sel, setSel] = useState(LATEST)
  const [read, setRead] = useLocal<number[]>('letter-read', [])
  const [replies, setReplies] = useLocal<Reply[]>('letter-replies', [])
  const [draft, setDraft] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  // Held after the emergency intercept: nothing is kept or sent, and support stays one tap away.
  const [held, setHeld] = useState(false)
  const issue = ISSUES.find((i) => i.n === sel) ?? ISSUES[0]
  const mine = replies.filter((r) => r.issue === issue.n)

  const open = (n: number) => {
    setSel(n)
    setSent(null)
    setHeld(false)
    setDraft('')
    if (!read.includes(n)) setRead((r) => [...new Set([...r, n])])
  }
  const send = () => {
    const text = draft.trim()
    if (!text) return
    // Free text: the emergency intercept runs before anything is kept (Memo p.24).
    if (interceptsCrisis(text)) {
      setCrisisOpen(true)
      setSent(null)
      setHeld(true)
      return
    }
    // On the specimen clock, like a Ledger entry: the specimen day at the real local time.
    const now = new Date()
    const at = `${SPECIMEN_TODAY}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setReplies((r) => [...r, { id: `lr_${Date.now().toString(36)}`, issue: issue.n, text, at }])
    setSent(at)
    setHeld(false)
    setDraft('')
  }

  return (
    <div>
      <PrintOnly id="joy-letter-issue" />
      <PageHeader eyebrow={x('ltEyebrow')} title={rich(x('ltTitle'))} lead={x('ltLead')} actions={<SpecimenTag />} />
      {lang !== 'en' && <p lang={lang} className="mb-6 max-w-2xl rounded-card bg-paper-sunk px-4 py-3 text-[14px] text-ink-2">{x('ltEnglishNote')}</p>}

      <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:gap-8">
        {/* Issues */}
        <nav aria-label={x('ltIssues')}>
          <p className="eyebrow mb-2 text-ink-3">{x('ltIssues')}</p>
          <ul className="space-y-1.5">
            {ISSUES.map((i) => {
              const on = i.n === sel
              const unread = i.n === LATEST && !read.includes(i.n) && !on
              return (
                <li key={i.n}>
                  <button
                    onClick={() => open(i.n)}
                    aria-current={on ? 'true' : undefined}
                    className={clsx('w-full rounded-card border px-4 py-3 text-left transition-colors focus-ring', on ? 'border-ink bg-paper-raised' : 'border-line hover:bg-paper-sunk')}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="eyebrow text-ink-3">{x('ltNo', { n: i.n })} · <span className="num">{monthText(i.month, lang)}</span></span>
                      {unread && <Pill tone="neutral">{x('ltNew')}</Pill>}
                    </span>
                    <span lang="en" className="mt-1 block text-[16px] leading-snug text-ink">{titleParts(i.title)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <Card tone="sunk" className="mt-5 !p-4">
            <Eyebrow>{x('ltHow')}</Eyebrow>
            <p className="mt-2 text-[14px] text-ink-2">{x('ltHowBody')}</p>
            <Link to="/app/settings" className="mt-2 inline-flex items-center gap-1.5 text-[14px] text-ink underline-offset-4 hover:underline focus-ring">{x('ltSettings')} <ArrowRight size={13} /></Link>
          </Card>
        </nav>

        {/* The issue */}
        <div className="min-w-0">
          <article id="joy-letter-issue" aria-label={x('ltNo', { n: issue.n })} className="relative overflow-hidden rounded-card border border-line bg-paper-raised px-6 py-8 shadow-card md:px-12 md:py-12">
            {/* Daybreak only as the ribbon */}
            <span aria-hidden className="absolute right-8 top-0 h-16 w-2.5 rounded-b-sm md:right-12" style={{ background: 'var(--daybreak)', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }} />
            <div className="flex items-start justify-between gap-4 pr-8">
              <AiwoMark size={18} />
              <span className="eyebrow text-ink-3">{x('ltNo', { n: issue.n })}</span>
            </div>
            {/* Editorial illustration: single-weight Ink line, one Daybreak fill (Playbook p51). */}
            <EmptyIllustration kind="letter" width={150} className="!mx-0 mt-6" />
            <p className="eyebrow mt-6 text-daybreak-ink">{x('ltEyebrow')} · <span className="num">{monthText(issue.month, lang)}</span></p>
            <div lang="en">
              <h2 className="mt-3 text-[2rem] font-light leading-tight text-ink md:text-[2.4rem]">{titleParts(issue.title)}</h2>
              <div className="mt-6 max-w-[62ch] space-y-4 font-serif text-[18px] leading-[1.6] text-ink">
                {issue.paras.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              <p className="eyebrow num mt-8 border-y border-line py-3 text-ink-2">{issue.numbers}</p>
              <p className="mt-8 font-serif text-[1.4rem] italic text-ink">C. Sivasankaran</p>
            </div>
            <p className="mt-1 text-[14px] text-ink-3">{x('ltMentorRole')}</p>
          </article>
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => window.print()}><Printer size={14} /> {x('ltPrint')}</Button>
          </div>

          {/* Write back */}
          <Card tone="raised" className="mt-6">
            <Eyebrow>{x('ltWriteBack')}</Eyebrow>
            <p className="mt-2 text-[15px] text-ink-2">{x('ltWriteBackHint')}</p>
            <label className="mt-4 block">
              <span className="sr-only">{x('ltWriteBack')}</span>
              <textarea
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setSent(null); setHeld(false) }}
                rows={4}
                maxLength={1200}
                placeholder={x('ltPlaceholder')}
                className="block w-full rounded-card border border-line-strong bg-paper-raised px-4 py-3 text-[16px] text-ink placeholder:text-ink-3 focus-ring"
              />
            </label>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <span className="num text-[13px] text-ink-3">{draft.length} / 1200</span>
              <DaybreakButton onClick={send} disabled={!draft.trim()}>{x('ltSend')}</DaybreakButton>
            </div>
            {held && (
              <div role="status" className="mt-3 rounded-lg bg-paper-sunk px-3 py-2.5 text-[14px] text-ink-2">
                <p>{x('ltHeld')}</p>
                <Button variant="secondary" size="sm" className="mt-2" onClick={() => setCrisisOpen(true)}>{x('amTalkNow')}</Button>
              </div>
            )}
            {sent && (
              <p role="status" className="mt-3 flex items-start gap-2 rounded-lg bg-paper-sunk px-3 py-2 text-[14px] text-ink-2">
                <Check size={15} className="mt-0.5 shrink-0" aria-hidden /> {rich(x('ltSent'), { date: <span className="num">{fmtDate(sent.slice(0, 10))}</span> })}
              </p>
            )}
            {mine.length > 0 && (
              <section className="mt-5 border-t border-line pt-4" aria-label={x('ltYours')}>
                <p className="eyebrow mb-2 text-ink-3">{x('ltYours')}</p>
                <ul className="space-y-3">
                  {mine.map((r) => (
                    <li key={r.id} className="rounded-lg bg-paper-sunk px-4 py-3">
                      <p className="num text-[12px] text-ink-3">{fmtDate(r.at.slice(0, 10))}</p>
                      {/* The member's own words, kept as written. */}
                      <p className="mt-1 whitespace-pre-wrap text-[15px] text-ink">{r.text}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
