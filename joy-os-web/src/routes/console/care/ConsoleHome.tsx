import clsx from 'clsx'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, Eye, FileLock2, KeyRound, Lock, Minus, ScrollText, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { DaybreakButton, Eyebrow, SpecimenTag } from '@/components/joy/primitives'
import { Button, Card, PageHeader, Pill } from '@/components/ui'
import { CONSOLES } from '@/layouts/ConsoleLayout'
import { ACCESS_LOG } from '@/data/member'
import { useApp } from '@/lib/store'
import { AccessRequestSheet } from './_access'
import { GATE, ROLE_OPTIONS } from './_gate'
import { AccessNote } from './_parts'

// ALL CONSOLES (Memo p.16; Architecture p21, p25): who uses each console, the access rule
// it enforces, how role gating works, and the audit promise. Role-gated, fail closed.

const RELATIONSHIP: Record<string, string> = {
  '/console/coach': 'Circle coach of the member, or assigned concierge',
  '/console/clinical': 'Assigned physician or psychologist, with Care consent',
  '/console/partner': 'Staff of the venue the guest booked',
  '/console/tenant': 'Admin of the employer, insurer or hospital unit',
  '/console/science': 'Named signer for method and cohort releases',
  '/console/ops': 'Just-in-time grant, approved by a second engineer',
  '/console/exec': 'Leadership group; aggregates and scoreboards only',
}

type Level = 'full' | 'bands' | 'counts' | 'aggregate' | 'schedule' | 'none'
const DATA_CLASSES: { cls: string; note: string; cells: Level[] }[] = [
  //                                  coach     clinical  partner     tenant      science      ops
  { cls: 'Index and term scores', note: 'Six terms, band, method', cells: ['bands', 'full', 'none', 'aggregate', 'aggregate', 'none'] },
  { cls: 'Raw biomarkers and labs', note: 'Panels, vitals, e-Rx', cells: ['none', 'full', 'none', 'none', 'none', 'none'] },
  { cls: 'Ease screens', note: 'PHQ-4, ISI, PSS-4 answers', cells: ['none', 'full', 'none', 'none', 'aggregate', 'none'] },
  { cls: 'Ledger, journals, Ikigai map', note: 'Free text, field-encrypted', cells: ['counts', 'none', 'none', 'none', 'none', 'none'] },
  { cls: 'Partner-in-a-couple answers', note: 'Private to each partner', cells: ['none', 'none', 'none', 'none', 'none', 'none'] },
  { cls: 'Name, room, dietary, schedule', note: 'For a booked stay only', cells: ['full', 'full', 'schedule', 'none', 'none', 'none'] },
  { cls: 'Audit and access records', note: 'Actor, role, purpose, time', cells: ['none', 'none', 'none', 'none', 'none', 'full'] },
]
const COLS = ['Coach', 'Clinical', 'Venue', 'Tenant', 'Science', 'Ops']

const LEVEL: Record<Level, { label: string; cls: string }> = {
  full: { label: 'Yes', cls: 'bg-ink text-paper' },
  bands: { label: 'Scores · bands', cls: 'border border-ink text-ink' },
  counts: { label: 'Counts only', cls: 'border border-line-strong text-ink-2' },
  aggregate: { label: 'k ≥ 10', cls: 'border border-line-strong text-ink-2' },
  schedule: { label: 'Schedule', cls: 'border border-line-strong text-ink-2' },
  none: { label: 'No', cls: 'text-ink-3' },
}

export default function ConsoleHome() {
  const { role, setRole } = useApp()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const current = ROLE_OPTIONS.find((r) => r.value === role) ?? ROLE_OPTIONS[0]
  const activeRole = ROLE_OPTIONS.some((r) => r.value === role) ? role : 'coach'
  const home = CONSOLES.find((c) => GATE[c.to]?.includes(activeRole)) ?? CONSOLES[0]
  const [requesting, setRequesting] = useState<(typeof CONSOLES)[number] | null>(null)
  const [requested, setRequested] = useState<Record<string, string>>({})

  return (
    <div>
      <PageHeader
        eyebrow="Joy OS · Consoles"
        title={<>Every console sees only what its <em>job</em> needs</>}
        lead="Seven consoles sit around the member app. Each is gated by role and by relationship to the member, fails closed, and writes every read to an audit the member can see in their trust centre."
        actions={<SpecimenTag />}
      />

      {/* Role switcher — the demo stand-in for AIWO ID + SSO */}
      <Card tone="sunk" className="mb-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <Eyebrow tone="daybreak">Signed in as · specimen</Eyebrow>
            <p className="mt-2 text-[1.5rem] font-light leading-snug text-ink">{current.person}</p>
            <p className="mt-1 text-[15px] text-ink-2">
              Role <span className="text-ink">{current.label.toLowerCase()}</span>. Consoles your role cannot open stay locked below; there is no override, only a request.
            </p>
            <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Demo role">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  role="radio"
                  aria-checked={activeRole === r.value}
                  onClick={() => setRole(r.value)}
                  className={clsx('rounded-full px-3.5 py-1.5 text-[14px] transition-colors focus-ring', activeRole === r.value ? 'bg-ink text-paper' : 'border border-line-strong bg-paper-raised text-ink-2 hover:text-ink')}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <DaybreakButton onClick={() => navigate(home.to)}>
              Open {home.label.toLowerCase()} <ArrowRight size={18} />
            </DaybreakButton>
            <span className="text-[13px] text-ink-3">Reason for access is asked when you open a member.</span>
          </div>
        </div>
      </Card>

      {/* The seven consoles */}
      <section aria-labelledby="consoles-h">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="consoles-h" className="eyebrow text-ink-3">The consoles · {CONSOLES.length}</h2>
          <span className="text-[13px] text-ink-3">Care · Platform</span>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CONSOLES.map((c, i) => {
            const open = GATE[c.to]?.includes(activeRole)
            const Icon = c.icon
            return (
              <motion.li
                key={c.to}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: reduce ? 0 : i * 0.03 }}
                className={clsx('group flex flex-col rounded-card border p-5 md:p-6', open ? 'border-line bg-paper-raised shadow-card' : 'border-dashed border-line-strong bg-paper')}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={clsx('flex h-11 w-11 items-center justify-center rounded-full', open ? 'bg-paper-sunk text-ink' : 'bg-paper-sunk text-ink-3')}>
                    <Icon size={20} strokeWidth={1.6} aria-hidden />
                  </span>
                  {open ? <Pill tone="ink"><Check size={12} aria-hidden /> Your role</Pill> : <Pill><Lock size={12} aria-hidden /> {c.to === '/console/ops' ? 'JIT only' : 'Locked'}</Pill>}
                </div>
                <h3 className="mt-4 text-[1.25rem] font-light text-ink">{c.label}</h3>
                <p className="mt-1 text-[15px] text-ink-2">{c.who}</p>
                <dl className="mt-4 space-y-3 border-t border-line pt-4 text-[14px]">
                  <div>
                    <dt className="eyebrow text-ink-3">Access rule</dt>
                    <dd className="mt-0.5 text-ink">{c.rule}</dd>
                  </div>
                  <div>
                    <dt className="eyebrow text-ink-3">Relationship check</dt>
                    <dd className="mt-0.5 text-ink-2">{RELATIONSHIP[c.to]}</dd>
                  </div>
                </dl>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-5">
                  <Link to={c.to} className="inline-flex items-center gap-1.5 whitespace-nowrap text-[15px] text-ink underline-offset-4 hover:underline focus-ring">
                    {open ? 'Open' : 'Preview as specimen'} <ArrowRight size={15} aria-hidden />
                  </Link>
                  {!open && (requested[c.to] ? (
                    <span className="text-[12px] text-ink-2">Requested · <span className="num">{requested[c.to]}</span></span>
                  ) : (
                    <Button size="sm" variant="secondary" className="whitespace-nowrap" onClick={() => setRequesting(c)}>{c.to === '/console/ops' ? 'JIT request' : 'Request from DPO'}</Button>
                  ))}
                </div>
              </motion.li>
            )
          })}
          <li className="flex flex-col justify-between rounded-card bg-paper-sunk p-5 md:p-6">
            <div>
              <Eyebrow>And at the centre</Eyebrow>
              <h3 className="mt-3 text-[1.25rem] font-light text-ink">The member app</h3>
              <p className="mt-1 text-[15px] text-ink-2">Every console serves one person’s ninety days. The member owns the record, sees every read, and can withdraw any consent in one tap.</p>
            </div>
            <Link to="/app" className="mt-5 inline-flex items-center gap-1.5 text-[15px] text-ink underline-offset-4 hover:underline focus-ring">Open Joy OS <ArrowRight size={15} aria-hidden /></Link>
          </li>
        </ul>
      </section>

      {/* How gating works */}
      <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.6fr]" aria-labelledby="gating-h">
        <div className="min-w-0">
          <h2 id="gating-h" className="text-[1.6rem] font-light leading-snug text-ink">Role, then relationship, then <em>purpose</em></h2>
          <p className="mt-3 text-[17px] leading-relaxed text-ink-2">
            A role opens a console. It does not open a member. Each read is checked again against the person’s relationship to the member and the consent that covers the purpose. Policies are code, and they fail closed.
          </p>
          <ol className="mt-6 space-y-4">
            {[
              { icon: KeyRound, t: 'Role', d: 'AIWO ID with passkey or tenant SSO. Ten roles, from member to scientist.' },
              { icon: ShieldCheck, t: 'Relationship', d: 'Assigned physician, circle coach, venue of the booking, or an active share grant.' },
              { icon: FileLock2, t: 'Purpose and consent', d: '“May I? member, purpose = coach_digest.” The consent service answers yes with a field scope, or no.' },
              { icon: ScrollText, t: 'Audit', d: 'Actor, role, purpose, resource and time, kept seven years and shown to the member.' },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-4">
                <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-strong text-[13px] text-ink-2">{i + 1}</span>
                <div>
                  <p className="flex items-center gap-2 text-[16px] text-ink"><s.icon size={16} aria-hidden className="text-ink-3" /> {s.t}</p>
                  <p className="mt-0.5 text-[15px] text-ink-2">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <Card className="min-w-0">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <Eyebrow>Who can see what · by data class</Eyebrow>
            <span className="text-[13px] text-ink-3">Employers see aggregates of 50 or more</span>
          </div>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-[14px]">
              <caption className="sr-only">Access by data class and console</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="eyebrow py-3 pr-4 font-normal text-ink-3">Data class</th>
                  {COLS.map((c) => <th key={c} scope="col" className="eyebrow px-1 py-3 text-center font-normal text-ink-3">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {DATA_CLASSES.map((row) => (
                  <tr key={row.cls} className="border-b border-line last:border-0">
                    <th scope="row" className="py-3 pr-4 font-normal">
                      <span className="block text-ink">{row.cls}</span>
                      <span className="block text-[12px] text-ink-3">{row.note}</span>
                    </th>
                    {row.cells.map((lv, i) => (
                      <td key={i} className="px-1 py-3 text-center">
                        {lv === 'none' ? (
                          <span className="inline-flex text-ink-3" aria-label="No"><Minus size={14} aria-hidden /></span>
                        ) : (
                          <span className={clsx('inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px]', LEVEL[lv].cls)}>{LEVEL[lv].label}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[13px] text-ink-3">
            Partner-in-a-couple answers are private to each partner in every console. Raw clinical values appear in the clinical portal only. Admins never see raw biomarkers.
          </p>
        </Card>
      </section>

      {/* Audit statement */}
      <section className="mt-12 grid gap-6 lg:grid-cols-[1.6fr_1fr]" aria-labelledby="audit-h">
        {/* Ink ground stays dark in both themes; text uses the constant Stone token so it never vanishes in dark mode. */}
        <Card tone="ink" className="flex flex-col justify-between" style={{ color: 'var(--aiwo-stone)' }}>
          <div>
            <p className="eyebrow opacity-70">The audit promise</p>
            <h2 id="audit-h" className="mt-3 max-w-2xl text-[1.7rem] font-light leading-snug md:text-[2rem]">
              Every read in every console is written down, and the member can <em>see</em> it.
            </h2>
            <p className="mt-4 max-w-2xl text-[17px] leading-relaxed opacity-85">
              Who looked, in what role, for what purpose, at which record, and when. Kept for seven years in the DPDP consent ledger. Unusual reads raise an alert to the DPO, and access is reviewed every quarter.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 border-t pt-5" style={{ borderColor: 'color-mix(in srgb, var(--aiwo-stone) 18%, transparent)' }}>
            {[['7 yr', 'audit kept'], ['24 h', 'consent withdrawal honoured'], ['0', 'standing ops access']].map(([n, l]) => (
              <div key={l}>
                <p className="num text-[1.8rem] font-light leading-none">{n}</p>
                <p className="mt-1.5 text-[13px] opacity-75">{l}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <Eyebrow>Recent console reads · Arjun’s record</Eyebrow>
            <Eye size={16} className="text-ink-3" aria-hidden />
          </div>
          <ul className="space-y-3.5">
            {ACCESS_LOG.slice(0, 4).map((e) => (
              <li key={e.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
                <p className="num text-[12px] text-ink-3">{e.at}</p>
                <p className="text-[15px] text-ink">{e.who} <span className="text-ink-3">· {e.role}</span></p>
                <p className="text-[13px] text-ink-2">{e.what} — {e.purpose}</p>
              </li>
            ))}
          </ul>
          <AccessNote icon="shield" className="mt-5">This list is the same one Arjun sees under “Who has seen my data”.</AccessNote>
        </Card>
      </section>

      <AccessRequestSheet
        console={requesting}
        roleLabel={current.label}
        person={current.person}
        onClose={() => setRequesting(null)}
        onSent={(to, ref) => setRequested((r) => ({ ...r, [to]: ref }))}
      />
    </div>
  )
}
