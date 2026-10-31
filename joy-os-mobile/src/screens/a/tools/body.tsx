import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { ArrowLink, Body, Divider, Eyebrow, Icon, Meta, Mono, Pill, Segmented, TermChip, fmtDate } from '@/components'
import { BarRow, Sparkline } from '@/screens/a/parts'
import { BIOMARKERS, CAPACITY, DEVICES, LE8, PANEL_META, SIGNALS, type Marker } from '@/screens/a/spacesData'
import { useTheme } from '@/theme/ThemeProvider'
import { Rich, useA } from '../i18n'
import { ToolCard, ToolsHeading } from './common'

// BODY: device status, signal trends, Life's Essential 8, the biomarker vault, the capacity battery.

export function BodyTools() {
  const { t } = useA()
  return (
    <>
      <ToolsHeading>{t('Body tools')}</ToolsHeading>
      <Devices />
      <Signals />
      <Le8 />
      <Vault />
      <Capacity />
    </>
  )
}

function Devices() {
  const { c, space } = useTheme()
  const { t, tx } = useA()
  return (
    <ToolCard title={t('Devices')} lead={t('Signals are features, never a vendor’s score. Each device reads only what you allowed.')}>
      <View style={{ gap: space.s1 }}>
        {DEVICES.map((d, i) => (
          <View key={d.id}>
            {i > 0 ? <Divider style={{ marginBottom: space.s1 }} /> : null}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }} accessible accessibilityLabel={t('{name} {via}, {status}. {last}. Reads {reads}.', { name: d.name, via: tx(d.via), status: t(d.status === 'connected' ? 'connected' : 'not linked'), last: tx(d.last), reads: tx(d.reads) })}>
              <Icon name={d.status === 'connected' ? 'check-circle' : 'circle'} size={18} color={d.status === 'connected' ? c.ink : c.ink3} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Body weight="medium">{d.name}</Body>
                  <Meta size={14} tone="ink3">
                    {tx(d.via)}
                  </Meta>
                </View>
                <Meta size={14}>{tx(d.reads)}</Meta>
                <Meta size={14} tone="ink3">
                  {tx(d.last)}
                </Meta>
              </View>
              <Pill tone={d.status === 'connected' ? 'ink' : 'neutral'}>{t(d.status === 'connected' ? 'Connected' : 'Not linked')}</Pill>
            </View>
          </View>
        ))}
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="info" size={14} color={c.ink3} />
        <Eyebrow size={11} style={{ flex: 1 }}>
          {t('Oura Ring Gen 4 via Terra · features, never a vendor score')}
        </Eyebrow>
      </View>
    </ToolCard>
  )
}

function Le8() {
  const { c, term } = useTheme()
  const { t, tx, lang } = useA()
  const total = Math.round(LE8.reduce((a, b) => a + b.score, 0) / LE8.length)
  const watch = LE8.filter((x) => x.status === 'watch').map((x) => (lang === 'en' ? x.name.toLowerCase() : tx(x.name)))
  const col = term('H')
  return (
    <ToolCard
      title="Life’s Essential 8"
      aside={<Mono tone="ink">{`${total} / 100`}</Mono>}
      lead={t('Eight readings the heart cares about, each scored 0 to 100. Your average is {n}; {watch} are worth watching.', { n: total, watch: watch.join(t(' and ')) })}
    >
      <View style={{ gap: 14 }}>
        {LE8.map((x) => (
          <BarRow key={x.key} label={tx(x.name)} value={x.score} max={100} color={x.status === 'watch' ? c.lineStrong : col.main} note={`${tx(x.reading)} · ${lang === 'en' ? x.source : tx(x.source)}${x.status === 'watch' ? t(' · worth watching') : x.status === 'ideal' ? t(' · ideal') : ''}`} />
        ))}
      </View>
      <Meta size={14} tone="ink3">
        {t('American Heart Association · Life’s Essential 8 · self-report with device and clinic readings')}
      </Meta>
    </ToolCard>
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
  const delta = m.prev === null ? null : Math.round((m.value - m.prev) * 100) / 100
  // Status is told in words on neutral grounds; a Spectrum colour never stands in for it.
  const statusTone = m.status === 'outside range' ? 'ink' : 'neutral'
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      aria-expanded={open}
      accessibilityLabel={t('{name}, {value} {unit}, range {range}, {status}{prev}', { name: m.name, value: m.value, unit: m.unit, range: m.range, status: tx(m.status), prev: m.prev !== null ? t(', previously {p}', { p: m.prev }) : '' })}
      style={({ pressed }) => ({ borderTopWidth: first ? 0 : 1, borderTopColor: c.line, paddingVertical: 12, gap: 6, opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Body weight="medium">{m.name}</Body>
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
      </View>
      {open ? (
        <View style={{ gap: 4 }}>
          <Body tone="ink2">{tx(m.plain)}</Body>
          <Meta size={14}>{m.prev === null ? t('Measured once; no earlier reading.') : t('Last panel {p} {unit}; {change}.', { p: m.prev, unit: m.unit, change: delta! === 0 ? t('unchanged') : t(delta! > 0 ? 'up {n}' : 'down {n}', { n: Math.abs(delta!) }) })}</Meta>
        </View>
      ) : null}
    </Pressable>
  )
}

function Capacity() {
  const { c, space } = useTheme()
  const { t, tx } = useA()
  const [how, setHow] = useState<string | null>(null)
  return (
    <ToolCard title={t('Capacity battery')} lead={t('Three timed tests from WHO ICOPE. Repeat them at home each month; your coach sees the trend.')}>
      <View style={{ gap: space.s2 }}>
        {CAPACITY.map((x) => {
          const better = x.better === 'higher' ? x.last > x.prev : x.last < x.prev
          const diff = Math.round(Math.abs(x.last - x.prev) * 100) / 100
          return (
            <View key={x.key} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <Body weight="medium" style={{ flex: 1 }}>
                  {tx(x.name)}
                </Body>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }} accessible accessibilityLabel={t('{last} {unit}, previously {prev}', { last: x.last, unit: x.unit, prev: x.prev })}>
                  <Mono tone="ink" size={22} weight="light">
                    {String(x.last)}
                  </Mono>
                  <Mono tone="ink3" size={12}>
                    {x.unit}
                  </Mono>
                </View>
              </View>
              <Meta size={14}>
                <Rich
                  text={t('Was *{prev}* · {change} · {norm}', {
                    prev: String(x.prev),
                    change: diff === 0 ? t('unchanged') : better ? t('{d} {unit} better', { d: diff, unit: x.unit }) : t(x.better === 'higher' ? '{d} {unit} lower than last time' : '{d} {unit} higher than last time', { d: diff, unit: x.unit }),
                    norm: tx(x.norm),
                  })}
                  wrap={(w) => <Mono size={14} tone="ink2">{w}</Mono>}
                />
              </Meta>
              {how === x.key ? <Meta tone="ink">{tx(x.how)}</Meta> : null}
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
            </View>
          )
        })}
      </View>
    </ToolCard>
  )
}
