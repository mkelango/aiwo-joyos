import clsx from 'clsx'
import { ArrowRight, Check, HeartPulse, Home, Plus, ScrollText, Stethoscope, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { SpecimenTag, fmtDate } from '@/components/joy/primitives'
import { Button, Card, Pill, Sheet } from '@/components/ui'
import { useDict } from '@/lib/i18n'
import { activeLang, interceptsCrisis, useApp } from '@/lib/store'
import { SPECIMEN_NOW } from './_data'
import { Checkbox, Field, Section, Select } from './_parts'
import { inputCls, rich, usePersisted } from './_util'
import { HH } from './_i18n'

// HOUSEHOLD KIND AND THE FAMILY JOY OFFICE (Arch p.13 household.kind couple|family|fjo;
// Memo tenant 5: a household tenant with a Clinical Index for every resident across three
// generations, a Family Joy Charter, a named physician and concierge, an annual report in
// aggregate only). The charter is written by the family: values, rituals, one shared joy a
// week; every adult agrees before it is kept. Specimen data; kept per viewer.
// Every free-text field runs the emergency intercept first (Arch p.27): words of crisis open the
// P0 sheet, and the text is held until the member chooses to keep it (a second press).

export type HouseholdKind = 'couple' | 'family' | 'fjo'
type HhKey = keyof typeof HH
const KIND_LABEL: Record<HouseholdKind, HhKey> = { couple: 'kindCouple', family: 'kindFamily', fjo: 'kindFjo' }
const KIND_DESC: Record<HouseholdKind, HhKey> = { couple: 'kindCoupleDesc', family: 'kindFamilyDesc', fjo: 'kindFjoDesc' }

export function useHouseholdKind() {
  const [rec, setRec] = usePersisted<{ kind: HouseholdKind; since: string }>('household-kind', { kind: 'family', since: '2026-07-06' })
  return [rec, (kind: HouseholdKind) => setRec({ kind, since: SPECIMEN_NOW })] as const
}

/** The household's kind, shown under the header, with a sheet to change it. */
export function KindStrip({ kind, since, people, onChange }: { kind: HouseholdKind; since: string; people: number; onChange: (k: HouseholdKind) => void }) {
  const tr = useDict(HH)
  const [open, setOpen] = useState(false)
  const [pick, setPick] = useState<HouseholdKind>(kind)
  const [agree, setAgree] = useState(false)
  const [tried, setTried] = useState(false)
  useEffect(() => { if (open) { setPick(kind); setAgree(kind === 'fjo'); setTried(false) } }, [open, kind])
  const needsAgree = pick === 'fjo' && kind !== 'fjo'
  return (
    <>
      <Card tone="sunk" className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Home size={18} className="mt-1 shrink-0 text-ink-3" />
          <div>
            <p className="eyebrow text-ink-3">{tr('kindEyebrow')}</p>
            <p className="mt-1 text-[17px] text-ink">{tr(KIND_LABEL[kind])} <span className="text-[14px] text-ink-3">· {rich(tr('kindSince'), { date: <span className="num">{fmtDate(since)}</span> })}</span></p>
            <p className="mt-1 text-[14px] text-ink-2">{tr(KIND_DESC[kind])}</p>
          </div>
        </div>
        <Button size="sm" variant="secondary" className="self-start sm:self-auto" onClick={() => setOpen(true)}>{tr('kindChange')}</Button>
      </Card>
      <Sheet open={open} onClose={() => setOpen(false)} title={tr('kindTitle')} side="center">
        <div role="radiogroup" aria-label={tr('kindEyebrow')} className="grid gap-2">
          {(['couple', 'family', 'fjo'] as const).map((k) => {
            const blocked = k === 'couple' && people > 2
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={pick === k}
                aria-disabled={blocked || undefined}
                onClick={() => { if (!blocked) { setPick(k); setTried(false) } }}
                className={clsx('rounded-card border p-4 text-left focus-ring', blocked ? 'cursor-default border-dashed border-line text-ink-3' : pick === k ? 'border-ink bg-paper-raised' : 'border-line hover:border-line-strong')}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className={clsx('text-[16px]', blocked ? 'text-ink-3' : 'text-ink')}>{tr(KIND_LABEL[k])}</span>
                  {pick === k && !blocked && <Check size={16} className="text-ink" />}
                </span>
                <span className="mt-1 block text-[14px] text-ink-2">{blocked ? tr('kindCoupleNo') : tr(KIND_DESC[k])}</span>
              </button>
            )
          })}
        </div>
        {needsAgree && (
          <div className="mt-4">
            <Checkbox checked={agree} onChange={setAgree}>{tr('kindFjoAgree')}</Checkbox>
            {tried && !agree && <p role="alert" className="mt-2 text-[14px] text-error">{tr('pleaseConfirm')}</p>}
          </div>
        )}
        <p className="mt-4 text-[13px] text-ink-3">{tr('kindEach')}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>{tr('cancel')}</Button>
          <Button
            variant="ink"
            onClick={() => {
              setTried(true)
              if (needsAgree && !agree) return
              if (pick !== kind) onChange(pick)
              setOpen(false)
            }}
          >
            {tr('kindSave')}
          </Button>
        </div>
      </Sheet>
    </>
  )
}

/** The Family Joy Office panel, shown only for an FJO household. */
export function FjoOffice({ adults, minor, onAsk }: { adults: { name: string; status: 'signed' | 'booked'; on: string }[]; minor: string; onAsk: (m: string) => void }) {
  const tr = useDict(HH)
  const [asked, setAsked] = useState(false)
  return (
    <Section id="fjo" className="mt-16" eyebrow={tr('fjoEyebrow')} title={rich(tr('fjoTitle'), { em: <em className="font-serif">{tr('fjoEm')}</em> })} lead={tr('fjoLead')} aside={<SpecimenTag />}>
      <div className="grid gap-4 md:grid-cols-3">
        <Card tone="sunk">
          <Stethoscope size={18} className="text-ink-3" />
          <p className="eyebrow mt-3 text-ink-3">{tr('fjoPhysician')}</p>
          <p className="mt-1 text-[16px] text-ink">Dr Meera Iyer</p>
          <p className="text-[14px] text-ink-2">AIWO Chennai</p>
        </Card>
        <Card tone="sunk" className="flex flex-col">
          <UserRound size={18} className="text-ink-3" />
          <p className="eyebrow mt-3 text-ink-3">{tr('fjoConcierge')}</p>
          <p className="mt-1 text-[16px] text-ink">Ritu Menon</p>
          <div className="mt-auto pt-3">
            {asked ? (
              <p role="status" className="text-[13px] text-ink-2">{tr('fjoAsked')}</p>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => { setAsked(true); onAsk(tr('fjoAsked')) }}>{tr('fjoAsk')}</Button>
            )}
          </div>
        </Card>
        <Card tone="sunk">
          <ScrollText size={18} className="text-ink-3" />
          <p className="eyebrow mt-3 text-ink-3">{tr('fjoReport')}</p>
          <p className="mt-1 text-[16px] text-ink">{tr('fjoReportV')}</p>
          <p className="text-[14px] text-ink-2">{rich(tr('fjoNext'), { date: <span className="num">{fmtDate('2027-07-06')}</span> })}</p>
        </Card>
      </div>
      <Card className="mt-4">
        <p className="eyebrow flex items-center gap-1.5 text-ink-3"><HeartPulse size={13} /> {tr('fjoClinical')}</p>
        <ul className="mt-3 divide-y divide-line">
          {adults.map((a) => (
            <li key={a.name} className="flex items-center justify-between gap-3 py-3 text-[15px]">
              <span className="text-ink">{a.name}</span>
              <Pill tone={a.status === 'signed' ? 'positive' : 'neutral'}>{rich(tr(a.status === 'signed' ? 'fjoSigned' : 'fjoBooked'), { date: <span className="num">{fmtDate(a.on)}</span> })}</Pill>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 py-3 text-[15px]">
            <span className="text-ink">{minor}</span>
            <Pill>{tr('fjoNever')}</Pill>
          </li>
        </ul>
        <a href="#charter" className="mt-2 inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">{tr('fjoCharterLink')} <ArrowRight size={15} /></a>
      </Card>
    </Section>
  )
}

type Cadence = 'daily' | 'weekly' | 'monthly' | 'yearly'
const CADENCE: Record<Cadence, HhKey> = { daily: 'chDaily', weekly: 'chWeekly', monthly: 'chMonthly', yearly: 'chYearly' }
interface Ritual { id: string; what: string; when: Cadence }
interface Charter {
  values: string[]
  rituals: Ritual[]
  joy: { what: string; day: number }
  written: boolean
  agreed: string[]
  agreedOn?: string
  /** The shared joy marked as had this week (date), never counted. */
  week?: string
}
const EMPTY: Charter = { values: [], rituals: [], joy: { what: '', day: 0 }, written: false, agreed: [] }

/** Day name in the member's language (0 = Sunday). */
function dayName(i: number) {
  const d = new Date(2027, 0, 3 + i) // 3 Jan 2027 was a Sunday
  const lang = activeLang()
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : `${lang}-IN`, { weekday: 'long' })
}

/** The Family Joy Charter: shown as written, or as an invitation to write it. */
export function CharterCard({ kind, adults, minor, onToast }: { kind: HouseholdKind; adults: string[]; minor: string; onToast: (m: string) => void }) {
  const tr = useDict(HH)
  const [ch, setCh] = usePersisted<Charter>('charter', EMPTY)
  const [editing, setEditing] = useState(false)
  const [me, ...others] = adults
  const waiting = adults.filter((a) => !ch.agreed.includes(a))
  const agree = (name: string) => {
    const agreed = Array.from(new Set([...ch.agreed, name]))
    const all = adults.every((a) => agreed.includes(a))
    setCh((c) => {
      const next = Array.from(new Set([...c.agreed, name]))
      return { ...c, agreed: next, agreedOn: adults.every((a) => next.includes(a)) ? SPECIMEN_NOW : undefined }
    })
    onToast(all ? tr('chAllToast') : tr('chAgreeToast', { name }))
  }
  return (
    <Section id="charter" eyebrow={kind === 'fjo' ? tr('chOffice') : tr('patron')} title={tr('charter')}>
      <Card tone="sunk" className="flex flex-col">
        <ScrollText size={22} className="text-ink-3" />
        {!ch.written ? (
          <>
            <p className="mt-4 text-[1.3rem] font-light leading-snug text-ink">
              {rich(tr('charterLine'), { em: <em className="font-serif">{tr('charterEm')}</em> })}
            </p>
            <ul className="mt-4 space-y-2 text-[15px] text-ink-2">
              <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> {tr('charter1')}</li>
              <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> {tr('charter2')}</li>
              <li className="flex gap-2"><Check size={16} className="mt-1 shrink-0 text-ink-3" /> {tr('charter3')}</li>
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="ink" onClick={() => setEditing(true)}><ScrollText size={15} /> {tr('chWrite')}</Button>
              {kind !== 'fjo' && <Link to="/app/membership" className="inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">{tr('seePatron')} <ArrowRight size={15} /></Link>}
            </div>
          </>
        ) : (
          <>
            <div className="mt-4">
              <p className="eyebrow text-ink-3">{tr('chValues')}</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">{ch.values.map((v) => <li key={v}><Pill>{v}</Pill></li>)}</ul>
            </div>
            <div className="mt-5">
              <p className="eyebrow text-ink-3">{tr('chRituals')}</p>
              <ul className="mt-2 space-y-1.5 text-[15px]">
                {ch.rituals.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-3"><span className="text-ink">{r.what}</span><span className="text-[13px] text-ink-3">{tr(CADENCE[r.when])}</span></li>
                ))}
              </ul>
            </div>
            <div className="mt-5 rounded-card border border-line bg-paper-raised p-4">
              <p className="eyebrow text-ink-3">{tr('chJoy')}</p>
              <p className="mt-1 text-[16px] text-ink">{ch.joy.what} <span className="text-[14px] text-ink-3">· {dayName(ch.joy.day)}</span></p>
              {ch.week ? (
                <p role="status" className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-ink-2">
                  <Check size={14} /> {rich(tr('chWeekNoted'), { date: <span className="num">{fmtDate(ch.week)}</span> })}
                  <Button size="sm" variant="ghost" onClick={() => setCh((c) => ({ ...c, week: undefined }))}>{tr('chWeekUndo')}</Button>
                </p>
              ) : (
                <Button size="sm" variant="secondary" className="mt-3" onClick={() => { setCh((c) => ({ ...c, week: SPECIMEN_NOW })); onToast(tr('chWeekToast')) }}>{tr('chWeekDone')}</Button>
              )}
            </div>
            <div className="mt-5 border-t border-line pt-4" aria-live="polite">
              {waiting.length === 0 && ch.agreedOn ? (
                <p className="flex items-center gap-1.5 text-[14px] text-ink"><Check size={14} /> {rich(tr('chAgreedAll'), { date: <span className="num">{fmtDate(ch.agreedOn)}</span> })}</p>
              ) : (
                <>
                  <p className="text-[14px] text-ink-2">{tr('chAgreedBy', { names: ch.agreed.join(', ') })} · {tr('chWaiting', { names: waiting.join(', ') })}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {waiting.map((w) => <Button key={w} size="sm" variant="link" className="text-[14px]" onClick={() => agree(w)}>{tr('chDemoAgree', { name: w })}</Button>)}
                  </div>
                </>
              )}
              <p className="mt-2 text-[13px] text-ink-3">{tr('chMinor', { name: minor })} {tr('chPrivate')}</p>
            </div>
            <div className="mt-4">
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>{tr('chEdit')}</Button>
            </div>
          </>
        )}
      </Card>
      <CharterEditor
        open={editing}
        charter={ch}
        onClose={() => setEditing(false)}
        onSave={(next) => {
          setCh((c) => ({ ...next, written: true, agreed: [me], agreedOn: others.length ? undefined : SPECIMEN_NOW, week: c.week }))
          setEditing(false)
          onToast(tr('chSaved'))
        }}
      />
    </Section>
  )
}

function CharterEditor({ open, charter, onClose, onSave }: { open: boolean; charter: Charter; onClose: () => void; onSave: (c: Charter) => void }) {
  const tr = useDict(HH)
  const [values, setValues] = useState<string[]>([])
  const [value, setValue] = useState('')
  const [valueErr, setValueErr] = useState<string | null>(null)
  const [rituals, setRituals] = useState<Ritual[]>([])
  const [joy, setJoy] = useState({ what: '', day: 0 })
  const [tried, setTried] = useState(false)
  const { setCrisisOpen } = useApp()
  // Texts already shown to the crisis sheet: pressing again keeps them, as everywhere else.
  const [held, setHeld] = useState<Set<string>>(() => new Set())
  /** True when this text should stop here: it reads as crisis and has not been held yet. */
  const intercept = (texts: string[]) => {
    const hit = texts.map((x) => x.trim()).filter((x) => x && !held.has(x) && interceptsCrisis(x))
    if (!hit.length) return false
    setCrisisOpen(true)
    setHeld((h) => new Set([...h, ...hit]))
    return true
  }
  // Each opening starts from what is kept (or one empty ritual for a first draft).
  useEffect(() => {
    if (!open) return
    setValues(charter.values); setValue(''); setValueErr(null)
    setRituals(charter.rituals.length ? charter.rituals : [{ id: `r${Date.now()}`, what: '', when: 'weekly' }])
    setJoy(charter.joy); setTried(false); setHeld(new Set())
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const addValue = () => {
    const v = value.trim()
    if (v.length < 2) return
    if (intercept([v])) return
    if (values.length >= 5) { setValueErr(tr('chValueMax')); return }
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) { setValueErr(tr('chValueDup')); return }
    setValues([...values, v]); setValue(''); setValueErr(null)
  }
  const named = rituals.filter((r) => r.what.trim())
  const errs = {
    values: values.length === 0 ? tr('chValueErr') : null,
    rituals: named.length === 0 || named.length !== rituals.length ? tr('chRitualErr') : null,
    joy: joy.what.trim().length < 2 ? tr('chJoyErr') : null,
  }
  const days = Array.from({ length: 7 }, (_, i) => ({ value: String(i), label: dayName(i) }))
  return (
    <Sheet open={open} onClose={onClose} title={tr('charter')}>
      <form
        noValidate
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault(); setTried(true)
          if (errs.values || errs.rituals || errs.joy) return
          if (intercept([...values, ...rituals.map((r) => r.what), joy.what])) return
          onSave({ ...charter, values, rituals: rituals.map((r) => ({ ...r, what: r.what.trim() })), joy: { what: joy.what.trim(), day: joy.day } })
        }}
      >
        <p className="text-[15px] text-ink-2">{tr('chEditorIntro')}</p>

        <fieldset>
          <legend className="text-[16px] text-ink">{tr('chValues')}</legend>
          {values.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {values.map((v) => (
                <li key={v} className="inline-flex items-center gap-1 rounded-full border border-line-strong bg-paper-raised py-1 pl-3 pr-1 text-[14px] text-ink">
                  {v}
                  <button type="button" onClick={() => setValues(values.filter((x) => x !== v))} aria-label={tr('chRemove', { x: v })} className="flex h-6 w-6 items-center justify-center rounded-full text-ink-3 hover:bg-paper-sunk hover:text-ink focus-ring"><X size={13} /></button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex gap-2">
            <label className="sr-only" htmlFor="ch-value">{tr('chValueNew')}</label>
            <input id="ch-value" value={value} maxLength={60} onChange={(e) => { setValue(e.target.value); setValueErr(null) }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addValue() } }} placeholder={tr('chValuePh')} autoComplete="off" className={inputCls} />
            <Button variant="secondary" onClick={addValue} disabled={value.trim().length < 2}><Plus size={15} /> {tr('chAdd')}</Button>
          </div>
          {(valueErr || (tried && errs.values)) && <p role="alert" className="mt-2 text-[14px] text-error">{valueErr ?? errs.values}</p>}
        </fieldset>

        <fieldset>
          <legend className="text-[16px] text-ink">{tr('chRituals')}</legend>
          <ul className="mt-2 space-y-3">
            {rituals.map((r, i) => (
              <li key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 sm:grid-cols-[minmax(0,1fr)_150px_auto]">
                <Field label={tr('chRitualN', { n: String(i + 1) })} className="col-span-2 sm:col-span-1">
                  {(id) => <input id={id} value={r.what} maxLength={80} onChange={(e) => setRituals(rituals.map((x) => (x.id === r.id ? { ...x, what: e.target.value } : x)))} placeholder={tr('chRitualPh')} autoComplete="off" className={inputCls} />}
                </Field>
                <Field label={tr('chWhen')}>
                  {(id) => <Select id={id} value={r.when} onChange={(v) => setRituals(rituals.map((x) => (x.id === r.id ? { ...x, when: v as Cadence } : x)))} options={(Object.keys(CADENCE) as Cadence[]).map((c) => ({ value: c, label: tr(CADENCE[c]) }))} />}
                </Field>
                <Button size="sm" variant="ghost" className="mb-1" disabled={rituals.length < 2} onClick={() => setRituals(rituals.filter((x) => x.id !== r.id))} aria-label={tr('chRemove', { x: r.what || tr('chRitualN', { n: String(i + 1) }) })}><X size={15} /></Button>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="ghost" className="mt-2" disabled={rituals.length >= 6} title={rituals.length >= 6 ? tr('chRitualMax') : undefined} onClick={() => setRituals([...rituals, { id: `r${Date.now()}`, what: '', when: 'weekly' }])}><Plus size={15} /> {tr('chRitualAdd')}</Button>
          {tried && errs.rituals && <p role="alert" className="mt-2 text-[14px] text-error">{errs.rituals}</p>}
        </fieldset>

        <fieldset>
          <legend className="text-[16px] text-ink">{tr('chJoy')}</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px]">
            <Field label={tr('chJoyWhat')} error={tried ? errs.joy : null}>
              {(id, d) => <input id={id} aria-describedby={d} value={joy.what} maxLength={80} onChange={(e) => setJoy({ ...joy, what: e.target.value })} placeholder={tr('chJoyPh')} autoComplete="off" className={inputCls} />}
            </Field>
            <Field label={tr('chDay')}>
              {(id) => <Select id={id} value={String(joy.day)} onChange={(v) => setJoy({ ...joy, day: Number(v) })} options={days} />}
            </Field>
          </div>
        </fieldset>

        <p className="text-[13px] text-ink-3">{charter.written ? tr('chEditNote') : tr('chPrivate')}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>{tr('cancel')}</Button>
          <Button variant="ink" type="submit">{tr('chSave')}</Button>
        </div>
      </form>
    </Sheet>
  )
}
