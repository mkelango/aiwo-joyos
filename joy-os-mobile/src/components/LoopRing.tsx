import { View } from 'react-native'
import Svg, { Circle, Text as SvgText } from 'react-native-svg'
import { useDict } from '../lib/i18n'
import { useTheme } from '../theme/ThemeProvider'
import { KIT } from './_i18n'

const MARKS = [15, 45, 60, 76, 90]

/** Day N of 90 — the loop is the heartbeat (Memo p.13). Milestones D15·45·60·76·90 as ticks. */
export function LoopRing({ day, of = 90, size = 64 }: { day: number; of?: number; size?: number }) {
  const { c, fonts } = useTheme()
  const t = useDict(KIT)
  const r = size / 2 - 4
  const circ = 2 * Math.PI * r
  const h = size / 2
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={t('loopDay', { n: day, of })}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={h} cy={h} r={r} fill="none" stroke={c.line} strokeWidth={3} />
        <Circle
          cx={h}
          cy={h}
          r={r}
          fill="none"
          stroke={c.daybreak}
          strokeWidth={3}
          strokeDasharray={`${(day / of) * circ} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${h} ${h})`}
        />
        {MARKS.map((m) => {
          const a = (m / of) * 2 * Math.PI - Math.PI / 2
          return <Circle key={m} cx={h + Math.cos(a) * r} cy={h + Math.sin(a) * r} r={2} fill={m <= day ? c.daybreak : c.ink3} />
        })}
        <SvgText x={h} y={h + size * 0.09} textAnchor="middle" fontFamily={fonts.mono} fontSize={size * 0.26} fill={c.ink}>
          {String(day)}
        </SvgText>
      </Svg>
    </View>
  )
}
