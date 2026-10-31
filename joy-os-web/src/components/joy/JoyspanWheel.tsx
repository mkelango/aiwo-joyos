import { motion, useReducedMotion } from 'framer-motion'
import { useId } from 'react'
import type { TermKey, TermScore } from '@/domain/types'
import { termColor } from '@/data/terms'
import { useDict, useTermText } from '@/lib/i18n'
import { SHARED } from '@/components/_i18n'
import { useBandText } from './primitives'

// The Joyspan Wheel (Brand Identity Playbook p45, p62, p65).
// Six fixed petals, clockwise from the top: Body, Purpose, People, Freedom, Pleasure, Ease.
// Each petal fills from the centre in proportion to its score over a pale ghost of
// itself; the Burden petal is hatched Amber and signed with a minus.
// VoiceOver reads each petal with term, score and band (Architecture p21).

const ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']
const SOFT: Record<TermKey, string> = {
  H: 'var(--term-h-soft)', P: 'var(--term-p-soft)', R: 'var(--term-r-soft)',
  F: 'var(--term-f-soft)', D: 'var(--term-d-soft)', B: 'var(--term-b-soft)',
}

interface Props {
  terms: TermScore[]
  size?: number
  value?: number | null
  showLabels?: boolean
  highlight?: TermKey | null
  onSelect?: (k: TermKey) => void
  animate?: boolean
  guide?: boolean
}

export function JoyspanWheel({ terms, size = 240, value, showLabels = false, highlight = null, onSelect, animate = true, guide = true }: Props) {
  const reduce = useReducedMotion()
  const tx = useDict(SHARED)
  const tt = useTermText()
  const bandText = useBandText()
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const pad = showLabels ? 56 : 4
  const box = size + pad * 2
  const c = box / 2
  const outer = size * 0.47
  const inner = size * 0.13 // petals start beyond the numeral
  const len = outer - inner

  const petalPath = (r0: number, r1: number) => {
    // vertical petal pointing up from (c, c - r0) to (c, c - r1)
    const w = (r1 - r0) * 0.3
    const y0 = c - r0
    const y1 = c - r1
    const ym = (y0 + y1) / 2
    return `M ${c} ${y0} C ${c + w} ${ym + (y0 - ym) * 0.4}, ${c + w} ${ym - (ym - y1) * 0.4}, ${c} ${y1} C ${c - w} ${ym - (ym - y1) * 0.4}, ${c - w} ${ym + (y0 - ym) * 0.4}, ${c} ${y0} Z`
  }

  const full = petalPath(inner, outer)
  // "Ease minus 24, steady" — the minus only belongs to a Burden that has a value.
  const readTerm = (k: TermKey, v: number | null, band?: TermScore['band']) =>
    v === null ? `${tt.name(k)} ${tx('bandNone')}` : `${tt.name(k)} ${k === 'B' ? tx('minus') : ''}${v}${band ? ', ' + bandText(band) : ''}`
  const describe = terms.map((t) => readTerm(t.key, t.value, t.band)).join('; ')
  const interactive = !!onSelect

  return (
    // A role=img makes its children presentational, so an interactive Wheel is a group:
    // the six petals are then exposed as toggle buttons.
    <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} role={interactive ? 'group' : 'img'} aria-label={`${tx('wheel')}${value != null ? tx('wheelIndex', { v: value }) : ''}. ${describe}`} className="h-auto max-w-full shrink-0">
      <defs>
        <pattern id={`hatch-${uid}`} width="4.5" height="4.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="4.5" height="4.5" fill="var(--term-b-soft)" />
          <rect width="2" height="4.5" fill="var(--term-b)" />
        </pattern>
      </defs>
      {guide && <circle cx={c} cy={c} r={outer + 6} fill="none" stroke="var(--wheel-guide)" />}
      {guide && <circle cx={c} cy={c} r={inner + len * 0.5} fill="none" stroke="var(--wheel-guide)" strokeDasharray="1 5" />}
      {ORDER.map((k, i) => {
        const t = terms.find((x) => x.key === k)
        const v = t?.value ?? null
        const isB = k === 'B'
        const deg = i * 60
        const fillTo = v === null ? 0 : inner + len * Math.max(0.06, v / 100)
        const dim = highlight !== null && highlight !== k
        const clipId = `clip-${uid}-${k}`
        return (
          <g
            key={k}
            transform={`rotate(${deg} ${c} ${c})`}
            opacity={dim ? 0.28 : 1}
            style={{ transition: 'opacity 240ms var(--ease-brand)', cursor: interactive ? 'pointer' : undefined }}
            onClick={interactive ? () => onSelect!(k) : undefined}
            onKeyDown={interactive ? (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect!(k)) : undefined}
            tabIndex={interactive ? 0 : undefined}
            role={interactive ? 'button' : undefined}
            aria-pressed={interactive ? highlight === k : undefined}
            aria-label={interactive ? `${tt.space(k)}: ${readTerm(k, v, t?.band)}` : undefined}
            className={interactive ? 'wheel-petal' : undefined}
          >
            <clipPath id={clipId}>
              <motion.circle
                cx={c}
                cy={c}
                initial={animate && !reduce ? { r: inner } : false}
                animate={{ r: fillTo }}
                transition={{ duration: 0.96, delay: 0.1 + i * 0.07, ease: [0.2, 0, 0, 1] }}
              />
            </clipPath>
            <path d={full} fill={v === null ? 'none' : SOFT[k]} stroke={v === null ? 'var(--ink-3)' : termColor[k]} strokeOpacity={v === null ? 0.6 : 0.35} strokeDasharray={v === null ? '3 3' : undefined} strokeWidth={0.8} />
            {v !== null && <path d={full} fill={isB ? `url(#hatch-${uid})` : termColor[k]} clipPath={`url(#${clipId})`} />}
            {/* Focus ring: outline on an SVG <g> is unreliable in Safari and Firefox, so the petal itself is stroked (index.css .wheel-petal). */}
            {interactive && <path d={full} fill="none" className="wheel-petal-ring" aria-hidden />}
          </g>
        )
      })}
      {value !== undefined && (
        <text aria-hidden x={c} y={c} textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-mono)" fontWeight={300} fontSize={size * 0.13} fill="var(--ink)">
          {value ?? '—'}
        </text>
      )}
      {showLabels &&
        ORDER.map((k, i) => {
          const t = terms.find((x) => x.key === k)
          const a = ((i * 60 - 90) * Math.PI) / 180
          const x = c + Math.cos(a) * (outer + 30)
          const y = c + Math.sin(a) * (outer + 30)
          return (
            <g key={`l-${k}`} aria-hidden>
              <text x={x} y={y - 7} textAnchor="middle" fontFamily="var(--font-sans)" fontSize={13} fill="var(--ink)">
                {tt.space(k)}
              </text>
              <text x={x} y={y + 10} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={12} fill="var(--ink-3)">
                {t?.value == null ? '—' : k === 'B' ? `−${t.value}` : t.value}
              </text>
            </g>
          )
        })}
    </svg>
  )
}
