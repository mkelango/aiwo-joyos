import * as Haptics from 'expo-haptics'
import { Platform } from 'react-native'

// Sound (Brand Identity Playbook p54): Joy OS has three sounds only.
//   action   · one soft note (the day's one action marked done)
//   complete · two rising notes (a Ledger moment saved, the Index sent)
//   morning  · the morning check-in, the Daybreak motif's first two notes
// Silent by default. Nothing plays unless the member has turned Sound on in Settings
// (useApp().sound); the store keeps this module's switch in step with that preference.
// Phone build: there is no audio module in this app, so each sound is felt as a haptic.
// Web build: a short WebAudio tone (sine, soft attack, no synthesiser stabs).

export type SoundKind = 'action' | 'complete' | 'morning'

let enabled = false

/** Called by AppProvider whenever the Sound preference changes. */
export function setSoundEnabled(v: boolean) {
  enabled = v
}

export function soundEnabled() {
  return enabled
}

// Notes in Hz. The motif rises a fifth; the action note sits between.
const NOTES: Record<SoundKind, { f: number; at: number; dur: number }[]> = {
  action: [{ f: 659.25, at: 0, dur: 0.22 }],
  complete: [
    { f: 523.25, at: 0, dur: 0.16 },
    { f: 783.99, at: 0.14, dur: 0.26 },
  ],
  morning: [
    { f: 392.0, at: 0, dur: 0.5 },
    { f: 587.33, at: 0.4, dur: 0.9 },
  ],
}

type AudioCtor = typeof AudioContext
let ctx: AudioContext | null = null

function webTone(kind: SoundKind) {
  if (typeof window === 'undefined') return
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor }
  const Ctor = w.AudioContext ?? w.webkitAudioContext
  if (!Ctor) return
  try {
    ctx = ctx ?? new Ctor()
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    const now = ctx.currentTime + 0.01
    for (const n of NOTES[kind]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = n.f
      const t0 = now + n.at
      const peak = kind === 'morning' ? 0.05 : 0.07
      // Soft attack and a long settle: a note, never a beep.
      gain.gain.setValueAtTime(0.0001, t0)
      gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.06, n.dur / 3))
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + n.dur + 0.05)
    }
  } catch {
    /* audio unavailable: stay silent */
  }
}

function haptic(kind: SoundKind) {
  try {
    if (kind === 'action') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {})
    else if (kind === 'complete') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {}), 400)
    }
  } catch {
    /* no haptics engine */
  }
}

/**
 * Play one of the three sounds. Does nothing unless Sound is on.
 * `preview` plays it regardless, for the Settings preview the member asks for.
 */
export function playSound(kind: SoundKind, opts?: { preview?: boolean }) {
  if (!enabled && !opts?.preview) return
  if (Platform.OS === 'web') webTone(kind)
  else haptic(kind)
}
