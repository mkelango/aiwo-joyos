import { useApp, type Lang } from './store'

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
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v))
    return s
  }
}

export const LANGS: { value: Lang; label: string; native: string }[] = [
  { value: 'en', label: 'English', native: 'English' },
  { value: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { value: 'hi', label: 'Hindi', native: 'हिन्दी' },
]
