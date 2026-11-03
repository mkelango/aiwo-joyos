import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { Body, Button, Card, Icon, Meta, Mono, Segmented } from '@/components'
import { useTheme } from '@/theme/ThemeProvider'
import { useDict } from '@/lib/i18n'
import { accountStore, maskPhone, useStore } from './bStore'
import { Field } from './parts'
import { TRUST } from './i18n/trust'
import { useCommon } from './i18n/common'

// STEP-UP (Arch p.25: "step-up for exports and erasure"): before an export is prepared or an
// erasure is scheduled, the member confirms again that it is really them, with the passkey on
// this phone or a one-time code to the registered mobile (phone-first India).
// SPECIMEN: no passkey ceremony runs and no SMS is sent; the code is shown on screen.

const newCode = () => String(Math.floor(100000 + Math.random() * 900000))

export function StepUp({ why, onVerified, onCancel, onBack }: { why: string; onVerified: () => void; onCancel: () => void; onBack?: () => void }) {
  const { c, space } = useTheme()
  const t = useDict(TRUST)
  const tc = useCommon()
  const [acct] = useStore(accountStore)
  const phone = maskPhone(acct.profile.phone)
  const [method, setMethod] = useState<'passkey' | 'otp'>('passkey')
  // A code is good for this check only: each mount starts fresh.
  const [code, setCode] = useState(newCode)
  const [sent, setSent] = useState(false)
  const [typed, setTyped] = useState('')
  const [tried, setTried] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const verify = () => {
    if (waiting) return
    setWaiting(true)
    timer.current = setTimeout(() => {
      timer.current = null
      setWaiting(false)
      onVerified()
    }, 700)
  }
  const digits = typed.replace(/\D/g, '')
  const err = digits.length !== 6 ? t('suCodeLen') : digits !== code ? t('suCodeWrong') : null

  return (
    <View style={{ gap: space.s2 }}>
      <View style={{ alignItems: 'center', gap: space.s1 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.paperSunk, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={method === 'passkey' ? 'key' : 'message-square'} size={28} color={c.ink} />
        </View>
        <Body weight="medium">{t('confirmYou')}</Body>
        <Meta align="center">{why}</Meta>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Segmented
          value={method}
          onChange={(v) => {
            setMethod(v)
            setTried(false)
          }}
          items={[
            { value: 'passkey', label: t('suPasskey') },
            { value: 'otp', label: t('suOtp') },
          ]}
        />
      </View>

      {method === 'passkey' ? (
        <>
          <Meta align="center">{t('stepUp')}</Meta>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1, justifyContent: 'flex-end' }}>
            {onBack ? (
              <Button variant="ghost" onPress={onBack}>
                {tc('back')}
              </Button>
            ) : null}
            <Button variant="ghost" onPress={onCancel}>
              {tc('cancel')}
            </Button>
            <Button variant="ink" icon="key" onPress={verify} disabled={waiting}>
              {waiting ? t('suChecking') : t('usePasskey')}
            </Button>
          </View>
        </>
      ) : !sent ? (
        <>
          <Meta align="center">{t('suOtpBody', { phone })}</Meta>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1, justifyContent: 'flex-end' }}>
            {onBack ? (
              <Button variant="ghost" onPress={onBack}>
                {tc('back')}
              </Button>
            ) : null}
            <Button variant="ghost" onPress={onCancel}>
              {tc('cancel')}
            </Button>
            <Button variant="ink" icon="send" onPress={() => setSent(true)}>
              {t('suSend')}
            </Button>
          </View>
        </>
      ) : (
        <>
          <Meta accessibilityLiveRegion="polite">{t('suSent', { phone })}</Meta>
          <Card tone="outline" padding={12} style={{ gap: 4 }}>
            <Meta size={14} tone="ink3">
              {t('suSpecimen').split('{code}')[0]}
              <Mono size={14} tone="ink">{`${code.slice(0, 3)} ${code.slice(3)}`}</Mono>
              {t('suSpecimen').split('{code}')[1] ?? ''}
            </Meta>
          </Card>
          <Field
            label={t('suCode')}
            value={typed}
            onChangeText={(v) => setTyped(v)}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={7}
            error={tried ? err : null}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1, justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              size="sm"
              variant="ghost"
              onPress={() => {
                setCode(newCode())
                setTyped('')
                setTried(false)
              }}
            >
              {t('suResend')}
            </Button>
            <View style={{ flexDirection: 'row', gap: space.s1 }}>
              <Button variant="ghost" onPress={onCancel}>
                {tc('cancel')}
              </Button>
              <Button
                variant="ink"
                disabled={waiting}
                onPress={() => {
                  setTried(true)
                  if (!err) verify()
                }}
              >
                {waiting ? t('suChecking') : t('suVerify')}
              </Button>
            </View>
          </View>
        </>
      )}
    </View>
  )
}
