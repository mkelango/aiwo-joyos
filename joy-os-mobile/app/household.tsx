import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import {
  ArrowLink,
  Avatar,
  BandLabel,
  Body,
  Button,
  Card,
  DaybreakButton,
  Divider,
  Eyebrow,
  Icon,
  Meta,
  MethodLine,
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
  TermDot,
  Title,
  Toggle,
  fmtDate,
} from '@/components'
import { HOUSEHOLD, INDEX_HISTORY, MEMBER } from '@/shared/member'
import { CASELOAD } from '@/shared/platform'
import { TERMS } from '@/shared/terms'
import type { Band, TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { COUPLES_CHECK, HOUSEHOLD_MINOR, KAVYA_SHARED, SPECIMEN_NOW, type Grant, type GrantScope } from '@/screens/b/accountData'
import { PLANS } from '@/screens/b/_data'
import { accountStore, refCode, useStore } from '@/screens/b/bStore'
import { ChoiceCard, Done, Field, KeyValue, shareOrCopy, useSheetCrisisGuard, memberOnly } from '@/screens/b/parts'
import { useDict, useLang, useTermText } from '@/lib/i18n'
import { HOUSE, THEME_TEXT } from '@/screens/b/i18n/household'
import { RELATION_TEXT } from '@/screens/b/i18n/account'
import { BAND, useCommon, useTx } from '@/screens/b/i18n/common'

// HOUSEHOLD (Memo p.19, "made for two, welcoming to one"): partners scored separately,
// elder mode with a helper by the elder's consent, minors never scored, share grants both
// partners must agree to, and a household page that shows only what both share.
// Couples Check: agree / differ, never who said what. One Daybreak: "Propose a share".

const bandFor = (v: number): Band => (v >= 70 ? 'steady' : v >= 50 ? 'uneven' : 'thin')
/** Scope words, relation and age labels in the member's language. */
function useHouseText() {
  const t = useDict(HOUSE)
  const tt = useTermText()
  const tx = useTx()
  const lang = useLang()
  const AGE: Record<string, keyof typeof HOUSE> = { Adult: 'adult', 'Elder mode': 'elderMode', 'Under 18': 'under18' }
  return {
    scopeLabel: (s: GrantScope[]) => s.map((x) => (x === 'index' ? t('indexOnly') : tt.name(x))).join(' · '),
    relation: (r: string) => tx(RELATION_TEXT[r], r),
    age: (a: string) => (AGE[a] ? t(AGE[a]) : a),
    lower: (s: string) => (lang === 'en' ? s.toLowerCase() : s),
    band: (b: Band) => (b === 'not-yet-measured' ? b : tx(BAND[b], b)),
  }
}

export default memberOnly(Household)

function Household() {
  const { c, space } = useTheme()
  const [shareOpen, setShareOpen] = useState(false)
  const [revoke, setRevoke] = useState<Grant | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [helperOpen, setHelperOpen] = useState(false)
  const [acct, setAcct] = useStore(accountStore)
  // Share grants are kept with the account, so a proposal or revoke holds on return.
  const grants = acct.grants
  const setGrants = (fn: (gs: Grant[]) => Grant[]) => setAcct((a) => ({ ...a, grants: fn(a.grants) }))
  // iOS cannot present the toast Modal while another Sheet is still dismissing.
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])
  const toastAfterSheet = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(msg), 350)
  }
  const isPatron = acct.plan === 'Patron'
  const me = INDEX_HISTORY[0]
  const kavyaIndex = CASELOAD.find((x) => x.name === 'Kavya Rao')!.index
  const [arjun, kavya, lakshmi] = HOUSEHOLD
  const t = useDict(HOUSE)
  const tc = useCommon()
  const tt = useTermText()
  const tx = useTx()
  const ht = useHouseText()
  const scopeLabel = ht.scopeLabel

  const mutual = (s: GrantScope) =>
    grants.some((g) => g.from === 'Arjun' && g.state === 'active' && g.scope.includes(s)) && grants.some((g) => g.from === 'Kavya' && g.state === 'active' && g.scope.includes(s))
  const sharedTerms = TERMS.filter((t) => mutual(t.key))
  const unshared = TERMS.filter((term) => !sharedTerms.includes(term))
  const indexShared = mutual('index')
  const live = grants.filter((g) => g.state !== 'revoked')

  const members = [
    { person: arjun, role: t('roleYou'), detail: t('detailYou'), tags: [t('indexTag', { v: me.value }), PLANS.find((p) => p.key === acct.plan)?.name ?? t('plus')] },
    { person: kavya, role: t('rolePartner'), detail: t('detailPartner'), tags: [t('ownIndex'), t('ownConsents')] },
    { person: lakshmi, role: t('roleMother'), detail: t('detailMother'), tags: [t('elderMode'), t('helperArjun')] },
    { person: HOUSEHOLD_MINOR, role: t('roleDaughter'), detail: t('detailDaughter'), tags: [t('notScored'), t('parentalConsent')] },
  ]

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={MEMBER.household === HOUSE.householdName.en ? t('householdName') : MEMBER.household}
        title={
          <>
            {t('titleA')}<Serif>{t('titleSerif')}</Serif>{t('titleB')}
          </>
        }
        lead={t('lead')}
      />

      {/* Members */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>{t('whoHere')}</SectionTitle>
          <SpecimenTag />
        </View>
        {members.map((m) => (
          <Card key={m.person.id} tone="raised" style={{ gap: space.s1 + 4 }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Avatar person={m.person} size={48} />
              <View style={{ flex: 1 }}>
                <Body weight="medium">{m.person.name}</Body>
                <Meta size={14}>{m.role}</Meta>
              </View>
            </View>
            <Meta>{m.detail}</Meta>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {(m.person.id === lakshmi.id ? [acct.elder.largeType || acct.elder.voice ? t('elderMode') : t('standardMode'), acct.elder.helper ? t('helperArjun') : t('noHelper')] : m.tags).map((tag) => (
                <Pill key={tag}>{tag}</Pill>
              ))}
            </View>
            {m.person.id === lakshmi.id ? (
              <Button variant="secondary" size="sm" icon="sliders" onPress={() => setHelperOpen(true)}>
                {t('helperSettings')}
              </Button>
            ) : null}
          </Card>
        ))}
        {acct.invites.map((iv) => (
          <Card key={iv.id} tone="outline" style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <Body weight="medium">{iv.name}</Body>
              <Pill tone="daybreak">{t('invited')}</Pill>
            </View>
            <Meta size={14}>{t('inviteLine', { relation: ht.relation(iv.relation), age: ht.age(iv.age), date: fmtDate(iv.expires) })}</Meta>
            <Button variant="link" onPress={() => setAcct((a) => ({ ...a, invites: a.invites.filter((x) => x.id !== iv.id) }))}>
              {t('cancelInvite')}
            </Button>
          </Card>
        ))}
        <Button variant="secondary" icon="user-plus" onPress={() => setInviteOpen(true)}>
          {t('invite')}
        </Button>
      </View>

      {/* Household page */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('page')}</SectionTitle>
        <Title size={24}>
          {t('bothA')}<Serif>{t('bothSerif')}</Serif>{t('bothB')}
        </Title>
        <Body tone="ink2">{t('bothBody')}</Body>
        <Card tone="raised" style={{ gap: space.s2 }}>
          {[
            { p: arjun, value: me.value, of: (k: TermKey) => me.terms.find((t) => t.key === k)!.value as number },
            { p: kavya, value: kavyaIndex, of: (k: TermKey) => KAVYA_SHARED[k] },
          ].map(({ p, value, of }, i) => (
            <View key={p.id} style={{ gap: space.s1 + 4 }}>
              {i > 0 ? <Divider /> : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar person={p} size={36} />
                <Body weight="medium" style={{ flex: 1 }}>
                  {p.name.split(' ')[0]}
                </Body>
                {indexShared ? (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }} accessible accessibilityLabel={t('idxA11y', { name: p.name.split(' ')[0], v: value, band: ht.band(bandFor(value)) })}>
                    <Numeral size={40}>{String(value)}</Numeral>
                    <BandLabel band={bandFor(value)} style={{ paddingBottom: 6 }} />
                  </View>
                ) : (
                  <Meta>{t('notShared')}</Meta>
                )}
              </View>
              {sharedTerms.map((term) => (
                <View key={term.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} accessible accessibilityLabel={`${tt.name(term.key)} ${term.key === 'B' ? t('minus') : ''}${of(term.key)}`}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TermDot term={term.key} />
                    <Meta tone="ink">{tt.name(term.key)}</Meta>
                  </View>
                  <Mono tone="ink">{term.key === 'B' ? `−${of(term.key)}` : String(of(term.key))}</Mono>
                </View>
              ))}
            </View>
          ))}
          <MethodLine method={me.method} grade={me.grade} takenOn={me.takenOn} next={me.nextMeasure} />
          {unshared.length > 0 ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Icon name="lock" size={13} color={c.ink3} />
              <Meta size={14} tone="ink3" style={{ flex: 1 }}>
                {t('notShown', { list: unshared.map((term) => tt.space(term.key)).join(', ') })}
              </Meta>
            </View>
          ) : null}
        </Card>
      </View>

      {/* Grants */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('byAgreement')}</SectionTitle>
        <Body tone="ink2">{t('grantBody')}</Body>
        <Card tone="raised" style={{ gap: 0 }}>
          {live.map((g, i) => (
            <View key={g.id} style={{ paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.line, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Body weight="medium">{`${g.from} → ${g.to}`}</Body>
                <Pill tone={g.state === 'waiting' ? 'daybreak' : 'neutral'}>{g.state === 'waiting' ? t('waitingKavya') : t('activeG')}</Pill>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {g.scope.map((s) => (s === 'index' ? <Meta key={s} tone="ink">{t('indexOnly')}</Meta> : <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><TermDot term={s} /><Meta tone="ink">{tt.name(s)}</Meta></View>))}
                <Meta size={13} tone="ink3">
                  {t('since')}<Mono size={13} tone="ink3">{fmtDate(g.since)}</Mono>
                </Meta>
              </View>
              {g.from === 'Arjun' ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
                  <Button size="sm" variant="ghost" onPress={() => setRevoke(g)}>
                    {g.state === 'waiting' ? t('withdraw') : t('revoke')}
                  </Button>
                  {g.state === 'waiting' ? (
                    <Button
                      size="sm"
                      variant="link"
                      onPress={() => {
                        setGrants((gs) => [...gs.map((x) => (x.id === g.id ? { ...x, state: 'active' as const } : x)), { id: `g${Date.now()}`, scope: g.scope, from: 'Kavya', to: 'Arjun', state: 'active', since: SPECIMEN_NOW }])
                        setToast(t('kavyaAgreed', { scope: scopeLabel(g.scope) }))
                      }}
                    >
                      {t('demoAgree')}
                    </Button>
                  ) : null}
                </View>
              ) : null}
            </View>
          ))}
        </Card>
        <DaybreakButton icon="share-2" onPress={() => setShareOpen(true)}>
          {t('propose')}
        </DaybreakButton>
        <Meta align="center">{t('askedPrivately')}</Meta>
      </View>

      {/* Couples Check */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('couples')}</SectionTitle>
        <Title size={24}>
          {t('agreeA')}<Serif>{t('agreeSerif')}</Serif>{t('agreeB')}
        </Title>
        <Card tone="raised" style={{ gap: space.s1 + 4 }}>
          <Body tone="ink2">{t('privately', { date: fmtDate(COUPLES_CHECK.takenOn) })}</Body>
          <Body>
            {t('agreeOnA')}<Mono tone="ink" size={17}>{String(COUPLES_CHECK.themes.filter((x) => x.agree).length)}</Mono>{t('agreeOnB')}<Mono tone="ink" size={17}>{String(COUPLES_CHECK.themes.length)}</Mono>{t('agreeOnC')}
          </Body>
          <View accessibilityRole="list">
            {COUPLES_CHECK.themes.map((th) => (
              <View key={th.theme} accessible accessibilityLabel={`${tx(THEME_TEXT[th.theme], th.theme)}: ${th.agree ? t('youAgree') : t('youDiffer')}`} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.line }}>
                <Meta tone="ink" style={{ flex: 1 }}>
                  {tx(THEME_TEXT[th.theme], th.theme)}
                </Meta>
                <Eyebrow tone={th.agree ? 'ink3' : 'ink'}>{th.agree ? t('agreeTag') : t('differTag')}</Eyebrow>
              </View>
            ))}
          </View>
          <Meta size={13} tone="ink3">{`${tx(HOUSE.instrument, COUPLES_CHECK.instrument)}${t('csi')}`}</Meta>
          <ArrowLink onPress={() => router.push('/spaces/people')}>{t('planState')}</ArrowLink>
        </Card>
      </View>

      {/* Charter */}
      <Card tone="sunk" style={{ gap: space.s1 + 4 }}>
        <Eyebrow>{isPatron ? t('patronIn') : t('patronSoon')}</Eyebrow>
        <Title size={22}>{t('charter')}</Title>
        <Body tone="ink2">{t('charterBody')}</Body>
        {[t('c1'), t('c2'), t('c3')].map((x) => (
          <View key={x} style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="check" size={15} color={c.ink2} />
            <Meta style={{ flex: 1 }}>{x}</Meta>
          </View>
        ))}
        <ArrowLink onPress={() => router.push('/membership')}>{isPatron ? t('seeMembership') : t('seePatron')}</ArrowLink>
      </Card>

      <InviteSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={(iv) => setAcct((a) => ({ ...a, invites: [...a.invites, iv] }))}
      />

      <Sheet open={helperOpen} onClose={() => setHelperOpen(false)} title={t('lakshmiSettings')} footer={<Button variant="secondary" block onPress={() => setHelperOpen(false)}>{tc('done')}</Button>}>
        <Meta>{t('lakshmiBody')}</Meta>
        <Toggle checked={acct.elder.largeType} onChange={(v) => setAcct((a) => ({ ...a, elder: { ...a.elder, largeType: v } }))} label={t('larger')} description={t('largerD')} />
        <Toggle checked={acct.elder.voice} onChange={(v) => setAcct((a) => ({ ...a, elder: { ...a.elder, voice: v } }))} label={t('voice')} description={t('voiceD')} />
        <Divider />
        <Eyebrow>{t('helperConsent')}</Eyebrow>
        {acct.elder.helper ? (
          <>
            <Body>{t('helperBody')}</Body>
            <Button variant="secondary" icon="user-x" onPress={() => setAcct((a) => ({ ...a, elder: { ...a.elder, helper: false } }))}>
              {t('stepBack')}
            </Button>
          </>
        ) : (
          <>
            <Done>{t('noLonger')}</Done>
            <Button variant="link" onPress={() => setAcct((a) => ({ ...a, elder: { ...a.elder, helper: true } }))}>
              {t('askAgain')}
            </Button>
          </>
        )}
      </Sheet>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onPropose={(scope) => {
          setGrants((gs) => [...gs, { id: `g${Date.now()}`, scope, from: 'Arjun', to: 'Kavya', state: 'waiting', since: SPECIMEN_NOW }])
          setShareOpen(false)
          toastAfterSheet(t('proposed', { scope: scopeLabel(scope) }))
        }}
      />

      <Sheet
        open={!!revoke}
        onClose={() => setRevoke(null)}
        title={revoke?.state === 'waiting' ? t('withdrawQ') : t('revokeQ')}
        footer={
          <View style={{ flexDirection: 'row', gap: space.s1, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onPress={() => setRevoke(null)}>
              {tc('keepIt')}
            </Button>
            <Button
              variant="ink"
              icon="rotate-ccw"
              onPress={() => {
                if (revoke) {
                  setGrants((gs) => gs.map((x) => (x.id === revoke.id ? { ...x, state: 'revoked' as const } : x)))
                  setRevoke(null)
                  toastAfterSheet(t('doneUpdated'))
                } else setRevoke(null)
              }}
            >
              {revoke?.state === 'waiting' ? t('withdraw') : t('revoke')}
            </Button>
          </View>
        }
      >
        <Body>
          {revoke
            ? revoke.state === 'waiting'
              ? t('noLongerAsked', { scope: scopeLabel(revoke.scope) })
              : t('disappears', { scope: scopeLabel(revoke.scope) })
            : ''}
        </Body>
      </Sheet>

      <Sheet open={!!toast} onClose={() => setToast(null)} title={tc('done')} footer={<Button variant="secondary" block onPress={() => setToast(null)}>{tc('close')}</Button>}>
        <Body>{toast}</Body>
      </Sheet>
    </Screen>
  )
}

function ShareSheet({ open, onClose, onPropose }: { open: boolean; onClose: () => void; onPropose: (s: GrantScope[]) => void }) {
  const { space } = useTheme()
  const [mode, setMode] = useState<'index' | 'terms'>('terms')
  const [terms, setTerms] = useState<GrantScope[]>(['P'])
  const [error, setError] = useState<string | null>(null)
  const me = INDEX_HISTORY[0]
  const scope: GrantScope[] = mode === 'index' ? ['index'] : terms
  const t = useDict(HOUSE)
  const tt = useTermText()
  const toggle = (k: GrantScope) => {
    setError(null)
    setTerms((t) => (t.includes(k) ? t.filter((x) => x !== k) : [...t, k]))
  }
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('proposeTitle')}
      footer={
        <Button
          variant="ink"
          block
          onPress={() => {
            if (scope.length === 0) {
              setError(t('errTerm'))
              return
            }
            onPropose(scope)
          }}
        >
          {t('sendProposal')}
        </Button>
      }
    >
      <Meta tone="ink">{t('whatShare')}</Meta>
      <Segmented
        value={mode}
        onChange={(v) => {
          setMode(v)
          setError(null)
        }}
        items={[
          { value: 'index', label: t('indexOnly') },
          { value: 'terms', label: t('perTerm') },
        ]}
      />
      {mode === 'terms' ? (
        <View style={{ gap: space.s1 }}>
          {TERMS.map((term) => (
            <ChoiceCard
              key={term.key}
              kind="checkbox"
              selected={terms.includes(term.key)}
              onPress={() => toggle(term.key)}
              accessibilityLabel={tt.name(term.key)}
              leading={<TermDot term={term.key} />}
              title={<Body>{tt.name(term.key)}</Body>}
            />
          ))}
        </View>
      ) : null}
      {error ? <Meta tone="error">{error}</Meta> : null}
      <Card tone="sunk" padding={16} style={{ gap: 6 }}>
        <Eyebrow>{t('kavyaSees')}</Eyebrow>
        {scope.length === 0 ? (
          <Meta>{t('nothingYet')}</Meta>
        ) : (
          scope.map((s) => {
            const v = s === 'index' ? me.value : me.terms.find((t) => t.key === s)!.value
            return (
              <View key={s} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Meta tone="ink">{s === 'index' ? t('yourIndex') : tt.name(s)}</Meta>
                <Mono tone="ink">{s === 'B' ? `−${v}` : String(v)}</Mono>
              </View>
            )
          })
        )}
        <Meta size={13} tone="ink3">{t('scoresOnly')}</Meta>
      </Card>
      {[t('s1'), t('s2'), t('s3')].map((x, i) => (
        <View key={x} style={{ flexDirection: 'row', gap: 10 }}>
          <Mono tone="ink3">{String(i + 1)}</Mono>
          <Meta style={{ flex: 1 }}>{x}</Meta>
        </View>
      ))}
    </Sheet>
  )
}

type Invite = { id: string; name: string; relation: string; age: string; expires: string }
const RELATIONS = ['Partner', 'Parent', 'Child', 'Other'] as const
const AGES = [
  { value: 'adult', label: 'Adult' },
  { value: 'elder', label: 'Elder mode' },
  { value: 'minor', label: 'Under 18' },
] as const

function InviteSheet({ open, onClose, onInvite }: { open: boolean; onClose: () => void; onInvite: (iv: Invite) => void }) {
  const { space } = useTheme()
  const guard = useSheetCrisisGuard()
  const [name, setName] = useState('')
  const [relation, setRelation] = useState<(typeof RELATIONS)[number]>('Parent')
  const [age, setAge] = useState<(typeof AGES)[number]['value']>('adult')
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; consent?: string }>({})
  const [done, setDone] = useState<Invite | null>(null)
  const [shareState, setShareState] = useState<'shared' | 'copied' | 'failed' | null>(null)
  const t = useDict(HOUSE)
  const tc = useCommon()
  const ht = useHouseText()
  const relLabel = (r: string) => ht.relation(r)

  const reset = () => {
    setName('')
    setRelation('Parent')
    setAge('adult')
    setConsent(false)
    setErrors({})
    setDone(null)
    setShareState(null)
  }
  const close = () => {
    reset()
    onClose()
  }
  const submit = () => {
    if (!guard(name, close)) return
    const e: typeof errors = {}
    if (name.trim().length < 2) e.name = t('errName')
    if (age === 'minor' && !consent) e.consent = t('errConsent')
    setErrors(e)
    if (Object.keys(e).length) return
    const expires = new Date(Date.parse(SPECIMEN_NOW) + 7 * 86400000).toISOString().slice(0, 10)
    const iv: Invite = { id: refCode('INV'), name: name.trim(), relation, age: AGES.find((a) => a.value === age)!.label, expires }
    onInvite(iv)
    setDone(iv)
  }
  const link = done ? `https://joy.aiwo.in/join/${done.id.toLowerCase()}` : ''

  return (
    <Sheet
      open={open}
      onClose={close}
      title={done ? t('linkReady') : t('invite')}
      footer={
        done ? (
          <View style={{ gap: 8 }}>
            {shareState ? (
              <Meta tone="ink" align="center" accessibilityLiveRegion="polite">
                {shareState === 'copied' ? t('copiedLink') : shareState === 'shared' ? t('sharedLink') : t('cantShare')}
              </Meta>
            ) : null}
            <Button variant="ink" block icon="share" onPress={() => shareOrCopy(t('joinMsg', { link }), t('invitation')).then(setShareState)}>
              {t('shareLink')}
            </Button>
            <Button variant="secondary" block onPress={close}>
              {tc('done')}
            </Button>
          </View>
        ) : (
          <Button variant="ink" block icon="user-plus" onPress={submit}>
            {t('create')}
          </Button>
        )
      }
    >
      {done ? (
        <>
          <Done>{t('invitedAs', { name: done.name, relation: ht.lower(relLabel(done.relation)), age: ht.lower(ht.age(done.age)) })}</Done>
          <KeyValue k={t('link')}>
            <Mono tone="ink" size={14}>{link}</Mono>
          </KeyValue>
          <KeyValue k={t('expires')} last>
            <Mono tone="ink">{fmtDate(done.expires)}</Mono>
          </KeyValue>
          <Meta>{t('ownConsentsJoin')}</Meta>
        </>
      ) : (
        <>
          <Field label={tc('name')} value={name} onChangeText={(v) => { setName(v); if (errors.name) setErrors((x) => ({ ...x, name: undefined })) }} placeholder={t('namePh')} error={errors.name} />
          <Eyebrow>{t('relationship')}</Eyebrow>
          <Segmented<(typeof RELATIONS)[number]> value={relation} onChange={setRelation} items={RELATIONS.map((r) => ({ value: r, label: relLabel(r) }))} style={{ flexWrap: 'wrap' }} />
          <Eyebrow>{t('age')}</Eyebrow>
          <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel={t('ageBand')}>
            {AGES.map((a) => (
              <ChoiceCard
                key={a.value}
                selected={age === a.value}
                onPress={() => { setAge(a.value); setErrors((x) => ({ ...x, consent: undefined })) }}
                accessibilityLabel={ht.age(a.label)}
                title={ht.age(a.label)}
                sub={a.value === 'adult' ? t('subAdult') : a.value === 'elder' ? t('subElder') : t('subMinor')}
              />
            ))}
          </View>
          {age === 'minor' ? (
            <ChoiceCard
              kind="checkbox"
              selected={consent}
              onPress={() => { setConsent((v) => !v); setErrors((x) => ({ ...x, consent: undefined })) }}
              accessibilityLabel={t('guardian')}
              title={t('guardian')}
              sub={t('dpdp')}
            />
          ) : null}
          {errors.consent ? (
            <Meta tone="error" accessibilityLiveRegion="polite">
              {errors.consent}
            </Meta>
          ) : null}
        </>
      )}
    </Sheet>
  )
}
