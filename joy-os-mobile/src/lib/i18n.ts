import { useApp, type Lang } from './store'
import type { TermKey } from '../shared/types'

// English first; Tamil and Hindi from J3 (Memo p.8). Navigation and the core
// Today strings are translated here as a working sample; instrument items need
// forward–back translation and are not machine-translated.
const STRINGS = {
  today: { en: 'Today', ta: 'இன்று', hi: 'आज' },
  spaces: { en: 'Spaces', ta: 'இடங்கள்', hi: 'स्पेस' },
  cation: { en: '’Cation', ta: '’கேஷன்', hi: '’केशन' },
  practice: { en: 'Practice', ta: 'பயிற்சி', hi: 'अभ्यास' },
  care: { en: 'Care', ta: 'கவனிப்பு', hi: 'देखभाल' },
  yourJoyspan: { en: 'Your Joyspan', ta: 'உங்கள் ஜாய்ஸ்பான்', hi: 'आपका जॉयस्पैन' },
  dayOf: { en: 'Day {n} of 90', ta: '90 இல் நாள் {n}', hi: '90 में से दिन {n}' },
  doneForToday: { en: 'Done for today', ta: 'இன்றைக்கு முடிந்தது', hi: 'आज के लिए पूरा' },
  notToday: { en: 'Not today', ta: 'இன்று வேண்டாம்', hi: 'आज नहीं' },
  nextMeasure: { en: 'Next measure', ta: 'அடுத்த அளவீடு', hi: 'अगला माप' },
  ledgerPrompt: { en: 'Anything good in the last few hours?', ta: 'கடந்த சில மணிநேரங்களில் ஏதாவது நல்லது நடந்ததா?', hi: 'पिछले कुछ घंटों में कुछ अच्छा हुआ?' },
  trust: { en: 'Who has seen my data · Export · Delete', ta: 'என் தரவை யார் பார்த்தார்கள் · ஏற்றுமதி · நீக்கு', hi: 'मेरा डेटा किसने देखा · निर्यात · हटाएँ' },
} satisfies Record<string, Record<Lang, string>>

export type StringKey = keyof typeof STRINGS

export function useT() {
  const { lang } = useApp()
  return (key: StringKey, vars?: Record<string, string | number>) => {
    let s: string = STRINGS[key][lang] ?? STRINGS[key].en
    return fill(s, vars)
  }
}

// Per-screen dictionaries. Each area keeps its own `{ key: { en, ta, hi } }` object next to
// its screens and reads it with useDict, so screens translate without one giant file.
// What stays English by design: instrument items (validated wording, forward–back
// translation pending), people's own words (messages, notes, circle chat) and brand names.
export type Dict = Record<string, Record<Lang, string>>

export function fill(s: string, vars?: Record<string, string | number>) {
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
  return s
}

export function useLang(): Lang {
  return useApp().lang
}

export function useDict<D extends Dict>(dict: D) {
  const { lang } = useApp()
  return (key: keyof D & string, vars?: Record<string, string | number>) => fill(dict[key][lang] ?? dict[key].en, vars)
}

// The six terms and their Spaces, one translation everywhere.
export const TERM_TEXT: Record<TermKey, { name: Record<Lang, string>; space: Record<Lang, string> }> = {
  H: { name: { en: 'Healthspan', ta: 'ஆரோக்கிய ஆயுள்', hi: 'स्वस्थ आयु' }, space: { en: 'Body', ta: 'உடல்', hi: 'शरीर' } },
  P: { name: { en: 'Purpose', ta: 'நோக்கம்', hi: 'उद्देश्य' }, space: { en: 'Purpose', ta: 'நோக்கம்', hi: 'उद्देश्य' } },
  R: { name: { en: 'Relationships', ta: 'உறவுகள்', hi: 'रिश्ते' }, space: { en: 'People', ta: 'மனிதர்கள்', hi: 'लोग' } },
  F: { name: { en: 'Freedom', ta: 'சுதந்திரம்', hi: 'स्वतंत्रता' }, space: { en: 'Freedom', ta: 'சுதந்திரம்', hi: 'स्वतंत्रता' } },
  D: { name: { en: 'Daily Pleasure', ta: 'தினசரி மகிழ்ச்சி', hi: 'रोज़ का आनंद' }, space: { en: 'Pleasure', ta: 'மகிழ்ச்சி', hi: 'आनंद' } },
  B: { name: { en: 'Preventable Suffering', ta: 'தவிர்க்கக்கூடிய துன்பம்', hi: 'टाला जा सकने वाला कष्ट' }, space: { en: 'Ease', ta: 'நிம்மதி', hi: 'सहजता' } },
}

export function useTermText() {
  const { lang } = useApp()
  return { name: (k: TermKey) => TERM_TEXT[k].name[lang], space: (k: TermKey) => TERM_TEXT[k].space[lang] }
}

// Shown wherever a questionnaire stays in English.
export const INSTRUMENT_NOTE: Record<Lang, string> = {
  en: '',
  ta: 'இந்தக் கேள்வித்தாள் சரிபார்க்கப்பட்ட தமிழ் மொழிபெயர்ப்பு வெளியாகும் வரை ஆங்கிலத்தில் இருக்கும்.',
  hi: 'यह प्रश्नावली प्रमाणित हिन्दी अनुवाद आने तक अंग्रेज़ी में रहेगी।',
}

export const LANGS: { value: Lang; label: string; native: string }[] = [
  { value: 'en', label: 'English', native: 'English' },
  { value: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { value: 'hi', label: 'Hindi', native: 'हिन्दी' },
]
