import type { Lang } from '@/lib/store'
import type { L } from './_i18n'

// Member core lane: data words in the member's language that the dictionaries do not hold.
// Formula component words (the codes, weights and instrument abbreviations stay as
// written: LE8, SPANE-B, UCLA-3), and the coach library's actions and override reasons as
// the member sees them on Today. English is the source and is returned unchanged.

/** Component words inside a term formula ('H = 0.5·LE8 + 0.3·Capacity + 0.2·Self-rated'). */
const FORMULA_WORDS: Record<string, Record<'ta' | 'hi', string>> = {
  'Financial WB': { ta: 'நிதி நலம்', hi: 'वित्तीय कल्याण' },
  'Joy moments': { ta: 'மகிழ்ச்சித் தருணங்கள்', hi: 'ख़ुशी के पल' },
  'Self-rated': { ta: 'சுய மதிப்பீடு', hi: 'ख़ुद आँकी गई' },
  Capacity: { ta: 'திறன்', hi: 'क्षमता' },
  Support: { ta: 'ஆதரவு', hi: 'सहारा' },
  Savouring: { ta: 'ரசித்தல்', hi: 'रस लेना' },
  Mood: { ta: 'மனநிலை', hi: 'मनोदशा' },
  Sleep: { ta: 'தூக்கம்', hi: 'नींद' },
  Stress: { ta: 'மன அழுத்தம்', hi: 'तनाव' },
  Pain: { ta: 'வலி', hi: 'दर्द' },
  Avoidance: { ta: 'தவிர்த்தல்', hi: 'टालना' },
  Autonomy: { ta: 'சுயாட்சி', hi: 'स्वायत्तता' },
  Time: { ta: 'நேரம்', hi: 'समय' },
}
// Longest first, so 'Financial WB' is replaced before any shorter word inside it.
const FORMULA_RE = new RegExp(
  `(·)(${Object.keys(FORMULA_WORDS)
    .sort((a, b) => b.length - a.length)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})(?![\\w-])`,
  'g',
)

/** A term formula with its component words in the member's language; codes and numbers stay. */
export function formulaText(formula: string, lang: Lang) {
  if (lang === 'en') return formula
  return formula.replace(FORMULA_RE, (_m, dot: string, w: string) => dot + (FORMULA_WORDS[w]?.[lang] ?? w))
}

/** The coach library's actions (console/care CURATED_ACTIONS), by their English title. */
export const COACH_ACTION_TEXT: Record<string, L> = {
  'A ten-minute walk after lunch.': { en: 'A ten-minute walk after lunch.', ta: 'மதிய உணவுக்குப் பிறகு பத்து நிமிட நடை.', hi: 'दोपहर के खाने के बाद दस मिनट की सैर।' },
  'Take the stairs for one floor, twice today.': { en: 'Take the stairs for one floor, twice today.', ta: 'இன்று இரண்டு முறை, ஒரு மாடி படிக்கட்டில் ஏறுங்கள்.', hi: 'आज दो बार, एक मंज़िल सीढ़ियों से चढ़ें।' },
  'Name one thing you did today that mattered to someone.': { en: 'Name one thing you did today that mattered to someone.', ta: 'இன்று யாரோ ஒருவருக்கு முக்கியமாக இருந்த, நீங்கள் செய்த ஒன்றைச் சொல்லுங்கள்.', hi: 'आज आपने जो किया, उसमें से एक बात बताएँ जो किसी के लिए मायने रखती थी।' },
  'Spend ten minutes teaching someone a thing you know well.': { en: 'Spend ten minutes teaching someone a thing you know well.', ta: 'உங்களுக்கு நன்றாகத் தெரிந்த ஒன்றை ஒருவருக்குப் பத்து நிமிடம் கற்றுக்கொடுங்கள்.', hi: 'जो चीज़ आप अच्छी तरह जानते हैं, वह किसी को दस मिनट सिखाएँ।' },
  'Walk with one person, phones away.': { en: 'Walk with one person, phones away.', ta: 'ஃபோன்களைத் தள்ளிவைத்து, ஒருவருடன் நடங்கள்.', hi: 'फ़ोन दूर रखकर, किसी एक के साथ सैर करें।' },
  'Send one specific thank-you message.': { en: 'Send one specific thank-you message.', ta: 'குறிப்பிட்ட ஒரு நன்றிச் செய்தியை அனுப்புங்கள்.', hi: 'एक ख़ास धन्यवाद संदेश भेजें।' },
  'Protect one unhurried morning.': { en: 'Protect one unhurried morning.', ta: 'அவசரமில்லாத ஒரு காலையைக் காத்துக்கொள்ளுங்கள்.', hi: 'एक इत्मीनान भरी सुबह बचाकर रखें।' },
  'Hand off one chore you dislike this week.': { en: 'Hand off one chore you dislike this week.', ta: 'இந்த வாரம் உங்களுக்குப் பிடிக்காத ஒரு வேலையை வேறொருவரிடம் ஒப்படையுங்கள்.', hi: 'इस हफ़्ते एक नापसंद काम किसी और को सौंप दें।' },
  'Savour one meal without a screen.': { en: 'Savour one meal without a screen.', ta: 'திரை இல்லாமல் ஒரு உணவை நிதானமாக ரசியுங்கள்.', hi: 'एक भोजन बिना स्क्रीन के, रस लेकर खाएँ।' },
  'Three good things before sleep.': { en: 'Three good things before sleep.', ta: 'தூங்கும் முன் மூன்று நல்ல விஷயங்கள்.', hi: 'सोने से पहले तीन अच्छी बातें।' },
  'Same wake time, seven days.': { en: 'Same wake time, seven days.', ta: 'ஏழு நாட்களும் ஒரே நேரத்தில் எழுந்திருங்கள்.', hi: 'सातों दिन एक ही समय पर जागें।' },
  'Six slow breaths before the first meeting.': { en: 'Six slow breaths before the first meeting.', ta: 'முதல் கூட்டத்துக்கு முன் ஆறு மெதுவான மூச்சுகள்.', hi: 'पहली मीटिंग से पहले छह धीमी साँसें।' },
}

/** The coach console's override reasons (console/care OVERRIDE_REASONS), as the member reads them. */
export const COACH_REASON_TEXT: Record<string, L> = {
  'Member asked for a different time of day': { en: 'You asked for a different time of day', ta: 'நாளின் வேறு நேரத்தை நீங்கள் கேட்டீர்கள்', hi: 'आपने दिन का कोई और समय माँगा' },
  'Travel or schedule this week': { en: 'Travel or your schedule this week', ta: 'இந்த வாரப் பயணம் அல்லது உங்கள் அட்டவணை', hi: 'इस हफ़्ते का सफ़र या आपका कार्यक्रम' },
  'Action not landing after two weeks': { en: 'The action was not landing after two weeks', ta: 'இரண்டு வாரங்களுக்குப் பிறகும் அந்தச் செயல் பலனளிக்கவில்லை', hi: 'दो हफ़्ते बाद भी वह काम असर नहीं कर रहा था' },
  'Coach judgement after the call': { en: 'Your coach’s judgement after the call', ta: 'அழைப்புக்குப் பிறகு உங்கள் பயிற்சியாளரின் முடிவு', hi: 'कॉल के बाद आपके कोच का फ़ैसला' },
}
