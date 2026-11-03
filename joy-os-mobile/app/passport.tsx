import { router } from 'expo-router'
import { useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { ArrowLink, BandLabel, Body, Button, Card, DaybreakButton, Eyebrow, Icon, LoopRing, Meta, MethodLine, Mono, Numeral, Pill, Screen, ScreenHeader, SectionTitle, Serif, Sheet, SpecimenTag, Title, fmtDate } from '@/components'
import { INDEX_HISTORY, MEMBER } from '@/shared/member'
import { CATIONS } from '@/shared/platform'
import type { TermKey } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { FLAGSHIP_NEXT, PASSPORT, SALONS, SESSIONS_OPEN } from '@/screens/b/journeyData'
import { accountStore, useStore } from '@/screens/b/bStore'
import { Done, KeyValue, PrimaryChip, SpecimenQR, fmtWhen, memberOnly, useAccount } from '@/screens/b/parts'
import { useCationRequests } from '@/screens/a/local'
import { useIsMinor } from '@/lib/minor'
import { useDict, useT } from '@/lib/i18n'
import { PASSPORT_T, STAMP_KIND, ENTITLEMENT_TEXT, SALON_TITLE } from '@/screens/b/i18n/journey'
import { useCommon, useTx } from '@/screens/b/i18n/common'

// JOY PASSPORT (Memo p.22): one card for every ’cation, edition and House. The same Index and
// the same ninety days wherever you are; stamps for where you have been. Venues see a name
// and a booking, never health data. One Daybreak: Show at check-in.
// Stamps: the specimen's, then everything booked or asked for on this phone: Sessions (Events),
// salons (Circles), ’cation requests (’Cation) and the next flagship edition (Events).
// The card can go in the phone's wallet (specimen), and the Index can be hidden from this screen.
// Under 18 nothing is scored, so the card carries no Index at all.

type Stamp = {
  id: string
  place: string
  what: string
  when: string
  kind: string
  term: TermKey | 'ALL'
  done: boolean
  /** Asked for, not yet confirmed: a ’cation request (or interest) or the flagship request. */
  requested?: 'request' | 'interest'
  /** Where the stamp's detail leads. */
  to: string
}
type WalletKind = 'apple' | 'google'
const WALLET_NAME: Record<WalletKind, string> = { apple: 'Apple Wallet', google: 'Google Wallet' }
/** The wallet this phone has: Apple on an iPhone, Google on Android; the web build offers both. */
const WALLETS: WalletKind[] = Platform.OS === 'ios' ? ['apple'] : Platform.OS === 'android' ? ['google'] : ['apple', 'google']

export default memberOnly(Passport)

function Passport() {
  const { c, space, radius } = useTheme()
  const [acct, setAcct] = useStore(accountStore)
  const [qrOpen, setQrOpen] = useState(false)
  const [stamp, setStamp] = useState<Stamp | null>(null)
  const latest = INDEX_HISTORY[0]
  const minor = useIsMinor()
  const hideIndex = !!acct.passportHideIndex
  const wallet = acct.passportWallet ?? null
  const { requests } = useCationRequests()
  const t = useDict(PASSPORT_T)
  // The holder is the account signed in (M1).
  const account = useAccount()
  const tc = useCommon()
  const tx = useTx()
  const tg = useT()
  const kind = (k: string) => tx(STAMP_KIND[k], k)

  const stamps: Stamp[] = [
    ...PASSPORT.stamps.map((s) => ({ id: s.id, place: s.place, what: s.what, when: fmtWhen(s), kind: s.kind, term: s.term, done: s.done, to: s.done ? '/cation' : '/events' })),
    ...acct.bookings.map((b) => {
      const ses = SESSIONS_OPEN.find((x) => x.id === b.id)
      return { id: b.ref, place: ses ? t('passAt', { where: ses.where, ref: b.ref }) : t('pass', { ref: b.ref }), what: ses ? t('sessionCity', { city: ses.city }) : t('session'), when: ses ? fmtWhen(ses) : fmtDate(b.at), kind: 'Session', term: 'ALL' as const, done: false, to: '/events' }
    }),
    ...(acct.passes ?? []).flatMap((p) => {
      if (p.kind !== 'Salon') return []
      const sa = SALONS.find((x) => x.id === p.id)
      if (!sa) return []
      return [{ id: p.code, place: t('passAt', { where: sa.where, ref: p.code }), what: t('salonWhat', { title: tx(SALON_TITLE[sa.id], sa.title) }), when: fmtWhen(sa), kind: 'Salon', term: sa.term, done: false, to: '/circles' }]
    }),
    ...Object.entries(requests).flatMap(([slug, r]) => {
      const cation = CATIONS.find((x) => x.slug === slug)
      if (!cation) return []
      return [{ id: r.ref, place: `${r.venue} · ${r.ref}`, what: cation.name, when: r.win || t('datesWhenOpens'), kind: '’Cation', term: cation.primary, done: false, requested: r.interestOnly ? ('interest' as const) : ('request' as const), to: `/cation/${slug}` }]
    }),
    ...(acct.flagshipRequest
      ? [{ id: acct.flagshipRequest.ref, place: `${FLAGSHIP_NEXT.where} · ${acct.flagshipRequest.ref}`, what: FLAGSHIP_NEXT.name, when: fmtWhen({ date: FLAGSHIP_NEXT.date, to: FLAGSHIP_NEXT.to }), kind: 'Flagship', term: 'ALL' as const, done: false, requested: 'request' as const, to: '/events' }]
      : []),
  ]
  const stateOf = (s: Stamp) => (s.done ? t('stamped') : s.requested === 'interest' ? t('interestNoted') : s.requested ? t('requestedPill') : t('upcoming'))

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

      <Card tone="ink" style={{ gap: space.s2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: space.s1 }}>
          <View style={{ gap: 4, flex: 1 }}>
            <Eyebrow>{t('cardEyebrow')}</Eyebrow>
            <Title size={26}>{account.name}</Title>
            <Mono tone="ink">{account.aiwoId}</Mono>
          </View>
          <SpecimenQR seed={PASSPORT.number} size={88} label={t('qrA11y', { n: PASSPORT.number })} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s3, rowGap: space.s1 }}>
          <View style={{ gap: 2 }}>
            <Eyebrow>{t('number')}</Eyebrow>
            <Mono tone="ink">{PASSPORT.number}</Mono>
          </View>
          <View style={{ gap: 2 }}>
            <Eyebrow>{t('since')}</Eyebrow>
            <Mono tone="ink">{fmtDate(PASSPORT.issued)}</Mono>
          </View>
          <View style={{ gap: 2 }}>
            <Eyebrow>{t('issuedAt')}</Eyebrow>
            <Meta tone="ink">{PASSPORT.issuedAt}</Meta>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Icon name="eye-off" size={14} color={c.ink3} />
          <Meta size={14} style={{ flex: 1 }}>
            {t('venues')}
          </Meta>
        </View>
      </Card>
      <SpecimenTag />

      <DaybreakButton icon="maximize" onPress={() => setQrOpen(true)}>
        {t('show')}
      </DaybreakButton>

      {/* The card in the phone's wallet (specimen: no pass file is made) */}
      {wallet ? (
        <View style={{ gap: 2 }}>
          <Done>{t('inWallet', { w: WALLET_NAME[wallet] })}</Done>
          <Button variant="link" onPress={() => setAcct((a) => ({ ...a, passportWallet: null }))} style={{ alignSelf: 'flex-start' }}>
            {t('removeWallet', { w: WALLET_NAME[wallet] })}
          </Button>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
            {WALLETS.map((w) => (
              <Button key={w} variant="secondary" size="sm" icon={w === 'apple' ? 'credit-card' : 'smartphone'} accessibilityLabel={t('addWalletA11y', { w: WALLET_NAME[w] })} onPress={() => setAcct((a) => ({ ...a, passportWallet: w }))}>
                {t('addWallet', { w: WALLET_NAME[w] })}
              </Button>
            ))}
          </View>
          <Meta size={14} tone="ink3">{t('walletNote')}</Meta>
        </View>
      )}

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('sameIndex')}</SectionTitle>
        {minor ? (
          // Under 18 (Architecture p26): no Index, band or method line, and nothing to hide or show.
          <Card tone="sunk" style={{ gap: space.s1 }}>
            <Eyebrow>{t('minorEyebrow')}</Eyebrow>
            <Body>{t('minorBody')}</Body>
          </Card>
        ) : hideIndex ? (
          <Card tone="sunk" style={{ gap: space.s1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="eye-off" size={16} color={c.ink2} />
              <Body style={{ flex: 1 }}>{t('indexHidden')}</Body>
            </View>
            <Meta size={14}>{t('indexHiddenBody')}</Meta>
            <Button variant="secondary" size="sm" icon="eye" onPress={() => setAcct((a) => ({ ...a, passportHideIndex: false }))} style={{ alignSelf: 'flex-start' }}>
              {t('showIndex')}
            </Button>
          </Card>
        ) : (
          <Card tone="raised" style={{ gap: space.s1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.s2, flexWrap: 'wrap' }}>
              <Numeral size={72}>{String(latest.value)}</Numeral>
              <View style={{ gap: 6, paddingBottom: 8 }}>
                <BandLabel band={latest.band} />
                <Meta size={14}>{t('joyspanIndex')}</Meta>
              </View>
            </View>
            <Meta>{t('sameNumber')}</Meta>
            <MethodLine method={latest.method} grade={latest.grade} takenOn={latest.takenOn} next={latest.nextMeasure} />
            <Button variant="ghost" size="sm" icon="eye-off" onPress={() => setAcct((a) => ({ ...a, passportHideIndex: true }))} style={{ alignSelf: 'flex-start' }}>
              {t('hideIndex')}
            </Button>
          </Card>
        )}
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('sameNinety')}</SectionTitle>
        <Card tone="raised" style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
          <LoopRing day={MEMBER.dayOfLoop} size={72} />
          <View style={{ flex: 1, gap: 4 }}>
            <Body>{tg('dayOf', { n: MEMBER.dayOfLoop })}</Body>
            <Meta>{t('started', { date: fmtDate(MEMBER.loopStarted) })}</Meta>
          </View>
        </Card>
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('stamps')}</SectionTitle>
        <Body tone="ink2">{t('stampsBody')}</Body>
        {stamps.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setStamp(s)}
            accessibilityRole="button"
            accessibilityLabel={t('stampA11y', { kind: kind(s.kind), what: s.what, place: s.place, when: s.when, state: stateOf(s) })}
            style={({ pressed }) => ({ borderWidth: 1, borderStyle: s.done ? 'solid' : 'dashed', borderColor: s.done ? c.lineStrong : c.line, borderRadius: radius.card, padding: 16, gap: 6, backgroundColor: c.paperRaised, opacity: pressed ? 0.8 : 1 })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.s1, flexWrap: 'wrap' }}>
              <Eyebrow>{kind(s.kind)}</Eyebrow>
              <Pill tone={s.done ? 'ink' : s.requested ? 'daybreak' : 'neutral'}>{stateOf(s)}</Pill>
            </View>
            <Body weight="medium">{s.what}</Body>
            <Meta>
              {`${s.place} · `}
              {/\d/.test(s.when) ? <Mono size={14} tone="ink2">{s.when}</Mono> : s.when}
            </Meta>
            <PrimaryChip primary={s.term} />
          </Pressable>
        ))}
      </View>

      <View style={{ gap: space.s2 }}>
        <SectionTitle>{t('opens')}</SectionTitle>
        <Card tone="raised" style={{ gap: 0 }}>
          {PASSPORT.entitlements.map((e, i) => {
            const et = ENTITLEMENT_TEXT[e.label]
            const detail = tx(et?.detail, e.detail)
            return (
            <KeyValue key={e.label} k={tx(et?.label, e.label)} last={i === PASSPORT.entitlements.length - 1}>
              <Meta tone="ink">{e.used ? `${detail} · ${e.label === 'Joyspan Sessions' ? t('booked', { n: Math.min(4, 1 + acct.bookings.length) }) : tx(et?.used, e.used)}` : detail}</Meta>
            </KeyValue>
            )
          })}
        </Card>
        <ArrowLink onPress={() => router.push('/events')}>{t('events')}</ArrowLink>
        <ArrowLink onPress={() => router.push('/membership')}>{t('membership')}</ArrowLink>
      </View>

      <Sheet open={qrOpen} onClose={() => setQrOpen(false)} title={t('checkin')} footer={<Button variant="secondary" block onPress={() => setQrOpen(false)}>{tc('done')}</Button>}>
        <View style={{ alignItems: 'center', gap: space.s2, paddingVertical: space.s1 }}>
          <SpecimenQR seed={PASSPORT.number} size={260} label={t('checkinA11y', { name: account.name, n: PASSPORT.number })} />
          <Title size={24} align="center">{account.name}</Title>
          <Mono tone="ink">{PASSPORT.number}</Mono>
          <Meta align="center">{t('brightness')}</Meta>
        </View>
      </Sheet>

      <Sheet open={!!stamp} onClose={() => setStamp(null)} title={stamp ? kind(stamp.kind) : t('stamp')} footer={<Button variant="secondary" block onPress={() => setStamp(null)}>{tc('close')}</Button>}>
        {stamp ? (
          <>
            <Title size={24}>{stamp.what}</Title>
            <KeyValue k={t('place')}>{stamp.place}</KeyValue>
            <KeyValue k={t('when')}>
              <Mono tone="ink">{stamp.when}</Mono>
            </KeyValue>
            <KeyValue k={t('status')} last>{stamp.done ? t('stampedCheckout') : stamp.requested === 'interest' ? t('interestStatus') : stamp.requested ? t('requestedStatus') : t('upcomingArrival')}</KeyValue>
            <PrimaryChip primary={stamp.term} />
            <ArrowLink
              onPress={() => {
                const to = stamp.to
                setStamp(null)
                router.push(to)
              }}
            >
              {stamp.done ? t('journey') : stamp.kind === 'Salon' ? t('seeCircles') : stamp.kind === '’Cation' ? t('seeRequest') : t('schedule')}
            </ArrowLink>
          </>
        ) : null}
      </Sheet>
    </Screen>
  )
}
