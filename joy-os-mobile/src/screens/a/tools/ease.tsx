import { router } from 'expo-router'
import { useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { ArrowLink, Body, Button, Card, Divider, Eyebrow, Icon, Meta, Mono, Sheet, Toggle, fmtDate } from '@/components'
import { interceptsCrisis, useApp } from '@/lib/store'
import { shiftTime, useLocal } from '@/screens/a/local'
import { BarRow, HumanWritten, IconButton, OptionRow, TextField } from '@/screens/a/parts'
import { BURDEN_PARTS, JOURNAL_START, KEEP_MEANING_START, PHQ4_ITEMS, PHQ4_OPTIONS, SCREEN_HISTORY, SCREEN_META, SPACE_TODAY, WIND_DOWN, type EaseScreen } from '@/screens/a/spacesData'
import { useTheme } from '@/theme/ThemeProvider'
import { INSTRUMENT_NOTE } from '@/lib/i18n'
import { useA } from '../i18n'
import { ToolCard, ToolsHeading, shortDate } from './common'

// EASE (Burden — inverse, shown with a minus): the Second Arrow journal (crisis intercept
// before anything else), the keep-meaning-to list, what Burden is made of, the sleep plan,
// the screens with pre-approved, human-written copy only (never AI text) and clinician
// routing over a threshold, and Tele-MANAS.

export function EaseTools() {
  const { t } = useA()
  return (
    <>
      <ToolsHeading>{t('Ease tools')}</ToolsHeading>
      <SecondArrow />
      <KeepMeaning />
      <Parts />
      <SleepPlan />
      <Screens />
      <TeleManas />
    </>
  )
}

function SecondArrow() {
  const { c, space } = useTheme()
  const { t, lang } = useA()
  const { setCrisisOpen } = useApp()
  const [problem, setProblem] = useState('')
  const [arrow, setArrow] = useState('')
  const [entries, setEntries] = useLocal('journal', JOURNAL_START)
  const [held, setHeld] = useState(false)
  const [saved, setSaved] = useState(false)
  const save = () => {
    const p = problem.trim()
    const a = arrow.trim()
    if (!p && !a) return
    // Emergency intercept first — before the text is stored or read by anything (Memo p.24).
    if (interceptsCrisis(`${p} ${a}`)) {
      setHeld(true)
      setCrisisOpen(true)
      return
    }
    setHeld(false)
    setEntries((e) => [{ id: `j${Date.now()}`, date: '2027-01-28', problem: p, arrow: a }, ...e])
    setProblem('')
    setArrow('')
    setSaved(true)
  }
  return (
    <ToolCard title={t('Second Arrow journal')} lead={t('The first arrow is what happened. The second is what we add to it. Write both down; the second often loosens.')}>
      <TextField label={t('The first arrow · what happened')} value={problem} onChangeText={(v) => (setProblem(v), setSaved(false))} placeholder={t('The order slipped by two weeks.')} multiline />
      <TextField label={t('The second arrow · what I added')} value={arrow} onChangeText={(v) => (setArrow(v), setSaved(false))} placeholder={t('What I keep telling myself about it.')} multiline />
      {held ? (
        <View accessibilityLiveRegion="assertive" style={{ flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: c.ink, borderRadius: 12, padding: 14 }}>
          <Icon name="life-buoy" size={18} color={c.ink} />
          <Meta tone="ink" style={{ flex: 1 }}>
            {t('This was not saved. What you wrote sounds heavy, so we opened help first. Tele-MANAS is free on 14416, any time.')}
          </Meta>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2, flexWrap: 'wrap' }}>
        <Button onPress={save} disabled={!problem.trim() && !arrow.trim()} icon="lock">
          {t('Keep privately')}
        </Button>
        {saved ? <Meta accessibilityLiveRegion="polite">{t('Kept. Only you can read it.')}</Meta> : null}
      </View>
      <View style={{ gap: space.s2 }}>
        {entries.map((e) => (
          <View key={e.id} style={{ gap: 4, borderLeftWidth: 2, borderLeftColor: c.line, paddingLeft: 12 }}>
            <Mono size={12} tone="ink3">
              {shortDate(e.date, lang)}
            </Mono>
            {e.problem ? <Body>{e.problem}</Body> : null}
            {e.arrow ? (
              <Meta>
                <Meta tone="ink3">{t('Second arrow · ')}</Meta>
                {e.arrow}
              </Meta>
            ) : null}
          </View>
        ))}
      </View>
      <Meta size={14} tone="ink3">
        {t('Private journal. VIVA may reflect on journal text if you ask; it never reads a screen result.')}
      </Meta>
    </ToolCard>
  )
}

function Parts() {
  const { term } = useTheme()
  const { t, tx, name, space } = useA()
  const col = term('B')
  const heaviest = [...BURDEN_PARTS].sort((a, b) => b.value * b.weight - a.value * a.weight)[0]
  return (
    <ToolCard title={t('What Burden is made of')} lead={t('Five parts, weighted. Lower is better. {k} is the heaviest part of what is left.', { k: tx(heaviest.key) })}>
      <View style={{ gap: 12 }}>
        {BURDEN_PARTS.map((p) => (
          <BarRow key={p.key} label={t('{k} · weight {w}', { k: tx(p.key), w: p.weight.toFixed(2) })} value={p.value} max={100} color={col.main} hatched note={undefined} />
        ))}
      </View>
      <Meta size={14} tone="ink3">
        {`${space('B')} · ${name('B')} · B = 0.30·Mood + 0.25·Sleep + 0.20·Stress + 0.15·Pain + 0.10·Avoidance`}
      </Meta>
    </ToolCard>
  )
}

function SleepPlan() {
  const { c, space } = useTheme()
  const { t, tx } = useA()
  const [plan, setPlan] = useLocal('sleepPlan', { start: '22:00', remind: true })
  const at = (off: number) => shiftTime(plan.start, off)
  const move = (m: number) => setPlan((p) => ({ ...p, start: shiftTime(p.start, m) }))
  return (
    <ToolCard title={t('Sleep plan · wind-down')} aside={<Mono tone="ink" size={13}>{t('from {t}', { t: plan.start })}</Mono>} lead={t('CBT-I informed. The same start every night matters more than the hour you choose.')}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1 }}>
        <IconButton icon="minus" label={t('Start fifteen minutes earlier')} onPress={() => move(-15)} disabled={plan.start <= '20:30'} />
        <View style={{ flex: 1, alignItems: 'center' }} accessible accessibilityLabel={t('Wind-down starts at {t}', { t: plan.start })} accessibilityLiveRegion="polite">
          <Mono tone="ink" size={28} weight="light">
            {plan.start}
          </Mono>
          <Eyebrow size={11} align="center">{t('Wind-down starts')}</Eyebrow>
        </View>
        <IconButton icon="plus" label={t('Start fifteen minutes later')} onPress={() => move(15)} disabled={plan.start >= '23:30'} />
      </View>
      <View>
        {WIND_DOWN.map((s, i) => (
          <View key={s.title} style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ alignItems: 'center', width: 48 }}>
              <Mono tone="ink" size={14}>
                {at(s.offset)}
              </Mono>
              {i < WIND_DOWN.length - 1 ? <View style={{ flex: 1, width: 1, backgroundColor: c.line, marginVertical: 4 }} /> : null}
            </View>
            <View style={{ flex: 1, gap: 2, paddingBottom: space.s2 }}>
              <Body weight="medium">{tx(s.title)}</Body>
              <Meta size={14}>{tx(s.detail)}</Meta>
            </View>
          </View>
        ))}
      </View>
      <Toggle
        checked={plan.remind}
        onChange={(v) => setPlan((p) => ({ ...p, remind: v }))}
        label={t('Remind me at the start')}
        description={plan.remind ? t('A quiet nudge at {t}, every night. It respects your quiet hours.', { t: plan.start }) : t('No reminder. The plan is still here when you want it.')}
      />
    </ToolCard>
  )
}

function Screens() {
  const { c, space } = useTheme()
  const { t, tx, lang } = useA()
  const names = Object.keys(SCREEN_META) as EaseScreen[]
  const [retakes, setRetakes] = useLocal<{ date: string; score: number }[]>('phq4Retakes', [])
  const [open, setOpen] = useState(false)
  return (
    <ToolCard title={t('Your screens')} lead={t('Short, validated questionnaires. Results are explained in pre-approved words only; a clinician reads anything over a threshold.')}>
      {lang !== 'en' ? <Meta size={14} tone="ink2">{INSTRUMENT_NOTE[lang]}</Meta> : null}
      <View>
        {names.map((n, i) => {
          const meta = SCREEN_META[n]
          const hist = n === 'PHQ-4' ? [...SCREEN_HISTORY[n], ...retakes] : SCREEN_HISTORY[n]
          const last = hist[hist.length - 1]
          const band = meta.bands.find((b) => last.score <= b.upTo) ?? meta.bands[meta.bands.length - 1]
          return (
            <View key={n} style={{ gap: 6, paddingVertical: space.s2, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: c.line }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Body weight="semibold">{tx(n)}</Body>
                  <Meta size={14} tone="ink3">
                    {tx(meta.what)}
                  </Meta>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }} accessible accessibilityLabel={t('{n} {score} of {max}', { n: tx(n), score: last.score, max: meta.max })}>
                  <Mono tone="ink" size={22} weight="light">
                    {String(last.score)}
                  </Mono>
                  <Mono tone="ink3" size={12}>{`/${meta.max}`}</Mono>
                </View>
              </View>
              <Eyebrow tone="ink2">{tx(band.label)}</Eyebrow>
              <Body tone="ink2">{tx(band.copy)}</Body>
              <Meta size={13} tone="ink3">
                {t('{date} · {cadence} · earlier {list}', { date: fmtDate(last.date, lang), cadence: tx(meta.cadence), list: hist.slice(0, -1).map((h) => h.score).join(', ') })}
              </Meta>
              {band.route ? <CareRouted today={band.copy.includes('today')} /> : null}
              {n === 'PHQ-4' ? (
                <Button size="sm" variant="secondary" icon="edit-3" onPress={() => setOpen(true)} accessibilityHint={t('Four questions about the last two weeks')}>
                  {t('Retake PHQ-4')}
                </Button>
              ) : null}
            </View>
          )
        })}
      </View>
      <HumanWritten by="Dr Sanjay Menon" />
      <Phq4Sheet open={open} onClose={() => setOpen(false)} onScored={(score) => setRetakes((r) => [...r, { date: SPACE_TODAY, score }])} />
    </ToolCard>
  )
}

/** Pre-approved routing note when a screen crosses a threshold (Memo p.24). */
function CareRouted({ today = false }: { today?: boolean }) {
  const { c, space } = useTheme()
  const { t } = useA()
  return (
    <Card tone="sunk" padding={14} style={{ gap: space.s1 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Icon name="user-check" size={16} color={c.ink} />
        <Body style={{ flex: 1 }}>{today ? t('Dr Sanjay Menon will call you today. You do not need to do anything.') : t('Dr Sanjay Menon will read this within 48 hours. You do not need to do anything.')}</Body>
      </View>
      <ArrowLink icon="message-square" onPress={() => router.push('/messages?compose=1&to=p_sanjay')}>
        {t('Message him in Care')}
      </ArrowLink>
    </Card>
  )
}

/** PHQ-4 retake: four items, scored on the phone; only pre-approved band copy is shown. */
function Phq4Sheet({ open, onClose, onScored }: { open: boolean; onClose: () => void; onScored: (score: number) => void }) {
  const { space } = useTheme()
  const { t, tx, lang } = useA()
  const { setCrisisOpen } = useApp()
  const [answers, setAnswers] = useState<(number | undefined)[]>([undefined, undefined, undefined, undefined])
  const [score, setScore] = useState<number | null>(null)
  const done = answers.every((a) => a !== undefined)
  const meta = SCREEN_META['PHQ-4']
  const band = score === null ? null : meta.bands.find((b) => score <= b.upTo) ?? meta.bands[meta.bands.length - 1]
  const close = () => {
    onClose()
    setAnswers([undefined, undefined, undefined, undefined])
    setScore(null)
  }
  const submit = () => {
    const s = answers.reduce<number>((a, b) => a + (b ?? 0), 0)
    setScore(s)
    onScored(s)
  }
  return (
    <Sheet
      open={open}
      onClose={close}
      title={score === null ? t('PHQ-4 · last two weeks') : t('PHQ-4 · your result')}
      footer={
        score === null ? (
          <Button variant="ink" block onPress={submit} disabled={!done} accessibilityHint={t('Scores your answers on this phone')}>
            {t('See my result')}
          </Button>
        ) : (
          <Button variant="ink" block onPress={close}>
            {t('Done')}
          </Button>
        )
      }
    >
      {score === null ? (
        <>
          {lang === 'en' ? (
            <Meta>Over the last two weeks, how often have you been bothered by the following? Scored on this phone; no AI reads your answers.</Meta>
          ) : (
            <>
              <Meta tone="ink2">{INSTRUMENT_NOTE[lang]}</Meta>
              <Meta>{t('Scored on this phone; no AI reads your answers.')}</Meta>
              <Meta>Over the last two weeks, how often have you been bothered by the following?</Meta>
            </>
          )}
          {PHQ4_ITEMS.map((item, i) => (
            <View key={item} style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={item}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'baseline' }}>
                <Mono size={13} tone="ink3">{`${i + 1}/4`}</Mono>
                <Body weight="medium" style={{ flex: 1 }}>
                  {item}
                </Body>
              </View>
              {PHQ4_OPTIONS.map((o, v) => (
                <OptionRow key={o} label={o} index={v} selected={answers[i] === v} onPress={() => setAnswers((a) => a.map((x, j) => (j === i ? v : x)))} />
              ))}
              {i < PHQ4_ITEMS.length - 1 ? <Divider /> : null}
            </View>
          ))}
        </>
      ) : band ? (
        <View style={{ gap: space.s2 }} accessibilityLiveRegion="polite">
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }} accessible accessibilityLabel={t('PHQ-4 {s} of {max}, {label}', { s: score, max: meta.max, label: tx(band.label) })}>
            <Mono tone="ink" size={48} weight="light">
              {String(score)}
            </Mono>
            <Mono tone="ink3" size={15}>{`/${meta.max}`}</Mono>
          </View>
          <Eyebrow tone="ink2">{tx(band.label)}</Eyebrow>
          <Body>{tx(band.copy)}</Body>
          {band.route ? <CareRouted today={band.copy.includes('today')} /> : <Meta>{t('Kept with your screens. Next due in two weeks.')}</Meta>}
          <HumanWritten by="Dr Sanjay Menon" />
          <Button variant="link" icon="life-buoy" onPress={() => setCrisisOpen(true)}>
            {t('If it feels heavier than this, talk to someone now')}
          </Button>
        </View>
      ) : null}
    </Sheet>
  )
}

function KeepMeaning() {
  const { c, space } = useTheme()
  const { t } = useA()
  const { setCrisisOpen } = useApp()
  const [items, setItems] = useLocal('keepMeaning', KEEP_MEANING_START)
  const [draft, setDraft] = useState('')
  const open = items.filter((x) => !x.done).length
  const add = () => {
    const v = draft.trim()
    if (!v) return
    if (interceptsCrisis(v)) {
      setCrisisOpen(true)
      return
    }
    setItems((x) => [{ id: `k${Date.now()}`, text: v, done: false }, ...x])
    setDraft('')
  }
  return (
    <ToolCard title={t('Keep meaning to')} aside={<Mono tone="ink3" size={13}>{t('{n} open', { n: open })}</Mono>} lead={t('The small things that sit on you. Move the smallest one to done; the rest can wait.')}>
      <View>
        {items.map((x, i) => (
          <View key={x.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
            <Pressable
              onPress={() => setItems((all) => all.map((y) => (y.id === x.id ? { ...y, done: !y.done } : y)))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: x.done }}
              aria-checked={x.done}
              accessibilityLabel={x.text}
              style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: x.done ? c.ink : c.lineStrong, backgroundColor: x.done ? c.ink : undefined, alignItems: 'center', justifyContent: 'center' }}>
                {x.done ? <Icon name="check" size={14} color={c.paper} /> : null}
              </View>
              <Body tone={x.done ? 'ink3' : 'ink'} style={{ flex: 1, textDecorationLine: x.done ? 'line-through' : 'none' }}>
                {x.text}
              </Body>
            </Pressable>
            <IconButton icon="x" label={t('Remove {n}', { n: x.text })} onPress={() => setItems((all) => all.filter((y) => y.id !== x.id))} />
          </View>
        ))}
      </View>
      {open === 0 ? <Meta accessibilityLiveRegion="polite">{t('All clear. Nothing is waiting on you here.')}</Meta> : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s1 }}>
        <TextField label={t('Add one')} value={draft} onChangeText={setDraft} placeholder={t('Something you keep meaning to do')} onSubmitEditing={add} returnKeyType="done" style={{ flex: 1 }} />
        <IconButton icon="plus" label={t('Add to the keep-meaning-to list')} onPress={add} tone="ink" disabled={!draft.trim()} />
      </View>
    </ToolCard>
  )
}

function TeleManas() {
  const { space } = useTheme()
  const { t } = useA()
  const { setCrisisOpen } = useApp()
  return (
    <ToolCard tone="sunk" title={t('If it is heavier than this')}>
      <Body>{t('Tele-MANAS is India’s free, confidential mental-health line. A trained counsellor answers, any time, in your language.')}</Body>
      <View style={{ gap: space.s1 }}>
        <Button variant="ink" icon="phone" block onPress={() => Linking.openURL('tel:14416').catch(() => {})} accessibilityLabel={t('Call Tele-MANAS, 1 4 4 1 6')} accessibilityHint={t('Opens the phone app')}>
          {t('Call Tele-MANAS · 14416')}
        </Button>
        <Button variant="secondary" icon="life-buoy" block onPress={() => setCrisisOpen(true)}>
          {t('Talk to someone now')}
        </Button>
      </View>
      <Meta size={14} tone="ink3">
        {t('In an emergency, call 112. Dr Sanjay Menon, your psychologist, is one message away in Care.')}
      </Meta>
      <ArrowLink icon="message-square" onPress={() => router.push('/messages?compose=1&to=p_sanjay')}>
        {t('Message Dr Sanjay in Care')}
      </ArrowLink>
    </ToolCard>
  )
}
