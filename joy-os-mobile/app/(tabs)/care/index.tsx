import { router } from 'expo-router'
import { useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import {
  AppBar,
  Avatar,
  Body,
  Button,
  Card,
  DaybreakButton,
  Divider,
  Eyebrow,
  Icon,
  ListRow,
  Meta,
  Mono,
  Pill,
  Screen,
  ScreenHeader,
  SectionTitle,
  Serif,
  Sheet,
  SpecimenTag,
  Title,
  fmtDate,
} from '@/components'
import { useApp } from '@/lib/store'
import { MEMBER, TEAM } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { CARE_LADDER, CONSULTS, ERX, PAST_CONSULTS, PEOPLE_DETAIL, RESULTS, THREADS } from '@/screens/b/accountData'
import { accountStore, messagesStore, refCode, useStore } from '@/screens/b/bStore'
import { ChoiceCard, Done, HereMarker, KeyValue, TimelineStep } from '@/screens/b/parts'

// CARE (Memo p.24; Technical Architecture, Care bridge): a person behind every number.
// My people with SLAs, the care ladder, consults, signed results and prescriptions,
// messages (VIVA may draft; a person signs) on their own screen, Tele-MANAS, LifeOS.
// One Daybreak: open messages.

/** Three specimen slots offered for a reschedule, per consult. */
const SLOTS: Record<string, string[]> = {
  cs1: ['Fri 5 Feb 2027 · 08:30', 'Mon 8 Feb 2027 · 18:30', 'Wed 10 Feb 2027 · 12:00'],
  cs2: ['Thu 11 Feb 2027 · 17:00', 'Sat 13 Feb 2027 · 10:00', 'Mon 15 Feb 2027 · 19:00'],
}

const shortName = (name: string) => (name.startsWith('Dr') ? `Dr ${name.split(' ')[1]}` : name.split(' ')[0])

export default function Care() {
  const { c, space } = useTheme()
  const { setCrisisOpen } = useApp()
  const [msgs] = useStore(messagesStore)
  const [acct, setAcct] = useStore(accountStore)
  const [resched, setResched] = useState<(typeof CONSULTS)[number] | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [reschedDone, setReschedDone] = useState(false)
  const [openResult, setOpenResult] = useState<string | null>(RESULTS[0].id)
  const [note, setNote] = useState<string | null>(null)
  const person = (id: string) => TEAM.find((p) => p.id === id)!
  const isUnread = (id: string, n: number) => n > 0 && !msgs.read.includes(id)
  const unread = THREADS.filter((t) => isUnread(t.id, t.unread)).length
  const hereIdx = CARE_LADDER.findIndex((r) => r.status === 'here')

  // Messages live on their own screen, so the crisis intercept is never under a sheet.
  const openThreadFor = (personId: string) => {
    const t = [...msgs.started, ...THREADS].find((x) => x.personId === personId)
    router.push(t ? `/messages?t=${t.id}` : `/messages?compose=1&to=${personId}`)
  }
  const requestSlot = () => {
    if (!resched || !slot) return
    setAcct((a) => ({ ...a, reschedules: { ...a.reschedules, [resched.id]: { slot, ref: refCode('CS') } } }))
    setReschedDone(true)
  }

  return (
    <Screen inTabs top={<AppBar />}>
      <ScreenHeader
        eyebrow="Care · a person behind every number"
        title={
          <>
            Your <Serif>people</Serif>, and the way up when you need more.
          </>
        }
        lead="A coach, a concierge, a physician and a psychologist, each named. VIVA may draft; a person always signs."
      />

      {/* Tele-MANAS */}
      <Card tone="outline" style={{ gap: space.s1 + 4 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="phone" size={18} color={c.ink} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Body weight="medium">If today is heavy, talk to someone now.</Body>
            <Meta>
              Tele-MANAS <Mono tone="ink">14416</Mono> · free · 24 hours · in your language
            </Meta>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
          <Button variant="ink" size="sm" icon="phone" onPress={() => Linking.openURL('tel:14416').catch(() => {})} accessibilityLabel="Call Tele-MANAS 14416">
            Call 14416
          </Button>
          <Button variant="ghost" size="sm" onPress={() => setCrisisOpen(true)}>
            More ways to get help
          </Button>
        </View>
      </Card>

      {/* Messages entry */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Eyebrow>Messages</Eyebrow>
          {unread > 0 ? <Pill tone="daybreak">{unread === 1 ? 'A new reply' : 'New replies'}</Pill> : null}
        </View>
        {THREADS.slice(0, 2).map((t) => {
          const p = person(t.personId)
          const last = t.messages[t.messages.length - 1]
          return (
            <Pressable
              key={t.id}
              onPress={() => router.push(`/messages?t=${t.id}`)}
              accessibilityRole="link"
              accessibilityLabel={`${p.name}, ${t.subject}${isUnread(t.id, t.unread) ? ', new reply' : ''}. ${last.body}`}
              style={({ pressed }) => ({ flexDirection: 'row', gap: 12, opacity: pressed ? 0.7 : 1 })}
            >
              <Avatar person={p} size={40} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Body weight={isUnread(t.id, t.unread) ? 'semibold' : 'regular'} style={{ flex: 1 }} numberOfLines={1}>
                    {p.name}
                  </Body>
                  {isUnread(t.id, t.unread) ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.daybreak }} /> : null}
                </View>
                <Meta size={14} numberOfLines={2}>
                  {last.body}
                </Meta>
              </View>
            </Pressable>
          )
        })}
        <DaybreakButton icon="message-circle" onPress={() => router.push('/messages')}>
          Open messages
        </DaybreakButton>
      </Card>

      {/* My people */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>My people</SectionTitle>
          <SpecimenTag />
        </View>
        <Body tone="ink2">Four people know your name and your ninety days. If something drifts, it becomes a task for one of them, never an alert on your phone.</Body>
        {TEAM.map((p) => {
          const d = PEOPLE_DETAIL[p.id]
          return (
            <Card key={p.id} tone="raised" style={{ gap: space.s1 + 4 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Avatar person={p} size={48} />
                <View style={{ flex: 1 }}>
                  <Body weight="medium">{p.name}</Body>
                  <Meta size={14}>{`${p.role}${d.clinical ? ' · clinical' : ''}`}</Meta>
                </View>
              </View>
              <Body tone="ink2">{d.line}</Body>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s3, rowGap: space.s1 }}>
                <View style={{ gap: 2 }}>
                  <Eyebrow>Next</Eyebrow>
                  <Mono tone="ink">{d.next}</Mono>
                  <Meta size={13}>{d.nextKind}</Meta>
                </View>
                <View style={{ gap: 2 }}>
                  <Eyebrow>Speaks</Eyebrow>
                  <Meta tone="ink">{d.languages}</Meta>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.s1 }}>
                <Button variant="secondary" size="sm" icon="message-circle" onPress={() => openThreadFor(p.id)}>
                  {`Message ${shortName(p.name)}`}
                </Button>
                <Meta size={13} tone="ink3">
                  {d.replies}
                </Meta>
              </View>
            </Card>
          )
        })}
      </View>

      {/* The care ladder */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>The care ladder</SectionTitle>
        <Title size={24}>
          Step up when you need more, <Serif>down</Serif> when you need less.
        </Title>
        <Body tone="ink2">Most of the time the Practice and your circle are enough. An Ease screen above threshold moves you up to a clinician, with a person, within 48 hours.</Body>
        <Card tone="raised">
          <View accessibilityRole="list" accessibilityLabel="Care ladder, from self-care to a ’cation">
            {CARE_LADDER.map((r, i) => {
              const st = r.status === 'used' ? 'done' : r.status === 'here' ? 'now' : 'next'
              return (
                <TimelineStep key={r.key} index={i} state={st} last={i === CARE_LADDER.length - 1}>
                  <View accessible accessibilityLabel={`Rung ${i + 1}, ${r.name}${r.status === 'here' ? ', you are here' : ''}. ${r.who}. ${r.what}`} style={{ gap: 4 }}>
                    <Body weight="medium" tone={st === 'next' ? 'ink2' : 'ink'}>
                      {r.name}
                    </Body>
                    {r.status === 'here' ? <HereMarker label="You are here" /> : null}
                    <Meta tone="ink">{r.who}</Meta>
                    <Meta>{r.what}</Meta>
                  </View>
                </TimelineStep>
              )
            })}
          </View>
          <Divider style={{ marginVertical: space.s2 }} />
          <Meta>{`You use rungs 1–${hereIdx + 1} today. Dr Meera signed your Clinical-grade Index in October; Priya has asked Dr Sanjay for a first conversation about sleep.`}</Meta>
        </Card>
      </View>

      {/* Consults */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Consults · coming up</SectionTitle>
        {CONSULTS.map((cs) => {
          const p = person(cs.with)
          const rs = acct.reschedules[cs.id]
          return (
            <Card key={cs.id} tone="raised" style={{ gap: space.s1 + 4 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Avatar person={p} size={40} />
                <View style={{ flex: 1 }}>
                  <Body weight="medium">{p.name}</Body>
                  <Meta size={14}>{cs.title}</Meta>
                </View>
                <Pill tone={cs.status === 'confirmed' && !rs ? 'ink' : 'neutral'}>{cs.status === 'confirmed' && !rs ? 'Confirmed' : 'Requested'}</Pill>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s2, rowGap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="calendar" size={15} color={c.ink2} />
                  <Mono tone="ink">{rs ? rs.slot : `${cs.when} · ${cs.time}`}</Mono>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="video" size={15} color={c.ink2} />
                  <Meta>
                    {cs.mode} · <Mono tone="ink2">{String(cs.minutes)}</Mono> min
                  </Meta>
                </View>
              </View>
              {rs ? <Done>{`New time requested · ${rs.ref}. ${shortName(p.name)} confirms within one working day; until then ${cs.when} · ${cs.time} stays held.`}</Done> : <Meta>{cs.prep}</Meta>}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
                <Button variant="secondary" size="sm" icon="video" disabled accessibilityHint="Opens ten minutes before the consult">
                  Join · opens 10 min before
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    setSlot(rs?.slot ?? null)
                    setReschedDone(false)
                    setResched(cs)
                  }}
                >
                  {rs ? 'Change the request' : 'Reschedule'}
                </Button>
              </View>
            </Card>
          )
        })}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Icon name="shield" size={15} color={c.ink3} />
          <Meta size={14} tone="ink3" style={{ flex: 1 }}>
            Telemedicine Practice Guidelines 2020. Every consult begins with the clinician’s name and registration, your identity and your consent.
          </Meta>
        </View>
        <Card tone="sunk" style={{ gap: space.s1 }}>
          <Eyebrow>Past consults</Eyebrow>
          {PAST_CONSULTS.map((pc) => (
            <View key={pc.id} style={{ gap: 2, paddingVertical: 6 }}>
              <Body>{pc.title}</Body>
              <Meta size={14}>
                <Mono size={14} tone="ink2">{pc.when}</Mono> · {person(pc.with).name} · {pc.note}
              </Meta>
            </View>
          ))}
        </Card>
      </View>

      {/* Results */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>Results</SectionTitle>
          <SpecimenTag />
        </View>
        <Body tone="ink2">Signed by a physician before you see them. Lab partner, then the result pipeline (FHIR R4), then sign-off, then you.</Body>
        {RESULTS.map((r) => {
          const open = openResult === r.id
          const watch = r.markers.filter((m) => m.flag === 'watch').length
          return (
            <Card key={r.id} tone="raised" style={{ gap: space.s1 + 4 }}>
              <Pressable
                onPress={() => setOpenResult(open ? null : r.id)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                aria-expanded={open}
                accessibilityLabel={`${r.name}. ${r.status === 'signed' ? `Signed by ${r.signedBy}` : 'Awaiting sign-off'}. ${open ? 'Hide' : 'Show'} markers.`}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 44 }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Body weight="medium">{r.name}</Body>
                  <Meta size={14}>{r.lab}</Meta>
                  <Meta size={14}>
                    Drawn <Mono size={14} tone="ink2">{fmtDate(r.drawn)}</Mono>
                  </Meta>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <Pill tone={r.status === 'signed' ? 'ink' : 'neutral'}>{r.status === 'signed' ? 'Signed' : 'Awaiting'}</Pill>
                  <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={c.ink3} />
                </View>
              </Pressable>
              {open ? (
                r.status === 'awaiting' ? (
                  <Meta>Your sleep study is with the sleep physician. You will see it here once it is signed, with a note in plain words. No raw result is shown before that.</Meta>
                ) : (
                  <View style={{ gap: space.s1 }}>
                    {r.markers.map((m) => (
                      <View key={m.name} accessible accessibilityLabel={`${m.name}, ${m.value} ${m.unit}. Range ${m.range}.${m.flag === 'watch' ? ' Worth watching.' : ' In range.'}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.line }}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Meta tone="ink">{m.name}</Meta>
                          <Meta size={13} tone="ink3">
                            Range <Mono size={13} tone="ink3">{m.range}</Mono>
                          </Meta>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 2 }}>
                          <Mono tone="ink" size={17}>{`${m.value} ${m.unit}`}</Mono>
                          {m.flag === 'watch' ? <Eyebrow tone="ink2">Watch</Eyebrow> : null}
                        </View>
                      </View>
                    ))}
                    {r.note ? (
                      <Card tone="sunk" padding={14} style={{ gap: 6 }}>
                        <Eyebrow>{`Note from ${r.signedBy}`}</Eyebrow>
                        <Body>{r.note}</Body>
                        <Meta size={13} tone="ink3">
                          Signed <Mono size={13} tone="ink3">{fmtDate(r.signedOn!)}</Mono>
                          {watch ? ` · ${watch} to watch` : ''}
                        </Meta>
                      </Card>
                    ) : null}
                  </View>
                )
              ) : null}
            </Card>
          )
        })}
      </View>

      {/* Prescriptions */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Prescriptions</SectionTitle>
        {ERX.map((rx) => (
          <Card key={rx.id} tone={rx.status === 'active' ? 'raised' : 'sunk'} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s1, alignItems: 'flex-start' }}>
              <Body weight="medium" style={{ flex: 1 }}>
                {rx.drug}
              </Body>
              <Pill tone={rx.status === 'active' ? 'ink' : 'neutral'}>{rx.status === 'active' ? 'Active' : 'Completed'}</Pill>
            </View>
            <Body tone="ink2">{rx.sig}</Body>
            <Meta size={14}>
              {rx.by} · <Mono size={14} tone="ink2">{rx.reg}</Mono>
            </Meta>
            <Meta size={14}>
              <Mono size={14} tone="ink2">{`${fmtDate(rx.on)} → ${fmtDate(rx.until)}`}</Mono>
            </Meta>
            <Meta size={13} tone="ink3">
              {rx.check}
            </Meta>
          </Card>
        ))}
      </View>

      {/* LifeOS bridge */}
      <Card tone="ink" style={{ gap: space.s1 + 4 }}>
        <Eyebrow>LifeOS · the clinical app</Eyebrow>
        <Title size={24}>
          Clinical work continues in LifeOS, with <Serif>one</Serif> AIWO ID.
        </Title>
        <Body tone="ink2">Panels, imaging and longer clinical plans live in LifeOS. Same AIWO ID; nothing is entered twice, and Joy OS only shows what your physician has signed.</Body>
        <Meta>
          AIWO ID · <Mono tone="ink">{MEMBER.aiwoId}</Mono>
        </Meta>
        <Button variant="secondary" size="sm" iconRight="arrow-up-right" onPress={() => setNote('On your phone this opens the LifeOS app at your clinical record. Specimen: the deep link is not live in this build.')}>
          Open in LifeOS
        </Button>
      </Card>

      {/* Account */}
      <View style={{ gap: space.s1 }}>
        <SectionTitle>You and your data</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <ListRow icon="user" title="Profile" sub={`${MEMBER.firstName} ${MEMBER.lastName} · AIWO ID, emergency contact`} onPress={() => router.push('/profile')} />
          <Divider />
          <ListRow icon="star" title="Membership" sub={`${MEMBER.plan} + ${MEMBER.membership} · invoices`} onPress={() => router.push('/membership')} />
          <Divider />
          <ListRow icon="bell" title="Notifications" sub="Recent, quiet hours, channels" onPress={() => router.push('/notifications')} />
          <Divider />
          <ListRow icon="shield" title="Trust centre" sub="Who has seen my data · consents · export · delete" onPress={() => router.push('/trust')} />
          <Divider />
          <ListRow icon="home" title="Household" sub="The Rao household · what each of you shares" onPress={() => router.push('/household')} />
          <Divider />
          <ListRow icon="watch" title="Devices" sub="Oura Ring · Apple Health" onPress={() => router.push('/devices')} />
          <Divider />
          <ListRow icon="users" title="Your circle" sub="Circle of eight · Monday 7 pm" onPress={() => router.push('/circles')} />
          <Divider />
          <ListRow icon="settings" title="Settings" sub="Language, theme, quiet hours, text size" onPress={() => router.push('/settings')} />
        </Card>
      </View>

      <Sheet
        open={!!resched}
        onClose={() => setResched(null)}
        title={reschedDone ? 'Requested' : 'Choose a new time'}
        footer={
          reschedDone ? (
            <Button variant="secondary" block onPress={() => setResched(null)}>
              Close
            </Button>
          ) : (
            <Button variant="ink" block onPress={requestSlot} disabled={!slot}>
              Request this time
            </Button>
          )
        }
      >
        {resched ? (
          reschedDone && acct.reschedules[resched.id] ? (
            <>
              <Title size={24}>
                Asked. <Serif>Held</Serif> until confirmed.
              </Title>
              <KeyValue k="With">{person(resched.with).name}</KeyValue>
              <KeyValue k="New time">
                <Mono tone="ink">{acct.reschedules[resched.id].slot}</Mono>
              </KeyValue>
              <KeyValue k="Reference" last>
                <Mono tone="ink">{acct.reschedules[resched.id].ref}</Mono>
              </KeyValue>
              <Meta>Your original time stays held until the new one is confirmed. You will hear in Messages.</Meta>
            </>
          ) : (
            <>
              <Meta>{`${resched.title} · ${resched.minutes} min, ${resched.mode.toLowerCase()}. Three times ${shortName(person(resched.with).name)} can do:`}</Meta>
              <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel="New time">
                {SLOTS[resched.id].map((sl) => (
                  <ChoiceCard key={sl} selected={slot === sl} onPress={() => setSlot(sl)} accessibilityLabel={sl} title={<Mono tone="ink" size={17}>{sl}</Mono>} />
                ))}
              </View>
              <Meta size={14} tone="ink3">None of these work? Message your coach and she will find another.</Meta>
            </>
          )
        ) : null}
      </Sheet>

      <Sheet open={!!note} onClose={() => setNote(null)} title="Noted" footer={<Button variant="secondary" block onPress={() => setNote(null)}>Close</Button>}>
        <Body>{note}</Body>
      </Sheet>
    </Screen>
  )
}
