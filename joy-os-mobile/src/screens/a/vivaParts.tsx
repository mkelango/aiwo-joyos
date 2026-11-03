import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { Body, Eyebrow, Meta } from '@/components'
import { useTheme } from '@/theme/ThemeProvider'
import { useA } from './i18n'
import { Provenance } from './parts'

// VIVA run inside a room or a tool (Memo p.27): the member asks, VIVA "drafts" for a moment, then
// the specimen draft appears with its provenance and who reviews it. Nothing leaves the phone.

/** One exchange: what was asked (a canned prompt or the member's own words) and VIVA's draft. */
export type VivaTurn = { ask: string; text: string; tool?: string; reviewer?: string }

/** The drafting state of one VIVA card: idle → drafting (0.7 s) → shown. */
export function useVivaRun() {
  const [state, setState] = useState<'idle' | 'drafting' | 'shown'>('idle')
  const [turn, setTurn] = useState<VivaTurn | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const run = (next: VivaTurn) => {
    setTurn(next)
    setState('drafting')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('shown'), 700)
  }
  const reset = () => {
    clearTimeout(timer.current)
    setState('idle')
    setTurn(null)
  }
  return { state, turn, run, reset }
}

/** The question as an Ink bubble on the right, then "drafting…" or the draft with its provenance. */
export function VivaExchange({ state, turn }: { state: 'idle' | 'drafting' | 'shown'; turn: VivaTurn | null }) {
  const { c, radius } = useTheme()
  const { t } = useA()
  if (state === 'idle' || !turn) return null
  return (
    <View style={{ gap: 10 }} accessibilityLiveRegion="polite">
      <View accessible accessibilityLabel={t('You asked: {ask}', { ask: turn.ask })} style={{ alignSelf: 'flex-end', maxWidth: '88%', backgroundColor: c.ink, borderRadius: radius.card, borderBottomRightRadius: 6, paddingHorizontal: 14, paddingVertical: 10 }}>
        <Body color={c.paper}>{turn.ask}</Body>
      </View>
      {state === 'drafting' ? (
        <Eyebrow>{t('VIVA is drafting…')}</Eyebrow>
      ) : (
        <View style={{ gap: 8, backgroundColor: c.paperSunk, borderRadius: radius.card, borderBottomLeftRadius: 6, padding: 14 }}>
          <Body>{turn.text}</Body>
          {turn.tool ? <Provenance tool={turn.tool} /> : <Meta size={13} tone="ink3">{t('Drafted by VIVA · method v1.0 · no diagnosis, no advice')}</Meta>}
          {turn.reviewer ? (
            <Meta size={13} tone="ink3">
              {turn.reviewer}
            </Meta>
          ) : null}
        </View>
      )}
    </View>
  )
}
