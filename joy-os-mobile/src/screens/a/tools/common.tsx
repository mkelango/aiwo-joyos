import type { ReactNode } from 'react'
import { View } from 'react-native'
import { Card, Eyebrow, Meta, type CardTone } from '@/components'
import { useTheme } from '@/theme/ThemeProvider'
import { H2, H3 } from '../local'

/** A tool block inside a space: mono kicker, one sentence that says what it shows, content. */
export function ToolCard({ title, aside, lead, children, tone = 'raised' }: { title: string; aside?: ReactNode; lead?: string; children: ReactNode; tone?: CardTone }) {
  const { space } = useTheme()
  return (
    <Card tone={tone} style={{ gap: space.s2 }}>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <Eyebrow {...H3}>{title}</Eyebrow>
          {aside}
        </View>
        {lead ? <Meta>{lead}</Meta> : null}
      </View>
      {children}
    </Card>
  )
}

/** Section kicker between tool cards. */
export function ToolsHeading({ children }: { children: string }) {
  return (
    <Eyebrow {...H2} style={{ marginBottom: -8 }}>
      {children}
    </Eyebrow>
  )
}

export const shortDate = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}
