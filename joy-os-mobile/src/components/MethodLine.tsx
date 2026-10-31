import { View, type StyleProp, type ViewStyle } from 'react-native'
import { useDict, useLang } from '../lib/i18n'
import { activeLang, type Lang } from '../lib/store'
import type { Grade, MethodVersion } from '../shared/types'
import { useTheme } from '../theme/ThemeProvider'
import { Eyebrow } from './Text'
import { KIT } from './_i18n'

const DATE_LOCALE: Record<Lang, string> = { en: 'en-GB', ta: 'ta-IN', hi: 'hi-IN' }

/** "31 Oct 2026". Pass the member's language for Tamil or Hindi month names; digits stay Latin. */
export function fmtDate(iso: string, lang: Lang = activeLang()) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  try {
    return d.toLocaleDateString(DATE_LOCALE[lang], { day: '2-digit', month: 'short', year: 'numeric', numberingSystem: 'latn' } as Intl.DateTimeFormatOptions)
  } catch {
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
}

/** fmtDate bound to the member's language. */
export function useFmtDate() {
  const lang = useLang()
  return (iso: string) => fmtDate(iso, lang)
}

/** dd.mm.yyyy — the Index-card / p62 date form. */
export function fmtDateDots(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`
}

/** Method footer — method, grade, date and next measure on EVERY score (Principle 10). */
export function MethodLine({ method, grade, takenOn, next, signedBy, style }: { method: MethodVersion; grade?: Grade; takenOn?: string; next?: string; signedBy?: string; style?: StyleProp<ViewStyle> }) {
  const t = useDict(KIT)
  const lang = useLang()
  const parts = [t('method', { m: method })]
  if (grade) parts.push(t(grade === 'check' ? 'gradeCheck' : grade === 'index' ? 'gradeIndex' : 'gradeClinical'))
  if (takenOn) parts.push(t('measured', { d: fmtDate(takenOn, lang) }))
  if (next) parts.push(t('nextMeasureLine', { d: fmtDate(next, lang) }))
  if (signedBy) parts.push(t('signed', { who: signedBy }))
  return (
    <View style={style}>
      <Eyebrow>{parts.join(' · ')}</Eyebrow>
    </View>
  )
}

/** Specimen label — every mock number says it is not a real member. */
export function SpecimenTag({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c, radius } = useTheme()
  const t = useDict(KIT)
  return (
    <View
      style={[{ alignSelf: 'flex-start', borderWidth: 1, borderStyle: 'dashed', borderColor: c.lineStrong, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2, maxWidth: '100%' }, style]}
    >
      <Eyebrow size={11}>{t('specimen')}</Eyebrow>
    </View>
  )
}
