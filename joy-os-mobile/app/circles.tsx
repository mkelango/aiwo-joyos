import { useState } from 'react'
import { View } from 'react-native'
import { Body, Button, Card, DaybreakButton, Eyebrow, Icon, Meta, Mono, Pill, Screen, ScreenHeader, SectionTitle, Segmented, Serif, Sheet, TermChip, Title, Toggle, fmtDate } from '@/components'
import { CIRCLE } from '@/shared/platform'
import { brand, palettes } from '@/theme/tokens'
import { useTheme } from '@/theme/ThemeProvider'
import { CIRCLE_NEXT, CIRCLE_SESSIONS, OTHER_CIRCLES, PRACTICE_CONTENT, SALONS } from '@/screens/b/journeyData'
import { accountStore, useStore } from '@/screens/b/bStore'
import { CheckLine, Done, TimelineStep } from '@/screens/b/parts'

// CIRCLES (Memo p.21): the circle of eight — the same eight people and a lead, Monday at
// 7 pm, thirty minutes, for the ninety days. First names only, cameras optional, nothing
// ranked. Other circles and salons by invitation. One Daybreak: join Monday's call.

export default function Circles() {
  const { c, space } = useTheme()
  const [joinOpen, setJoinOpen] = useState(false)
  const [acct, setAcct] = useStore(accountStore)
  const setCircle = (p: Partial<typeof acct.circle>) => setAcct((a) => ({ ...a, circle: { ...a.circle, ...p } }))
  const [requested, setRequested] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const prompt = PRACTICE_CONTENT.find((p) => p.week === CIRCLE_NEXT.week)!
  // Avatars sit on fixed Spectrum grounds with Paper initials in both schemes (as on Today).
  const L = palettes.light
  const tones = [L.termR, L.termP, L.termF, L.termH, L.termB, brand.slate, L.termR, L.termP]

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={CIRCLE.name}
        title={
          <>
            Eight people, one <Serif>Monday</Serif>.
          </>
        }
        lead={`The same eight, with ${CIRCLE.coach.split(' ')[0]}, every ${CIRCLE.when} for thirty minutes, for the ninety days. Formed in person before checkout.`}
      />

      {/* Next call */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: space.s1 }}>
          <Eyebrow tone="daybreak">Next call</Eyebrow>
          <Pill>{`Week ${CIRCLE_NEXT.week} of the Practice`}</Pill>
        </View>
        <View style={{ gap: 4 }}>
          <Title size={26}>{`Monday ${fmtDate(CIRCLE_NEXT.date)}`}</Title>
          <Meta>
            <Mono tone="ink2">{CIRCLE_NEXT.time}</Mono> · <Mono tone="ink2">{String(CIRCLE.callMinutes)}</Mono> minutes · video or audio · with {CIRCLE.coach}
          </Meta>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: space.s1 }} accessible accessibilityLabel={`In this circle: ${CIRCLE.members.join(', ')}, with ${CIRCLE.coach}.`}>
          {CIRCLE.members.map((m, i) => (
            <View key={m} style={{ width: '25%', alignItems: 'center', gap: 4 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: tones[i], alignItems: 'center', justifyContent: 'center', borderWidth: m === 'Arjun' ? 2 : 0, borderColor: c.ink }}>
                <Mono size={15} color={L.onInk}>
                  {m[0]}
                </Mono>
              </View>
              <Meta size={13} tone={m === 'Arjun' ? 'ink' : 'ink2'}>
                {m === 'Arjun' ? 'You' : m}
              </Meta>
            </View>
          ))}
        </View>
        <Card tone="sunk" padding={16} style={{ gap: 6 }}>
          <Eyebrow>This week’s prompt, from Priya</Eyebrow>
          <Body>
            <Serif>“{prompt.circlePrompt}”</Serif>
          </Body>
        </Card>
        <DaybreakButton icon="video" onPress={() => setJoinOpen(true)}>
          Join Monday’s call
        </DaybreakButton>
        <Meta align="center" size={14}>
          The room opens ten minutes before. Audio only is always fine.
        </Meta>
      </Card>

      {/* Agreements */}
      <Card tone="outline" style={{ gap: space.s1 + 4 }}>
        <Eyebrow>What the eight of you agreed</Eyebrow>
        {['First names only. Cameras optional.', 'What is said in the circle stays in the circle. Nothing is recorded.', 'No one is ranked, scored or compared. There is no leaderboard.', 'Missing a Monday is fine. The circle is there the next week.'].map((x) => (
          <CheckLine key={x}>
            <Body>{x}</Body>
          </CheckLine>
        ))}
        <Meta size={14} tone="ink3">If something said in the circle worries Priya, she reaches out to that person privately, never in front of the group.</Meta>
      </Card>

      {/* History */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>The weeks so far</SectionTitle>
        <Card tone="raised">
          {CIRCLE_SESSIONS.map((s, i) => (
            <TimelineStep key={s.week} index={i} state="done" last={i === CIRCLE_SESSIONS.length - 1}>
              <View accessible accessibilityLabel={`${s.week === 0 ? 'Formed' : `Week ${s.week}`}, ${fmtDate(s.date)}: ${s.title}. ${s.attended} of 8 there. ${s.note}`} style={{ gap: 4 }}>
                <Eyebrow>{s.week === 0 ? `Formed · ${fmtDate(s.date)}` : `Week ${s.week} · ${fmtDate(s.date)}`}</Eyebrow>
                <Body weight="medium">{s.title}</Body>
                <Meta>{s.note}</Meta>
                <Meta size={13} tone="ink3">
                  <Mono size={13} tone="ink3">{`${s.attended}/8`}</Mono> there · notes by Priya, first names only
                </Meta>
              </View>
            </TimelineStep>
          ))}
        </Card>
      </View>

      {/* Other circles */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Other circles</SectionTitle>
        <Body tone="ink2">Formed by life stage and language. Join one, or none; your circle of eight stays the same.</Body>
        {OTHER_CIRCLES.map((oc) => {
          const done = requested[oc.id]
          return (
            <Card key={oc.id} tone="raised" style={{ gap: space.s1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s1 }}>
                <Body weight="medium" style={{ flex: 1 }}>
                  {oc.name}
                </Body>
                <Pill tone={oc.status === 'Invited' ? 'daybreak' : oc.status === 'Member' ? 'ink' : 'neutral'}>{oc.status}</Pill>
              </View>
              <Meta tone="ink">{oc.who}</Meta>
              <Meta size={14}>{`${oc.when} · led by ${oc.lead}`}</Meta>
              <Meta size={14} tone="ink3">
                {oc.note}
              </Meta>
              {oc.status === 'Member' ? null : done ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }} accessibilityLiveRegion="polite">
                  <Icon name="check" size={15} color={c.ink2} />
                  <Meta>{oc.status === 'Invited' ? 'Accepted. Dr Anjali will write before the first evening.' : `Requested. ${oc.lead.split(' ').slice(-2).join(' ')} will reply within two days.`}</Meta>
                </View>
              ) : (
                <Button size="sm" variant="secondary" onPress={() => setRequested((r) => ({ ...r, [oc.id]: true }))}>
                  {oc.status === 'Invited' ? 'Accept the invitation' : 'Ask to join'}
                </Button>
              )}
            </Card>
          )
        })}
      </View>

      {/* Salons */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Connections salons</SectionTitle>
        <Body tone="ink2">Small evenings with a host and a theme. In person, never recorded.</Body>
        {SALONS.map((s) => (
          <Card key={s.id} tone="sunk" style={{ gap: 6 }}>
            <TermChip term={s.term} withSpace />
            <Title size={22}>{s.title}</Title>
            <Meta tone="ink">{`Hosted by ${s.host}`}</Meta>
            <Meta size={14}>
              <Mono size={14} tone="ink2">{s.when}</Mono> · {s.where}
            </Meta>
            <Meta size={14} tone="ink3">
              <Mono size={14} tone="ink3">{String(s.seats)}</Mono> seats
            </Meta>
            <Button size="sm" variant={saved[s.id] ? 'ghost' : 'secondary'} icon={saved[s.id] ? 'check' : 'bookmark'} onPress={() => setSaved((x) => ({ ...x, [s.id]: !x[s.id] }))}>
              {saved[s.id] ? 'Seat requested · tap to undo' : 'Request a seat'}
            </Button>
          </Card>
        ))}
      </View>

      <Sheet open={joinOpen} onClose={() => setJoinOpen(false)} title="Monday’s circle" footer={<Button variant="ink" block onPress={() => setJoinOpen(false)}>{acct.circle.mode === 'audio' ? 'Done · audio only' : 'Done · see you Monday'}</Button>}>
        <Body>{`The room opens at 18:50 on Monday ${fmtDate(CIRCLE_NEXT.date)}, for thirty minutes with ${CIRCLE.coach.split(' ')[0]} and the same eight.`}</Body>
        <Card tone="sunk" padding={16} style={{ gap: 6 }}>
          <Eyebrow>Room</Eyebrow>
          <Mono tone="ink">{CIRCLE_NEXT.room}</Mono>
        </Card>
        <Eyebrow>Join by</Eyebrow>
        <Segmented<'video' | 'audio'>
          value={acct.circle.mode}
          onChange={(v) => setCircle({ mode: v })}
          items={[
            { value: 'video', label: 'Video' },
            { value: 'audio', label: 'Audio only' },
          ]}
        />
        <Meta size={14}>{acct.circle.mode === 'audio' ? 'Remembered: you join by audio, camera off. Good on a train or a slow signal.' : 'Remembered: you join by video. Cameras are optional; first names only.'}</Meta>
        <Toggle checked={acct.circle.remind} onChange={(v) => setCircle({ remind: v })} label="Remind me an hour before" description="At 18:00, outside your quiet hours. The only reminder for the circle." />
        {acct.circle.calendar ? (
          <View style={{ gap: 4 }}>
            <Done>Added to your calendar · Mondays 19:00–19:30 until Day 90</Done>
            <Button variant="link" onPress={() => setCircle({ calendar: false })}>
              Remove from calendar
            </Button>
          </View>
        ) : (
          <Button variant="secondary" icon="calendar" onPress={() => setCircle({ calendar: true })}>
            Add to calendar (specimen)
          </Button>
        )}
        <Meta>If you cannot make it, nothing is counted; Priya will share the week’s notes.</Meta>
      </Sheet>
    </Screen>
  )
}
