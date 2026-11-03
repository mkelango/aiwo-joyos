import clsx from 'clsx'
import { Printer } from 'lucide-react'
import { AiwoMark } from '@/components/joy/Brand'
import { JoyspanWheel } from '@/components/joy/JoyspanWheel'
import { TermDot, useBandText } from '@/components/joy/primitives'
import { Button } from '@/components/ui'
import type { Grade, MethodVersion, TermKey, TermScore } from '@/domain/types'
import { useX } from './_i18nX'
import { useCore } from './_i18n'

// THE INDEX CARD (Brand Identity Playbook p59). "The most valuable object AIWO makes."
// Ten fields and no marketing copy, front and back, 85.6 × 54 mm, a Daybreak painted edge
// on the long side:
//   01 the Index, Mono 300, the largest element   02 "of 100", the date and the method
//   03 the Wheel, with guides                     04 six term scores with Spectrum chips
//   05 a band for each term                       06 Burden with its minus, in Amber
//   07 the lowest term, named                     08 one next step, in one sentence
//   09 the next measure date (Day 90)             10 the signing physician, by name
// The back is Ink: the mark, the line, the equation with its amber minus, and
// "AIWO.COM/METHOD · THE NUMBER CAN GO DOWN".

const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

/** dd.mm.yyyy, Latin digits (the card's date style). */
export function dotDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return d && m && y ? `${d}.${m}.${y}` : iso
}

export interface IndexCardProps {
  id?: string
  value: number
  terms: TermScore[]
  takenOn: string
  method: MethodVersion
  grade: Grade
  next: string
  lowest: TermKey
  /** The one next step, one sentence, in the member's language. */
  step: string
  /** The signing physician; omitted while a Clinical-grade card awaits sign-off. */
  signedBy?: string | null
  signedOn?: string | null
  /** Clinical grade, drafted and not yet signed. */
  awaiting?: boolean
  /** Day-0 terms, drawn as the Wheel's outline ghost. */
  baseline?: TermScore[] | null
  title?: string
  printable?: boolean
  className?: string
}

export function IndexCardView({ id, value, terms, takenOn, method, grade, next, lowest, step, signedBy, signedOn, awaiting = false, baseline = null, title, printable = true, className }: IndexCardProps) {
  const x = useX()
  const { t: c, name } = useCore()
  const band = useBandText()
  const signed = grade === 'clinical' && !awaiting && !!signedBy
  const signLine = signed ? x('icSignedBy', { who: signedBy!.toUpperCase() }) : awaiting ? x('icAwaitingSign') : x('icSelfAssessed')
  const note = signed
    ? x('icNoteClinical', { who: signedBy!, date: signedOn ? dotDate(signedOn) : dotDate(takenOn) })
    : awaiting
      ? x('icNoteAwaiting')
      : x('icNoteIndex')

  return (
    <article id={id} aria-label={c('icAria')} className={clsx('min-w-0', className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3" data-noprint>
        <p className="eyebrow text-ink-3">{title ?? c('icTitle')}</p>
        {printable && (
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer size={15} /> {c('icPrint')}
          </Button>
        )}
      </div>

      <div className="rounded-[20px] bg-paper-sunk p-3 sm:p-5">
        {/* ─── Front: Paper, the Daybreak painted edge on the long side ─────── */}
        <section
          aria-label={x('icFront')}
          className="relative overflow-hidden rounded-[14px] border border-line bg-paper-raised shadow-card"
          style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
        >
          {/* The painted edge follows the long side: down the left while the
              front stacks into a portrait column, along the top once it lays
              out as the landscape card (sm and up, and in print). */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-[6px] sm:inset-x-0 sm:bottom-auto sm:h-[6px] sm:w-auto print:inset-x-0 print:bottom-auto print:h-[6px] print:w-auto"
            style={{ background: 'var(--daybreak)', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
          />
          <div className="grid gap-5 p-5 sm:grid-cols-[1fr_1.15fr] sm:gap-6 sm:p-6">
            <div className="flex min-w-0 flex-col">
              <AiwoMark size={18} />
              <p className="eyebrow mt-2 text-ink-3">{x('icYourIndex')}</p>
              <p className="num mt-5 text-[4.5rem] font-light leading-[0.85] tracking-tight text-ink sm:text-[5rem]" aria-label={c('jiAria', { v: value })}>{value}</p>
              <p className="eyebrow mt-3 text-ink-2">{x('icOf100', { date: dotDate(takenOn) })}</p>
              <p className="eyebrow text-ink-2">{x('icMethod', { m: method })}</p>

              <div className="mt-6">
                <p className="text-[14px] font-medium text-ink">{x('icNextStepH')}</p>
                <p className="mt-1 text-[14px] leading-snug text-ink-2">{x('icNextStepBody', { term: name(lowest), step })}</p>
              </div>

              <div className="mt-auto pt-6">
                <p className="eyebrow text-ink-2">{x('icNextMeasure', { date: dotDate(next) })}</p>
                <p className={clsx('eyebrow', signed ? 'text-ink' : 'text-ink-3')}>{signLine}</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-col items-center">
              <JoyspanWheel terms={terms} size={150} animate={false} baseline={baseline} />
              <dl className="mt-3 w-full">
                {ORDER.map((k) => {
                  const s = terms.find((t) => t.key === k)
                  const isB = k === 'B'
                  return (
                    <div key={k} className="flex items-center justify-between gap-3 border-b border-line/70 py-1.5 last:border-0">
                      <dt className="flex min-w-0 items-center gap-2 text-[13px] text-ink">
                        <TermDot term={k} size={9} /> <span className="min-w-0 break-words">{name(k)}</span>
                      </dt>
                      <dd className="flex shrink-0 items-center gap-3">
                        <span className="num w-9 text-right text-[13px] text-ink">
                          {s?.value == null ? '—' : isB ? <><span style={{ color: 'var(--term-b)' }}>−</span>{s.value}</> : s.value}
                        </span>
                        <span className="eyebrow w-[4.5rem] text-ink-3">{s ? band(s.band) : ''}</span>
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </div>
          </div>
        </section>

        {/* ─── Back: Ink, the mark, the line, the equation, the footer ──────── */}
        <section
          aria-label={x('icBack')}
          className="mt-3 rounded-[14px] px-5 py-6 sm:px-6"
          style={{ background: 'var(--aiwo-ink)', color: 'var(--aiwo-stone)', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <AiwoMark size={18} className="!text-[color:var(--aiwo-stone)]" />
              <p lang="en" className="mt-2 font-serif text-[17px]">Years Worth Living.</p>
            </div>
            <div className="min-w-0 sm:max-w-[60%] sm:text-right">
              <p className="font-serif text-[14px] leading-relaxed">
                Joyspan = {name('H')} + {name('P')} + {name('R')} + {name('F')} + {name('D')}{' '}
                <span style={{ color: '#e3a86e' }}>−</span> {name('B')}
              </p>
              <p className="eyebrow mt-3" style={{ color: 'color-mix(in srgb, var(--aiwo-stone) 72%, var(--aiwo-ink))' }}>
                <span lang="en">AIWO.COM/METHOD</span> · {x('icCanGoDown')}
              </p>
            </div>
          </div>
        </section>
        <p className="eyebrow mt-3 text-center text-ink-3">{x('icCaption')}</p>
      </div>

      <p className="mt-3 text-[13px] text-ink-3">{note}</p>
    </article>
  )
}
