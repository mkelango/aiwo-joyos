import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { ArrowLink, Body, Button, Divider, Eyebrow, Icon, Meta, Mono, Progress, Segmented, Sheet } from '@/components'
import { interceptsCrisis, useApp } from '@/lib/store'
import { useLocal } from '@/screens/a/local'
import { BarRow, IconButton, TextField } from '@/screens/a/parts'
import { FILMS, PLANNED_START, SAVOURING_PROMPTS } from '@/screens/a/spacesData'
import { LEDGER_WEEK } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { ToolCard, ToolsHeading } from './common'

// PLEASURE: what the Joy Ledger says this week, planned pleasures, a savouring prompt,
// and Moments of Joy (short films of members savouring ordinary things).

export function PleasureTools() {
  return (
    <>
      <ToolsHeading>Pleasure tools</ToolsHeading>
      <LedgerInsight />
      <Planned />
      <Savour />
      <Moments />
    </>
  )
}

function LedgerInsight() {
  const { term } = useTheme()
  const col = term('D')
  const top = LEDGER_WEEK.slice(0, 5)
  const total = LEDGER_WEEK.reduce((a, b) => a + b.count, 0)
  return (
    <ToolCard
      title="Joy Ledger · this week"
      aside={<Mono tone="ink3" size={13}>{`${total} moments`}</Mono>}
      lead={`Daily Pleasure moments by tag. Joy came most from ${top[0].tag.toLowerCase()} and ${top[1].tag.toLowerCase()}, usually around lunch.`}
    >
      <View style={{ gap: 12 }}>
        {top.map((t) => (
          <BarRow key={t.tag} label={t.tag} value={t.count} max={top[0].count} color={col.main} />
        ))}
      </View>
      <ArrowLink icon="plus-circle" onPress={() => router.push('/ledger')}>
        Add to the Ledger
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
  const { setCrisisOpen } = useApp()
  const [items, setItems] = useLocal('plannedPleasures', PLANNED_START)
  const [what, setWhat] = useState('')
  const [withWho, setWithWho] = useState('')
  const [day, setDay] = useState('Thu')
  const [when, setWhen] = useState<When>('evening')
  const [added, setAdded] = useState('')
  const time = WHEN.find((w) => w.value === when)!.time
  const add = () => {
    const t = what.trim()
    const w = withWho.trim()
    if (!t) return
    if (interceptsCrisis(`${t} ${w}`)) {
      setCrisisOpen(true)
      return
    }
    setItems((x) => [...x, { id: `pp${Date.now()}`, day, time, what: t, minutes: 10, with: w }])
    setWhat('')
    setWithWho('')
    setAdded(`${t} · ${day} ${time}. In your calendar like a meeting.`)
  }
  return (
    <ToolCard title="Planned pleasures" lead="Pleasure planned is pleasure kept. Put it in the calendar like a meeting.">
      <View>
        {items.map((p, i) => (
          <View key={p.id}>
            {i > 0 ? <Divider /> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
              <View style={{ width: 52 }}>
                <Mono tone="ink" size={15}>
                  {p.day}
                </Mono>
                <Mono tone="ink3" size={12}>
                  {p.time}
                </Mono>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Body>{p.what}</Body>
                <Meta size={14} tone="ink3">
                  {p.minutes} min{p.with ? ` · with ${p.with}` : ''}
                </Meta>
              </View>
              <IconButton icon="x" label={`Remove ${p.what}`} onPress={() => setItems((x) => x.filter((y) => y.id !== p.id))} />
            </View>
          </View>
        ))}
      </View>
      <View style={{ gap: space.s1 }}>
        <TextField label="Plan one more" value={what} onChangeText={(v) => (setWhat(v), setAdded(''))} placeholder="A small pleasure" onSubmitEditing={add} />
        <TextField label="With · optional" value={withWho} onChangeText={setWithWho} placeholder="Kavya, or no one" />
        <Segmented value={day} onChange={setDay} items={DAYS.slice(3).map((d) => ({ value: d, label: d }))} />
        <Segmented value={when} onChange={setWhen} items={WHEN.map((w) => ({ value: w.value, label: w.label }))} />
        <Button onPress={add} disabled={!what.trim()} icon="calendar">
          {`Plan it for ${day} ${time}`}
        </Button>
        {added ? (
          <Meta tone="ink" accessibilityLiveRegion="polite">
            {`Planned: ${added}`}
          </Meta>
        ) : null}
      </View>
    </ToolCard>
  )
}

function Savour() {
  const { space } = useTheme()
  const { addLedger } = useApp()
  const [i, setI] = useState(0)
  const [did, setDid] = useState(false)
  const p = SAVOURING_PROMPTS[i]
  return (
    <ToolCard tone="sunk" title="Savour one thing" lead="Six kinds of savouring from Bryant and Veroff. One at a time.">
      <View style={{ gap: space.s1 }} accessibilityLiveRegion="polite">
        <Eyebrow tone="daybreak">{p.kind}</Eyebrow>
        <Body size={19} style={{ lineHeight: 27 }}>
          {p.text}
        </Body>
      </View>
      {did ? (
        <View style={{ gap: 2 }} accessibilityLiveRegion="polite">
          <Meta tone="ink2">Noted in the Ledger as savoured. That is the whole practice.</Meta>
          <ArrowLink onPress={() => router.push('/ledger')}>See it in the Ledger</ArrowLink>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: space.s1, flexWrap: 'wrap' }}>
        {did ? null : (
          <Button
            variant="ink"
            icon="check"
            onPress={() => {
              addLedger({ prompt: 3, tags: ['Rest'], word: `Savoured · ${p.kind}` })
              setDid(true)
            }}
          >
            I did this
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
          Another
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
    const t = setTimeout(() => setAt((x) => x + 1), 1000)
    return () => clearTimeout(t)
  }, [playing, at, total])
  const close = () => {
    setOpen(null)
    setPlaying(false)
    setAt(0)
  }
  const clock = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`
  return (
    <ToolCard title="Moments of Joy" lead="Short films of members savouring ordinary things. Shared with their consent; no likes, no counts.">
      <View>
        {FILMS.map((f, i) => (
          <Pressable
            key={f.id}
            onPress={() => setOpen(f.id)}
            accessibilityRole="button"
            accessibilityLabel={`${f.title}, ${f.who}, ${f.minutes} minutes. Opens the film.`}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: c.inkGround, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="play" size={18} color={c.onInk} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Body weight="medium">{f.title}</Body>
              <Meta size={14}>{f.who}</Meta>
            </View>
            <Mono size={13} tone="ink3">
              {f.minutes}
            </Mono>
          </Pressable>
        ))}
      </View>
      <Sheet
        open={!!film}
        onClose={close}
        title={film?.title ?? 'Moments of Joy'}
        footer={
          film ? (
            <View style={{ flexDirection: 'row', gap: space.s1 }}>
              <Button variant="ink" icon={playing ? 'pause' : 'play'} onPress={() => (at >= total ? (setAt(0), setPlaying(true)) : setPlaying(!playing))} style={{ flex: 1 }}>
                {playing ? 'Pause' : at >= total ? 'Watch again' : at > 0 ? 'Resume' : 'Play'}
              </Button>
              <Button variant="secondary" onPress={close} style={{ flex: 1 }}>
                Close
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
              accessibilityLabel={`Film: ${film.title}. ${film.note}`}
              style={{ aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: c.inkGround, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name={playing ? 'pause' : 'play'} size={36} color={c.onInk} />
            </View>
            <View style={{ gap: 6 }}>
              <Progress value={at} max={total} color={c.ink} label={`${clock(at)} of ${film.minutes}`} />
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
            <Body>{film.note}</Body>
            {at >= total ? (
              <View style={{ gap: 2 }} accessibilityLiveRegion="polite">
                <Meta tone="ink">Watched. If it brought something to mind, the Ledger is one tap away.</Meta>
                <ArrowLink
                  onPress={() => {
                    close()
                    router.push('/ledger')
                  }}
                >
                  Add to the Ledger
                </ArrowLink>
              </View>
            ) : null}
            <Meta size={14} tone="ink3">
              Captioned in English, Tamil and Hindi. Filmed with consent; the member can withdraw it at any time.
            </Meta>
          </>
        ) : null}
      </Sheet>
    </ToolCard>
  )
}
