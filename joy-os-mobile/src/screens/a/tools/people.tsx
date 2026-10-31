import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg'
import { ArrowLink, Body, Button, Divider, Eyebrow, Icon, Meta, Mono, Pill, Progress, Sheet } from '@/components'
import { interceptsCrisis, useApp } from '@/lib/store'
import { useLocal } from '@/screens/a/local'
import { IconButton, TextField } from '@/screens/a/parts'
import { CIRCLE_START, CONNECTIONS, COUPLES_CHECK, STATE_OF_US, TWO_AM_START } from '@/screens/a/spacesData'
import { CIRCLE } from '@/shared/platform'
import { useTheme } from '@/theme/ThemeProvider'
import { ToolCard, ToolsHeading } from './common'

// PEOPLE: the 5 & 15 orbit (Dunbar), the circle of eight, the 2 a.m. list, State of Us
// (Gottman) with the Couples Check shown as agreement only — never who said what — and
// connections near you.

export function PeopleTools() {
  return (
    <>
      <ToolsHeading>People tools</ToolsHeading>
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
  const col = term('R')
  const size = 260
  const h = size / 2
  const five = CIRCLE_START.filter((p) => p.ring === 5)
  const fifteen = CIRCLE_START.filter((p) => p.ring === 15)
  const unseen = CIRCLE_START.filter((p) => !p.seen)
  const [planned, setPlanned] = useLocal<string[]>('orbitCalls', [])
  const place = (i: number, n: number, r: number, offset = 0) => {
    const a = -Math.PI / 2 + offset + (i / n) * Math.PI * 2
    return { x: h + r * Math.cos(a), y: h + r * Math.sin(a) }
  }
  return (
    <ToolCard
      title="Your 5 and your 15"
      lead={`The five you would call first, and the fifteen around them. Filled dots were seen this month; ${unseen.length} were not.`}
    >
      <View style={{ alignItems: 'center' }} accessible accessibilityRole="image" accessibilityLabel={`Orbit. Inner five: ${five.map((p) => p.name).join(', ')}. Outer fifteen: ${fifteen.map((p) => `${p.name}${p.seen ? '' : ' (not seen this month)'}`).join(', ')}.`}>
        <Svg width={size} height={size}>
          <Circle cx={h} cy={h} r={52} fill="none" stroke={c.line} strokeWidth={1} />
          <Circle cx={h} cy={h} r={112} fill="none" stroke={c.line} strokeWidth={1} strokeDasharray="3 4" />
          <Circle cx={h} cy={h} r={18} fill={c.ink} />
          <SvgText x={h} y={h + 4} fontSize={11} fontFamily={fonts.monoMedium} fill={c.paper} textAnchor="middle">
            You
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
          <Meta size={14}>People · seen this month</Meta>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: col.main }} />
          <Meta size={14}>not yet</Meta>
        </View>
      </View>
      <View style={{ gap: 6 }}>
        <Meta>
          <Meta tone="ink" weight="semibold">
            Your five.
          </Meta>{' '}
          {five.map((p) => `${p.name}${p.note ? ` (${p.note.split(' · ')[0].toLowerCase()})` : ''}`).join(', ')}.
        </Meta>
        <Meta>
          <Meta tone="ink" weight="semibold">
            Your fifteen.
          </Meta>{' '}
          {fifteen.map((p) => p.name).join(', ')}.
        </Meta>
      </View>
      <Divider />
      <View style={{ gap: 6 }}>
        <Eyebrow>Not seen this month</Eyebrow>
        {unseen.map((p) => (
          <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, gap: 12 }}>
            <Body>{p.name}</Body>
            {planned.includes(p.id) ? (
              <Button size="sm" variant="ghost" icon="check" onPress={() => setPlanned((x) => x.filter((y) => y !== p.id))} accessibilityLabel={`Call with ${p.name} planned for Saturday. Tap to undo.`}>
                Saturday
              </Button>
            ) : (
              <Button size="sm" variant="secondary" icon="phone" onPress={() => setPlanned((x) => [...x, p.id])} accessibilityLabel={`Plan a call with ${p.name}`}>
                Plan a call
              </Button>
            )}
          </View>
        ))}
      </View>
    </ToolCard>
  )
}

function TwoAm() {
  const { space } = useTheme()
  const { setCrisisOpen } = useApp()
  const [names, setNames] = useLocal('twoAm', TWO_AM_START)
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim()
    if (!t) return
    if (interceptsCrisis(t)) {
      setCrisisOpen(true)
      return
    }
    setNames((n) => [...n, t])
    setDraft('')
  }
  return (
    <ToolCard title="The 2 a.m. list" lead="Who would you call at two in the morning? Private to you; it is not shared with anyone on it.">
      <View>
        {names.length === 0 ? <Meta tone="ink3">No one on it yet. One name is enough to start.</Meta> : null}
        {names.map((n, i) => (
          <View key={`${n}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
            <Mono size={13} tone="ink3" style={{ width: 20 }}>
              {String(i + 1)}
            </Mono>
            <Body style={{ flex: 1 }}>{n}</Body>
            <IconButton icon="x" label={`Remove ${n} from the 2 a.m. list`} onPress={() => setNames((all) => all.filter((_, j) => j !== i))} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s1 }}>
        <TextField label="Add a name" value={draft} onChangeText={setDraft} placeholder="A name" onSubmitEditing={add} returnKeyType="done" style={{ flex: 1 }} />
        <IconButton icon="plus" label="Add to the 2 a.m. list" onPress={add} tone="ink" disabled={!draft.trim()} />
      </View>
    </ToolCard>
  )
}

function StateOfUs() {
  const { c, space } = useTheme()
  const [step, setStep] = useState(-1)
  const [done, setDone] = useState(false)
  const [checkOpen, setCheckOpen] = useState(false)
  // Arjun's own answers (private to him). Kavya's are held separately and never shown.
  const [mine, setMine, , ] = useLocal<boolean[] | null>('couplesCheck', null)
  const [draft, setDraft] = useState<(boolean | undefined)[]>(COUPLES_CHECK.map(() => undefined))
  const [justSaved, setJustSaved] = useState(false)
  const rows = COUPLES_CHECK.map((x, i) => ({ area: x.area, agree: mine ? mine[i] === KAVYA_PRIVATE[i] : x.agree }))
  const agree = rows.filter((x) => x.agree).length
  const s = step >= 0 ? STATE_OF_US[step] : null
  return (
    <ToolCard title="State of Us" lead="Twenty minutes, once a week, phones away. Four parts, five minutes each.">
      {s ? (
        <View style={{ gap: space.s2 }} accessibilityLiveRegion="polite">
          <Progress value={step + 1} max={STATE_OF_US.length} label={`Part ${step + 1} of ${STATE_OF_US.length}`} color={c.ink} />
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Eyebrow>{`Part ${step + 1} of ${STATE_OF_US.length}`}</Eyebrow>
            <Mono tone="ink3" size={13}>{`${s.minutes} min`}</Mono>
          </View>
          <Body size={22} style={{ lineHeight: 30 }}>
            {s.title}
          </Body>
          <Body tone="ink2">{s.prompt}</Body>
          <View style={{ flexDirection: 'row', gap: space.s1, flexWrap: 'wrap' }}>
            {step < STATE_OF_US.length - 1 ? (
              <Button variant="ink" onPress={() => setStep(step + 1)} iconRight="arrow-right">
                Next part
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
                Finish together
              </Button>
            )}
            <Button variant="ghost" onPress={() => setStep(-1)}>
              Stop here
            </Button>
          </View>
        </View>
      ) : done ? (
        <View style={{ gap: space.s1 }} accessibilityLiveRegion="polite">
          <Body size={22} style={{ lineHeight: 30 }}>
            Done for this week. Thank you, both.
          </Body>
          <Meta>Twenty minutes, all four parts. The next State of Us is on Sunday; nothing is counted if a week slips.</Meta>
          <Button variant="link" onPress={() => setDone(false)}>
            Undo
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
                <Body style={{ flex: 1 }}>{p.title}</Body>
                <Mono size={13} tone="ink3">{`${p.minutes} min`}</Mono>
              </View>
            ))}
          </View>
          <Button variant="secondary" icon="play" onPress={() => setStep(0)}>
            Begin with Kavya
          </Button>
        </>
      )}
      <Divider />
      <View style={{ gap: space.s1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="lock" size={14} color={c.ink3} />
          <Eyebrow>Couples Check · agreement only</Eyebrow>
        </View>
        <Meta accessibilityLiveRegion="polite">
          You agree on <Mono size={15} tone="ink">{`${agree} of ${COUPLES_CHECK.length}`}</Mono> areas{mine ? ' this week' : ''}. Where you differ is shown, never who said what.
        </Meta>
        {rows.filter((x) => !x.agree).map((x) => (
          <View key={x.area} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="git-branch" size={14} color={c.ink2} />
            <Meta tone="ink">{x.area}</Meta>
          </View>
        ))}
        {justSaved ? <Meta tone="ink">Your answers are kept private to you. Kavya sees only the agreement, as you do.</Meta> : null}
        <Button
          variant="secondary"
          size="sm"
          icon="edit-3"
          onPress={() => {
            setDraft(mine ?? COUPLES_CHECK.map(() => undefined))
            setCheckOpen(true)
          }}
        >
          {mine ? 'Change my answers' : 'Take this week’s Couples Check'}
        </Button>
      </View>
      <Sheet
        open={checkOpen}
        onClose={() => setCheckOpen(false)}
        title="Couples Check · private to you"
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
            {draft.some((x) => x === undefined) ? `${draft.filter((x) => x !== undefined).length} of ${COUPLES_CHECK.length} answered` : 'Keep my answers'}
          </Button>
        }
      >
        <Meta>Eight areas. For each, is it going well for the two of you? Kavya answers on her own phone. Neither of you sees the other’s answers, only where you agree.</Meta>
        {COUPLES_CHECK.map((x, i) => (
          <View key={x.area} style={{ gap: 8, borderTopWidth: i ? 1 : 0, borderTopColor: c.line, paddingTop: i ? space.s2 : 0 }} accessibilityRole="radiogroup" accessibilityLabel={x.area}>
            <Body>{x.area}</Body>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { v: true, label: 'Going well' },
                { v: false, label: 'Needs a talk' },
              ].map((o) => {
                const on = draft[i] === o.v
                return (
                  <Pressable
                    key={o.label}
                    onPress={() => setDraft((d) => d.map((y, j) => (j === i ? o.v : y)))}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    aria-checked={on}
                    accessibilityLabel={`${x.area}: ${o.label}`}
                    style={({ pressed }) => ({ flex: 1, minHeight: 44, borderRadius: 999, borderWidth: on ? 2 : 1, borderColor: on ? c.ink : c.lineStrong, backgroundColor: on ? c.paperRaised : pressed ? c.paperSunk : undefined, alignItems: 'center', justifyContent: 'center' })}
                  >
                    <Meta tone="ink" weight={on ? 'semibold' : 'regular'}>
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
  const [inCal, setInCal] = useLocal('circleInCal', false)
  return (
    <ToolCard title="Your circle of eight" aside={<Mono tone="ink3" size={13}>{`Week ${CIRCLE.week} of 8`}</Mono>} lead={`${CIRCLE.name}. Eight members, one coach, the same people every week.`}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {CIRCLE.members.map((m, i) => (
          <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, borderColor: c.line, paddingLeft: 4, paddingRight: 10, paddingVertical: 4 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: i === 0 ? c.ink : c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
              <Mono size={11} color={i === 0 ? c.paper : c.ink}>
                {m[0]}
              </Mono>
            </View>
            <Meta size={14} tone="ink">
              {i === 0 ? `${m} (you)` : m}
            </Meta>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.s2, flexWrap: 'wrap' }}>
        <Icon name="video" size={16} color={c.ink2} />
        <Meta tone="ink" style={{ flex: 1 }}>
          Next call · {CIRCLE.when} · <Mono size={15} tone="ink">{`${CIRCLE.callMinutes} min`}</Mono> with Coach {CIRCLE.coach.split(' ')[0]}
        </Meta>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2, flexWrap: 'wrap' }}>
        <Button size="sm" variant={inCal ? 'ghost' : 'secondary'} icon={inCal ? 'check' : 'calendar'} onPress={() => setInCal(!inCal)} accessibilityLabel={inCal ? 'In your calendar. Tap to remove.' : 'Add the call to your calendar'}>
          {inCal ? 'In your calendar' : 'Add to calendar'}
        </Button>
        <ArrowLink icon="users" onPress={() => router.push('/circles')}>
          Open your circle
        </ArrowLink>
      </View>
    </ToolCard>
  )
}

function Connections() {
  const { c, space } = useTheme()
  const [saved, setSaved] = useLocal<string[]>('connections', [])
  return (
    <ToolCard title="Connections near you" lead="Small gatherings run by members and Joyspan Houses. Venues never receive health data.">
      <View>
        {CONNECTIONS.map((x, i) => {
          const on = saved.includes(x.id)
          return (
            <View key={x.id} style={{ gap: 6, paddingVertical: space.s2, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Pill>{x.kind}</Pill>
                <Mono size={13} tone="ink2">
                  {x.when}
                </Mono>
              </View>
              <Body weight="medium">{x.title}</Body>
              <Meta size={14}>
                {x.where} · {x.who}
              </Meta>
              {on ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1, flexWrap: 'wrap' }} accessibilityLiveRegion="polite">
                  <Icon name="check" size={15} color={c.ink} />
                  <Meta tone="ink">Place saved. The host will message you the details.</Meta>
                  <Button variant="link" size="sm" onPress={() => setSaved((s) => s.filter((y) => y !== x.id))} accessibilityLabel={`Undo: give up your place at ${x.title}`}>
                    Undo
                  </Button>
                </View>
              ) : (
                <Button size="sm" variant="secondary" icon="plus" onPress={() => setSaved((s) => [...s, x.id])} accessibilityLabel={`Save a place at ${x.title}`}>
                  Save a place
                </Button>
              )}
            </View>
          )
        })}
      </View>
      <ArrowLink icon="calendar" onPress={() => router.push('/events')}>
        All events
      </ArrowLink>
    </ToolCard>
  )
}
