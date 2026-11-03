import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { ArrowLink, Body, Button, Card, Eyebrow, Icon, Meta } from '@/components'
import { interceptsCrisis, useApp } from '@/lib/store'
import { termByKey } from '@/shared/terms'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { useA } from './i18n'
import { H2, useLocal } from './local'
import { TextField } from './parts'
import { LE8, LE8_SERIES, NO_LIST_DRAFT_NO_CALENDAR, VIVA_DRAFT, VIVA_MATCH, VIVA_MORE, type Le8Key } from './spacesData'
import { le8Score } from './tools/body'
import { useTimeAuditAccess } from './tools/freedom'
import { VivaExchange, useVivaRun } from './vivaParts'

// The room's VIVA tool (Memo p.19, p.27), as on the web room: the room's named tools as canned
// prompts, an own question (the emergency intercept reads it first), a specimen draft run here
// in the room with provenance and its reviewer, and "Ask VIVA about {space}" with the room's context.
// Never on Ease: the room shows a clinician's note instead.
// In Freedom the card follows the calendar: with consent withdrawn in the Trust centre (c_cal) or no
// calendar connected, time_audit_summary is not offered, a typed question about the audit is told
// why, and the No-list coach drafts without anything read from a calendar.

type Draft = { tool: string; ask: string; draft: string; reviewer: string }
type Reading = { at: string; v: number; v2?: number }

/** The two lowest of the eight, from the specimen readings and any the member saved in Body. */
function useLe8Lowest() {
  const [mine] = useLocal<Partial<Record<Le8Key, Reading[]>>>('le8Readings', {})
  return LE8.map((x) => {
    const pts = [...LE8_SERIES[x.key], ...(mine[x.key] ?? [])].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
    const last = pts[pts.length - 1]
    return { name: x.name, score: le8Score(x.key, last.v, last.v2) }
  }).sort((a, b) => a.score - b.score)
}

export function RoomViva({ term }: { term: TermKey }) {
  const { c, radius, space } = useTheme()
  const { t, tx, lang, space: spaceName } = useA()
  const { setCrisisOpen } = useApp()
  const info = termByKey(term)
  const audit = useTimeAuditAccess()
  const calendarless = term === 'F' && audit !== 'open'
  const noAudit = audit === 'no-consent'
    ? t('Calendar consent is withdrawn in the Trust centre, so VIVA reads no calendar and gives no time-audit summary.')
    : t('No calendar is connected, so there is no time audit for VIVA to summarise. Connect one on the time audit card above; VIVA reads only the totals.')
  const drafts = ([VIVA_DRAFT[term], ...VIVA_MORE[term]].filter(Boolean) as Draft[]).filter((d) => !(calendarless && d.tool === 'time_audit_summary'))
  const { state, turn, run, reset } = useVivaRun()
  const [q, setQ] = useState('')
  const [err, setErr] = useState(false)
  const lowest = useLe8Lowest()

  /** The draft's words; le8_coach names the two lowest of the eight at ask time. */
  const draftText = (d: Draft) => {
    if (calendarless && d.tool === 'no_list_coach') return tx(NO_LIST_DRAFT_NO_CALENDAR)
    if (d.tool !== 'le8_coach') return tx(d.draft)
    const [a, b] = lowest
    // Mid-sentence in English the names read in lower case, as the LE8 card does.
    const nm = (x: string) => (lang === 'en' ? x.toLowerCase() : tx(x))
    return t('Of your Essential 8, {a} ({sa}) and {b} ({sb}) are lowest right now. Pick the one you can move this week; one small habit is enough to start. Dr Meera looks at all eight at your Day 45 review. VIVA does not diagnose.', { a: nm(a.name), sa: a.score, b: nm(b.name), sb: b.score })
  }
  const askTool = (d: Draft) => run({ ask: tx(d.ask), text: draftText(d), tool: d.tool, reviewer: tx(d.reviewer) })
  const askOwn = () => {
    const v = q.trim()
    if (!v) return setErr(true)
    // The emergency intercept reads the question before VIVA does.
    if (interceptsCrisis(v)) {
      setCrisisOpen(true)
      return
    }
    const hit = drafts.find((d) => VIVA_MATCH[d.tool]?.test(v))
    if (!hit && calendarless && VIVA_MATCH.time_audit_summary.test(v)) {
      run({ ask: v, text: noAudit })
      setQ('')
      setErr(false)
      return
    }
    run(hit ? { ask: v, text: draftText(hit), tool: hit.tool, reviewer: tx(hit.reviewer) } : { ask: v, text: t('In this room VIVA can help with {tools}. That question deserves a fuller answer: open VIVA, where your care team can see the thread.', { tools: info.viva.join(', ') }) })
    setQ('')
    setErr(false)
  }

  return (
    <Card tone="raised" style={{ gap: space.s2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="message-circle" size={16} color={c.ink2} />
        <Eyebrow {...H2} style={{ flexShrink: 1 }}>{t('VIVA · AI drafts, a person signs')}</Eyebrow>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {info.viva.map((v) => (
          <View key={v} style={{ borderRadius: radius.pill, backgroundColor: c.paperSunk, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Eyebrow size={11} tone="ink2">
              {v}
            </Eyebrow>
          </View>
        ))}
      </View>
      {state === 'idle' ? (
        <View style={{ gap: space.s1 }}>
          {drafts.map((d) => (
            <Pressable
              key={d.tool}
              onPress={() => askTool(d)}
              accessibilityRole="button"
              accessibilityLabel={t('Ask VIVA: {ask}', { ask: tx(d.ask) })}
              style={({ pressed }) => ({ borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.paperSunk : c.paperRaised, paddingHorizontal: 16, paddingVertical: 12, gap: 4 })}
            >
              <Body>{`“${tx(d.ask)}”`}</Body>
              <Eyebrow size={11}>{t('Tap to ask · {tool}', { tool: d.tool })}</Eyebrow>
            </Pressable>
          ))}
          {calendarless ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Icon name="calendar" size={14} color={c.ink3} />
              <Meta size={14} tone="ink3" style={{ flex: 1 }}>
                {noAudit}
              </Meta>
            </View>
          ) : null}
          <TextField
            label={t('Or ask in your own words')}
            value={q}
            onChangeText={(v) => {
              setQ(v)
              setErr(false)
            }}
            placeholder={t('Ask VIVA about {space}…', { space: spaceName(term) })}
            returnKeyType="send"
            onSubmitEditing={askOwn}
          />
          {err ? (
            <Meta tone="error" accessibilityLiveRegion="polite">
              {t('Write a question first.')}
            </Meta>
          ) : null}
          <Button size="sm" variant="secondary" icon="send" onPress={askOwn} style={{ alignSelf: 'flex-start' }}>
            {t('Ask')}
          </Button>
        </View>
      ) : (
        <View style={{ gap: space.s1 }}>
          <VivaExchange state={state} turn={turn} />
          {state === 'shown' ? (
            <Button size="sm" variant="ghost" onPress={reset} style={{ alignSelf: 'flex-start' }}>
              {t('Ask something else')}
            </Button>
          ) : null}
        </View>
      )}
      <ArrowLink icon="message-circle" onPress={() => router.push(`/viva?space=${info.slug}`)}>
        {t('Ask VIVA about {space}', { space: spaceName(term) })}
      </ArrowLink>
    </Card>
  )
}
