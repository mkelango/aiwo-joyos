import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { View } from 'react-native'
import {
  ArrowLink,
  Body,
  Button,
  Card,
  DaybreakButton,
  Divider,
  Eyebrow,
  Icon,
  Meta,
  Mono,
  Screen,
  ScreenHeader,
  Serif,
  Sheet,
  SpecimenTag,
  TermChip,
  Title,
} from '@/components'
import { useT } from '@/lib/i18n'
import { interceptsCrisis, useApp } from '@/lib/store'
import { LEDGER_CALENDAR, LEDGER_SCHEDULE, LEDGER_STORY } from '@/screens/a/coreData'
import { H2, isSpecimenToday, ledgerStamp, madeHere, ledgerWhen, shiftTime, useLocal } from '@/screens/a/local'
import { BarRow, Chip, IconButton, Provenance, TextField } from '@/screens/a/parts'
import { LEDGER_TAGS, LEDGER_WEEK } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { notifPrefsStore, useStore } from '@/screens/b/bStore'
import { memberOnly } from '@/screens/b/parts'

// JOY LEDGER (Memo p.17 · Daily Pleasure): three light prompts a day, a tag or two and
// an optional word — ten seconds. Then, weekly, where joy came from. No streaks, no counts
// held against you; an empty day is fine.

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
/** Three full weeks and Monday to Wednesday of this one; today (Thursday 28 Jan) follows. */
const CAL = LEDGER_CALENDAR.slice(-24)

export default memberOnly(Ledger)

function Ledger() {
  const t = useT()
  const { c, space, term } = useTheme()
  const { ledger, addLedger, setCrisisOpen, lang } = useApp()
  const [tags, setTags] = useState<string[]>([])
  const [word, setWord] = useState('')
  const [state, setState] = useState<'ask' | 'saved' | 'skipped'>('ask')
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState(false)
  const [times, setTimes] = useLocal('ledgerTimes', LEDGER_SCHEDULE.map((s) => s.time))
  const [timesOpen, setTimesOpen] = useState(false)
  const [draftTimes, setDraftTimes] = useState<string[]>(times)
  const [timesSaved, setTimesSaved] = useState(false)
  const col = term('D')
  // The same quiet hours and channels that Settings, Notifications and onboarding keep.
  const [prefs] = useStore(notifPrefsStore)
  const toMin = (x: string) => Number(x.slice(0, 2)) * 60 + Number(x.slice(3))
  // The last prompt stays at least fifteen minutes before quiet hours begin (evening start), else by 21:30.
  const latestPrompt = toMin(prefs.quiet.from) >= 18 * 60 ? toMin(prefs.quiet.from) - 15 : 21 * 60 + 30
  const schedule = LEDGER_SCHEDULE.map((s, i) => ({ ...s, time: times[i] ?? s.time }))
  const prompt = schedule[1]
  const nextPrompt = schedule[2]
  const todayCount = ledger.filter(isSpecimenToday).length
  const recent = useMemo(
    () => ledger.map((e) => ({ e, stamp: ledgerStamp(e) })).sort((a, b) => (a.stamp < b.stamp ? 1 : a.stamp > b.stamp ? -1 : 0)).slice(0, 6),
    [ledger],
  )

  // The specimen week plus every moment kept on this phone today, so the bars survive a reload.
  const week = useMemo(() => {
    const m = new Map(LEDGER_WEEK.map((w) => [w.tag, w.count]))
    ledger.filter((e) => madeHere(e) && isSpecimenToday(e)).forEach((e) => e.tags.forEach((tg) => m.set(tg, (m.get(tg) ?? 0) + 1)))
    return [...m.entries()].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count)
  }, [ledger])
  const total = week.reduce((a, b) => a + b.count, 0)

  const toggle = (tg: string) => {
    setError('')
    setTags((x) => (x.includes(tg) ? x.filter((y) => y !== tg) : x.length >= 3 ? x : [...x, tg]))
  }
  const save = () => {
    const w = word.trim()
    // Emergency intercept first, before the word is stored (Memo p.24).
    if (w && interceptsCrisis(w)) {
      setCrisisOpen(true)
      return
    }
    if (!tags.length) {
      setError('Choose at least one tag, or tap “Nothing just now”.')
      return
    }
    addLedger({ prompt: prompt.prompt, tags, word: w || undefined, photo: photo || undefined })
    setState('saved')
  }
  const reset = () => {
    setTags([])
    setWord('')
    setPhoto(false)
    setState('ask')
  }

  return (
    <Screen>
      <ScreenHeader back eyebrow={`Joy Ledger · prompt ${prompt.prompt} of 3 · ${prompt.time}`} title={lang === 'en' ? <>Anything <Serif>good</Serif> in the last few hours?</> : t('ledgerPrompt')} />

      {/* The prompt */}
      {state === 'ask' ? (
        <Card tone="raised" style={{ gap: space.s2 }}>
          <View style={{ gap: 6 }}>
            <Eyebrow>Where was it? Up to three</Eyebrow>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {LEDGER_TAGS.map((tg) => (
                <Chip key={tg} label={tg} selected={tags.includes(tg)} onPress={() => toggle(tg)} />
              ))}
            </View>
          </View>
          <TextField label="A word or a few · optional" value={word} onChangeText={setWord} placeholder="Lunch with Kavya" maxLength={60} returnKeyType="done" onSubmitEditing={save} />
          {photo ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
              <View
                accessible
                accessibilityRole="image"
                accessibilityLabel="Photo attached"
                style={{ width: 72, height: 72, borderRadius: 12, backgroundColor: col.soft, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="image" size={24} color={col.ink} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Meta tone="ink">Photo attached</Meta>
                <Meta size={14} tone="ink3">
                  Kept on this phone with the moment.
                </Meta>
              </View>
              <IconButton icon="x" label="Remove the photo" onPress={() => setPhoto(false)} />
            </View>
          ) : (
            <Button variant="ghost" size="sm" icon="camera" onPress={() => setPhoto(true)} accessibilityHint="Attaches a photo to this moment">
              Add a photo · optional
            </Button>
          )}
          {error ? (
            <Meta tone="error" accessibilityLiveRegion="polite">
              {error}
            </Meta>
          ) : null}
          <View style={{ gap: space.s1 }}>
            <DaybreakButton onPress={save} accessibilityHint="Saves this moment to your Joy Ledger">
              Save · 10 seconds
            </DaybreakButton>
            <Button variant="ghost" onPress={() => setState('skipped')} style={{ alignSelf: 'center' }}>
              Nothing just now
            </Button>
          </View>
        </Card>
      ) : (
        <Card tone={state === 'saved' ? 'soft' : 'sunk'} style={{ gap: space.s1 }}>
          <View accessibilityLiveRegion="polite" style={{ gap: space.s1 }}>
            <Title size={26}>
              {state === 'saved' ? (
                <>
                  Kept. <Serif>Thank you.</Serif>
                </>
              ) : (
                `That’s fine. The next prompt is at ${nextPrompt.time}.`
              )}
            </Title>
            <Meta>{state === 'saved' ? `${tags.join(' · ')}${word.trim() ? ` · “${word.trim()}”` : ''}${photo ? ' · with a photo' : ''}. Saved on this phone; it syncs when you are online.` : 'An empty few hours is not a missed day. Nothing is counted against you.'}</Meta>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2, flexWrap: 'wrap' }}>
            <Button variant="link" onPress={reset}>
              {state === 'saved' ? 'Add another moment' : 'Actually, there was something'}
            </Button>
            {state === 'saved' ? (
              <ArrowLink icon="sun" onPress={() => router.push('/')}>
                Back to Today
              </ArrowLink>
            ) : null}
          </View>
        </Card>
      )}

      {/* This week */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <Eyebrow {...H2}>This week · where joy came from</Eyebrow>
          <TermChip term="D" />
        </View>
        <Meta>
          Moments by tag, Monday to today. <Mono size={15} tone="ink">{String(total)}</Mono> so far; most from {week[0].tag.toLowerCase()} and {week[1].tag.toLowerCase()}.
        </Meta>
        <View style={{ gap: 12 }}>
          {week.slice(0, 6).map((w) => (
            <BarRow key={w.tag} label={w.tag} value={w.count} max={week[0].count} color={col.main} />
          ))}
        </View>
        <Divider />
        <Body>{LEDGER_STORY.sentences}</Body>
        <Provenance tool={LEDGER_STORY.tool} prompt={LEDGER_STORY.prompt} />
        <SpecimenTag />
      </Card>

      {/* Four weeks */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <Eyebrow {...H2}>Four weeks</Eyebrow>
          <TermChip term="D" />
        </View>
        <Meta>Each dot is a day, Monday to Sunday; larger means more moments. Empty days are part of it.</Meta>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Joy Ledger, Daily Pleasure, the last four weeks: ${CAL.filter((n) => n > 0).length + (todayCount ? 1 : 0)} of ${CAL.length + 1} days with at least one moment, ${CAL.reduce((a, b) => a + b, 0) + todayCount} moments in all.`}
          style={{ gap: 8 }}
        >
          <View style={{ flexDirection: 'row' }}>
            {WEEKDAYS.map((d, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Eyebrow size={11}>{d}</Eyebrow>
              </View>
            ))}
          </View>
          {[0, 1, 2, 3].map((r) => (
            <View key={r} style={{ flexDirection: 'row' }}>
              {WEEKDAYS.map((_, i) => {
                const isToday = r * 7 + i === CAL.length
                const n = isToday ? Math.min(todayCount, 3) : CAL[r * 7 + i]
                const sz = n === undefined ? 0 : n === 0 ? 8 : 12 + n * 6
                return (
                  <View key={i} style={{ flex: 1, height: 34, alignItems: 'center', justifyContent: 'center' }}>
                    {isToday ? (
                      <View style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: c.ink, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
                        {n ? <View style={{ width: Math.min(sz, 26), height: Math.min(sz, 26), borderRadius: 13, backgroundColor: col.main }} /> : null}
                      </View>
                    ) : n === undefined ? null : (
                      <View style={{ width: sz, height: sz, borderRadius: sz / 2, backgroundColor: n === 0 ? c.line : col.main }} />
                    )}
                  </View>
                )
              })}
            </View>
          ))}
        </View>
        <Meta size={14} tone="ink3">
          {todayCount ? `The dashed ring is today: ${todayCount} ${todayCount === 1 ? 'moment' : 'moments'} so far.` : 'The dashed ring is today. Nothing yet, and that is fine.'}
        </Meta>
      </Card>

      {/* Recent */}
      <Card tone="raised" style={{ gap: space.s1 }}>
        <Eyebrow {...H2}>Recent moments</Eyebrow>
        {recent.map(({ e, stamp }, i) => {
          const when = ledgerWhen(stamp)
          return (
            <View key={e.id} style={{ flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.line }}>
              <Mono size={13} tone="ink3" style={{ width: 92 }}>
                {when}
              </Mono>
              <View style={{ flex: 1, gap: 2 }}>
                <Body>{e.word ?? e.tags.join(' · ')}</Body>
                {e.word ? <Meta size={14}>{e.tags.join(' · ')}</Meta> : null}
              </View>
              {e.photo ? <Icon name="image" size={16} color={c.ink3} accessibilityLabel="With a photo" /> : null}
            </View>
          )
        })}
      </Card>

      {/* Schedule */}
      <Card tone="outline" style={{ gap: space.s1 }}>
        <Eyebrow {...H2}>When the prompts come</Eyebrow>
        {schedule.map((s) => (
          <View key={s.prompt} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 36 }}>
            <Mono tone="ink" size={15}>
              {s.time}
            </Mono>
            <Meta style={{ flex: 1 }}>{s.label}</Meta>
            {s.prompt === prompt.prompt ? <Eyebrow tone="daybreak">Now</Eyebrow> : null}
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <Icon name="moon" size={14} color={c.ink3} />
          <Meta size={14} tone="ink3" style={{ flex: 1 }}>
            {`Quiet hours ${prefs.quiet.from} – ${prefs.quiet.to}. ${prefs.channels.whatsapp ? 'Prompts also come by WhatsApp, never clinical content.' : 'WhatsApp prompts are off until you allow them.'}`}
          </Meta>
        </View>
        {timesSaved ? (
          <Meta tone="ink" accessibilityLiveRegion="polite">
            Saved. New times start with the next prompt.
          </Meta>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            icon="clock"
            onPress={() => {
              setDraftTimes(schedule.map((s) => s.time))
              setTimesOpen(true)
            }}
          >
            Change the times
          </Button>
          <ArrowLink icon="settings" onPress={() => router.push('/settings')}>
            Quiet hours
          </ArrowLink>
        </View>
      </Card>

      <Sheet
        open={timesOpen}
        onClose={() => setTimesOpen(false)}
        title="When the prompts come"
        footer={
          <Button
            variant="ink"
            block
            onPress={() => {
              setTimes(draftTimes)
              setTimesSaved(true)
              setTimesOpen(false)
            }}
          >
            Save these times
          </Button>
        }
      >
        <Meta>Three light prompts a day. Move each one in fifteen-minute steps; they stay at least an hour apart.</Meta>
        {LEDGER_SCHEDULE.map((s, i) => {
          const t = draftTimes[i] ?? s.time
          const prev = draftTimes[i - 1]
          const nxt = draftTimes[i + 1]
          const mins = (x: string) => Number(x.slice(0, 2)) * 60 + Number(x.slice(3))
          const canEarlier = mins(t) - 15 >= (prev ? mins(prev) + 60 : 6 * 60)
          const canLater = mins(t) + 15 <= (nxt ? mins(nxt) - 60 : latestPrompt)
          return (
            <View key={s.prompt} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, minHeight: 56, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Eyebrow>{`Prompt ${s.prompt}`}</Eyebrow>
                <Meta tone="ink">{s.label}</Meta>
              </View>
              <IconButton icon="minus" label={`Prompt ${s.prompt} fifteen minutes earlier`} onPress={() => setDraftTimes((d) => d.map((x, j) => (j === i ? shiftTime(x, -15) : x)))} disabled={!canEarlier} />
              <Mono tone="ink" size={20} style={{ minWidth: 64, textAlign: 'center' }} accessibilityLiveRegion="polite">
                {t}
              </Mono>
              <IconButton icon="plus" label={`Prompt ${s.prompt} fifteen minutes later`} onPress={() => setDraftTimes((d) => d.map((x, j) => (j === i ? shiftTime(x, 15) : x)))} disabled={!canLater} />
            </View>
          )
        })}
        <Meta size={14} tone="ink3">
          {`The last prompt stays before quiet hours begin at ${prefs.quiet.from}.`}
        </Meta>
      </Sheet>
    </Screen>
  )
}
