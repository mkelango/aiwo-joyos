import type { Lang } from '@/lib/store'

// A room's formula (shared/terms formula) with its component words in the member's language.
// Letters, weights and instrument names (LE8, Ikigai-9, MLQ-P, UCLA-3, LSNS-6, SPANE-B) stay as written.
const WORDS: Record<string, readonly [ta: string, hi: string]> = {
  Capacity: ['திறன்', 'क्षमता'],
  'Self-rated': ['சுயமதிப்பீடு', 'स्वयं-आकलन'],
  Support: ['ஆதரவு', 'सहारा'],
  Autonomy: ['தன்னாட்சி', 'स्वायत्तता'],
  Time: ['நேரம்', 'समय'],
  'Financial WB': ['நிதி நலம்', 'वित्तीय कल्याण'],
  'Joy moments': ['மகிழ்ச்சித் தருணங்கள்', 'ख़ुशी के पल'],
  Savouring: ['ரசித்தல்', 'आनंद लेना'],
  Mood: ['மனநிலை', 'मनोदशा'],
  Sleep: ['தூக்கம்', 'नींद'],
  Stress: ['மன அழுத்தம்', 'तनाव'],
  Pain: ['வலி', 'दर्द'],
  Avoidance: ['தவிர்த்தல்', 'टालना'],
}

/** "H = 0.5·LE8 + 0.3·Capacity + …" with each component word translated; English is unchanged. */
export function formulaIn(formula: string, lang: Lang) {
  if (lang === 'en') return formula
  return formula.replace(/·([^+]+?)(?=\s\+|$)/g, (_, w: string) => `·${WORDS[w.trim()]?.[lang === 'ta' ? 0 : 1] ?? w}`)
}
