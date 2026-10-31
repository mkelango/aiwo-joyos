import { View, type StyleProp, type ViewStyle } from 'react-native'
import type { Grade, MethodVersion } from '../shared/types'
import { useTheme } from '../theme/ThemeProvider'
import { Eyebrow } from './Text'

export function fmtDate(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
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
  const parts = [`Method ${method}`]
  if (grade) parts.push(grade === 'check' ? 'Check' : grade === 'index' ? 'Index grade' : 'Clinical grade')
  if (takenOn) parts.push(`Measured ${fmtDate(takenOn)}`)
  if (next) parts.push(`Next measure ${fmtDate(next)}`)
  if (signedBy) parts.push(`Signed · ${signedBy}`)
  return (
    <View style={style}>
      <Eyebrow>{parts.join(' · ')}</Eyebrow>
    </View>
  )
}

/** Specimen label — every mock number says it is not a real member. */
export function SpecimenTag({ style }: { style?: StyleProp<ViewStyle> }) {
  const { c, radius } = useTheme()
  return (
    <View
      style={[{ alignSelf: 'flex-start', borderWidth: 1, borderStyle: 'dashed', borderColor: c.lineStrong, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 }, style]}
    >
      <Eyebrow size={11}>Specimen · not a real member</Eyebrow>
    </View>
  )
}
