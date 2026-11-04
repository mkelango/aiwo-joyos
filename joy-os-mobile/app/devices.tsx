import { useEffect, useRef, useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { router } from 'expo-router'
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg'
import { Body, Button, Card, DaybreakButton, Divider, EmptyIllustration, Eyebrow, Icon, type IconName, Meta, Mono, Pill, Screen, ScreenHeader, SectionTitle, Serif, Sheet, SpecimenTag, TermChip, Toggle } from '@/components'
import { useTheme } from '@/theme/ThemeProvider'
import { palettes } from '@/theme/tokens'
import { useApp } from '@/lib/store'
import { isSpecimenToday } from '@/screens/a/local'
import { LEDGER_TAG } from '@/screens/b/i18n/common'
import { DEVICES, HEALTHKIT_TYPES, WEAR_NIGHTS, type DeviceState } from '@/screens/b/accountData'
import { devicesStore, signalsDownIn, useStore } from '@/screens/b/bStore'
import { CheckLine, memberOnly } from '@/screens/b/parts'
import { MonoNums } from '@/lib/monoNums'
import { useDict } from '@/lib/i18n'
import { DEV, DEVICE_NOTE, SIGNAL_TEXT, HK_TEXT } from '@/screens/b/i18n/devices'
import { useCommon, useTx } from '@/screens/b/i18n/common'

// DEVICES (Signals, Memo p.15–16): Oura by default via Terra, Apple Health with per-type
// HealthKit reads and mindful-minutes write-back, Health Connect on Android, WHOOP, Garmin.
// Freshness and data quality shown plainly; a vendor's readiness, strain or age score never
// enters the Index. One Daybreak: "Sync now".
// The data-quality panel follows what is connected on this screen: the ring's wear chart only
// while the Oura Ring is read, freshness from each device's own state, the sleep sources from the
// devices and HealthKit reads switched on, and an empty state when nothing is connected.

type Device = (typeof DEVICES)[number]

const iconFor = (id: string): IconName => (id === 'apple' || id === 'hc' ? 'smartphone' : id === 'oura' || id === 'ultrahuman' ? 'circle' : 'watch')

export default memberOnly(Devices)

function Devices() {
  const { c, space, fonts } = useTheme()
  // Connections, HealthKit reads and the write-back are kept on the phone, over the specimen.
  const [stored, setStored] = useStore(devicesStore)
  const devices: Device[] = DEVICES.map((d) => (stored.states[d.id] ? { ...d, ...stored.states[d.id] } : d))
  const hk = HEALTHKIT_TYPES.map((x) => (x.id in stored.hk ? { ...x, on: stored.hk[x.id] } : x))
  const writeBack = stored.writeBack
  const setDevice = (id: string, next: { state: DeviceState; lastSync?: string; freshness?: 'fresh' | 'stale' }) => setStored((st) => ({ ...st, states: { ...st.states, [id]: next } }))
  const setHk = (id: string, on: boolean) => setStored((st) => ({ ...st, hk: { ...st.hk, [id]: on } }))
  const setWriteBack = (v: boolean) => setStored((st) => ({ ...st, writeBack: v }))
  const [syncing, setSyncing] = useState(false)
  const [connect, setConnect] = useState<Device | null>(null)
  const [linking, setLinking] = useState(false)
  const [disconnect, setDisconnect] = useState<Device | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Every pending timer is tracked so it can be cancelled (closing the Connect sheet, leaving the screen).
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const connectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current = timers.current.filter((x) => x !== id)
      fn()
    }, ms)
    timers.current.push(id)
    return id
  }
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  // iOS cannot present a Modal while another is dismissing: the toast waits for the sheet to close.
  const toastAfterSheet = (msg: string) => later(() => setToast(msg), 350)

  const connected = devices.filter((d) => d.state === 'connected')
  // Signals down (M3): no device connected, or all stale. The Index then takes answers only.
  const sigDown = signalsDownIn(stored)
  const markStale = () => {
    setStored((st) => {
      const states = { ...st.states }
      DEVICES.filter((d) => (st.states[d.id]?.state ?? d.state) === 'connected').forEach((d) => (states[d.id] = { ...(st.states[d.id] ?? { state: 'connected', lastSync: d.lastSync }), state: 'connected', freshness: 'stale' }))
      return { ...st, states }
    })
    setToast(t('markedStale'))
  }
  const others = devices.filter((d) => d.state !== 'connected')
  // Data quality from the devices as they are now.
  const ring = connected.find((d) => d.id === 'oura')
  const staleOnes = connected.filter((d) => d.freshness === 'stale')
  const hkSleep = hk.find((x) => x.id === 'sleep')?.on ?? false
  // Who reads sleep: a device whose signals include sleep; Apple Health only with its sleep read on.
  const sleepSources = connected.filter((d) => (d.id === 'apple' ? hkSleep : d.signals.some((x) => /sleep/i.test(x))))
  const wornNights = WEAR_NIGHTS.filter((n) => n.h >= 4).length
  const gaps = WEAR_NIGHTS.filter((n) => n.h === 0)
  const short = WEAR_NIGHTS.filter((n) => n.h > 0 && n.h < 4)
  const isAndroid = Platform.OS === 'android'
  const t = useDict(DEV)
  const tc = useCommon()
  const tx = useTx()
  const via = (d: Device) => tx(DEVICE_NOTE[d.id]?.via, d.via)
  const note = (d: Device) => tx(DEVICE_NOTE[d.id]?.note, d.note)
  const sigs = (d: Device) => d.signals.map((s) => tx(SIGNAL_TEXT[s], s))
  const lastSync = (d: Device) => (d.lastSync === 'Just now' ? t('justNow') : d.lastSync && DEVICE_NOTE[d.id]?.lastSync?.en === d.lastSync ? tx(DEVICE_NOTE[d.id]?.lastSync, d.lastSync) : d.lastSync)

  const sync = () => {
    setSyncing(true)
    later(() => {
      setSyncing(false)
      setStored((st) => {
        const states = { ...st.states }
        DEVICES.filter((d) => (st.states[d.id]?.state ?? d.state) === 'connected').forEach((d) => (states[d.id] = { state: 'connected', lastSync: 'Just now', freshness: 'fresh' }))
        return { ...st, states }
      })
      setToast(t('synced'))
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
        eyebrow={t('eyebrow')}
        title={
          <>
            {t('titleA')}<Serif>{t('titleSerif')}</Serif>{t('titleB')}
          </>
        }
        lead={t('lead')}
      />

      <DaybreakButton icon="refresh-cw" onPress={sync} disabled={syncing}>
        {syncing ? t('syncing') : t('syncNow')}
      </DaybreakButton>

      {sigDown ? (
        <Card tone="outline" style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityLiveRegion="polite">
            <Icon name="wifi-off" size={18} color={c.ink2} />
            <Body weight="medium">{t('sigDownTitle')}</Body>
          </View>
          <Meta>{connected.length === 0 ? t('sigDownNone') : t('sigDownStale')}</Meta>
          <Meta size={14} tone="ink3">{t('sigDownNoFall')}</Meta>
        </Card>
      ) : connected.length ? (
        <Button variant="link" onPress={markStale} style={{ alignSelf: 'flex-start' }}>
          {t('markStale')}
        </Button>
      ) : null}

      <Card tone="sunk" style={{ flexDirection: 'row', gap: 12 }}>
        <Icon name="shield-off" size={20} color={c.ink2} />
        <Meta style={{ flex: 1 }}>
          <Meta tone="ink" weight="semibold">
            {t('noVendor')}
          </Meta>{' '}
          {t('noVendorBody')}
        </Meta>
      </Card>

      {/* Connected */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>{t('readingNow')}</SectionTitle>
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
                  {d.isDefault ? <Pill tone="daybreak">{t('default')}</Pill> : null}
                </View>
                <Meta size={14}>{via(d)}</Meta>
              </View>
              <Pill tone={d.freshness === 'fresh' ? 'ink' : 'neutral'}>{d.freshness === 'fresh' ? t('fresh') : t('stale')}</Pill>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="clock" size={14} color={c.ink3} />
              <Meta size={14}>
                {t('lastSync')}<Mono size={14} tone="ink2">{syncing ? t('syncingLower') : lastSync(d) ?? '—'}</Mono>
              </Meta>
            </View>
            <Meta>{note(d)}</Meta>
            <Meta size={14} tone="ink3">
              {sigs(d).join(' · ')}
            </Meta>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <Eyebrow>{t('feeds')}</Eyebrow>
              {d.terms.map((t) => (
                <TermChip key={t} term={t} />
              ))}
            </View>
            {d.id === 'apple' ? (
              <View style={{ gap: space.s2, marginTop: space.s1 }}>
                <Divider />
                <Eyebrow>{t('hkRead')}</Eyebrow>
                {hk.map((x) => (
                  <Toggle key={x.id} checked={x.on} onChange={(v) => setHk(x.id, v)} label={tx(HK_TEXT[x.id], x.label)} />
                ))}
                <Divider />
                <Eyebrow>{t('writeBack')}</Eyebrow>
                <Toggle checked={writeBack} onChange={setWriteBack} label={t('mindful')} description={t('mindfulD')} />
              </View>
            ) : null}
            <Button size="sm" variant="ghost" onPress={() => setDisconnect(d)}>
              {t('disconnect')}
            </Button>
          </Card>
        ))}
      </View>

      {/* Data quality */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('quality')}</SectionTitle>
        <Body tone="ink2">{t('qualityBody')}</Body>
        {connected.length === 0 ? (
          <Card tone="sunk" style={{ gap: space.s1, alignItems: 'flex-start' }}>
            <EmptyIllustration kind="generic" />
            <Meta>{t('qNoDevice')}</Meta>
          </Card>
        ) : !ring ? (
          <Card tone="sunk">
            <Meta>{t('qNoRing')}</Meta>
          </Card>
        ) : (
        <Card tone="raised" style={{ gap: space.s2 }}>
          <Meta>
            <MonoNums text={t('wearBody')} />
          </Meta>
          <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={t('wearA11y', { n: wornNights, gaps: gaps.map((g) => t('jan', { d: g.d })).join(t('and')), short: short.map((s) => t('jan', { d: s.d })).join(', ') })}
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
                  <Rect key={n.d} x={x} y={n.h ? y(n.h) : H - padB - 2} width={bw * 0.64} height={n.h ? H - padB - y(n.h) : 2} rx={3} fill={usable ? c.ink2 : c.lineStrong} />
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
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.ink2 }} />
              <Meta size={14}>{t('usable')}</Meta>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.lineStrong }} />
              <Meta size={14}>{t('notCounted')}</Meta>
            </View>
          </View>
        </Card>
        )}
        {connected.length ? (
        <Card tone="raised" style={{ gap: space.s1 + 4 }}>
          {(
            [
              // Wear, gaps and short nights describe the ring's nights: shown only while it is read.
              ...(ring
                ? ([
                    [true, t('qWear'), t('qWearV', { n: wornNights }), t('qWearN')],
                    [false, t('qGaps'), t('qGapsV', { n: gaps.length }), t('qGapsN', { list: gaps.map((g) => g.d).join(t('and')) })],
                    [false, t('qShort'), `${short.length} ${short.length === 1 ? t('night') : t('nights')}`, t('qShortN', { d: short[0]?.d ?? '—' })],
                  ] as [boolean, string, string, string][])
                : []),
              sleepSources.length === 0
                ? [false, t('qOverlap'), t('qOverlapNone'), t('qOverlapNoneN')]
                : sleepSources.length === 1
                  ? [true, t('qOverlap'), sleepSources[0].id === 'oura' ? t('qOverlapV') : t('qOverlapOne', { name: sleepSources[0].name }), connected.some((d) => d.id === 'apple') && sleepSources[0].id !== 'apple' ? t('qOverlapN') : t('qOverlapOneN', { name: sleepSources[0].name })]
                  : [false, t('qOverlap'), t('qOverlapTwo'), t('qOverlapTwoN', { list: sleepSources.map((d) => d.name).join(t('and')), first: (sleepSources.find((d) => d.isDefault) ?? sleepSources[0]).name })],
              staleOnes.length
                ? [false, t('qFresh'), t('qFreshStale'), t('qFreshStaleN', { list: staleOnes.map((d) => d.name).join(t('and')) })]
                : [true, t('qFresh'), t('qFreshV'), t('qFreshN')],
            ] as [boolean, string, string, string][]
          ).map(([ok, label, value, note]) => (
            <CheckLine key={label} icon={ok ? 'check' : 'alert-circle'}>
              <View style={{ gap: 2 }}>
                <Body>
                  {label} · <Mono tone="ink" size={15}>{value}</Mono>
                </Body>
                <Meta size={14}>
                  <MonoNums text={note} />
                </Meta>
              </View>
            </CheckLine>
          ))}
        </Card>
        ) : null}
      </View>

      {/* The watch: Joy Ledger complication with a quick add */}
      <WatchComplication />

      {/* Also works with */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('also')}</SectionTitle>
        <Body tone="ink2">{t('alsoBody')}</Body>
        {others.map((d) => (
          <Card key={d.id} tone="outline" style={{ gap: space.s1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name={iconFor(d.id)} size={20} color={c.ink2} />
              <View style={{ flex: 1 }}>
                <Body weight="medium">{d.name}</Body>
                <Meta size={14}>{via(d)}</Meta>
              </View>
            </View>
            <Meta>{note(d)}</Meta>
            <Meta size={14} tone="ink3">
              {sigs(d).join(' · ')}
            </Meta>
            {d.state === 'android' && !isAndroid ? (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Icon name="smartphone" size={15} color={c.ink3} />
                <Meta size={14} tone="ink3" style={{ flex: 1 }}>
                  {t('androidOnly')}
                </Meta>
              </View>
            ) : (
              <Button size="sm" variant="secondary" icon="link" onPress={() => setConnect(d)}>
                {t('connectName', { name: d.name })}
              </Button>
            )}
          </Card>
        ))}
      </View>

      <Sheet
        open={!!connect}
        onClose={() => {
          // Dismissing the sheet cancels the connection that was under way.
          if (connectTimer.current) {
            clearTimeout(connectTimer.current)
            timers.current = timers.current.filter((x) => x !== connectTimer.current)
            connectTimer.current = null
          }
          setConnect(null)
          setLinking(false)
        }}
        title={t('connectName', { name: connect?.name ?? '' })}
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
              connectTimer.current = later(() => {
                connectTimer.current = null
                setDevice(d.id, { state: 'connected', lastSync: 'Just now', freshness: 'fresh' })
                setLinking(false)
                setConnect(null)
                toastAfterSheet(t('connectedToast', { name: d.name, via: d.via.startsWith('via') ? ` ${via(d)}` : '' }))
              }, 1000)
            }}
          >
            {linking ? t('connecting') : t('continueSignIn')}
          </Button>
        }
      >
        {connect ? (
          <>
            <Body>{t('signInOwn', { name: connect.name })}</Body>
            <Eyebrow>{t('wouldRead')}</Eyebrow>
            {connect.signals.map((s) => (
              <CheckLine key={s}>{tx(SIGNAL_TEXT[s], s)}</CheckLine>
            ))}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <Eyebrow>{t('feeds')}</Eyebrow>
              {connect.terms.map((t) => (
                <TermChip key={t} term={t} />
              ))}
            </View>
            <Meta size={14} tone="ink3">{t('eachType')}</Meta>
          </>
        ) : null}
      </Sheet>

      <Sheet
        open={!!disconnect}
        onClose={() => setDisconnect(null)}
        title={t('disconnectQ', { name: disconnect?.name ?? '' })}
        footer={
          <View style={{ flexDirection: 'row', gap: space.s1, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onPress={() => setDisconnect(null)}>
              {t('keepConnected')}
            </Button>
            <Button
              variant="ink"
              onPress={() => {
                if (disconnect) {
                  const d = disconnect
                  // Health Connect goes back to "Android only"; the rest can be connected again.
                  setDevice(d.id, { state: DEVICES.find((x) => x.id === d.id)?.state === 'android' ? 'android' : 'available' })
                  setDisconnect(null)
                  toastAfterSheet(t('disconnected', { name: d.name }))
                } else setDisconnect(null)
              }}
            >
              {t('disconnect')}
            </Button>
          </View>
        }
      >
        <Body>{t('stopReading')}</Body>
      </Sheet>

      <Sheet open={!!toast} onClose={() => setToast(null)} title={t('devices')} footer={<Button variant="secondary" block onPress={() => setToast(null)}>{tc('close')}</Button>}>
        <Body>{toast}</Body>
      </Sheet>
    </Screen>
  )
}

// The watch face is a dark ground in both themes (warm Ink), like a real watch face.
const FACE = palettes.dark
const WATCH_TAGS = ['People', 'Food', 'Rest', 'Nature', 'Movement', 'Music']

/**
 * A simulated watch with the Joy Ledger complication. A tap opens the quick add; a tag adds a
 * real entry to the Ledger in the app store (the same one the phone's Ledger shows).
 */
function WatchComplication() {
  const { c, space } = useTheme()
  const t = useDict(DEV)
  const tx = useTx()
  const { ledger, addLedger } = useApp()
  const [stored, setStored] = useStore(devicesStore)
  const on = stored.complication !== false
  const [mode, setMode] = useState<'face' | 'pick' | 'kept'>('face')
  const [kept, setKept] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  const today = ledger.filter(isSpecimenToday).length
  const countLabel = today === 0 ? t('watchToday0') : today === 1 ? t('watchToday1') : t('watchTodayN', { n: today })
  const tag = (tg: string) => tx(LEDGER_TAG[tg], tg)
  const now = new Date()
  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const add = (tg: string) => {
    const h = new Date().getHours()
    // The prompt of the day this moment answers: after lunch, late afternoon or the evening.
    addLedger({ prompt: h < 15 ? 1 : h < 19 ? 2 : 3, tags: [tg] })
    setKept(tg)
    setMode('kept')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setMode('face'), 2600)
  }

  return (
    <View style={{ gap: space.s2 }}>
      <View style={{ gap: 8 }}>
        <SectionTitle>{t('watchTitle')}</SectionTitle>
        <SpecimenTag />
      </View>
      <Body tone="ink2">{t('watchBody')}</Body>
      <Card tone="raised" style={{ gap: space.s2, alignItems: 'stretch' }}>
        <View style={{ alignItems: 'center' }}>
          {/* The watch */}
          <View
            accessible={mode === 'face'}
            accessibilityLabel={t('watchA11y', { count: countLabel })}
            style={{ width: 196, height: 232, borderRadius: 52, backgroundColor: FACE.inkGround, borderWidth: 6, borderColor: FACE.lineStrong, padding: 16, justifyContent: 'center' }}
          >
            {mode === 'face' ? (
              <View style={{ alignItems: 'center', gap: 10 }}>
                <Mono size={34} color={FACE.ink}>{clock}</Mono>
                {on ? (
                  <Pressable
                    onPress={() => setMode('pick')}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('watchOpen')}. ${t('watchLedger')}, ${countLabel}`}
                    style={({ pressed }) => ({ width: 92, height: 92, borderRadius: 46, borderWidth: 3, borderColor: FACE.ink2, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? FACE.paperRaised : FACE.paper, gap: 2 })}
                  >
                    <Mono size={22} color={FACE.ink}>{String(today)}</Mono>
                    <Meta size={11} color={FACE.ink2} align="center" numberOfLines={1}>
                      {t('watchLedger')}
                    </Meta>
                  </Pressable>
                ) : (
                  <Meta size={12} color={FACE.ink3} align="center">
                    {t('watchOff')}
                  </Meta>
                )}
                {on ? (
                  <Meta size={11} color={FACE.ink3} align="center">
                    {t('watchTap')}
                  </Meta>
                ) : null}
              </View>
            ) : mode === 'pick' ? (
              <View style={{ gap: 8 }}>
                <Body size={14} color={FACE.ink} align="center">
                  {t('watchAsk')}
                </Body>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {WATCH_TAGS.map((tg) => (
                    <Pressable
                      key={tg}
                      onPress={() => add(tg)}
                      accessibilityRole="button"
                      accessibilityLabel={t('watchAddTag', { tag: tag(tg) })}
                      style={({ pressed }) => ({ minWidth: 70, minHeight: 34, paddingHorizontal: 8, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? FACE.lineStrong : FACE.paperRaised })}
                    >
                      <Meta size={12} color={FACE.ink} numberOfLines={1}>
                        {tag(tg)}
                      </Meta>
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={() => setMode('face')} accessibilityRole="button" accessibilityLabel={t('watchCancel')} hitSlop={6} style={{ alignSelf: 'center', padding: 4 }}>
                  <Icon name="x" size={16} color={FACE.ink2} />
                </Pressable>
              </View>
            ) : (
              <View style={{ alignItems: 'center', gap: 8 }} accessibilityLiveRegion="polite">
                <Icon name="check" size={28} color={FACE.ink} />
                <Body size={15} color={FACE.ink} align="center">
                  {t('watchKept', { tag: kept ? tag(kept) : '' })}
                </Body>
              </View>
            )}
          </View>
          <Meta size={13} tone="ink3" style={{ marginTop: 8 }}>
            {t('watchSpecimen')}
          </Meta>
        </View>
        {mode === 'kept' && kept ? (
          <Meta accessibilityLiveRegion="polite">{t('watchSaved', { tag: tag(kept) })}</Meta>
        ) : null}
        <Divider />
        <Toggle
          checked={on}
          onChange={(v) => {
            setStored((st) => ({ ...st, complication: v }))
            setMode('face')
          }}
          label={t('complication')}
          description={t('complicationD')}
        />
        <Button variant="link" icon="book-open" onPress={() => router.push('/ledger')} style={{ alignSelf: 'flex-start' }}>
          {t('openLedger')}
        </Button>
      </Card>
    </View>
  )
}
