import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { ArrowLink, Body, Button, Card, Divider, Eyebrow, Icon, Meta, Mono, Pill, SectionTitle, Segmented, Serif, Sheet, SpecimenTag, Title, fmtDate } from '@/components'
import { TEAM } from '@/shared/member'
import { useTheme } from '@/theme/ThemeProvider'
import { useDict } from '@/lib/i18n'
import { SPECIMEN_NOW } from './accountData'
import { charterStore, householdKindStore, useStore, type Charter, type HouseholdKind, type Ritual, type RitualCadence } from './bStore'
import { ChoiceCard, Field, FilterChips, useSheetCrisisGuard } from './parts'
import { HOUSE } from './i18n/household'
import { MonoNums } from '@/lib/monoNums'
import { useCommon } from './i18n/common'

// HOUSEHOLD KIND AND THE FAMILY JOY OFFICE (Arch p.13 household.kind couple | family | fjo;
// Memo tenant 5: a household tenant with a Clinical Index for every resident across three
// generations, a Family Joy Charter, a named physician and concierge, and an annual report in
// aggregate only). The charter is written by the family: values, rituals, one shared joy a
// week; every adult agrees before it is kept. Nothing is counted: no streaks. Specimen data,
// kept on the phone.

type HKey = keyof typeof HOUSE
const KIND_LABEL: Record<HouseholdKind, HKey> = { couple: 'kindCouple', family: 'kindFamily', fjo: 'kindFjo' }
const KIND_DESC: Record<HouseholdKind, HKey> = { couple: 'kindCoupleDesc', family: 'kindFamilyDesc', fjo: 'kindFjoDesc' }
const CADENCE: Record<RitualCadence, HKey> = { daily: 'chDaily', weekly: 'chWeekly', monthly: 'chMonthly', yearly: 'chYearly' }
const PHYSICIAN = TEAM.find((p) => p.role === 'Physician')!.name
const CONCIERGE = TEAM.find((p) => p.role === 'Concierge')!.name

/** The household's kind, with a sheet to change it. */
export function KindCard({ people, onToast }: { people: number; onToast: (m: string) => void }) {
  const { c, space } = useTheme()
  const t = useDict(HOUSE)
  const tc = useCommon()
  const [rec, setRec] = useStore(householdKindStore)
  const [open, setOpen] = useState(false)
  const [pick, setPick] = useState<HouseholdKind>(rec.kind)
  const [agree, setAgree] = useState(false)
  const [tried, setTried] = useState(false)
  const needsAgree = pick === 'fjo' && rec.kind !== 'fjo'
  const openSheet = () => {
    setPick(rec.kind)
    setAgree(rec.kind === 'fjo')
    setTried(false)
    setOpen(true)
  }
  const save = () => {
    setTried(true)
    if (needsAgree && !agree) return
    setOpen(false)
    if (pick !== rec.kind) {
      setRec({ kind: pick, since: SPECIMEN_NOW })
      onToast(t('kindToast', { kind: t(KIND_LABEL[pick]) }))
    }
  }
  return (
    <Card tone="sunk" style={{ gap: space.s1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="home" size={16} color={c.ink3} />
        <Eyebrow>{t('kindEyebrow')}</Eyebrow>
      </View>
      <Body weight="medium">
        {t(KIND_LABEL[rec.kind])}
        <Meta size={14} tone="ink3">
          {' · '}
          {t('kindSince').split('{date}')[0]}
          <Mono size={14} tone="ink3">{fmtDate(rec.since)}</Mono>
          {t('kindSince').split('{date}')[1] ?? ''}
        </Meta>
      </Body>
      <Meta>{t(KIND_DESC[rec.kind])}</Meta>
      <Button size="sm" variant="secondary" onPress={openSheet} style={{ alignSelf: 'flex-start' }}>
        {t('kindChange')}
      </Button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t('kindTitle')}
        footer={
          <View style={{ gap: 8 }}>
            <Button variant="ink" block onPress={save}>
              {t('kindSave')}
            </Button>
            <Button variant="ghost" block onPress={() => setOpen(false)}>
              {tc('cancel')}
            </Button>
          </View>
        }
      >
        <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={t('kindEyebrow')}>
          {(['couple', 'family', 'fjo'] as const).map((k) => {
            // A couple is two adults; this household has more people than that.
            const blocked = k === 'couple' && people > 2
            return (
              <ChoiceCard
                key={k}
                selected={pick === k && !blocked}
                onPress={() => {
                  if (blocked) return
                  setPick(k)
                  setTried(false)
                }}
                accessibilityLabel={t('kindA11y', { kind: t(KIND_LABEL[k]), desc: blocked ? t('kindCoupleNo') : t(KIND_DESC[k]) })}
                title={<Body weight="medium" tone={blocked ? 'ink3' : 'ink'}>{t(KIND_LABEL[k])}</Body>}
                sub={<Meta size={14} tone={blocked ? 'ink3' : 'ink2'}>{blocked ? t('kindCoupleNo') : t(KIND_DESC[k])}</Meta>}
              />
            )
          })}
        </View>
        {needsAgree ? (
          <>
            <ChoiceCard kind="checkbox" selected={agree} onPress={() => setAgree((x) => !x)} accessibilityLabel={t('kindFjoAgree')} title={<Body size={15}>{t('kindFjoAgree')}</Body>} />
            {tried && !agree ? (
              <Meta tone="error" accessibilityLiveRegion="polite">
                {t('pleaseConfirm')}
              </Meta>
            ) : null}
          </>
        ) : null}
        <Meta size={14} tone="ink3">{t('kindEach')}</Meta>
      </Sheet>
    </Card>
  )
}

/** The Family Joy Office panel, shown only for an FJO household. */
export function FjoOffice({ adults, minor, onToast }: { adults: { name: string; status: 'signed' | 'booked' | 'open'; on?: string }[]; minor: string | null; onToast: (m: string) => void }) {
  const { c, space } = useTheme()
  const t = useDict(HOUSE)
  const [asked, setAsked] = useState(false)
  const concierge = CONCIERGE.split(' ')[0]
  const dated = (key: 'fjoSigned' | 'fjoBooked' | 'fjoNext', date: string) => t(key, { date: fmtDate(date) })
  return (
    <View style={{ gap: space.s2 }}>
      <View style={{ gap: 8 }}>
        <SectionTitle>{t('fjoEyebrow')}</SectionTitle>
        <SpecimenTag />
      </View>
      <Title size={24}>
        {t('fjoTitleA')}
        <Serif>{t('fjoTitleSerif')}</Serif>
        {t('fjoTitleB')}
      </Title>
      <Body tone="ink2">{t('fjoLead')}</Body>
      <Card tone="sunk" style={{ gap: 6 }}>
        <Icon name="activity" size={17} color={c.ink3} />
        <Eyebrow>{t('fjoPhysician')}</Eyebrow>
        <Body>{PHYSICIAN}</Body>
      </Card>
      <Card tone="sunk" style={{ gap: 6 }}>
        <Icon name="user" size={17} color={c.ink3} />
        <Eyebrow>{t('fjoConcierge')}</Eyebrow>
        <Body>{CONCIERGE}</Body>
        {asked ? (
          <Meta accessibilityLiveRegion="polite">{t('fjoAsked', { name: concierge })}</Meta>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            icon="phone"
            onPress={() => {
              setAsked(true)
              onToast(t('fjoAsked', { name: concierge }))
            }}
            style={{ alignSelf: 'flex-start' }}
          >
            {t('fjoAsk')}
          </Button>
        )}
      </Card>
      <Card tone="sunk" style={{ gap: 6 }}>
        <Icon name="file-text" size={17} color={c.ink3} />
        <Eyebrow>{t('fjoReport')}</Eyebrow>
        <Body>{t('fjoReportV')}</Body>
        <Meta size={14}>{dated('fjoNext', '2027-07-06')}</Meta>
      </Card>
      <Card tone="raised" style={{ gap: 0 }}>
        <Eyebrow>{t('fjoClinical')}</Eyebrow>
        {adults.map((a) => (
          <View key={a.name} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line, flexWrap: 'wrap' }}>
            <Body>{a.name}</Body>
            <Pill tone={a.status === 'signed' ? 'ink' : 'neutral'}>{a.status === 'open' || !a.on ? t('fjoToBook') : dated(a.status === 'signed' ? 'fjoSigned' : 'fjoBooked', a.on)}</Pill>
          </View>
        ))}
        {minor ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 12, flexWrap: 'wrap' }}>
          <Body>{minor}</Body>
          <Pill>{t('fjoNever')}</Pill>
        </View>
        ) : null}
      </Card>
    </View>
  )
}

/**
 * The Family Joy Charter: shown as written, or as an invitation to write it. `writer` is the adult
 * signed in: saving records them as agreed and asks every other adult again.
 */
export function CharterCard({ isPatron, adults, writer, minor, onToast }: { isPatron: boolean; adults: string[]; writer: string; minor: string | null; onToast: (m: string) => void }) {
  const { c, space } = useTheme()
  const t = useDict(HOUSE)
  const [kindRec] = useStore(householdKindStore)
  const kind = kindRec.kind
  const [ch, setCh] = useStore(charterStore)
  const [editing, setEditing] = useState(false)
  const me = writer
  const others = adults.filter((a) => a !== writer)
  const waiting = adults.filter((a) => !ch.agreed.includes(a))
  const days = t('chDays').split(',')
  const agree = (name: string) => {
    const agreed = [...ch.agreed, name]
    const all = adults.every((a) => agreed.includes(a))
    setCh({ ...ch, agreed, agreedOn: all ? SPECIMEN_NOW : undefined })
    onToast(all ? t('chAllToast') : t('chAgreeToast', { name }))
  }
  return (
    <Card tone="sunk" style={{ gap: space.s1 + 4 }}>
      <Eyebrow>{kind === 'fjo' ? t('chOffice') : isPatron ? t('patronIn') : t('patronSoon')}</Eyebrow>
      <Title size={22}>{t('charter')}</Title>
      {!ch.written ? (
        <>
          <Body tone="ink2">{t('charterBody')}</Body>
          {[t('c1'), t('c2'), t('c3')].map((x) => (
            <View key={x} style={{ flexDirection: 'row', gap: 10 }}>
              <Icon name="check" size={15} color={c.ink2} />
              <Meta style={{ flex: 1 }}>{x}</Meta>
            </View>
          ))}
          <Button variant="ink" icon="edit-3" onPress={() => setEditing(true)} style={{ alignSelf: 'flex-start' }}>
            {t('chWrite')}
          </Button>
          {kind !== 'fjo' ? <ArrowLink onPress={() => router.push('/membership')}>{isPatron ? t('seeMembership') : t('seePatron')}</ArrowLink> : null}
        </>
      ) : (
        <>
          <View style={{ gap: 8 }}>
            <Eyebrow>{t('chValues')}</Eyebrow>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessible accessibilityLabel={t('chValueA11y', { list: ch.values.join(', ') })}>
              {ch.values.map((v) => (
                <Pill key={v}>{v}</Pill>
              ))}
            </View>
          </View>
          <View style={{ gap: 6 }}>
            <Eyebrow>{t('chRituals')}</Eyebrow>
            {ch.rituals.map((r) => (
              <View key={r.id} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                <Body style={{ flexShrink: 1 }}>{r.what}</Body>
                <Meta size={14} tone="ink3">{t(CADENCE[r.when])}</Meta>
              </View>
            ))}
          </View>
          <Card tone="raised" padding={16} style={{ gap: 6 }}>
            <Eyebrow>{t('chJoy')}</Eyebrow>
            <Body>
              {ch.joy.what}
              <Meta size={14} tone="ink3">{` · ${days[ch.joy.day] ?? ''}`}</Meta>
            </Body>
            {ch.week ? (
              <View style={{ gap: 4 }} accessibilityLiveRegion="polite">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="check" size={14} color={c.ink2} />
                  <Meta style={{ flexShrink: 1 }}><MonoNums text={t('chWeekNoted', { date: fmtDate(ch.week) })} /></Meta>
                </View>
                <Button size="sm" variant="ghost" onPress={() => setCh({ ...ch, week: undefined })} style={{ alignSelf: 'flex-start' }}>
                  {t('chWeekUndo')}
                </Button>
              </View>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onPress={() => {
                  setCh({ ...ch, week: SPECIMEN_NOW })
                  onToast(t('chWeekToast'))
                }}
                style={{ alignSelf: 'flex-start' }}
              >
                {t('chWeekDone')}
              </Button>
            )}
          </Card>
          <Divider />
          <View style={{ gap: 6 }} accessibilityLiveRegion="polite">
            {waiting.length === 0 && ch.agreedOn ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="check" size={14} color={c.ink} />
                <Meta tone="ink" style={{ flexShrink: 1 }}><MonoNums text={t('chAgreedAll', { date: fmtDate(ch.agreedOn) })} /></Meta>
              </View>
            ) : (
              <>
                <Meta>{`${t('chAgreedBy', { names: ch.agreed.join(', ') })} · ${t('chWaiting', { names: waiting.join(', ') })}`}</Meta>
                {waiting.map((w) => (
                  <Button key={w} size="sm" variant="link" onPress={() => agree(w)} style={{ alignSelf: 'flex-start' }}>
                    {t('chDemoAgree', { name: w })}
                  </Button>
                ))}
              </>
            )}
            <Meta size={13} tone="ink3">{minor ? `${t('chMinor', { name: minor })} ${t('chPrivate')}` : t('chPrivate')}</Meta>
          </View>
          <Button size="sm" variant="secondary" icon="edit-3" onPress={() => setEditing(true)} style={{ alignSelf: 'flex-start' }}>
            {t('chEdit')}
          </Button>
        </>
      )}
      {editing ? (
        <CharterEditor
          charter={ch}
          onClose={() => setEditing(false)}
          onSave={(next) => {
            // Saving asks every other adult to agree again; the writer has agreed by writing it.
            setCh({ ...next, written: true, agreed: [me], agreedOn: others.length ? undefined : SPECIMEN_NOW, week: ch.week })
            setEditing(false)
            onToast(t('chSaved'))
          }}
        />
      ) : null}
    </Card>
  )
}

/** Writing or changing the charter. Mounted only while open, so each opening starts from what is kept. */
function CharterEditor({ charter, onClose, onSave }: { charter: Charter; onClose: () => void; onSave: (c: Charter) => void }) {
  const { c, space } = useTheme()
  const t = useDict(HOUSE)
  const tc = useCommon()
  const guard = useSheetCrisisGuard()
  const [values, setValues] = useState<string[]>(charter.values)
  const [value, setValue] = useState('')
  const [valueErr, setValueErr] = useState<string | null>(null)
  const [rituals, setRituals] = useState<Ritual[]>(charter.rituals.length ? charter.rituals : [{ id: `r${Date.now()}`, what: '', when: 'weekly' }])
  const [joy, setJoy] = useState(charter.joy)
  const [tried, setTried] = useState(false)
  const days = t('chDays').split(',')

  const addValue = () => {
    const v = value.trim()
    if (v.length < 2) return
    if (!guard(v, onClose)) return
    if (values.length >= 5) return setValueErr(t('chValueMax'))
    if (values.some((x) => x.toLowerCase() === v.toLowerCase())) return setValueErr(t('chValueDup'))
    setValues([...values, v])
    setValue('')
    setValueErr(null)
  }
  const named = rituals.filter((r) => r.what.trim())
  const errs = {
    values: values.length === 0 ? t('chValueErr') : null,
    rituals: named.length === 0 || named.length !== rituals.length ? t('chRitualErr') : null,
    joy: joy.what.trim().length < 2 ? t('chJoyErr') : null,
  }
  const save = () => {
    // Emergency intercept first: free text in the family's own words.
    const text = [...rituals.map((r) => r.what), joy.what].join(' ')
    if (!guard(text, onClose)) return
    setTried(true)
    if (errs.values || errs.rituals || errs.joy) return
    onSave({ ...charter, values, rituals: rituals.map((r) => ({ ...r, what: r.what.trim() })), joy: { what: joy.what.trim(), day: joy.day } })
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('charter')}
      footer={
        <View style={{ gap: 8 }}>
          <Button variant="ink" block onPress={save}>
            {t('chSave')}
          </Button>
          <Button variant="ghost" block onPress={onClose}>
            {tc('cancel')}
          </Button>
        </View>
      }
    >
      <Meta>{t('chEditorIntro')}</Meta>

      <Eyebrow>{t('chValues')}</Eyebrow>
      {values.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {values.map((v) => (
            <Button key={v} size="sm" variant="secondary" iconRight="x" accessibilityLabel={t('chRemove', { x: v })} onPress={() => setValues(values.filter((x) => x !== v))}>
              {v}
            </Button>
          ))}
        </View>
      ) : null}
      <Field
        label={t('chValueNew')}
        value={value}
        onChangeText={(v) => {
          setValue(v)
          setValueErr(null)
        }}
        onSubmitEditing={addValue}
        returnKeyType="done"
        placeholder={t('chValuePh')}
        maxLength={60}
        autoComplete="off"
        error={valueErr ?? (tried ? errs.values : null)}
      />
      <Button size="sm" variant="secondary" icon="plus" onPress={addValue} disabled={value.trim().length < 2} style={{ alignSelf: 'flex-start' }}>
        {t('chAdd')}
      </Button>

      <Divider />
      <Eyebrow>{t('chRituals')}</Eyebrow>
      {rituals.map((r, i) => (
        <View key={r.id} style={{ gap: 8, paddingBottom: 4 }}>
          <Field
            label={t('chRitualN', { n: i + 1 })}
            value={r.what}
            onChangeText={(v) => setRituals(rituals.map((x) => (x.id === r.id ? { ...x, what: v } : x)))}
            placeholder={t('chRitualPh')}
            maxLength={80}
            autoComplete="off"
          />
          <Meta size={14} tone="ink2">{t('chWhen')}</Meta>
          <Segmented<RitualCadence>
            value={r.when}
            onChange={(v) => setRituals(rituals.map((x) => (x.id === r.id ? { ...x, when: v } : x)))}
            items={(Object.keys(CADENCE) as RitualCadence[]).map((k) => ({ value: k, label: t(CADENCE[k]) }))}
          />
          {rituals.length > 1 ? (
            <Button size="sm" variant="ghost" icon="x" onPress={() => setRituals(rituals.filter((x) => x.id !== r.id))} accessibilityLabel={t('chRemove', { x: r.what || t('chRitualN', { n: i + 1 }) })} style={{ alignSelf: 'flex-start' }}>
              {t('chRemove', { x: t('chRitualN', { n: i + 1 }) })}
            </Button>
          ) : null}
        </View>
      ))}
      {rituals.length < 6 ? (
        <Button size="sm" variant="ghost" icon="plus" onPress={() => setRituals([...rituals, { id: `r${Date.now()}`, what: '', when: 'weekly' }])} style={{ alignSelf: 'flex-start' }}>
          {t('chRitualAdd')}
        </Button>
      ) : (
        <Meta size={14} tone="ink3">{t('chRitualMax')}</Meta>
      )}
      {tried && errs.rituals ? (
        <Meta tone="error" accessibilityLiveRegion="polite">
          {errs.rituals}
        </Meta>
      ) : null}

      <Divider />
      <Eyebrow>{t('chJoy')}</Eyebrow>
      <Field label={t('chJoyWhat')} value={joy.what} onChangeText={(v) => setJoy({ ...joy, what: v })} placeholder={t('chJoyPh')} maxLength={80} autoComplete="off" error={tried ? errs.joy : null} />
      <Meta tone="ink">{t('chDay')}</Meta>
      <FilterChips<string> label={t('chDay')} value={String(joy.day)} onChange={(v) => setJoy({ ...joy, day: Number(v) })} items={days.map((d, i) => ({ value: String(i), label: d }))} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Icon name="lock" size={13} color={c.ink3} />
        <Meta size={13} tone="ink3" style={{ flex: 1 }}>
          {charter.written ? t('chEditNote') : t('chPrivate')}
        </Meta>
      </View>
      <View style={{ height: space.s1 }} />
    </Sheet>
  )
}
