import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Body, Button, Divider, Eyebrow, Icon, Meta, Mono, Progress, Segmented, SpecimenTag, Toggle } from '@/components'
import { interceptsCrisis, useApp } from '@/lib/store'
import { trustStore, useStore } from '@/screens/b/bStore'
import { CONSENTS } from '@/shared/member'
import { useLocal } from '@/screens/a/local'
import { Chip, IconButton, TextField } from '@/screens/a/parts'
import { NO_SUGGESTIONS, PEACE_OF_MIND, TIME_AUDIT, TIME_KINDS } from '@/screens/a/spacesData'
import { useTheme } from '@/theme/ThemeProvider'
import { useA } from '../i18n'
import { VivaExchange, useVivaRun } from '../vivaParts'
import { ToolCard, ToolsHeading } from './common'

// FREEDOM: the time audit (a consented calendar, summarised, then discarded), the No list, the weekly
// sabbath, and the peace-of-mind list. Never financial advice. VIVA's time_audit_summary runs on the
// audit card itself, from the totals only.

export function FreedomTools() {
  const { t } = useA()
  return (
    <>
      <ToolsHeading>{t('Freedom tools')}</ToolsHeading>
      <TimeAudit />
      <NoList />
      <Sabbath />
      <PeaceOfMind />
    </>
  )
}

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type Kind = (typeof TIME_KINDS)[number]['key']

// Calendar opt-in (Memo p.19 and p.26): one calendar, read-only, only for the time audit,
// read once, summarised to hours by kind, raw events discarded. The purpose-level consent
// lives in the Trust centre (trustStore, c_cal); this screen only reads it, so a withdrawal
// there turns the audit off here at once.
type CalProvider = 'google' | 'microsoft'
const CAL_PROVIDERS: readonly CalProvider[] = ['google', 'microsoft']
const CAL_NAME: Record<CalProvider, string> = { google: 'Google Calendar', microsoft: 'Microsoft Outlook' }
type CalConnection = { provider: CalProvider | null; rerun: boolean }

/** The Trust centre's calendar consent, live: the member's own choice over the specimen default. */
export function useCalendarConsent() {
  const [trust] = useStore(trustStore)
  const fallback = CONSENTS.find((x) => x.id === 'c_cal')?.granted ?? false
  return 'c_cal' in trust.consents ? trust.consents.c_cal : fallback
}

/**
 * Whether a time-audit summary exists to talk about: calendar consent stands (c_cal) and a calendar
 * is connected. The room's VIVA card reads this, so it never summarises a calendar it may not read.
 */
export function useTimeAuditAccess(): 'open' | 'no-consent' | 'not-connected' {
  const on = useCalendarConsent()
  const [conn] = useLocal<CalConnection>('calendarConnection', { provider: null, rerun: false })
  if (!on) return 'no-consent'
  return conn.provider && CAL_PROVIDERS.includes(conn.provider) ? 'open' : 'not-connected'
}

function TimeAudit() {
  const on = useCalendarConsent()
  const [conn, setConn] = useLocal<CalConnection>('calendarConnection', { provider: null, rerun: false })
  const [disconnected, setDisconnected] = useState(false)
  const provider = conn.provider && CAL_PROVIDERS.includes(conn.provider) ? conn.provider : null
  const disconnect = () => {
    setConn({ provider: null, rerun: false })
    setDisconnected(true)
  }
  if (!on) return <CalendarOff provider={provider} onDisconnect={disconnect} />
  if (!provider) return <CalendarOptIn disconnected={disconnected} onConnect={(p) => (setConn({ provider: p, rerun: false }), setDisconnected(false))} />
  return <AuditView provider={provider} rerun={conn.rerun} onRerun={() => setConn((x) => ({ ...x, rerun: true }))} onDisconnect={disconnect} />
}

function Check({ checked, label, onPress }: { checked: boolean; label: string; onPress: () => void }) {
  const { c } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      aria-checked={checked}
      accessibilityLabel={label}
      style={({ pressed }) => ({ flexDirection: 'row', gap: 12, paddingVertical: 8, minHeight: 44, opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ width: 22, height: 22, marginTop: 1, borderRadius: 6, borderWidth: 2, borderColor: checked ? c.ink : c.lineStrong, backgroundColor: checked ? c.ink : undefined, alignItems: 'center', justifyContent: 'center' }}>
        {checked ? <Icon name="check" size={14} color={c.paper} /> : null}
      </View>
      <Body style={{ flex: 1 }}>{label}</Body>
    </Pressable>
  )
}

function CalendarOptIn({ disconnected, onConnect }: { disconnected: boolean; onConnect: (p: CalProvider) => void }) {
  const { c, space, radius } = useTheme()
  const { t } = useA()
  const [step, setStep] = useState<'choose' | 'grant' | 'reading'>('choose')
  const [provider, setProvider] = useState<CalProvider>('google')
  const [agree, setAgree] = useState(false)
  const [phase, setPhase] = useState(0)
  // Reading is simulated: three short beats, then the summary appears and the raw entries are gone.
  useEffect(() => {
    if (step !== 'reading') return
    const ids = [setTimeout(() => setPhase(1), 700), setTimeout(() => setPhase(2), 1400), setTimeout(() => onConnect(provider), 2100)]
    return () => ids.forEach(clearTimeout)
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps
  const name = CAL_NAME[provider]
  const reading = [t('Reading 14 days of {p}…', { p: name }), t('Adding up the hours by kind…'), t('Discarding the raw entries…')]
  return (
    <ToolCard
      title={step === 'grant' ? t('{p} · access request', { p: name }) : t('Time audit · optional')}
      aside={<SpecimenTag />}
      lead={step === 'choose' ? t('Joy OS reads two weeks of one calendar, read-only and once. It adds the hours up into four kinds, keeps only those totals and discards every event. Freedom works without it.') : undefined}
    >
      {step === 'choose' ? (
        <View style={{ gap: space.s2 }}>
          {disconnected ? (
            <Meta tone="ink" accessibilityLiveRegion="polite">
              {t('Disconnected. The summary is deleted and nothing more will be read.')}
            </Meta>
          ) : null}
          <Body size={20} style={{ lineHeight: 28 }}>
            {t('Whose time is it? Connect a calendar to find out.')}
          </Body>
          <View style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={t('Choose a calendar')}>
            <Eyebrow>{t('Choose a calendar')}</Eyebrow>
            {CAL_PROVIDERS.map((p) => {
              const sel = provider === p
              return (
                <Pressable
                  key={p}
                  onPress={() => setProvider(p)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: sel }}
                  aria-checked={sel}
                  accessibilityLabel={`${CAL_NAME[p]}. ${t('Read-only · the last 14 days')}`}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, minHeight: 56, borderRadius: radius.card, borderWidth: sel ? 2 : 1, borderColor: sel ? c.ink : c.line, backgroundColor: sel ? c.paperSunk : pressed ? c.paperSunk : undefined })}
                >
                  <View style={{ width: 18, height: 18, marginTop: 2, borderRadius: 9, borderWidth: 2, borderColor: sel ? c.ink : c.lineStrong, alignItems: 'center', justifyContent: 'center' }}>
                    {sel ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.ink }} /> : null}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Body weight="medium">{CAL_NAME[p]}</Body>
                    <Meta size={14} tone="ink3">{t('Read-only · the last 14 days')}</Meta>
                  </View>
                </Pressable>
              )
            })}
          </View>
          <View style={{ backgroundColor: c.paperSunk, borderRadius: radius.card, padding: space.s2, gap: space.s1 }}>
            <View style={{ gap: 2 }}>
              <Eyebrow>{t('What is kept')}</Eyebrow>
              <Meta>{t('Hours per day in four kinds: yours, chosen work, asked of you, obligation.')}</Meta>
            </View>
            <View style={{ gap: 2 }}>
              <Eyebrow>{t('What is never kept')}</Eyebrow>
              <Meta>{t('Event titles, guests, places and notes. They are read, summarised and dropped.')}</Meta>
            </View>
          </View>
          <Button variant="ink" icon="calendar" onPress={() => (setAgree(false), setStep('grant'))} style={{ alignSelf: 'flex-start' }}>
            {t('Continue')}
          </Button>
        </View>
      ) : step === 'grant' ? (
        <View style={{ gap: space.s2 }}>
          <Body size={20} style={{ lineHeight: 28 }}>
            {t('Joy OS would like to read this calendar')}
          </Body>
          <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: space.s2, gap: 8 }}>
            <Eyebrow>{t('Joy OS can')}</Eyebrow>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Icon name="check" size={15} color={c.ink} />
              <Meta tone="ink" style={{ flex: 1 }}>{t('See the times and titles of your events from 11 to 24 Jan, once')}</Meta>
            </View>
          </View>
          <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: space.s2, gap: 8 }}>
            <Eyebrow>{t('Joy OS cannot')}</Eyebrow>
            {[t('Create, change or delete events'), t('Invite, email or share with anyone'), t('Read again without asking you first')].map((x) => (
              <View key={x} style={{ flexDirection: 'row', gap: 8 }}>
                <Icon name="x" size={15} color={c.ink2} />
                <Meta style={{ flex: 1 }}>{x}</Meta>
              </View>
            ))}
          </View>
          <Check checked={agree} onPress={() => setAgree((a) => !a)} label={t('I allow a one-time, read-only read of this calendar.')} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
            <Button variant="ink" icon="shield" disabled={!agree} onPress={() => (setPhase(0), setStep('reading'))}>
              {t('Allow read')}
            </Button>
            <Button variant="ghost" onPress={() => setStep('choose')}>
              {t('Back')}
            </Button>
          </View>
          <Meta size={14} tone="ink3">
            {t('Withdraw calendar consent any time in the Trust centre; the time audit stops at once.')}
          </Meta>
        </View>
      ) : (
        <View style={{ gap: space.s2 }}>
          <Progress value={phase + 1} max={3} color={c.ink} label={t('Connecting your calendar')} />
          <View style={{ gap: 8 }} accessibilityLiveRegion="polite">
            {reading.map((x, i) => (
              <View key={x} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {i < phase ? <Icon name="check" size={15} color={c.ink} /> : <View style={{ width: 8, height: 8, marginHorizontal: 3, borderRadius: 4, backgroundColor: i === phase ? c.ink : undefined, borderWidth: i === phase ? 0 : 1, borderColor: c.lineStrong }} />}
                <Meta tone={i <= phase ? 'ink' : 'ink3'} style={{ flex: 1 }}>{x}</Meta>
              </View>
            ))}
          </View>
        </View>
      )}
    </ToolCard>
  )
}

function CalendarOff({ provider, onDisconnect }: { provider: CalProvider | null; onDisconnect: () => void }) {
  const { space } = useTheme()
  const { t } = useA()
  return (
    <ToolCard tone="sunk" title={t('Time audit · optional')} lead={t('Calendar consent is withdrawn in the Trust centre. Joy OS reads no calendar, and no time-audit summary is shown.')}>
      <Body size={20} style={{ lineHeight: 28 }}>
        {t('The time audit is off.')}
      </Body>
      {provider ? <Meta tone="ink">{t('Your {p} connection is paused until you give consent again.', { p: CAL_NAME[provider] })}</Meta> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
        <Button variant="secondary" icon="shield" onPress={() => router.push('/trust')}>
          {t('Turn calendar back on in the Trust centre')}
        </Button>
        {provider ? (
          <Button variant="ghost" icon="trash-2" onPress={onDisconnect}>
            {t('Disconnect and delete the summary')}
          </Button>
        ) : null}
      </View>
    </ToolCard>
  )
}

function AuditView({ provider, rerun, onRerun, onDisconnect }: { provider: CalProvider; rerun: boolean; onRerun: () => void; onDisconnect: () => void }) {
  const { c, resolve, space } = useTheme()
  const { t, tx, lang, week } = useA()
  const totals = TIME_KINDS.map((k) => ({ ...k, hours: TIME_AUDIT.reduce((a, d) => a + d[k.key as Kind], 0) }))
  const all = totals.reduce((a, b) => a + b.hours, 0)
  const pct = (h: number) => Math.round((h / all) * 100)
  const maxDay = Math.max(...TIME_AUDIT.map((d) => d.mine + d.chosenWork + d.asked + d.admin))
  const yours = totals.find((t) => t.key === 'mine')!
  const asked = totals.find((t) => t.key === 'asked')!
  const viva = useVivaRun()
  const summarise = () =>
    viva.run({
      ask: tx('Summarise my time audit.'),
      text: t('Over two weeks, {a}% of your planned hours were yours and {b}% were asked of you by others, mostly in Tuesday and Wednesday meetings. Weekends were largely your own. One protected hour a week is a good place to start.', { a: pct(yours.hours), b: pct(asked.hours) }),
      tool: 'time_audit_summary',
      reviewer: tx('Calendar entries discarded · totals only · never financial advice'),
    })
  return (
    <ToolCard
      title={t('Time audit · two weeks')}
      lead={t('Your planned hours, by whose they were. {a}% were yours; {b}% were asked of you, mostly Tuesday and Wednesday.', { a: pct(yours.hours), b: pct(asked.hours) })}
    >
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={t('Time audit, 14 days. {list}. Weekends were mostly yours.', { list: totals.map((x) => t('{label} {n} percent', { label: tx(x.label), n: pct(x.hours) })).join(', ') })}
        style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140, gap: 3 }}
      >
        {TIME_AUDIT.map((d) => {
          const sum = d.mine + d.chosenWork + d.asked + d.admin
          return (
            <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <View style={{ width: '100%', height: (sum / maxDay) * 116, borderRadius: 3, overflow: 'hidden', flexDirection: 'column-reverse' }}>
                {TIME_KINDS.map((k) => (
                  <View key={k.key} style={{ height: `${(d[k.key as Kind] / sum) * 100}%`, backgroundColor: resolve(k.color) }} />
                ))}
              </View>
              <Mono size={10} tone="ink3">
                {lang === 'en' ? d.day.slice(0, 1) : week[DAY_KEYS.indexOf(d.day.slice(0, 3))]}
              </Mono>
            </View>
          )
        })}
      </View>
      <View style={{ gap: 8 }}>
        {totals.map((x) => (
          <View key={x.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: resolve(x.color) }} />
            <Meta tone="ink" style={{ flex: 1 }}>
              {tx(x.label)} <Meta size={14} tone="ink3">· {tx(x.note)}</Meta>
            </Meta>
            <Mono tone="ink">{`${pct(x.hours)}%`}</Mono>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.s1 }}>
        <Icon name="shield" size={14} color={c.ink3} />
        <Meta size={14} tone="ink3" style={{ flex: 1 }}>
          {t('{p} · entries summarised, then discarded. Priya sees totals only.', { p: CAL_NAME[provider] })}
        </Meta>
      </View>
      <VivaExchange state={viva.state} turn={viva.turn} />
      {viva.state === 'idle' ? (
        <Button size="sm" variant="ghost" icon="message-circle" onPress={summarise} style={{ alignSelf: 'flex-start' }}>
          {t('Ask VIVA to summarise it')}
        </Button>
      ) : viva.state === 'shown' ? (
        <Button size="sm" variant="ghost" onPress={viva.reset} style={{ alignSelf: 'flex-start' }}>
          {t('Close the summary')}
        </Button>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.s1 }}>
        {rerun ? (
          <Meta tone="ink2" accessibilityLiveRegion="polite" style={{ flexBasis: '100%' }}>
            {t('Scheduled for 7 Feb. We will ask again before reading.')}
          </Meta>
        ) : (
          <Button size="sm" variant="secondary" icon="calendar" onPress={onRerun}>
            {t('Run again in two weeks')}
          </Button>
        )}
        <Button size="sm" variant="ghost" onPress={onDisconnect}>
          {t('Disconnect {p}', { p: CAL_NAME[provider] })}
        </Button>
      </View>
    </ToolCard>
  )
}

function NoList() {
  const { space } = useTheme()
  const { t, tx } = useA()
  const { setCrisisOpen } = useApp()
  const [list, setList] = useLocal<string[]>('noList', ['Checking email after 21:00'])
  const [draft, setDraft] = useState('')
  const [already, setAlready] = useState(false)
  const full = list.length >= 3
  const toggle = (s: string) => setList((l) => (l.includes(s) ? l.filter((x) => x !== s) : l.length >= 3 ? l : [...l, s]))
  const add = () => {
    const v = draft.trim()
    if (!v) return
    if (interceptsCrisis(v)) {
      setCrisisOpen(true)
      return
    }
    // Full: keep what was typed, so nothing is lost; the "Full" line below says what to do.
    if (list.length >= 3) return
    // Already listed (as typed, or as a suggestion): keep one copy and say so.
    if (list.some((x) => x.toLowerCase() === v.toLowerCase() || tx(x).toLowerCase() === v.toLowerCase())) {
      setAlready(true)
      return
    }
    setList((l) => [...l, v])
    setDraft('')
    setAlready(false)
  }
  return (
    <ToolCard title={t('The No list')} aside={<Mono tone="ink3" size={13}>{t('{a} of {b}', { a: list.length, b: 3 })}</Mono>} lead={t('Three things to stop this quarter. Saying no to these is saying yes to your evenings.')}>
      <View style={{ gap: 4 }}>
        {list.length === 0 ? <Meta tone="ink3">{t('Nothing yet. Pick from below or write your own.')}</Meta> : null}
        {list.map((n, i) => (
          <View key={`${i}:${n}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
            <Mono size={13} tone="ink3">
              {String(i + 1)}
            </Mono>
            <Body style={{ flex: 1 }}>{tx(n)}</Body>
            <IconButton icon="x" label={t('Remove {n}', { n: tx(n) })} onPress={() => setList((l) => l.filter((_, j) => j !== i))} />
          </View>
        ))}
      </View>
      <View style={{ gap: 8 }}>
        <Eyebrow>{t('Others often choose')}</Eyebrow>
        {full ? (
          <Meta tone="ink" accessibilityLiveRegion="polite">
            {t('Full. Remove one to add another.')}
          </Meta>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, opacity: full ? 0.5 : 1 }} pointerEvents={full ? 'none' : 'auto'}>
          {NO_SUGGESTIONS.filter((s) => !list.includes(s))
            .slice(0, 4)
            .map((s) => (
              <Chip key={s} label={tx(s)} selected={false} icon="plus" onPress={() => (full ? undefined : toggle(s))} accessibilityHint={full ? t('The list is full; remove one first.') : t('Adds it to your No list.')} />
            ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s1 }}>
        <TextField label={t('Your own')} value={draft} onChangeText={(v) => (setDraft(v), setAlready(false))} placeholder={t('Something to stop')} onSubmitEditing={add} style={{ flex: 1 }} />
        <IconButton icon="plus" label={t('Add to the No list')} onPress={add} tone="ink" disabled={!draft.trim() || list.length >= 3} />
      </View>
      {already ? (
        <Meta tone="ink2" accessibilityLiveRegion="polite">
          {t('That one is already on your list.')}
        </Meta>
      ) : null}
    </ToolCard>
  )
}

function Sabbath() {
  const { t, weekFull } = useA()
  const [sab, setSab] = useLocal('sabbath', { on: true, day: 'sun' as 'sat' | 'sun' })
  const on = sab.on
  const day = sab.day
  const setOn = (v: boolean) => setSab((x) => ({ ...x, on: v }))
  const setDay = (v: 'sat' | 'sun') => setSab((x) => ({ ...x, day: v }))
  return (
    <ToolCard title={t('The weekly sabbath')} lead={t('One day a week, sunrise to sunset, with no work and no screens. Your circle knows; your office does not need to.')}>
      <Toggle checked={on} onChange={setOn} label={t('Keep a weekly sabbath')} description={on ? t('Every {day}, sunrise to sunset: no work, no screens. Notifications pause.', { day: day === 'sun' ? weekFull[6] : weekFull[5] }) : t('Off. Turn it on whenever you are ready.')} />
      {on ? <Segmented value={day} onChange={setDay} items={[{ value: 'sat', label: weekFull[5] }, { value: 'sun', label: weekFull[6] }]} /> : null}
    </ToolCard>
  )
}

function PeaceOfMind() {
  const { c } = useTheme()
  const { t, tx } = useA()
  const [items, setItems] = useLocal('peaceOfMind', PEACE_OF_MIND)
  const done = items.filter((x) => x.done).length
  return (
    <ToolCard title={t('Peace of mind')} aside={<Mono tone="ink3" size={13}>{t('{a} of {b}', { a: done, b: items.length })}</Mono>} lead={t('Five things that let the people you love stop worrying. Not financial advice: your adviser holds the details.')}>
      <View>
        {items.map((x, i) => (
          <View key={x.id}>
            {i > 0 ? <Divider /> : null}
            <Pressable
              onPress={() => setItems((all) => all.map((y) => (y.id === x.id ? { ...y, done: !y.done } : y)))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: x.done }}
              aria-checked={x.done}
              accessibilityLabel={`${tx(x.title)}. ${tx(x.detail)}`}
              style={({ pressed }) => ({ flexDirection: 'row', gap: 12, paddingVertical: 12, opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{ width: 22, height: 22, marginTop: 2, borderRadius: 6, borderWidth: 2, borderColor: x.done ? c.ink : c.lineStrong, backgroundColor: x.done ? c.ink : undefined, alignItems: 'center', justifyContent: 'center' }}>
                {x.done ? <Icon name="check" size={14} color={c.paper} /> : null}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Body weight="medium">{tx(x.title)}</Body>
                <Meta size={14}>{tx(x.detail)}</Meta>
              </View>
            </Pressable>
          </View>
        ))}
      </View>
    </ToolCard>
  )
}
