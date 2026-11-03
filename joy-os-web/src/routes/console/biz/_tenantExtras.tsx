import clsx from 'clsx'
import { Check, Copy, KeyRound, Lock, Plus, Send, ShieldCheck, Stethoscope, Webhook as WebhookIcon } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AiwoMark } from '@/components/joy/Brand'
import { Eyebrow } from '@/components/joy/primitives'
import { Button, Card, Pill } from '@/components/ui'
import { termByKey } from '@/data/terms'
import type { TermKey } from '@/domain/types'
import {
  AGG_COHORTS, AGG_PERIODS, API_SCOPES, CLINICAL_FEATURES, CLINICAL_PARTNER, NEEDS_CITATION, REFUSED, TENANT_API, TENANT_BRANDING_KEY, TENANT_KIND, WEBHOOK_EVENTS,
  type AggCohortKey, type AggPeriod, type ApiKey, type ApiScope, type TenantKind, type Webhook, type WebhookEvent,
} from './_data'
import { CardHead, Field, Row, StatusTag, fieldCls, useStored } from './_parts'

// Tenant console extras (Architecture p.22, p.24, p.27): the brand line under the mark, clinical features shown as
// disabled without a licensed clinical partner, API credentials and signed webhooks, and the aggregate filters.
// Specimen only: nothing leaves the browser; keys and secrets are made up here and kept in localStorage.

const CONSOLE_DAY = '28 Jan 2027'

function randomHex(n: number) {
  try {
    const a = new Uint8Array(Math.ceil(n / 2))
    crypto.getRandomValues(a)
    return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('').slice(0, n)
  } catch {
    return Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  }
}

function copyText(v: string) {
  // writeText rejects when the page lacks focus or permission; the value stays visible to copy by hand.
  try { navigator.clipboard?.writeText(v).catch(() => undefined) } catch { /* clipboard unavailable */ }
}

/** Console clock: 21:10 on 28 Jan 2027, one minute per action, so delivery logs keep their order. */
function useClock() {
  const m = useRef(11)
  return () => {
    const t = 21 * 60 + m.current++
    return `${CONSOLE_DAY} ${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
  }
}

// ─── Brand line ──────────────────────────────────────────────────────────

const LINE_MAX = 48

export function brandKey(kind: TenantKind) {
  return kind === 'employer' ? TENANT_BRANDING_KEY : `${TENANT_BRANDING_KEY}:${TENANT_KIND[kind].tenantId}`
}

function lineError(v: string): string | null {
  const s = v.trim()
  if (!s) return null
  if (s.length > LINE_MAX) return `Keep it to ${LINE_MAX} characters; it is one line under the mark.`
  if (/https?:|www\.|\.(com|in|org|net)\b/i.test(s)) return 'A line of type only: no web addresses.'
  if (/\p{Extended_Pictographic}/u.test(s)) return 'Words only: no emoji or symbols in place of a logo.'
  const lower = s.toLowerCase()
  const refused = REFUSED.find((w) => lower.includes(w))
  if (refused) return `The claims gate refuses “${refused}”, here as everywhere in Joy OS.`
  const cite = NEEDS_CITATION.find((w) => lower.includes(w))
  if (cite) return `“${cite}” needs a citation, so it cannot sit under the mark.`
  return null
}

export function BrandLineCard({ kind }: { kind: TenantKind }) {
  const cfg = TENANT_KIND[kind]
  const [saved, setSaved] = useStored<{ tagline: string }>(brandKey(kind), { tagline: '' })
  const [draft, setDraft] = useState(saved.tagline ?? '')
  const [notice, setNotice] = useState<string | null>(null)
  const id = useId()
  const err = lineError(draft)
  const dirty = draft.trim() !== (saved.tagline ?? '')
  const shown = draft.trim()
  const live = kind === 'employer'

  const save = () => {
    if (err) return
    setSaved({ tagline: draft.trim() })
    setDraft(draft.trim())
    setNotice(draft.trim() ? (live ? 'Saved. Members see the line under the Joy OS mark on their next screen. Logged to the audit trail.' : 'Saved. Policyholders see it once Star Health routes go live at J3. Logged to the audit trail.') : 'Line removed. Members see the Joy OS mark alone.')
  }
  const remove = () => {
    setSaved({ tagline: '' })
    setDraft('')
    setNotice('Line removed. Members see the Joy OS mark alone.')
  }

  return (
    <Card className="lg:col-span-7">
      <CardHead
        eyebrow="Brand line"
        title="A line of type under the mark, never your logo"
        aside={saved.tagline ? <StatusTag tone="ok">{live ? 'Live in the member app' : 'Saved · shows from J3'}</StatusTag> : <StatusTag tone="off">No line set</StatusTag>}
        lead={`Joy OS is an AIWO house: tenants get one line of type under the mark and no logo upload. It passes the same claims gate as every other word in the product.`}
      />
      <Field label="Line" htmlFor={id} error={err} hint={`${shown.length}/${LINE_MAX} characters. Leave it empty for no line.`}>
        <input id={id} className={fieldCls} value={draft} maxLength={LINE_MAX + 12} placeholder={kind === 'employer' ? 'e.g. Offered to Northwind people, free' : 'e.g. Included with your Star Health policy'} onChange={(e) => { setDraft(e.target.value); setNotice(null) }} aria-invalid={!!err} aria-describedby={err ? `${id}-err` : undefined} />
      </Field>

      <div className="mt-5 rounded-card border border-line bg-paper p-5">
        <Eyebrow>Preview · member app header</Eyebrow>
        <div className="mt-4 inline-flex flex-col gap-1">
          <span className="inline-flex items-center gap-3"><AiwoMark /><span className="house text-ink-2">Joy OS</span></span>
          {shown && !err ? <span className="text-[13px] text-ink-2">{shown}</span> : <span className="text-[13px] text-ink-3">{err ? 'Fix the line to preview it.' : 'No line: the mark stands alone.'}</span>}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button variant="ink" onClick={save} disabled={!!err || !dirty}>Save line</Button>
        {saved.tagline && <Button variant="ghost" onClick={remove}>Remove line</Button>}
        {live && <Link to="/app" className="ml-auto text-[14px] text-ink-2 underline decoration-line-strong underline-offset-2 hover:text-ink focus-ring rounded">See it in the member app</Link>}
      </div>
      <p className="mt-3 text-[14px] text-ink" aria-live="polite">{notice && <><Check size={15} className="mr-1 inline" aria-hidden />{notice}</>}</p>
      {!live && <p className="mt-1 text-[13px] text-ink-3">Star Health tenant routes are off until J3 (release flag tenant_star_health), so the line is held for {cfg.short} until then.</p>}
    </Card>
  )
}

// ─── Clinical features ───────────────────────────────────────────────────

export function ClinicalFeaturesCard({ kind }: { kind: TenantKind }) {
  const cp = CLINICAL_PARTNER[kind]
  return (
    <Card className="lg:col-span-5">
      <CardHead eyebrow="Clinical features" title={cp.partner ? 'On, with a licensed clinical partner' : 'Off: no licensed clinical partner'} aside={<Pill><Lock size={12} aria-hidden /> Read-only</Pill>} />
      <dl>
        <Row k="Licensed clinical partner" v={cp.partner ?? <span className="text-ink-2">None for this tenant</span>} />
      </dl>
      <p className="mt-3 text-[14px] text-ink-2">{cp.note}</p>
      <ul className="mt-4 divide-y divide-line border-t border-line">
        {CLINICAL_FEATURES.map((f) => (
          <li key={f.key} className="flex flex-col gap-1.5 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[15px] text-ink"><Stethoscope size={14} className="shrink-0 text-ink-3" aria-hidden />{f.label}</p>
              <p className="text-[13px] text-ink-3">{f.note}</p>
            </div>
            <StatusTag tone={cp.partner ? 'ok' : 'off'} className="self-start">{cp.partner ? 'On' : 'Disabled · no licensed partner'}</StatusTag>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-card bg-paper-sunk p-4 text-[14px] text-ink-2">
        <p className="flex items-center gap-2 font-medium text-ink"><ShieldCheck size={15} aria-hidden /> Never switched off</p>
        <p className="mt-1">Safety routing is not a clinical feature. Every member, in every tenant, gets the crisis screen with Tele-MANAS 14416 and a named on-call person within minutes.</p>
      </div>
    </Card>
  )
}

// ─── API keys and webhooks ───────────────────────────────────────────────

type Reveal = { kind: 'key' | 'hook'; id: string; secret: string }

export function ApiAccessCard({ kind }: { kind: TenantKind }) {
  const cfg = TENANT_KIND[kind]
  const short = cfg.tenantId.replace('tnt_', '').slice(0, 2)
  const [store, setStore] = useStored<{ keys: ApiKey[]; hooks: Webhook[] }>(`joyos:tenant:api:${cfg.tenantId}`, () => TENANT_API[kind])
  const [creating, setCreating] = useState<'key' | 'hook' | null>(null)
  const [reveal, setReveal] = useState<Reveal | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const clock = useClock()

  const addKey = (k: Omit<ApiKey, 'id' | 'created' | 'lastUsed'>) => {
    const id = `cli_${short}_${k.env === 'production' ? 'prod' : 'sbx'}_${randomHex(4)}`
    setStore((s) => ({ ...s, keys: [{ ...k, id, created: CONSOLE_DAY, lastUsed: null }, ...s.keys] }))
    setReveal({ kind: 'key', id, secret: `sk_${k.env === 'production' ? 'prod' : 'sbx'}_specimen_${randomHex(32)}` })
    setCreating(null)
    setNotice(null)
  }
  const addHook = (h: { url: string; events: WebhookEvent[] }) => {
    const id = `wh_${short}_${randomHex(4)}`
    setStore((s) => ({ ...s, hooks: [{ id, url: h.url, events: h.events, created: CONSOLE_DAY, status: 'active', deliveries: [] }, ...s.hooks] }))
    setReveal({ kind: 'hook', id, secret: `whsec_specimen_${randomHex(32)}` })
    setCreating(null)
    setNotice(null)
  }
  const revokeKey = (id: string) => {
    setStore((s) => ({ ...s, keys: s.keys.map((k) => (k.id === id ? { ...k, revoked: CONSOLE_DAY } : k)) }))
    setConfirming(null)
    if (reveal?.id === id) setReveal(null)
    setNotice(`${id} revoked. Tokens it issued stop working within a minute. Logged to the audit trail.`)
  }
  const revokeHook = (id: string) => {
    setStore((s) => ({ ...s, hooks: s.hooks.map((h) => (h.id === id ? { ...h, status: 'revoked' } : h)) }))
    setConfirming(null)
    if (reveal?.id === id) setReveal(null)
    setNotice(`${id} revoked. No further events are sent to it.`)
  }
  const sendTest = (h: Webhook) => {
    setTesting(h.id)
    window.setTimeout(() => {
      const event = h.events[0]
      setStore((s) => ({ ...s, hooks: s.hooks.map((x) => (x.id === h.id ? { ...x, deliveries: [{ at: clock(), event, code: 200, ms: 140 + Math.floor(Math.random() * 160) }, ...x.deliveries].slice(0, 5) } : x)) }))
      setTesting(null)
    }, 800)
  }

  const liveKeys = store.keys.filter((k) => !k.revoked).length
  return (
    <Card className="lg:col-span-12">
      <CardHead
        eyebrow="API keys and webhooks · partner API"
        title="Client credentials with per-tenant scopes; signed webhooks"
        aside={<><Pill>{liveKeys} active key{liveKeys === 1 ? '' : 's'}</Pill><StatusTag tone="draft">Specimen secrets</StatusTag></>}
        lead="OIDC client credentials for the partner API, scoped to this tenant. There are no member-level endpoints: every read is an aggregate of the tenant’s threshold or more. Test anything in the sandbox first."
      />
      <dl className="mb-6 grid gap-x-8 sm:grid-cols-2">
        <Row k="Token endpoint" v={<code className="font-mono text-[13px]">POST joy.aiwo.com/oauth2/token</code>} />
        <Row k="Sandbox base URL" v={<code className="font-mono text-[13px]">sandbox.joy.aiwo.com/partner/v1</code>} />
      </dl>

      {reveal && (
        <div className="mb-6 rounded-card border border-ink p-4" role="status">
          <p className="flex items-center gap-2 text-[15px] text-ink"><KeyRound size={15} aria-hidden /> {reveal.kind === 'key' ? 'Client secret' : 'Signing secret'} for <code className="font-mono">{reveal.id}</code></p>
          <p className="mt-1 text-[14px] text-ink-2">Shown once. Put it in your secrets manager now; AIWO keeps only a hash and cannot show it again.</p>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-paper-sunk pl-3 pr-1">
            <code className="num min-w-0 flex-1 truncate py-2.5 text-[13px] text-ink">{reveal.secret}</code>
            <Button variant="ghost" size="sm" onClick={() => { copyText(reveal.secret); setCopied(true); window.setTimeout(() => setCopied(false), 1400) }} aria-label="Copy secret">{copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}</Button>
          </div>
          <span className="sr-only" aria-live="polite">{copied ? 'Secret copied' : ''}</span>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => setReveal(null)}>I have stored it</Button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2 [&>*]:min-w-0">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow>API keys</Eyebrow>
            {creating !== 'key' && <Button variant="ghost" size="sm" onClick={() => { setCreating('key'); setNotice(null) }}><Plus size={14} aria-hidden /> Create a key</Button>}
          </div>
          {creating === 'key' && <NewKeyForm kind={kind} onCreate={addKey} onCancel={() => setCreating(null)} />}
          <ul className="mt-3 divide-y divide-line">
            {store.keys.map((k) => (
              <li key={k.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={clsx('text-[15px]', k.revoked ? 'text-ink-3' : 'text-ink')}>{k.name}</p>
                    <p className="text-[13px] text-ink-3"><code className="font-mono">{k.id}</code> · created {k.created} · {k.revoked ? `revoked ${k.revoked}` : k.lastUsed ? `last used ${k.lastUsed}` : 'not used yet'}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">{k.scopes.map((s) => <code key={s} className="rounded-full bg-paper-sunk px-2 py-0.5 font-mono text-[12px] text-ink-2">{s}</code>)}</div>
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    <StatusTag tone={k.revoked ? 'off' : k.env === 'production' ? 'ok' : 'info'}>{k.revoked ? 'Revoked' : k.env === 'production' ? 'Production' : 'Sandbox'}</StatusTag>
                    {!k.revoked && confirming !== k.id && <Button variant="ghost" size="sm" onClick={() => setConfirming(k.id)} aria-label={`Revoke ${k.name}`}>Revoke</Button>}
                  </span>
                </div>
                {confirming === k.id && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-card bg-paper-sunk px-3 py-2.5">
                    <p className="text-[14px] text-ink">Revoke {k.name}? Anything using it stops at once.</p>
                    <span className="flex gap-2">
                      <Button variant="ink" size="sm" onClick={() => revokeKey(k.id)}>Revoke</Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>Keep</Button>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow>Webhook endpoints</Eyebrow>
            {creating !== 'hook' && <Button variant="ghost" size="sm" onClick={() => { setCreating('hook'); setNotice(null) }}><Plus size={14} aria-hidden /> Add an endpoint</Button>}
          </div>
          {creating === 'hook' && <NewHookForm onAdd={addHook} onCancel={() => setCreating(null)} />}
          {store.hooks.length === 0 && creating !== 'hook' && <p className="mt-3 text-[14px] text-ink-2">No endpoints yet. Add one to hear when an aggregate is published.</p>}
          <ul className="mt-3 divide-y divide-line">
            {store.hooks.map((h) => (
              <li key={h.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className={clsx('break-all font-mono text-[13px]', h.status === 'revoked' ? 'text-ink-3' : 'text-ink')}>{h.url}</p>
                    <p className="text-[13px] text-ink-3"><code className="font-mono">{h.id}</code> · created {h.created} · signed with HMAC-SHA256 in <code className="font-mono">Joy-Signature</code></p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">{h.events.map((e) => <code key={e} className="rounded-full bg-paper-sunk px-2 py-0.5 font-mono text-[12px] text-ink-2">{e}</code>)}</div>
                  </div>
                  <StatusTag tone={h.status === 'active' ? 'ok' : 'off'} className="shrink-0">{h.status === 'active' ? 'Active' : 'Revoked'}</StatusTag>
                </div>
                {h.deliveries.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[13px] text-ink-2" aria-label={`Recent deliveries to ${h.id}`}>
                    {h.deliveries.slice(0, 3).map((d, i) => <li key={i} className="num">{d.at} · {d.event} · {d.code} · {d.ms} ms</li>)}
                  </ul>
                )}
                {h.status === 'active' && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => sendTest(h)} disabled={testing === h.id}><Send size={14} aria-hidden /> {testing === h.id ? 'Sending…' : `Send a test ${h.events[0]}`}</Button>
                    {confirming !== h.id && <Button variant="ghost" size="sm" onClick={() => setConfirming(h.id)} aria-label={`Revoke ${h.url}`}>Revoke</Button>}
                  </div>
                )}
                {confirming === h.id && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-card bg-paper-sunk px-3 py-2.5">
                    <p className="text-[14px] text-ink">Stop sending events to this endpoint?</p>
                    <span className="flex gap-2">
                      <Button variant="ink" size="sm" onClick={() => revokeHook(h.id)}>Revoke</Button>
                      <Button variant="ghost" size="sm" onClick={() => setConfirming(null)}>Keep</Button>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-[13px] text-ink-2">
            {WEBHOOK_EVENTS.map((e) => <li key={e.key}><code className="font-mono text-ink">{e.key}</code> · {e.note}</li>)}
          </ul>
        </div>
      </div>
      <p className="mt-4 text-[14px] text-ink" aria-live="polite">{notice && <><Check size={15} className="mr-1 inline" aria-hidden />{notice}</>}</p>
    </Card>
  )
}

function NewKeyForm({ kind, onCreate, onCancel }: { kind: TenantKind; onCreate: (k: Omit<ApiKey, 'id' | 'created' | 'lastUsed'>) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [env, setEnv] = useState<ApiKey['env']>('sandbox')
  const [scopes, setScopes] = useState<ApiScope[]>(['aggregates:read'])
  const [code, setCode] = useState('')
  const [errs, setErrs] = useState<{ name?: string; scopes?: string; code?: string }>({})
  const base = `${kind}-newkey`
  const submit = () => {
    const e: typeof errs = {}
    if (name.trim().length < 3) e.name = 'Name the system that will use it, so it can be found later.'
    if (scopes.length === 0) e.scopes = 'Choose at least one scope.'
    if (env === 'production' && !/^\d{6}$/.test(code)) e.code = 'A production key needs the six digits from your authenticator app.'
    setErrs(e)
    if (Object.keys(e).length) return
    onCreate({ name: name.trim(), env, scopes })
  }
  return (
    <div className="mt-3 space-y-4 rounded-card bg-paper-sunk p-4">
      <Field label="Name" htmlFor={`${base}-name`} error={errs.name}>
        <input id={`${base}-name`} className={fieldCls} value={name} onChange={(e) => { setName(e.target.value); setErrs((x) => ({ ...x, name: undefined })) }} placeholder="e.g. HRIS eligibility sync" aria-invalid={!!errs.name} aria-describedby={errs.name ? `${base}-name-err` : undefined} />
      </Field>
      <Field label="Environment" htmlFor={`${base}-env`}>
        <select id={`${base}-env`} className={fieldCls} value={env} onChange={(e) => setEnv(e.target.value as ApiKey['env'])}>
          <option value="sandbox">Sandbox · synthetic data only</option>
          <option value="production">Production</option>
        </select>
      </Field>
      <fieldset>
        <legend className="eyebrow mb-1.5 block text-ink-3">Scopes</legend>
        <ul className="space-y-2">
          {API_SCOPES.map((s) => (
            <li key={s.key}>
              <label className="flex cursor-pointer items-start gap-2.5 text-[14px]">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--ink)]" checked={scopes.includes(s.key)} onChange={(e) => { setScopes((xs) => (e.target.checked ? [...xs, s.key] : xs.filter((x) => x !== s.key))); setErrs((x) => ({ ...x, scopes: undefined })) }} />
                <span><code className="font-mono text-ink">{s.key}</code> <span className="text-ink-3">· {s.label}</span><span className="block text-ink-2">{s.note}</span></span>
              </label>
            </li>
          ))}
        </ul>
        {errs.scopes && <p className="mt-1.5 text-[13px] text-error" role="alert">{errs.scopes}</p>}
      </fieldset>
      {env === 'production' && (
        <Field label="Step-up · six-digit code" htmlFor={`${base}-code`} error={errs.code} className="w-48">
          <input id={`${base}-code`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} className={clsx(fieldCls, 'num tracking-[0.3em]')} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setErrs((x) => ({ ...x, code: undefined })) }} aria-invalid={!!errs.code} aria-describedby={errs.code ? `${base}-code-err` : undefined} />
        </Field>
      )}
      <div className="flex flex-wrap gap-2">
        <Button variant="ink" size="sm" onClick={submit}><KeyRound size={14} aria-hidden /> Create key</Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

function NewHookForm({ onAdd, onCancel }: { onAdd: (h: { url: string; events: WebhookEvent[] }) => void; onCancel: () => void }) {
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<WebhookEvent[]>(['aggregate.published'])
  const [errs, setErrs] = useState<{ url?: string; events?: string }>({})
  const id = useId()
  const submit = () => {
    const e: typeof errs = {}
    const v = url.trim()
    if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(v)) e.url = 'Use a public https:// address.'
    else if (/localhost|127\.0\.0\.1|\.local\b/i.test(v)) e.url = 'Webhooks go to a public https:// address, never a local one.'
    if (events.length === 0) e.events = 'Choose at least one event.'
    setErrs(e)
    if (Object.keys(e).length) return
    onAdd({ url: v, events })
  }
  return (
    <div className="mt-3 space-y-4 rounded-card bg-paper-sunk p-4">
      <Field label="Endpoint URL" htmlFor={`${id}-url`} error={errs.url}>
        <input id={`${id}-url`} className={clsx(fieldCls, 'font-mono text-[14px]')} value={url} onChange={(e) => { setUrl(e.target.value); setErrs((x) => ({ ...x, url: undefined })) }} placeholder="https://hooks.example.in/joyos" aria-invalid={!!errs.url} aria-describedby={errs.url ? `${id}-url-err` : undefined} />
      </Field>
      <fieldset>
        <legend className="eyebrow mb-1.5 block text-ink-3">Events</legend>
        <ul className="space-y-2">
          {WEBHOOK_EVENTS.map((ev) => (
            <li key={ev.key}>
              <label className="flex cursor-pointer items-start gap-2.5 text-[14px]">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--ink)]" checked={events.includes(ev.key)} onChange={(e) => { setEvents((xs) => (e.target.checked ? [...xs, ev.key] : xs.filter((x) => x !== ev.key))); setErrs((x) => ({ ...x, events: undefined })) }} />
                <span><code className="font-mono text-ink">{ev.key}</code><span className="block text-ink-2">{ev.note}</span></span>
              </label>
            </li>
          ))}
        </ul>
        {errs.events && <p className="mt-1.5 text-[13px] text-error" role="alert">{errs.events}</p>}
      </fieldset>
      <div className="flex flex-wrap gap-2">
        <Button variant="ink" size="sm" onClick={submit}><WebhookIcon size={14} aria-hidden /> Add endpoint</Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

// ─── Aggregate filters ───────────────────────────────────────────────────

export type AggTermFilter = 'all' | TermKey
export const AGG_TERMS: AggTermFilter[] = ['all', 'H', 'P', 'R', 'F', 'D', 'B']

/**
 * Cohort, term and period filters, mirrored as the partner API query. The employer's wave cohorts and threshold of
 * fifty are the default; the insurer view passes its policy-type cohorts, its own periods and its threshold of ten.
 */
export function AggregateFilters<C extends string = AggCohortKey>({ cohort, term, period, onCohort, onTerm, onPeriod, cohorts, periods = AGG_PERIODS, minGroup = 50 }: {
  cohort: C
  term: AggTermFilter
  period: AggPeriod
  onCohort: (v: C) => void
  onTerm: (v: AggTermFilter) => void
  onPeriod: (v: AggPeriod) => void
  cohorts?: { value: C; label: string; enrolled: number }[]
  periods?: { value: AggPeriod; label: string }[]
  minGroup?: number
}) {
  const options = cohorts ?? (AGG_COHORTS as unknown as { value: C; label: string; enrolled: number }[])
  const id = useId()
  const [copied, setCopied] = useState(false)
  const query = `GET /partner/v1/aggregates?cohort=${cohort}&term=${term === 'all' ? 'all' : term}&period=${period}`
  return (
    <Card tone="sunk" className="lg:col-span-12">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Cohort" htmlFor={`${id}-c`}>
          <select id={`${id}-c`} className={fieldCls} value={cohort} onChange={(e) => onCohort(e.target.value as C)}>
            {options.map((c) => <option key={c.value} value={c.value}>{c.label}{c.enrolled < minGroup ? ` · under ${minGroup}` : ''}</option>)}
          </select>
        </Field>
        <Field label="Term" htmlFor={`${id}-t`}>
          <select id={`${id}-t`} className={fieldCls} value={term} onChange={(e) => onTerm(e.target.value as AggTermFilter)}>
            {AGG_TERMS.map((t) => <option key={t} value={t}>{t === 'all' ? 'Index and all six terms' : termByKey(t).name === termByKey(t).space ? termByKey(t).name : `${termByKey(t).name} · ${termByKey(t).space}`}</option>)}
          </select>
        </Field>
        <Field label="Period" htmlFor={`${id}-p`}>
          <select id={`${id}-p`} className={fieldCls} value={period} onChange={(e) => onPeriod(e.target.value as AggPeriod)}>
            {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-ink-3">
        <span>Same query on the partner API:</span>
        <code className="num min-w-0 break-all text-ink-2">{query}</code>
        <Button variant="ghost" size="sm" onClick={() => { copyText(query); setCopied(true); window.setTimeout(() => setCopied(false), 1400) }} aria-label="Copy the API query">{copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}</Button>
        <span className="sr-only" aria-live="polite">{copied ? 'Query copied' : ''}</span>
      </div>
    </Card>
  )
}
