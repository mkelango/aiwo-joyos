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
  EmptyIllustration,
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
import { HOUSEHOLD, MEMBER } from '@/shared/member'
import type { LatestIndex } from '@/lib/indexRecord'
import { CASELOAD } from '@/shared/platform'
import { TERMS } from '@/shared/terms'
import type { Band, TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { COUPLES_CHECK, HOUSEHOLD_MINOR, KAVYA_SHARED, SPECIMEN_NOW, type Grant, type GrantScope } from '@/screens/b/accountData'
import { PLANS } from '@/screens/b/_data'
import { accountStore, householdKindStore, refCode, useStore } from '@/screens/b/bStore'
import { useApp } from '@/lib/store'
import { useIsMinor } from '@/lib/minor'
import { CharterCard, FjoOffice, KindCard } from '@/screens/b/charter'
import { ChoiceCard, Done, Field, FigurePill, KeyValue, shareOrCopy, useAccount, useAccountIndex, useSheetCrisisGuard, memberOnly } from '@/screens/b/parts'
import { useDict, useLang, useTermText } from '@/lib/i18n'
import { HOUSE, THEME_TEXT } from '@/screens/b/i18n/household'
import { RELATION_TEXT } from '@/screens/b/i18n/account'
import { BAND, LEDGER_TAG, useCommon, useTx } from '@/screens/b/i18n/common'
import { MonoNums } from '@/lib/monoNums'

// HOUSEHOLD (Memo p.19, "made for two, welcoming to one"): partners scored separately,
// elder mode with a helper by the elder's consent, minors never scored, share grants both
// partners must agree to, and a household page that shows only what both share.
// Couples Check: agree / differ, never who said what. One Daybreak: "Propose a share".
// Household kind (couple | family | Family Joy Office, Arch p.13) and the Family Joy Charter the
// family writes and every adult agrees to: see src/screens/b/charter.tsx.
// The member's own numbers are their latest Index (a re-take on this phone included). The account
// made in onboarding has a household of its own: just them and anyone they invite.

const bandFor = (v: number): Band => (v >= 70 ? 'steady' : v >= 50 ? 'uneven' : 'thin')

/** A placeholder filled into translated copy, so the score can be set in Mono in its place. */
const SLOT = '\u0000'
/** The "Index 64" tag on a member's card: a Pill's shape, the number in Mono. */
function IndexTag({ v }: { v: number }) {
  const { c, radius } = useTheme()
  const t = useDict(HOUSE)
  const [a, b = ''] = t('indexTag', { v: SLOT }).split(SLOT)
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: c.paperSunk, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
      <Meta size={13} tone="ink2">
        {a}
        <Mono size={13} tone="ink2">{String(v)}</Mono>
        {b}
      </Meta>
    </View>
  )
}
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
  const [previewOpen, setPreviewOpen] = useState(false)
  const [lkWithdrawOpen, setLkWithdrawOpen] = useState(false)
  const [acct, setAcct] = useStore(accountStore)
  // Signed in as Lakshmi (M1), this is her household: her settings are hers to change.
  const account = useAccount()
  const asLakshmi = account.id === 'lakshmi'
  const asNew = account.id === 'new'
  // Under 18 nothing is scored (Architecture p26): no Index tag, no per-person Index, band or term value.
  const minor = useIsMinor()
  const { setTextSize } = useApp()
  const elder = acct.elder
  const helperSince = elder.helperSince ?? '2027-01-08'
  const setElder = (p: Partial<typeof elder>) => setAcct((a) => ({ ...a, elder: { ...a.elder, ...p } }))
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
  const [kindRec] = useStore(householdKindStore)
  // The signed-in member's latest Index: Arjun's always has one; a new member's only once taken.
  const me = useAccountIndex()
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

  const lakshmiDetail = elder.helper ? t('detailMother', { date: fmtDate(helperSince) }) : t('detailMotherNone')
  const ownPlan = PLANS.find((p) => p.key === acct.plan)?.name ?? t('plus')
  const members = asNew
    ? [{ person: { id: 'h_me', name: account.name, initials: account.name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase(), tone: arjun.tone }, role: t('roleYou'), detail: t('detailYou'), tags: [...(minor ? [t('notScored')] : []), ownPlan], index: minor || !me ? undefined : me.value }]
    : asLakshmi
    ? [
        { person: lakshmi, role: t('lkYou'), detail: t('lkDetailYou'), tags: [] as string[], index: me?.value },
        { person: arjun, role: elder.helper ? t('lkSonHelper') : t('lkSon'), detail: t('lkDetailOwn'), tags: [t('ownIndex'), t('ownConsents')] },
        { person: kavya, role: t('lkDaughterInLaw'), detail: t('lkDetailOwn'), tags: [t('ownIndex'), t('ownConsents')] },
        { person: HOUSEHOLD_MINOR, role: t('lkGranddaughter'), detail: t('lkDetailMinor'), tags: [t('notScored')] },
      ]
    : [
        { person: arjun, role: t('roleYou'), detail: t('detailYou'), tags: [...(minor ? [t('notScored')] : []), ownPlan], index: minor || !me ? undefined : me.value },
        { person: kavya, role: t('rolePartner'), detail: t('detailPartner'), tags: [t('ownIndex'), t('ownConsents')] },
        { person: lakshmi, role: t('roleMother'), detail: lakshmiDetail, tags: [t('elderMode'), t('helperArjun')] },
        { person: HOUSEHOLD_MINOR, role: t('roleDaughter'), detail: t('detailDaughter'), tags: [t('notScored'), t('parentalConsent')] },
      ]
  // Lakshmi's own large-type choice also sets this phone's text size.
  const setLargeType = (v: boolean) => {
    setElder({ largeType: v })
    if (asLakshmi) setTextSize(v ? 'large' : 'default')
  }

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={asNew ? t('yourHousehold') : MEMBER.household === HOUSE.householdName.en ? t('householdName') : MEMBER.household}
        title={
          <>
            {t('titleA')}<Serif>{t('titleSerif')}</Serif>{t('titleB')}
          </>
        }
        lead={t('lead')}
      />

      <KindCard people={asNew ? 1 + acct.invites.length : HOUSEHOLD.length + 1} onToast={toastAfterSheet} />

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
                <Meta size={14}><MonoNums text={m.role} /></Meta>
              </View>
            </View>
            <Meta><MonoNums text={m.detail} /></Meta>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {'index' in m && m.index != null ? <IndexTag v={m.index} /> : null}
              {(m.person.id === lakshmi.id ? [elder.largeType || elder.voice ? t('elderMode') : t('standardMode'), elder.helper ? t('helperArjun') : elder.asked ? t('elAskedPill') : t('noHelper')] : m.tags).map((tag) => (
                <FigurePill key={tag}>{tag}</FigurePill>
              ))}
            </View>
            {m.person.id === lakshmi.id ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
                <Button variant="secondary" size="sm" icon="sliders" onPress={() => setHelperOpen(true)}>
                  {asLakshmi ? t('lkSettings') : t('helperSettings')}
                </Button>
                {asLakshmi ? null : (
                  <Button variant="ghost" size="sm" icon="smartphone" onPress={() => setPreviewOpen(true)}>
                    {t('pvOpen')}
                  </Button>
                )}
              </View>
            ) : null}
          </Card>
        ))}
        {(asLakshmi ? [] : acct.invites).map((iv) => (
          <Card key={iv.id} tone="outline" style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <Body weight="medium">{iv.name}</Body>
              <Pill tone="daybreak">{t('invited')}</Pill>
            </View>
            <Meta size={14}><MonoNums text={t('inviteLine', { relation: ht.relation(iv.relation), age: ht.age(iv.age), date: fmtDate(iv.expires) })} /></Meta>
            <Button variant="link" onPress={() => setAcct((a) => ({ ...a, invites: a.invites.filter((x) => x.id !== iv.id) }))}>
              {t('cancelInvite')}
            </Button>
          </Card>
        ))}
        {asLakshmi ? null : (
          <Button variant="secondary" icon="user-plus" onPress={() => setInviteOpen(true)}>
            {t('invite')}
          </Button>
        )}
        {!me && !minor ? (
          <Card tone="sunk" style={{ gap: space.s1 }}>
            <Body>{t('noIndexYet')}</Body>
            <Meta>{t('noIndexEach')}</Meta>
            <ArrowLink onPress={() => router.push('/index-take')}>{t('takeIndex')}</ArrowLink>
          </Card>
        ) : null}
      </View>

      {kindRec.kind === 'fjo' && asNew ? (
        <FjoOffice adults={[{ name: account.name, status: 'open' }]} minor={null} onToast={setToast} />
      ) : kindRec.kind === 'fjo' ? (
        <FjoOffice
          adults={[
            { name: arjun.name, status: 'signed', on: '2027-01-24' },
            { name: kavya.name, status: 'booked', on: '2027-02-11' },
            { name: lakshmi.name, status: 'booked', on: '2027-02-12' },
          ]}
          minor={HOUSEHOLD_MINOR.name}
          onToast={setToast}
        />
      ) : null}

      {asNew ? (
        // Nobody else is here yet: the shared page, grants and the Couples Check need a second adult.
        <Card tone="sunk" style={{ gap: space.s1, alignItems: 'flex-start' }}>
          <EmptyIllustration kind="generic" />
          <Body>{t('newAlone')}</Body>
          <Meta>{t('newAloneBody')}</Meta>
        </Card>
      ) : asLakshmi || minor || !me ? (
        <Card tone="sunk" style={{ flexDirection: 'row', gap: 10 }}>
          <Icon name="lock" size={16} color={c.ink3} />
          <Meta style={{ flex: 1 }}><MonoNums text={asLakshmi ? t('lkCouple') : t('minorCouple')} /></Meta>
        </Card>
      ) : (
      <>
      {/* Household page */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('page')}</SectionTitle>
        <Title size={24}>
          {t('bothA')}<Serif>{t('bothSerif')}</Serif>{t('bothB')}
        </Title>
        <Body tone="ink2">{t('bothBody')}</Body>
        <Card tone="raised" style={{ gap: space.s2 }}>
          {[
            { p: arjun, value: me.value, of: (k: TermKey) => me.terms.find((t) => t.key === k)?.value ?? 0 },
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
          <Body tone="ink2"><MonoNums text={t('privately', { date: fmtDate(COUPLES_CHECK.takenOn) })} /></Body>
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

      </>
      )}

      {/* Charter: written by the adult signed in, agreed by every other adult in the household */}
      <CharterCard
        isPatron={isPatron}
        adults={asNew ? [account.firstName] : [arjun, kavya, lakshmi].map((p) => p.name.split(' ')[0])}
        writer={asNew ? account.firstName : asLakshmi ? lakshmi.name.split(' ')[0] : arjun.name.split(' ')[0]}
        minor={asNew ? null : HOUSEHOLD_MINOR.name.split(' ')[0]}
        onToast={toastAfterSheet}
      />

      <InviteSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={(iv) => setAcct((a) => ({ ...a, invites: [...a.invites, iv] }))}
      />

      <Sheet open={helperOpen} onClose={() => setHelperOpen(false)} title={asLakshmi ? t('lkSettings') : t('lakshmiSettings')} footer={<Button variant="secondary" block onPress={() => setHelperOpen(false)}>{tc('done')}</Button>}>
        <Meta>{asLakshmi ? t('lkSettingsBody') : t('lakshmiBody')}</Meta>
        {/* Her helper changes these only while he is her helper; she always can. */}
        <Toggle checked={elder.largeType} disabled={!asLakshmi && !elder.helper} onChange={setLargeType} label={t('larger')} description={asLakshmi ? `${t('largerD')} ${t('lkTextNote')}` : t('largerD')} />
        <Toggle checked={elder.voice} disabled={!asLakshmi && !elder.helper} onChange={(v) => setElder({ voice: v })} label={t('voice')} description={t('voiceD')} />
        {!asLakshmi && !elder.helper ? <Meta size={14} tone="ink3">{t('elHelperOnly')}</Meta> : null}
        <Divider />
        <Eyebrow>{t('helperConsent')}</Eyebrow>
        {asLakshmi ? (
          elder.helper ? (
            <>
              <Body><MonoNums text={t('lkHelperOn', { date: fmtDate(helperSince) })} /></Body>
              {lkWithdrawOpen ? (
                <Card tone="sunk" padding={16} style={{ gap: space.s1 }}>
                  <Body>{t('lkWithdrawQ')}</Body>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1, justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onPress={() => setLkWithdrawOpen(false)}>{tc('keepIt')}</Button>
                    <Button
                      variant="ink"
                      size="sm"
                      icon="rotate-ccw"
                      onPress={() => {
                        setElder({ helper: false, asked: false })
                        setLkWithdrawOpen(false)
                        setHelperOpen(false)
                        toastAfterSheet(t('lkWithdrawn'))
                      }}
                    >
                      {t('lkWithdrawYes')}
                    </Button>
                  </View>
                </Card>
              ) : (
                <Button variant="secondary" icon="user-x" onPress={() => setLkWithdrawOpen(true)}>
                  {t('lkWithdraw')}
                </Button>
              )}
            </>
          ) : elder.asked ? (
            <>
              <Body>{t('lkAsked')}</Body>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
                <Button variant="ink" size="sm" icon="check" onPress={() => { setElder({ helper: true, asked: false, helperSince: SPECIMEN_NOW }); setHelperOpen(false); toastAfterSheet(t('lkAgreed')) }}>
                  {t('lkAgree')}
                </Button>
                <Button variant="ghost" size="sm" onPress={() => setElder({ asked: false })}>
                  {t('lkNotNow')}
                </Button>
              </View>
            </>
          ) : (
            <Body>{t('lkNone')}</Body>
          )
        ) : elder.helper ? (
          <>
            <Body><MonoNums text={t('helperBody', { date: fmtDate(helperSince) })} /></Body>
            <Button variant="secondary" icon="user-x" onPress={() => setElder({ helper: false, asked: false })}>
              {t('stepBack')}
            </Button>
          </>
        ) : elder.asked ? (
          // Asking again goes through Lakshmi's own consent: nothing changes until she agrees.
          <View style={{ gap: space.s1 }} accessibilityLiveRegion="polite">
            <Pill tone="daybreak">{t('elAskedPill')}</Pill>
            <Body>{t('elAsked')}</Body>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s2 }}>
              <Button variant="link" onPress={() => { setElder({ helper: true, asked: false, helperSince: SPECIMEN_NOW }); setHelperOpen(false); toastAfterSheet(t('elAdded')) }}>
                {t('elAgreeDemo')}
              </Button>
              <Button variant="link" onPress={() => { setElder({ asked: false }); setHelperOpen(false); toastAfterSheet(t('elDeclined')) }}>
                {t('elDeclineDemo')}
              </Button>
              <Button variant="link" onPress={() => setElder({ asked: false })}>
                {t('elWithdrawAsk')}
              </Button>
            </View>
            <Meta size={14} tone="ink3">{t('elDemoNote')}</Meta>
          </View>
        ) : (
          <>
            <Done>{t('noLonger')}</Done>
            <Button variant="secondary" icon="send" onPress={() => setElder({ asked: true })}>
              {t('askAgain')}
            </Button>
          </>
        )}
        {asLakshmi ? null : (
          <Button variant="ghost" icon="smartphone" onPress={() => { setHelperOpen(false); setTimeout(() => setPreviewOpen(true), 350) }}>
            {t('pvOpen')}
          </Button>
        )}
      </Sheet>

      <ElderPreview open={previewOpen} onClose={() => setPreviewOpen(false)} elder={elder} />

      <ShareSheet
        me={me}
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

function ShareSheet({ me, open, onClose, onPropose }: { me: LatestIndex | null; open: boolean; onClose: () => void; onPropose: (s: GrantScope[]) => void }) {
  const { space } = useTheme()
  const [mode, setMode] = useState<'index' | 'terms'>('terms')
  const [terms, setTerms] = useState<GrantScope[]>(['P'])
  const [error, setError] = useState<string | null>(null)
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
            // The same latest numbers the household page shows (a re-take on this phone included).
            const v = !me ? null : s === 'index' ? me.value : me.terms.find((t) => t.key === s)?.value ?? null
            return (
              <View key={s} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Meta tone="ink">{s === 'index' ? t('yourIndex') : tt.name(s)}</Meta>
                <Mono tone="ink">{v == null ? '—' : s === 'B' ? `−${v}` : String(v)}</Mono>
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
              <MonoNums text={errors.consent} />
            </Meta>
          ) : null}
        </>
      )}
    </Sheet>
  )
}

const PREVIEW_TAGS = ['People', 'Food', 'Faith', 'Music']

/** Lakshmi's Today with her elder-mode settings: large type, voice first, one thing per screen. Nothing is kept. */
function ElderPreview({ open, onClose, elder }: { open: boolean; onClose: () => void; elder: { largeType: boolean; voice: boolean; helper: boolean } }) {
  const { c, space, radius } = useTheme()
  const t = useDict(HOUSE)
  const tc = useCommon()
  const tx = useTx()
  const [did, setDid] = useState(false)
  const [kept, setKept] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [spoken, setSpoken] = useState<string | null>(null)
  const [calling, setCalling] = useState(false)
  // Each opening starts fresh: nothing in the preview is kept.
  useEffect(() => {
    if (open) {
      setDid(false)
      setKept(null)
      setReading(false)
      setSpoken(null)
      setCalling(false)
    }
  }, [open])
  const big = elder.largeType
  const body = big ? 21 : 16
  const head = big ? 32 : 23
  const btnH = big ? 56 : 44
  const tag = (x: string) => tx(LEDGER_TAG[x], x)
  const PillBtn = ({ label, on, onPress, icon }: { label: string; on?: boolean; onPress: () => void; icon?: 'phone' | 'mic' | 'volume-2' }) => (
    <Button variant={on ? 'ink' : 'secondary'} icon={icon} onPress={onPress} accessibilityLabel={label} style={{ minHeight: btnH }}>
      {label}
    </Button>
  )
  return (
    <Sheet open={open} onClose={onClose} title={t('pvTitle')} footer={<Button variant="secondary" block onPress={onClose}>{tc('close')}</Button>}>
      <Meta>{t('pvNote')}</Meta>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Pill>{big ? t('pvLarge') : t('pvStandard')}</Pill>
        {elder.voice ? <Pill>{t('voice')}</Pill> : null}
        <Pill>{elder.helper ? t('helperArjun') : t('noHelper')}</Pill>
      </View>
      {/* The phone */}
      <View accessibilityLabel={t('pvTitle')} style={{ borderRadius: 36, borderWidth: 8, borderColor: c.inkGround, backgroundColor: c.paper, padding: space.s2 + 4, gap: space.s2, alignSelf: 'stretch' }}>
        <Body size={head} style={{ lineHeight: head * 1.15 }}>{t('pvGreeting')}</Body>
        {elder.voice ? (
          <View style={{ gap: 6 }}>
            <PillBtn label={t('pvHear')} icon="volume-2" on={reading} onPress={() => setReading((r) => !r)} />
            {reading ? <Meta size={Math.max(14, body - 4)} accessibilityLiveRegion="polite">{t('pvReading')}</Meta> : null}
          </View>
        ) : null}
        <View style={{ backgroundColor: c.paperSunk, borderRadius: radius.card, padding: 16, gap: 10 }}>
          <Eyebrow>{t('pvOneThing')}</Eyebrow>
          <Body size={body}>{t('pvAction')}</Body>
          {did ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }} accessibilityLiveRegion="polite">
              <Icon name="check" size={big ? 22 : 17} color={c.ink2} />
              <Body size={body} tone="ink2" style={{ flex: 1 }}>{t('pvThanks')}</Body>
            </View>
          ) : (
            <PillBtn label={t('pvDidIt')} on onPress={() => setDid(true)} />
          )}
        </View>
        <View style={{ gap: 8 }}>
          <Body size={body}>{t('pvLedgerQ')}</Body>
          {elder.voice ? <PillBtn label={t('pvSpeak')} icon="mic" onPress={() => setSpoken('Kavya made pongal for me')} /> : null}
          {spoken ? <Body size={body} tone="ink2" accessibilityLiveRegion="polite">{t('pvSpoken', { text: spoken })}</Body> : null}
          <View style={{ flexDirection: big ? 'column' : 'row', flexWrap: 'wrap', gap: 8 }}>
            {PREVIEW_TAGS.map((x) => (
              <PillBtn key={x} label={tag(x)} on={kept === x} onPress={() => setKept(x)} />
            ))}
          </View>
          {kept ? <Meta accessibilityLiveRegion="polite">{t('pvSaved', { tag: tag(kept) })}</Meta> : null}
        </View>
        <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: 16, gap: 8 }}>
          {elder.helper ? (
            <>
              <Body size={body}>{t('pvHelper')}</Body>
              <PillBtn label={t('pvCallHelper')} icon="phone" onPress={() => setCalling(true)} />
              {calling ? <Meta size={13} tone="ink3" accessibilityLiveRegion="polite">{t('pvCalling')}</Meta> : null}
            </>
          ) : (
            <Body size={body} tone="ink2">{t('pvNoHelper')}</Body>
          )}
        </View>
      </View>
      <Eyebrow style={{ textAlign: 'center' }}>{t('pvOnly')}</Eyebrow>
    </Sheet>
  )
}
