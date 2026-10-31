import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { ArrowLink, Avatar, Body, Button, DaybreakButton, Eyebrow, Icon, InkSurface, Meta, MethodLine, Mono, Numeral, Segmented, Serif, Sheet, TermDot, Title } from '@/components'
import { interceptsCrisis, useApp } from '@/lib/store'
import { H2 } from '@/screens/a/local'
import { DAY90_DATES, DAY90_TERMS, DAY90_WHY, NEXT_90 } from '@/screens/a/coreData'
import { INK, InkScreen, TextField } from '@/screens/a/parts'
import { DAY90_SPECIMEN, INDEX_HISTORY, TEAM } from '@/shared/member'
import { termByKey } from '@/shared/terms'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'

// DAY 90 (Memo p.18 screen 04; Playbook p39): the re-measure where the number went down.
// Warm Ink ground in both schemes. A fall is a sentence and a named person, never red,
// never a streak lost. The Index moved 64 → 61; Freedom fell; Dr Meera calls on Thursday.

const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']
const SLOTS = [
  { value: 'thu', label: 'Thu 18:30', long: DAY90_DATES.call },
  { value: 'fri', label: 'Fri 08:00', long: 'Friday 9 April · 08:00' },
  { value: 'sat', label: 'Sat 10:30', long: 'Saturday 10 April · 10:30' },
] as const
type Slot = (typeof SLOTS)[number]['value']

export default function Day90() {
  const { space, radius } = useTheme()
  const meera = TEAM.find((p) => p.id === 'p_meera')!
  const { setCrisisOpen } = useApp()
  const [confirmed, setConfirmed] = useState(false)
  const [slot, setSlot] = useState<Slot>('thu')
  const [pick, setPick] = useState<Slot>('thu')
  const [slotOpen, setSlotOpen] = useState(false)
  const [planState, setPlanState] = useState<'open' | 'agreed' | 'note' | 'noted'>('open')
  const [note, setNote] = useState('')
  const when = SLOTS.find((x) => x.value === slot)!
  const saveNote = () => {
    const t = note.trim()
    if (!t) return
    if (interceptsCrisis(t)) {
      setCrisisOpen(true)
      return
    }
    setPlanState('noted')
  }
  const [open, setOpen] = useState<TermKey | null>('F')
  const before = INDEX_HISTORY[0]
  const fell = DAY90_SPECIMEN.from - DAY90_SPECIMEN.to

  const back = (
    <View style={{ paddingHorizontal: space.gutter, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        accessibilityRole="button"
        accessibilityLabel="Back"
        hitSlop={8}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 })}
      >
        <Icon name="chevron-left" size={18} color={INK.ink3} />
        <Eyebrow>Back</Eyebrow>
      </Pressable>
    </View>
  )

  return (
    <InkScreen top={back}>
      <View style={{ gap: space.s1 }}>
        <Eyebrow tone="daybreak">Day 90 · re-measure</Eyebrow>
        <Title size={34} accessibilityRole="header">
          The number went <Serif>down</Serif>. Here is why.
        </Title>
      </View>

      {/* The two numbers */}
      <View style={{ gap: space.s2 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s2, flexWrap: 'wrap' }}
          accessible
          accessibilityLabel={`Joyspan Index moved from ${DAY90_SPECIMEN.from} to ${DAY90_SPECIMEN.to}, down ${fell}.`}
        >
          <View style={{ gap: 2 }}>
            <Numeral size={56} tone="ink3">
              {DAY90_SPECIMEN.from}
            </Numeral>
            <Eyebrow>Day 0</Eyebrow>
          </View>
          <View style={{ paddingBottom: 36 }}>
            <Icon name="arrow-right" size={22} color={INK.ink3} />
          </View>
          <View style={{ gap: 2 }}>
            <Numeral size={96}>{DAY90_SPECIMEN.to}</Numeral>
            <Eyebrow>Day 90</Eyebrow>
          </View>
        </View>
        <Body size={19} style={{ lineHeight: 28 }}>
          {DAY90_SPECIMEN.sentence}
        </Body>
        <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: INK.lineStrong, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' }}>
          <Eyebrow size={11}>Specimen · not a real member</Eyebrow>
        </View>
      </View>

      {/* The person */}
      <View style={{ backgroundColor: INK.paperRaised, borderRadius: radius.card, padding: 20, gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar person={meera} size={48} />
          <View style={{ flex: 1, gap: 2 }}>
            <Body weight="semibold">{meera.name}</Body>
            <Meta>Your physician · signed this measure</Meta>
          </View>
        </View>
        <Body>{DAY90_SPECIMEN.person}</Body>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="phone" size={15} color={INK.ink2} />
          <Mono tone="ink2" size={15}>
            {when.long}
          </Mono>
        </View>
        {confirmed ? (
          <View accessibilityLiveRegion="polite" style={{ gap: 4 }}>
            <Body weight="medium">{`Confirmed for ${when.long}. She will call you then; a reminder comes an hour before.`}</Body>
            <Button
              variant="link"
              onPress={() => {
                setPick(slot)
                setSlotOpen(true)
              }}
            >
              Change the time
            </Button>
          </View>
        ) : (
          <View style={{ gap: space.s1 }}>
            <DaybreakButton onPress={() => setConfirmed(true)} accessibilityHint="Confirms the call with Dr Meera">
              {slot === 'thu' ? 'Confirm Thursday’s call' : `Confirm ${when.label}`}
            </DaybreakButton>
            <Button
              variant="ghost"
              onPress={() => {
                setPick(slot)
                setSlotOpen(true)
              }}
              style={{ alignSelf: 'center' }}
            >
              Another time suits me better
            </Button>
          </View>
        )}
      </View>

      {/* What moved */}
      <View style={{ gap: space.s1 }}>
        <Eyebrow {...H2}>What moved · all six</Eyebrow>
        <Meta>Day 0 to Day 90, like for like. Tap a row for the reason.</Meta>
        <View style={{ borderTopWidth: 1, borderTopColor: INK.line }}>
          {ORDER.map((k) => {
            const t = termByKey(k)
            const now = DAY90_TERMS.find((x) => x.key === k)!
            const then = before.terms.find((x) => x.key === k)!
            const d = now.delta ?? 0
            const isOpen = open === k
            const sign = k === 'B' ? '−' : ''
            const word = k === 'B' ? (d > 0 ? 'heavier' : d < 0 ? 'eased' : 'held') : d > 0 ? 'up' : d < 0 ? 'down' : 'held'
            return (
              <Pressable
                key={k}
                onPress={() => setOpen(isOpen ? null : k)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={`${t.space}, ${t.name}: ${k === 'B' ? 'minus ' : ''}${then.value} to ${k === 'B' ? 'minus ' : ''}${now.value}, ${word}${d ? ` ${Math.abs(d)}` : ''}.`}
                style={({ pressed }) => ({ borderBottomWidth: 1, borderBottomColor: INK.line, paddingVertical: 14, gap: 6, opacity: pressed ? 0.75 : 1 })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TermDot term={k} />
                  <Body style={{ flex: 1 }}>{t.space}</Body>
                  <Mono tone="ink3" size={15}>{`${sign}${then.value}`}</Mono>
                  <Icon name="arrow-right" size={13} color={INK.ink3} />
                  <Mono tone="ink" size={17} style={{ minWidth: 34, textAlign: 'right' }}>{`${sign}${now.value}`}</Mono>
                  <View style={{ minWidth: 56, alignItems: 'flex-end' }}>
                    <Meta size={14} tone={d === 0 ? 'ink3' : 'ink2'}>
                      {word}
                      {d ? ` ${Math.abs(d)}` : ''}
                    </Meta>
                  </View>
                </View>
                {isOpen ? (
                  <Meta tone="ink2" style={{ paddingLeft: 20 }}>
                    {DAY90_WHY[k]}
                  </Meta>
                ) : null}
              </Pressable>
            )
          })}
        </View>
        <MethodLine method="v1.0" grade="clinical" takenOn={DAY90_DATES.day90} signedBy={meera.name} />
      </View>

      {/* The next ninety days */}
      <View style={{ gap: space.s2 }}>
        <Eyebrow {...H2}>The next ninety days · a draft</Eyebrow>
        <Meta>Drafted for the call. You and Dr Meera decide; Priya keeps it going.</Meta>
        {NEXT_90.map((n) => (
          <View key={n.day + n.title} style={{ flexDirection: 'row', gap: 14 }}>
            <Mono size={13} tone="ink3" style={{ width: 56, paddingTop: 3 }}>
              {n.day}
            </Mono>
            <View style={{ flex: 1, gap: 2 }}>
              <Body weight="medium">{n.title}</Body>
              <Meta>{n.detail}</Meta>
              {n.day === 'Day 60' ? (
                <ArrowLink icon="compass" onPress={() => router.push('/cation/wealthcation')}>
                  See Wealthcation
                </ArrowLink>
              ) : null}
            </View>
          </View>
        ))}
        <View style={{ borderTopWidth: 1, borderTopColor: INK.line, paddingTop: space.s2, gap: space.s1 }} accessibilityLiveRegion="polite">
          {planState === 'open' ? (
            <>
              <Meta>{`Does this draft feel right? Your answer goes to Dr Meera and Priya before the call on ${when.long.split(' · ')[0]}.`}</Meta>
              <View style={{ flexDirection: 'row', gap: space.s1, flexWrap: 'wrap' }}>
                <Button variant="secondary" icon="check" onPress={() => setPlanState('agreed')}>
                  Looks right
                </Button>
                <Button variant="ghost" icon="edit-3" onPress={() => setPlanState('note')}>
                  I’d change something
                </Button>
              </View>
            </>
          ) : planState === 'note' ? (
            <>
              <TextField label="What would you change?" value={note} onChangeText={setNote} placeholder="Fewer calls in March, for a start" multiline />
              <View style={{ flexDirection: 'row', gap: space.s1, flexWrap: 'wrap' }}>
                <Button variant="secondary" icon="send" onPress={saveNote} disabled={!note.trim()}>
                  Add to the call
                </Button>
                <Button variant="ghost" onPress={() => setPlanState('open')}>
                  Cancel
                </Button>
              </View>
            </>
          ) : (
            <>
              <Body weight="medium">{planState === 'agreed' ? 'Noted. Dr Meera will start from this draft on the call.' : 'Noted for the call. Dr Meera and Priya will read it first.'}</Body>
              {planState === 'noted' ? <Meta>“{note.trim()}”</Meta> : null}
              <Button variant="link" onPress={() => setPlanState('open')}>
                Undo
              </Button>
            </>
          )}
        </View>
      </View>

      <View style={{ gap: space.s1, borderTopWidth: 1, borderTopColor: INK.line, paddingTop: space.s2 }}>
        <Meta>Nothing here counts against you. A lower number after a heavy quarter is the method working, not you failing.</Meta>
        <Button variant="ghost" icon="book-open" onPress={() => router.push('/index-result')} style={{ alignSelf: 'flex-start' }}>
          How the Index is made
        </Button>
      </View>

      <InkSurface.Provider value={false}>
        <Sheet
          open={slotOpen}
          onClose={() => setSlotOpen(false)}
          title="Choose a time for the call"
          footer={
            <Button
              variant="ink"
              block
              onPress={() => {
                setSlot(pick)
                setConfirmed(true)
                setSlotOpen(false)
              }}
            >
              {`Confirm ${SLOTS.find((x) => x.value === pick)!.label}`}
            </Button>
          }
        >
          <Meta>Thirty minutes with Dr Meera, by phone. These are the times she has kept for you this week.</Meta>
          <Segmented value={pick} onChange={setPick} items={SLOTS.map((x) => ({ value: x.value, label: x.label }))} />
          <Body>{SLOTS.find((x) => x.value === pick)!.long}</Body>
          <Meta tone="ink3">None of these work? Message her in Care and she will find another.</Meta>
        </Sheet>
      </InkSurface.Provider>
    </InkScreen>
  )
}
