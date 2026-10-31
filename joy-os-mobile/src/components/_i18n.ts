import type { Dict } from '../lib/i18n'
import type { Lang } from '../lib/store'

// Shared member kit: AppBar, CrisisSheet, Sheet, ScreenHeader, Term, JoyspanWheel, LoopRing,
// MethodLine, Delta. English is the source and must not change. Wording matches the web kit
// (joy-os-web/src/components/_i18n.ts) so both apps say the same thing.
// Stays English by design: AIWO, Joy OS, Tele-MANAS, people's names, numbers, method versions.
export const KIT = {
  // AppBar
  appBarHome: { en: 'AIWO {label}, Today', ta: 'AIWO {label}, இன்று', hi: 'AIWO {label}, आज' },
  notifUnread: { en: 'Notifications, {n} not yet opened', ta: 'அறிவிப்புகள், {n} இன்னும் திறக்கப்படவில்லை', hi: 'सूचनाएँ, {n} अभी खोली नहीं गईं' },
  notifAllRead: { en: 'Notifications, all read', ta: 'அறிவிப்புகள், அனைத்தும் படிக்கப்பட்டன', hi: 'सूचनाएँ, सब पढ़ ली गईं' },

  // Sheet / ScreenHeader
  close: { en: 'Close', ta: 'மூடு', hi: 'बंद करें' },
  back: { en: 'Back', ta: 'பின்செல்', hi: 'वापस' },
  stub: { en: 'Lane {lane} builds this screen.', ta: 'இந்தத் திரையை லேன் {lane} உருவாக்குகிறது.', hi: 'यह स्क्रीन लेन {lane} बना रही है।' },

  // CrisisSheet: pre-approved, plain and careful. No AI text.
  crisisTitle: { en: 'You don’t have to hold this alone', ta: 'இதை நீங்கள் தனியாகச் சுமக்க வேண்டியதில்லை', hi: 'आपको यह सब अकेले नहीं झेलना है' },
  crisisCallHint: {
    en: 'Calls Tele-MANAS, free and open all day and night',
    ta: 'Tele-MANAS-ஐ அழைக்கும்; இலவசம், இரவும் பகலும் திறந்திருக்கும்',
    hi: 'Tele-MANAS को कॉल करता है; मुफ़्त, दिन-रात खुला',
  },
  crisisCall: { en: 'Call Tele-MANAS 14416', ta: 'Tele-MANAS 14416-ஐ அழைக்கவும்', hi: 'Tele-MANAS 14416 पर कॉल करें' },
  emergency: { en: 'Emergency services · 112', ta: 'அவசர சேவை · 112', hi: 'आपातकालीन सेवा · 112' },
  crisisBody: {
    en: 'If you are thinking about ending your life, or you are not safe right now, please talk to someone now. A real person will answer.',
    ta: 'உங்கள் உயிரை முடித்துக்கொள்ள நினைக்கிறீர்கள் என்றால், அல்லது இப்போது நீங்கள் பாதுகாப்பாக இல்லை என்றால், தயவுசெய்து இப்போதே யாரிடமாவது பேசுங்கள். ஒரு உண்மையான மனிதர் பதில் அளிப்பார்.',
    hi: 'अगर आप अपनी जान लेने के बारे में सोच रहे हैं, या अभी आप सुरक्षित नहीं हैं, तो कृपया अभी किसी से बात करें। एक असली इंसान जवाब देगा।',
  },
  teleManasOrg: { en: 'Tele-MANAS · Government of India', ta: 'Tele-MANAS · இந்திய அரசு', hi: 'Tele-MANAS · भारत सरकार' },
  teleManasMeta: {
    en: 'Free, confidential, 24 hours a day, in your language. Also 1-800-891-4416.',
    ta: 'இலவசம், ரகசியம் காக்கப்படும், 24 மணி நேரமும், உங்கள் மொழியில். 1-800-891-4416 என்ற எண்ணிலும் அழைக்கலாம்.',
    hi: 'मुफ़्त, गोपनीय, चौबीसों घंटे, आपकी भाषा में। 1-800-891-4416 पर भी कॉल कर सकते हैं।',
  },
  yourPeople: { en: 'Your people', ta: 'உங்கள் மனிதர்கள்', hi: 'आपके अपने लोग' },
  yourPeopleBody: {
    en: 'Dr Sanjay Menon, your psychologist, is on call tonight. Kavya is your emergency contact; we only tell her if you ask us to.',
    ta: 'உங்கள் உளவியலாளர் Dr Sanjay Menon இன்றிரவு பணியில் இருக்கிறார். Kavya உங்கள் அவசரத் தொடர்பு; நீங்கள் கேட்டால் மட்டுமே அவருக்குத் தெரிவிப்போம்.',
    hi: 'आपके मनोवैज्ञानिक Dr Sanjay Menon आज रात ड्यूटी पर हैं। Kavya आपकी इमरजेंसी संपर्क हैं; हम उन्हें तभी बताएँगे जब आप कहेंगे।',
  },
  messageOnCall: { en: 'Message the on-call clinician', ta: 'பணியில் உள்ள மருத்துவருக்குச் செய்தி அனுப்பவும்', hi: 'ड्यूटी पर मौजूद क्लिनिशियन को संदेश भेजें' },

  // LoopRing
  loopDay: { en: 'Day {n} of {of}', ta: '{of} இல் நாள் {n}', hi: '{of} में से दिन {n}' },

  // Delta (screen reader)
  noChange: { en: 'No change measured', ta: 'மாற்றம் எதுவும் அளவிடப்படவில்லை', hi: 'कोई बदलाव नहीं मापा गया' },
  deltaEased: { en: 'eased by {n}', ta: '{n} தணிந்தது', hi: '{n} कम हुआ' },
  deltaRose: { en: 'rose by {n}', ta: '{n} அதிகரித்தது', hi: '{n} बढ़ा' },
  deltaUp: { en: 'up {n}', ta: '{n} உயர்வு', hi: '{n} ऊपर' },
  deltaDown: { en: 'down {n}', ta: '{n} இறக்கம்', hi: '{n} नीचे' },
  deltaSame: { en: 'unchanged {n}', ta: 'மாற்றமில்லை', hi: 'कोई बदलाव नहीं' },

  // Bands
  bandSteady: { en: 'steady', ta: 'சீரானது', hi: 'स्थिर' },
  bandUneven: { en: 'uneven', ta: 'சீரற்றது', hi: 'असमान' },
  bandThin: { en: 'thin', ta: 'குறைவு', hi: 'कम' },
  bandNone: { en: 'not yet measured', ta: 'இன்னும் அளவிடப்படவில்லை', hi: 'अभी मापा नहीं गया' },

  // MethodLine
  method: { en: 'Method {m}', ta: 'முறை {m}', hi: 'पद्धति {m}' },
  gradeCheck: { en: 'Check', ta: 'விரைவுச் சோதனை', hi: 'त्वरित जाँच' },
  gradeIndex: { en: 'Index grade', ta: 'குறியீட்டு நிலை', hi: 'इंडेक्स ग्रेड' },
  gradeClinical: { en: 'Clinical grade', ta: 'மருத்துவ நிலை', hi: 'क्लिनिकल ग्रेड' },
  measured: { en: 'Measured {d}', ta: 'அளவிட்டது {d}', hi: 'मापा गया {d}' },
  nextMeasureLine: { en: 'Next measure {d}', ta: 'அடுத்த அளவீடு {d}', hi: 'अगला माप {d}' },
  signed: { en: 'Signed · {who}', ta: 'கையொப்பம் · {who}', hi: 'हस्ताक्षर · {who}' },
  specimen: { en: 'Specimen · not a real member', ta: 'மாதிரி · உண்மையான உறுப்பினர் அல்ல', hi: 'नमूना · असली सदस्य नहीं' },

  // JoyspanWheel (screen reader)
  wheel: { en: 'Joyspan Wheel', ta: 'ஜாய்ஸ்பான் சக்கரம்', hi: 'जॉयस्पैन चक्र' },
  wheelIndex: { en: ', Index {v}', ta: ', குறியீடு {v}', hi: ', इंडेक्स {v}' },
  minus: { en: 'minus ', ta: 'கழித்தல் ', hi: 'माइनस ' },
  notYetMeasured: { en: 'not yet measured', ta: 'இன்னும் அளவிடப்படவில்லை', hi: 'अभी मापा नहीं गया' },
} satisfies Dict

export type KitKey = keyof typeof KIT

/** Non-hook lookup for plain functions (describeWheel, fmtDate callers). */
export function kit(lang: Lang, key: KitKey, vars?: Record<string, string | number>) {
  let s: string = KIT[key][lang] ?? KIT[key].en
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
  return s
}
