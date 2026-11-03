import clsx from 'clsx'
import { Mic, Square, Volume2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui'
import { useDict, useLang } from '@/lib/i18n'
import type { Lang } from '@/lib/store'
import { useA11yPrefs } from './_prefs'
import { VOICE } from './_i18n'

// Voice-first (Settings · Accessibility, and elder mode in Household). Prompts are read aloud
// with the browser's own speech synthesis when it exists; where it does not, the words are shown
// instead, so the control always does something visible. Answering by speaking is simulated:
// no microphone is opened in this front end.

const SPEECH_LANG: Record<Lang, string> = { en: 'en-IN', ta: 'ta-IN', hi: 'hi-IN' }

function canSpeak() {
  try {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function'
  } catch {
    return false
  }
}

/** Read text aloud; `speaking` holds the words while they are being read. */
export function useSpeech() {
  const lang = useLang()
  const [speaking, setSpeaking] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const supported = canSpeak()
  const stop = useCallback(() => {
    window.clearTimeout(timer.current)
    try {
      if (canSpeak()) window.speechSynthesis.cancel()
    } catch {
      /* nothing to stop */
    }
    setSpeaking(null)
  }, [])
  const speak = useCallback(
    (text: string, as: Lang = lang) => {
      stop()
      setSpeaking(text)
      // Without speech the caption stays up for about as long as reading it would take.
      const fallback = () => { timer.current = window.setTimeout(() => setSpeaking(null), Math.max(2600, text.length * 70)) }
      if (!canSpeak()) return fallback()
      try {
        const u = new window.SpeechSynthesisUtterance(text)
        u.lang = SPEECH_LANG[as]
        u.rate = 0.92
        u.onend = () => setSpeaking(null)
        u.onerror = () => setSpeaking(null)
        window.speechSynthesis.speak(u)
      } catch {
        fallback()
      }
    },
    [lang, stop],
  )
  useEffect(() => stop, [stop])
  return { speak, stop, speaking, supported }
}

/** "Read aloud" for one prompt. Shown only while voice-first is on (Settings, or `on` for elder mode). */
export function ReadAloud({ text, label, on, lang, size = 'sm', className, captionClassName }: { text: string; label?: string; on?: boolean; lang?: Lang; size?: 'sm' | 'md'; className?: string; captionClassName?: string }) {
  const t = useDict(VOICE)
  const prefs = useA11yPrefs()
  const { speak, stop, speaking, supported } = useSpeech()
  if (!(on ?? prefs.voice)) return null
  return (
    <div className={clsx('flex flex-col items-start gap-2', className)}>
      <Button size={size} variant="secondary" aria-pressed={!!speaking} onClick={() => (speaking ? stop() : speak(text, lang))}>
        {speaking ? <Square size={14} /> : <Volume2 size={15} />} {speaking ? t('stopReading') : label ?? t('readAloud')}
      </Button>
      <div aria-live="polite" className="w-full">
        {speaking && (
          <p className={clsx('rounded-card border border-line bg-paper-sunk px-4 py-3 text-[15px] leading-relaxed text-ink', captionClassName)}>
            <span className="eyebrow mb-1 flex items-center gap-1.5 text-ink-3"><Volume2 size={12} aria-hidden /> {t('readingAloud')}</span>
            “{speaking}”
            {!supported && <span className="mt-1 block text-[13px] text-ink-3">{t('noSpeech')}</span>}
          </p>
        )}
      </div>
    </div>
  )
}

/** "Answer by speaking", simulated: a short listening state, then the specimen words are handed back. */
export function SpeakAnswer({ sample, onText, on, size = 'sm', className }: { sample: string; onText: (text: string) => void; on?: boolean; size?: 'sm' | 'md'; className?: string }) {
  const t = useDict(VOICE)
  const prefs = useA11yPrefs()
  const [listening, setListening] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  if (!(on ?? prefs.voice)) return null
  return (
    <div className={clsx('flex flex-col items-start gap-1.5', className)}>
      <Button
        size={size}
        variant="secondary"
        aria-pressed={listening}
        onClick={() => {
          if (listening) { window.clearTimeout(timer.current); setListening(false); return }
          setListening(true)
          timer.current = window.setTimeout(() => { setListening(false); onText(sample) }, 1600)
        }}
      >
        <Mic size={15} className={clsx(listening && 'animate-pulse motion-reduce:animate-none')} /> {listening ? t('listening') : t('speakAnswer')}
      </Button>
      <p aria-live="polite" className="text-[12px] text-ink-3">{listening ? t('listeningSpecimen') : ''}</p>
    </div>
  )
}
