import { useState } from 'react'
import { View } from 'react-native'
import { Body, Button, Card, DaybreakButton, Eyebrow, Icon, Meta, Mono, Pill, Screen, ScreenHeader, SectionTitle, Segmented, Serif, Sheet, TermChip, Title, Toggle, fmtDate } from '@/components'
import { CIRCLE } from '@/shared/platform'
import { brand, palettes } from '@/theme/tokens'
import { useTheme } from '@/theme/ThemeProvider'
import { CIRCLE_NEXT, CIRCLE_SESSIONS, OTHER_CIRCLES, PRACTICE_CONTENT, SALONS } from '@/screens/b/journeyData'
import { accountStore, useStore } from '@/screens/b/bStore'
import { CheckLine, Done, TimelineStep, memberOnly } from '@/screens/b/parts'
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
  const [acct, setAcct] = useStore(accountStore)
  const setCircle = (p: Partial<typeof acct.circle>) => setAcct((a) => ({ ...a, circle: { ...a.circle, ...p } }))
  const [requested, setRequested] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const t = useDict(CIRCLES)
  const tc = useCommon()
  const tx = useTx()
  const prompt = PRACTICE_CONTENT.find((p) => p.week === CIRCLE_NEXT.week)!
  // Avatars sit on fixed Spectrum grounds with Paper initials in both schemes (as on Today).
  const L = palettes.light
  const tones = [L.termR, L.termP, L.termF, L.termH, L.termB, brand.slate, L.termR, L.termP]

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
          {CIRCLE.members.map((m, i) => (
            <View key={m} style={{ width: '25%', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: tones[i], alignItems: 'center', justifyContent: 'center', borderWidth: m === 'Arjun' ? 2 : 0, borderColor: c.ink }}>
                <Mono size={15} color={L.onInk}>
                  {m[0]}
                </Mono>
              </View>
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
        <DaybreakButton icon="video" onPress={() => setJoinOpen(true)}>
          {t('join')}
        </DaybreakButton>
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
              <Mono size={14} tone="ink2">{s.when}</Mono> · {s.where}
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

      <Sheet open={joinOpen} onClose={() => setJoinOpen(false)} title={t('sheetTitle')} footer={<Button variant="ink" block onPress={() => setJoinOpen(false)}>{acct.circle.mode === 'audio' ? t('doneAudio') : t('doneSee')}</Button>}>
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
    </Screen>
  )
}
