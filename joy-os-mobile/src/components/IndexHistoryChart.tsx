import { useState } from 'react'
import { View } from 'react-native'
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg'
import type { Grade } from '../shared/types'
import { useTheme } from '../theme/ThemeProvider'
import { parseIsoDate } from './MethodLine'
import { Mono } from './Text'

export interface HistoryPoint {
  date: string
  value: number
  grade: Grade
}
export interface HistoryMarker {
  date: string
  /** Mono label at the top of the dashed line (e.g. "v1.0"). */
  label: string
  /** Solid hairline instead of dashed (the next measure). */
  solid?: boolean
}

/**
 * The Index across measures on a time axis, with method-change markers: a dashed line where a
 * new method was published, so a score made with the pilot weights is never read as if it had
 * been made with v1.0. Clinical grade is a filled diamond, Index grade an open circle (as on the
 * web). Ink only: the Spectrum is for the six terms.
 */
export function IndexHistoryChart({ points, markers = [], height = 150, min = 40, max = 80, label, edgeLabels }: { points: HistoryPoint[]; markers?: HistoryMarker[]; height?: number; min?: number; max?: number; label: string; edgeLabels?: [string, string] }) {
  const { c, fonts } = useTheme()
  const [w, setW] = useState(0)
  const ts = points.map((p) => parseIsoDate(p.date).getTime())
  const ms = markers.map((m) => parseIsoDate(m.date).getTime())
  const all = [...ts, ...ms]
  const pad = 1000 * 60 * 60 * 24 * 14
  const lo = Math.min(...all) - pad
  const hi = Math.max(...all) + pad
  const padX = 8
  const top = 22
  const bottom = 10
  const x = (t: number) => padX + ((t - lo) / Math.max(1, hi - lo)) * (w - padX * 2)
  const y = (v: number) => top + (1 - (Math.max(min, Math.min(max, v)) - min) / Math.max(1, max - min)) * (height - top - bottom)
  const order = points.map((p, i) => ({ p, t: ts[i] })).sort((a, b) => a.t - b.t)
  const d = order.map(({ p, t }, i) => `${i === 0 ? 'M' : 'L'}${x(t).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ gap: 6 }}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ height }}>
        {w > 0 ? (
          <Svg width={w} height={height}>
            <Line x1={padX} x2={w - padX} y1={height - 1} y2={height - 1} stroke={c.line} strokeWidth={1} />
            {markers.map((m, i) => {
              const mx = x(ms[i])
              const anchor = mx > w - 40 ? 'end' : mx < 40 ? 'start' : 'middle'
              return (
                <G key={`${m.label}-${m.date}`}>
                  <Line x1={mx} x2={mx} y1={top - 4} y2={height - 1} stroke={m.solid ? c.lineStrong : c.ink3} strokeWidth={1} strokeDasharray={m.solid ? undefined : '4 4'} />
                  <SvgText x={mx} y={12} textAnchor={anchor} fontFamily={fonts.mono} fontSize={11} fill={c.ink3}>
                    {m.label}
                  </SvgText>
                </G>
              )
            })}
            <Path d={d} stroke={c.ink} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            {order.map(({ p, t }) => {
              const cx = x(t)
              const cy = y(p.value)
              return p.grade === 'clinical' ? (
                <Rect key={p.date} x={cx - 5} y={cy - 5} width={10} height={10} fill={c.ink} stroke={c.paperRaised} strokeWidth={2} transform={`rotate(45 ${cx} ${cy})`} />
              ) : (
                <Circle key={p.date} cx={cx} cy={cy} r={5} fill={c.paperRaised} stroke={c.ink} strokeWidth={2} />
              )
            })}
          </Svg>
        ) : null}
      </View>
      {edgeLabels ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Mono size={12} tone="ink3">
            {edgeLabels[0]}
          </Mono>
          <Mono size={12} tone="ink3">
            {edgeLabels[1]}
          </Mono>
        </View>
      ) : null}
    </View>
  )
}

/** Legend glyphs for the chart (decorative; the words beside them carry the meaning). */
export function HistoryGlyph({ kind }: { kind: 'index' | 'clinical' | 'method' | 'next' }) {
  const { c } = useTheme()
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={14} height={14}>
      {kind === 'index' ? <Circle cx={7} cy={7} r={4.5} fill="none" stroke={c.ink} strokeWidth={2} /> : null}
      {kind === 'clinical' ? <Rect x={3.5} y={3.5} width={7} height={7} fill={c.ink} transform="rotate(45 7 7)" /> : null}
      {kind === 'method' ? <Line x1={7} x2={7} y1={0} y2={14} stroke={c.ink3} strokeWidth={1} strokeDasharray="3 3" /> : null}
      {kind === 'next' ? <Line x1={7} x2={7} y1={0} y2={14} stroke={c.lineStrong} strokeWidth={1} /> : null}
      </Svg>
    </View>
  )
}
