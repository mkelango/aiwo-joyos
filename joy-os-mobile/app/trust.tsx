import { useEffect, useMemo, useState } from 'react'
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
import { ChoiceCard, Done, Field, FilterChips, TimelineStep, useSheetCrisisGuard, memberOnly } from '@/screens/b/parts'

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

  // Access log
  const all = useMemo<AccessEvent[]>(() => [...ACCESS_LOG, ...EXTRA_ACCESS].sort((a, b) => b.at.localeCompare(a.at)), [])
  const roles = useMemo(() => Array.from(new Set(all.map((e) => e.role))), [all])
  const [role, setRole] = useState('all')
  const [showAll, setShowAll] = useState(false)
  const rows = all.filter((e) => role === 'all' || e.role === role)
  const visible = showAll ? rows : rows.slice(0, 4)
  const people = new Set(all.filter((e) => e.role !== 'System').map((e) => e.who)).size

  // Consents
  const [consent, setConsent] = useState<Record<string, { on: boolean; changed?: boolean }>>(() => Object.fromEntries(CONSENTS.map((x) => [x.id, { on: x.granted }])))
  const [confirm, setConfirm] = useState<Consent | null>(null)
  const applyConsent = (x: Consent, v: boolean) => {
    setConsent((s) => ({ ...s, [x.id]: { on: v, changed: true } }))
    setToast(`${x.name} ${v ? 'turned on' : 'withdrawn'}. Takes effect everywhere within 24 hours.`)
  }
  const granted = Object.values(consent).filter((x) => x.on).length
  const groups = (['core', 'cohort', 'device', 'calendar', 'whatsapp', 'partner'] as const).map((g) => ({ g, items: CONSENTS.filter((x) => x.scope === g) })).filter((x) => x.items.length)

  // Export
  const [format, setFormat] = useState<'fhir' | 'json'>('fhir')
  const [exp, setExp] = useState<ExportStatus>('idle')
  const steps: { key: ExportStatus; label: string }[] = [
    { key: 'requested', label: 'Requested' },
    { key: 'preparing', label: 'Preparing your copy' },
    { key: 'ready', label: 'Ready to download' },
  ]
  const expIdx = steps.findIndex((s) => s.key === exp)
  const [shared, setShared] = useState(false)
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
      .catch(() => setShared(true))
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
    if (!askEntry) e.entry = 'Choose the entry you are asking about.'
    if (askText.trim().length < 5) e.text = 'Tell us what you would like to know.'
    setAskErr(e)
    if (Object.keys(e).length) return
    setAskSent(true)
  }

  // Delete
  const [del, setDel] = useState<DeleteStep>('closed')
  const [understood, setUnderstood] = useState(false)
  const [typed, setTyped] = useState('')
  const [tried, setTried] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const closeDel = () => {
    setDel('closed')
    setTyped('')
    setUnderstood(false)
    setTried(false)
  }

  // Research
  const [research, setResearch] = useState(true)

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow="Trust centre · one tap from your Index"
        title={
          <>
            Your data is <Serif>yours</Serif>.
          </>
        }
        lead="See who has looked at it and why, change what you have agreed to, take a copy, or ask us to erase it. Every change is logged, including ours."
      />

      {/* Summary */}
      <View style={{ flexDirection: 'row', gap: space.s1 + 4 }}>
        {(
          [
            ['eye', 'People who looked', String(people), 'in the last 30 days'],
            ['check-square', 'Consents given', `${granted}/${CONSENTS.length}`, 'each by purpose'],
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
          <SectionTitle>Who has seen my data</SectionTitle>
          <SpecimenTag />
        </View>
        <Title size={24}>Every look, with a name and a reason.</Title>
        <Body tone="ink2">Coaches, clinicians, concierges, venues, the Index engine and the Science Office all leave a line here. Nobody reads your record without one.</Body>
        <FilterChips label="Filter by who looked" value={role} onChange={(v) => setRole(v)} items={[{ value: 'all', label: 'Everyone' }, ...roles.map((r) => ({ value: r, label: r }))]} />
        <Card tone="raised" style={{ gap: 0 }}>
          <Meta size={14} tone="ink3" accessibilityLiveRegion="polite">
            {`${rows.length} ${rows.length === 1 ? 'entry' : 'entries'} · newest first`}
          </Meta>
          {visible.map((e) => (
            <View key={e.id} accessible accessibilityLabel={`${e.at}. ${e.who}, ${e.role}, saw ${e.what}. Purpose: ${e.purpose}.`} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.line, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
                <Body weight="medium">{e.who}</Body>
                <Eyebrow tone="ink2">{e.role}</Eyebrow>
              </View>
              <Meta tone="ink">{e.what}</Meta>
              <Meta size={14}>{e.purpose}</Meta>
              <Mono size={12} tone="ink3">
                {e.at}
              </Mono>
            </View>
          ))}
          {rows.length > 4 ? (
            <Button variant="link" onPress={() => setShowAll((s) => !s)}>
              {showAll ? 'Show fewer' : `Show all ${rows.length}`}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" icon="help-circle" onPress={() => openAsk()} style={{ marginTop: space.s1 }}>
            Ask about an entry
          </Button>
        </Card>
      </View>

      {/* Consents */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Consents by purpose</SectionTitle>
        <Title size={24}>
          Agree to each purpose <Serif>separately</Serif>.
        </Title>
        <Body tone="ink2">Care, Data and Publishing are three different consents, and every device, calendar and partner has its own. A change takes effect everywhere within 24 hours.</Body>
        <Card tone="raised" style={{ gap: space.s2 }}>
          {groups.map(({ g, items }, gi) => (
            <View key={g} style={{ gap: space.s2 }}>
              {gi > 0 ? <Divider /> : null}
              <Eyebrow>{SCOPE_LABEL[g]}</Eyebrow>
              {items.map((x) => {
                const s = consent[x.id]
                return (
                  <Toggle
                    key={x.id}
                    checked={s.on}
                    onChange={(v) => (!v && (x.scope === 'core' || x.scope === 'cohort') ? setConfirm(x) : applyConsent(x, v))}
                    label={x.name}
                    description={`${x.purpose}. ${s.changed ? 'Change recorded · in effect everywhere within 24 h.' : s.on && x.since ? `Given ${fmtDate(x.since)}.` : 'Not given.'}`}
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
          <Eyebrow>Export</Eyebrow>
        </View>
        <Title size={24}>Take a full copy, in an open format.</Title>
        <Body tone="ink2">Index history with methods, answers, signals, Ledger, messages and your clinical record. Ready within 72 hours; the link lasts 7 days.</Body>
        <Segmented
          value={format}
          onChange={setFormat}
          items={[
            { value: 'fhir', label: 'FHIR R4 bundle' },
            { value: 'json', label: 'JSON' },
          ]}
        />
        <Meta>{format === 'fhir' ? 'For doctors, hospitals and ABDM: clinical systems read it directly.' : 'For you, or any app: every record with its method version.'}</Meta>
        {exp === 'idle' ? (
          <DaybreakButton icon="download" onPress={() => setExp('requested')}>
            Request export
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
            {shared ? <Done>{Platform.OS === 'web' ? 'Copy saved to your downloads. Keep it somewhere private.' : 'Copy handed to your share sheet. Keep it somewhere private.'}</Done> : null}
            <Meta>
              {exp === 'ready'
                ? `Your ${format === 'fhir' ? 'FHIR R4 bundle' : 'JSON file'} is ready · 2.6 MB · the link expires in 7 days.`
                : `Requested ${fmtDate('2027-01-28')} · ready by ${fmtDate('2027-01-31')} at the latest. We will tell you by email and in the app.`}
            </Meta>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
              {exp === 'ready' ? (
                <Button variant="ink" size="sm" icon={Platform.OS === 'web' ? 'download' : 'share'} onPress={shareCopy}>
                  {Platform.OS === 'web' ? 'Download copy (specimen)' : 'Share copy (specimen)'}
                </Button>
              ) : null}
              <Button variant="ghost" size="sm" onPress={() => { setExp('idle'); setShared(false) }}>
                {exp === 'ready' ? 'Done' : 'Cancel request'}
              </Button>
            </View>
          </View>
        )}
        <Divider />
        <Eyebrow>Earlier</Eyebrow>
        {EXPORTS_PAST.map((x) => (
          <Meta key={x.id} size={14}>
            <Mono size={14} tone="ink2">{fmtDate(x.requested)}</Mono> · {x.format} · <Mono size={14} tone="ink2">{x.size}</Mono> · {x.status}
          </Meta>
        ))}
      </Card>

      {/* Delete */}
      <Card tone="raised" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="trash-2" size={18} color={c.ink2} />
          <Eyebrow>Delete</Eyebrow>
        </View>
        <Title size={24}>Leave, and take your data with you.</Title>
        {['Withdrawing a consent is honoured everywhere within 24 hours.', 'Erasing your account removes your Joy OS record within 24 hours of confirmation.', 'Your clinical record is kept only as long as medical-records law requires, then erased.'].map((x) => (
          <View key={x} style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="check" size={15} color={c.ink2} />
            <Meta style={{ flex: 1 }}>{x}</Meta>
          </View>
        ))}
        {scheduled ? (
          <Card tone="sunk" padding={16} style={{ gap: space.s1 }}>
            <Body weight="medium" accessibilityLiveRegion="polite">
              Erasure scheduled · completes by <Mono tone="ink">29.01.2027 17:40</Mono>
            </Body>
            <Meta>You can still change your mind until then. A confirmation has gone to your email.</Meta>
            <Button variant="secondary" size="sm" onPress={() => setScheduled(false)}>
              Cancel erasure
            </Button>
          </Card>
        ) : (
          <Button variant="secondary" icon="trash-2" onPress={() => setDel('explain')}>
            Erase my account…
          </Button>
        )}
      </Card>

      {/* Research */}
      <Card tone="raised" style={{ gap: space.s1 }}>
        <Eyebrow>Research</Eyebrow>
        <Toggle
          checked={research}
          onChange={(v) => {
            setResearch(v)
            setToast(v ? 'Research consent given.' : 'Research consent withdrawn. Takes effect within 24 hours.')
          }}
          label="Help the Science Office validate the Index"
          description="Your de-identified six-term record joins the research registry for the v1.1 calibration. Separate from Publishing; leave any time."
        />
      </Card>

      {/* Aggregates */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Employers, insurers and partners</SectionTitle>
        <Title size={24}>
          They see the crowd, <Serif>never</Serif> you.
        </Title>
        {(
          [
            ['briefcase', 'Your employer sees aggregates only', `Only groups of ${TENANT.minCohort} or more, with no cell under ${TENANT.minCell}. No names, no drill-down, no individual answers. AIWO holds the data, not your employer.`],
            ['shield', 'Insurers, only if you say so', 'Star Health is not granted. If you agree, they receive cohort outcomes: never your Index, never a clinical result.'],
            ['lock', 'Venues get no health data', 'Hotels and Houses see your name, room and dietary note. Readings from Signal Points flow into your record, not theirs.'],
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
        <SectionTitle>The claims log</SectionTitle>
        <Body tone="ink2">Every claim we make passes the Science Office first. Refused and withdrawn claims stay on the record.</Body>
        <Card tone="raised" style={{ gap: 0 }}>
          {CLAIMS_LOG.map((cl, i) => (
            <View key={cl.claim} style={{ gap: 4, paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.line }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s1 }}>
                <Body style={{ flex: 1 }}>{cl.claim}</Body>
                <Pill tone={cl.state === 'Approved' ? 'ink' : 'neutral'}>{cl.state}</Pill>
              </View>
              <Meta size={14}>{cl.note}</Meta>
              <Meta size={13} tone="ink3">
                {cl.by} · <Mono size={13} tone="ink3">{fmtDate(cl.on)}</Mono>
              </Meta>
            </View>
          ))}
        </Card>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Icon name="map-pin" size={14} color={c.ink3} />
          <Meta size={14} tone="ink3" style={{ flex: 1 }}>
            Stored in India (Mumbai region) under the DPDP Act 2023. Encrypted at rest and in transit. Never sold.
          </Meta>
        </View>
      </View>

      {/* Withdraw a core consent */}
      <Sheet
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={`Withdraw ${confirm?.name ?? ''} consent?`}
        footer={
          <View style={{ flexDirection: 'row', gap: space.s1, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onPress={() => setConfirm(null)}>
              Keep it
            </Button>
            <Button
              variant="ink"
              onPress={() => {
                if (confirm) applyConsent(confirm, false)
                setConfirm(null)
              }}
            >
              Withdraw
            </Button>
          </View>
        }
      >
        <Body>
          {confirm?.id === 'c_care'
            ? 'Your coach, concierge and clinicians will stop seeing your record within 24 hours. Your Index and Ledger stay yours, but nobody will call when something drifts.'
            : confirm?.id === 'c_data'
              ? 'We will stop keeping new signals and answers within 24 hours. Your Index cannot be re-measured without it.'
              : 'You will be removed from future aggregate results within 24 hours. Results already published cannot be un-published, but contain no one’s identity.'}
        </Body>
        <Meta>You can give it again at any time.</Meta>
      </Sheet>

      {/* Erase flow */}
      <Sheet open={del !== 'closed'} onClose={closeDel} title="Erase your Joy OS account">
        {del === 'explain' ? (
          <>
            <Body>This erases your Index history, answers, Ledger, signals, messages and household shares. Kavya’s own record is not touched.</Body>
            <Meta>Take a copy first if you might want it. Exports are ready within 72 hours.</Meta>
            <ChoiceCard kind="checkbox" selected={understood} onPress={() => setUnderstood((u) => !u)} accessibilityLabel="I understand this cannot be undone after 24 hours." title={<Body>I understand this cannot be undone after 24 hours.</Body>} />
            {tried && !understood ? <Meta tone="error">Tick the box to continue.</Meta> : null}
            <View style={{ flexDirection: 'row', gap: space.s1, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onPress={closeDel}>
                Not now
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
                Continue
              </Button>
            </View>
          </>
        ) : del === 'confirm' ? (
          <>
            <Field label="Type ERASE to confirm" value={typed} onChangeText={setTyped} autoCapitalize="characters" autoCorrect={false} error={tried && typed !== 'ERASE' ? 'Type ERASE in capitals.' : null} />
            <View style={{ flexDirection: 'row', gap: space.s1, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onPress={() => setDel('explain')}>
                Back
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
                Continue
              </Button>
            </View>
          </>
        ) : (
          <>
            <View style={{ alignItems: 'center', gap: space.s1 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="key" size={28} color={c.ink} />
              </View>
              <Body weight="medium">Confirm it’s you</Body>
              <Meta align="center">A step-up check with your passkey: Face ID, Touch ID or your device PIN. Joy OS never sees it.</Meta>
            </View>
            <View style={{ flexDirection: 'row', gap: space.s1, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onPress={closeDel}>
                Cancel
              </Button>
              <Button
                variant="ink"
                icon="key"
                onPress={() => {
                  setScheduled(true)
                  closeDel()
                }}
              >
                Use passkey (specimen)
              </Button>
            </View>
          </>
        )}
      </Sheet>

      <Sheet
        open={askOpen}
        onClose={() => setAskOpen(false)}
        title={askSent ? 'Sent' : 'Ask about an entry'}
        footer={
          askSent ? (
            <Button variant="secondary" block onPress={() => setAskOpen(false)}>
              Close
            </Button>
          ) : (
            <Button variant="ink" block icon="send" onPress={sendAsk}>
              Send to the DPO
            </Button>
          )
        }
      >
        {askSent ? (
          <>
            <Done>Sent to the DPO · reply within 7 days.</Done>
            <Meta>{`About: ${all.find((e) => e.id === askEntry)?.who ?? ''} · ${all.find((e) => e.id === askEntry)?.at ?? ''}. A person writes back in Messages and by email.`}</Meta>
          </>
        ) : (
          <>
            <Meta>Our Data Protection Officer answers every question in person. Choose the entry, then ask.</Meta>
            <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel="Entry">
              {all.map((e) => (
                <ChoiceCard
                  key={e.id}
                  selected={askEntry === e.id}
                  onPress={() => { setAskEntry(e.id); setAskErr((x) => ({ ...x, entry: undefined })) }}
                  accessibilityLabel={`${e.who}, ${e.role}, ${e.at}: ${e.what}`}
                  title={`${e.who} · ${e.role}`}
                  sub={<Meta size={14}>{`${e.what} · ${e.at}`}</Meta>}
                />
              ))}
            </View>
            {askErr.entry ? <Meta tone="error">{askErr.entry}</Meta> : null}
            <Field label="Your question" value={askText} onChangeText={(v) => { setAskText(v); if (askErr.text) setAskErr((x) => ({ ...x, text: undefined })) }} multiline maxLength={600} placeholder="e.g. Why did the concierge need my household?" error={askErr.text} />
          </>
        )}
      </Sheet>

      <Sheet open={!!toast} onClose={() => setToast(null)} title="Recorded" footer={<Button variant="secondary" block onPress={() => setToast(null)}>Close</Button>}>
        <Body>{toast}</Body>
      </Sheet>
    </Screen>
  )
}
