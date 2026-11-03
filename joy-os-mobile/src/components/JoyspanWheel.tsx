import { useContext, useEffect, useState } from 'react'
import { Pressable, View, useWindowDimensions } from 'react-native'
import Svg, { Circle, ClipPath, Defs, G, Path, Text as SvgText } from 'react-native-svg'
import { TERM_TEXT, useLang } from '../lib/i18n'
import { useReduceMotion, type Lang } from '../lib/store'
import type { TermKey, TermScore } from '../shared/types'
import { useTheme } from '../theme/ThemeProvider'
import { palettes, termColors } from '../theme/tokens'
import { HatchPattern, useSvgId } from './Term'
import { InkSurface } from './Text'
import { kit, type KitKey } from './_i18n'

// The Joyspan Wheel (Brand Identity Playbook p45, p62, p65) — react-native-svg port of
// joy-os-web/src/components/joy/JoyspanWheel.tsx.
// Six fixed petals, clockwise from the top: Body, Purpose, People, Freedom, Pleasure, Ease.
// Each petal fills from the centre in proportion to its score over a pale ghost of itself;
// the Burden petal is hatched Amber and signed with a minus. The fill blooms over 960 ms
// (skipped under Reduce Motion, the system's or the member's own). VoiceOver reads each petal with term, score and band
// (Architecture p21): one image label listing all six, or one button per petal when onSelect.
// With `baseline` (the Day-0 measure) each petal also carries the Day-0 outline: a 14% Ink
// ghost of where that petal stood at the start of the ninety days (Playbook p45), read aloud too.

export const WHEEL_ORDER: TermKey[] = ['H', 'P', 'R', 'F', 'D', 'B']

interface Props {
  terms: TermScore[]
  size?: number
  /** Index numeral in the centre (Mono 300). Omit to leave the centre clear. */
  value?: number | null
  showLabels?: boolean
  highlight?: TermKey | null
  onSelect?: (k: TermKey) => void
  animate?: boolean
  guide?: boolean
  /** The Day-0 terms. Draws the 14% Ink outline of each petal's Day-0 extent. */
  baseline?: TermScore[] | null
}

const ease = (x: number) => 1 - Math.pow(1 - x, 3)

function useBloom(enabled: boolean) {
  // Reduce motion (the member's own setting or the system one) skips the bloom entirely.
  const reduce = useReduceMotion()
  const [p, setP] = useState(enabled && !reduce ? 0 : 1)
  useEffect(() => {
    if (!enabled) return
    if (reduce) {
      setP(1)
      return
    }
    let raf = 0
    let alive = true
    let start = 0
    const total = 960 + 100 + 5 * 70
    const step = (ts: number) => {
      if (!alive) return
      if (!start) start = ts
      const t = Math.min(1, (ts - start) / total)
      setP(t)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [enabled, reduce])
  return p
}

const BAND_KEY: Record<string, KitKey> = { steady: 'bandSteady', uneven: 'bandUneven', thin: 'bandThin', 'not-yet-measured': 'bandNone' }

function petalLabel(lang: Lang, k: TermKey, tv: TermScore | undefined, nullSep = ', ', base?: TermScore) {
  const head = `${TERM_TEXT[k].space[lang]}, ${TERM_TEXT[k].name[lang]}`
  if (!tv || tv.value === null) return `${head}${nullSep}${kit(lang, 'notYetMeasured')}`
  const band = BAND_KEY[tv.band] ? kit(lang, BAND_KEY[tv.band]) : tv.band
  const day0 = base && base.value !== null ? kit(lang, 'wheelDay0', { v: `${k === 'B' ? kit(lang, 'minus') : ''}${base.value}` }) : ''
  return `${head} ${k === 'B' ? kit(lang, 'minus') : ''}${tv.value}, ${band}${day0}`
}

export function describeWheel(terms: TermScore[], value?: number | null, lang: Lang = 'en', baseline?: TermScore[] | null) {
  const parts = WHEEL_ORDER.map((k) => petalLabel(lang, k, terms.find((x) => x.key === k), ', ', baseline?.find((x) => x.key === k)))
  return `${kit(lang, 'wheel')}${value != null ? kit(lang, 'wheelIndex', { v: value }) : ''}. ${parts.join('; ')}.`
}

export function JoyspanWheel({ terms, size = 240, value, showLabels = false, highlight = null, onSelect, animate = true, guide = true, baseline = null }: Props) {
  const t = useTheme()
  // On a warm Ink ground (Day 90) the Wheel takes the dark palette's soft tints, guides and ghost.
  const onInk = useContext(InkSurface)
  const c = onInk ? palettes.dark : t.c
  const term = (k: TermKey) => (onInk ? termColors(palettes.dark, k) : t.term(k))
  const { fonts } = t
  const uid = useSvgId('wheel')
  const lang = useLang()
  const progress = useBloom(animate)
  const pad = showLabels ? 56 : 4
  const box = size + pad * 2
  const cx = box / 2
  const outer = size * 0.47
  const inner = size * 0.13 // petals start beyond the numeral
  const len = outer - inner

  const petalPath = (r0: number, r1: number) => {
    // vertical petal pointing up from (cx, cx - r0) to (cx, cx - r1)
    const w = (r1 - r0) * 0.3
    const y0 = cx - r0
    const y1 = cx - r1
    const ym = (y0 + y1) / 2
    return `M ${cx} ${y0} C ${cx + w} ${ym + (y0 - ym) * 0.4}, ${cx + w} ${ym - (ym - y1) * 0.4}, ${cx} ${y1} C ${cx - w} ${ym - (ym - y1) * 0.4}, ${cx - w} ${ym + (y0 - ym) * 0.4}, ${cx} ${y0} Z`
  }
  const full = petalPath(inner, outer)
  const interactive = !!onSelect

  // With labels the box is size + 112, wider than a 360pt phone's content column (check.tsx at
  // size 220 is a 332pt box in 320pt). Scale the whole Wheel down to fit: the window's content
  // width (Screen caps it at 640 with a gutter each side), then whatever the parent really gives
  // us (measured on layout, since cards add their own padding). The viewBox stays the same.
  const { width: winW } = useWindowDimensions()
  const [fit, setFit] = useState(1)
  useEffect(() => setFit(1), [box])
  const avail = Math.min(winW, 640) - 2 * t.space.gutter
  const scale = Math.min(1, avail > 0 ? avail / box : 1, fit)
  const px = box * scale

  return (
    <View
      accessible={!interactive}
      accessibilityRole={interactive ? undefined : 'image'}
      accessibilityLabel={interactive ? undefined : describeWheel(terms, value, lang, baseline)}
      style={{ width: px, height: px, maxWidth: '100%' }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        // maxWidth clamped us: shrink to the width we were given.
        if (w > 0 && w < px - 0.5) setFit(Math.min(1, w / box))
      }}
    >
      <Svg width={px} height={px} viewBox={`0 0 ${box} ${box}`}>
        <Defs>
          <HatchPattern id={`${uid}-hatch`} main={c.termB} soft={c.termBSoft} />
          {baseline ? (
            <ClipPath id={`${uid}-petal`}>
              <Path d={full} />
            </ClipPath>
          ) : null}
          {baseline
            ? WHEEL_ORDER.map((k) => {
                const b = baseline.find((x) => x.key === k)?.value ?? null
                if (b === null) return null
                return (
                  <ClipPath key={`b-${k}`} id={`${uid}-base-${k}`}>
                    <Circle cx={cx} cy={cx} r={inner + len * Math.max(0.06, b / 100)} />
                  </ClipPath>
                )
              })
            : null}
          {WHEEL_ORDER.map((k, i) => {
            const v = terms.find((x) => x.key === k)?.value ?? null
            const target = v === null ? 0 : inner + len * Math.max(0.06, v / 100)
            const local = Math.max(0, Math.min(1, (progress * (960 + 450) - 100 - i * 70) / 960))
            const r = inner + (target - inner) * ease(local)
            return (
              <ClipPath key={k} id={`${uid}-clip-${k}`}>
                <Circle cx={cx} cy={cx} r={Math.max(0, r)} />
              </ClipPath>
            )
          })}
        </Defs>
        {guide && <Circle cx={cx} cy={cx} r={outer + 6} fill="none" stroke={c.wheelGuide} strokeWidth={1} />}
        {guide && <Circle cx={cx} cy={cx} r={inner + len * 0.5} fill="none" stroke={c.wheelGuide} strokeWidth={1} strokeDasharray="1 5" />}
        {WHEEL_ORDER.map((k, i) => {
          const v = terms.find((x) => x.key === k)?.value ?? null
          const col = term(k)
          const dim = highlight !== null && highlight !== k
          const b = baseline?.find((x) => x.key === k)?.value ?? null
          const rb = b === null ? 0 : inner + len * Math.max(0.06, b / 100)
          return (
            <G key={k} transform={`rotate(${i * 60} ${cx} ${cx})`} opacity={dim ? 0.28 : 1}>
              <Path
                d={full}
                fill={v === null ? 'none' : col.soft}
                stroke={v === null ? c.ink3 : col.main}
                strokeOpacity={v === null ? 0.6 : 0.35}
                strokeDasharray={v === null ? '3 3' : undefined}
                strokeWidth={0.8}
              />
              {/* Day-0 ghost, under the fill: where the petal stood at the start. */}
              {b !== null && <Path d={full} fill={c.wheelGhost} clipPath={`url(#${uid}-base-${k})`} />}
              {v !== null && <Path d={full} fill={k === 'B' ? `url(#${uid}-hatch)` : col.main} clipPath={`url(#${uid}-clip-${k})`} />}
              {/* ...and its outline across the petal, over the fill, so a rise shows the line it passed. */}
              {b !== null && <Circle cx={cx} cy={cx} r={rb} fill="none" stroke={c.wheelGhost} strokeWidth={1.5} clipPath={`url(#${uid}-petal)`} />}
            </G>
          )
        })}
        {value !== undefined && (
          <SvgText x={cx} y={cx + size * 0.045} textAnchor="middle" fontFamily={fonts.monoLight} fontSize={size * 0.13} fill={c.ink}>
            {value == null ? '—' : String(value)}
          </SvgText>
        )}
        {showLabels &&
          WHEEL_ORDER.map((k, i) => {
            const tv = terms.find((x) => x.key === k)
            const a = ((i * 60 - 90) * Math.PI) / 180
            const x = cx + Math.cos(a) * (outer + 30)
            const y = cx + Math.sin(a) * (outer + 30)
            return (
              <G key={`l-${k}`}>
                <SvgText x={x} y={y - 4} textAnchor="middle" fontFamily={fonts.sans} fontSize={13} fill={c.ink}>
                  {TERM_TEXT[k].space[lang]}
                </SvgText>
                <SvgText x={x} y={y + 12} textAnchor="middle" fontFamily={fonts.mono} fontSize={12} fill={c.ink3}>
                  {tv?.value == null ? '—' : k === 'B' ? `−${tv.value}` : String(tv.value)}
                </SvgText>
              </G>
            )
          })}
      </Svg>
      {interactive &&
        WHEEL_ORDER.map((k, i) => {
          const tv = terms.find((x) => x.key === k)
          const a = ((i * 60 - 90) * Math.PI) / 180
          const rr = inner + len * 0.55
          const hit = Math.max(44, len * 0.62 * scale)
          return (
            <Pressable
              key={`hit-${k}`}
              onPress={() => onSelect!(k)}
              accessibilityRole="button"
              accessibilityLabel={petalLabel(lang, k, tv, ' ', baseline?.find((x) => x.key === k))}
              accessibilityState={{ selected: highlight === k }}
              aria-selected={highlight === k}
              style={{ position: 'absolute', left: (cx + Math.cos(a) * rr) * scale - hit / 2, top: (cx + Math.sin(a) * rr) * scale - hit / 2, width: hit, height: hit, borderRadius: hit / 2 }}
            />
          )
        })}
    </View>
  )
}
