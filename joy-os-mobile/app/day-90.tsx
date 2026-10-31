import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { ArrowLink, Avatar, Body, Button, DaybreakButton, Eyebrow, Icon, InkSurface, Meta, MethodLine, Mono, Numeral, Segmented, Serif, Sheet, TermDot, Title } from '@/components'
import { interceptsCrisis, useApp } from '@/lib/store'
import { H2, useLocal } from '@/screens/a/local'
import { DAY90_DATES, DAY90_TERMS, DAY90_WHY, NEXT_90 } from '@/screens/a/coreData'
import { INK, InkScreen, TextField } from '@/screens/a/parts'
import { DAY90_SPECIMEN, INDEX_HISTORY, TEAM } from '@/shared/member'
import { termByKey } from '@/shared/terms'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { memberOnly } from '@/screens/b/parts'
import { useDict, useLang, useTermText } from '@/lib/i18n'
import { DAY90, SLOT_TEXT } from '@/screens/b/i18n/day90'
import { useCommon, useTx } from '@/screens/b/i18n/common'
import { txFor } from '@/screens/a/i18n'

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
type PlanState = 'open' | 'agreed' | 'note' | 'noted'
// The booked call and the member's answer to the plan, kept on the phone so they hold when
// the member leaves Day 90 and comes back.
type Day90Saved = { confirmed: boolean; slot: Slot; planState: PlanState; note: string }
const DAY90_INITIAL: Day90Saved = { confirmed: false, slot: 'thu', planState: 'open', note: '' }

export default memberOnly(Day90)

function Day90() {
  const { space, radius } = useTheme()
  const meera = TEAM.find((p) => p.id === 'p_meera')!
  const { setCrisisOpen } = useApp()
  const [savedRaw, setSaved] = useLocal<Day90Saved>('day90', DAY90_INITIAL)
  const saved: Day90Saved = { ...DAY90_INITIAL, ...savedRaw }
  const { confirmed, planState, note } = saved
  const slot: Slot = SLOTS.some((x) => x.value === saved.slot) ? saved.slot : 'thu'
  const save = (patch: Partial<Day90Saved>) => setSaved((p) => ({ ...DAY90_INITIAL, ...p, ...patch }))
  const setConfirmed = (v: boolean) => save({ confirmed: v })
  const setSlot = (v: Slot) => save({ slot: v })
  const setPlanState = (v: PlanState) => save({ planState: v })
  const setNote = (v: string) => save({ note: v })
  const [pick, setPick] = useState<Slot>(slot)
  const [slotOpen, setSlotOpen] = useState(false)
  const when = SLOTS.find((x) => x.value === slot)!
  const t = useDict(DAY90)
  const tc = useCommon()
  const tx = useTx()
  const lang = useLang()
  const ax = (x: string) => txFor(lang, x)
  const tt = useTermText()
  const whenLong = tx(SLOT_TEXT[slot].long, when.long)
  const slotLabel = (v: Slot) => tx(SLOT_TEXT[v].label, SLOTS.find((x) => x.value === v)!.label)
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
        accessibilityLabel={tc('back')}
        hitSlop={8}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 })}
      >
        <Icon name="chevron-left" size={18} color={INK.ink3} />
        <Eyebrow>{tc('back')}</Eyebrow>
      </Pressable>
    </View>
  )

  return (
    <InkScreen top={back}>
      <View style={{ gap: space.s1 }}>
        <Eyebrow tone="daybreak">{t('eyebrow')}</Eyebrow>
        <Title size={34} accessibilityRole="header">
          {t('titleA')}<Serif>{t('titleSerif')}</Serif>{t('titleB')}
        </Title>
      </View>

      {/* The two numbers */}
      <View style={{ gap: space.s2 }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s2, flexWrap: 'wrap' }}
          accessible
          accessibilityLabel={t('movedA11y', { from: DAY90_SPECIMEN.from, to: DAY90_SPECIMEN.to, fell })}
        >
          <View style={{ gap: 2 }}>
            <Numeral size={56} tone="ink3">
              {DAY90_SPECIMEN.from}
            </Numeral>
            <Eyebrow>{t('day0')}</Eyebrow>
          </View>
          <View style={{ paddingBottom: 36 }}>
            <Icon name="arrow-right" size={22} color={INK.ink3} />
          </View>
          <View style={{ gap: 2 }}>
            <Numeral size={96}>{DAY90_SPECIMEN.to}</Numeral>
            <Eyebrow>{t('day90')}</Eyebrow>
          </View>
        </View>
        <Body size={19} style={{ lineHeight: 28 }}>
          {ax(DAY90_SPECIMEN.sentence)}
        </Body>
        <View style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: INK.lineStrong, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' }}>
          <Eyebrow size={11}>{t('specimen')}</Eyebrow>
        </View>
      </View>

      {/* The person */}
      <View style={{ backgroundColor: INK.paperRaised, borderRadius: radius.card, padding: 20, gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar person={meera} size={48} />
          <View style={{ flex: 1, gap: 2 }}>
            <Body weight="semibold">{meera.name}</Body>
            <Meta>{t('physician')}</Meta>
          </View>
        </View>
        <Body>{ax(DAY90_SPECIMEN.person)}</Body>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="phone" size={15} color={INK.ink2} />
          <Mono tone="ink2" size={15} style={{ flexShrink: 1 }}>
            {whenLong}
          </Mono>
        </View>
        {confirmed ? (
          <View accessibilityLiveRegion="polite" style={{ gap: 4 }}>
            <Body weight="medium">{t('confirmed', { when: whenLong })}</Body>
            <Button
              variant="link"
              onPress={() => {
                setPick(slot)
                setSlotOpen(true)
              }}
            >
              {t('changeTime')}
            </Button>
          </View>
        ) : (
          <View style={{ gap: space.s1 }}>
            <DaybreakButton onPress={() => setConfirmed(true)} accessibilityHint={t('confirmHint')}>
              {slot === 'thu' ? t('confirmThu') : t('confirmSlot', { slot: slotLabel(slot) })}
            </DaybreakButton>
            <Button
              variant="ghost"
              onPress={() => {
                setPick(slot)
                setSlotOpen(true)
              }}
              style={{ alignSelf: 'center' }}
            >
              {t('another')}
            </Button>
          </View>
        )}
      </View>

      {/* What moved */}
      <View style={{ gap: space.s1 }}>
        <Eyebrow {...H2}>{t('whatMoved')}</Eyebrow>
        <Meta>{t('likeForLike')}</Meta>
        <View style={{ borderTopWidth: 1, borderTopColor: INK.line }}>
          {ORDER.map((k) => {
            const now = DAY90_TERMS.find((x) => x.key === k)!
            const then = before.terms.find((x) => x.key === k)!
            const d = now.delta ?? 0
            const isOpen = open === k
            const sign = k === 'B' ? '−' : ''
            const word = t(k === 'B' ? (d > 0 ? 'heavier' : d < 0 ? 'eased' : 'held') : d > 0 ? 'up' : d < 0 ? 'down' : 'held')
            return (
              <Pressable
                key={k}
                onPress={() => setOpen(isOpen ? null : k)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                aria-expanded={isOpen}
                accessibilityLabel={t('rowA11y', { space: tt.space(k), name: tt.name(k), then: `${k === 'B' ? t('minus') : ''}${then.value}`, now: `${k === 'B' ? t('minus') : ''}${now.value}`, word: `${word}${d ? ` ${Math.abs(d)}` : ''}` })}
                style={({ pressed }) => ({ borderBottomWidth: 1, borderBottomColor: INK.line, paddingVertical: 14, gap: 6, opacity: pressed ? 0.75 : 1 })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TermDot term={k} />
                  <Body style={{ flex: 1 }}>{tt.space(k)}</Body>
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
                    {ax(DAY90_WHY[k])}
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
        <Eyebrow {...H2}>{t('next90')}</Eyebrow>
        <Meta>{t('draftedFor')}</Meta>
        {NEXT_90.map((n) => (
          <View key={n.day + n.title} style={{ flexDirection: 'row', gap: 14 }}>
            <Mono size={13} tone="ink3" style={lang === 'en' ? { width: 56, paddingTop: 3 } : { width: 84, paddingTop: 3 }}>
              {ax(n.day)}
            </Mono>
            <View style={{ flex: 1, gap: 2 }}>
              <Body weight="medium">{ax(n.title)}</Body>
              <Meta>{ax(n.detail)}</Meta>
              {n.day === 'Day 60' ? (
                <ArrowLink icon="compass" onPress={() => router.push('/cation/wealthcation')}>
                  {t('seeWealth')}
                </ArrowLink>
              ) : null}
            </View>
          </View>
        ))}
        <View style={{ borderTopWidth: 1, borderTopColor: INK.line, paddingTop: space.s2, gap: space.s1 }} accessibilityLiveRegion="polite">
          {planState === 'open' ? (
            <>
              <Meta>{t('feelRight', { day: tx(SLOT_TEXT[slot].day, when.long.split(' · ')[0]) })}</Meta>
              <View style={{ flexDirection: 'row', gap: space.s1, flexWrap: 'wrap' }}>
                <Button variant="secondary" icon="check" onPress={() => setPlanState('agreed')}>
                  {t('looksRight')}
                </Button>
                <Button variant="ghost" icon="edit-3" onPress={() => setPlanState('note')}>
                  {t('change')}
                </Button>
              </View>
            </>
          ) : planState === 'note' ? (
            <>
              <TextField label={t('whatChange')} value={note} onChangeText={setNote} placeholder={t('changePh')} multiline />
              <View style={{ flexDirection: 'row', gap: space.s1, flexWrap: 'wrap' }}>
                <Button variant="secondary" icon="send" onPress={saveNote} disabled={!note.trim()}>
                  {t('addToCall')}
                </Button>
                <Button variant="ghost" onPress={() => setPlanState('open')}>
                  {tc('cancel')}
                </Button>
              </View>
            </>
          ) : (
            <>
              <Body weight="medium">{planState === 'agreed' ? t('notedAgreed') : t('notedNote')}</Body>
              {planState === 'noted' ? <Meta>“{note.trim()}”</Meta> : null}
              <Button variant="link" onPress={() => setPlanState('open')}>
                {t('undo')}
              </Button>
            </>
          )}
        </View>
      </View>

      <View style={{ gap: space.s1, borderTopWidth: 1, borderTopColor: INK.line, paddingTop: space.s2 }}>
        <Meta>{t('nothingCounts')}</Meta>
        <Button variant="ghost" icon="book-open" onPress={() => router.push('/index-result')} style={{ alignSelf: 'flex-start' }}>
          {t('howMade')}
        </Button>
      </View>

      <InkSurface.Provider value={false}>
        <Sheet
          open={slotOpen}
          onClose={() => setSlotOpen(false)}
          title={t('chooseTime')}
          footer={
            <Button
              variant="ink"
              block
              onPress={() => {
                save({ slot: pick, confirmed: true })
                setSlotOpen(false)
              }}
            >
              {t('confirmSlot', { slot: slotLabel(pick) })}
            </Button>
          }
        >
          <Meta>{t('thirty')}</Meta>
          <Segmented value={pick} onChange={setPick} items={SLOTS.map((x) => ({ value: x.value, label: slotLabel(x.value) }))} style={{ flexWrap: 'wrap' }} />
          <Body>{tx(SLOT_TEXT[pick].long, SLOTS.find((x) => x.value === pick)!.long)}</Body>
          <Meta tone="ink3">{t('noneWork')}</Meta>
        </Sheet>
      </InkSurface.Provider>
    </InkScreen>
  )
}
