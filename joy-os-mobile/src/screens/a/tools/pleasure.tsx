import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { ArrowLink, Body, Button, Divider, EmptyIllustration, Eyebrow, Icon, Meta, Mono, Progress, Segmented, Sheet, Toggle } from '@/components'
import { interceptsCrisis, useApp } from '@/lib/store'
import { ledgerStamp, ledgerWhen, madeHere, useLocal } from '@/screens/a/local'
import { trustStore, useStore } from '@/screens/b/bStore'
import { CONSENTS } from '@/shared/member'
import { BarRow, IconButton, TextField, monoNums, useIsSpecimen } from '@/screens/a/parts'
import { FILMS, PLANNED_START, SAVOURING_PROMPTS } from '@/screens/a/spacesData'
import { LEDGER, LEDGER_WEEK } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { dayShort, useA } from '../i18n'
import { ToolCard, ToolsHeading } from './common'

// PLEASURE: what the Joy Ledger says this week, planned pleasures, a savouring prompt,
// and Moments of Joy (short films of members savouring ordinary things), with the opt-in
// #MyMomentOfJoy (Memo p.19): off by default, under the Publishing consent in the Trust centre.

export function PleasureTools() {
  const { t } = useA()
  // The week's insight is read from Arjun's Ledger; planned pleasures start empty.
  const specimen = useIsSpecimen()
  return (
    <>
      <ToolsHeading>{t('Pleasure tools')}</ToolsHeading>
      {specimen ? <LedgerInsight /> : null}
      <Planned />
      <Savour />
      <Moments />
    </>
  )
}

function LedgerInsight() {
  const { term } = useTheme()
  const { t, tx, lang } = useA()
  const col = term('D')
  const { ledger } = useApp()
  // The specimen week, plus every moment saved on this phone (a savoured prompt included), by tag.
  const week = LEDGER_WEEK.map((x) => ({ ...x }))
  for (const e of ledger.filter(madeHere))
    for (const tag of e.tags) {
      const row = week.find((x) => x.tag === tag)
      if (row) row.count += 1
      else week.push({ tag, count: 1 })
    }
  week.sort((a, b) => b.count - a.count)
  const top = week.slice(0, 5)
  // Moments are entries, not tags (one entry can carry several): the seed week plus this phone's.
  const total = LEDGER.length + ledger.filter(madeHere).length
  return (
    <ToolCard
      title={t('Joy Ledger · this week')}
      aside={<Mono tone="ink3" size={13}>{t('{n} moments', { n: total })}</Mono>}
      lead={t('Daily Pleasure moments by tag. Joy came most from {a} and {b}, usually around lunch.', {
        a: lang === 'en' ? top[0].tag.toLowerCase() : tx(top[0].tag),
        b: lang === 'en' ? top[1].tag.toLowerCase() : tx(top[1].tag),
      })}
    >
      <View style={{ gap: 12 }}>
        {top.map((x) => (
          <BarRow key={x.tag} label={tx(x.tag)} value={x.count} max={top[0].count} color={col.main} />
        ))}
      </View>
      <ArrowLink icon="plus-circle" onPress={() => router.push('/ledger')}>
        {t('Add to the Ledger')}
      </ArrowLink>
    </ToolCard>
  )
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WHEN = [
  { value: 'morning', label: 'Morning', time: '07:30' },
  { value: 'lunch', label: 'Lunch', time: '13:00' },
  { value: 'evening', label: 'Evening', time: '19:00' },
] as const
type When = (typeof WHEN)[number]['value']

function Planned() {
  const { space } = useTheme()
  const { t, tx, lang } = useA()
  const { setCrisisOpen } = useApp()
  const specimen = useIsSpecimen()
  const [items, setItems] = useLocal('plannedPleasures', specimen ? PLANNED_START : [])
  const [what, setWhat] = useState('')
  const [withWho, setWithWho] = useState('')
  const [day, setDay] = useState('Thu')
  const [when, setWhen] = useState<When>('evening')
  const [added, setAdded] = useState<{ what: string; day: string; time: string } | null>(null)
  const time = WHEN.find((w) => w.value === when)!.time
  const add = () => {
    const v = what.trim()
    const w = withWho.trim()
    if (!v) return
    if (interceptsCrisis(`${v} ${w}`)) {
      setCrisisOpen(true)
      return
    }
    setItems((x) => [...x, { id: `pp${Date.now()}`, day, time, what: v, minutes: 10, with: w }])
    setWhat('')
    setWithWho('')
    setAdded({ what: v, day, time })
  }
  return (
    <ToolCard title={t('Planned pleasures')} lead={t('Pleasure planned is pleasure kept. Put it in the calendar like a meeting.')}>
      <View>
        {items.map((p, i) => (
          <View key={p.id}>
            {i > 0 ? <Divider /> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
              <View style={{ width: 52 }}>
                <Mono tone="ink" size={15}>
                  {dayShort(p.day, lang)}
                </Mono>
                <Mono tone="ink3" size={12}>
                  {p.time}
                </Mono>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Body>{monoNums(p.what)}</Body>
                <Meta size={14} tone="ink3">
                  {monoNums(t('{n} min{with}', { n: p.minutes, with: p.with ? t(' · with {w}', { w: p.with }) : '' }))}
                </Meta>
              </View>
              <IconButton icon="x" label={t('Remove {n}', { n: p.what })} onPress={() => setItems((x) => x.filter((y) => y.id !== p.id))} />
            </View>
          </View>
        ))}
      </View>
      <View style={{ gap: space.s1 }}>
        <TextField label={t('Plan one more')} value={what} onChangeText={(v) => (setWhat(v), setAdded(null))} placeholder={t('A small pleasure')} onSubmitEditing={add} />
        <TextField label={t('With · optional')} value={withWho} onChangeText={setWithWho} placeholder={specimen ? t('Kavya, or no one') : t('A name, or no one')} />
        <Segmented value={day} onChange={setDay} items={DAYS.slice(3).map((d) => ({ value: d, label: dayShort(d, lang) }))} />
        <Segmented value={when} onChange={setWhen} items={WHEN.map((w) => ({ value: w.value, label: tx(w.label) }))} />
        <Button onPress={add} disabled={!what.trim()} icon="calendar">
          {t('Plan it for {day} {time}', { day: dayShort(day, lang), time })}
        </Button>
        {added ? (
          <Meta tone="ink" accessibilityLiveRegion="polite">
            {monoNums(t('Planned: {what} · {day} {time}. In your calendar like a meeting.', { what: added.what, day: dayShort(added.day, lang), time: added.time }))}
          </Meta>
        ) : null}
      </View>
    </ToolCard>
  )
}

function Savour() {
  const { space } = useTheme()
  const { t, tx } = useA()
  const { addLedger } = useApp()
  const [i, setI] = useState(0)
  const [did, setDid] = useState(false)
  const p = SAVOURING_PROMPTS[i]
  return (
    <ToolCard tone="sunk" title={t('Savour one thing')} lead={t('Six kinds of savouring from Bryant and Veroff. One at a time.')}>
      <View style={{ gap: space.s1 }} accessibilityLiveRegion="polite">
        <Eyebrow tone="daybreak">{tx(p.kind)}</Eyebrow>
        <Body size={19} style={{ lineHeight: 27 }}>
          {monoNums(tx(p.text))}
        </Body>
      </View>
      {did ? (
        <View style={{ gap: 2 }} accessibilityLiveRegion="polite">
          <Meta tone="ink2">{t('Noted in the Ledger as savoured. That is the whole practice.')}</Meta>
          <ArrowLink onPress={() => router.push('/ledger')}>{t('See it in the Ledger')}</ArrowLink>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: space.s1, flexWrap: 'wrap' }}>
        {did ? null : (
          <Button
            variant="ink"
            icon="check"
            onPress={() => {
              addLedger({ prompt: 3, tags: ['Rest'], word: t('Savoured · {kind}', { kind: tx(p.kind) }) })
              setDid(true)
            }}
          >
            {t('I did this')}
          </Button>
        )}
        <Button
          variant="ghost"
          iconRight="arrow-right"
          onPress={() => {
            setI((i + 1) % SAVOURING_PROMPTS.length)
            setDid(false)
          }}
        >
          {t('Another')}
        </Button>
      </View>
    </ToolCard>
  )
}

/** "2:40" → 160 seconds. */
const secs = (m: string) => {
  const [a, b] = m.split(':').map(Number)
  return a * 60 + (b || 0)
}

function Moments() {
  const { c, space } = useTheme()
  const { t, tx } = useA()
  const [open, setOpen] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [at, setAt] = useState(0)
  const film = FILMS.find((f) => f.id === open)
  const total = film ? secs(film.minutes) : 0
  useEffect(() => {
    if (!playing) return
    if (at >= total) {
      setPlaying(false)
      return
    }
    const tm = setTimeout(() => setAt((x) => x + 1), 1000)
    return () => clearTimeout(tm)
  }, [playing, at, total])
  const close = () => {
    setOpen(null)
    setPlaying(false)
    setAt(0)
  }
  const clock = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`
  return (
    <ToolCard title={t('Moments of Joy')} lead={t('Short films of members savouring ordinary things. Shared with their consent; no likes, no counts.')}>
      <View>
        {FILMS.map((f, i) => (
          <Pressable
            key={f.id}
            onPress={() => setOpen(f.id)}
            accessibilityRole="button"
            accessibilityLabel={t('{title}, {who}, {m} minutes. Opens the film.', { title: tx(f.title), who: f.who, m: f.minutes })}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: c.inkGround, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="play" size={18} color={c.onInk} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Body weight="medium">{monoNums(tx(f.title))}</Body>
              <Meta size={14}>{monoNums(f.who)}</Meta>
            </View>
            <Mono size={13} tone="ink3">
              {f.minutes}
            </Mono>
          </Pressable>
        ))}
      </View>
      <MyMomentOfJoy />
      <Sheet
        open={!!film}
        onClose={close}
        title={film ? tx(film.title) : t('Moments of Joy')}
        footer={
          film ? (
            <View style={{ flexDirection: 'row', gap: space.s1 }}>
              <Button variant="ink" icon={playing ? 'pause' : 'play'} onPress={() => (at >= total ? (setAt(0), setPlaying(true)) : setPlaying(!playing))} style={{ flex: 1 }}>
                {playing ? t('Pause') : at >= total ? t('Watch again') : at > 0 ? t('Resume') : t('Play')}
              </Button>
              <Button variant="secondary" onPress={close} style={{ flex: 1 }}>
                {t('Close')}
              </Button>
            </View>
          ) : null
        }
      >
        {film ? (
          <>
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel={t('Film: {title}. {note}', { title: tx(film.title), note: tx(film.note) })}
              style={{ aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: c.inkGround, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name={playing ? 'pause' : 'play'} size={36} color={c.onInk} />
            </View>
            <View style={{ gap: 6 }}>
              <Progress value={at} max={total} color={c.ink} label={t('{a} of {b}', { a: clock(at), b: film.minutes })} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Mono size={12} tone="ink3">
                  {clock(at)}
                </Mono>
                <Mono size={12} tone="ink3">
                  {film.minutes}
                </Mono>
              </View>
            </View>
            <Eyebrow>{film.who}</Eyebrow>
            <Body>{monoNums(tx(film.note))}</Body>
            {at >= total ? (
              <View style={{ gap: 2 }} accessibilityLiveRegion="polite">
                <Meta tone="ink">{t('Watched. If it brought something to mind, the Ledger is one tap away.')}</Meta>
                <ArrowLink
                  onPress={() => {
                    close()
                    router.push('/ledger')
                  }}
                >
                  {t('Add to the Ledger')}
                </ArrowLink>
              </View>
            ) : null}
            <Meta size={14} tone="ink3">
              {t('Captioned in English, Tamil and Hindi. Filmed with consent; the member can withdraw it at any time.')}
            </Meta>
          </>
        ) : null}
      </Sheet>
    </ToolCard>
  )
}

/** #MyMomentOfJoy: off by default; when on, the member may share one of their latest Ledger moments. */
function MyMomentOfJoy() {
  const { c, space, radius } = useTheme()
  const { t, tx, lang } = useA()
  const { ledger } = useApp()
  const [trust] = useStore(trustStore)
  const [optIn, setOptIn] = useLocal('myMomentOfJoy', false)
  const [shared, setShared] = useLocal<string[]>('myMomentOfJoyShared', [])
  const publishing = 'c_pub' in trust.consents ? trust.consents.c_pub : (CONSENTS.find((x) => x.id === 'c_pub')?.granted ?? false)
  // The three newest moments still in the Ledger; one removed there is no longer offered or shared.
  const recent = [...ledger].sort((a, b) => (ledgerStamp(a) < ledgerStamp(b) ? 1 : -1)).slice(0, 3)
  const live = shared.filter((id) => ledger.some((e) => e.id === id))
  // Withdrawing Publishing consent, or turning #MyMomentOfJoy off, takes back everything shared under it.
  useEffect(() => {
    if ((!publishing || !optIn) && shared.length) setShared([])
  }, [publishing, optIn, shared.length, setShared])
  return (
    <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: space.s2, gap: space.s1 }}>
      <Toggle checked={optIn} onChange={setOptIn} label="#MyMomentOfJoy" description={t('Off by default. If on, you may choose a Ledger moment to share as a film or photo. Never a score, never health data, and you can take it back any time.')} />
      {optIn ? (
        !publishing ? (
          <View style={{ gap: 6 }}>
            <Meta tone="ink">{t('Publishing consent is off in the Trust centre, so nothing can be shared. What you shared before has been taken back.')}</Meta>
            <ArrowLink icon="shield" onPress={() => router.push('/trust')}>
              {t('Open the Trust centre')}
            </ArrowLink>
          </View>
        ) : (
          <View style={{ gap: space.s1 }}>
            <Meta>{t('Under your Publishing consent. Nothing is shared until you pick a moment below and press share on it.')}</Meta>
            <Eyebrow>{t('Your three latest Ledger moments')}</Eyebrow>
            {recent.length === 0 ? (
              <View style={{ gap: 6 }}>
                <EmptyIllustration kind="ledger" fill="D" width={128} />
                <Meta tone="ink2" align="center">{t('No Ledger moments this week yet.')}</Meta>
              </View>
            ) : null}
            {recent.map((e) => {
              const on = live.includes(e.id)
              const what = e.word ?? e.tags.map((x) => tx(x)).join(lang === 'en' ? ' & ' : ', ')
              return (
                <View key={e.id} style={{ backgroundColor: c.paperSunk, borderRadius: 12, padding: 12, gap: 6 }}>
                  <Body>{monoNums(what)}</Body>
                  <Meta size={13} tone="ink3">
                    <Mono size={13} tone="ink3">{ledgerWhen(ledgerStamp(e), lang)}</Mono>
                    {` · ${e.tags.map((x) => tx(x)).join(', ')}${e.photo ? t(' · photo') : ''}`}
                  </Meta>
                  {on ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }} accessibilityLiveRegion="polite">
                      <Icon name="check" size={14} color={c.ink2} />
                      <Meta size={14} tone="ink2">{t('Shared as #MyMomentOfJoy')}</Meta>
                      <Button variant="link" size="sm" onPress={() => setShared((x) => x.filter((y) => y !== e.id))} accessibilityLabel={t('Take back {x}', { x: what })}>
                        {t('Take it back')}
                      </Button>
                    </View>
                  ) : (
                    <Button size="sm" variant="secondary" icon="share-2" onPress={() => setShared((x) => [...x.filter((y) => y !== e.id), e.id])} accessibilityLabel={t('Share {x} as #MyMomentOfJoy', { x: what })} style={{ alignSelf: 'flex-start' }}>
                      {t('Share this moment')}
                    </Button>
                  )}
                </View>
              )
            })}
            <Meta size={13} tone="ink3">
              {t('Only the words and photo of that moment are shared. No score, no health data, no location.')}
            </Meta>
          </View>
        )
      ) : null}
    </View>
  )
}
