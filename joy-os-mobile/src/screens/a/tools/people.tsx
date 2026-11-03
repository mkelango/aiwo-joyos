import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg'
import { ArrowLink, Body, Button, Divider, Eyebrow, Icon, Meta, Mono, Pill, Progress, Segmented, Sheet, SpecimenTag } from '@/components'
import { interceptsCrisis, useApp } from '@/lib/store'
import { useLocal } from '@/screens/a/local'
import { IconButton, TextField } from '@/screens/a/parts'
import { CIRCLE_START, CONNECTIONS, COUPLES_CHECK, STATE_OF_US, TWO_AM_START, type CirclePerson } from '@/screens/a/spacesData'
import { CIRCLE } from '@/shared/platform'
import { useTheme } from '@/theme/ThemeProvider'
import { localDate, Rich, useA } from '../i18n'
import { ToolCard, ToolsHeading } from './common'

// PEOPLE: the 5 & 15 orbit (Dunbar), drawn from names the member types or picks from the
// phone's contacts (simulated, on the device only: only the first name is kept, Memo p.19), the circle of eight, the 2 a.m. list, State of Us
// (Gottman) with the Couples Check shown as agreement only — never who said what — and
// connections near you.

export function PeopleTools() {
  const { t } = useA()
  return (
    <>
      <ToolsHeading>{t('People tools')}</ToolsHeading>
      <Orbit />
      <CircleOfEight />
      <TwoAm />
      <StateOfUs />
      <Connections />
    </>
  )
}

function Orbit() {
  const { c, fonts, term } = useTheme()
  const { t, tx, lang } = useA()
  const col = term('R')
  const size = 260
  const h = size / 2
  // The specimen circle, less anyone the member took out, plus anyone they added (by name only).
  const [orbit, setOrbit] = useLocal<OrbitEdits>('orbitPeople', { added: [], removed: [] })
  const people = [...CIRCLE_START.filter((p) => !orbit.removed.includes(p.id)), ...orbit.added]
  const five = people.filter((p) => p.ring === 5)
  const fifteen = people.filter((p) => p.ring === 15)
  const unseen = people.filter((p) => !p.seen)
  const [planned, setPlanned] = useLocal<string[]>('orbitCalls', [])
  const [pickerOpen, setPickerOpen] = useState(false)
  const place = (i: number, n: number, r: number, offset = 0) => {
    const a = -Math.PI / 2 + offset + (i / n) * Math.PI * 2
    return { x: h + r * Math.cos(a), y: h + r * Math.sin(a) }
  }
  return (
    <ToolCard
      title={t('Your 5 and your 15')}
      lead={t('The five you would call first, and the fifteen around them. Filled dots were seen this month; {n} were not.', { n: unseen.length })}
    >
      <View style={{ alignItems: 'center' }} accessible accessibilityRole="image" accessibilityLabel={t('Orbit. Inner five: {a}. Outer fifteen: {b}.', { a: five.map((p) => p.name).join(', '), b: fifteen.map((p) => `${p.name}${p.seen ? '' : t(' (not seen this month)')}`).join(', ') })}>
        <Svg width={size} height={size}>
          <Circle cx={h} cy={h} r={52} fill="none" stroke={c.line} strokeWidth={1} />
          <Circle cx={h} cy={h} r={112} fill="none" stroke={c.line} strokeWidth={1} strokeDasharray="3 4" />
          {/* The centre grows for Tamil and Hindi so “You” stays readable (never below 10pt); the inner five sit from r 43 out. */}
          <Circle cx={h} cy={h} r={lang === 'en' ? 18 : 26} fill={c.ink} />
          <SvgText x={h} y={h + 4} fontSize={lang === 'en' ? 11 : lang === 'hi' ? 12 : 10} fontFamily={lang === 'en' ? fonts.monoMedium : undefined} fill={c.paper} textAnchor="middle">
            {t('You')}
          </SvgText>
          {[...five.map((p, i) => ({ p, pt: place(i, five.length, 56), r: 13 })), ...fifteen.map((p, i) => ({ p, pt: place(i, fifteen.length, 112, 0.2), r: 11 }))].map(({ p, pt, r }) => (
            <G key={p.id}>
              <Circle cx={pt.x} cy={pt.y} r={r} fill={p.seen ? col.soft : c.paper} stroke={col.main} strokeWidth={p.seen ? 2 : 1.5} strokeDasharray={p.seen ? undefined : '3 2'} />
              <SvgText x={pt.x} y={pt.y + 4} fontSize={r > 12 ? 12 : 10} fontFamily={fonts.monoMedium} fill={p.seen ? col.ink : c.ink2} textAnchor="middle">
                {p.name.slice(0, 2)}
              </SvgText>
            </G>
          ))}
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: col.soft, borderWidth: 2, borderColor: col.main }} />
          <Meta size={14}>{t('People · seen this month')}</Meta>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: col.main }} />
          <Meta size={14}>{t('not yet')}</Meta>
        </View>
      </View>
      <View style={{ gap: 6 }}>
        <Meta>
          <Meta tone="ink" weight="semibold">
            {t('Your five.')}
          </Meta>{' '}
          {five.map((p) => `${p.name}${p.note ? ` (${lang === 'en' ? p.note.split(' · ')[0].toLowerCase() : tx(p.note.split(' · ')[0])})` : ''}`).join(', ')}{lang === 'hi' ? '।' : '.'}
        </Meta>
        <Meta>
          <Meta tone="ink" weight="semibold">
            {t('Your fifteen.')}
          </Meta>{' '}
          {fifteen.map((p) => p.name).join(', ')}{lang === 'hi' ? '।' : '.'}
        </Meta>
      </View>
      <Divider />
      <View style={{ gap: 6 }}>
        <Eyebrow>{t('Not seen this month')}</Eyebrow>
        {unseen.map((p) => (
          <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: 12 }}>
            <Body>{p.name}</Body>
            {planned.includes(p.id) ? (
              <Button size="sm" variant="ghost" icon="check" onPress={() => setPlanned((x) => x.filter((y) => y !== p.id))} accessibilityLabel={t('Call with {n} planned for Saturday. Tap to undo.', { n: p.name })}>
                {t('Saturday')}
              </Button>
            ) : (
              <Button size="sm" variant="secondary" icon="phone" onPress={() => setPlanned((x) => [...x, p.id])} accessibilityLabel={t('Plan a call with {n}', { n: p.name })}>
                {t('Plan a call')}
              </Button>
            )}
          </View>
        ))}
        {unseen.length === 0 ? <Meta tone="ink3">{t('Everyone in your circle was seen this month.')}</Meta> : null}
      </View>
      <Button variant="secondary" icon="user-plus" onPress={() => setPickerOpen(true)} style={{ alignSelf: 'flex-start' }}>
        {t('Change your 5 and 15')}
      </Button>
      <OrbitPicker open={pickerOpen} onClose={() => setPickerOpen(false)} people={people} orbit={orbit} setOrbit={setOrbit} />
    </ToolCard>
  )
}

type OrbitEdits = { added: CirclePerson[]; removed: string[] }

/** Contacts as they sit on the phone (specimen). They are read on the device only; Joy OS keeps the first name picked, never the number. */
const PHONE_CONTACTS = [
  'Anand Krishnan',
  'Amma',
  'Bhavna Shah',
  'Chitra Raman',
  'Dev Malhotra',
  'Kavya Rao',
  'Lakshmi Narayan',
  'Meenakshi Sundaram',
  'Mohan Das',
  'Rahul Verma',
  'Selvi Murugan',
  'Suresh Menon',
  'Tara Pillai',
  'Usha Iyer',
]
const RING_MAX = { 5: 5, 15: 10 } as const

function OrbitPicker({ open, onClose, people, orbit, setOrbit }: { open: boolean; onClose: () => void; people: CirclePerson[]; orbit: OrbitEdits; setOrbit: (fn: (o: OrbitEdits) => OrbitEdits) => void }) {
  const { c, space, radius } = useTheme()
  const { t } = useA()
  const { setCrisisOpen } = useApp()
  const [allowed, setAllowed] = useLocal('contactsAllowed', false)
  const [ring, setRing] = useState<5 | 15>(15)
  const [q, setQ] = useState('')
  const [typed, setTyped] = useState('')
  const [note, setNote] = useState('')
  const count = (r: 5 | 15) => people.filter((p) => p.ring === r).length
  const full = count(ring) >= RING_MAX[ring]
  const has = (name: string) => people.some((p) => p.name.toLowerCase() === name.toLowerCase())
  /** Returns true only when the name was added, so a refused add keeps what the member typed. */
  const add = (name: string): boolean => {
    const v = name.trim()
    if (!v) return false
    if (interceptsCrisis(v)) {
      setCrisisOpen(true)
      return false
    }
    if (has(v)) {
      setNote(t('{n} is already in your circle.', { n: v }))
      return false
    }
    if (full) {
      setNote(ring === 5 ? t('Your five is full. Take someone out first, or add to your fifteen.') : t('Your fifteen is full. Take someone out first.'))
      return false
    }
    setOrbit((o) => ({ ...o, added: [...o.added, { id: `o${Date.now()}`, name: v, ring, seen: false }] }))
    setNote(t('{n} added to your {ring}.', { n: v, ring: ring === 5 ? t('five') : t('fifteen') }))
    return true
  }
  const addTyped = () => {
    if (add(typed)) setTyped('')
  }
  const remove = (p: CirclePerson) => {
    setOrbit((o) => (o.added.some((x) => x.id === p.id) ? { ...o, added: o.added.filter((x) => x.id !== p.id) } : { ...o, removed: [...o.removed, p.id] }))
    setNote(t('{n} taken out of your circle.', { n: p.name }))
  }
  const shown = PHONE_CONTACTS.filter((n) => n.toLowerCase().includes(q.trim().toLowerCase()))
  return (
    <Sheet open={open} onClose={onClose} title={t('Your 5 and your 15')} footer={<Button variant="ink" block onPress={onClose}>{t('Done')}</Button>}>
      <View style={{ flexDirection: 'row', gap: 8, backgroundColor: c.paperSunk, borderRadius: radius.card, padding: space.s2 }}>
        <Icon name="lock" size={15} color={c.ink2} />
        <Meta style={{ flex: 1 }}>{t('Contacts never leave this phone. Joy OS keeps only the first name you pick, never the number.')}</Meta>
      </View>
      {note ? (
        <Meta tone="ink" accessibilityLiveRegion="polite">
          {note}
        </Meta>
      ) : null}
      {([5, 15] as const).map((r) => (
        <View key={r} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Eyebrow>{r === 5 ? t('Your five') : t('Your fifteen')}</Eyebrow>
            <Mono size={13} tone="ink3">{t('{a} of {b}', { a: count(r), b: RING_MAX[r] })}</Mono>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {people.filter((p) => p.ring === r).map((p) => (
              <Pressable
                key={p.id}
                onPress={() => remove(p)}
                accessibilityRole="button"
                accessibilityLabel={t('Take {n} out of your circle', { n: p.name })}
                style={({ pressed }) => ({ minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.paperSunk : c.paperRaised })}
              >
                <Meta tone="ink">{p.name}</Meta>
                <Icon name="x" size={13} color={c.ink3} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <Divider />
      <View style={{ gap: 8 }}>
        <Eyebrow>{t('Add to')}</Eyebrow>
        <Segmented value={String(ring) as '5' | '15'} onChange={(v) => (setRing(v === '5' ? 5 : 15), setNote(''))} items={[{ value: '5', label: t('Your five') }, { value: '15', label: t('Your fifteen') }]} />
      </View>
      {allowed ? (
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <Eyebrow>{t('From your contacts · on this phone')}</Eyebrow>
            <SpecimenTag />
          </View>
          <TextField label={t('Search contacts')} hideLabel placeholder={t('Search contacts')} value={q} onChangeText={setQ} returnKeyType="search" />
          {shown.length === 0 ? <Meta tone="ink3">{t('No contact matches “{q}”.', { q: q.trim() })}</Meta> : null}
          {shown.map((n) => {
            const first = n.split(' ')[0]
            const inCircle = has(first)
            return (
              <Pressable
                key={n}
                disabled={inCircle}
                onPress={() => add(first)}
                accessibilityRole="button"
                accessibilityState={{ disabled: inCircle }}
                accessibilityLabel={inCircle ? t('{n}, already in your circle', { n }) : t('Add {n} to your {ring}', { n: first, ring: ring === 5 ? t('five') : t('fifteen') })}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingVertical: 6, borderTopWidth: 1, borderTopColor: c.line, opacity: pressed ? 0.7 : 1 })}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
                  <Mono size={12} tone="ink2">
                    {n.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                  </Mono>
                </View>
                <Body tone={inCircle ? 'ink3' : 'ink'} style={{ flex: 1 }}>
                  {n}
                </Body>
                {inCircle ? <Meta size={14} tone="ink3">{t('In your circle')}</Meta> : <Icon name="plus" size={18} color={full ? c.ink3 : c.ink} />}
              </Pressable>
            )
          })}
          <Button variant="link" size="sm" onPress={() => setAllowed(false)}>
            {t('Stop reading contacts on this phone')}
          </Button>
        </View>
      ) : (
        <View style={{ gap: space.s1, borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: space.s2 }}>
          <Body weight="medium">{t('Pick from your contacts?')}</Body>
          <Meta>{t('Your phone shows its contact list here, inside Joy OS. Nothing is uploaded; only the first name you tap is kept in your circle.')}</Meta>
          <Button variant="secondary" icon="users" onPress={() => setAllowed(true)} style={{ alignSelf: 'flex-start' }}>
            {t('Allow on this phone')}
          </Button>
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s1 }}>
        <TextField label={t('Or type a name')} value={typed} onChangeText={(v) => (setTyped(v), setNote(''))} placeholder={t('A name')} onSubmitEditing={addTyped} returnKeyType="done" style={{ flex: 1 }} />
        <IconButton icon="plus" label={t('Add {n} to your {ring}', { n: typed.trim() || t('A name'), ring: ring === 5 ? t('five') : t('fifteen') })} onPress={addTyped} tone="ink" disabled={!typed.trim()} />
      </View>
    </Sheet>
  )
}

function TwoAm() {
  const { space } = useTheme()
  const { t } = useA()
  const { setCrisisOpen } = useApp()
  const [names, setNames] = useLocal('twoAm', TWO_AM_START)
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (!v) return
    if (interceptsCrisis(v)) {
      setCrisisOpen(true)
      return
    }
    setNames((n) => [...n, v])
    setDraft('')
  }
  return (
    <ToolCard title={t('The 2 a.m. list')} lead={t('Who would you call at two in the morning? Private to you; it is not shared with anyone on it.')}>
      <View>
        {names.length === 0 ? <Meta tone="ink3">{t('No one on it yet. One name is enough to start.')}</Meta> : null}
        {names.map((n, i) => (
          <View key={`${n}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
            <Mono size={13} tone="ink3" style={{ width: 20 }}>
              {String(i + 1)}
            </Mono>
            <Body style={{ flex: 1 }}>{n}</Body>
            <IconButton icon="x" label={t('Remove {n} from the 2 a.m. list', { n })} onPress={() => setNames((all) => all.filter((_, j) => j !== i))} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s1 }}>
        <TextField label={t('Add a name')} value={draft} onChangeText={setDraft} placeholder={t('A name')} onSubmitEditing={add} returnKeyType="done" style={{ flex: 1 }} />
        <IconButton icon="plus" label={t('Add to the 2 a.m. list')} onPress={add} tone="ink" disabled={!draft.trim()} />
      </View>
    </ToolCard>
  )
}

function StateOfUs() {
  const { c, space } = useTheme()
  const { t, tx } = useA()
  const [step, setStep] = useState(-1)
  // Kept on the phone for the week it was done in, so "Done for this week" survives leaving the space.
  const thisWeek = `practice-week-${CIRCLE.week}`
  const [doneWeek, setDoneWeek] = useLocal<string | null>('stateOfUsDone', null)
  const done = doneWeek === thisWeek
  const setDone = (v: boolean) => setDoneWeek(v ? thisWeek : null)
  const [checkOpen, setCheckOpen] = useState(false)
  // Arjun's own answers (private to him). Kavya's are held separately and never shown.
  const [mine, setMine, , ] = useLocal<boolean[] | null>('couplesCheck', null)
  const [draft, setDraft] = useState<(boolean | undefined)[]>(COUPLES_CHECK.map(() => undefined))
  const [justSaved, setJustSaved] = useState(false)
  const rows = COUPLES_CHECK.map((x, i) => ({ area: x.area, agree: mine ? mine[i] === KAVYA_PRIVATE[i] : x.agree }))
  const agree = rows.filter((x) => x.agree).length
  const s = step >= 0 ? STATE_OF_US[step] : null
  return (
    <ToolCard title="State of Us" lead={t('Twenty minutes, once a week, phones away. Four parts, five minutes each.')}>
      {s ? (
        <View style={{ gap: space.s2 }} accessibilityLiveRegion="polite">
          <Progress value={step + 1} max={STATE_OF_US.length} label={t('Part {a} of {b}', { a: step + 1, b: STATE_OF_US.length })} color={c.ink} />
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Eyebrow>{t('Part {a} of {b}', { a: step + 1, b: STATE_OF_US.length })}</Eyebrow>
            <Mono tone="ink3" size={13}>{t('{n} min', { n: s.minutes })}</Mono>
          </View>
          <Body size={22} style={{ lineHeight: 30 }}>
            {tx(s.title)}
          </Body>
          <Body tone="ink2">{tx(s.prompt)}</Body>
          <View style={{ flexDirection: 'row', gap: space.s1, flexWrap: 'wrap' }}>
            {step < STATE_OF_US.length - 1 ? (
              <Button variant="ink" onPress={() => setStep(step + 1)} iconRight="arrow-right">
                {t('Next part')}
              </Button>
            ) : (
              <Button
                variant="ink"
                onPress={() => {
                  setStep(-1)
                  setDone(true)
                }}
                icon="check"
              >
                {t('Finish together')}
              </Button>
            )}
            <Button variant="ghost" onPress={() => setStep(-1)}>
              {t('Stop here')}
            </Button>
          </View>
        </View>
      ) : done ? (
        <View style={{ gap: space.s1 }} accessibilityLiveRegion="polite">
          <Body size={22} style={{ lineHeight: 30 }}>
            {t('Done for this week. Thank you, both.')}
          </Body>
          <Meta>{t('Twenty minutes, all four parts. The next State of Us is on Sunday; nothing is counted if a week slips.')}</Meta>
          <Button variant="link" onPress={() => setDone(false)}>
            {t('Undo')}
          </Button>
        </View>
      ) : (
        <>
          <View style={{ gap: 6 }}>
            {STATE_OF_US.map((p, i) => (
              <View key={p.title} style={{ flexDirection: 'row', gap: 12, alignItems: 'baseline' }}>
                <Mono size={13} tone="ink3">
                  {String(i + 1)}
                </Mono>
                <Body style={{ flex: 1 }}>{tx(p.title)}</Body>
                <Mono size={13} tone="ink3">{t('{n} min', { n: p.minutes })}</Mono>
              </View>
            ))}
          </View>
          <Button variant="secondary" icon="play" onPress={() => setStep(0)}>
            {t('Begin with Kavya')}
          </Button>
        </>
      )}
      <Divider />
      <View style={{ gap: space.s1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="lock" size={14} color={c.ink3} />
          <Eyebrow style={{ flexShrink: 1 }}>{t('Couples Check · agreement only')}</Eyebrow>
        </View>
        <Meta accessibilityLiveRegion="polite">
          <Rich
            text={t('You agree on *{a} of {b}* areas{week}. Where you differ is shown, never who said what.', { a: agree, b: COUPLES_CHECK.length, week: mine ? t(' this week') : '' })}
            wrap={(w) => <Mono size={15} tone="ink">{w}</Mono>}
          />
        </Meta>
        {rows.filter((x) => !x.agree).map((x) => (
          <View key={x.area} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="git-branch" size={14} color={c.ink2} />
            <Meta tone="ink" style={{ flexShrink: 1 }}>{tx(x.area)}</Meta>
          </View>
        ))}
        {justSaved ? <Meta tone="ink">{t('Your answers are kept private to you. Kavya sees only the agreement, as you do.')}</Meta> : null}
        <Button
          variant="secondary"
          size="sm"
          icon="edit-3"
          onPress={() => {
            setDraft(mine ?? COUPLES_CHECK.map(() => undefined))
            setCheckOpen(true)
          }}
        >
          {mine ? t('Change my answers') : t('Take this week’s Couples Check')}
        </Button>
      </View>
      <Sheet
        open={checkOpen}
        onClose={() => setCheckOpen(false)}
        title={t('Couples Check · private to you')}
        footer={
          <Button
            variant="ink"
            block
            disabled={draft.some((x) => x === undefined)}
            onPress={() => {
              setMine(draft.map((x) => !!x))
              setJustSaved(true)
              setCheckOpen(false)
            }}
          >
            {draft.some((x) => x === undefined) ? t('{a} of {b} answered', { a: draft.filter((x) => x !== undefined).length, b: COUPLES_CHECK.length }) : t('Keep my answers')}
          </Button>
        }
      >
        <Meta>{t('Eight areas. For each, is it going well for the two of you? Kavya answers on her own phone. Neither of you sees the other’s answers, only where you agree.')}</Meta>
        {COUPLES_CHECK.map((x, i) => (
          <View key={x.area} style={{ gap: 8, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, paddingTop: i ? space.s2 : 0 }} accessibilityRole="radiogroup" accessibilityLabel={tx(x.area)}>
            <Body>{tx(x.area)}</Body>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { v: true, label: t('Going well') },
                { v: false, label: t('Needs a talk') },
              ].map((o) => {
                const on = draft[i] === o.v
                return (
                  <Pressable
                    key={o.label}
                    onPress={() => setDraft((d) => d.map((y, j) => (j === i ? o.v : y)))}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    aria-checked={on}
                    accessibilityLabel={t('{area}: {label}', { area: tx(x.area), label: o.label })}
                    style={({ pressed }) => ({ flex: 1, minHeight: 44, paddingHorizontal: 8, borderRadius: 999, borderWidth: on ? 2 : 1, borderColor: on ? c.ink : c.lineStrong, backgroundColor: on ? c.paperRaised : pressed ? c.paperSunk : undefined, alignItems: 'center', justifyContent: 'center' })}
                  >
                    <Meta tone="ink" weight={on ? 'semibold' : 'regular'} align="center">
                      {o.label}
                    </Meta>
                  </Pressable>
                )
              })}
            </View>
          </View>
        ))}
      </Sheet>
    </ToolCard>
  )
}

/** Kavya's specimen answers. Held apart; only agreement with Arjun's answers is ever computed. */
const KAVYA_PRIVATE = COUPLES_CHECK.map((x) => x.agree)

function CircleOfEight() {
  const { c, space } = useTheme()
  const { t, tx } = useA()
  const [inCal, setInCal] = useLocal('circleInCal', false)
  return (
    <ToolCard title={t('Your circle of eight')} aside={<Mono tone="ink3" size={13}>{t('Week {n} of 8', { n: CIRCLE.week })}</Mono>} lead={t('{name}. Eight members, one coach, the same people every week.', { name: tx(CIRCLE.name) })}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {CIRCLE.members.map((m, i) => (
          <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, borderColor: c.line, paddingLeft: 4, paddingRight: 10, paddingVertical: 4 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: i === 0 ? c.ink : c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
              <Mono size={11} color={i === 0 ? c.paper : c.ink}>
                {m[0]}
              </Mono>
            </View>
            <Meta size={14} tone="ink">
              {i === 0 ? t('{m} (you)', { m }) : m}
            </Meta>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.s2, flexWrap: 'wrap' }}>
        <Icon name="video" size={16} color={c.ink2} />
        <Meta tone="ink" style={{ flex: 1 }}>
          <Rich
            text={t('Next call · {when} · *{n} min* with Coach {coach}', { when: tx(CIRCLE.when), n: CIRCLE.callMinutes, coach: CIRCLE.coach.split(' ')[0] })}
            wrap={(w) => <Mono size={15} tone="ink">{w}</Mono>}
          />
        </Meta>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2, flexWrap: 'wrap' }}>
        <Button size="sm" variant={inCal ? 'ghost' : 'secondary'} icon={inCal ? 'check' : 'calendar'} onPress={() => setInCal(!inCal)} accessibilityLabel={inCal ? t('In your calendar. Tap to remove.') : t('Add the call to your calendar')}>
          {inCal ? t('In your calendar') : t('Add to calendar')}
        </Button>
        <ArrowLink icon="users" onPress={() => router.push('/circles')}>
          {t('Open your circle')}
        </ArrowLink>
      </View>
    </ToolCard>
  )
}

function Connections() {
  const { c, space } = useTheme()
  const { t, tx, lang } = useA()
  const [saved, setSaved] = useLocal<string[]>('connections', [])
  return (
    <ToolCard title={t('Connections near you')} lead={t('Small gatherings run by members and Joyspan Houses. Venues never receive health data.')}>
      <View>
        {CONNECTIONS.map((x, i) => {
          const on = saved.includes(x.id)
          return (
            <View key={x.id} style={{ gap: 6, paddingVertical: space.s2, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Pill>{tx(x.kind)}</Pill>
                <Mono size={13} tone="ink2">
                  {localDate(x.when, lang)}
                </Mono>
              </View>
              <Body weight="medium">{tx(x.title)}</Body>
              <Meta size={14}>
                {x.where} · {tx(x.who)}
              </Meta>
              {on ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, flexWrap: 'wrap' }} accessibilityLiveRegion="polite">
                  <Icon name="check" size={15} color={c.ink} />
                  <Meta tone="ink" style={{ flexShrink: 1 }}>{t('Place saved. The host will message you the details.')}</Meta>
                  <Button variant="link" size="sm" onPress={() => setSaved((s) => s.filter((y) => y !== x.id))} accessibilityLabel={t('Undo: give up your place at {t}', { t: tx(x.title) })}>
                    {t('Undo')}
                  </Button>
                </View>
              ) : (
                <Button size="sm" variant="secondary" icon="plus" onPress={() => setSaved((s) => [...s, x.id])} accessibilityLabel={t('Save a place at {t}', { t: tx(x.title) })}>
                  {t('Save a place')}
                </Button>
              )}
            </View>
          )
        })}
      </View>
      <ArrowLink icon="calendar" onPress={() => router.push('/events')}>
        {t('All events')}
      </ArrowLink>
    </ToolCard>
  )
}
