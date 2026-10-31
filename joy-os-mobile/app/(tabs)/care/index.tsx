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
import { localDate, Rich, useA } from '@/screens/a/i18n'

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
  const { t, tx, lang } = useA()
  const ld = (s: string) => localDate(s, lang)
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
        eyebrow={t('Care · a person behind every number')}
        title={<Rich text={t('Your *people*, and the way up when you need more.')} wrap={(w) => <Serif>{w}</Serif>} />}
        lead={t('A coach, a concierge, a physician and a psychologist, each named. VIVA may draft; a person always signs.')}
      />

      {/* Tele-MANAS */}
      <Card tone="outline" style={{ gap: space.s1 + 4 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="phone" size={18} color={c.ink} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Body weight="medium">{t('If today is heavy, talk to someone now.')}</Body>
            <Meta>
              <Rich text={t('Tele-MANAS *14416* · free · 24 hours · in your language')} wrap={(w) => <Mono tone="ink">{w}</Mono>} />
            </Meta>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
          <Button variant="ink" size="sm" icon="phone" onPress={() => Linking.openURL('tel:14416').catch(() => {})} accessibilityLabel={t('Call Tele-MANAS 14416')}>
            {t('Call 14416')}
          </Button>
          <Button variant="ghost" size="sm" onPress={() => setCrisisOpen(true)}>
            {t('More ways to get help')}
          </Button>
        </View>
      </Card>

      {/* Messages entry */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Eyebrow>{t('Messages')}</Eyebrow>
          {unread > 0 ? <Pill tone="daybreak">{unread === 1 ? t('A new reply') : t('New replies')}</Pill> : null}
        </View>
        {THREADS.slice(0, 2).map((th) => {
          const p = person(th.personId)
          const last = th.messages[th.messages.length - 1]
          return (
            <Pressable
              key={th.id}
              onPress={() => router.push(`/messages?t=${th.id}`)}
              accessibilityRole="link"
              accessibilityLabel={t('{name}, {subject}{unread}. {body}', { name: p.name, subject: th.subject, unread: isUnread(th.id, th.unread) ? t(', new reply') : '', body: last.body })}
              style={({ pressed }) => ({ flexDirection: 'row', gap: 12, opacity: pressed ? 0.7 : 1 })}
            >
              <Avatar person={p} size={40} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Body weight={isUnread(th.id, th.unread) ? 'semibold' : 'regular'} style={{ flex: 1 }} numberOfLines={1}>
                    {p.name}
                  </Body>
                  {isUnread(th.id, th.unread) ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.daybreak }} /> : null}
                </View>
                <Meta size={14} numberOfLines={2}>
                  {last.body}
                </Meta>
              </View>
            </Pressable>
          )
        })}
        <DaybreakButton icon="message-circle" onPress={() => router.push('/messages')}>
          {t('Open messages')}
        </DaybreakButton>
      </Card>

      {/* My people */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>{t('My people')}</SectionTitle>
          <SpecimenTag />
        </View>
        <Body tone="ink2">{t('Four people know your name and your ninety days. If something drifts, it becomes a task for one of them, never an alert on your phone.')}</Body>
        {TEAM.map((p) => {
          const d = PEOPLE_DETAIL[p.id]
          return (
            <Card key={p.id} tone="raised" style={{ gap: space.s1 + 4 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Avatar person={p} size={48} />
                <View style={{ flex: 1 }}>
                  <Body weight="medium">{p.name}</Body>
                  <Meta size={14}>{`${tx(p.role)}${d.clinical ? t(' · clinical') : ''}`}</Meta>
                </View>
              </View>
              <Body tone="ink2">{tx(d.line)}</Body>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s3, rowGap: space.s1 }}>
                <View style={{ gap: 2 }}>
                  <Eyebrow>{t('Next')}</Eyebrow>
                  <Mono tone="ink">{ld(tx(d.next))}</Mono>
                  <Meta size={13}>{tx(d.nextKind)}</Meta>
                </View>
                <View style={{ gap: 2 }}>
                  <Eyebrow>{t('Speaks')}</Eyebrow>
                  <Meta tone="ink">{tx(d.languages)}</Meta>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.s1 }}>
                <Button variant="secondary" size="sm" icon="message-circle" onPress={() => openThreadFor(p.id)}>
                  {t('Message {name}', { name: shortName(p.name) })}
                </Button>
                <Meta size={13} tone="ink3" style={{ flexShrink: 1 }}>
                  {tx(d.replies)}
                </Meta>
              </View>
            </Card>
          )
        })}
      </View>

      {/* The care ladder */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('The care ladder')}</SectionTitle>
        <Title size={24}>
          <Rich text={t('Step up when you need more, *down* when you need less.')} wrap={(w) => <Serif>{w}</Serif>} />
        </Title>
        <Body tone="ink2">{t('Most of the time the Practice and your circle are enough. An Ease screen above threshold moves you up to a clinician, with a person, within 48 hours.')}</Body>
        <Card tone="raised">
          <View accessibilityRole="list" accessibilityLabel={t('Care ladder, from self-care to a ’cation')}>
            {CARE_LADDER.map((r, i) => {
              const st = r.status === 'used' ? 'done' : r.status === 'here' ? 'now' : 'next'
              return (
                <TimelineStep key={r.key} index={i} state={st} last={i === CARE_LADDER.length - 1}>
                  <View accessible accessibilityLabel={t('Rung {n}, {name}{here}. {who}. {what}', { n: i + 1, name: tx(r.name), here: r.status === 'here' ? t(', you are here') : '', who: tx(r.who), what: tx(r.what) })} style={{ gap: 4 }}>
                    <Body weight="medium" tone={st === 'next' ? 'ink2' : 'ink'}>
                      {tx(r.name)}
                    </Body>
                    {r.status === 'here' ? <HereMarker label={t('You are here')} /> : null}
                    <Meta tone="ink">{tx(r.who)}</Meta>
                    <Meta>{tx(r.what)}</Meta>
                  </View>
                </TimelineStep>
              )
            })}
          </View>
          <Divider style={{ marginVertical: space.s2 }} />
          <Meta>{t('You use rungs 1–{n} today. Dr Meera signed your Clinical-grade Index in October; Priya has asked Dr Sanjay for a first conversation about sleep.', { n: hereIdx + 1 })}</Meta>
        </Card>
      </View>

      {/* Consults */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('Consults · coming up')}</SectionTitle>
        {CONSULTS.map((cs) => {
          const p = person(cs.with)
          const rs = acct.reschedules[cs.id]
          return (
            <Card key={cs.id} tone="raised" style={{ gap: space.s1 + 4 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <Avatar person={p} size={40} />
                <View style={{ flex: 1 }}>
                  <Body weight="medium">{p.name}</Body>
                  <Meta size={14}>{tx(cs.title)}</Meta>
                </View>
                <Pill tone={cs.status === 'confirmed' && !rs ? 'ink' : 'neutral'}>{cs.status === 'confirmed' && !rs ? t('Confirmed') : tx('Requested')}</Pill>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s2, rowGap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="calendar" size={15} color={c.ink2} />
                  <Mono tone="ink">{ld(rs ? rs.slot : `${cs.when} · ${cs.time}`)}</Mono>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="video" size={15} color={c.ink2} />
                  <Meta>
                    {tx(cs.mode)} · <Mono tone="ink2">{String(cs.minutes)}</Mono> {lang === 'en' ? 'min' : t('{n} min', { n: '' }).trim()}
                  </Meta>
                </View>
              </View>
              {rs ? <Done>{t('New time requested · {ref}. {name} confirms within one working day; until then {when} stays held.', { ref: rs.ref, name: shortName(p.name), when: ld(`${cs.when} · ${cs.time}`) })}</Done> : <Meta>{tx(cs.prep)}</Meta>}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
                <Button variant="secondary" size="sm" icon="video" disabled accessibilityHint={t('Opens ten minutes before the consult')}>
                  {t('Join · opens 10 min before')}
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
                  {rs ? tx('Change the request') : t('Reschedule')}
                </Button>
              </View>
            </Card>
          )
        })}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Icon name="shield" size={15} color={c.ink3} />
          <Meta size={14} tone="ink3" style={{ flex: 1 }}>
            {t('Telemedicine Practice Guidelines 2020. Every consult begins with the clinician’s name and registration, your identity and your consent.')}
          </Meta>
        </View>
        <Card tone="sunk" style={{ gap: space.s1 }}>
          <Eyebrow>{t('Past consults')}</Eyebrow>
          {PAST_CONSULTS.map((pc) => (
            <View key={pc.id} style={{ gap: 2, paddingVertical: 6 }}>
              <Body>{tx(pc.title)}</Body>
              <Meta size={14}>
                <Mono size={14} tone="ink2">{ld(pc.when)}</Mono> · {person(pc.with).name} · {tx(pc.note)}
              </Meta>
            </View>
          ))}
        </Card>
      </View>

      {/* Results */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>{t('Results')}</SectionTitle>
          <SpecimenTag />
        </View>
        <Body tone="ink2">{t('Signed by a physician before you see them. Lab partner, then the result pipeline (FHIR R4), then sign-off, then you.')}</Body>
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
                accessibilityLabel={t('{name}. {status}. {action} markers.', { name: tx(r.name), status: r.status === 'signed' ? t('Signed by {who}', { who: r.signedBy ?? '' }) : t('Awaiting sign-off'), action: open ? t('Hide') : t('Show') })}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 44 }}
              >
                <View style={{ flex: 1, gap: 4 }}>
                  <Body weight="medium">{tx(r.name)}</Body>
                  <Meta size={14}>{tx(r.lab)}</Meta>
                  <Meta size={14}>
                    <Rich text={t('Drawn *{d}*', { d: fmtDate(r.drawn, lang) })} wrap={(w) => <Mono size={14} tone="ink2">{w}</Mono>} />
                  </Meta>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <Pill tone={r.status === 'signed' ? 'ink' : 'neutral'}>{r.status === 'signed' ? t('Signed') : t('Awaiting')}</Pill>
                  <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={c.ink3} />
                </View>
              </Pressable>
              {open ? (
                r.status === 'awaiting' ? (
                  <Meta>{t('Your sleep study is with the sleep physician. You will see it here once it is signed, with a note in plain words. No raw result is shown before that.')}</Meta>
                ) : (
                  <View style={{ gap: space.s1 }}>
                    {r.markers.map((m) => (
                      <View key={m.name} accessible accessibilityLabel={t('{name}, {value} {unit}. Range {range}.{flag}', { name: m.name, value: m.value, unit: m.unit, range: m.range, flag: m.flag === 'watch' ? t(' Worth watching.') : t(' In range.') })} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.line }}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Meta tone="ink">{m.name}</Meta>
                          <Meta size={13} tone="ink3">
                            <Rich text={t('Range *{r}*', { r: m.range })} wrap={(w) => <Mono size={13} tone="ink3">{w}</Mono>} />
                          </Meta>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 2 }}>
                          <Mono tone="ink" size={17}>{`${m.value} ${m.unit}`}</Mono>
                          {m.flag === 'watch' ? <Eyebrow tone="ink2">{t('Watch')}</Eyebrow> : null}
                        </View>
                      </View>
                    ))}
                    {r.note ? (
                      <Card tone="sunk" padding={14} style={{ gap: 6 }}>
                        <Eyebrow>{t('Note from {who}', { who: r.signedBy ?? '' })}</Eyebrow>
                        <Body>{r.note}</Body>
                        <Meta size={13} tone="ink3">
                          <Rich text={t('Signed *{d}*{watch}', { d: fmtDate(r.signedOn!, lang), watch: watch ? t(' · {n} to watch', { n: watch }) : '' })} wrap={(w) => <Mono size={13} tone="ink3">{w}</Mono>} />
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
        <SectionTitle>{t('Prescriptions')}</SectionTitle>
        {ERX.map((rx) => (
          <Card key={rx.id} tone={rx.status === 'active' ? 'raised' : 'sunk'} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s1, alignItems: 'flex-start' }}>
              <Body weight="medium" style={{ flex: 1 }}>
                {rx.drug}
              </Body>
              <Pill tone={rx.status === 'active' ? 'ink' : 'neutral'}>{rx.status === 'active' ? t('Active') : t('Completed')}</Pill>
            </View>
            <Body tone="ink2">{tx(rx.sig)}</Body>
            <Meta size={14}>
              {rx.by} · <Mono size={14} tone="ink2">{rx.reg}</Mono>
            </Meta>
            <Meta size={14}>
              <Mono size={14} tone="ink2">{`${fmtDate(rx.on, lang)} → ${fmtDate(rx.until, lang)}`}</Mono>
            </Meta>
            <Meta size={13} tone="ink3">
              {tx(rx.check)}
            </Meta>
          </Card>
        ))}
      </View>

      {/* LifeOS bridge */}
      <Card tone="ink" style={{ gap: space.s1 + 4 }}>
        <Eyebrow>{t('LifeOS · the clinical app')}</Eyebrow>
        <Title size={24}>
          <Rich text={t('Clinical work continues in LifeOS, with *one* AIWO ID.')} wrap={(w) => <Serif>{w}</Serif>} />
        </Title>
        <Body tone="ink2">{t('Panels, imaging and longer clinical plans live in LifeOS. Same AIWO ID; nothing is entered twice, and Joy OS only shows what your physician has signed.')}</Body>
        <Meta>
          <Rich text={t('AIWO ID · *{id}*', { id: MEMBER.aiwoId })} wrap={(w) => <Mono tone="ink">{w}</Mono>} />
        </Meta>
        <Button variant="secondary" size="sm" iconRight="arrow-up-right" onPress={() => setNote(t('On your phone this opens the LifeOS app at your clinical record. Specimen: the deep link is not live in this build.'))}>
          {t('Open in LifeOS')}
        </Button>
      </Card>

      {/* Account */}
      <View style={{ gap: space.s1 }}>
        <SectionTitle>{t('You and your data')}</SectionTitle>
        <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
          <ListRow icon="user" title={t('Profile')} sub={t('{name} · AIWO ID, emergency contact', { name: `${MEMBER.firstName} ${MEMBER.lastName}` })} onPress={() => router.push('/profile')} />
          <Divider />
          <ListRow icon="star" title={t('Membership')} sub={t('{plan} · invoices', { plan: `${MEMBER.plan} + ${MEMBER.membership}` })} onPress={() => router.push('/membership')} />
          <Divider />
          <ListRow icon="bell" title={t('Notifications')} sub={t('Recent, quiet hours, channels')} onPress={() => router.push('/notifications')} />
          <Divider />
          <ListRow icon="shield" title={t('Trust centre')} sub={t('Who has seen my data · consents · export · delete')} onPress={() => router.push('/trust')} />
          <Divider />
          <ListRow icon="home" title={t('Household')} sub={t('The Rao household · what each of you shares')} onPress={() => router.push('/household')} />
          <Divider />
          <ListRow icon="watch" title={tx('Devices')} sub={t('Oura Ring · Apple Health')} onPress={() => router.push('/devices')} />
          <Divider />
          <ListRow icon="users" title={tx('Your circle')} sub={t('Circle of eight · Monday 7 pm')} onPress={() => router.push('/circles')} />
          <Divider />
          <ListRow icon="settings" title={t('Settings')} sub={t('Language, theme, quiet hours, text size')} onPress={() => router.push('/settings')} />
        </Card>
      </View>

      <Sheet
        open={!!resched}
        onClose={() => setResched(null)}
        title={reschedDone ? tx('Requested') : t('Choose a new time')}
        footer={
          reschedDone ? (
            <Button variant="secondary" block onPress={() => setResched(null)}>
              {t('Close')}
            </Button>
          ) : (
            <Button variant="ink" block onPress={requestSlot} disabled={!slot}>
              {t('Request this time')}
            </Button>
          )
        }
      >
        {resched ? (
          reschedDone && acct.reschedules[resched.id] ? (
            <>
              <Title size={24}>
                <Rich text={t('Asked. *Held* until confirmed.')} wrap={(w) => <Serif>{w}</Serif>} />
              </Title>
              <KeyValue k={t('With')}>{person(resched.with).name}</KeyValue>
              <KeyValue k={t('New time')}>
                <Mono tone="ink">{ld(acct.reschedules[resched.id].slot)}</Mono>
              </KeyValue>
              <KeyValue k={tx('Reference')} last>
                <Mono tone="ink">{acct.reschedules[resched.id].ref}</Mono>
              </KeyValue>
              <Meta>{t('Your original time stays held until the new one is confirmed. You will hear in Messages.')}</Meta>
            </>
          ) : (
            <>
              <Meta>{t('{title} · {n} min, {mode}. Three times {name} can do:', { title: tx(resched.title), n: resched.minutes, mode: tx(resched.mode.toLowerCase()), name: shortName(person(resched.with).name) })}</Meta>
              <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={t('New time')}>
                {SLOTS[resched.id].map((sl) => (
                  <ChoiceCard key={sl} selected={slot === sl} onPress={() => setSlot(sl)} accessibilityLabel={ld(sl)} title={<Mono tone="ink" size={17}>{ld(sl)}</Mono>} />
                ))}
              </View>
              <Meta size={14} tone="ink3">{t('None of these work? Message your coach and she will find another.')}</Meta>
            </>
          )
        ) : null}
      </Sheet>

      <Sheet open={!!note} onClose={() => setNote(null)} title={t('Noted')} footer={<Button variant="secondary" block onPress={() => setNote(null)}>{t('Close')}</Button>}>
        <Body>{note}</Body>
      </Sheet>
    </Screen>
  )
}
