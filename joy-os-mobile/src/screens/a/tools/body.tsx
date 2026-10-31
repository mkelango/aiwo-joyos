import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { ArrowLink, Body, Divider, Eyebrow, Icon, Meta, Mono, Pill, Segmented, TermChip, fmtDate } from '@/components'
import { BarRow, Sparkline } from '@/screens/a/parts'
import { BIOMARKERS, CAPACITY, DEVICES, LE8, PANEL_META, SIGNALS, type Marker } from '@/screens/a/spacesData'
import { useTheme } from '@/theme/ThemeProvider'
import { ToolCard, ToolsHeading } from './common'

// BODY: device status, signal trends, Life's Essential 8, the biomarker vault, the capacity battery.

export function BodyTools() {
  return (
    <>
      <ToolsHeading>Body tools</ToolsHeading>
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
  return (
    <ToolCard title="Devices" lead="Signals are features, never a vendor’s score. Each device reads only what you allowed.">
      <View style={{ gap: space.s1 }}>
        {DEVICES.map((d, i) => (
          <View key={d.id}>
            {i > 0 ? <Divider style={{ marginBottom: space.s1 }} /> : null}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }} accessible accessibilityLabel={`${d.name} ${d.via}, ${d.status === 'connected' ? 'connected' : 'not linked'}. ${d.last}. Reads ${d.reads}.`}>
              <Icon name={d.status === 'connected' ? 'check-circle' : 'circle'} size={18} color={d.status === 'connected' ? c.ink : c.ink3} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Body weight="medium">{d.name}</Body>
                  <Meta size={14} tone="ink3">
                    {d.via}
                  </Meta>
                </View>
                <Meta size={14}>{d.reads}</Meta>
                <Meta size={14} tone="ink3">
                  {d.last}
                </Meta>
              </View>
              <Pill tone={d.status === 'connected' ? 'ink' : 'neutral'}>{d.status === 'connected' ? 'Connected' : 'Not linked'}</Pill>
            </View>
          </View>
        ))}
      </View>
      <ArrowLink icon="watch" onPress={() => router.push('/devices')}>
        Manage devices
      </ArrowLink>
    </ToolCard>
  )
}

function Signals() {
  const { c, term, space } = useTheme()
  const col = term('H').main
  const first = SIGNALS[0]
  const last = SIGNALS[SIGNALS.length - 1]
  const avg = (k: 'hrv' | 'rhr' | 'regularity', from: number, to: number) => {
    const xs = SIGNALS.slice(from, to).map((s) => s[k])
    return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10
  }
  const rows = [
    { k: 'hrv' as const, name: 'Heart-rate variability', unit: 'ms', better: 'higher', sentence: 'Overnight HRV, higher is usually more rested. Dips fall on Saturdays, after late dinners.' },
    { k: 'rhr' as const, name: 'Resting heart rate', unit: 'bpm', better: 'lower', sentence: 'Lowest overnight heart rate. A slow drift down over the month.' },
    { k: 'regularity' as const, name: 'Sleep regularity', unit: '/100', better: 'higher', sentence: 'How alike your bed and wake times are. It slipped in the last week, with late Sundays.' },
  ]
  return (
    <ToolCard title="Signal trends · 28 days" aside={<TermChip term="H" />} lead="Three features from your ring, one line each. Features, never a vendor score.">
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
                labels={[first.label, last.label]}
                color={col}
                height={64}
                label={`${r.name}, 28 days from ${first.label} to ${last.label}: first-week average ${a} ${r.unit}, last-week average ${b} ${r.unit}.`}
              />
              <Meta size={13} tone="ink3">
                Week 1 average <Mono size={13} tone="ink2">{String(a)}</Mono> · last week <Mono size={13} tone="ink2">{String(b)}</Mono> · {d === 0 ? 'held' : `${d > 0 ? 'up' : 'down'} ${Math.abs(d)} ${r.unit}`}
              </Meta>
            </View>
          )
        })}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="info" size={14} color={c.ink3} />
        <Eyebrow size={11} style={{ flex: 1 }}>
          Oura Ring Gen 4 via Terra · features, never a vendor score
        </Eyebrow>
      </View>
    </ToolCard>
  )
}

function Le8() {
  const { c, term } = useTheme()
  const total = Math.round(LE8.reduce((a, b) => a + b.score, 0) / LE8.length)
  const watch = LE8.filter((x) => x.status === 'watch').map((x) => x.name.toLowerCase())
  const col = term('H')
  return (
    <ToolCard
      title="Life’s Essential 8"
      aside={<Mono tone="ink">{`${total} / 100`}</Mono>}
      lead={`Eight readings the heart cares about, each scored 0 to 100. Your average is ${total}; ${watch.join(' and ')} are worth watching.`}
    >
      <View style={{ gap: 14 }}>
        {LE8.map((x) => (
          <BarRow key={x.key} label={x.name} value={x.score} max={100} color={x.status === 'watch' ? c.lineStrong : col.main} note={`${x.reading} · ${x.source}${x.status === 'watch' ? ' · worth watching' : x.status === 'ideal' ? ' · ideal' : ''}`} />
        ))}
      </View>
      <Meta size={14} tone="ink3">
        American Heart Association · Life’s Essential 8 · self-report with device and clinic readings
      </Meta>
    </ToolCard>
  )
}

function Vault() {
  const { c, space } = useTheme()
  const [filter, setFilter] = useState<'watch' | 'all'>('watch')
  const [open, setOpen] = useState<string | null>(null)
  const rows = filter === 'all' ? BIOMARKERS : BIOMARKERS.filter((m) => m.status !== 'in range')
  const watching = BIOMARKERS.filter((m) => m.status !== 'in range').length
  return (
    <ToolCard
      title="Biomarker vault"
      lead={`${BIOMARKERS.length} markers from your January panel. ${watching} are outside or near the edge of their range. Tap one for what it means in plain words.`}
    >
      <Segmented
        value={filter}
        onChange={setFilter}
        items={[
          { value: 'watch', label: `Worth a look · ${watching}` },
          { value: 'all', label: `All · ${BIOMARKERS.length}` },
        ]}
      />
      <View>
        {rows.map((m, i) => (
          <MarkerRow key={m.name} m={m} first={i === 0} open={open === m.name} onToggle={() => setOpen(open === m.name ? null : m.name)} />
        ))}
      </View>
      <View style={{ gap: 4, borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.s2 }}>
        <Meta size={14}>
          Drawn {fmtDate(PANEL_META.drawn)} · signed {fmtDate(PANEL_META.signed)} by <Meta size={14} tone="ink">{PANEL_META.signedBy}</Meta>
        </Meta>
        <Meta size={14} tone="ink3">
          {PANEL_META.lab}. VIVA explains a marker; it never diagnoses.
        </Meta>
      </View>
    </ToolCard>
  )
}

function MarkerRow({ m, first, open, onToggle }: { m: Marker; first: boolean; open: boolean; onToggle: () => void }) {
  const { c } = useTheme()
  const delta = m.prev === null ? null : Math.round((m.value - m.prev) * 100) / 100
  // Status is told in words on neutral grounds; a Spectrum colour never stands in for it.
  const statusTone = m.status === 'outside range' ? 'ink' : 'neutral'
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      aria-expanded={open}
      accessibilityLabel={`${m.name}, ${m.value} ${m.unit}, range ${m.range}, ${m.status}${m.prev !== null ? `, previously ${m.prev}` : ''}`}
      style={({ pressed }) => ({ borderTopWidth: first ? 0 : 1, borderTopColor: c.line, paddingVertical: 12, gap: 6, opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Body weight="medium">{m.name}</Body>
          <Meta size={14} tone="ink3">
            {m.panel} · range {m.range}
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
          <Pill tone={statusTone}>{m.status}</Pill>
        </View>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={c.ink3} />
      </View>
      {open ? (
        <View style={{ gap: 4 }}>
          <Body tone="ink2">{m.plain}</Body>
          <Meta size={14}>{m.prev === null ? 'Measured once; no earlier reading.' : `Last panel ${m.prev} ${m.unit}; ${delta! === 0 ? 'unchanged' : `${delta! > 0 ? 'up' : 'down'} ${Math.abs(delta!)}`}.`}</Meta>
        </View>
      ) : null}
    </Pressable>
  )
}

function Capacity() {
  const { c, space } = useTheme()
  const [how, setHow] = useState<string | null>(null)
  return (
    <ToolCard title="Capacity battery" lead="Three timed tests from WHO ICOPE. Repeat them at home each month; your coach sees the trend.">
      <View style={{ gap: space.s2 }}>
        {CAPACITY.map((t) => {
          const better = t.better === 'higher' ? t.last > t.prev : t.last < t.prev
          const diff = Math.round(Math.abs(t.last - t.prev) * 100) / 100
          return (
            <View key={t.key} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <Body weight="medium" style={{ flex: 1 }}>
                  {t.name}
                </Body>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }} accessible accessibilityLabel={`${t.last} ${t.unit}, previously ${t.prev}`}>
                  <Mono tone="ink" size={22} weight="light">
                    {String(t.last)}
                  </Mono>
                  <Mono tone="ink3" size={12}>
                    {t.unit}
                  </Mono>
                </View>
              </View>
              <Meta size={14}>
                Was <Mono size={14} tone="ink2">{String(t.prev)}</Mono> · {diff === 0 ? 'unchanged' : better ? `${diff} ${t.unit} better` : `${diff} ${t.unit} ${t.better === 'higher' ? 'lower' : 'higher'} than last time`} · {t.norm}
              </Meta>
              {how === t.key ? <Meta tone="ink">{t.how}</Meta> : null}
              <Pressable
                onPress={() => setHow(how === t.key ? null : t.key)}
                accessibilityRole="button"
                accessibilityLabel={how === t.key ? `Hide how to do ${t.name}` : `How to do ${t.name}`}
                style={{ minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' }}
              >
                <Meta size={14} tone="ink2" style={{ textDecorationLine: 'underline', textDecorationColor: c.lineStrong }}>
                  {how === t.key ? 'Hide' : 'How to do it'}
                </Meta>
              </Pressable>
            </View>
          )
        })}
      </View>
    </ToolCard>
  )
}
