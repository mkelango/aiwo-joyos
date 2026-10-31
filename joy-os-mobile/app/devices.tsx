import { useState } from 'react'
import { Platform, View } from 'react-native'
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg'
import { Body, Button, Card, DaybreakButton, Divider, Eyebrow, Icon, type IconName, Meta, Mono, Pill, Screen, ScreenHeader, SectionTitle, Serif, Sheet, SpecimenTag, TermChip, TermDot, Toggle } from '@/components'
import { useTheme } from '@/theme/ThemeProvider'
import { DEVICES, HEALTHKIT_TYPES, WEAR_NIGHTS } from '@/screens/b/accountData'
import { CheckLine } from '@/screens/b/parts'

// DEVICES (Signals, Memo p.15–16): Oura by default via Terra, Apple Health with per-type
// HealthKit reads and mindful-minutes write-back, Health Connect on Android, WHOOP, Garmin.
// Freshness and data quality shown plainly; a vendor's readiness, strain or age score never
// enters the Index. One Daybreak: "Sync now".

type Device = (typeof DEVICES)[number]

const iconFor = (id: string): IconName => (id === 'apple' || id === 'hc' ? 'smartphone' : id === 'oura' || id === 'ultrahuman' ? 'circle' : 'watch')

export default function Devices() {
  const { c, space, fonts } = useTheme()
  const [devices, setDevices] = useState<Device[]>(DEVICES)
  const [syncing, setSyncing] = useState(false)
  const [connect, setConnect] = useState<Device | null>(null)
  const [linking, setLinking] = useState(false)
  const [disconnect, setDisconnect] = useState<Device | null>(null)
  const [hk, setHk] = useState(HEALTHKIT_TYPES)
  const [writeBack, setWriteBack] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const connected = devices.filter((d) => d.state === 'connected')
  const others = devices.filter((d) => d.state !== 'connected')
  const wornNights = WEAR_NIGHTS.filter((n) => n.h >= 4).length
  const gaps = WEAR_NIGHTS.filter((n) => n.h === 0)
  const short = WEAR_NIGHTS.filter((n) => n.h > 0 && n.h < 4)
  const isAndroid = Platform.OS === 'android'

  const sync = () => {
    setSyncing(true)
    setTimeout(() => {
      setSyncing(false)
      setDevices((ds) => ds.map((d) => (d.state === 'connected' ? { ...d, lastSync: 'Just now', freshness: 'fresh' as const } : d)))
      setToast('Synced. 412 new samples, normalised into one record.')
    }, 1200)
  }

  // Wear chart geometry
  const W = 340
  const H = 150
  const padL = 22
  const padB = 20
  const max = 10
  const bw = (W - padL) / WEAR_NIGHTS.length
  const y = (h: number) => (H - padB) * (1 - h / max)

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow="Devices and signals"
        title={
          <>
            Bring your <Serif>own</Serif> device.
          </>
        }
        lead="Joy OS reads raw signals (sleep, heart rate variability, steps) from whatever you already wear, and turns them into one record you own."
      />

      <DaybreakButton icon="refresh-cw" onPress={sync} disabled={syncing}>
        {syncing ? 'Syncing…' : 'Sync now'}
      </DaybreakButton>

      <Card tone="sunk" style={{ flexDirection: 'row', gap: 12 }}>
        <Icon name="shield-off" size={20} color={c.ink2} />
        <Meta style={{ flex: 1 }}>
          <Meta tone="ink" weight="semibold">
            No vendor scores.
          </Meta>{' '}
          Joy OS never imports a vendor’s readiness, strain or age score into the Index. We read the raw signals and measure them by the published method, so your Joyspan does not change when you change rings.
        </Meta>
      </Card>

      {/* Connected */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>Reading now</SectionTitle>
          <SpecimenTag />
        </View>
        {connected.map((d) => (
          <Card key={d.id} tone="raised" style={{ gap: space.s1 + 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={iconFor(d.id)} size={20} color={c.ink} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Body weight="medium">{d.name}</Body>
                  {d.isDefault ? <Pill tone="daybreak">Default</Pill> : null}
                </View>
                <Meta size={14}>{d.via}</Meta>
              </View>
              <Pill tone={d.freshness === 'fresh' ? 'ink' : 'neutral'}>{d.freshness === 'fresh' ? 'Fresh' : 'Stale'}</Pill>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="clock" size={14} color={c.ink3} />
              <Meta size={14}>
                Last sync · <Mono size={14} tone="ink2">{syncing ? 'syncing…' : d.lastSync ?? '—'}</Mono>
              </Meta>
            </View>
            <Meta>{d.note}</Meta>
            <Meta size={14} tone="ink3">
              {d.signals.join(' · ')}
            </Meta>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <Eyebrow>Feeds</Eyebrow>
              {d.terms.map((t) => (
                <TermChip key={t} term={t} />
              ))}
            </View>
            {d.id === 'apple' ? (
              <View style={{ gap: space.s2, marginTop: space.s1 }}>
                <Divider />
                <Eyebrow>HealthKit · read, per type</Eyebrow>
                {hk.map((x) => (
                  <Toggle key={x.id} checked={x.on} onChange={(v) => setHk((h) => h.map((z) => (z.id === x.id ? { ...z, on: v } : z)))} label={x.label} />
                ))}
                <Divider />
                <Eyebrow>Write back</Eyebrow>
                <Toggle checked={writeBack} onChange={setWriteBack} label="Mindful minutes" description="When you finish a Practice or today’s action. Nothing else is ever written to Apple Health." />
              </View>
            ) : null}
            <Button size="sm" variant="ghost" onPress={() => setDisconnect(d)}>
              Disconnect
            </Button>
          </Card>
        ))}
      </View>

      {/* Data quality */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Data quality</SectionTitle>
        <Body tone="ink2">A signal is used only when there is enough of it. Nights with under four hours of wear are kept but not counted; gaps are never filled in.</Body>
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Meta>Hours the Oura Ring was worn each night, 15–28 January. The dashed line marks four hours, the minimum for a night to count.</Meta>
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Ring wear per night: ${wornNights} of 14 nights usable; no data on ${gaps.map((g) => `${g.d} January`).join(' and ')}; ${short.map((s) => `${s.d} January`).join(', ')} too short.`}
            style={{ alignItems: 'center' }}
          >
            <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
              {[0, 4, 8].map((t) => (
                <SvgText key={t} x={padL - 6} y={y(t) + 4} fontSize={10} fontFamily={fonts.mono} fill={c.ink3} textAnchor="end">
                  {t}
                </SvgText>
              ))}
              <Line x1={padL} x2={W} y1={y(4)} y2={y(4)} stroke={c.ink3} strokeDasharray="3 3" strokeWidth={1} />
              <Line x1={padL} x2={W} y1={H - padB} y2={H - padB} stroke={c.line} strokeWidth={1} />
              {WEAR_NIGHTS.map((n, i) => {
                const x = padL + i * bw + bw * 0.18
                const usable = n.h >= 4
                return (
                  <Rect key={n.d} x={x} y={n.h ? y(n.h) : H - padB - 2} width={bw * 0.64} height={n.h ? H - padB - y(n.h) : 2} rx={3} fill={usable ? c.termH : c.lineStrong} />
                )
              })}
              {WEAR_NIGHTS.map((n, i) =>
                i % 2 === 0 ? (
                  <SvgText key={`l${n.d}`} x={padL + i * bw + bw / 2} y={H - 5} fontSize={10} fontFamily={fonts.mono} fill={c.ink3} textAnchor="middle">
                    {n.d}
                  </SvgText>
                ) : null,
              )}
            </Svg>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s2, rowGap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TermDot term="H" />
              <Meta size={14}>Healthspan signal · usable night</Meta>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.lineStrong }} />
              <Meta size={14}>Not counted</Meta>
            </View>
          </View>
        </Card>
        <Card tone="raised" style={{ gap: space.s1 + 4 }}>
          {(
            [
              [true, 'Wear time', `${wornNights} of 14 nights`, 'Enough for sleep regularity and HRV this fortnight.'],
              [false, 'Gaps', `${gaps.length} nights`, `No data on ${gaps.map((g) => g.d).join(' and ')} Jan: ring charging. Not imputed.`],
              [false, 'Short nights', `${short.length} ${short.length === 1 ? 'night' : 'nights'}`, `${short[0]?.d ?? '—'} Jan: 3.2 h worn. Kept, not used for HRV.`],
              [true, 'Source overlap', 'Sleep from Oura', 'Apple Health sleep is off, so there is one source of truth for sleep.'],
              [true, 'Freshness', 'Under 72 h', 'Signals older than 72 hours are marked stale and never pick today’s action.'],
            ] as [boolean, string, string, string][]
          ).map(([ok, label, value, note]) => (
            <CheckLine key={label} icon={ok ? 'check' : 'alert-circle'}>
              <View style={{ gap: 2 }}>
                <Body>
                  {label} · <Mono tone="ink" size={15}>{value}</Mono>
                </Body>
                <Meta size={14}>{note}</Meta>
              </View>
            </CheckLine>
          ))}
        </Card>
      </View>

      {/* Also works with */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Also works with</SectionTitle>
        <Body tone="ink2">Change rings, keep your history.</Body>
        {others.map((d) => (
          <Card key={d.id} tone="outline" style={{ gap: space.s1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name={iconFor(d.id)} size={20} color={c.ink2} />
              <View style={{ flex: 1 }}>
                <Body weight="medium">{d.name}</Body>
                <Meta size={14}>{d.via}</Meta>
              </View>
            </View>
            <Meta>{d.note}</Meta>
            <Meta size={14} tone="ink3">
              {d.signals.join(' · ')}
            </Meta>
            {d.state === 'android' && !isAndroid ? (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Icon name="smartphone" size={15} color={c.ink3} />
                <Meta size={14} tone="ink3" style={{ flex: 1 }}>
                  Connect from Joy OS on an Android phone.
                </Meta>
              </View>
            ) : (
              <Button size="sm" variant="secondary" icon="link" onPress={() => setConnect(d)}>
                {`Connect ${d.name}`}
              </Button>
            )}
          </Card>
        ))}
      </View>

      <Sheet
        open={!!connect}
        onClose={() => {
          setConnect(null)
          setLinking(false)
        }}
        title={`Connect ${connect?.name ?? ''}`}
        footer={
          <Button
            variant="ink"
            block
            icon="link"
            disabled={linking}
            onPress={() => {
              if (!connect) return
              const d = connect
              setLinking(true)
              setTimeout(() => {
                setDevices((ds) => ds.map((x) => (x.id === d.id ? { ...x, state: 'connected' as const, lastSync: 'Just now', freshness: 'fresh' as const } : x)))
                setLinking(false)
                setConnect(null)
                setToast(`${d.name} connected${d.via.startsWith('via') ? ` ${d.via}` : ''}. The first sync can take up to an hour.`)
              }, 1000)
            }}
          >
            {linking ? 'Connecting…' : 'Continue to sign in (specimen)'}
          </Button>
        }
      >
        {connect ? (
          <>
            <Body>{`You will sign in to ${connect.name} on its own page and choose what to share. Joy OS never sees your password.`}</Body>
            <Eyebrow>What we would read</Eyebrow>
            {connect.signals.map((s) => (
              <CheckLine key={s}>{s}</CheckLine>
            ))}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <Eyebrow>Feeds</Eyebrow>
              {connect.terms.map((t) => (
                <TermChip key={t} term={t} />
              ))}
            </View>
            <Meta size={14} tone="ink3">Each type is a separate permission you can switch off. Raw samples are stored with their source.</Meta>
          </>
        ) : null}
      </Sheet>

      <Sheet
        open={!!disconnect}
        onClose={() => setDisconnect(null)}
        title={`Disconnect ${disconnect?.name ?? ''}?`}
        footer={
          <View style={{ flexDirection: 'row', gap: space.s1, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onPress={() => setDisconnect(null)}>
              Keep connected
            </Button>
            <Button
              variant="ink"
              onPress={() => {
                if (disconnect) {
                  const d = disconnect
                  setDevices((ds) => ds.map((x) => (x.id === d.id ? { ...x, state: 'available' as const } : x)))
                  setToast(`${d.name} disconnected.`)
                }
                setDisconnect(null)
              }}
            >
              Disconnect
            </Button>
          </View>
        }
      >
        <Body>We stop reading new data within a minute. What we already have stays in your record unless you ask us to erase it in the Trust centre.</Body>
      </Sheet>

      <Sheet open={!!toast} onClose={() => setToast(null)} title="Devices" footer={<Button variant="secondary" block onPress={() => setToast(null)}>Close</Button>}>
        <Body>{toast}</Body>
      </Sheet>
    </Screen>
  )
}
