import { useState } from 'react'
import { Platform, View } from 'react-native'
import { Body, Button, Card, DaybreakButton, Eyebrow, Icon, Meta, Mono, Screen, ScreenHeader, Segmented, Serif, SpecimenTag, Title, Toggle, fmtDate } from '@/components'
import { playSound } from '@/lib/sound'
import { useDict, useLang } from '@/lib/i18n'
import { H2, useLocal } from '@/screens/a/local'
import { TextField } from '@/screens/a/parts'
import { LETTER_AUTHOR, LETTER_ISSUES } from '@/screens/b/entryData'
import { LETTER } from '@/screens/b/i18n/letter'
import { useCrisisGuard } from '@/screens/b/parts'
import { useTheme } from '@/theme/ThemeProvider'

// THE JOYSPAN LETTER (Memo p17: print artefacts; Playbook p63: "monthly, in the Mentor's voice,
// with real numbers"). Editorial register: Newsreader for the headline, generous margins,
// Daybreak only as the ribbon. The letter is the Mentor's own words and stays as written; the
// chrome around it is translated. Write back: free text through the crisis intercept, kept on
// the phone (specimen), never quoted without the member's yes. One Daybreak: send the reply.
// Open to anyone (the Check's Letter door leads here), members and not.

type Reply = { id: string; issue: number; text: string; quote: boolean; at: string }

export default function LetterScreen() {
  const { c, space, radius } = useTheme()
  const t = useDict(LETTER)
  const lang = useLang()
  const guard = useCrisisGuard()
  const [issueN, setIssueN] = useState(LETTER_ISSUES[0].n)
  const issue = LETTER_ISSUES.find((x) => x.n === issueN) ?? LETTER_ISSUES[0]
  const [replies, setReplies] = useLocal<Reply[]>('letterReplies', [])
  const [text, setText] = useState('')
  const [quote, setQuote] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const mine = replies.filter((r) => r.issue === issue.n)

  const send = () => {
    const v = text.trim()
    if (!v) return setErr(t('empty'))
    // Free text passes the crisis intercept first.
    if (!guard(v)) return
    setErr(null)
    setReplies((rs) => [{ id: `lr${Date.now()}`, issue: issue.n, text: v, quote, at: new Date().toISOString() }, ...rs])
    setText('')
    setQuote(false)
    setSent(true)
    playSound('complete')
  }

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={t('eyebrow')}
        title={
          <>
            {t('titleA')}
            <Serif>{t('titleSerif')}</Serif>
            {t('titleB')}
          </>
        }
        lead={t('lead')}
      />

      <View style={{ gap: space.s1 }}>
        <Eyebrow {...H2}>{t('issues')}</Eyebrow>
        <Segmented
          value={String(issue.n)}
          onChange={(v) => {
            setIssueN(Number(v))
            setSent(false)
          }}
          items={LETTER_ISSUES.map((x, i) => ({ value: String(x.n), label: `${t('issueNo', { n: x.n })}${i === 0 ? ` · ${t('latest')}` : ''}` }))}
        />
      </View>

      {/* The letter: paper, Newsreader headline, the Daybreak ribbon down the left edge */}
      <View style={{ flexDirection: 'row', borderRadius: radius.card, borderWidth: 1, borderColor: c.line, backgroundColor: c.paperRaised, overflow: 'hidden' }}>
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 6, backgroundColor: c.daybreak }} />
        <View style={{ flex: 1, padding: space.s3, gap: space.s2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Eyebrow tone="ink2">{t('letterOn', { date: fmtDate(issue.date, lang) })}</Eyebrow>
            <Eyebrow>{t('issueNo', { n: issue.n })}</Eyebrow>
          </View>
          <Title size={30} accessibilityRole="header" aria-level={2}>
            <Serif>{issue.title}</Serif>
          </Title>
          {lang !== 'en' ? (
            <Meta size={14} tone="ink3">
              {t('asWritten')}
            </Meta>
          ) : null}
          {issue.body.map((p) => (
            <Body key={p} size={18} style={{ lineHeight: 28 }}>
              {p}
            </Body>
          ))}
          <View style={{ borderLeftWidth: 2, borderLeftColor: c.lineStrong, paddingLeft: space.s2 }}>
            <Body size={18} style={{ lineHeight: 28 }}>
              <Serif>{issue.change}</Serif>
            </Body>
          </View>
          <View style={{ gap: 4 }} accessible accessibilityLabel={`${t('numbers')}: ${issue.stats.map(([k, v]) => `${k} ${v}`).join(', ')}`}>
            <Eyebrow>{t('numbers')}</Eyebrow>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s3, rowGap: 4 }}>
              {issue.stats.map(([k, v]) => (
                <Mono key={k} size={15} tone="ink">{`${k} ${v}`}</Mono>
              ))}
            </View>
          </View>
          <View style={{ gap: 2, paddingTop: space.s1 }}>
            <Body weight="semibold">{LETTER_AUTHOR.name}</Body>
            <Meta size={14}>{t('authorRole')}</Meta>
          </View>
          <SpecimenTag />
        </View>
      </View>
      <Meta size={13} tone="ink3">
        {t('specimen')}
      </Meta>
      {Platform.OS === 'web' ? (
        <Button
          variant="secondary"
          icon="printer"
          onPress={() => {
            if (typeof window !== 'undefined') setTimeout(() => window.print(), 50)
          }}
          style={{ alignSelf: 'flex-start' }}
        >
          {t('print')}
        </Button>
      ) : null}

      {/* Write back */}
      <Card tone="sunk" style={{ gap: space.s2 }}>
        <Eyebrow {...H2}>{t('writeBack')}</Eyebrow>
        <Body>{t('writeBackLead')}</Body>
        {sent ? (
          <View style={{ flexDirection: 'row', gap: 10 }} accessibilityLiveRegion="polite">
            <Icon name="check" size={18} color={c.ink} />
            <Body style={{ flex: 1 }}>{t('sent')}</Body>
          </View>
        ) : null}
        <TextField
          label={t('replyLabel')}
          value={text}
          onChangeText={(v) => {
            setText(v)
            setErr(null)
            setSent(false)
          }}
          placeholder={t('replyPh')}
          multiline
        />
        {err ? (
          <Meta tone="error" accessibilityRole="alert">
            {err}
          </Meta>
        ) : null}
        <Toggle checked={quote} onChange={setQuote} label={t('quoteOk')} description={t('quoteOkD')} />
        <DaybreakButton icon="send" onPress={send}>
          {t('send')}
        </DaybreakButton>
        {mine.length ? (
          <View style={{ gap: space.s1 }}>
            <Eyebrow>{t('yourReplies', { n: mine.length })}</Eyebrow>
            {mine.map((r) => (
              <View key={r.id} style={{ gap: 2, borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.s1 }}>
                <Meta size={13} tone="ink3">
                  {`${fmtDate(new Date(r.at).toLocaleDateString('en-CA'))} · ${r.quote ? t('mayQuote') : t('notQuoted')}`}
                </Meta>
                <Body>{r.text}</Body>
              </View>
            ))}
          </View>
        ) : null}
        <Meta size={14}>{t('delivery')}</Meta>
      </Card>
    </Screen>
  )
}
