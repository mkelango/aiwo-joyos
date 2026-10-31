import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Body, Button, Divider, Eyebrow, Icon, Meta, Mono, Sheet } from '@/components'
import { interceptsCrisis, useApp } from '@/lib/store'
import { useLocal } from '@/screens/a/local'
import { TextField } from '@/screens/a/parts'
import { CONTRIBUTIONS, IKIGAI_START, SPACE_TODAY, STATEMENT_START, TOMORROW_ANSWERS } from '@/screens/a/spacesData'
import { useTheme } from '@/theme/ThemeProvider'
import { useA } from '../i18n'
import { ToolCard, ToolsHeading, shortDate } from './common'

// PURPOSE: the Ikigai map (direction, contribution, daily anchors), the Tomorrow Question,
// the 25-year statement.

export function PurposeTools() {
  const { t } = useA()
  return (
    <>
      <ToolsHeading>{t('Purpose tools')}</ToolsHeading>
      <IkigaiMap />
      <TomorrowQuestion />
      <Statement />
    </>
  )
}

function IkigaiMap() {
  const { c, space, term } = useTheme()
  const { t, tx, lang } = useA()
  const { setCrisisOpen } = useApp()
  const col = term('P')
  const [kept, setKept] = useLocal<boolean[]>('purposeKept', [true, false, false])
  const [map, setMap] = useLocal('ikigai', { direction: IKIGAI_START.direction, contribution: IKIGAI_START.contribution })
  const [log, setLog] = useLocal('contributions', CONTRIBUTIONS)
  const [line, setLine] = useState('')
  const [who, setWho] = useState('')
  const [logged, setLogged] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [edit, setEdit] = useState(map)
  const [mapSaved, setMapSaved] = useState(false)
  const logIt = () => {
    const v = line.trim()
    const w = who.trim()
    if (!v) return
    if (interceptsCrisis(`${v} ${w}`)) {
      setCrisisOpen(true)
      return
    }
    setLog((l) => [{ id: `c${Date.now()}`, date: SPACE_TODAY, what: v, who: w || 'Someone it helped' }, ...l])
    setLine('')
    setWho('')
    setLogged(true)
  }
  const saveMap = () => {
    const d = edit.direction.trim()
    const k = edit.contribution.trim()
    if (!d || !k) return
    if (interceptsCrisis(`${d} ${k}`)) {
      setCrisisOpen(true)
      return
    }
    setMap({ direction: d, contribution: k })
    setMapSaved(true)
    setEditOpen(false)
  }
  return (
    <ToolCard title={t('Ikigai map')} lead={t('Ikigai in its original sense: the small, daily reasons a life feels worth living. Not a Venn diagram.')}>
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 4, borderLeftWidth: 3, borderLeftColor: col.main, paddingLeft: 12 }}>
          <Eyebrow>{t('Direction')}</Eyebrow>
          <Body>{map.direction}</Body>
        </View>
        <View style={{ gap: 4, borderLeftWidth: 3, borderLeftColor: col.soft, paddingLeft: 12 }}>
          <Eyebrow>{t('Contribution')}</Eyebrow>
          <Body>{map.contribution}</Body>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2, flexWrap: 'wrap' }}>
          <Button
            variant="link"
            icon="edit-3"
            onPress={() => {
              setEdit(map)
              setEditOpen(true)
            }}
            accessibilityLabel={t('Edit your direction and contribution')}
          >
            {t('Edit')}
          </Button>
          {mapSaved ? (
            <Meta tone="ink2" accessibilityLiveRegion="polite">
              {t('Kept. Private to you.')}
            </Meta>
          ) : null}
        </View>
        <View style={{ gap: 6 }}>
          <Eyebrow>{t('Daily anchors · today')}</Eyebrow>
          {IKIGAI_START.anchors.map((a, i) => (
            <Pressable
              key={a}
              onPress={() => setKept((k) => k.map((v, j) => (j === i ? !v : v)))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: kept[i] }}
              aria-checked={kept[i]}
              accessibilityLabel={a}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44, opacity: pressed ? 0.7 : 1 })}
            >
              <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: kept[i] ? c.ink : c.lineStrong, backgroundColor: kept[i] ? c.ink : undefined, alignItems: 'center', justifyContent: 'center' }}>
                {kept[i] ? <Icon name="check" size={14} color={c.paper} /> : null}
              </View>
              <Body style={{ flex: 1 }}>{a}</Body>
            </Pressable>
          ))}
        </View>
        <Divider />
        <View style={{ gap: 6 }}>
          <Eyebrow>{t('Contribution log · latest')}</Eyebrow>
          {log.slice(0, 5).map((x) => (
            <View key={x.id} style={{ flexDirection: 'row', gap: 12 }}>
              <Mono size={13} tone="ink3" style={{ width: 52 }}>
                {shortDate(x.date, lang)}
              </Mono>
              <Meta style={{ flex: 1 }}>
                <Meta tone="ink">{x.what}</Meta> · {tx(x.who)}
              </Meta>
            </View>
          ))}
        </View>
        <View style={{ gap: space.s1 }}>
          <TextField label={tx('Who did your work help today?')} value={line} onChangeText={(v) => (setLine(v), setLogged(false))} placeholder={t('Answered Ishaan’s question on pump sizing')} />
          <TextField label={t('Who · optional')} value={who} onChangeText={setWho} placeholder={t('Ishaan, graduate engineer')} onSubmitEditing={logIt} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2, flexWrap: 'wrap' }}>
            <Button onPress={logIt} disabled={!line.trim()} icon="plus">
              {t('Log it')}
            </Button>
            {logged ? (
              <Meta tone="ink2" accessibilityLiveRegion="polite">
                {t('Logged. One line is enough.')}
              </Meta>
            ) : null}
          </View>
        </View>
      </View>
      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t('Your Ikigai map')}
        footer={
          <Button variant="ink" block onPress={saveMap} disabled={!edit.direction.trim() || !edit.contribution.trim()}>
            {t('Save')}
          </Button>
        }
      >
        <Meta>{t('Write it the way you would say it to a friend. Your coach sees that it exists, not what it says.')}</Meta>
        <TextField label={t('Direction · where your days are pointed')} value={edit.direction} onChangeText={(v) => setEdit((e) => ({ ...e, direction: v }))} multiline />
        <TextField label={t('Contribution · who it is for')} value={edit.contribution} onChangeText={(v) => setEdit((e) => ({ ...e, contribution: v }))} multiline />
      </Sheet>
    </ToolCard>
  )
}

function TomorrowQuestion() {
  const { space } = useTheme()
  const { t, tx, lang } = useA()
  const { setCrisisOpen } = useApp()
  const [text, setText] = useState('')
  const [answers, setAnswers] = useLocal('tomorrow', TOMORROW_ANSWERS)
  const [saved, setSaved] = useState(false)
  const save = () => {
    const v = text.trim()
    if (!v) return
    if (interceptsCrisis(v)) {
      setCrisisOpen(true)
      return
    }
    setAnswers((a) => [{ week: 4, date: '2027-01-28', text: v }, ...a])
    setText('')
    setSaved(true)
  }
  return (
    <ToolCard title={t('The Tomorrow Question')} lead={t('Once a week, on Sunday evening. Practice week 2.')}>
      <Body size={22} style={{ lineHeight: 30 }}>
        {tx('What would make tomorrow worth waking for?')}
      </Body>
      <TextField label={t('Your answer')} hideLabel value={text} onChangeText={(v) => (setText(v), setSaved(false))} placeholder={t('One thing, however small')} multiline onSubmitEditing={save} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2, flexWrap: 'wrap' }}>
        <Button onPress={save} disabled={!text.trim()} icon="check">
          {t('Keep this answer')}
        </Button>
        {saved ? (
          <Meta accessibilityLiveRegion="polite" tone="ink2">
            {t('Kept. Private to you.')}
          </Meta>
        ) : null}
      </View>
      <View style={{ gap: space.s1 }}>
        {answers.map((a) => (
          <View key={`${a.week}-${a.date}-${a.text}`} style={{ flexDirection: 'row', gap: 12 }}>
            <Mono size={13} tone="ink3" style={{ width: 52 }}>
              {shortDate(a.date, lang)}
            </Mono>
            <Meta tone="ink" style={{ flex: 1 }}>
              {a.text}
            </Meta>
          </View>
        ))}
      </View>
    </ToolCard>
  )
}

function Statement() {
  const { space } = useTheme()
  const { t } = useA()
  const { setCrisisOpen } = useApp()
  const [open, setOpen] = useState(false)
  const [text, setText] = useLocal('statement', STATEMENT_START)
  const [editOpen, setEditOpen] = useState(false)
  const [draft, setDraft] = useState(text)
  const [saved, setSaved] = useState(false)
  const sentences = (text.match(/[^.!?]+[.!?]+[\s]*|[^.!?]+$/g) ?? [text]).map((x) => x.trim())
  const short = sentences.slice(0, 2).join(' ')
  const long = sentences.length > 2
  const save = () => {
    const v = draft.trim()
    if (!v) return
    if (interceptsCrisis(v)) {
      setCrisisOpen(true)
      return
    }
    setText(v)
    setSaved(true)
    setEditOpen(false)
  }
  return (
    <ToolCard title={t('The 25-year statement')} lead={t('Written once, read each quarter. Your coach knows it exists, not what it says.')}>
      <Body style={{ fontStyle: 'normal' }}>{open || !long ? text : short}</Body>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2, flexWrap: 'wrap' }}>
        {long ? (
          <Button variant="link" onPress={() => setOpen(!open)} accessibilityLabel={open ? t('Show less of the statement') : t('Read the whole statement')}>
            {open ? t('Show less') : t('Read it all')}
          </Button>
        ) : null}
        <Button
          variant="link"
          icon="edit-3"
          onPress={() => {
            setDraft(text)
            setEditOpen(true)
          }}
          accessibilityLabel={t('Edit the 25-year statement')}
        >
          {t('Edit')}
        </Button>
      </View>
      {saved ? (
        <Meta tone="ink2" accessibilityLiveRegion="polite">
          {t('Kept. Private to you.')}
        </Meta>
      ) : null}
      <Meta size={14} tone="ink3">
        {t('Last read on Day 1 · next on Day 90')}
      </Meta>
      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t('The 25-year statement')}
        footer={
          <Button variant="ink" block onPress={save} disabled={!draft.trim()}>
            {t('Save')}
          </Button>
        }
      >
        <Meta>{t('Who do you want to be in twenty-five years, and who will be with you? A few honest sentences are enough.')}</Meta>
        <TextField label={t('Your statement')} hideLabel value={draft} onChangeText={setDraft} multiline style={{ minHeight: 200 }} />
        <Meta size={14} tone="ink3">
          {t('Private to you. Not read by VIVA unless you ask it to.')}
        </Meta>
      </Sheet>
    </ToolCard>
  )
}
