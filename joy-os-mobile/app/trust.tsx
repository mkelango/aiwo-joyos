import { useEffect, useMemo, useRef, useState } from 'react'
import { Platform, Share, View } from 'react-native'
import {
  Body,
  Button,
  Card,
  DaybreakButton,
  Divider,
  Eyebrow,
  Icon,
  type IconName,
  Meta,
  Mono,
  Numeral,
  Pill,
  Screen,
  ScreenHeader,
  SectionTitle,
  Segmented,
  Serif,
  Sheet,
  SpecimenTag,
  Title,
  Toggle,
  fmtDate,
} from '@/components'
import { ACCESS_LOG, CONSENTS, INDEX_HISTORY, MEMBER } from '@/shared/member'
import { TENANT } from '@/shared/platform'
import type { AccessEvent, Consent } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { CLAIMS_LOG, EXPORTS_PAST, EXTRA_ACCESS } from '@/screens/b/accountData'
import { trustStore, useStore } from '@/screens/b/bStore'
import { ChoiceCard, Done, Field, FilterChips, TimelineStep, useSheetCrisisGuard, memberOnly } from '@/screens/b/parts'
import { useDict } from '@/lib/i18n'
import { TRUST, SCOPE_TEXT, CONSENT_T, ACCESS_T, EXPORT_T, CLAIM_STATE, CLAIM_BY, CLAIM_T } from '@/screens/b/i18n/trust'
import { ROLE, useCommon, useTx } from '@/screens/b/i18n/common'

// TRUST CENTRE (Memo module 14, p.27): who has seen my data, consents by purpose, export
// (FHIR / JSON, ≤72 h), delete (step-up, honoured ≤24 h), research, aggregates-only for
// employers and partners, the claims log and residency. One Daybreak: "Request export".

const SCOPE_LABEL: Record<Consent['scope'], string> = { core: 'Core', device: 'Devices', calendar: 'Calendar', whatsapp: 'Messaging', cohort: 'Research & publishing', partner: 'Partners' }
type ExportStatus = 'idle' | 'requested' | 'preparing' | 'ready'
type DeleteStep = 'closed' | 'explain' | 'confirm' | 'auth'

export default memberOnly(Trust)

function Trust() {
  const { c, space } = useTheme()
  const [toast, setToast] = useState<string | null>(null)
  const t = useDict(TRUST)
  const tc = useCommon()
  const tx = useTx()
  const role_ = (r: string) => tx(ROLE[r], r)
  const cName = (x: Consent) => tx(CONSENT_T[x.id]?.name, x.name)
  const cPurpose = (x: Consent) => tx(CONSENT_T[x.id]?.purpose, x.purpose)
  const aWho = (e: AccessEvent) => tx(ACCESS_T[e.id]?.who, e.who)
  const aWhat = (e: AccessEvent) => tx(ACCESS_T[e.id]?.what, e.what)
  const aPurpose = (e: AccessEvent) => tx(ACCESS_T[e.id]?.purpose, e.purpose)

  // Access log
  const all = useMemo<AccessEvent[]>(() => [...ACCESS_LOG, ...EXTRA_ACCESS].sort((a, b) => b.at.localeCompare(a.at)), [])
  const roles = useMemo(() => Array.from(new Set(all.map((e) => e.role))), [all])
  const [role, setRole] = useState('all')
  const [showAll, setShowAll] = useState(false)
  const rows = all.filter((e) => role === 'all' || e.role === role)
  const visible = showAll ? rows : rows.slice(0, 4)
  const people = new Set(all.filter((e) => e.role !== 'System').map((e) => e.who)).size

  // Consents
  // Consents, research use and a scheduled erasure are kept on the phone (they hold on return).
  const [trust, setTrust] = useStore(trustStore)
  const consent: Record<string, { on: boolean; changed?: boolean }> = Object.fromEntries(
    CONSENTS.map((x) => [x.id, x.id in trust.consents ? { on: trust.consents[x.id], changed: true } : { on: x.granted }]),
  )
  const [confirm, setConfirm] = useState<Consent | null>(null)
  const setConsentOn = (x: Consent, v: boolean) => setTrust((s) => ({ ...s, consents: { ...s.consents, [x.id]: v } }))
  const consentToast = (x: Consent, v: boolean) => t(v ? 'turnedOn' : 'withdrawnT', { name: cName(x) })
  const applyConsent = (x: Consent, v: boolean) => {
    setConsentOn(x, v)
    setToast(consentToast(x, v))
  }
  // iOS cannot present the toast Modal while the confirm Sheet is still dismissing.
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])
  const granted = Object.values(consent).filter((x) => x.on).length
  const groups = (['core', 'cohort', 'device', 'calendar', 'whatsapp', 'partner'] as const).map((g) => ({ g, items: CONSENTS.filter((x) => x.scope === g) })).filter((x) => x.items.length)

  // Export
  const [format, setFormat] = useState<'fhir' | 'json'>('fhir')
  const [exp, setExp] = useState<ExportStatus>('idle')
  const steps: { key: ExportStatus; label: string }[] = [
    { key: 'requested', label: t('requested') },
    { key: 'preparing', label: t('preparing') },
    { key: 'ready', label: t('readyDl') },
  ]
  const expIdx = steps.findIndex((s) => s.key === exp)
  const [shared, setShared] = useState(false)
  const [shareFailed, setShareFailed] = useState(false)
  // The copy is prepared in stages; each advances on its own (specimen timing).
  useEffect(() => {
    if (exp !== 'requested' && exp !== 'preparing') return
    const t = setTimeout(() => setExp(exp === 'requested' ? 'preparing' : 'ready'), 1200)
    return () => clearTimeout(t)
  }, [exp])
  const shareCopy = () => {
    const bundle = {
      specimen: true,
      format: format === 'fhir' ? 'FHIR R4 bundle (specimen excerpt)' : 'JSON',
      member: { aiwoId: MEMBER.aiwoId, name: `${MEMBER.firstName} ${MEMBER.lastName}`, city: MEMBER.city, plan: MEMBER.plan },
      index: INDEX_HISTORY.map((x) => ({ takenOn: x.takenOn, value: x.value, grade: x.grade, method: x.method, terms: x.terms.map((t) => ({ key: t.key, value: t.value })) })),
      consents: Object.entries(consent).map(([id, v]) => ({ id, granted: v.on })),
      exportedAt: new Date().toISOString(),
    }
    const text = JSON.stringify(bundle, null, 2)
    setShareFailed(false)
    // On the web build there is no share sheet to rely on, so the copy downloads as a file.
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const url = URL.createObjectURL(new Blob([text], { type: format === 'fhir' ? 'application/fhir+json' : 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `joy-os-export-specimen-${format}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      setShared(true)
      return
    }
    Share.share({ title: 'Joy OS export (specimen)', message: text })
      .then(() => setShared(true))
      .catch(() => {
        setShared(false)
        setShareFailed(true)
      })
  }

  // Ask about an entry
  const guard = useSheetCrisisGuard()
  const [askOpen, setAskOpen] = useState(false)
  const [askEntry, setAskEntry] = useState<string | null>(null)
  const [askText, setAskText] = useState('')
  const [askErr, setAskErr] = useState<{ entry?: string; text?: string }>({})
  const [askSent, setAskSent] = useState(false)
  const openAsk = (id?: string) => {
    setAskEntry(id ?? null)
    setAskText('')
    setAskErr({})
    setAskSent(false)
    setAskOpen(true)
  }
  const sendAsk = () => {
    if (!guard(askText, () => setAskOpen(false))) return
    const e: typeof askErr = {}
    if (!askEntry) e.entry = t('errEntry')
    if (askText.trim().length < 5) e.text = t('errText')
    setAskErr(e)
    if (Object.keys(e).length) return
    setAskSent(true)
  }

  // Delete
  const [del, setDel] = useState<DeleteStep>('closed')
  const [understood, setUnderstood] = useState(false)
  const [typed, setTyped] = useState('')
  const [tried, setTried] = useState(false)
  const scheduled = trust.eraseScheduled
  const setScheduled = (v: boolean) => setTrust((s) => ({ ...s, eraseScheduled: v }))
  const closeDel = () => {
    setDel('closed')
    setTyped('')
    setUnderstood(false)
    setTried(false)
  }

  // Research
  const research = trust.research
  const setResearch = (v: boolean) => setTrust((s) => ({ ...s, research: v }))

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={t('eyebrow')}
        title={
          <>
            {t('titleA')}<Serif>{t('titleSerif')}</Serif>{t('titleB')}
          </>
        }
        lead={t('lead')}
      />

      {/* Summary */}
      <View style={{ flexDirection: 'row', gap: space.s1 + 4 }}>
        {(
          [
            ['eye', t('peopleLooked'), String(people), t('last30')],
            ['check-square', t('consentsGiven'), `${granted}/${CONSENTS.length}`, t('byPurpose')],
          ] as [IconName, string, string, string][]
        ).map(([icon, label, value, sub]) => (
          <Card key={label} tone="raised" style={{ flex: 1, gap: 6 }}>
            <Icon name={icon} size={18} color={c.ink2} />
            <Eyebrow>{label}</Eyebrow>
            <Numeral size={40}>{value}</Numeral>
            <Meta size={14}>{sub}</Meta>
          </Card>
        ))}
      </View>

      {/* Who has seen my data */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>{t('whoSeen')}</SectionTitle>
          <SpecimenTag />
        </View>
        <Title size={24}>{t('everyLook')}</Title>
        <Body tone="ink2">{t('everyLookBody')}</Body>
        <FilterChips label={t('filter')} value={role} onChange={(v) => setRole(v)} items={[{ value: 'all', label: t('everyone') }, ...roles.map((r) => ({ value: r, label: role_(r) }))]} />
        <Card tone="raised" style={{ gap: 0 }}>
          <Meta size={14} tone="ink3" accessibilityLiveRegion="polite">
            {t('entries', { n: rows.length, unit: rows.length === 1 ? t('entry') : t('entriesW') })}
          </Meta>
          {visible.map((e) => (
            <View key={e.id} accessible accessibilityLabel={t('rowA11y', { at: e.at, who: aWho(e), role: role_(e.role), what: aWhat(e), purpose: aPurpose(e) })} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
                <Body weight="medium">{aWho(e)}</Body>
                <Eyebrow tone="ink2">{role_(e.role)}</Eyebrow>
              </View>
              <Meta tone="ink">{aWhat(e)}</Meta>
              <Meta size={14}>{aPurpose(e)}</Meta>
              <Mono size={12} tone="ink3">
                {e.at}
              </Mono>
            </View>
          ))}
          {rows.length > 4 ? (
            <Button variant="link" onPress={() => setShowAll((s) => !s)}>
              {showAll ? t('showFewer') : t('showAll', { n: rows.length })}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" icon="help-circle" onPress={() => openAsk()} style={{ marginTop: space.s1 }}>
            {t('askEntry')}
          </Button>
        </Card>
      </View>

      {/* Consents */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('consentsTitle')}</SectionTitle>
        <Title size={24}>
          {t('agreeA')}<Serif>{t('agreeSerif')}</Serif>{t('agreeB')}
        </Title>
        <Body tone="ink2">{t('agreeBody')}</Body>
        <Card tone="raised" style={{ gap: space.s2 }}>
          {groups.map(({ g, items }, gi) => (
            <View key={g} style={{ gap: space.s2 }}>
              {gi > 0 ? <Divider /> : null}
              <Eyebrow>{tx(SCOPE_TEXT[g], SCOPE_LABEL[g])}</Eyebrow>
              {items.map((x) => {
                const s = consent[x.id]
                return (
                  <Toggle
                    key={x.id}
                    checked={s.on}
                    onChange={(v) => (!v && (x.scope === 'core' || x.scope === 'cohort') ? setConfirm(x) : applyConsent(x, v))}
                    label={cName(x)}
                    description={`${cPurpose(x)}. ${s.changed ? t('changeRec') : s.on && x.since ? t('given', { date: fmtDate(x.since) }) : t('notGiven')}`}
                  />
                )
              })}
            </View>
          ))}
        </Card>
      </View>

      {/* Export */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="download" size={18} color={c.ink2} />
          <Eyebrow>{t('export')}</Eyebrow>
        </View>
        <Title size={24}>{t('exportTitle')}</Title>
        <Body tone="ink2">{t('exportBody')}</Body>
        <Segmented
          value={format}
          onChange={setFormat}
          items={[
            { value: 'fhir', label: 'FHIR R4 bundle' },
            { value: 'json', label: 'JSON' },
          ]}
        />
        <Meta>{format === 'fhir' ? t('fhirNote') : t('jsonNote')}</Meta>
        {exp === 'idle' ? (
          <DaybreakButton icon="download" onPress={() => setExp('requested')}>
            {t('request')}
          </DaybreakButton>
        ) : (
          <View style={{ gap: space.s2 }} accessibilityLiveRegion="polite">
            <View>
              {steps.map((s, i) => (
                <TimelineStep key={s.key} index={i} state={i < expIdx || exp === 'ready' ? 'done' : i === expIdx ? 'now' : 'next'} last={i === steps.length - 1}>
                  <Body tone={i <= expIdx ? 'ink' : 'ink2'}>{s.label}</Body>
                </TimelineStep>
              ))}
            </View>
            {shared ? <Done>{Platform.OS === 'web' ? t('savedDl') : t('handed')}</Done> : null}
            {shareFailed ? (
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }} accessibilityLiveRegion="polite">
                <Icon name="alert-circle" size={15} color={c.ink2} />
                <Meta tone="ink" style={{ flex: 1 }}>{t('shareFailed')}</Meta>
              </View>
            ) : null}
            <Meta>
              {exp === 'ready'
                ? t('readyLine', { format: format === 'fhir' ? 'FHIR R4 bundle' : t('jsonFile') })
                : t('reqLine', { a: fmtDate('2027-01-28'), b: fmtDate('2027-01-31') })}
            </Meta>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
              {exp === 'ready' ? (
                <Button variant="ink" size="sm" icon={Platform.OS === 'web' ? 'download' : 'share'} onPress={shareCopy}>
                  {Platform.OS === 'web' ? t('dlCopy') : t('shareCopy')}
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" onPress={() => { setExp('idle'); setShared(false); setShareFailed(false) }}>
                {exp === 'ready' ? tc('done') : t('cancelReq')}
              </Button>
            </View>
          </View>
        )}
        <Divider />
        <Eyebrow>{t('earlier')}</Eyebrow>
        {EXPORTS_PAST.map((x) => (
          <Meta key={x.id} size={14}>
            <Mono size={14} tone="ink2">{fmtDate(x.requested)}</Mono> · {tx(EXPORT_T[x.id]?.format, x.format)} · <Mono size={14} tone="ink2">{x.size}</Mono> · {tx(EXPORT_T[x.id]?.status, x.status)}
          </Meta>
        ))}
      </Card>

      {/* Delete */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="trash-2" size={18} color={c.ink2} />
          <Eyebrow>{t('delete')}</Eyebrow>
        </View>
        <Title size={24}>{t('leaveTitle')}</Title>
        {[t('d1'), t('d2'), t('d3')].map((x) => (
          <View key={x} style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="check" size={15} color={c.ink2} />
            <Meta style={{ flex: 1 }}>{x}</Meta>
          </View>
        ))}
        {scheduled ? (
          <Card tone="sunk" padding={16} style={{ gap: space.s1 }}>
            <Body weight="medium" accessibilityLiveRegion="polite">
              {t('scheduledA')}<Mono tone="ink">29.01.2027 17:40</Mono>
            </Body>
            <Meta>{t('changeMind')}</Meta>
            <Button variant="secondary" size="sm" onPress={() => setScheduled(false)}>
              {t('cancelErase')}
            </Button>
          </Card>
        ) : (
          <Button variant="secondary" icon="trash-2" onPress={() => setDel('explain')}>
            {t('eraseBtn')}
          </Button>
        )}
      </Card>

      {/* Research */}
      <Card tone="raised" style={{ gap: space.s1 }}>
        <Eyebrow>{t('research')}</Eyebrow>
        <Toggle
          checked={research}
          onChange={(v) => {
            setResearch(v)
            setToast(v ? t('researchOn') : t('researchOff'))
          }}
          label={t('researchL')}
          description={t('researchD')}
        />
      </Card>

      {/* Aggregates */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('employers')}</SectionTitle>
        <Title size={24}>
          {t('crowdA')}<Serif>{t('crowdSerif')}</Serif>{t('crowdB')}
        </Title>
        {(
          [
            ['briefcase', t('empHead'), t('empBody', { min: TENANT.minCohort, cell: TENANT.minCell })],
            ['shield', t('insHead'), t('insBody')],
            ['lock', t('venHead'), t('venBody')],
          ] as [IconName, string, string][]
        ).map(([icon, head, body]) => (
          <Card key={head} tone="sunk" style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name={icon} size={17} color={c.ink2} />
              <Body weight="medium" style={{ flex: 1 }}>
                {head}
              </Body>
            </View>
            <Meta>{body}</Meta>
          </Card>
        ))}
      </View>

      {/* Claims log */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('claims')}</SectionTitle>
        <Body tone="ink2">{t('claimsBody')}</Body>
        <Card tone="raised" style={{ gap: 0 }}>
          {CLAIMS_LOG.map((cl, i) => (
            <View key={cl.claim} style={{ gap: 4, paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.line }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s1 }}>
                <Body style={{ flex: 1 }}>{tx(CLAIM_T[i]?.claim, cl.claim)}</Body>
                <Pill tone={cl.state === 'Approved' ? 'ink' : 'neutral'}>{tx(CLAIM_STATE[cl.state], cl.state)}</Pill>
              </View>
              <Meta size={14}>{tx(CLAIM_T[i]?.note, cl.note)}</Meta>
              <Meta size={13} tone="ink3">
                {tx(CLAIM_BY[cl.by], cl.by)} · <Mono size={13} tone="ink3">{fmtDate(cl.on)}</Mono>
              </Meta>
            </View>
          ))}
        </Card>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Icon name="map-pin" size={14} color={c.ink3} />
          <Meta size={14} tone="ink3" style={{ flex: 1 }}>
            {t('stored')}
          </Meta>
        </View>
      </View>

      {/* Withdraw a core consent */}
      <Sheet
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={t('withdrawQ', { name: confirm ? cName(confirm) : '' })}
        footer={
          <View style={{ flexDirection: 'row', gap: space.s1, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onPress={() => setConfirm(null)}>
              {tc('keepIt')}
            </Button>
            <Button
              variant="ink"
              onPress={() => {
                if (confirm) {
                  const x = confirm
                  setConsentOn(x, false)
                  setConfirm(null)
                  if (toastTimer.current) clearTimeout(toastTimer.current)
                  toastTimer.current = setTimeout(() => setToast(consentToast(x, false)), 350)
                } else setConfirm(null)
              }}
            >
              {t('withdraw')}
            </Button>
          </View>
        }
      >
        <Body>
          {confirm?.id === 'c_care'
            ? t('wCare')
            : confirm?.id === 'c_data'
              ? t('wData')
              : t('wPub')}
        </Body>
        <Meta>{t('giveAgain')}</Meta>
      </Sheet>

      {/* Erase flow */}
      <Sheet open={del !== 'closed'} onClose={closeDel} title={t('eraseTitle')}>
        {del === 'explain' ? (
          <>
            <Body>{t('eraseBody')}</Body>
            <Meta>{t('copyFirst')}</Meta>
            <ChoiceCard kind="checkbox" selected={understood} onPress={() => setUnderstood((u) => !u)} accessibilityLabel={t('understand')} title={<Body>{t('understand')}</Body>} />
            {tried && !understood ? <Meta tone="error">{t('tick')}</Meta> : null}
            <View style={{ flexDirection: 'row', gap: space.s1, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onPress={closeDel}>
                {t('notNow')}
              </Button>
              <Button
                variant="ink"
                onPress={() => {
                  setTried(true)
                  if (understood) {
                    setTried(false)
                    setDel('confirm')
                  }
                }}
              >
                {tc('continue')}
              </Button>
            </View>
          </>
        ) : del === 'confirm' ? (
          <>
            <Field label={t('typeErase')} value={typed} onChangeText={setTyped} autoCapitalize="characters" autoCorrect={false} error={tried && typed !== 'ERASE' ? t('typeCaps') : null} />
            <View style={{ flexDirection: 'row', gap: space.s1, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onPress={() => setDel('explain')}>
                {tc('back')}
              </Button>
              <Button
                variant="ink"
                onPress={() => {
                  setTried(true)
                  if (typed === 'ERASE') {
                    setTried(false)
                    setDel('auth')
                  }
                }}
              >
                {tc('continue')}
              </Button>
            </View>
          </>
        ) : (
          <>
            <View style={{ alignItems: 'center', gap: space.s1 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="key" size={28} color={c.ink} />
              </View>
              <Body weight="medium">{t('confirmYou')}</Body>
              <Meta align="center">{t('stepUp')}</Meta>
            </View>
            <View style={{ flexDirection: 'row', gap: space.s1, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onPress={closeDel}>
                {tc('cancel')}
              </Button>
              <Button
                variant="ink"
                icon="key"
                onPress={() => {
                  setScheduled(true)
                  closeDel()
                }}
              >
                {t('usePasskey')}
              </Button>
            </View>
          </>
        )}
      </Sheet>

      <Sheet
        open={askOpen}
        onClose={() => setAskOpen(false)}
        title={askSent ? t('sent') : t('askEntry')}
        footer={
          askSent ? (
            <Button variant="secondary" block onPress={() => setAskOpen(false)}>
              {tc('close')}
            </Button>
          ) : (
            <Button variant="ink" block icon="send" onPress={sendAsk}>
              {t('sendDpo')}
            </Button>
          )
        }
      >
        {askSent ? (
          <>
            <Done>{t('sentDpo')}</Done>
            <Meta>{(() => { const en = all.find((e) => e.id === askEntry); return t('about', { who: en ? aWho(en) : '', at: en?.at ?? '' }) })()}</Meta>
          </>
        ) : (
          <>
            <Meta>{t('dpoBody')}</Meta>
            <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={t('entryL')}>
              {all.map((e) => (
                <ChoiceCard
                  key={e.id}
                  selected={askEntry === e.id}
                  onPress={() => { setAskEntry(e.id); setAskErr((x) => ({ ...x, entry: undefined })) }}
                  accessibilityLabel={`${aWho(e)}, ${role_(e.role)}, ${e.at}: ${aWhat(e)}`}
                  title={`${aWho(e)} · ${role_(e.role)}`}
                  sub={<Meta size={14}>{`${aWhat(e)} · ${e.at}`}</Meta>}
                />
              ))}
            </View>
            {askErr.entry ? <Meta tone="error">{askErr.entry}</Meta> : null}
            <Field label={t('yourQ')} value={askText} onChangeText={(v) => { setAskText(v); if (askErr.text) setAskErr((x) => ({ ...x, text: undefined })) }} multiline maxLength={600} placeholder={t('qPh')} error={askErr.text} />
          </>
        )}
      </Sheet>

      <Sheet open={!!toast} onClose={() => setToast(null)} title={t('recorded')} footer={<Button variant="secondary" block onPress={() => setToast(null)}>{tc('close')}</Button>}>
        <Body>{toast}</Body>
      </Sheet>
    </Screen>
  )
}
