import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Body, Eyebrow, Icon, Meta, Mono, Toggle, type IconName } from '@/components'
import { useDict } from '@/lib/i18n'
import { IconButton, fmtTime } from '@/screens/b/parts'
import { PARTS } from '@/screens/b/i18n/parts'
import { useTheme } from '@/theme/ThemeProvider'
import { useLocal } from './local'

// The Mentor's five-minute audio for the Practice tab — simulated playback, transcript and an
// offline download whose state is kept on the phone per week (AsyncStorage via useLocal), so a
// saved week stays saved after leaving the screen and a download in progress resumes on return.

/** Week number → download progress (0–100). A week with no entry is not kept for offline. */
export function useOfflineAudio() {
  const [weeks, setWeeks, ready] = useLocal<Record<string, number>>('audioOffline', {})
  const set = (week: number, on: boolean) =>
    setWeeks((all) => {
      const next = { ...all }
      if (on) next[String(week)] = next[String(week)] ?? 0
      else delete next[String(week)]
      return next
    })
  const step = (week: number) => setWeeks((all) => (String(week) in all ? { ...all, [String(week)]: Math.min(100, (all[String(week)] ?? 0) + 20) } : all))
  return { weeks, set, step, ready }
}

export function AudioPlayer({ week, title, seconds, transcript, startAt = 0 }: { week: number; title: string; seconds: number; transcript: string[]; startAt?: number }) {
  const { c, space, radius } = useTheme()
  const t = useDict(PARTS)
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(startAt)
  const [rate, setRate] = useState<1 | 1.25 | 0.8>(1)
  const [showText, setShowText] = useState(false)
  const offline = useOfflineAudio()
  const kept = String(week) in offline.weeks
  const downloading = offline.weeks[String(week)] ?? 0
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setPos(startAt)
    setPlaying(false)
  }, [week, startAt])

  useEffect(() => {
    if (!playing) return
    timer.current = setInterval(() => {
      setPos((p) => {
        const next = p + rate
        if (next >= seconds) {
          setPlaying(false)
          return seconds
        }
        return next
      })
    }, 1000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [playing, rate, seconds])

  // The simulated download advances while this screen is open and picks up where it left off.
  useEffect(() => {
    if (!kept || downloading >= 100) return
    const tm = setTimeout(() => offline.step(week), 180)
    return () => clearTimeout(tm)
  }, [kept, downloading, week]) // eslint-disable-line react-hooks/exhaustive-deps

  const pct = (pos / seconds) * 100
  const active = Math.min(transcript.length - 1, Math.floor((pos / seconds) * transcript.length))
  const bars = useMemo(() => Array.from({ length: 40 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7 + week) * Math.cos(i * 0.31)) * 0.75), [week])

  return (
    <View style={{ gap: space.s2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s2 }}>
        <IconButton
          icon={playing ? 'pause' : 'play'}
          label={playing ? t('pause') : t('play', { title })}
          filled
          size={56}
          onPress={() => {
            if (pos >= seconds) setPos(0)
            setPlaying((p) => !p)
          }}
        />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, height: 36 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {bars.map((b, i) => (
              <View key={i} style={{ flex: 1, height: `${b * 100}%`, borderRadius: 2, backgroundColor: (i / bars.length) * 100 < pct ? c.ink : c.lineStrong }} />
            ))}
          </View>
          <View accessible accessibilityRole="progressbar" accessibilityLabel={t('played', { pos: fmtTime(pos), total: fmtTime(seconds) })} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Mono size={12} tone="ink3">
              {fmtTime(pos)}
            </Mono>
            <Mono size={12} tone="ink3">{`−${fmtTime(seconds - pos)}`}</Mono>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s1 }}>
        <SmallPill icon="rotate-ccw" label="15 s" a11y={t('back15')} onPress={() => setPos((p) => Math.max(0, p - 15))} />
        <SmallPill label={`${rate}×`} a11y={t('speed', { rate })} onPress={() => setRate((r) => (r === 1 ? 1.25 : r === 1.25 ? 0.8 : 1))} mono />
        <SmallPill icon={showText ? 'chevron-up' : 'chevron-down'} label={t('transcript')} a11y={showText ? t('hideTranscript') : t('showTranscript')} onPress={() => setShowText((s) => !s)} />
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: c.line, paddingTop: space.s2 }}>
        <Toggle
          checked={kept}
          onChange={(v) => offline.set(week, v)}
          label={t('offline')}
          description={kept ? (downloading < 100 ? t('downloading', { pct: downloading }) : t('savedDevice')) : t('downloadHint')}
        />
      </View>
      {showText ? (
        <View style={{ backgroundColor: c.paperSunk, borderRadius: radius.card, padding: space.s2, gap: space.s1 }}>
          <Eyebrow>{t('transcriptFollows')}</Eyebrow>
          {transcript.map((line, i) => (
            <Body key={i} tone={i === active && pos > 0 ? 'ink' : 'ink2'}>
              {line}
            </Body>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function SmallPill({ icon, label, a11y, onPress, mono }: { icon?: IconName; label: string; a11y: string; onPress: () => void; mono?: boolean }) {
  const { c, radius } = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: c.line, backgroundColor: pressed ? c.paperSunk : undefined })}
    >
      {icon ? <Icon name={icon} size={14} color={c.ink2} /> : null}
      {mono ? <Mono tone="ink2">{label}</Mono> : <Meta>{label}</Meta>}
    </Pressable>
  )
}
