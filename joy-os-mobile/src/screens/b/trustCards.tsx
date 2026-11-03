import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { ArrowLink, Body, Button, Card, Divider, Eyebrow, Icon, Meta, Mono, Pill, SectionTitle, Sheet, fmtDate } from '@/components'
import { INDEX_HISTORY } from '@/shared/member'
import { METHODS } from '@/shared/indexEngine'
import type { MethodVersion } from '@/shared/types'
import { useTheme } from '@/theme/ThemeProvider'
import { useDict } from '@/lib/i18n'
import { abhaStore, nomineeStore, useStore, type NomineeState } from './bStore'
import { ChoiceCard, Field, FilterChips } from './parts'
import { NOMINEE_REL, TRUST } from './i18n/trust'
import { METHOD_LABEL } from './i18n/method'
import { useCommon, useTx } from './i18n/common'

// Trust centre cards: the method and its versions, the DPDP nominee and ABHA (optional).
// Each card reports what changed through onToast; the screen shows it once any sheet has closed.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ABHA_ADDR = /^[a-z0-9._]{3,}@(abdm|sbx)$/i
const ABHA_NUM = /^\d{2}-?\d{4}-?\d{4}-?\d{4}$/
const RELATIONS: NomineeState['relation'][] = ['Spouse', 'Child', 'Parent', 'Sibling', 'Friend', 'Other']

/** How the Index is computed, every method version, and the way to the full method page. */
export function MethodCard() {
  const { space } = useTheme()
  const t = useDict(TRUST)
  const tx = useTx()
  const latest = INDEX_HISTORY[0]
  return (
    <View style={{ gap: space.s2 }}>
      <SectionTitle>{t('methodTitle')}</SectionTitle>
      <Body tone="ink2">{t('methodBody')}</Body>
      <Card tone="raised" padding={8} style={{ paddingHorizontal: 16 }}>
        <View style={{ paddingVertical: 12, gap: 4 }}>
          <Mono tone="ink">{`JI = GM(H, P, R, F, D) − ${METHODS['v1.0'].lambda} · B`}</Mono>
          <Meta size={14}>{t('yourIndexOn', { method: latest.method, build: latest.engineBuild })}</Meta>
        </View>
        {(Object.keys(METHODS) as MethodVersion[]).map((v) => (
          <View key={v}>
            <Divider />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 }}>
              <Mono tone="ink" style={{ width: 44 }}>
                {v}
              </Mono>
              <View style={{ flex: 1 }}>
                <Body>{tx(METHOD_LABEL[v], METHODS[v].label)}</Body>
                <Meta size={14}>
                  {`λ ${METHODS[v].lambda} · `}
                  <Mono size={14} tone="ink2">{/^\d{4}-\d{2}-\d{2}$/.test(METHODS[v].published) ? fmtDate(METHODS[v].published) : METHODS[v].published}</Mono>
                </Meta>
              </View>
              <Pill tone={v === latest.method ? 'ink' : 'neutral'}>{v === latest.method ? t('vCurrent') : t('vPlanned')}</Pill>
            </View>
          </View>
        ))}
      </Card>
      <ArrowLink icon="book-open" onPress={() => router.push('/method')}>
        {t('readMethod')}
      </ArrowLink>
    </View>
  )
}

/** The DPDP nominee: shown, changed with validation, kept on the phone. */
export function NomineeCard({ onToast }: { onToast: (msg: string) => void }) {
  const { c, space } = useTheme()
  const t = useDict(TRUST)
  const tc = useCommon()
  const tx = useTx()
  const [nominee, setNominee] = useStore(nomineeStore)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(nominee)
  const [tried, setTried] = useState(false)
  const errs = {
    name: form.name.trim().length < 2 ? t('errFullName') : null,
    email: EMAIL.test(form.email.trim()) ? null : t('errEmail'),
  }
  const rel = (r: string) => tx(NOMINEE_REL[r], r)
  const save = () => {
    setTried(true)
    if (errs.name || errs.email) return
    const next = { ...form, name: form.name.trim(), email: form.email.trim(), savedAt: new Date().toISOString() }
    setNominee(next)
    setOpen(false)
    setTried(false)
    onToast(t('nomineeSaved', { name: next.name }))
  }
  return (
    <Card tone="raised" style={{ gap: space.s1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="user" size={16} color={c.ink3} />
        <Eyebrow>{t('nominee')}</Eyebrow>
      </View>
      <Body weight="medium">{t('nomineeTitle')}</Body>
      <Meta>{t('nomineeBody')}</Meta>
      <Card tone="sunk" padding={16} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s1 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Body>{nominee.name}</Body>
          <Meta size={14}>{`${rel(nominee.relation)} · ${nominee.email}`}</Meta>
        </View>
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            setForm(nominee)
            setTried(false)
            setOpen(true)
          }}
        >
          {t('change')}
        </Button>
      </Card>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={t('nominee')}
        footer={
          <Button variant="ink" block onPress={save}>
            {t('saveNominee')}
          </Button>
        }
      >
        <Field label={t('fullName')} value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} autoComplete="off" maxLength={80} error={tried ? errs.name : null} />
        <Meta tone="ink">{t('relationship')}</Meta>
        <FilterChips label={t('relationship')} value={form.relation} onChange={(v) => setForm((f) => ({ ...f, relation: v }))} items={RELATIONS.map((r) => ({ value: r, label: rel(r) }))} />
        <Field label={t('email')} value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} keyboardType="email-address" autoCapitalize="none" autoComplete="off" maxLength={120} help={t('emailHint')} error={tried ? errs.email : null} />
        <Button variant="ghost" onPress={() => setOpen(false)}>
          {tc('cancel')}
        </Button>
      </Sheet>
    </Card>
  )
}

/** ABHA: optional link to ABDM, approved on ABDM's side (simulated here), and unlink. */
export function AbhaCard({ onToast }: { onToast: (msg: string) => void }) {
  const { c, space } = useTheme()
  const t = useDict(TRUST)
  const tc = useCommon()
  const [abha, setAbha] = useStore(abhaStore)
  const [unlinkOpen, setUnlinkOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [value, setValue] = useState(abha.address)
  const [agree, setAgree] = useState(false)
  const [step, setStep] = useState<'enter' | 'approve'>('enter')
  const [tried, setTried] = useState(false)
  const v = value.trim()
  const formatOk = ABHA_ADDR.test(v) || ABHA_NUM.test(v)
  const closeLink = () => {
    setLinkOpen(false)
    setStep('enter')
    setTried(false)
    setAgree(false)
  }
  return (
    <Card tone="raised" style={{ gap: space.s1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Icon name="link" size={16} color={c.ink3} />
          <Eyebrow style={{ flexShrink: 1 }}>{t('abha')}</Eyebrow>
        </View>
        <Pill tone={abha.linked ? 'ink' : 'neutral'}>{abha.linked ? t('abhaLinked') : t('abhaOptional')}</Pill>
      </View>
      {abha.linked ? (
        <>
          <Mono tone="ink">{abha.address}</Mono>
          <Meta size={14}>
            {t('abhaSince')}
            <Mono size={14} tone="ink2">{fmtDate(abha.since)}</Mono>
          </Meta>
          <Button size="sm" variant="secondary" icon="x" onPress={() => setUnlinkOpen(true)}>
            {t('abhaUnlink')}
          </Button>
        </>
      ) : (
        <>
          <Body>{t('abhaNotLinked')}</Body>
          <Meta size={14}>{t('abhaWhy')}</Meta>
          <Button
            size="sm"
            variant="secondary"
            icon="link"
            onPress={() => {
              setValue(abha.address)
              setLinkOpen(true)
            }}
          >
            {t('abhaLink')}
          </Button>
        </>
      )}

      <Sheet
        open={unlinkOpen}
        onClose={() => setUnlinkOpen(false)}
        title={t('abhaUnlinkTitle')}
        footer={
          <View style={{ gap: 8 }}>
            <Button
              variant="ink"
              block
              onPress={() => {
                setAbha((a) => ({ ...a, linked: false }))
                setUnlinkOpen(false)
                onToast(t('abhaUnlinkedToast'))
              }}
            >
              {t('abhaUnlink')}
            </Button>
            <Button variant="secondary" block onPress={() => setUnlinkOpen(false)}>
              {t('abhaKeep')}
            </Button>
          </View>
        }
      >
        <Body>{t('abhaUnlinkBody')}</Body>
      </Sheet>

      <Sheet
        open={linkOpen}
        onClose={closeLink}
        title={t('abhaLink')}
        footer={
          step === 'enter' ? (
            <Button
              variant="ink"
              block
              onPress={() => {
                setTried(true)
                if (formatOk && agree) {
                  setTried(false)
                  setStep('approve')
                }
              }}
            >
              {t('abhaToAbdm')}
            </Button>
          ) : (
            <View style={{ gap: 8 }}>
              <Button
                variant="ink"
                block
                icon="check"
                onPress={() => {
                  setAbha({ linked: true, address: v, since: new Date().toISOString().slice(0, 10) })
                  closeLink()
                  onToast(t('abhaLinkedToast', { address: v }))
                }}
              >
                {t('abhaSimulate')}
              </Button>
              <Button variant="secondary" block onPress={() => setStep('enter')}>
                {tc('back')}
              </Button>
            </View>
          )
        }
      >
        {step === 'enter' ? (
          <>
            <Meta>{t('abhaWhy')}</Meta>
            <Field label={t('abhaField')} value={value} onChangeText={setValue} autoCapitalize="none" autoComplete="off" placeholder="name@abdm" maxLength={60} error={tried && !formatOk ? t('abhaFormat') : null} />
            <ChoiceCard kind="checkbox" selected={agree} onPress={() => setAgree((x) => !x)} accessibilityLabel={t('abhaAgree')} title={<Body size={15}>{t('abhaAgree')}</Body>} />
            {tried && formatOk && !agree ? (
              <Meta tone="error" accessibilityLiveRegion="polite">
                {t('abhaPleaseAgree')}
              </Meta>
            ) : null}
          </>
        ) : (
          <>
            <View style={{ alignItems: 'center' }}>
              <Icon name="shield" size={28} color={c.ink} />
            </View>
            <Body align="center">{t('abhaOtp')}</Body>
            <Meta align="center" size={14}>
              {t('abhaOtpNote')}
            </Meta>
          </>
        )}
      </Sheet>
    </Card>
  )
}
