import Feather from '@expo/vector-icons/Feather'
import type { ComponentProps } from 'react'
import { useTheme } from '../theme/ThemeProvider'

export type IconName = ComponentProps<typeof Feather>['name']

/** Line icons (Feather — the lucide family used on the web). Decorative by default. */
export function Icon({ name, size = 20, color, accessibilityLabel }: { name: IconName; size?: number; color?: string; accessibilityLabel?: string }) {
  const { c } = useTheme()
  return (
    <Feather
      name={name}
      size={size}
      color={color ?? c.ink2}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'auto' : 'no-hide-descendants'}
      accessibilityElementsHidden={!accessibilityLabel}
    />
  )
}
