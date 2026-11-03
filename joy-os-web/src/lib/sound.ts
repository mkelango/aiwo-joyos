// Joy OS sound (Brand Identity Playbook p54): three sounds only, and silent by default.
//   action   · one soft note
//   complete · two notes, rising
//   morning  · the morning check-in: the Daybreak motif's first two notes
// Nothing plays unless the member has turned Sound on in Settings (joyos:acct:prefs, field
// `sound`, default false). The composed sound files are not in this specimen, so the notes
// are synthesised here with WebAudio: a soft sine with a slow attack and a long release, an
// octave partial for warmth, never a synthesiser stab. Every failure is silent.

export type SoundKind = 'action' | 'complete' | 'morning'

const PREFS_KEY = 'joyos:acct:prefs'

/** Is Sound on? Off unless the member turned it on (silent by default). */
export function soundOn(): boolean {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return false
    const p = JSON.parse(raw) as { sound?: unknown } | null
    return !!p && p.sound === true
  } catch {
    return false
  }
}

type Ctor = typeof AudioContext
let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const C: Ctor | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext
  if (!C) return null
  try {
    if (!ctx || ctx.state === 'closed') ctx = new C()
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined)
    return ctx
  } catch {
    return null
  }
}

/** One note: a sine with an octave partial, attack then exponential release. */
function note(ac: AudioContext, out: AudioNode, freq: number, at: number, dur: number, peak: number) {
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(peak, at + 0.035)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  g.connect(out)
  const partials: [OscillatorType, number, number][] = [
    ['sine', 1, 1],
    ['triangle', 2, 0.18],
  ]
  for (const [type, mult, level] of partials) {
    const o = ac.createOscillator()
    const pg = ac.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq * mult, at)
    pg.gain.value = level
    o.connect(pg)
    pg.connect(g)
    o.start(at)
    o.stop(at + dur + 0.05)
  }
}

// Sa, Re, Ga, Pa from C: the motif's four rising notes resolve on the fifth (p54).
const SA = 261.63
const RE = 293.66
const PA = 392.0
const SA2 = 523.25

/**
 * Play one of the three Joy OS sounds. Does nothing unless Sound is on, unless
 * `preview` is set (Settings plays a sample when the member asks to hear it).
 */
export function playSound(kind: SoundKind, opts?: { preview?: boolean }) {
  if (!opts?.preview && !soundOn()) return
  const ac = audio()
  if (!ac) return
  try {
    const out = ac.createGain()
    out.gain.value = 0.55
    out.connect(ac.destination)
    const t = ac.currentTime + 0.02
    if (kind === 'action') {
      note(ac, out, SA2 * 1.25, t, 0.5, 0.09) // one soft note
    } else if (kind === 'complete') {
      note(ac, out, PA, t, 0.45, 0.08) // two notes, rising
      note(ac, out, SA2, t + 0.16, 0.7, 0.08)
    } else {
      // The morning check-in: the motif's first two notes over a quiet drone.
      const drone = ac.createGain()
      drone.gain.setValueAtTime(0.0001, t)
      drone.gain.exponentialRampToValueAtTime(0.025, t + 0.4)
      drone.gain.exponentialRampToValueAtTime(0.0001, t + 2.2)
      drone.connect(out)
      const d = ac.createOscillator()
      d.type = 'sine'
      d.frequency.setValueAtTime(SA / 2, t)
      d.connect(drone)
      d.start(t)
      d.stop(t + 2.3)
      note(ac, out, SA, t + 0.05, 1.0, 0.075)
      note(ac, out, RE, t + 0.45, 1.6, 0.075)
    }
  } catch {
    /* audio unavailable: stay silent */
  }
}
