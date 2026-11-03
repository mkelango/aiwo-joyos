import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { ArrowLink, Body, Button, Divider, Eyebrow, Icon, Meta, Mono, Pill, Segmented, SpecimenTag, TermChip, Toggle, fmtDate } from '@/components'
import { useDict } from '@/lib/i18n'
import { BarRow, Chip, Sparkline, TextField } from '@/screens/a/parts'
import { BIOMARKERS, CAPACITY, CAPACITY_AT, LE8, LE8_SERIES, PANEL_META, SIGNALS, SPACE_TODAY, type Le8Key, type Le8Status, type Marker } from '@/screens/a/spacesData'
import { DEVICES as LINKABLE } from '@/screens/b/accountData'
import { devicesStore, useStore } from '@/screens/b/bStore'
import { DEV, DEVICE_NOTE, SIGNAL_TEXT } from '@/screens/b/i18n/devices'
import type { L3 } from '@/screens/b/i18n/common'
import { useTheme } from '@/theme/ThemeProvider'
import { useIsMinor } from '@/lib/minor'
import { Rich, useA } from '../i18n'
import { H3, useLocal } from '../local'
import { VivaExchange, useVivaRun } from '../vivaParts'
import { ToolCard, ToolsHeading, shortDate } from './common'

// BODY: device status, signal trends, Life's Essential 8, the biomarker vault, the protocol and
// AIWO Daily stack (protocol-only, physician-signed), the capacity battery, and biological age
// only after physician sign-off (Memo p.19).
// Devices read the same record /devices writes (Lane B devicesStore), so a link or unlink there
// shows here at once. LE8 readings and capacity results the member adds are kept on the phone.
// VIVA's explain_biomarker runs inside the vault: open a marker, ask, and read the plain words.

export function BodyTools() {
  const { t } = useA()
  return (
    <>
      <ToolsHeading>{t('Body tools')}</ToolsHeading>
      <Devices />
      <Signals />
      <Le8 />
      <Vault />
      <DailyStack />
      <Capacity />
      <BiologicalAge />
    </>
  )
}

/** The member's devices: the specimen list with whatever /devices has connected or disconnected. */
function useLinked() {
  const [stored] = useStore(devicesStore)
  return LINKABLE.map((d) => (stored.states[d.id] ? { ...d, ...stored.states[d.id] } : d))
}

function Devices() {
  const { c, space } = useTheme()
  const { t, lang } = useA()
  const dv = useDict(DEV)
  const l3 = (r: L3 | undefined, fallback: string) => (lang === 'en' || !r ? fallback : (r[lang] ?? fallback))
  const all = useLinked()
  const linked = all.filter((d) => d.state === 'connected')
  const unlinked = all.filter((d) => d.state !== 'connected')
  // Same wording as /devices: "Just now" after a sync or a new link, the specimen time otherwise.
  const lastSync = (d: (typeof all)[number]) => (d.lastSync === 'Just now' ? dv('justNow') : d.lastSync && DEVICE_NOTE[d.id]?.lastSync?.en === d.lastSync ? l3(DEVICE_NOTE[d.id]?.lastSync, d.lastSync) : (d.lastSync ?? ''))
  return (
    <ToolCard title={t('Devices')} lead={t('Signals are features, never a vendor’s score. Each device reads only what you allowed.')}>
      <View style={{ gap: space.s1 }}>
        {linked.length === 0 ? <Meta tone="ink">{t('No device is linked. Signals pause until you link one.')}</Meta> : null}
        {linked.map((d, i) => {
          const via = l3(DEVICE_NOTE[d.id]?.via, d.via)
          const reads = d.signals.map((x) => l3(SIGNAL_TEXT[x], x)).join(', ')
          const last = `${dv('lastSync')}${lastSync(d)}${d.freshness === 'stale' ? ` · ${dv('stale')}` : ''}`
          return (
            <View key={d.id}>
              {i > 0 ? <Divider style={{ marginBottom: space.s1 }} /> : null}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }} accessible accessibilityLabel={t('{name} {via}, {status}. {last}. Reads {reads}.', { name: d.name, via, status: t('connected'), last, reads })}>
                <Icon name="check-circle" size={18} color={c.ink} />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Body weight="medium">{d.name}</Body>
                    <Meta size={14} tone="ink3">
                      {via}
                    </Meta>
                  </View>
                  <Meta size={14}>{reads}</Meta>
                  <Meta size={14} tone="ink3">
                    {last}
                  </Meta>
                </View>
                <Pill tone="ink">{t('Connected')}</Pill>
              </View>
            </View>
          )
        })}
        {unlinked.length ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderTopWidth: linked.length ? 1 : 0, borderTopColor: c.line, paddingTop: linked.length ? space.s1 : 0 }}>
            <Icon name="circle" size={18} color={c.ink3} />
            <Meta size={14} style={{ flex: 1 }}>
              {t('Not linked: {list}', { list: unlinked.map((d) => d.name).join(', ') })}
            </Meta>
          </View>
        ) : null}
      </View>
      <ArrowLink icon="watch" onPress={() => router.push('/devices')}>
        {t('Manage devices')}
      </ArrowLink>
    </ToolCard>
  )
}

function Signals() {
  const { c, term, space } = useTheme()
  const { t, date } = useA()
  const ouraLinked = useLinked().some((d) => d.id === 'oura' && d.state === 'connected')
  const col = term('H').main
  const first = SIGNALS[0]
  const last = SIGNALS[SIGNALS.length - 1]
  const avg = (k: 'hrv' | 'rhr' | 'regularity', from: number, to: number) => {
    const xs = SIGNALS.slice(from, to).map((s) => s[k])
    return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10
  }
  const rows = [
    { k: 'hrv' as const, name: t('Heart-rate variability'), unit: 'ms', better: 'higher', sentence: t('Overnight HRV, higher is usually more rested. Dips fall on Saturdays, after late dinners.') },
    { k: 'rhr' as const, name: t('Resting heart rate'), unit: 'bpm', better: 'lower', sentence: t('Lowest overnight heart rate. A slow drift down over the month.') },
    { k: 'regularity' as const, name: t('Sleep regularity'), unit: '/100', better: 'higher', sentence: t('How alike your bed and wake times are. It slipped in the last week, with late Sundays.') },
  ]
  return (
    <ToolCard title={t('Signal trends · 28 days')} aside={<TermChip term="H" />} lead={t('Three features from your ring, one line each. Features, never a vendor score.')}>
      <View style={{ gap: space.s3 }}>
        {rows.map((r) => {
          const a = avg(r.k, 0, 7)
          const b = avg(r.k, 21, 28)
          const d = Math.round((b - a) * 10) / 10
          return (
            <View key={r.k} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <Body weight="medium" style={{ flex: 1 }}>
                  {r.name}
                </Body>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Mono tone="ink" size={20} weight="light">
                    {String(last[r.k])}
                  </Mono>
                  <Mono tone="ink3" size={12}>
                    {r.unit}
                  </Mono>
                </View>
              </View>
              <Meta size={14}>{r.sentence}</Meta>
              <Sparkline
                values={SIGNALS.map((s) => s[r.k])}
                labels={[date(first.label), date(last.label)]}
                color={col}
                height={64}
                label={t('{name}, 28 days from {from} to {to}: first-week average {a} {unit}, last-week average {b} {unit}.', { name: r.name, from: date(first.label), to: date(last.label), a, b, unit: r.unit })}
              />
              <Meta size={13} tone="ink3">
                <Rich
                  text={t('Week 1 average *{a}* · last week *{b}* · {change}', { a: String(a), b: String(b), change: d === 0 ? t('held') : t(d > 0 ? 'up {n} {unit}' : 'down {n} {unit}', { n: Math.abs(d), unit: r.unit }) })}
                  wrap={(w) => <Mono size={13} tone="ink2">{w}</Mono>}
                />
              </Meta>
            </View>
          )
        })}
      </View>
      {ouraLinked ? null : (
        <Meta tone="ink" accessibilityLiveRegion="polite">
          {t('Your Oura Ring is not linked now. These are the last 28 days it sent; new nights wait until you link it again.')}
        </Meta>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="info" size={14} color={c.ink3} />
        <Eyebrow size={11} style={{ flex: 1 }}>
          {t('Oura Ring Gen 4 via Terra · features, never a vendor score')}
        </Eyebrow>
      </View>
    </ToolCard>
  )
}

// ─── Life's Essential 8: scored by the AHA 2022 method, one reading at a time ───

type Point = { at: string; v: number; v2?: number }
/** A reading the member added on this phone. */
type MyPoint = Point & { id: string }
type Shown = Point & { mine: boolean; id?: string }

/** Nicotine answers, scored 100 / 75 / 50 / 25 / 0. */
const NICOTINE = ['Never', 'Quit 5 or more years ago', 'Quit 1 to 5 years ago', 'Quit within the last year', 'Using now'] as const

const LE8_IDEAL: Record<Le8Key, string> = {
  diet: 'Ideal is a MEPA score of 15–16: vegetables, fruit, whole grains, nuts, fish; little sugar and fried food.',
  activity: 'Ideal is 150 minutes or more of moderate activity a week.',
  nicotine: 'Ideal is never having used, or having quit more than five years ago.',
  sleep: 'Ideal is 7 to 9 hours a night, on a regular schedule.',
  bmi: 'Ideal is 18.5–25. In South Asian adults your physician may use a lower line.',
  lipids: 'Ideal is non-HDL cholesterol under 130 mg/dL.',
  glucose: 'Ideal is HbA1c under 5.7% without diabetes.',
  bp: 'Ideal is under 120 / 80 mmHg.',
}

/** AHA Life's Essential 8 (2022) points for one reading, 0–100. */
export function le8Score(k: Le8Key, v: number, v2 = 0): number {
  switch (k) {
    case 'diet':
      return v >= 15 ? 100 : v >= 12 ? 80 : v >= 8 ? 50 : v >= 4 ? 25 : 0
    case 'activity':
      return v >= 150 ? 100 : v >= 120 ? 90 : v >= 90 ? 80 : v >= 60 ? 60 : v >= 30 ? 40 : v >= 1 ? 20 : 0
    case 'nicotine':
      return [100, 75, 50, 25, 0][v] ?? 0
    case 'sleep':
      return v >= 7 && v < 9 ? 100 : v >= 9 && v < 10 ? 90 : v >= 6 && v < 7 ? 70 : (v >= 5 && v < 6) || v >= 10 ? 40 : v >= 4 ? 20 : 0
    case 'bmi':
      return v < 25 ? 100 : v < 30 ? 70 : v < 35 ? 30 : v < 40 ? 15 : 0
    case 'lipids':
      return v < 130 ? 100 : v < 160 ? 60 : v < 190 ? 40 : v < 220 ? 20 : 0
    case 'glucose':
      return v < 5.7 ? 100 : v < 6.5 ? 60 : v < 7 ? 40 : v < 8 ? 30 : v < 9 ? 20 : v < 10 ? 10 : 0
    case 'bp':
      return v >= 160 || v2 >= 100 ? 0 : v >= 140 || v2 >= 90 ? 25 : v >= 130 || v2 >= 80 ? 50 : v >= 120 ? 75 : 100
  }
}

const le8Status = (score: number): Le8Status => (score >= 90 ? 'ideal' : score >= 70 ? 'good' : 'watch')

/** "12,5" and " 6.5 " both read as numbers; anything else is null. */
const toNum = (s: string) => {
  const x = s.trim().replace(',', '.')
  if (!x) return null
  const n = Number(x)
  return Number.isFinite(n) ? n : null
}
const round = (n: number, dp: number) => Math.round(n * 10 ** dp) / 10 ** dp

/** Specimen readings then the member's own, oldest first; a reading of the member's replaces one of theirs from the same day. */
function series<T extends Point>(base: readonly Point[], mine: T[] | undefined): Shown[] {
  return [...base.map((p) => ({ ...p, mine: false })), ...(mine ?? []).map((p) => ({ ...p, mine: true }))].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
}

function Le8() {
  const { c, term } = useTheme()
  const { t, tx, lang } = useA()
  // Under 18 nothing is scored (the minors gate): the readings are kept, with no score or average.
  const minor = useIsMinor()
  const [mine, setMine] = useLocal<Partial<Record<Le8Key, MyPoint[]>>>('le8Readings', {})
  const [open, setOpen] = useState<Le8Key | null>(null)
  const rows = LE8.map((x) => {
    const pts = series(LE8_SERIES[x.key], mine[x.key])
    const last = pts[pts.length - 1]
    const score = le8Score(x.key, last.v, last.v2)
    return { ...x, pts, last, score, status: le8Status(score) }
  })
  const total = Math.round(rows.reduce((a, b) => a + b.score, 0) / rows.length)
  const watch = rows.filter((x) => x.status === 'watch').map((x) => (lang === 'en' ? x.name.toLowerCase() : tx(x.name)))
  const col = term('H')
  const save = (k: Le8Key, p: Point) =>
    setMine((all) => ({ ...all, [k]: [...(all[k] ?? []).filter((y) => y.at !== p.at), { ...p, id: `le8-${k}-${Date.now()}` }] }))
  const remove = (k: Le8Key, id: string) => setMine((all) => ({ ...all, [k]: (all[k] ?? []).filter((y) => y.id !== id) }))
  return (
    <ToolCard
      title="Life’s Essential 8"
      aside={minor ? undefined : <Mono tone="ink">{`${total} / 100`}</Mono>}
      lead={
        minor
          ? t('Eight readings the heart cares about. They are kept as you log them; nothing is scored while you are under 18.')
          : watch.length
          ? t('Eight readings the heart cares about, each scored 0 to 100. Your average is {n}; {watch} are worth watching.', { n: total, watch: watch.join(t(' and ')) })
          : t('Eight readings the heart cares about, each scored 0 to 100. Your average is {n}; none is worth watching just now.', { n: total })
      }
    >
      <View style={{ gap: 14 }}>
        {rows.map((x) => {
          const isOpen = open === x.key
          return (
            <View key={x.key} style={{ gap: 4 }}>
              {minor ? (
                <View style={{ gap: 2 }}>
                  <Body>{tx(x.name)}</Body>
                  <Meta size={14}>{`${le8Reading(x.key, x.last, t)} · ${x.last.mine ? t('Entered by you') : lang === 'en' ? x.source : tx(x.source)}`}</Meta>
                </View>
              ) : (
                <BarRow
                  label={tx(x.name)}
                  value={x.score}
                  max={100}
                  color={x.status === 'watch' ? c.lineStrong : col.main}
                  note={`${le8Reading(x.key, x.last, t)} · ${x.last.mine ? t('Entered by you') : lang === 'en' ? x.source : tx(x.source)}${x.status === 'watch' ? t(' · worth watching') : x.status === 'ideal' ? t(' · ideal') : ''}`}
                />
              )}
              <Pressable
                onPress={() => setOpen(isOpen ? null : x.key)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                aria-expanded={isOpen}
                accessibilityLabel={isOpen ? t('Hide readings for {name}', { name: tx(x.name) }) : t('Add a reading for {name}', { name: tx(x.name) })}
                style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}
              >
                <Meta size={14} tone="ink2" style={{ textDecorationLine: 'underline', textDecorationColor: c.lineStrong }}>
                  {isOpen ? t('Hide') : t('New reading and history')}
                </Meta>
              </Pressable>
              {isOpen ? <Le8Detail k={x.key} name={tx(x.name)} pts={x.pts} onSave={(p) => save(x.key, p)} onRemove={(id) => remove(x.key, id)} /> : null}
            </View>
          )
        })}
      </View>
      <Meta size={14} tone="ink3">
        {t('American Heart Association · Life’s Essential 8 · self-report with device and clinic readings')}
      </Meta>
    </ToolCard>
  )
}

type T = ReturnType<typeof useA>['t']

/** One reading in words, in the member's language; digits stay Latin. */
function le8Reading(k: Le8Key, p: Point, t: T) {
  switch (k) {
    case 'diet':
      return t('MEPA {n} of 16', { n: p.v })
    case 'activity':
      return t('{n} min / week', { n: p.v })
    case 'nicotine':
      return t(NICOTINE[p.v] ?? 'Never')
    case 'sleep': {
      const mins = Math.round(p.v * 60)
      return t('{h} h {m} m average', { h: Math.floor(mins / 60), m: mins % 60 })
    }
    case 'bmi':
      return `${p.v} kg/m²`
    case 'lipids':
      return t('Non-HDL {n} mg/dL', { n: p.v })
    case 'glucose':
      return `HbA1c ${p.v}%`
    case 'bp':
      return `${p.v} / ${p.v2 ?? 0} mmHg`
  }
}

/** Number fields per measure: label, range, whole numbers or not. */
const LE8_FIELDS: Record<Exclude<Le8Key, 'nicotine'>, { label: Parameters<T>[0]; min: number; max: number; whole?: boolean; initial?: string }[]> = {
  diet: [{ label: 'MEPA score, 0 to 16', min: 0, max: 16, whole: true }],
  activity: [{ label: 'Minutes of moderate activity a week', min: 0, max: 3000, whole: true }],
  sleep: [{ label: 'Hours of sleep a night, on average', min: 0, max: 16 }],
  bmi: [
    { label: 'Weight, kg', min: 25, max: 300 },
    { label: 'Height, cm', min: 120, max: 230, initial: '172' },
  ],
  lipids: [{ label: 'Non-HDL cholesterol, mg/dL', min: 30, max: 400, whole: true }],
  glucose: [{ label: 'HbA1c, %', min: 3, max: 20 }],
  bp: [
    { label: 'Systolic, mmHg', min: 60, max: 260, whole: true },
    { label: 'Diastolic, mmHg', min: 30, max: 160, whole: true },
  ],
}

function Le8Detail({ k, name, pts, onSave, onRemove }: { k: Le8Key; name: string; pts: Shown[]; onSave: (p: Point) => void; onRemove: (id: string) => void }) {
  const { c, term, space } = useTheme()
  const { t, tx, lang } = useA()
  const fields = k === 'nicotine' ? [] : LE8_FIELDS[k]
  const [draft, setDraft] = useState<string[]>(() => fields.map((f) => f.initial ?? ''))
  const [nic, setNic] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const scores = pts.map((p) => le8Score(k, p.v, p.v2))
  const newestFirst = [...pts].reverse()
  const minor = useIsMinor()

  const submit = () => {
    setSaved(null)
    let p: Point
    if (k === 'nicotine') {
      if (nic === null) return setErr(t('Choose one.'))
      p = { at: SPACE_TODAY, v: nic }
    } else {
      const ns: number[] = []
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i]
        const n = toNum(draft[i])
        if (n === null || n < f.min || n > f.max || (f.whole && !Number.isInteger(n))) return setErr(`${t(f.label)}: ${t('Enter a number from {a} to {b}.', { a: f.min, b: f.max })}`)
        ns.push(n)
      }
      if (k === 'bp' && ns[1] >= ns[0]) return setErr(t('The lower number should be smaller than the upper one.'))
      p = k === 'bmi' ? { at: SPACE_TODAY, v: round(ns[0] / (ns[1] / 100) ** 2, 1) } : k === 'bp' ? { at: SPACE_TODAY, v: ns[0], v2: ns[1] } : { at: SPACE_TODAY, v: k === 'sleep' ? round(ns[0], 2) : ns[0] }
    }
    setErr(null)
    onSave(p)
    setDraft(fields.map((f) => f.initial ?? ''))
    setNic(null)
    setSaved(minor ? t('Saved for {date}.', { date: shortDate(SPACE_TODAY, lang) }) : t('Saved for {date}: score {s}.', { date: shortDate(SPACE_TODAY, lang), s: le8Score(k, p.v, p.v2) }))
  }

  return (
    <View style={{ gap: space.s2, backgroundColor: c.paperSunk, borderRadius: 12, padding: 14 }}>
      <Meta tone="ink2">{tx(LE8_IDEAL[k])}</Meta>
      {pts.length > 1 && !minor ? (
        <Sparkline
          values={scores}
          labels={[shortDate(pts[0].at, lang), shortDate(pts[pts.length - 1].at, lang)]}
          color={term('H').main}
          height={56}
          min={0}
          max={100}
          showDots
          label={t('{name} score over time: {list}.', { name, list: pts.map((p, i) => `${shortDate(p.at, lang)} ${scores[i]}`).join(', ') })}
        />
      ) : null}
      <View>
        {newestFirst.map((p, i) => {
          const s = le8Score(k, p.v, p.v2)
          const reading = le8Reading(k, p, t)
          return (
            <View key={p.id ?? p.at} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.line, paddingVertical: 8 }}>
              <View style={{ flex: 1, gap: 2 }} accessible accessibilityLabel={minor ? `${shortDate(p.at, lang)}: ${reading}` : t('{date}: {reading}, score {s}', { date: shortDate(p.at, lang), reading, s })}>
                <Mono size={12} tone="ink3">
                  {`${shortDate(p.at, lang)}${p.mine ? ` · ${t('Entered by you')}` : ''}`}
                </Mono>
                <Meta tone="ink">{reading}</Meta>
              </View>
              {minor ? null : <Mono tone="ink">{String(s)}</Mono>}
              {p.mine && p.id ? (
                <Button variant="link" size="sm" onPress={() => onRemove(p.id!)} accessibilityLabel={t('Remove today’s reading')}>
                  {t('Remove')}
                </Button>
              ) : null}
            </View>
          )
        })}
      </View>
      {k === 'nicotine' ? (
        <View style={{ gap: 8 }}>
          <Eyebrow>{t('Nicotine use')}</Eyebrow>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {NICOTINE.map((o, i) => (
              <Chip key={o} label={t(o)} selected={nic === i} onPress={() => (setNic(i), setErr(null), setSaved(null))} />
            ))}
          </View>
        </View>
      ) : (
        <View style={{ gap: space.s1 }}>
          {fields.map((f, i) => (
            <TextField
              key={f.label}
              label={t(f.label)}
              value={draft[i]}
              onChangeText={(v) => (setDraft((d) => d.map((x, j) => (j === i ? v : x))), setErr(null), setSaved(null))}
              keyboardType={f.whole ? 'number-pad' : 'decimal-pad'}
              inputMode={f.whole ? 'numeric' : 'decimal'}
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          ))}
          {k === 'bmi' ? (
            <Meta size={14} tone="ink3">
              {t('We work out BMI from your weight and height.')}
            </Meta>
          ) : null}
        </View>
      )}
      {err ? (
        <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <Icon name="info" size={16} color={c.ink} />
          <Meta tone="ink" style={{ flex: 1 }}>
            {err}
          </Meta>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2, flexWrap: 'wrap' }}>
        <Button icon="plus" onPress={submit}>
          {t('Save reading')}
        </Button>
        {saved ? <Meta accessibilityLiveRegion="polite">{saved}</Meta> : null}
      </View>
      <Meta size={14} tone="ink3">
        {t('Kept on this phone. Scored by the AHA method; your coach sees the trend.')}
      </Meta>
    </View>
  )
}

function Vault() {
  const { c, space } = useTheme()
  const { t, tx, lang } = useA()
  const [filter, setFilter] = useState<'watch' | 'all'>('watch')
  const [open, setOpen] = useState<string | null>(null)
  const rows = filter === 'all' ? BIOMARKERS : BIOMARKERS.filter((m) => m.status !== 'in range')
  const watching = BIOMARKERS.filter((m) => m.status !== 'in range').length
  return (
    <ToolCard
      title={t('Biomarker vault')}
      lead={t('{n} markers from your January panel. {w} are outside or near the edge of their range. Tap one for what it means in plain words.', { n: BIOMARKERS.length, w: watching })}
    >
      <Segmented
        value={filter}
        onChange={setFilter}
        items={[
          { value: 'watch', label: t('Worth a look · {n}', { n: watching }) },
          { value: 'all', label: t('All · {n}', { n: BIOMARKERS.length }) },
        ]}
      />
      <View>
        {rows.map((m, i) => (
          <MarkerRow key={m.name} m={m} first={i === 0} open={open === m.name} onToggle={() => setOpen(open === m.name ? null : m.name)} />
        ))}
      </View>
      <View style={{ gap: 4, borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.s2 }}>
        <Meta size={14}>
          <Rich
            text={t('Drawn {d} · signed {s} by *{who}*', { d: fmtDate(PANEL_META.drawn, lang), s: fmtDate(PANEL_META.signed, lang), who: PANEL_META.signedBy })}
            wrap={(w) => <Meta size={14} tone="ink">{w}</Meta>}
          />
        </Meta>
        <Meta size={14} tone="ink3">
          {t('{lab}. VIVA explains a marker; it never diagnoses.', { lab: tx(PANEL_META.lab) })}
        </Meta>
      </View>
    </ToolCard>
  )
}

function MarkerRow({ m, first, open, onToggle }: { m: Marker; first: boolean; open: boolean; onToggle: () => void }) {
  const { c } = useTheme()
  const { t, tx } = useA()
  const viva = useVivaRun()
  const delta = m.prev === null ? null : Math.round((m.value - m.prev) * 100) / 100
  // Status is told in words on neutral grounds; a Spectrum colour never stands in for it.
  const statusTone = m.status === 'outside range' ? 'ink' : 'neutral'
  const name = tx(m.name)
  // explain_biomarker, run here in the room: plain words from the signed panel, never a diagnosis.
  const explain = () =>
    viva.run({
      ask: t('What is {name}, in plain words?', { name }),
      text: t('{name} is {value} {unit}; the lab range is {range}. {plain} {status} Your physician reads it with the rest of your panel. VIVA explains; it never diagnoses.', {
        name,
        value: m.value,
        unit: m.unit,
        range: m.range,
        plain: tx(m.plain),
        status: m.status === 'in range' ? t('It sits within its range.') : m.status === 'worth watching' ? t('It is near the edge of its range: worth watching, not worrying about.') : t('It is outside its range; Dr Meera has seen it and will talk it through with you.'),
      }),
      tool: 'explain_biomarker',
      reviewer: tx('Reviewed by Dr Meera Iyer'),
    })
  return (
    <View style={{ borderTopWidth: first ? 0 : 1, borderTopColor: c.line, paddingVertical: 12, gap: 8 }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        aria-expanded={open}
        accessibilityLabel={t('{name}, {value} {unit}, range {range}, {status}{prev}', { name, value: m.value, unit: m.unit, range: m.range, status: tx(m.status), prev: m.prev !== null ? t(', previously {p}', { p: m.prev }) : '' })}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.7 : 1 })}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Body weight="medium">{name}</Body>
          <Meta size={14} tone="ink3">
            {t('{panel} · range {range}', { panel: tx(m.panel), range: m.range })}
          </Meta>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Mono tone="ink" size={17}>
              {String(m.value)}
            </Mono>
            <Mono tone="ink3" size={12}>
              {m.unit}
            </Mono>
          </View>
          <Pill tone={statusTone}>{tx(m.status)}</Pill>
        </View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={c.ink3} />
      </Pressable>
      {open ? (
        <View style={{ gap: 8 }}>
          <Body tone="ink2">{tx(m.plain)}</Body>
          <Meta size={14}>{m.prev === null ? t('Measured once; no earlier reading.') : t('Last panel {p} {unit}; {change}.', { p: m.prev, unit: m.unit, change: delta! === 0 ? t('unchanged') : t(delta! > 0 ? 'up {n}' : 'down {n}', { n: Math.abs(delta!) }) })}</Meta>
          <VivaExchange state={viva.state} turn={viva.turn} />
          {viva.state === 'idle' ? (
            <Button size="sm" variant="ghost" icon="message-circle" onPress={explain} style={{ alignSelf: 'flex-start' }}>
              {t('Ask VIVA to explain {name}', { name })}
            </Button>
          ) : viva.state === 'shown' ? (
            <Button size="sm" variant="ghost" onPress={viva.reset} style={{ alignSelf: 'flex-start' }}>
              {t('Close the explanation')}
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

type CapKey = (typeof CAPACITY)[number]['key']
/** What the member types for each test; gait is timed over 4 metres and turned into a speed. */
const CAP_FIELD: Record<CapKey, { label: Parameters<T>[0]; min: number; max: number }> = {
  grip: { label: 'Best of three squeezes, kg', min: 5, max: 90 },
  sts: { label: 'Time for five stands, seconds', min: 3, max: 60 },
  gait: { label: 'Time to walk 4 metres, seconds', min: 1.5, max: 30 },
}

function Capacity() {
  const { c, space } = useTheme()
  const { t, tx, lang } = useA()
  const [how, setHow] = useState<string | null>(null)
  const [rec, setRec] = useState<CapKey | null>(null)
  const [mine, setMine] = useLocal<Partial<Record<CapKey, MyPoint[]>>>('capacityResults', {})
  const [draft, setDraft] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const openRec = (k: CapKey | null) => {
    setRec(k)
    setDraft('')
    setErr(null)
    setSaved(null)
  }
  const fmt = (n: number, unit: string) => `${n} ${unit}`
  return (
    <ToolCard title={t('Capacity battery')} lead={t('Three timed tests from WHO ICOPE. Repeat them at home each month; your coach sees the trend.')}>
      <View style={{ gap: space.s2 }}>
        {CAPACITY.map((x) => {
          const pts = series([{ at: CAPACITY_AT.prev, v: x.prev }, { at: CAPACITY_AT.last, v: x.last }], mine[x.key])
          const last = pts[pts.length - 1]
          const prev = pts[pts.length - 2]
          const better = x.better === 'higher' ? last.v > prev.v : last.v < prev.v
          const diff = Math.round(Math.abs(last.v - prev.v) * 100) / 100
          const f = CAP_FIELD[x.key]
          const typed = toNum(draft)
          const save = () => {
            const n = toNum(draft)
            if (n === null || n < f.min || n > f.max) return setErr(t('Enter a number from {a} to {b}.', { a: f.min, b: f.max }))
            const v = x.key === 'gait' ? round(4 / n, 2) : round(n, 1)
            setMine((all) => ({ ...all, [x.key]: [...(all[x.key] ?? []).filter((y) => y.at !== SPACE_TODAY), { at: SPACE_TODAY, v, id: `cap-${x.key}-${Date.now()}` }] }))
            setDraft('')
            setErr(null)
            setSaved(t('Saved for {date}: {v} {unit}.', { date: shortDate(SPACE_TODAY, lang), v, unit: x.unit }))
          }
          const removeToday = () => {
            setMine((all) => ({ ...all, [x.key]: (all[x.key] ?? []).filter((y) => y.at !== SPACE_TODAY) }))
            setSaved(null)
          }
          return (
            <View key={x.key} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <Body weight="medium" style={{ flex: 1 }}>
                  {tx(x.name)}
                </Body>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }} accessible accessibilityLabel={t('{last} {unit}, previously {prev}', { last: last.v, unit: x.unit, prev: prev.v })}>
                  <Mono tone="ink" size={22} weight="light">
                    {String(last.v)}
                  </Mono>
                  <Mono tone="ink3" size={12}>
                    {x.unit}
                  </Mono>
                </View>
              </View>
              <Meta size={14}>
                <Rich
                  text={t('Was *{prev}* · {change} · {norm}', {
                    prev: String(prev.v),
                    change: diff === 0 ? t('unchanged') : better ? t('{d} {unit} better', { d: diff, unit: x.unit }) : t(x.better === 'higher' ? '{d} {unit} lower than last time' : '{d} {unit} higher than last time', { d: diff, unit: x.unit }),
                    norm: tx(x.norm),
                  })}
                  wrap={(w) => <Mono size={14} tone="ink2">{w}</Mono>}
                />
              </Meta>
              <Mono size={12} tone="ink3">
                {t('Results · {list}', { list: pts.slice(-4).map((p) => `${shortDate(p.at, lang)} ${fmt(p.v, x.unit)}`).join(' · ') })}
              </Mono>
              {how === x.key ? <Meta tone="ink">{tx(x.how)}</Meta> : null}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 20 }}>
                <Pressable
                  onPress={() => setHow(how === x.key ? null : x.key)}
                  accessibilityRole="button"
                  accessibilityLabel={how === x.key ? t('Hide how to do {name}', { name: tx(x.name) }) : t('How to do {name}', { name: tx(x.name) })}
                  style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}
                >
                  <Meta size={14} tone="ink2" style={{ textDecorationLine: 'underline', textDecorationColor: c.lineStrong }}>
                    {how === x.key ? t('Hide') : t('How to do it')}
                  </Meta>
                </Pressable>
                <Pressable
                  onPress={() => openRec(rec === x.key ? null : x.key)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: rec === x.key }}
                  aria-expanded={rec === x.key}
                  accessibilityLabel={rec === x.key ? t('Hide the form for {name}', { name: tx(x.name) }) : t('Record a result for {name}', { name: tx(x.name) })}
                  style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}
                >
                  <Meta size={14} tone="ink2" style={{ textDecorationLine: 'underline', textDecorationColor: c.lineStrong }}>
                    {rec === x.key ? t('Hide') : t('Record a result')}
                  </Meta>
                </Pressable>
              </View>
              {rec === x.key ? (
                <View style={{ gap: space.s1, backgroundColor: c.paperSunk, borderRadius: 12, padding: 14 }}>
                  <TextField
                    label={t(f.label)}
                    value={draft}
                    onChangeText={(v) => (setDraft(v), setErr(null), setSaved(null))}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    returnKeyType="done"
                    onSubmitEditing={save}
                  />
                  {x.key === 'gait' && typed !== null && typed >= f.min && typed <= f.max ? (
                    <Meta size={14} tone="ink2">
                      {t('That is {v} m/s.', { v: round(4 / typed, 2) })}
                    </Meta>
                  ) : null}
                  {err ? (
                    <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                      <Icon name="info" size={16} color={c.ink} />
                      <Meta tone="ink" style={{ flex: 1 }}>
                        {err}
                      </Meta>
                    </View>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2, flexWrap: 'wrap' }}>
                    <Button icon="plus" onPress={save}>
                      {t('Save result')}
                    </Button>
                    {last.mine && last.at === SPACE_TODAY ? (
                      <Button variant="link" size="sm" onPress={removeToday}>
                        {t('Remove today’s result')}
                      </Button>
                    ) : null}
                  </View>
                  {saved ? <Meta accessibilityLiveRegion="polite">{saved}</Meta> : null}
                </View>
              ) : null}
            </View>
          )
        })}
      </View>
    </ToolCard>
  )
}

// ─── Protocol and AIWO Daily stack ────────────────────────────────────────

type StackItem = { id: string; kind: 'practice' | 'supplement'; label: string; dose?: string; why: string }

/** Today's protocol practices and AIWO Daily stack, as signed by the physician against the January panel. */
function DailyStack() {
  const { c, space, radius } = useTheme()
  const { t, lang } = useA()
  const [done, setDone] = useLocal<{ on: string; ids: string[] }>('dailyStack', { on: SPACE_TODAY, ids: [] })
  const [asked, setAsked] = useLocal<string[]>('dailyStackAsked', [])
  const today = done.on === SPACE_TODAY ? done.ids : []
  const doc = PANEL_META.signedBy
  const vitD = BIOMARKERS.find((m) => m.name.startsWith('Vitamin D'))
  const items: StackItem[] = [
    { id: 'p_sun', kind: 'practice', label: t('Ten minutes of morning sun, before 10 am'), why: t('For vitamin D, below range in January') },
    { id: 'p_walk', kind: 'practice', label: t('A 30-minute brisk walk, five days a week'), why: t('For ApoB, LDL and HbA1c, all worth watching') },
    { id: 'p_lights', kind: 'practice', label: t('Lights out by 22:30'), why: t('Your sleep plan, from Ease') },
    { id: 's_d3', kind: 'supplement', label: 'AIWO Daily D3', dose: '2,000 IU', why: t('With breakfast · vitamin D {v} ng/mL, range 30 – 100', { v: String(vitD?.value ?? '—') }) },
    { id: 's_o3', kind: 'supplement', label: 'AIWO Daily Omega-3', dose: '1 g', why: t('With lunch · for ApoB and LDL') },
    { id: 's_mg', kind: 'supplement', label: 'AIWO Daily Magnesium', dose: '200 mg', why: t('At 21:00 · part of your wind-down') },
  ]
  const toggle = (id: string) => setDone({ on: SPACE_TODAY, ids: today.includes(id) ? today.filter((x) => x !== id) : [...today, id] })
  const n = items.filter((i) => today.includes(i.id)).length
  const row = (i: StackItem) => {
    const on = today.includes(i.id)
    const name = i.dose ? `${i.label} ${i.dose}` : i.label
    return (
      <View key={i.id} style={{ borderWidth: 1, borderColor: c.line, borderRadius: radius.card, backgroundColor: on ? c.paperSunk : undefined, padding: 12, gap: 6 }}>
        <Pressable
          onPress={() => toggle(i.id)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: on }}
          aria-checked={on}
          accessibilityLabel={t('Done today: {x}', { x: name })}
          accessibilityHint={i.why}
          style={({ pressed }) => ({ flexDirection: 'row', gap: 12, minHeight: 44, opacity: pressed ? 0.7 : 1 })}
        >
          <View style={{ width: 22, height: 22, marginTop: 1, borderRadius: 6, borderWidth: 2, borderColor: on ? c.ink : c.lineStrong, backgroundColor: on ? c.ink : undefined, alignItems: 'center', justifyContent: 'center' }}>
            {on ? <Icon name="check" size={14} color={c.paper} /> : null}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Body tone={on ? 'ink2' : 'ink'}>
              {i.label}
              {i.dose ? (
                <>
                  {' · '}
                  <Mono tone={on ? 'ink2' : 'ink'}>{i.dose}</Mono>
                </>
              ) : null}
            </Body>
            <Meta size={14} tone="ink3">
              {i.why}
            </Meta>
          </View>
        </Pressable>
        {i.kind === 'supplement' ? (
          <View style={{ paddingLeft: 34 }}>
            {asked.includes(i.id) ? (
              <Meta size={14} tone="ink2" accessibilityLiveRegion="polite">
                {t('Asked · {name} replies within a working day', { name: doc })}
              </Meta>
            ) : (
              <Button variant="link" size="sm" onPress={() => setAsked((a) => [...a, i.id])} accessibilityLabel={t('Ask {name} about {x}', { name: doc, x: i.label })}>
                {t('Ask about this')}
              </Button>
            )}
          </View>
        ) : null}
      </View>
    )
  }
  return (
    <ToolCard
      title={t('Protocol · AIWO Daily')}
      aside={
        <View accessible accessibilityLabel={t('{n} of {m} done today', { n, m: items.length })} style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
          <Mono tone="ink" size={20} weight="light">
            {String(n)}
          </Mono>
          <Mono tone="ink3" size={13}>{`/${items.length}`}</Mono>
        </View>
      }
      lead={t('Signed by {name} on {date}, against your January panel. Tick what you have done today; a missed day is just a missed day.', { name: doc, date: fmtDate(PANEL_META.signed, lang) })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <Eyebrow>{t('Today · {d}', { d: shortDate(SPACE_TODAY, lang) })}</Eyebrow>
        <SpecimenTag />
      </View>
      <View style={{ gap: 8 }}>
        <Body weight="medium" {...H3}>
          {t('Protocol practices')}
        </Body>
        {items.filter((i) => i.kind === 'practice').map(row)}
      </View>
      <View style={{ gap: 8 }}>
        <Body weight="medium" {...H3}>
          {t('AIWO Daily stack')}
        </Body>
        {items.filter((i) => i.kind === 'supplement').map(row)}
        <Meta size={14} tone="ink3">
          {t('Missed a dose? Carry on with the next one as usual. Never double up.')}
        </Meta>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, backgroundColor: c.paperSunk, borderRadius: radius.card, padding: space.s2 }}>
        <Icon name="shield" size={15} color={c.ink2} />
        <Meta style={{ flex: 1 }}>{t('Protocol-only. AIWO Daily reaches you only when your physician adds it to your protocol, against a signed panel. There is no shop here, and nothing is sold to you on this screen.')}</Meta>
      </View>
      <Meta size={14} tone="ink3">
        {t('Reviewed at Day 45 · re-tested at Day 90')} · {t('Only {name} changes the stack. Ask, and the question goes to your care team.', { name: doc })}
      </Meta>
      <ArrowLink icon="message-circle" onPress={() => router.push('/messages?t=t_meera')}>
        {t('Message {name}', { name: doc })}
      </ArrowLink>
    </ToolCard>
  )
}

// ─── Biological age, only after physician sign-off ───────────────────────

function BiologicalAge() {
  const { c, space, radius } = useTheme()
  const { t, lang } = useA()
  const [asked, setAsked] = useLocal('bioAgeAsked', false)
  // A specimen switch shows the card as it reads once the physician has signed the estimate.
  const [signedView, setSignedView] = useLocal('bioAgeSignedView', false)
  const doc = PANEL_META.signedBy
  const steps = [
    { done: true, label: t('Clinical panel drawn · {d}', { d: shortDate(PANEL_META.drawn, lang) }) },
    { done: true, label: t('Panel signed · {d}', { d: shortDate(PANEL_META.signed, lang) }) },
    { done: signedView, label: t('Biological age review · at Day 45') },
  ]
  return (
    <ToolCard tone="sunk" title={t('Biological age · LONGEVIS')} aside={<Icon name={signedView ? 'check-circle' : 'lock'} size={16} color={c.ink3} />}>
      {signedView ? (
        <View style={{ gap: space.s1 }}>
          <View accessible accessibilityLabel={t('Biological age estimate {a} to {b}, signed by {name}.', { a: 49, b: 52, name: doc })} style={{ alignItems: 'center', justifyContent: 'center', height: 112, borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.paperRaised }}>
            <Mono size={44} weight="light" tone="ink">
              49 – 52
            </Mono>
            <Meta size={14} tone="ink3">
              {t('years · an estimate, with its range')}
            </Meta>
          </View>
          <Body>{t('Signed by {name} at your Day 45 review.', { name: doc })}</Body>
          <Meta>{t('An estimate from your panel and capacity, never a promise or a target. {name} walks you through what moves it; the number itself is not something to chase.', { name: doc })}</Meta>
        </View>
      ) : (
        <View style={{ gap: space.s1 }}>
          <View accessible accessibilityLabel={t('Locked')} style={{ alignItems: 'center', justifyContent: 'center', height: 112, borderRadius: radius.card, borderWidth: 1, borderStyle: 'dashed', borderColor: c.lineStrong }}>
            <Mono size={44} weight="light" tone="ink3">
              — —
            </Mono>
          </View>
          <Body>{t('Shown only after a physician signs it.')}</Body>
          <Meta>{t('An estimate from your panel and capacity, never a promise or a target. It waits for Dr Meera’s review, so a number never reaches you without a person who can explain it.')}</Meta>
        </View>
      )}
      <View style={{ gap: 8 }}>
        {steps.map((s) => (
          <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {s.done ? <Icon name="check" size={15} color={c.ink} /> : <View style={{ width: 9, height: 9, marginHorizontal: 3, borderRadius: 5, borderWidth: 1, borderColor: c.lineStrong }} />}
            <Meta tone={s.done ? 'ink' : 'ink3'} style={{ flex: 1 }}>
              {s.label}
            </Meta>
          </View>
        ))}
      </View>
      {signedView ? null : asked ? (
        <Meta tone="ink2" accessibilityLiveRegion="polite">
          {t('Added to the agenda for your Day 45 review with Dr Meera.')}
        </Meta>
      ) : (
        <Button size="sm" variant="secondary" icon="plus" onPress={() => setAsked(true)} style={{ alignSelf: 'flex-start' }}>
          {t('Add to my Day 45 review')}
        </Button>
      )}
      <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.s1, gap: 6 }}>
        <SpecimenTag />
        <Toggle checked={signedView} onChange={setSignedView} label={t('Specimen view: after Dr Meera signs')} description={t('See this card as it reads once your physician has reviewed and signed the estimate.')} />
      </View>
    </ToolCard>
  )
}
