import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { useTheme } from '../theme/ThemeProvider'
import { Body, Meta } from './Text'

/** Toggle — a labelled switch row. The whole row is the touch target (VoiceOver: "switch, on"). */
export function Toggle({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: ReactNode; disabled?: boolean }) {
  const { c } = useTheme()
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled: !!disabled }}
      // react-native-web drops accessibilityState, so say it in ARIA too.
      aria-checked={checked}
      aria-disabled={!!disabled}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, minHeight: 44, opacity: disabled ? 0.5 : pressed ? 0.8 : 1 })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Body>{label}</Body>
        {description ? typeof description === 'string' ? <Meta>{description}</Meta> : description : null}
      </View>
      <View style={{ width: 52, height: 32, borderRadius: 16, padding: 4, marginTop: 2, backgroundColor: checked ? c.ink : c.lineStrong, alignItems: checked ? 'flex-end' : 'flex-start' }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c.paper }} />
      </View>
    </Pressable>
  )
}
