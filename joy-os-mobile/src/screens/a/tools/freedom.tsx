import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Body, Divider, Eyebrow, Icon, Meta, Mono, Segmented, Toggle } from '@/components'
import { interceptsCrisis, useApp } from '@/lib/store'
import { useLocal } from '@/screens/a/local'
import { Chip, IconButton, TextField } from '@/screens/a/parts'
import { NO_SUGGESTIONS, PEACE_OF_MIND, TIME_AUDIT, TIME_KINDS } from '@/screens/a/spacesData'
import { useTheme } from '@/theme/ThemeProvider'
import { ToolCard, ToolsHeading } from './common'

// FREEDOM: the time audit (calendar summarised, then discarded), the No list, the weekly
// sabbath, and the peace-of-mind list. Never financial advice.

export function FreedomTools() {
  return (
    <>
      <ToolsHeading>Freedom tools</ToolsHeading>
      <TimeAudit />
      <NoList />
      <Sabbath />
      <PeaceOfMind />
    </>
  )
}

type Kind = (typeof TIME_KINDS)[number]['key']

function TimeAudit() {
  const { c, resolve, space } = useTheme()
  const totals = TIME_KINDS.map((k) => ({ ...k, hours: TIME_AUDIT.reduce((a, d) => a + d[k.key as Kind], 0) }))
  const all = totals.reduce((a, b) => a + b.hours, 0)
  const pct = (h: number) => Math.round((h / all) * 100)
  const maxDay = Math.max(...TIME_AUDIT.map((d) => d.mine + d.chosenWork + d.asked + d.admin))
  const yours = totals.find((t) => t.key === 'mine')!
  const asked = totals.find((t) => t.key === 'asked')!
  return (
    <ToolCard
      title="Time audit · two weeks"
      lead={`Your planned hours, by whose they were. ${pct(yours.hours)}% were yours; ${pct(asked.hours)}% were asked of you, mostly Tuesday and Wednesday.`}
    >
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Time audit, 14 days. ${totals.map((t) => `${t.label} ${pct(t.hours)} percent`).join(', ')}. Weekends were mostly yours.`}
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
                {d.day.slice(0, 1)}
              </Mono>
            </View>
          )
        })}
      </View>
      <View style={{ gap: 8 }}>
        {totals.map((t) => (
          <View key={t.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: resolve(t.color) }} />
            <Meta tone="ink" style={{ flex: 1 }}>
              {t.label} <Meta size={14} tone="ink3">· {t.note}</Meta>
            </Meta>
            <Mono tone="ink">{`${pct(t.hours)}%`}</Mono>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.s1 }}>
        <Icon name="shield" size={14} color={c.ink3} />
        <Meta size={14} tone="ink3" style={{ flex: 1 }}>
          Google Calendar · entries summarised, then discarded. Priya sees totals only.
        </Meta>
      </View>
    </ToolCard>
  )
}

function NoList() {
  const { space } = useTheme()
  const { setCrisisOpen } = useApp()
  const [list, setList] = useLocal<string[]>('noList', ['Checking email after 21:00'])
  const [draft, setDraft] = useState('')
  const full = list.length >= 3
  const toggle = (s: string) => setList((l) => (l.includes(s) ? l.filter((x) => x !== s) : l.length >= 3 ? l : [...l, s]))
  const add = () => {
    const t = draft.trim()
    if (!t) return
    if (interceptsCrisis(t)) {
      setCrisisOpen(true)
      return
    }
    if (list.length < 3) setList((l) => [...l, t])
    setDraft('')
  }
  return (
    <ToolCard title="The No list" aside={<Mono tone="ink3" size={13}>{`${list.length} of 3`}</Mono>} lead="Three things to stop this quarter. Saying no to these is saying yes to your evenings.">
      <View style={{ gap: 4 }}>
        {list.length === 0 ? <Meta tone="ink3">Nothing yet. Pick from below or write your own.</Meta> : null}
        {list.map((n, i) => (
          <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
            <Mono size={13} tone="ink3">
              {String(i + 1)}
            </Mono>
            <Body style={{ flex: 1 }}>{n}</Body>
            <IconButton icon="x" label={`Remove ${n}`} onPress={() => setList((l) => l.filter((x) => x !== n))} />
          </View>
        ))}
      </View>
      <View style={{ gap: 8 }}>
        <Eyebrow>Others often choose</Eyebrow>
        {full ? (
          <Meta tone="ink" accessibilityLiveRegion="polite">
            Full. Remove one to add another.
          </Meta>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, opacity: full ? 0.5 : 1 }} pointerEvents={full ? 'none' : 'auto'}>
          {NO_SUGGESTIONS.filter((s) => !list.includes(s))
            .slice(0, 4)
            .map((s) => (
              <Chip key={s} label={s} selected={false} icon="plus" onPress={() => (full ? undefined : toggle(s))} accessibilityHint={full ? 'The list is full; remove one first.' : 'Adds it to your No list.'} />
            ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s1 }}>
        <TextField label="Your own" value={draft} onChangeText={setDraft} placeholder="Something to stop" onSubmitEditing={add} style={{ flex: 1 }} />
        <IconButton icon="plus" label="Add to the No list" onPress={add} tone="ink" disabled={!draft.trim() || list.length >= 3} />
      </View>
    </ToolCard>
  )
}

function Sabbath() {
  const [sab, setSab] = useLocal('sabbath', { on: true, day: 'sun' as 'sat' | 'sun' })
  const on = sab.on
  const day = sab.day
  const setOn = (v: boolean) => setSab((x) => ({ ...x, on: v }))
  const setDay = (v: 'sat' | 'sun') => setSab((x) => ({ ...x, day: v }))
  return (
    <ToolCard title="The weekly sabbath" lead="One day a week, sunrise to sunset, with no work and no screens. Your circle knows; your office does not need to.">
      <Toggle checked={on} onChange={setOn} label="Keep a weekly sabbath" description={on ? `Every ${day === 'sun' ? 'Sunday' : 'Saturday'}, sunrise to sunset: no work, no screens. Notifications pause.` : 'Off. Turn it on whenever you are ready.'} />
      {on ? <Segmented value={day} onChange={setDay} items={[{ value: 'sat', label: 'Saturday' }, { value: 'sun', label: 'Sunday' }]} /> : null}
    </ToolCard>
  )
}

function PeaceOfMind() {
  const { c } = useTheme()
  const [items, setItems] = useLocal('peaceOfMind', PEACE_OF_MIND)
  const done = items.filter((x) => x.done).length
  return (
    <ToolCard title="Peace of mind" aside={<Mono tone="ink3" size={13}>{`${done} of ${items.length}`}</Mono>} lead="Five things that let the people you love stop worrying. Not financial advice: your adviser holds the details.">
      <View>
        {items.map((x, i) => (
          <View key={x.id}>
            {i > 0 ? <Divider /> : null}
            <Pressable
              onPress={() => setItems((all) => all.map((y) => (y.id === x.id ? { ...y, done: !y.done } : y)))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: x.done }}
              accessibilityLabel={`${x.title}. ${x.detail}`}
              style={({ pressed }) => ({ flexDirection: 'row', gap: 12, paddingVertical: 12, opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{ width: 22, height: 22, marginTop: 2, borderRadius: 6, borderWidth: 2, borderColor: x.done ? c.ink : c.lineStrong, backgroundColor: x.done ? c.ink : undefined, alignItems: 'center', justifyContent: 'center' }}>
                {x.done ? <Icon name="check" size={14} color={c.paper} /> : null}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Body weight="medium">{x.title}</Body>
                <Meta size={14}>{x.detail}</Meta>
              </View>
            </Pressable>
          </View>
        ))}
      </View>
    </ToolCard>
  )
}
