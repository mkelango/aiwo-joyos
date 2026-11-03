import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Body, Button, Card, DaybreakButton, Eyebrow, Icon, type IconName, InkSurface, Meta, Mono, Pill, Screen, ScreenHeader, SectionTitle, Segmented, Serif, Sheet, TermChip, Title, Toggle, fmtDate } from '@/components'
import { CIRCLE } from '@/shared/platform'
import { MEMBER } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { palettes } from '@/theme/tokens'
import { useReduceMotion } from '@/lib/store'
import { CAPTIONS, CIRCLE_NEXT, CIRCLE_SESSIONS, OTHER_CIRCLES, PRACTICE_CONTENT, SALONS } from '@/screens/b/journeyData'
import { a11yStore, accountStore, useStore } from '@/screens/b/bStore'
import { CheckLine, Done, TimelineStep, fmtWhen, memberOnly } from '@/screens/b/parts'
import { useDict } from '@/lib/i18n'
import { CIRCLES, OTHER_CIRCLE_TEXT, CIRCLE_STATUS, SALON_TITLE, CIRCLE_PROMPT } from '@/screens/b/i18n/journey'
import { PRACTICE_TITLE, useCommon, useTx } from '@/screens/b/i18n/common'

// CIRCLES (Memo p.21): the circle of eight — the same eight people and a lead, Monday at
// 7 pm, thirty minutes, for the ninety days. First names only, cameras optional, nothing
// ranked. Other circles and salons by invitation. One Daybreak: join Monday's call.

export default memberOnly(Circles)

function Circles() {
  const { c, space } = useTheme()
  const [joinOpen, setJoinOpen] = useState(false)
  // The call room: the waiting room before Monday 18:50, then the call itself (specimen preview).
  const [room, setRoom] = useState<RoomMode | null>(null)
  const [left, setLeft] = useState<RoomMode | null>(null)
  const [acct, setAcct] = useStore(accountStore)
  const setCircle = (p: Partial<typeof acct.circle>) => setAcct((a) => ({ ...a, circle: { ...a.circle, ...p } }))
  const [requested, setRequested] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const t = useDict(CIRCLES)
  const tc = useCommon()
  const tx = useTx()
  const prompt = PRACTICE_CONTENT.find((p) => p.week === CIRCLE_NEXT.week)!
  // Avatars are neutral: the Spectrum is reserved for the six terms, never for people.

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={tx(CIRCLES.eyebrow, CIRCLE.name)}
        title={
          <>
            {t('titleA')}<Serif>{t('titleSerif')}</Serif>{t('titleB')}
          </>
        }
        lead={t('lead', { coach: CIRCLE.coach.split(' ')[0], when: CIRCLE.when })}
      />

      {/* Next call */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.s1 }}>
          <Eyebrow tone="daybreak">{t('nextCall')}</Eyebrow>
          <Pill>{t('weekOf', { n: CIRCLE_NEXT.week })}</Pill>
        </View>
        <View style={{ gap: 4 }}>
          <Title size={26}>{t('monday', { date: fmtDate(CIRCLE_NEXT.date) })}</Title>
          <Meta>
            <Mono tone="ink2">{CIRCLE_NEXT.time}</Mono> · <Mono tone="ink2">{String(CIRCLE.callMinutes)}</Mono>{t('minutesA', { coach: CIRCLE.coach })}
          </Meta>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: space.s1 }} accessible accessibilityLabel={t('inCircle', { list: CIRCLE.members.join(', '), coach: CIRCLE.coach })}>
          {CIRCLE.members.map((m) => (
            <View key={m} style={{ width: '25%', alignItems: 'center', gap: 4 }}>
              {m === 'Arjun' ? (
                <View style={{ borderRadius: 24, borderWidth: 2, borderColor: c.ink }}>
                  <Avatar person={{ name: m, initials: m[0], tone: '' }} size={44} />
                </View>
              ) : (
                <Avatar person={{ name: m, initials: m[0], tone: '' }} size={44} />
              )}
              <Meta size={13} tone={m === 'Arjun' ? 'ink' : 'ink2'}>
                {m === 'Arjun' ? tc('you') : m}
              </Meta>
            </View>
          ))}
        </View>
        <Card tone="sunk" padding={16} style={{ gap: 6 }}>
          <Eyebrow>{t('promptFrom')}</Eyebrow>
          <Body>
            <Serif>“{tx(CIRCLE_PROMPT[prompt.week], prompt.circlePrompt)}”</Serif>
          </Body>
        </Card>
        <DaybreakButton icon="video" onPress={() => { setLeft(null); setJoinOpen(true) }}>
          {t('join')}
        </DaybreakButton>
        {left ? (
          <Card tone="sunk" padding={16} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: 8 }} accessibilityLiveRegion="polite">
              <Icon name="check" size={16} color={c.ink2} />
              <Body style={{ flex: 1 }}>{left === 'live' ? t('leftLive') : t('leftWaiting')}</Body>
            </View>
            <Button variant="link" onPress={() => setLeft(null)} style={{ alignSelf: 'flex-start' }}>
              {t('dismiss')}
            </Button>
          </Card>
        ) : null}
        <Meta align="center" size={14}>
          {t('roomOpens')}
        </Meta>
      </Card>

      {/* Agreements */}
      <Card tone="outline" style={{ gap: space.s1 + 4 }}>
        <Eyebrow>{t('agreed')}</Eyebrow>
        {[t('a1'), t('a2'), t('a3'), t('a4')].map((x) => (
          <CheckLine key={x}>
            <Body>{x}</Body>
          </CheckLine>
        ))}
        <Meta size={14} tone="ink3">{t('worries')}</Meta>
      </Card>

      {/* History */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('weeksSoFar')}</SectionTitle>
        <Card tone="raised">
          {CIRCLE_SESSIONS.map((s, i) => (
            <TimelineStep key={s.week} index={i} state="done" last={i === CIRCLE_SESSIONS.length - 1}>
              <View accessible accessibilityLabel={t('sessionA11y', { label: s.week === 0 ? t('formed') : t('weekN', { n: s.week }), date: fmtDate(s.date), title: s.week === 0 ? tx(CIRCLES.formedAt, s.title) : tx(PRACTICE_TITLE[s.week], s.title), n: s.attended, note: s.note })} style={{ gap: 4 }}>
                <Eyebrow>{s.week === 0 ? `${t('formed')} · ${fmtDate(s.date)}` : `${t('weekN', { n: s.week })} · ${fmtDate(s.date)}`}</Eyebrow>
                <Body weight="medium">{s.week === 0 ? tx(CIRCLES.formedAt, s.title) : tx(PRACTICE_TITLE[s.week], s.title)}</Body>
                <Meta>{s.note}</Meta>
                <Meta size={13} tone="ink3">
                  <Mono size={13} tone="ink3">{`${s.attended}/8`}</Mono>{t('there')}
                </Meta>
              </View>
            </TimelineStep>
          ))}
        </Card>
      </View>

      {/* Other circles */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('others')}</SectionTitle>
        <Body tone="ink2">{t('othersBody')}</Body>
        {OTHER_CIRCLES.map((oc) => {
          const done = requested[oc.id]
          const ot = OTHER_CIRCLE_TEXT[oc.id]
          return (
            <Card key={oc.id} tone="raised" style={{ gap: space.s1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s1 }}>
                <Body weight="medium" style={{ flex: 1 }}>
                  {tx(ot?.name, oc.name)}
                </Body>
                <Pill tone={oc.status === 'Invited' ? 'daybreak' : oc.status === 'Member' ? 'ink' : 'neutral'}>{tx(CIRCLE_STATUS[oc.status], oc.status)}</Pill>
              </View>
              <Meta tone="ink">{tx(ot?.who, oc.who)}</Meta>
              <Meta size={14}>{t('ledBy', { when: tx(ot?.when, oc.when), lead: oc.lead })}</Meta>
              <Meta size={14} tone="ink3">
                {tx(ot?.note, oc.note)}
              </Meta>
              {oc.status === 'Member' ? null : done ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }} accessibilityLiveRegion="polite">
                  <Icon name="check" size={15} color={c.ink2} />
                  <Meta style={{ flexShrink: 1 }}>{oc.status === 'Invited' ? t('accepted') : t('requested', { lead: oc.lead.split(' ').slice(-2).join(' ') })}</Meta>
                </View>
              ) : (
                <Button size="sm" variant="secondary" onPress={() => setRequested((r) => ({ ...r, [oc.id]: true }))}>
                  {oc.status === 'Invited' ? t('accept') : t('ask')}
                </Button>
              )}
            </Card>
          )
        })}
      </View>

      {/* Salons */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('salons')}</SectionTitle>
        <Body tone="ink2">{t('salonsBody')}</Body>
        {SALONS.map((s) => (
          <Card key={s.id} tone="sunk" style={{ gap: 6 }}>
            <TermChip term={s.term} withSpace />
            <Title size={22}>{tx(SALON_TITLE[s.id], s.title)}</Title>
            <Meta tone="ink">{t('hosted', { host: s.host })}</Meta>
            <Meta size={14}>
              <Mono size={14} tone="ink2">{fmtWhen(s)}</Mono> · {s.where}
            </Meta>
            <Meta size={14} tone="ink3">
              <Mono size={14} tone="ink3">{String(s.seats)}</Mono>{t('seats')}
            </Meta>
            <Button size="sm" variant={saved[s.id] ? 'ghost' : 'secondary'} icon={saved[s.id] ? 'check' : 'bookmark'} onPress={() => setSaved((x) => ({ ...x, [s.id]: !x[s.id] }))}>
              {saved[s.id] ? t('seatReq') : t('reqSeat')}
            </Button>
          </Card>
        ))}
      </View>

      <Sheet
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title={t('sheetTitle')}
        footer={
          <View style={{ gap: 8 }}>
            <Button
              variant="ink"
              block
              icon="video"
              onPress={() => {
                setJoinOpen(false)
                // iOS cannot present the room while the sheet is still dismissing.
                setTimeout(() => setRoom('waiting'), 350)
              }}
            >
              {t('openWaiting')}
            </Button>
            <Button variant="secondary" block onPress={() => setJoinOpen(false)}>
              {acct.circle.mode === 'audio' ? t('doneAudio') : t('doneSee')}
            </Button>
          </View>
        }
      >
        <Body>{t('roomAt', { date: fmtDate(CIRCLE_NEXT.date), coach: CIRCLE.coach.split(' ')[0] })}</Body>
        <Card tone="sunk" padding={16} style={{ gap: 6 }}>
          <Eyebrow>{t('room')}</Eyebrow>
          <Mono tone="ink">{CIRCLE_NEXT.room}</Mono>
        </Card>
        <Eyebrow>{t('joinBy')}</Eyebrow>
        <Segmented<'video' | 'audio'>
          value={acct.circle.mode}
          onChange={(v) => setCircle({ mode: v })}
          items={[
            { value: 'video', label: t('video') },
            { value: 'audio', label: t('audioOnly') },
          ]}
        />
        <Meta size={14}>{acct.circle.mode === 'audio' ? t('remAudio') : t('remVideo')}</Meta>
        <Toggle checked={acct.circle.remind} onChange={(v) => setCircle({ remind: v })} label={t('remind')} description={t('remindD')} />
        {acct.circle.calendar ? (
          <View style={{ gap: 4 }}>
            <Done>{t('addedCal')}</Done>
            <Button variant="link" onPress={() => setCircle({ calendar: false })}>
              {t('removeCal')}
            </Button>
          </View>
        ) : (
          <Button variant="secondary" icon="calendar" onPress={() => setCircle({ calendar: true })}>
            {t('addCal')}
          </Button>
        )}
        <Meta>{t('cantMake')}</Meta>
      </Sheet>

      {room ? (
        <CallRoom
          mode={room}
          audioOnly={acct.circle.mode === 'audio'}
          onMode={setRoom}
          onLeave={() => {
            setLeft(room)
            setRoom(null)
          }}
        />
      ) : null}
    </Screen>
  )
}

type RoomMode = 'waiting' | 'live'

// The call room is a dark stage in both themes (warm Ink), so its text uses the dark palette.
const ROOM = palettes.dark

/** The circle call (specimen): no camera or microphone is opened; the room is simulated on this phone. */
function CallRoom({ mode, audioOnly, onMode, onLeave }: { mode: RoomMode; audioOnly: boolean; onMode: (m: RoomMode) => void; onLeave: () => void }) {
  const { space, radius } = useTheme()
  const insets = useSafeAreaInsets()
  const reduce = useReduceMotion()
  const t = useDict(CIRCLES)
  const tx = useTx()
  const [a11y] = useStore(a11yStore)
  const live = mode === 'live'
  const [mic, setMic] = useState(false)
  const [cam, setCam] = useState(!audioOnly)
  const [hand, setHand] = useState(false)
  // Captions start from the member's Accessibility choice in Settings; this toggle is for this call only.
  const [captions, setCaptions] = useState(a11y.captions)
  const [speaker, setSpeaker] = useState(0)
  const [level, setLevel] = useState(0)
  const coach = CIRCLE.coach.split(' ')[0]
  const prompt = PRACTICE_CONTENT.find((p) => p.week === CIRCLE_NEXT.week)!
  const others = CIRCLE.members.filter((m) => m !== MEMBER.firstName)
  // Thomas sends his apologies this week; Deepa is on audio from a train.
  const present = others.filter((m) => m !== 'Thomas')
  const you = { name: MEMBER.firstName, coach: false, you: true }
  const tiles = live ? [{ name: coach, coach: true, you: false }, ...present.map((m) => ({ name: m, coach: false, you: false })), you] : [you]

  // Whoever is speaking moves round the circle (everyone but you).
  useEffect(() => {
    if (!live) return
    const id = setInterval(() => setSpeaker((s) => (s + 1) % (tiles.length - 1)), 3200)
    return () => clearInterval(id)
  }, [live, tiles.length])
  // Mic check: a simulated input level while the mic is on.
  useEffect(() => {
    if (!mic) {
      setLevel(0)
      return
    }
    const id = setInterval(() => setLevel(0.2 + Math.random() * 0.8), 180)
    return () => clearInterval(id)
  }, [mic])

  const speakerName = tiles[speaker]?.name ?? ''
  const caption = CAPTIONS[speakerName] ?? ''
  const tileBg = 'rgba(242,238,232,0.08)'
  const disc = { backgroundColor: ROOM.paperRaised, borderWidth: 1, borderColor: ROOM.lineStrong }

  return (
    <Modal visible transparent={false} animationType={reduce ? 'none' : 'fade'} onRequestClose={onLeave} statusBarTranslucent>
      <InkSurface.Provider value>
        <View
          accessibilityViewIsModal
          accessibilityLabel={live ? t('roomLive') : t('roomWait')}
          style={{ flex: 1, backgroundColor: ROOM.paper, paddingTop: insets.top + space.s1, paddingBottom: insets.bottom + space.s1 }}
        >
          <View style={{ paddingHorizontal: space.gutter, gap: 8 }}>
            <Eyebrow tone="ink3">{tx(CIRCLES.eyebrow, CIRCLE.name)}</Eyebrow>
            <Body weight="medium" accessibilityRole="header">
              {live ? t('roomLive') : t('roomWait')}
            </Body>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {[t('recordingOff'), t('coachModerated'), t('firstNamesOnly'), t('specimen')].map((x) => (
                <View key={x} style={{ borderWidth: 1, borderColor: ROOM.lineStrong, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }}>
                  <Meta size={12} tone="ink2">{x}</Meta>
                </View>
              ))}
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: space.gutter, gap: space.s2 }}>
            {live ? (
              <View style={{ backgroundColor: tileBg, borderRadius: radius.card, padding: 14, gap: 4 }}>
                <Eyebrow tone="ink3">{t('promptLabel')}</Eyebrow>
                <Body>{tx(CIRCLE_PROMPT[prompt.week], prompt.circlePrompt)}</Body>
              </View>
            ) : (
              <View style={{ backgroundColor: tileBg, borderRadius: radius.card, padding: 14, gap: 10 }}>
                <Eyebrow tone="ink3">{t('waitingRoom')}</Eyebrow>
                <Body>{t('waitingOpens')}</Body>
                <Pressable
                  onPress={() => onMode('live')}
                  accessibilityRole="button"
                  style={({ pressed }) => ({ alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1, borderColor: ROOM.lineStrong, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: pressed ? ROOM.paperRaised : undefined })}
                >
                  <Icon name="play" size={15} color={ROOM.ink} />
                  <Body size={15}>{t('previewCall')}</Body>
                </Pressable>
              </View>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {tiles.map((tile, i) => {
                const talking = live && i === speaker && !tile.you
                const off = tile.you ? !cam : tile.name === 'Deepa'
                const micOn = tile.you ? mic : true
                return (
                  <View
                    key={tile.name}
                    accessible
                    accessibilityLabel={`${talking ? t('speaking', { name: tile.name }) : tile.name}${tile.you ? t('youSuffix') : ''}${tile.coach ? t('coachSuffix') : ''}. ${micOn ? t('micOn') : t('micMuted')}. ${off ? t('camOff') : t('camOn')}.${tile.you && hand ? ` ${t('handRaised')}` : ''}`}
                    style={{
                      width: live ? '48.5%' : '100%',
                      aspectRatio: live ? 1.15 : 1.4,
                      borderRadius: radius.card,
                      backgroundColor: off ? ROOM.paperSunk : tileBg,
                      borderWidth: 2,
                      borderColor: talking ? ROOM.daybreak : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {/* Avatars are neutral: first initial only, never a Spectrum colour. */}
                    <View style={[{ width: live ? 56 : 96, height: live ? 56 : 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' }, disc]}>
                      <Mono size={live ? 20 : 32} tone="ink2">{tile.name[0]}</Mono>
                    </View>
                    <View style={{ position: 'absolute', left: 8, bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Icon name={micOn ? 'mic' : 'mic-off'} size={12} color={ROOM.ink2} />
                      <Meta size={12} tone="ink" numberOfLines={1} style={{ flexShrink: 1 }}>
                        {`${tile.name}${tile.you ? t('youSuffix') : ''}${tile.coach ? t('coachSuffix') : ''}`}
                      </Meta>
                    </View>
                    {off ? (
                      <View style={{ position: 'absolute', right: 8, top: 8 }}>
                        <Icon name="video-off" size={13} color={ROOM.ink3} />
                      </View>
                    ) : null}
                    {tile.you && hand ? (
                      <View style={{ position: 'absolute', left: 8, top: 8, backgroundColor: ROOM.ink, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Meta size={12} color={ROOM.paper}>{t('lHand')}</Meta>
                      </View>
                    ) : null}
                  </View>
                )
              })}
            </View>

            {!live ? (
              <View style={{ gap: 8 }} accessibilityLiveRegion="polite">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name={cam ? 'video' : 'video-off'} size={15} color={ROOM.ink2} />
                  <Meta tone="ink">{cam ? t('camWorking') : t('camOff')}</Meta>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name={mic ? 'mic' : 'mic-off'} size={15} color={ROOM.ink2} />
                  <Meta tone="ink">{mic ? t('micOn') : t('micMuted')}</Meta>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 12, width: 96 }} importantForAccessibility="no-hide-descendants">
                    {Array.from({ length: 10 }, (_, i) => (
                      <View key={i} style={{ flex: 1, height: `${30 + i * 7}%`, borderRadius: 1, backgroundColor: i / 10 < level ? ROOM.ink : ROOM.line }} />
                    ))}
                  </View>
                </View>
              </View>
            ) : null}

            {live && hand ? (
              <Meta tone="ink" accessibilityLiveRegion="polite">
                {t('handRaised')}
              </Meta>
            ) : null}
          </ScrollView>

          {live && captions ? (
            <View style={{ marginHorizontal: space.gutter, marginBottom: space.s1, backgroundColor: ROOM.inkGround, borderRadius: radius.card, paddingHorizontal: 14, paddingVertical: 10, gap: 4 }} accessibilityLiveRegion="polite">
              <Body size={15} align="center">
                <Body size={15} tone="ink3">{`${speakerName}: `}</Body>
                {caption}
              </Body>
              <Meta size={12} tone="ink3" align="center">
                {t('captionsNote')}
              </Meta>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: space.s1, paddingHorizontal: space.gutter, paddingTop: space.s1 }}>
            <CallButton on={mic} icon={mic ? 'mic' : 'mic-off'} label={mic ? t('mute') : t('unmute')} short={t('lMic')} onPress={() => setMic((v) => !v)} />
            <CallButton on={cam} icon={cam ? 'video' : 'video-off'} label={cam ? t('camOffBtn') : t('camOnBtn')} short={t('lCam')} onPress={() => setCam((v) => !v)} />
            {live ? <CallButton on={hand} icon="arrow-up-circle" label={hand ? t('lowerHand') : t('raiseHand')} short={t('lHand')} onPress={() => setHand((v) => !v)} /> : null}
            {live ? <CallButton on={captions} icon="type" label={captions ? t('hideCaptions') : t('showCaptions')} short={t('lCaptions')} onPress={() => setCaptions((v) => !v)} /> : null}
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Pressable
                onPress={onLeave}
                accessibilityRole="button"
                accessibilityLabel={live ? t('leave') : t('leaveWaiting')}
                style={({ pressed }) => ({ height: 52, paddingHorizontal: 18, borderRadius: 26, borderWidth: 1, borderColor: ROOM.lineStrong, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: pressed ? ROOM.paperRaised : undefined })}
              >
                <Icon name="phone-off" size={18} color={ROOM.ink} />
                <Body size={15}>{t('leave')}</Body>
              </Pressable>
            </View>
          </View>
        </View>
      </InkSurface.Provider>
    </Modal>
  )
}

function CallButton({ on, icon, label, short, onPress }: { on: boolean; icon: IconName; label: string; short: string; onPress: () => void }) {
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: on }}
        style={({ pressed }) => ({ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? ROOM.ink : pressed ? ROOM.paperRaised : 'rgba(242,238,232,0.14)' })}
      >
        <Icon name={icon} size={20} color={on ? ROOM.paper : ROOM.ink} />
      </Pressable>
      <Meta size={12} tone="ink2">{short}</Meta>
    </View>
  )
}
