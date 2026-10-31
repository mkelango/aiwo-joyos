import { router } from 'expo-router'
import { useState } from 'react'
import { Share, View } from 'react-native'
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
import { TERMS, termByKey } from '@/shared/terms'
import type { Band, TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { COUPLES_CHECK, GRANTS, HOUSEHOLD_MINOR, KAVYA_SHARED, type Grant, type GrantScope } from '@/screens/b/accountData'
import { accountStore, refCode, useStore } from '@/screens/b/bStore'
import { ChoiceCard, Done, Field, KeyValue, useSheetCrisisGuard } from '@/screens/b/parts'

// HOUSEHOLD (Memo p.19, "made for two, welcoming to one"): partners scored separately,
// elder mode with a helper by the elder's consent, minors never scored, share grants both
// partners must agree to, and a household page that shows only what both share.
// Couples Check: agree / differ, never who said what. One Daybreak: "Propose a share".

const bandFor = (v: number): Band => (v >= 70 ? 'steady' : v >= 50 ? 'uneven' : 'thin')
const scopeLabel = (s: GrantScope[]) => s.map((x) => (x === 'index' ? 'Index only' : termByKey(x).name)).join(' · ')

export default function Household() {
  const { c, space } = useTheme()
  const [grants, setGrants] = useState<Grant[]>(GRANTS)
  const [shareOpen, setShareOpen] = useState(false)
  const [revoke, setRevoke] = useState<Grant | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [helperOpen, setHelperOpen] = useState(false)
  const [acct, setAcct] = useStore(accountStore)
  const me = INDEX_HISTORY[0]
  const kavyaIndex = CASELOAD.find((x) => x.name === 'Kavya Rao')!.index
  const [arjun, kavya, lakshmi] = HOUSEHOLD

  const mutual = (s: GrantScope) =>
    grants.some((g) => g.from === 'Arjun' && g.state === 'active' && g.scope.includes(s)) && grants.some((g) => g.from === 'Kavya' && g.state === 'active' && g.scope.includes(s))
  const sharedTerms = TERMS.filter((t) => mutual(t.key))
  const indexShared = mutual('index')
  const live = grants.filter((g) => g.state !== 'revoked')

  const members = [
    { person: arjun, role: 'You · adult', detail: 'Scored. Your answers and your Index are yours.', tags: [`Index ${me.value}`, 'Joy OS Plus'] },
    { person: kavya, role: 'Partner · adult', detail: 'Scored separately. Her answers are private to her; she chooses what to share with you.', tags: ['Own Index', 'Own consents'] },
    { person: lakshmi, role: 'Mother · elder mode', detail: 'Large type, voice-first. You help her as a family helper, by her consent given on 8 Jan 2027, which she can withdraw.', tags: ['Elder mode', 'Helper: Arjun'] },
    { person: HOUSEHOLD_MINOR, role: 'Daughter · 15 · minor', detail: 'Never scored. Joins household rituals only. Parental consent given by Kavya on 12 Jan 2027 (DPDP Act); no tracking, no profiling, no advertising.', tags: ['Not scored', 'Parental consent'] },
  ]

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow={MEMBER.household}
        title={
          <>
            Made for two, <Serif>welcoming</Serif> to one.
          </>
        }
        lead="Each person keeps their own Index. The household page shows only what both of you have agreed to share, and either of you can take it back."
      />

      {/* Members */}
      <View style={{ gap: space.s2 }}>
        <View style={{ gap: 8 }}>
          <SectionTitle>Who is here</SectionTitle>
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
              {(m.person.id === lakshmi.id ? [acct.elder.largeType || acct.elder.voice ? 'Elder mode' : 'Standard mode', acct.elder.helper ? 'Helper: Arjun' : 'No helper'] : m.tags).map((t) => (
                <Pill key={t}>{t}</Pill>
              ))}
            </View>
            {m.person.id === lakshmi.id ? (
              <Button variant="secondary" size="sm" icon="sliders" onPress={() => setHelperOpen(true)}>
                Helper settings
              </Button>
            ) : null}
          </Card>
        ))}
        {acct.invites.map((iv) => (
          <Card key={iv.id} tone="outline" style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <Body weight="medium">{iv.name}</Body>
              <Pill tone="daybreak">Invited</Pill>
            </View>
            <Meta size={14}>{`${iv.relation} · ${iv.age} · link expires ${fmtDate(iv.expires)}`}</Meta>
            <Button variant="link" onPress={() => setAcct((a) => ({ ...a, invites: a.invites.filter((x) => x.id !== iv.id) }))}>
              Cancel invitation
            </Button>
          </Card>
        ))}
        <Button variant="secondary" icon="user-plus" onPress={() => setInviteOpen(true)}>
          Invite to household
        </Button>
      </View>

      {/* Household page */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>The household page</SectionTitle>
        <Title size={24}>
          Only what you <Serif>both</Serif> share.
        </Title>
        <Body tone="ink2">If one of you has not agreed, nothing appears, not even a blank. This is what both of you see.</Body>
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
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }} accessible accessibilityLabel={`${p.name.split(' ')[0]}'s Joyspan Index ${value}, ${bandFor(value)}`}>
                    <Numeral size={40}>{String(value)}</Numeral>
                    <BandLabel band={bandFor(value)} style={{ paddingBottom: 6 }} />
                  </View>
                ) : (
                  <Meta>Index not shared.</Meta>
                )}
              </View>
              {sharedTerms.map((t) => (
                <View key={t.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} accessible accessibilityLabel={`${t.name} ${t.key === 'B' ? 'minus ' : ''}${of(t.key)}`}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TermDot term={t.key} />
                    <Meta tone="ink">{t.name}</Meta>
                  </View>
                  <Mono tone="ink">{t.key === 'B' ? `−${of(t.key)}` : String(of(t.key))}</Mono>
                </View>
              ))}
            </View>
          ))}
          <MethodLine method={me.method} grade={me.grade} takenOn={me.takenOn} next={me.nextMeasure} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Icon name="lock" size={13} color={c.ink3} />
            <Meta size={14} tone="ink3" style={{ flex: 1 }}>
              {`${TERMS.filter((t) => !sharedTerms.includes(t))
                .map((t) => t.space)
                .join(', ')} are not shown: not shared by both.`}
            </Meta>
          </View>
        </Card>
      </View>

      {/* Grants */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Sharing by agreement</SectionTitle>
        <Body tone="ink2">A share is a grant from one person to another, with a scope. It shows on the household page only when both of you have granted the same thing.</Body>
        <Card tone="raised" style={{ gap: 0 }}>
          {live.map((g, i) => (
            <View key={g.id} style={{ paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: c.line, gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Body weight="medium">{`${g.from} → ${g.to}`}</Body>
                <Pill tone={g.state === 'waiting' ? 'daybreak' : 'neutral'}>{g.state === 'waiting' ? 'Waiting for Kavya' : 'Active'}</Pill>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {g.scope.map((s) => (s === 'index' ? <Meta key={s} tone="ink">Index only</Meta> : <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><TermDot term={s} /><Meta tone="ink">{termByKey(s).name}</Meta></View>))}
                <Meta size={13} tone="ink3">
                  since <Mono size={13} tone="ink3">{fmtDate(g.since)}</Mono>
                </Meta>
              </View>
              {g.from === 'Arjun' ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
                  <Button size="sm" variant="ghost" onPress={() => setRevoke(g)}>
                    {g.state === 'waiting' ? 'Withdraw' : 'Revoke'}
                  </Button>
                  {g.state === 'waiting' ? (
                    <Button
                      size="sm"
                      variant="link"
                      onPress={() => {
                        setGrants((gs) => [...gs.map((x) => (x.id === g.id ? { ...x, state: 'active' as const } : x)), { id: `g${Date.now()}`, scope: g.scope, from: 'Kavya', to: 'Arjun', state: 'active', since: '2027-01-28' }])
                        setToast(`Kavya agreed. ${scopeLabel(g.scope)} now shows on the household page.`)
                      }}
                    >
                      Demo: Kavya agrees
                    </Button>
                  ) : null}
                </View>
              ) : null}
            </View>
          ))}
        </Card>
        <DaybreakButton icon="share-2" onPress={() => setShareOpen(true)}>
          Propose a share
        </DaybreakButton>
        <Meta align="center">Kavya is asked privately. Nothing is shown until she says yes.</Meta>
      </View>

      {/* Couples Check */}
      <View style={{ gap: space.s2 }}>
        <SectionTitle>Couples Check</SectionTitle>
        <Title size={24}>
          Where you <Serif>agree</Serif>, and where you differ.
        </Title>
        <Card tone="raised" style={{ gap: space.s1 + 4 }}>
          <Body tone="ink2">{`Each of you answered privately on ${fmtDate(COUPLES_CHECK.takenOn)}. This shows only whether your answers matched, never who said what.`}</Body>
          <Body>
            You agree on <Mono tone="ink" size={17}>{String(COUPLES_CHECK.themes.filter((t) => t.agree).length)}</Mono> of <Mono tone="ink" size={17}>{String(COUPLES_CHECK.themes.length)}</Mono> themes. The two where you differ are good places to start a State of Us.
          </Body>
          <View accessibilityRole="list">
            {COUPLES_CHECK.themes.map((t) => (
              <View key={t.theme} accessible accessibilityLabel={`${t.theme}: ${t.agree ? 'you agree' : 'you differ'}`} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.line }}>
                <Meta tone="ink" style={{ flex: 1 }}>
                  {t.theme}
                </Meta>
                <Eyebrow tone={t.agree ? 'ink3' : 'ink'}>{t.agree ? '= agree' : '≠ differ'}</Eyebrow>
              </View>
            ))}
          </View>
          <Meta size={13} tone="ink3">{`${COUPLES_CHECK.instrument} · CSI-4 private to each partner`}</Meta>
          <ArrowLink onPress={() => router.push('/spaces/people')}>Plan a State of Us</ArrowLink>
        </Card>
      </View>

      {/* Charter */}
      <Card tone="sunk" style={{ gap: space.s1 + 4 }}>
        <Eyebrow>Coming with Patron</Eyebrow>
        <Title size={22}>The Family Joy Charter</Title>
        <Body tone="ink2">A page the whole family writes once, with your coach: what you value, the rituals you keep, and one shared joy a week.</Body>
        {['Up to six people, three generations', 'Read aloud at an annual ’cation', 'No one’s private answers are used'].map((x) => (
          <View key={x} style={{ flexDirection: 'row', gap: 10 }}>
            <Icon name="check" size={15} color={c.ink2} />
            <Meta style={{ flex: 1 }}>{x}</Meta>
          </View>
        ))}
        <ArrowLink onPress={() => router.push('/membership')}>See Patron</ArrowLink>
      </Card>

      <InviteSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={(iv) => setAcct((a) => ({ ...a, invites: [...a.invites, iv] }))}
      />

      <Sheet open={helperOpen} onClose={() => setHelperOpen(false)} title="Lakshmi’s settings" footer={<Button variant="secondary" block onPress={() => setHelperOpen(false)}>Done</Button>}>
        <Meta>These change how Joy OS looks on Lakshmi’s phone. She can change them too, and her choice wins.</Meta>
        <Toggle checked={acct.elder.largeType} onChange={(v) => setAcct((a) => ({ ...a, elder: { ...a.elder, largeType: v } }))} label="Larger text" description="Text at the Larger size, with high-contrast buttons." />
        <Toggle checked={acct.elder.voice} onChange={(v) => setAcct((a) => ({ ...a, elder: { ...a.elder, voice: v } }))} label="Voice first" description="Questions read aloud in Tamil; answers by voice or a tap." />
        <Divider />
        <Eyebrow>Helper consent</Eyebrow>
        {acct.elder.helper ? (
          <>
            <Body>Lakshmi agreed on 8 Jan 2027 that you may help her. You see what she sees on her Today screen; never her private answers.</Body>
            <Button variant="secondary" icon="user-x" onPress={() => setAcct((a) => ({ ...a, elder: { ...a.elder, helper: false } }))}>
              Step back as helper
            </Button>
          </>
        ) : (
          <>
            <Done>You are no longer Lakshmi’s helper. She has been told, kindly.</Done>
            <Button variant="link" onPress={() => setAcct((a) => ({ ...a, elder: { ...a.elder, helper: true } }))}>
              Ask Lakshmi again
            </Button>
          </>
        )}
      </Sheet>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onPropose={(scope) => {
          setGrants((gs) => [...gs, { id: `g${Date.now()}`, scope, from: 'Arjun', to: 'Kavya', state: 'waiting', since: '2027-01-28' }])
          setShareOpen(false)
          setToast(`Proposed to Kavya: ${scopeLabel(scope)}. She will be asked privately.`)
        }}
      />

      <Sheet
        open={!!revoke}
        onClose={() => setRevoke(null)}
        title={revoke?.state === 'waiting' ? 'Withdraw this proposal?' : 'Revoke this share?'}
        footer={
          <View style={{ flexDirection: 'row', gap: space.s1, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onPress={() => setRevoke(null)}>
              Keep it
            </Button>
            <Button
              variant="ink"
              icon="rotate-ccw"
              onPress={() => {
                if (revoke) setGrants((gs) => gs.map((x) => (x.id === revoke.id ? { ...x, state: 'revoked' as const } : x)))
                setRevoke(null)
                setToast('Done. The household page has been updated.')
              }}
            >
              {revoke?.state === 'waiting' ? 'Withdraw' : 'Revoke'}
            </Button>
          </View>
        }
      >
        <Body>
          {revoke
            ? revoke.state === 'waiting'
              ? `Kavya will no longer be asked to share ${scopeLabel(revoke.scope)}.`
              : `${scopeLabel(revoke.scope)} disappears from the household page now, for both of you. Kavya is told that a share ended, not why.`
            : ''}
        </Body>
      </Sheet>

      <Sheet open={!!toast} onClose={() => setToast(null)} title="Done" footer={<Button variant="secondary" block onPress={() => setToast(null)}>Close</Button>}>
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
  const toggle = (k: GrantScope) => {
    setError(null)
    setTerms((t) => (t.includes(k) ? t.filter((x) => x !== k) : [...t, k]))
  }
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Propose a share with Kavya"
      footer={
        <Button
          variant="ink"
          block
          onPress={() => {
            if (scope.length === 0) {
              setError('Choose at least one term to share.')
              return
            }
            onPropose(scope)
          }}
        >
          Send proposal to Kavya
        </Button>
      }
    >
      <Meta tone="ink">What would you like to share?</Meta>
      <Segmented
        value={mode}
        onChange={(v) => {
          setMode(v)
          setError(null)
        }}
        items={[
          { value: 'index', label: 'Index only' },
          { value: 'terms', label: 'Per term' },
        ]}
      />
      {mode === 'terms' ? (
        <View style={{ gap: space.s1 }}>
          {TERMS.map((t) => (
            <ChoiceCard
              key={t.key}
              kind="checkbox"
              selected={terms.includes(t.key)}
              onPress={() => toggle(t.key)}
              accessibilityLabel={t.name}
              leading={<TermDot term={t.key} />}
              title={<Body>{t.name}</Body>}
            />
          ))}
        </View>
      ) : null}
      {error ? <Meta tone="error">{error}</Meta> : null}
      <Card tone="sunk" padding={16} style={{ gap: 6 }}>
        <Eyebrow>What Kavya will see</Eyebrow>
        {scope.length === 0 ? (
          <Meta>Nothing yet. Choose at least one term.</Meta>
        ) : (
          scope.map((s) => {
            const v = s === 'index' ? me.value : me.terms.find((t) => t.key === s)!.value
            return (
              <View key={s} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Meta tone="ink">{s === 'index' ? 'Your Joyspan Index' : termByKey(s).name}</Meta>
                <Mono tone="ink">{s === 'B' ? `−${v}` : String(v)}</Mono>
              </View>
            )
          })
        )}
        <Meta size={13} tone="ink3">Scores and bands only. Never your answers, your Ledger, your messages or anything clinical.</Meta>
      </Card>
      {['Kavya is asked privately, in her own app.', 'It appears only if she shares the same thing back.', 'Either of you can revoke it at any time; it disappears at once.'].map((x, i) => (
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

  const reset = () => {
    setName('')
    setRelation('Parent')
    setAge('adult')
    setConsent(false)
    setErrors({})
    setDone(null)
  }
  const close = () => {
    reset()
    onClose()
  }
  const submit = () => {
    if (!guard(name, close)) return
    const e: typeof errors = {}
    if (name.trim().length < 2) e.name = 'Enter their name.'
    if (age === 'minor' && !consent) e.consent = 'A parent or guardian must consent for anyone under 18.'
    setErrors(e)
    if (Object.keys(e).length) return
    const expires = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    const iv: Invite = { id: refCode('INV'), name: name.trim(), relation, age: AGES.find((a) => a.value === age)!.label, expires }
    onInvite(iv)
    setDone(iv)
  }
  const link = done ? `https://joy.aiwo.in/join/${done.id.toLowerCase()}` : ''

  return (
    <Sheet
      open={open}
      onClose={close}
      title={done ? 'Link ready' : 'Invite to household'}
      footer={
        done ? (
          <View style={{ gap: 8 }}>
            <Button variant="ink" block icon="share" onPress={() => Share.share({ message: `Join the Rao household on Joy OS: ${link}`, title: 'Joy OS invitation' }).catch(() => {})}>
              Share the link
            </Button>
            <Button variant="secondary" block onPress={close}>
              Done
            </Button>
          </View>
        ) : (
          <Button variant="ink" block icon="user-plus" onPress={submit}>
            Create invitation
          </Button>
        )
      }
    >
      {done ? (
        <>
          <Done>{`${done.name} is invited as ${done.relation.toLowerCase()} · ${done.age.toLowerCase()}.`}</Done>
          <KeyValue k="Link">
            <Mono tone="ink" size={14}>{link}</Mono>
          </KeyValue>
          <KeyValue k="Expires" last>
            <Mono tone="ink">{fmtDate(done.expires)}</Mono>
          </KeyValue>
          <Meta>They set their own consents when they join. Nothing of yours is shared until you both agree.</Meta>
        </>
      ) : (
        <>
          <Field label="Name" value={name} onChangeText={(v) => { setName(v); if (errors.name) setErrors((x) => ({ ...x, name: undefined })) }} placeholder="e.g. Ananya Rao" error={errors.name} />
          <Eyebrow>Relationship</Eyebrow>
          <Segmented<(typeof RELATIONS)[number]> value={relation} onChange={setRelation} items={RELATIONS.map((r) => ({ value: r, label: r }))} />
          <Eyebrow>Age</Eyebrow>
          <View style={{ gap: space.s1 }} accessibilityRole="radiogroup" accessibilityLabel="Age band">
            {AGES.map((a) => (
              <ChoiceCard
                key={a.value}
                selected={age === a.value}
                onPress={() => { setAge(a.value); setErrors((x) => ({ ...x, consent: undefined })) }}
                accessibilityLabel={a.label}
                title={a.label}
                sub={a.value === 'adult' ? 'Their own Index and consents.' : a.value === 'elder' ? 'Large type, voice first; you can be their helper with their consent.' : 'Never scored. Household rituals only.'}
              />
            ))}
          </View>
          {age === 'minor' ? (
            <ChoiceCard
              kind="checkbox"
              selected={consent}
              onPress={() => { setConsent((v) => !v); setErrors((x) => ({ ...x, consent: undefined })) }}
              accessibilityLabel="I am their parent or guardian and I consent"
              title="I am their parent or guardian and I consent"
              sub="DPDP Act: no tracking, no profiling, no advertising. Withdraw any time."
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
