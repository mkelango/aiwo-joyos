import { router } from 'expo-router'
import { useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { ArrowLink, Body, Button, Card, Divider, Eyebrow, Icon, Meta, Mono, Sheet, Toggle, fmtDate } from '@/components'
import { interceptsCrisis, useApp } from '@/lib/store'
import { shiftTime, useLocal } from '@/screens/a/local'
import { BarRow, HumanWritten, IconButton, OptionRow, TextField, monoNums, useIsSpecimen } from '@/screens/a/parts'
import { BURDEN_PARTS, JOURNAL_START, KEEP_MEANING_START, SCREEN_FORMS, SCREEN_HISTORY, SCREEN_META, SCREEN_ROUTE, SPACE_TODAY, WIND_DOWN, type EaseScreen } from '@/screens/a/spacesData'
import { messagesStore, useAccountThreads, useStore } from '@/screens/b/bStore'
import type { Msg } from '@/screens/b/accountData'
import { termByKey } from '@/shared/terms'
import { useTheme } from '@/theme/ThemeProvider'
import { INSTRUMENT_NOTE } from '@/lib/i18n'
import { useIsMinor } from '@/lib/minor'
import { Rich, useA } from '../i18n'
import { formulaIn } from '../i18n/formula'
import { ToolCard, ToolsHeading, shortDate } from './common'

// EASE (Burden — inverse, shown with a minus): the Second Arrow journal (crisis intercept
// before anything else), the keep-meaning-to list, what Burden is made of, the sleep plan,
// the screens with pre-approved, human-written copy only (never AI text) and clinician
// routing over a threshold, and Tele-MANAS. All four screens (PHQ-4, ISI, PSS-4, Pain) can be taken
// on the phone, as on the web; a result that routes is written to that person's Care thread, so
// the note that says it was shared is true and links to it.

export function EaseTools() {
  const { t } = useA()
  // What Burden is made of is read from Arjun's Index. The journal, the list and the screens start
  // empty for anyone else, and Tele-MANAS is in this room for everyone.
  const specimen = useIsSpecimen()
  return (
    <>
      <ToolsHeading>{t('Ease tools')}</ToolsHeading>
      <SecondArrow />
      <KeepMeaning />
      {specimen ? <Parts /> : null}
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
  const [entries, setEntries] = useLocal('journal', useIsSpecimen() ? JOURNAL_START : [])
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
            {monoNums(t('This was not saved. What you wrote sounds heavy, so we opened help first. Tele-MANAS is free on 14416, any time.'))}
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
            {e.problem ? <Body>{monoNums(e.problem)}</Body> : null}
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
  const { t, tx, name, space, lang } = useA()
  const col = term('B')
  const heaviest = [...BURDEN_PARTS].sort((a, b) => b.value * b.weight - a.value * a.weight)[0]
  // Under 18 nothing is scored: the parts and their weights stay, their values do not.
  const minor = useIsMinor()
  return (
    <ToolCard title={t('What Burden is made of')} lead={minor ? t('Five parts, weighted. Lower is better. Under 18 none of them is scored.') : t('Five parts, weighted. Lower is better. {k} is the heaviest part of what is left.', { k: tx(heaviest.key) })}>
      <View style={{ gap: 12 }}>
        {BURDEN_PARTS.map((p) =>
          minor ? (
            <View key={p.key} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
              <Meta tone="ink" style={{ flex: 1 }}>
                <Rich text={t('{k} · weight *{w}*', { k: tx(p.key), w: p.weight.toFixed(2) })} wrap={(w) => <Mono tone="ink" size={14}>{w}</Mono>} />
              </Meta>
              <Meta size={14} tone="ink3">{monoNums(t('Not scored while under 18.'))}</Meta>
            </View>
          ) : (
          <BarRow
            key={p.key}
            label={<Rich text={t('{k} · weight *{w}*', { k: tx(p.key), w: p.weight.toFixed(2) })} wrap={(w) => <Mono tone="ink" size={14}>{w}</Mono>} />}
            labelText={t('{k} · weight {w}', { k: tx(p.key), w: p.weight.toFixed(2) })}
            value={p.value}
            max={100}
            color={col.main}
            hatched
            note={undefined}
          />
          ),
        )}
      </View>
      <Meta size={14} tone="ink3">
        {`${space('B')} · ${name('B')} · `}
        <Mono size={13} tone="ink3">
          {formulaIn(termByKey('B').formula, lang)}
        </Mono>
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
              <Body weight="medium">{monoNums(tx(s.title))}</Body>
              <Meta size={14}>{monoNums(tx(s.detail))}</Meta>
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

type Taken = { date: string; score: number; /** The Care thread the result was written to, when it routed. */ thread?: string }

/** Screens taken on the phone. PHQ-4 keeps its original key, so earlier retakes are still there. */
function useTaken() {
  const [phq, setPhq] = useLocal<Taken[]>('phq4Retakes', [])
  const [rest, setRest] = useLocal<Partial<Record<EaseScreen, Taken[]>>>('screenRetakes', {})
  const of = (n: EaseScreen) => (n === 'PHQ-4' ? phq : rest[n] ?? [])
  // A second sitting today corrects today's result rather than adding another.
  const add = (n: EaseScreen, x: Taken) =>
    n === 'PHQ-4' ? setPhq((r) => [...r.filter((e) => e.date !== x.date), x]) : setRest((r) => ({ ...r, [n]: [...(r[n] ?? []).filter((e) => e.date !== x.date), x] }))
  return { of, add }
}

const bandOf = (n: EaseScreen, score: number) => {
  const meta = SCREEN_META[n]
  return meta.bands.find((b) => score <= b.upTo) ?? meta.bands[meta.bands.length - 1]
}
/** A result goes to a person when its band routes to a clinician, or (PSS-4, higher) when the copy says the coach will be in touch. */
const routes = (n: EaseScreen, score: number) => {
  const b = bandOf(n, score)
  return b.route || (n === 'PSS-4' && b === SCREEN_META['PSS-4'].bands[SCREEN_META['PSS-4'].bands.length - 1])
}

/**
 * Writes a routed result into the person's Care messages thread (the thread Messages reads), starting
 * one when the signed-in account has none with them. Returns the thread id for the link.
 */
function useShareToCare() {
  const [msgs, setMsgs] = useStore(messagesStore)
  const threads = useAccountThreads()
  return (n: EaseScreen, score: number) => {
    const r = SCREEN_ROUTE[n]
    const meta = SCREEN_META[n]
    const band = bandOf(n, score)
    const id = threads.find((x) => x.personId === r.personId)?.id ?? msgs.started.find((x) => x.personId === r.personId)?.id ?? `t_screens_${r.personId}`
    const isNew = !threads.some((x) => x.id === id) && !msgs.started.some((x) => x.id === id)
    const d = new Date()
    const at = `${SPACE_TODAY}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    // The clinical record stays in English, as the questionnaire does.
    const m: Msg = { id: `s${Date.now()}`, from: 'me', at, clinical: n !== 'PSS-4', body: `Shared from Ease · ${n} ${score}/${meta.max}, ${band.label}. Scored on my phone; the pre-approved copy I was shown: “${band.copy}”` }
    setMsgs((s) => ({
      ...s,
      started: isNew ? [{ id, personId: r.personId, subject: 'Ease screens', clinical: n !== 'PSS-4', unread: 0, messages: [] }, ...s.started] : s.started,
      sent: { ...s.sent, [id]: [...(s.sent[id] ?? []), m] },
    }))
    return id
  }
}

function Screens() {
  const { c, space } = useTheme()
  const { t, tx, lang } = useA()
  const names = Object.keys(SCREEN_META) as EaseScreen[]
  const specimen = useIsSpecimen()
  const taken = useTaken()
  const share = useShareToCare()
  // The screen whose sheet is shown; it stays mounted while the sheet fades out.
  const [sheet, setSheet] = useState<EaseScreen | null>(null)
  const [open, setOpen] = useState(false)
  // Each opening starts a fresh sitting.
  const [sitting, setSitting] = useState(0)
  return (
    <ToolCard title={t('Your screens')} lead={t('Short, validated questionnaires. Results are explained in pre-approved words only; a clinician reads anything over a threshold.')}>
      {lang !== 'en' ? <Meta size={14} tone="ink2">{INSTRUMENT_NOTE[lang]}</Meta> : null}
      <View>
        {names.map((n, i) => {
          const meta = SCREEN_META[n]
          const form = SCREEN_FORMS[n]
          const mine = taken.of(n)
          // Only Arjun has a recorded history; anyone else's starts with their first sitting.
          const hist: Taken[] = [...(specimen ? SCREEN_HISTORY[n] : []), ...mine]
          const last: Taken | undefined = hist[hist.length - 1]
          const band = last ? bandOf(n, last.score) : null
          return (
            <View key={n} style={{ gap: 6, paddingVertical: space.s2, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: c.line }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Body weight="semibold">{monoNums(tx(n))}</Body>
                  <Meta size={14} tone="ink3">
                    {monoNums(tx(meta.what))}
                  </Meta>
                </View>
                {last ? (
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }} accessible accessibilityLabel={t('{n} {score} of {max}', { n: tx(n), score: last.score, max: meta.max })}>
                    <Mono tone="ink" size={22} weight="light">
                      {String(last.score)}
                    </Mono>
                    <Mono tone="ink3" size={12}>{`/${meta.max}`}</Mono>
                  </View>
                ) : null}
              </View>
              {last && band ? (
                <>
                  <Eyebrow tone="ink2">{tx(band.label)}</Eyebrow>
                  <Body tone="ink2">{monoNums(tx(band.copy))}</Body>
                  <Meta size={13} tone="ink3">
                    <Rich
                      text={hist.length > 1 ? t('*{date}* · {cadence} · earlier *{list}*', { date: fmtDate(last.date, lang), cadence: tx(meta.cadence), list: hist.slice(0, -1).map((h) => h.score).join(', ') }) : t('*{date}* · {cadence}', { date: fmtDate(last.date, lang), cadence: tx(meta.cadence) })}
                      wrap={(w) => <Mono size={12} tone="ink3">{w}</Mono>}
                    />
                  </Meta>
                  {routes(n, last.score) ? <CareRouted screen={n} today={band.copy.includes('today')} thread={last.thread} /> : null}
                </>
              ) : (
                <Meta size={13} tone="ink3">{monoNums(tx(meta.cadence))}</Meta>
              )}
              <Button
                size="sm"
                variant="secondary"
                icon="edit-3"
                onPress={() => (setSheet(n), setSitting((x) => x + 1), setOpen(true))}
                accessibilityHint={n === 'Pain' ? t('One rating, 0 to 10') : t('{k} questions, about {m} min', { k: form.items.length, m: form.minutes })}
                style={{ alignSelf: 'flex-start' }}
              >
                {mine.length ? t('Retake {n}', { n: tx(n) }) : t('Take {n} now', { n: tx(n) })}
              </Button>
            </View>
          )
        })}
      </View>
      <HumanWritten by="Dr Sanjay Menon" />
      {sheet ? (
        <ScreenSheet
          key={`${sheet}-${sitting}`}
          screen={sheet}
          open={open}
          onClose={() => setOpen(false)}
          onScored={(score) => {
            const thread = routes(sheet, score) ? share(sheet, score) : undefined
            taken.add(sheet, { date: SPACE_TODAY, score, thread })
            return thread
          }}
        />
      ) : null}
    </ToolCard>
  )
}

/**
 * Pre-approved routing note when a screen crosses a threshold (Memo p.24), naming who reads it
 * (as on the web). With `thread`, the result was written to that Care thread and the link opens it.
 */
function CareRouted({ screen, today = false, thread }: { screen: EaseScreen; today?: boolean; thread?: string }) {
  const { c, space } = useTheme()
  const { t } = useA()
  const r = SCREEN_ROUTE[screen]
  const text =
    screen === 'PSS-4'
      ? t('Shared with Coach Priya. She will be in touch this week.')
      : today
        ? t('{name} will call you today. You do not need to do anything.', { name: r.name })
        : t('{name} will read this within 48 hours. You do not need to do anything.', { name: r.name })
  return (
    <Card tone="sunk" padding={14} style={{ gap: space.s1 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Icon name="user-check" size={16} color={c.ink} />
        <Body style={{ flex: 1 }}>{monoNums(text)}</Body>
      </View>
      {thread ? <Meta size={14}>{monoNums(t('Your result is in your Care messages with {name}.', { name: r.name }))}</Meta> : null}
      <ArrowLink icon="message-square" onPress={() => router.push(thread ? `/messages?t=${thread}` : `/messages?compose=1&to=${r.personId}`)}>
        {thread ? t('Open the thread in Care') : t('Message {name} in Care', { name: r.name })}
      </ArrowLink>
    </Card>
  )
}

const WINDOW: Record<EaseScreen, '{n} · last two weeks' | '{n} · last month' | '{n} · last week'> = {
  'PHQ-4': '{n} · last two weeks',
  ISI: '{n} · last two weeks',
  'PSS-4': '{n} · last month',
  Pain: '{n} · last week',
}

/** Any of the four screens: items scored on the phone (Pain is one 0–10 rating); only pre-approved band copy is shown. */
function ScreenSheet({ screen, open, onClose, onScored }: { screen: EaseScreen; open: boolean; onClose: () => void; onScored: (score: number) => string | undefined }) {
  const { c, space, radius } = useTheme()
  const { t, tx, lang } = useA()
  const { setCrisisOpen } = useApp()
  const form = SCREEN_FORMS[screen]
  const meta = SCREEN_META[screen]
  const pain = screen === 'Pain'
  const [answers, setAnswers] = useState<(number | undefined)[]>(() => form.items.map(() => undefined))
  const [score, setScore] = useState<number | null>(null)
  const [thread, setThread] = useState<string | undefined>(undefined)
  const done = answers.every((a) => a !== undefined)
  const band = score === null ? null : bandOf(screen, score)
  const submit = () => {
    const top = form.options.length - 1
    const s = pain ? (answers[0] ?? 0) : answers.reduce<number>((sum, a, i) => sum + (form.reverse?.includes(i) ? top - (a ?? 0) : (a ?? 0)), 0)
    setScore(s)
    setThread(onScored(s))
  }
  const choose = (i: number, v: number) => setAnswers((a) => a.map((x, j) => (j === i ? v : x)))
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={score === null ? t(WINDOW[screen], { n: tx(screen) }) : t('{n} · your result', { n: tx(screen) })}
      footer={
        score === null ? (
          <Button variant="ink" block onPress={submit} disabled={!done} accessibilityHint={t('Scores your answers on this phone')}>
            {t('See my result')}
          </Button>
        ) : (
          <Button variant="ink" block onPress={onClose}>
            {t('Done')}
          </Button>
        )
      }
    >
      {score === null ? (
        <>
          {lang === 'en' ? (
            <Meta>{`${form.stem} Scored on this phone; no AI reads your answers.`}</Meta>
          ) : (
            <>
              <Meta tone="ink2">{INSTRUMENT_NOTE[lang]}</Meta>
              <Meta>{t('Scored on this phone; no AI reads your answers.')}</Meta>
              <Meta>{monoNums(form.stem)}</Meta>
            </>
          )}
          {pain ? (
            <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={form.items[0]}>
              <Body weight="medium">{form.items[0]}</Body>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {Array.from({ length: 11 }, (_, v) => {
                  const on = answers[0] === v
                  return (
                    <Pressable
                      key={v}
                      onPress={() => choose(0, v)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      aria-checked={on}
                      accessibilityLabel={t('{v} of 10', { v })}
                      style={({ pressed }) => ({ width: 48, height: 48, borderRadius: radius.card, borderWidth: on ? 2 : 1, borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : pressed ? c.paperSunk : c.paperRaised, alignItems: 'center', justifyContent: 'center' })}
                    >
                      <Mono size={17} color={on ? c.paper : c.ink}>
                        {String(v)}
                      </Mono>
                    </Pressable>
                  )
                })}
              </View>
              <Meta size={14} tone="ink3">
                <Rich text={t('*0* is no pain; *10* is the worst pain you can imagine.')} wrap={(w) => <Mono size={13} tone="ink3">{w}</Mono>} />
              </Meta>
            </View>
          ) : (
            form.items.map((item, i) => (
              <View key={item} style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={item}>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'baseline' }}>
                  <Mono size={13} tone="ink3">{`${i + 1}/${form.items.length}`}</Mono>
                  <Body weight="medium" style={{ flex: 1 }}>
                    {monoNums(item)}
                  </Body>
                </View>
                {(form.itemOptions?.[i] ?? form.options).map((o, v) => (
                  <OptionRow key={o} label={o} index={v} selected={answers[i] === v} onPress={() => choose(i, v)} />
                ))}
                {i < form.items.length - 1 ? <Divider /> : null}
              </View>
            ))
          )}
          {/* The source and licence line in the member's language; the instrument's name and its
              authors stay as published. Plex Mono has no Tamil or Devanagari, so there the words
              take the script's sans and only the numbers stay Mono. */}
          {lang === 'en' ? (
            <Mono size={12} tone="ink3">
              {form.source}
            </Mono>
          ) : (
            <Meta size={12} tone="ink3">
              {monoNums(tx(form.source))}
            </Meta>
          )}
        </>
      ) : band ? (
        <View style={{ gap: space.s2 }} accessibilityLiveRegion="polite">
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }} accessible accessibilityLabel={t('{n} {s} of {max}, {label}', { n: tx(screen), s: score, max: meta.max, label: tx(band.label) })}>
            <Mono tone="ink" size={48} weight="light">
              {String(score)}
            </Mono>
            <Mono tone="ink3" size={15}>{`/${meta.max}`}</Mono>
          </View>
          <Eyebrow tone="ink2">{tx(band.label)}</Eyebrow>
          <Body>{monoNums(tx(band.copy))}</Body>
          {routes(screen, score) ? <CareRouted screen={screen} today={band.copy.includes('today')} thread={thread} /> : <Meta>{monoNums(t('Kept with your screens · {cadence}', { cadence: tx(meta.cadence) }))}</Meta>}
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
  const [items, setItems] = useLocal('keepMeaning', useIsSpecimen() ? KEEP_MEANING_START : [])
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
                {monoNums(x.text)}
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
        {monoNums(t('In an emergency, call 112. Dr Sanjay Menon, your psychologist, is one message away in Care.'))}
      </Meta>
      <ArrowLink icon="message-square" onPress={() => router.push('/messages?compose=1&to=p_sanjay')}>
        {t('Message Dr Sanjay in Care')}
      </ArrowLink>
    </ToolCard>
  )
}
