import { Fragment, createElement, type ReactNode } from 'react'
import { fill, useDict, useLang, useTermText, type Dict } from '@/lib/i18n'
import type { Lang } from '@/lib/store'

// Member core lane (Today, My Index, Take the Index, Joy Ledger, VIVA, Day 90): every
// member-facing string in English, Tamil and Hindi. English is the source and must not
// change. Stays English by design: instrument item wording, stems, timeframes and answer
// scales (forward–back translation pending; INSTRUMENT_NOTE is shown above them),
// instrument names and licence attributions, people's own words (Ledger words, what the
// member typed), names, brand and product names (AIWO, Joy OS, VIVA, Tele-MANAS, State of
// Us, Couples Check, ’Cation names), tool ids and prompt versions, formulas, units and
// scientific abbreviations. Numbers stay Latin digits.

export type L = Record<Lang, string>

const DATE_LOCALE: Record<Lang, string> = { en: 'en-GB', ta: 'ta-IN', hi: 'hi-IN' }

/** Date in the member's language with Latin digits; English output is unchanged. */
export function fmtLocal(d: Date, lang: Lang, opts: Intl.DateTimeFormatOptions) {
  return d.toLocaleDateString(DATE_LOCALE[lang], lang === 'en' ? opts : { ...opts, numberingSystem: 'latn' })
}

/**
 * Fill a translated template with React nodes. `{name}` takes nodes[name];
 * `*text*` becomes <em>text</em>.
 */
export function rich(s: string, nodes: Record<string, ReactNode> = {}): ReactNode {
  const parts = s.split(/(\{\w+\}|\*[^*]+\*)/)
  return parts.map((p, i) => {
    if (p.startsWith('{') && p.endsWith('}')) {
      const k = p.slice(1, -1)
      return createElement(Fragment, { key: i }, k in nodes ? nodes[k] : p)
    }
    if (p.length > 2 && p.startsWith('*') && p.endsWith('*')) return createElement('em', { key: i }, p.slice(1, -1))
    return p
  })
}

export const CORE = {
  // ─── Common ─────────────────────────────────────────────────────────────
  min: { en: '{n} min', ta: '{n} நிமிடம்', hi: '{n} मिनट' },
  back: { en: 'Back', ta: 'பின்செல்லவும்', hi: 'वापस' },
  undo: { en: 'Undo', ta: 'செயல்தவிர்', hi: 'वापस लें' },
  hide: { en: 'Hide', ta: 'மறைக்கவும்', hi: 'छिपाएँ' },
  close: { en: 'Close', ta: 'மூடவும்', hi: 'बंद करें' },
  cancel: { en: 'Cancel', ta: 'ரத்துசெய்யவும்', hi: 'रद्द करें' },
  index: { en: 'Index', ta: 'குறியீடு', hi: 'इंडेक्स' },
  change: { en: 'Change', ta: 'மாற்றம்', hi: 'बदलाव' },
  term: { en: 'Term', ta: 'அம்சம்', hi: 'पहलू' },
  day0: { en: 'Day 0', ta: 'நாள் 0', hi: 'दिन 0' },
  day90: { en: 'Day 90', ta: 'நாள் 90', hi: 'दिन 90' },
  openSpace: { en: 'Open the {space} space', ta: '{space} இடத்தைத் திறக்கவும்', hi: '{space} स्पेस खोलें' },
  lowestTermIs: { en: 'Lowest term: {term}.', ta: 'மிகக் குறைந்த அம்சம்: {term}.', hi: 'सबसे कम पहलू: {term}।' },
  upFrom: { en: 'Up from {n}. Lowest term: {term}.', ta: '{n} இலிருந்து உயர்வு. மிகக் குறைந்த அம்சம்: {term}.', hi: '{n} से ऊपर। सबसे कम पहलू: {term}।' },
  fromN: { en: 'From {n}. Lowest term: {term}.', ta: 'முன்பு {n}. மிகக் குறைந்த அம்சம்: {term}.', hi: 'पिछली बार {n}। सबसे कम पहलू: {term}।' },
  sameAsN: { en: 'The same as {n}. Lowest term: {term}.', ta: '{n} போலவே. மிகக் குறைந்த அம்சம்: {term}.', hi: '{n} के बराबर। सबसे कम पहलू: {term}।' },
  jiAria: { en: 'Joyspan Index {v} of 100', ta: 'ஜாய்ஸ்பான் குறியீடு 100 இல் {v}', hi: 'जॉयस्पैन इंडेक्स 100 में से {v}' },
  joyFromTwo: { en: 'Joy came most from {a} and {b}.', ta: 'மகிழ்ச்சி அதிகம் வந்தது {a}, {b} வழியாக.', hi: 'सबसे ज़्यादा ख़ुशी {a} और {b} से आई।' },
  joyFromOne: { en: 'Joy came most from {a}.', ta: 'மகிழ்ச்சி அதிகம் வந்தது {a} வழியாக.', hi: 'सबसे ज़्यादा ख़ुशी {a} से आई।' },
  ledger: { en: 'Ledger', ta: 'லெட்ஜர்', hi: 'लेजर' },
  noWearable: {
    en: '{term} has no wearable signal. It is measured by what you say, and that is enough.',
    ta: '{term} அம்சத்துக்கு அணியும் சாதனச் சிக்னல் இல்லை. நீங்கள் சொல்வதை வைத்தே அளவிடப்படுகிறது, அதுவே போதும்.',
    hi: '{term} के लिए कोई वियरेबल सिग्नल नहीं है। इसे आपके कहे से मापा जाता है, और इतना काफ़ी है।',
  },
  bySeen: { en: 'Not written by AI · pre-approved · {by}', ta: 'AI எழுதியது அல்ல · முன் அங்கீகரிக்கப்பட்டது · {by}', hi: 'AI ने नहीं लिखा · पहले से स्वीकृत · {by}' },
  clinicalOffice: { en: 'Clinical office', ta: 'மருத்துவ அலுவலகம்', hi: 'क्लिनिकल कार्यालय' },
  draftedBy: { en: 'drafted by VIVA', ta: 'VIVA வரைந்தது', hi: 'VIVA का मसौदा' },
  methodV: { en: 'method {m}', ta: 'முறை {m}', hi: 'पद्धति {m}' },
  gradeShortClinical: { en: 'Clinical', ta: 'மருத்துவம்', hi: 'क्लिनिकल' },
  gradeShortIndex: { en: 'Index', ta: 'குறியீடு', hi: 'इंडेक्स' },
  gradeShortCheck: { en: 'Check', ta: 'விரைவுச் சோதனை', hi: 'त्वरित जाँच' },
  gradeFullClinical: { en: 'Clinical grade', ta: 'மருத்துவ நிலை', hi: 'क्लिनिकल ग्रेड' },
  gradeFullIndex: { en: 'Index grade', ta: 'குறியீட்டு நிலை', hi: 'इंडेक्स ग्रेड' },
  gradeFullCheck: { en: 'Check grade', ta: 'விரைவுச் சோதனை நிலை', hi: 'त्वरित जाँच ग्रेड' },
  methodLabel: { en: 'Method {m}', ta: 'முறை {m}', hi: 'पद्धति {m}' },
  specimen: { en: 'Specimen · not a real member', ta: 'மாதிரி · உண்மையான உறுப்பினர் அல்ல', hi: 'नमूना · असली सदस्य नहीं' },

  // ─── Today ──────────────────────────────────────────────────────────────
  // Today · read aloud (Settings → Accessibility → voice)
  tdReadAloud: { en: 'Read aloud', ta: 'உரக்கப் படிக்கவும்', hi: 'पढ़कर सुनाएँ' },
  tdStopReading: { en: 'Stop reading', ta: 'படிப்பதை நிறுத்தவும்', hi: 'सुनाना रोकें' },
  tdReadUnavailable: { en: 'Reading aloud is not available in this browser.', ta: 'இந்த உலாவியில் உரக்கப் படிக்கும் வசதி இல்லை.', hi: 'इस ब्राउज़र में पढ़कर सुनाने की सुविधा नहीं है।' },
  tdSpeakIndex: { en: 'Your Joyspan Index is {v}. Lowest term: {term}.', ta: 'உங்கள் ஜாய்ஸ்பான் குறியீடு {v}. மிகக் குறைந்த அம்சம்: {term}.', hi: 'आपका जॉयस्पैन इंडेक्स {v} है। सबसे कम पहलू: {term}।' },
  tdSpeakAction: { en: 'Today’s one thing: {title}', ta: 'இன்றைய ஒரு செயல்: {title}', hi: 'आज का एक काम: {title}' },
  tdSpeakPool: { en: 'Also in your pool: {list}.', ta: 'உங்கள் தொகுப்பிலும் உள்ளவை: {list}.', hi: 'आपकी सूची में यह भी है: {list}।' },
  tdSpeakDay: { en: 'Day {n} of 90.', ta: '90 இல் நாள் {n}.', hi: '90 में से दिन {n}।' },
  // Today · the pool, from the three actions in each space
  tdPool: { en: 'Today’s pool · from your spaces', ta: 'இன்றைய தொகுப்பு · உங்கள் இடங்களிலிருந்து', hi: 'आज की सूची · आपके स्पेस से' },
  tdPoolSub: { en: 'You added these. Any one is enough, and “not today” is always allowed.', ta: 'இவற்றை நீங்கள் சேர்த்தீர்கள். ஏதேனும் ஒன்று போதும்; “இன்று வேண்டாம்” என்று சொல்ல எப்போதும் அனுமதி உண்டு.', hi: 'ये आपने जोड़े हैं। कोई एक काफ़ी है, और “आज नहीं” कहना हमेशा ठीक है।' },
  tdPoolEmpty: { en: 'Nothing added yet. Each space offers three actions you can add here.', ta: 'இன்னும் எதுவும் சேர்க்கப்படவில்லை. ஒவ்வொரு இடத்திலும் இங்கே சேர்க்கக்கூடிய மூன்று செயல்கள் உள்ளன.', hi: 'अभी कुछ नहीं जोड़ा गया। हर स्पेस में तीन काम हैं जिन्हें आप यहाँ जोड़ सकते हैं।' },
  tdPoolSpaces: { en: 'Open your spaces', ta: 'உங்கள் இடங்களைத் திறக்கவும்', hi: 'अपने स्पेस खोलें' },
  tdPoolMark: { en: 'Mark “{title}” done for today', ta: '“{title}” இன்றைக்கு முடிந்ததாகக் குறிக்கவும்', hi: '“{title}” को आज के लिए पूरा चिह्नित करें' },
  tdPoolDone: { en: 'Done today', ta: 'இன்று முடிந்தது', hi: 'आज पूरा हुआ' },
  tdPoolCount: { en: '{d} of {n} done today', ta: 'இன்று {n} இல் {d} முடிந்தது', hi: 'आज {n} में से {d} पूरे' },
  tdPoolManage: { en: 'Change in {space}', ta: '{space} இல் மாற்றவும்', hi: '{space} में बदलें' },
  tdTogether: { en: 'Together', ta: 'இணைந்து', hi: 'साथ में' },
  tdSoloShort: { en: 'Solo', ta: 'தனியாக', hi: 'अकेले' },
  // Today · global states
  tdQueued: { en: 'Kept on this device · syncs when you’re back online', ta: 'இந்தச் சாதனத்தில் வைக்கப்பட்டுள்ளது · மீண்டும் இணைந்ததும் ஒத்திசைக்கப்படும்', hi: 'इसी डिवाइस पर रखा गया · ऑनलाइन लौटते ही सिंक होगा' },
  tdGrace: { en: 'Grace access until {date}. Your Index, Ledger and Trust centre never pause.', ta: '{date} வரை சலுகை அணுகல். உங்கள் குறியீடு, லெட்ஜர், நம்பிக்கை மையம் ஒருபோதும் நிற்காது.', hi: '{date} तक मोहलत। आपका इंडेक्स, लेजर और भरोसा केंद्र कभी नहीं रुकते।' },
  tdGraceLink: { en: 'Membership', ta: 'உறுப்பினர் திட்டம்', hi: 'सदस्यता' },
  tdSignalsDown: { en: 'Signals down · a sitting now would be survey-only', ta: 'சிக்னல்கள் இல்லை · இப்போது அளவிட்டால் கேள்வித்தாள் மட்டுமே', hi: 'सिग्नल बंद · अभी मापने पर केवल सर्वे से' },
  // Survey-only Index (signals off, or no device connected)
  soPill: { en: 'Survey only · flagged', ta: 'கேள்வித்தாள் மட்டும் · குறிக்கப்பட்டது', hi: 'केवल सर्वे · चिह्नित' },
  soScoring: {
    en: 'Every wearable signal was off, so this Index rests on your answers and on anything you logged in the app yourself, such as Ledger moments. It is marked survey-only wherever it shows.',
    ta: 'அணியும் சாதனச் சிக்னல்கள் அனைத்தும் அணைக்கப்பட்டிருந்தன; எனவே இந்தக் குறியீடு உங்கள் பதில்களையும், லெட்ஜர் தருணங்கள் போல நீங்களே செயலியில் பதிவுசெய்தவற்றையும் மட்டுமே அடிப்படையாகக் கொண்டது. இது காட்டப்படும் எல்லா இடங்களிலும் “கேள்வித்தாள் மட்டும்” எனக் குறிக்கப்படும்.',
    hi: 'हर वियरेबल सिग्नल बंद था, इसलिए यह इंडेक्स केवल आपके जवाबों और ऐप में खुद दर्ज की गई चीज़ों, जैसे लेजर के पलों, पर टिका है। यह जहाँ भी दिखेगा, “केवल सर्वे” के रूप में चिह्नित होगा।',
  },
  soBanner: { en: 'Survey only: no wearable signal was used.', ta: 'கேள்வித்தாள் மட்டும்: அணியும் சாதனச் சிக்னல் எதுவும் பயன்படுத்தப்படவில்லை.', hi: 'केवल सर्वे: कोई वियरेबल सिग्नल इस्तेमाल नहीं हुआ।' },
  soDownTitle: { en: 'Signals are down', ta: 'சிக்னல்கள் இல்லை', hi: 'सिग्नल बंद हैं' },
  soDownBody: {
    en: 'No device is connected. Your signed Index stays as it is; a sitting taken now uses no wearable signal, only your answers and what you log in the app, and is flagged survey-only.',
    ta: 'எந்தச் சாதனமும் இணைக்கப்படவில்லை. கையொப்பமிட்ட உங்கள் குறியீடு அப்படியே இருக்கும்; இப்போது அளவிட்டால் அணியும் சாதனச் சிக்னல் எதுவும் பயன்படாது, உங்கள் பதில்களும் செயலியில் நீங்கள் பதிவுசெய்தவையும் மட்டுமே; அது “கேள்வித்தாள் மட்டும்” எனக் குறிக்கப்படும்.',
    hi: 'कोई डिवाइस जुड़ा नहीं है। आपका हस्ताक्षरित इंडेक्स वैसा ही रहेगा; अभी मापने पर कोई वियरेबल सिग्नल इस्तेमाल नहीं होगा, केवल आपके जवाब और ऐप में दर्ज चीज़ें, और यह “केवल सर्वे” के रूप में चिह्नित होगा।',
  },
  soSignalsStep: {
    en: 'No device is connected, so no wearable signal can be read. This sitting will be scored from your answers and the signals you log in the app below, and flagged survey-only.',
    ta: 'எந்தச் சாதனமும் இணைக்கப்படாததால் அணியும் சாதனச் சிக்னல் எதையும் படிக்க முடியாது. இந்த அமர்வு உங்கள் பதில்களையும், கீழே செயலியில் நீங்கள் பதிவுசெய்யும் சிக்னல்களையும் வைத்து மதிப்பிடப்பட்டு “கேள்வித்தாள் மட்டும்” எனக் குறிக்கப்படும்.',
    hi: 'कोई डिवाइस जुड़ा नहीं है, इसलिए कोई वियरेबल सिग्नल पढ़ा नहीं जा सकता। यह सिटिंग आपके जवाबों और नीचे ऐप में दर्ज सिग्नलों से स्कोर होगी और “केवल सर्वे” के रूप में चिह्नित होगी।',
  },
  soAllOff: {
    en: 'All signals are off. This sitting will be scored from your answers alone and flagged survey-only.',
    ta: 'எல்லாச் சிக்னல்களும் அணைக்கப்பட்டுள்ளன. இந்த அமர்வு உங்கள் பதில்களை மட்டும் வைத்து மதிப்பிடப்பட்டு “கேள்வித்தாள் மட்டும்” எனக் குறிக்கப்படும்.',
    hi: 'सभी सिग्नल बंद हैं। यह सिटिंग केवल आपके जवाबों से स्कोर होगी और “केवल सर्वे” के रूप में चिह्नित होगी।',
  },
  soWearableOff: {
    en: 'Every wearable signal is off. This sitting will be scored from your answers and the signals you log in the app, and flagged survey-only.',
    ta: 'அணியும் சாதனச் சிக்னல்கள் அனைத்தும் அணைக்கப்பட்டுள்ளன. இந்த அமர்வு உங்கள் பதில்களையும் செயலியில் நீங்கள் பதிவுசெய்யும் சிக்னல்களையும் வைத்து மதிப்பிடப்பட்டு “கேள்வித்தாள் மட்டும்” எனக் குறிக்கப்படும்.',
    hi: 'हर वियरेबल सिग्नल बंद है। यह सिटिंग आपके जवाबों और ऐप में दर्ज सिग्नलों से स्कोर होगी और “केवल सर्वे” के रूप में चिह्नित होगी।',
  },
  soOpenDevices: { en: 'Open Devices', ta: 'சாதனங்களைத் திறக்கவும்', hi: 'डिवाइस खोलें' },
  // Offline queue
  oqWaiting: { en: 'Waiting to sync', ta: 'ஒத்திசைக்கக் காத்திருக்கிறது', hi: 'सिंक की प्रतीक्षा में' },
  oqSyncing: { en: 'Syncing', ta: 'ஒத்திசைக்கப்படுகிறது', hi: 'सिंक हो रहा है' },
  oqIndex: { en: 'You are offline. This result is kept on this device and syncs when you are back.', ta: 'இணைய இணைப்பு இல்லை. இந்த முடிவு இந்தச் சாதனத்தில் வைக்கப்பட்டு, மீண்டும் இணைந்ததும் ஒத்திசைக்கப்படும்.', hi: 'आप ऑफ़लाइन हैं। यह नतीजा इसी डिवाइस पर रखा गया है और वापस जुड़ते ही सिंक हो जाएगा।' },
  oqLedger: { en: 'Offline: kept on this device, syncs when you are back.', ta: 'இணைப்பு இல்லை: இந்தச் சாதனத்தில் வைக்கப்பட்டது, மீண்டும் இணைந்ததும் ஒத்திசைக்கப்படும்.', hi: 'ऑफ़लाइन: इसी डिवाइस पर रखा गया, वापस जुड़ते ही सिंक होगा।' },

  tdOpenIndex: { en: 'Open your Index', ta: 'உங்கள் குறியீட்டைத் திறக்கவும்', hi: 'अपना इंडेक्स खोलें' },
  tdWithKavya: { en: 'with Kavya', ta: 'Kavya உடன்', hi: 'Kavya के साथ' },
  tdSolo: { en: 'solo', ta: 'தனியாக', hi: 'अकेले' },
  tdHeadline: { en: '{title}. *Notice* three things.', ta: '{title}. மூன்று விஷயங்களைக் *கவனியுங்கள்*.', hi: '{title}। तीन चीज़ों पर *ध्यान दें*।' },
  tdWhyQ: { en: 'Why this, today?', ta: 'இன்று ஏன் இது?', hi: 'आज यही क्यों?' },
  tdWhyTitle: { en: 'Why this, today', ta: 'இன்று ஏன் இது', hi: 'आज यही क्यों' },
  tdSkipped: { en: 'That’s fine. Tomorrow will bring another.', ta: 'பரவாயில்லை. நாளை இன்னொன்று வரும்.', hi: 'कोई बात नहीं। कल एक और मिलेगा।' },
  tdDone: { en: 'Done, with the family. *Thank you.*', ta: 'குடும்பத்துடன் முடிந்தது. *நன்றி.*', hi: 'परिवार के साथ पूरा हुआ। *धन्यवाद।*' },
  tdSkippedNote: {
    en: '“Not today” is always allowed, and never counted against you.',
    ta: '“இன்று வேண்டாம்” என்று எப்போதும் சொல்லலாம்; அது உங்களுக்கு எதிராகக் கணக்கிடப்படாது.',
    hi: '“आज नहीं” कहना हमेशा ठीक है, और इसे कभी आपके ख़िलाफ़ नहीं गिना जाता।',
  },
  tdDoneNote: {
    en: 'Mindful minutes written back to Apple Health, as you allowed.',
    ta: 'நீங்கள் அனுமதித்தபடி, கவன நிமிடங்கள் Apple Health-இல் பதிவு செய்யப்பட்டன.',
    hi: 'आपकी अनुमति के अनुसार, माइंडफ़ुल मिनट Apple Health में दर्ज किए गए।',
  },
  tdCircle: { en: 'Your circle · {when}', ta: 'உங்கள் வட்டம் · {when}', hi: 'आपका सर्कल · {when}' },
  tdCoachOthers: { en: 'Coach {coach} and {n} others', ta: 'பயிற்சியாளர் {coach} மற்றும் {n} பேர்', hi: 'कोच {coach} और {n} अन्य' },
  tdWeekOf: { en: 'Week {n} of the Practice', ta: 'பயிற்சியின் வாரம் {n}', hi: 'अभ्यास का सप्ताह {n}' },
  tdThisWeek: { en: 'This week', ta: 'இந்த வாரம்', hi: 'इस हफ़्ते' },
  tdWeekAria: {
    en: 'Joy Ledger, something kept on {n} of 7 days this week',
    ta: 'ஜாய் லெட்ஜர், இந்த வாரம் 7 நாட்களில் {n} நாட்கள் ஏதாவது சேமிக்கப்பட்டது',
    hi: 'जॉय लेजर, इस हफ़्ते 7 में से {n} दिन कुछ सहेजा गया',
  },
  tdNothingWeek: { en: 'Nothing kept yet this week. Quiet weeks are fine.', ta: 'இந்த வாரம் இன்னும் எதுவும் சேமிக்கப்படவில்லை. அமைதியான வாரங்களும் நல்லதே.', hi: 'इस हफ़्ते अभी कुछ नहीं सहेजा गया। शांत हफ़्ते भी ठीक हैं।' },
  tdAddLedger: { en: 'Add to the Ledger', ta: 'லெட்ஜரில் சேர்க்கவும்', hi: 'लेजर में जोड़ें' },
  tdNinety: { en: 'The ninety days', ta: 'தொண்ணூறு நாட்கள்', hi: 'नब्बे दिन' },
  tdLoopLine: {
    en: 'Day {n}. Your next review with Priya is on Day 45; the re-measure opens on Day 76.',
    ta: 'நாள் {n}. Priya உடனான உங்கள் அடுத்த மதிப்பாய்வு நாள் 45 அன்று; மறு அளவீடு நாள் 76 அன்று தொடங்கும்.',
    hi: 'दिन {n}। Priya के साथ आपकी अगली समीक्षा दिन 45 को है; दोबारा माप दिन 76 को खुलेगा।',
  },
  tdMilestones: { en: 'Loop milestones', ta: '90 நாள் மைல்கற்கள்', hi: '90 दिन के पड़ाव' },
  msMeasured: { en: 'Measured', ta: 'அளவிடப்பட்டது', hi: 'मापा गया' },
  msReview: { en: 'Review', ta: 'மதிப்பாய்வு', hi: 'समीक्षा' },
  msNext: { en: 'Next step', ta: 'அடுத்த படி', hi: 'अगला कदम' },
  msRemeasure: { en: 'Re-measure', ta: 'மறு அளவீடு', hi: 'दोबारा माप' },
  msSigned: { en: 'Signed delta', ta: 'கையொப்பமிட்ட மாற்றம்', hi: 'हस्ताक्षरित बदलाव' },
  tdStep1h: { en: 'Term.', ta: 'அம்சம்.', hi: 'पहलू।' },
  tdStep1: {
    en: 'The lowest term on your latest Index is {term} ({v}). No ’cation protocol or safety flag is open.',
    ta: 'உங்கள் சமீபத்திய குறியீட்டில் மிகக் குறைந்த அம்சம் {term} ({v}). எந்த ’கேஷன் நெறிமுறையும் பாதுகாப்பு எச்சரிக்கையும் திறந்த நிலையில் இல்லை.',
    hi: 'आपके ताज़ा इंडेक्स में सबसे कम पहलू {term} ({v}) है। कोई ’केशन प्रोटोकॉल या सुरक्षा फ़्लैग खुला नहीं है।',
  },
  tdStep2h: { en: 'Candidates.', ta: 'தேர்வுகள்.', hi: 'विकल्प।' },
  tdStep2: {
    en: '40 curated {space} actions, each claims-gated and tagged with evidence.',
    ta: 'தேர்ந்தெடுக்கப்பட்ட 40 {space} செயல்கள்; ஒவ்வொன்றும் கூற்றுச் சரிபார்ப்புடன், ஆதாரக் குறிப்புடன்.',
    hi: 'चुनी हुई 40 {space} गतिविधियाँ, हर एक के दावे जाँचे हुए और प्रमाण के साथ।',
  },
  tdStep3h: { en: 'Fit.', ta: 'பொருத்தம்.', hi: 'मेल।' },
  tdStep3: {
    en: 'Calendar clear after 7 pm (consented), Kavya linked, sunset 18:12.',
    ta: 'இரவு 7 மணிக்குப் பிறகு நாட்காட்டி காலி (ஒப்புதலுடன்), Kavya இணைக்கப்பட்டுள்ளார், சூரிய அஸ்தமனம் 18:12.',
    hi: 'शाम 7 बजे के बाद कैलेंडर खाली (सहमति से), Kavya जुड़ी हुई हैं, सूर्यास्त 18:12।',
  },
  tdStep4h: { en: 'One.', ta: 'ஒன்று.', hi: 'एक।' },
  tdStep4: {
    en: 'Shown with one reason. “Not today” is never punished.',
    ta: 'ஒரே ஒரு காரணத்துடன் காட்டப்படும். “இன்று வேண்டாம்” என்பதற்கு எந்தத் தண்டனையும் இல்லை.',
    hi: 'एक ही कारण के साथ दिखाया जाता है। “आज नहीं” पर कभी कोई सज़ा नहीं।',
  },
  tdEvidence: { en: 'Evidence.', ta: 'ஆதாரம்.', hi: 'प्रमाण।' },
  tdAskViva: { en: 'Ask VIVA about this', ta: 'இதைப் பற்றி VIVA-விடம் கேளுங்கள்', hi: 'इस बारे में VIVA से पूछें' },

  // ─── My Index ───────────────────────────────────────────────────────────
  ixEyebrow: { en: 'My Index · {grade} · {method}', ta: 'என் குறியீடு · {grade} · {method}', hi: 'मेरा इंडेक्स · {grade} · {method}' },
  ixTitle: { en: 'Your Index, and *why*.', ta: 'உங்கள் குறியீடு, *ஏன்* என்பதும்.', hi: 'आपका इंडेक्स, और *क्यों*।' },
  ixLead: {
    en: 'One number that can go down. Here is what it is made of, how the engine computed it, and where it has been.',
    ta: 'குறையவும் கூடிய ஒரு எண். அது எதனால் ஆனது, கணிப்பு இயந்திரம் அதை எப்படிக் கணக்கிட்டது, இதுவரை எப்படி இருந்தது என்பது இங்கே.',
    hi: 'एक संख्या जो घट भी सकती है। यह किससे बनी है, इंजन ने इसे कैसे गिना, और अब तक यह कहाँ-कहाँ रही, सब यहाँ है।',
  },
  ixViewCard: { en: 'View Index card', ta: 'குறியீட்டு அட்டையைப் பார்க்கவும்', hi: 'इंडेक्स कार्ड देखें' },
  ixPreview: { en: 'Preview the Index', ta: 'குறியீட்டை முன்னோட்டமாகச் செய்து பாருங்கள்', hi: 'इंडेक्स आज़माकर देखें' },
  ixJiEyebrow: { en: 'Joyspan Index · {day}', ta: 'ஜாய்ஸ்பான் குறியீடு · {day}', hi: 'जॉयस्पैन इंडेक्स · {day}' },
  ixSelect: { en: 'Select a petal, or a row, to open its term.', ta: 'ஒரு இதழையோ வரிசையையோ தேர்ந்தெடுத்தால் அந்த அம்சம் திறக்கும்.', hi: 'किसी पंखुड़ी या पंक्ति को चुनें, उसका पहलू खुल जाएगा।' },
  ixSixTerms: { en: 'The six terms', ta: 'ஆறு அம்சங்கள்', hi: 'छह पहलू' },
  ixNextStep: { en: 'Next step · {term}', ta: 'அடுத்த படி · {term}', hi: 'अगला कदम · {term}' },
  ixLowestIs: {
    en: '{term} is your lowest term, at {v}. One step raises it:',
    ta: '{term} தான் உங்கள் மிகக் குறைந்த அம்சம், {v} இல் உள்ளது. ஒரு படி அதை உயர்த்தும்:',
    hi: '{term} आपका सबसे कम पहलू है, {v} पर। एक कदम इसे ऊपर ले जाता है:',
  },
  ixWhyLowest: {
    en: 'Why the lowest term? The Index is a geometric mean, so the lowest term moves it most. Balance is rewarded; a surplus in one term cannot hide a deficit in another.',
    ta: 'ஏன் மிகக் குறைந்த அம்சம்? குறியீடு ஒரு பெருக்கல் சராசரி, எனவே மிகக் குறைந்த அம்சமே அதை அதிகம் நகர்த்தும். சமநிலைக்குத்தான் மதிப்பு; ஒரு அம்சத்தின் மிகுதி இன்னொன்றின் குறையை மறைக்க முடியாது.',
    hi: 'सबसे कम पहलू ही क्यों? इंडेक्स एक ज्यामितीय औसत है, इसलिए सबसे कम पहलू उसे सबसे ज़्यादा हिलाता है। संतुलन को महत्व मिलता है; एक पहलू की अधिकता दूसरे की कमी को छिपा नहीं सकती।',
  },
  ixStartStep: { en: 'Start today’s step', ta: 'இன்றைய படியைத் தொடங்குங்கள்', hi: 'आज का कदम शुरू करें' },
  ixWhenDown: { en: 'When it goes down', ta: 'அது குறையும்போது', hi: 'जब यह घटे' },
  ixWhenDownBody: {
    en: 'A fall is told as a sentence, with a named person who calls you. Never red, never pushed.',
    ta: 'சரிவு ஒரு வாக்கியமாகச் சொல்லப்படும்; பெயர் தெரிந்த ஒருவர் உங்களை அழைப்பார். சிவப்பு நிறம் இல்லை, அழுத்தமும் இல்லை.',
    hi: 'गिरावट एक वाक्य में बताई जाती है, और एक तय व्यक्ति आपको फ़ोन करता है। न लाल रंग, न कोई दबाव।',
  },
  ixSeeDay90: { en: 'See the Day-90 screen', ta: 'நாள்-90 திரையைப் பார்க்கவும்', hi: 'दिन-90 की स्क्रीन देखें' },
  ixSpaceLink: { en: '{space} space', ta: '{space} இடம்', hi: '{space} स्पेस' },
  ixFormula: { en: 'Formula · {method}', ta: 'சூத்திரம் · {method}', hi: 'सूत्र · {method}' },
  ixBurdenInverse: {
    en: 'Burden is inverse: higher is heavier. It is subtracted from the Index as λ·B.',
    ta: 'சுமை தலைகீழானது: அதிகம் என்றால் கனம் அதிகம். அது குறியீட்டிலிருந்து λ·B ஆகக் கழிக்கப்படுகிறது.',
    hi: 'बोझ उल्टा चलता है: ज़्यादा यानी भारी। इसे इंडेक्स में से λ·B के रूप में घटाया जाता है।',
  },
  ixSignalsSurvey: { en: 'Signals and survey', ta: 'சிக்னல்களும் கேள்வித்தாளும்', hi: 'सिग्नल और प्रश्नावली' },
  ixShareAria: { en: '{s}% from questionnaire items, {g}% from signals', ta: 'கேள்வித்தாளிலிருந்து {s}%, சிக்னல்களிலிருந்து {g}%', hi: '{s}% प्रश्नावली से, {g}% सिग्नल से' },
  ixShareLine: { en: '{s} survey · {g} signals', ta: '{s} கேள்வித்தாள் · {g} சிக்னல்கள்', hi: '{s} प्रश्नावली · {g} सिग्नल' },
  ixConfidence: { en: 'Confidence · {c}', ta: 'நம்பகத்தன்மை · {c}', hi: 'भरोसा · {c}' },
  confHigh: { en: 'High', ta: 'அதிகம்', hi: 'ऊँचा' },
  confModerate: { en: 'Moderate', ta: 'மிதமானது', hi: 'मध्यम' },
  confSurvey: { en: 'Survey only', ta: 'கேள்வித்தாள் மட்டும்', hi: 'केवल प्रश्नावली' },
  ixInstruments: { en: 'Instruments', ta: 'அளவீட்டுக் கருவிகள்', hi: 'मापन उपकरण' },
  ixItemsLicence: { en: '{n} items · {licence}', ta: '{n} கேள்விகள் · {licence}', hi: '{n} प्रश्न · {licence}' },
  ixProtocol: { en: 'Protocol', ta: 'நெறிமுறை', hi: 'प्रोटोकॉल' },
  ixMovedSince: { en: 'What moved since {date}', ta: '{date} முதல் என்ன மாறியது', hi: '{date} से क्या बदला' },
  fxTitle: { en: 'The formula, worked through', ta: 'சூத்திரம், படிப்படியாக', hi: 'सूत्र, क़दम-दर-क़दम' },
  fxLine: { en: '{f}, with λ = {l} in {method}.', ta: '{f}, இதில் {method} இல் λ = {l}.', hi: '{f}, जहाँ {method} में λ = {l}।' },
  fxStep1: { en: '1 · Geometric mean of the five', ta: '1 · ஐந்தின் பெருக்கல் சராசரி', hi: '1 · पाँचों का ज्यामितीय औसत' },
  fxStep2: { en: '2 · Burden, weighted', ta: '2 · சுமை, எடையிடப்பட்டது', hi: '2 · बोझ, भार सहित' },
  fxStep3: { en: '3 · The Index, to the whole number', ta: '3 · குறியீடு, முழு எண்ணாக', hi: '3 · इंडेक्स, पूर्ण संख्या में' },
  fxSandbox: { en: 'sandbox', ta: 'சோதனை', hi: 'प्रयोग' },
  fxTryB: { en: 'Try it.', ta: 'முயன்று பாருங்கள்.', hi: 'आज़माकर देखें।' },
  fxTry: { en: '{b} A sandbox: your recorded Index does not change.', ta: '{b} இது சோதனை மட்டுமே: பதிவான உங்கள் குறியீடு மாறாது.', hi: '{b} यह सिर्फ़ प्रयोग है: आपका दर्ज इंडेक्स नहीं बदलता।' },
  fxPlus10: { en: '+10 to {term}', ta: '{term} +10', hi: '{term} में +10' },
  fxReset: { en: 'Reset', ta: 'மீட்டமைக்கவும்', hi: 'रीसेट' },
  fxResetAria: { en: 'Reset the sandbox', ta: 'சோதனையை மீட்டமைக்கவும்', hi: 'प्रयोग रीसेट करें' },
  fxSliderAria: { en: '{term} sandbox value', ta: '{term} சோதனை மதிப்பு', hi: '{term} का प्रयोग मान' },
  fxCompared: {
    en: 'Ten points on {low} moved the Index by {a}; ten on {high} moved it by {b}.',
    ta: '{low} இல் பத்து புள்ளிகள் குறியீட்டை {a} நகர்த்தின; {high} இல் பத்து புள்ளிகள் {b} நகர்த்தின.',
    hi: '{low} पर दस अंक ने इंडेक्स को {a} हिलाया; {high} पर दस अंक ने {b}।',
  },
  fxLowerMore: {
    en: 'The lowest term moves it more. That is the geometric mean rewarding balance.',
    ta: 'மிகக் குறைந்த அம்சமே அதை அதிகம் நகர்த்துகிறது. பெருக்கல் சராசரி சமநிலைக்கு மதிப்பளிப்பது இதுதான்.',
    hi: 'सबसे कम पहलू इसे ज़्यादा हिलाता है। ज्यामितीय औसत ऐसे ही संतुलन को महत्व देता है।',
  },
  fxAlike: {
    en: 'Here they move it alike; the gap grows as the terms grow further apart.',
    ta: 'இங்கே இரண்டும் ஒரே அளவு நகர்த்துகின்றன; அம்சங்களுக்கு இடையே இடைவெளி கூடக்கூட வேறுபாடும் கூடும்.',
    hi: 'यहाँ दोनों बराबर हिलाते हैं; पहलुओं के बीच दूरी बढ़ने पर फ़र्क़ भी बढ़ता है।',
  },
  fxSandboxLine: {
    en: 'Sandbox Index {v}, {d} on your recorded {r}. Lowest term now {term}.',
    ta: 'சோதனைக் குறியீடு {v}, பதிவான {r} உடன் ஒப்பிட {d}. இப்போது மிகக் குறைந்த அம்சம் {term}.',
    hi: 'प्रयोग इंडेक्स {v}, आपके दर्ज {r} पर {d}। अब सबसे कम पहलू {term}।',
  },
  fxNowTry: { en: ' Now try +10 to {term} and compare.', ta: ' இப்போது {term} +10 முயன்று ஒப்பிடுங்கள்.', hi: ' अब {term} में +10 करके तुलना करें।' },
  fxHint: {
    en: 'Raise the lowest term by ten, then the highest by ten, and compare. That is the geometric mean rewarding balance.',
    ta: 'மிகக் குறைந்த அம்சத்தைப் பத்து உயர்த்துங்கள், பிறகு மிக உயர்ந்ததைப் பத்து உயர்த்துங்கள், ஒப்பிடுங்கள். பெருக்கல் சராசரி சமநிலைக்கு மதிப்பளிப்பது இதுதான்.',
    hi: 'सबसे कम पहलू को दस बढ़ाएँ, फिर सबसे ऊँचे को दस, और तुलना करें। ज्यामितीय औसत ऐसे ही संतुलन को महत्व देता है।',
  },
  hsEyebrow: { en: 'History · {n} measures · methods v0.9 → v1.0', ta: 'வரலாறு · {n} அளவீடுகள் · முறைகள் v0.9 → v1.0', hi: 'इतिहास · {n} माप · पद्धतियाँ v0.9 → v1.0' },
  hsRisen: {
    en: 'Your Index has risen from {a} to {b} over {n} measures, with {low}. The July baseline and the October measure were scored with the pilot method; each change of method is marked on the line, and scores are never silently recomputed.',
    ta: 'உங்கள் குறியீடு {n} அளவீடுகளில் {a} இலிருந்து {b} ஆக உயர்ந்துள்ளது; {low}. ஜூலை அடிப்படை அளவீடும் அக்டோபர் அளவீடும் சோதனை முறையில் மதிப்பிடப்பட்டன; ஒவ்வொரு முறை மாற்றமும் கோட்டில் குறிக்கப்பட்டுள்ளது, மதிப்பெண்கள் ஒருபோதும் சொல்லாமல் மீண்டும் கணக்கிடப்படுவதில்லை.',
    hi: 'आपका इंडेक्स {n} मापों में {a} से बढ़कर {b} हुआ है, {low}। जुलाई का आधार माप और अक्टूबर का माप पायलट पद्धति से आँके गए थे; पद्धति का हर बदलाव रेखा पर दिखाया गया है, और स्कोर कभी चुपचाप दोबारा नहीं गिने जाते।',
  },
  hsMoved: {
    en: 'Your Index has moved from {a} to {b} over {n} measures, with {low}. The July baseline and the October measure were scored with the pilot method; each change of method is marked on the line, and scores are never silently recomputed.',
    ta: 'உங்கள் குறியீடு {n} அளவீடுகளில் {a} இலிருந்து {b} ஆக மாறியுள்ளது; {low}. ஜூலை அடிப்படை அளவீடும் அக்டோபர் அளவீடும் சோதனை முறையில் மதிப்பிடப்பட்டன; ஒவ்வொரு முறை மாற்றமும் கோட்டில் குறிக்கப்பட்டுள்ளது, மதிப்பெண்கள் ஒருபோதும் சொல்லாமல் மீண்டும் கணக்கிடப்படுவதில்லை.',
    hi: 'आपका इंडेक्स {n} मापों में {a} से {b} पर आया है, {low}। जुलाई का आधार माप और अक्टूबर का माप पायलट पद्धति से आँके गए थे; पद्धति का हर बदलाव रेखा पर दिखाया गया है, और स्कोर कभी चुपचाप दोबारा नहीं गिने जाते।',
  },
  hsLowEach: { en: '{term} lowest each time', ta: 'ஒவ்வொரு முறையும் {term} மிகக் குறைவு', hi: 'हर बार {term} सबसे कम रहा' },
  hsLowNow: { en: '{term} lowest now', ta: 'இப்போது {term} மிகக் குறைவு', hi: 'अभी {term} सबसे कम है' },
  hsSixTerms: { en: 'Six terms', ta: 'ஆறு அம்சங்கள்', hi: 'छह पहलू' },
  hsPlanned: { en: 'v1.1 · planned', ta: 'v1.1 · திட்டமிடப்பட்டது', hi: 'v1.1 · प्रस्तावित' },
  hsNext: { en: 'next', ta: 'அடுத்து', hi: 'अगला' },
  hsLegIndex: { en: 'Index grade', ta: 'குறியீட்டு நிலை', hi: 'इंडेक्स ग्रेड' },
  hsLegClinical: { en: 'Clinical grade · physician-signed', ta: 'மருத்துவ நிலை · மருத்துவர் கையொப்பம்', hi: 'क्लिनिकल ग्रेड · डॉक्टर के हस्ताक्षर' },
  hsLegMethod: { en: 'Method change · v1.0 published {date}, v1.1 planned', ta: 'முறை மாற்றம் · v1.0 வெளியீடு {date}, v1.1 திட்டமிடப்பட்டது', hi: 'पद्धति बदलाव · v1.0 जारी {date}, v1.1 प्रस्तावित' },
  hsCaption: { en: 'Index history, newest first', ta: 'குறியீட்டு வரலாறு, புதியது முதலில்', hi: 'इंडेक्स इतिहास, नया पहले' },
  hsMeasured: { en: 'Measured', ta: 'அளவிட்ட நாள்', hi: 'माप की तारीख़' },
  hsGrade: { en: 'Grade', ta: 'நிலை', hi: 'ग्रेड' },
  hsMethodEngine: { en: 'Method · engine', ta: 'முறை · இயந்திரம்', hi: 'पद्धति · इंजन' },
  hsLowest: { en: 'Lowest', ta: 'மிகக் குறைவு', hi: 'सबसे कम' },
  hsSignedBy: { en: 'Signed by', ta: 'கையொப்பமிட்டவர்', hi: 'हस्ताक्षरकर्ता' },
  hsBaseline: { en: 'baseline', ta: 'அடிப்படை', hi: 'आधार' },
  hsSelf: { en: 'Self-assessed', ta: 'சுய மதிப்பீடு', hi: 'स्व-मूल्यांकन' },
  hsPilotNote: {
    en: 'Pilot weights, same six terms · shown as recorded, never recomputed',
    ta: 'சோதனை எடைகள், அதே ஆறு அம்சங்கள் · பதிவானபடியே காட்டப்படுகிறது, மீண்டும் கணக்கிடப்படுவதில்லை',
    hi: 'पायलट भार, वही छह पहलू · जैसा दर्ज हुआ वैसा ही, कभी दोबारा नहीं गिना गया',
  },
  mbAria: { en: 'Measured today', ta: 'இன்று அளவிடப்பட்டது', hi: 'आज मापा गया' },
  mbPreview: { en: 'Preview', ta: 'முன்னோட்டம்', hi: 'पूर्वावलोकन' },
  mbRemeasure: { en: 'Re-measure', ta: 'மறு அளவீடு', hi: 'दोबारा माप' },
  mbMeasured: { en: '{kind} · measured {date}', ta: '{kind} · {date} அன்று அளவிடப்பட்டது', hi: '{kind} · {date} को मापा गया' },
  mbVs: { en: 'vs {v} on {date}', ta: '{date} அன்று {v} உடன் ஒப்பிட', hi: '{date} के {v} की तुलना में' },
  mbKept: {
    en: 'Kept beside your history; your recorded Index changes only at the Day-90 re-measure.',
    ta: 'உங்கள் வரலாற்றுடன் சேர்த்து வைக்கப்பட்டுள்ளது; பதிவான குறியீடு நாள்-90 மறு அளவீட்டில் மட்டுமே மாறும்.',
    hi: 'आपके इतिहास के साथ रखा गया है; आपका दर्ज इंडेक्स सिर्फ़ दिन-90 के दोबारा माप पर बदलेगा।',
  },
  mbAwaiting: {
    en: 'Awaiting Dr Meera’s sign-off for the Clinical grade.',
    ta: 'மருத்துவ நிலைக்கு Dr Meera-வின் கையொப்பத்துக்காகக் காத்திருக்கிறது.',
    hi: 'क्लिनिकल ग्रेड के लिए Dr Meera के हस्ताक्षर का इंतज़ार है।',
  },
  mbTakeAgain: { en: 'Take it again', ta: 'மீண்டும் செய்யவும்', hi: 'फिर से करें' },
  mbSeeDay90: { en: 'See Day 90', ta: 'நாள் 90-ஐப் பார்க்கவும்', hi: 'दिन 90 देखें' },
  mbConfirmAria: { en: 'Confirm clearing the preview', ta: 'முன்னோட்டத்தை அழிப்பதை உறுதிசெய்யவும்', hi: 'पूर्वावलोकन हटाने की पुष्टि करें' },
  mbClearPreviewQ: { en: 'Clear this preview?', ta: 'இந்த முன்னோட்டத்தை அழிக்கவா?', hi: 'यह पूर्वावलोकन हटाएँ?' },
  mbClearResultQ: { en: 'Clear this result?', ta: 'இந்த முடிவை அழிக்கவா?', hi: 'यह परिणाम हटाएँ?' },
  mbYesClear: { en: 'Yes, clear', ta: 'ஆம், அழிக்கவும்', hi: 'हाँ, हटाएँ' },
  mbKeep: { en: 'Keep', ta: 'வைத்திருக்கவும்', hi: 'रहने दें' },
  mbClear: { en: 'Clear', ta: 'அழிக்கவும்', hi: 'हटाएँ' },
  mbClearPreview: { en: 'Clear this preview', ta: 'இந்த முன்னோட்டத்தை அழிக்கவும்', hi: 'यह पूर्वावलोकन हटाएँ' },
  mbClearResult: { en: 'Clear this result', ta: 'இந்த முடிவை அழிக்கவும்', hi: 'यह परिणाम हटाएँ' },
  mbTermsAria: { en: 'Terms from this sitting', ta: 'இந்த அமர்வின் அம்சங்கள்', hi: 'इस सत्र के पहलू' },
  icAria: { en: 'Printable Index card', ta: 'அச்சிடக்கூடிய குறியீட்டு அட்டை', hi: 'प्रिंट करने योग्य इंडेक्स कार्ड' },
  icTitle: { en: 'The Joyspan Index card', ta: 'ஜாய்ஸ்பான் குறியீட்டு அட்டை', hi: 'जॉयस्पैन इंडेक्स कार्ड' },
  icPrint: { en: 'Print', ta: 'அச்சிடவும்', hi: 'प्रिंट करें' },
  icGm: { en: 'GM of five {gm} − {l} × {b} = {v} · {band}', ta: 'ஐந்தின் GM {gm} − {l} × {b} = {v} · {band}', hi: 'पाँचों का GM {gm} − {l} × {b} = {v} · {band}' },
  icNext: { en: 'Next step: {term}. {title}', ta: 'அடுத்த படி: {term}. {title}', hi: 'अगला कदम: {term}। {title}' },
  icNote: {
    en: 'Index grade is self-assessed with wearable signals. A Clinical grade card carries your physician’s signature and is final only after sign-off.',
    ta: 'குறியீட்டு நிலை, அணியும் சாதனச் சிக்னல்களுடன் கூடிய சுய மதிப்பீடு. மருத்துவ நிலை அட்டையில் உங்கள் மருத்துவரின் கையொப்பம் இருக்கும்; கையொப்பத்துக்குப் பிறகே அது இறுதியானது.',
    hi: 'इंडेक्स ग्रेड वियरेबल सिग्नल के साथ स्व-मूल्यांकन है। क्लिनिकल ग्रेड कार्ड पर आपके डॉक्टर के हस्ताक्षर होते हैं, और हस्ताक्षर के बाद ही वह अंतिम होता है।',
  },
  nyBody: {
    en: 'If a term lacks enough items, its petal is drawn as a dotted outline and named {nym}. It is never imputed. Here, without {free}, the engine returns {r} until the term is complete.',
    ta: 'ஒரு அம்சத்துக்குப் போதுமான பதில்கள் இல்லையென்றால், அதன் இதழ் புள்ளிக்கோட்டு வடிவில் வரையப்பட்டு {nym} எனக் குறிக்கப்படும். அது ஒருபோதும் ஊகிக்கப்படுவதில்லை. இங்கே {free} இல்லாமல், அந்த அம்சம் முழுமையாகும் வரை இயந்திரம் {r} தருகிறது.',
    hi: 'अगर किसी पहलू के पर्याप्त जवाब नहीं हैं, तो उसकी पंखुड़ी बिंदुदार रेखा में बनती है और उसे {nym} कहा जाता है। उसका अनुमान कभी नहीं लगाया जाता। यहाँ {free} के बिना, जब तक वह पहलू पूरा न हो, इंजन {r} लौटाता है।',
  },
  nyNoIndex: { en: 'no Index', ta: 'குறியீடு இல்லை', hi: 'कोई इंडेक्स नहीं' },
  methodPage: { en: 'The method page', ta: 'முறை விளக்கப் பக்கம்', hi: 'पद्धति का पेज' },

  // ─── Take the Index ─────────────────────────────────────────────────────
  tkBrand: { en: 'The Joyspan Index', ta: 'ஜாய்ஸ்பான் குறியீடு', hi: 'जॉयस्पैन इंडेक्स' },
  tkSaveLater: { en: 'Save and continue later', ta: 'சேமித்து, பிறகு தொடரவும்', hi: 'सहेजें और बाद में जारी रखें' },
  tkSaveShort: { en: 'Save · later', ta: 'சேமி · பிறகு', hi: 'सहेजें · बाद में' },
  tkCloseAria: { en: 'Close and return to My Index', ta: 'மூடி, என் குறியீட்டுக்குத் திரும்பவும்', hi: 'बंद करें और मेरे इंडेक्स पर लौटें' },
  tkSittingOf: { en: 'Sitting {n} of 2 · {title}', ta: '2 இல் அமர்வு {n} · {title}', hi: '2 में से सत्र {n} · {title}' },
  tkItemOf: { en: 'Item {n} of {t}', ta: '{t} இல் கேள்வி {n}', hi: '{t} में से प्रश्न {n}' },
  tkSignals: { en: 'Signals', ta: 'சிக்னல்கள்', hi: 'सिग्नल' },
  tkProgress: { en: 'Sitting {n} progress', ta: 'அமர்வு {n} முன்னேற்றம்', hi: 'सत्र {n} की प्रगति' },
  tkOffline: {
    en: 'Saved on this phone after every answer. Works offline; syncs when you are back.',
    ta: 'ஒவ்வொரு பதிலுக்குப் பிறகும் இந்த ஃபோனில் சேமிக்கப்படும். இணையம் இல்லாமலும் இயங்கும்; மீண்டும் இணைந்ததும் ஒத்திசைக்கப்படும்.',
    hi: 'हर जवाब के बाद इस फ़ोन पर सहेजा जाता है। ऑफ़लाइन भी चलता है; नेटवर्क लौटने पर सिंक हो जाता है।',
  },
  curReview: { en: 'the review', ta: 'மதிப்பாய்வு', hi: 'समीक्षा' },
  curItem: { en: 'item {p} of {t}, sitting {n}', ta: 'அமர்வு {n}, {t} இல் கேள்வி {p}', hi: 'सत्र {n}, {t} में से प्रश्न {p}' },
  curBreak: { en: 'the start of sitting 2', ta: 'அமர்வு 2-இன் தொடக்கம்', hi: 'सत्र 2 की शुरुआत' },
  curSignals: { en: 'the signals check, sitting {n}', ta: 'அமர்வு {n}, சிக்னல் சரிபார்ப்பு', hi: 'सत्र {n}, सिग्नल जाँच' },
  curIntro: { en: '{name}, sitting {n}', ta: '{name}, அமர்வு {n}', hi: '{name}, सत्र {n}' },
  ovEyebrow: { en: '{kind} · {grade} · {method} · {day}', ta: '{kind} · {grade} · {method} · {day}', hi: '{kind} · {grade} · {method} · {day}' },
  ovTitle: { en: 'About {n} minutes, in *two* sittings.', ta: 'சுமார் {n} நிமிடங்கள், *இரண்டு* அமர்வுகளில்.', hi: 'लगभग {n} मिनट, *दो* सत्रों में।' },
  ovBody: {
    en: '{n} validated statements across the six terms, with your Oura and Apple Health signals beside them; you confirm the signals at the end of each sitting. Answer for how things are, not how you would like them to be. There are no right answers, and you can stop at any point.',
    ta: 'ஆறு அம்சங்களிலும் {n} சரிபார்க்கப்பட்ட கூற்றுகள், அவற்றுடன் உங்கள் Oura, Apple Health சிக்னல்கள்; ஒவ்வொரு அமர்வின் முடிவிலும் சிக்னல்களை நீங்களே உறுதிசெய்வீர்கள். விஷயங்கள் இப்போது எப்படி இருக்கின்றனவோ அப்படியே பதிலளியுங்கள், நீங்கள் விரும்புவது போல் அல்ல. சரியான பதில் என்று எதுவும் இல்லை; எப்போது வேண்டுமானாலும் நிறுத்தலாம்.',
    hi: 'छह पहलुओं पर {n} प्रमाणित कथन, और उनके साथ आपके Oura और Apple Health सिग्नल; हर सत्र के अंत में आप सिग्नल की पुष्टि करते हैं। जैसा अभी है वैसा जवाब दें, न कि जैसा आप चाहते हैं। कोई जवाब सही या ग़लत नहीं है, और आप कभी भी रुक सकते हैं।',
  },
  ovOpens: {
    en: 'Your re-measure opens on Day {n} ({date}). This preview is scored the same way and kept beside your history; it does not replace your January measure.',
    ta: 'உங்கள் மறு அளவீடு நாள் {n} ({date}) அன்று தொடங்கும். இந்த முன்னோட்டமும் அதே முறையில் மதிப்பிடப்பட்டு உங்கள் வரலாற்றுடன் வைக்கப்படும்; இது உங்கள் ஜனவரி அளவீட்டுக்கு மாற்றாகாது.',
    hi: 'आपका दोबारा माप दिन {n} ({date}) को खुलेगा। यह पूर्वावलोकन भी उसी तरह आँका जाता है और आपके इतिहास के साथ रखा जाता है; यह आपके जनवरी के माप की जगह नहीं लेता।',
  },
  ovSitting: { en: 'Sitting {n}', ta: 'அமர்வு {n}', hi: 'सत्र {n}' },
  ovMinItems: { en: '{m} min · {n} items', ta: '{m} நிமிடம் · {n} கேள்விகள்', hi: '{m} मिनट · {n} प्रश्न' },
  ovSignalsCheck: { en: 'Signals check', ta: 'சிக்னல் சரிபார்ப்பு', hi: 'सिग्नल जाँच' },
  ovConsent: {
    en: 'Your answers are scored by the Index engine and seen by your named team only as you consented. Never by an employer or insurer.',
    ta: 'உங்கள் பதில்கள் குறியீட்டு இயந்திரத்தால் மதிப்பிடப்படும்; நீங்கள் ஒப்புக்கொண்டபடி, பெயர் தெரிந்த உங்கள் குழு மட்டுமே பார்க்கும். முதலாளியோ காப்பீட்டு நிறுவனமோ ஒருபோதும் பார்க்காது.',
    hi: 'आपके जवाब इंडेक्स इंजन आँकता है, और सिर्फ़ आपकी सहमति के मुताबिक़ आपकी तय टीम देखती है। कोई नियोक्ता या बीमा कंपनी कभी नहीं।',
  },
  ovNotGuessed: {
    en: 'A term without enough answers is shown as “not yet measured”, never guessed.',
    ta: 'போதுமான பதில்கள் இல்லாத அம்சம் “இன்னும் அளவிடப்படவில்லை” எனக் காட்டப்படும்; ஒருபோதும் ஊகிக்கப்படாது.',
    hi: 'जिस पहलू के पर्याप्त जवाब नहीं हैं, उसे “अभी मापा नहीं गया” दिखाया जाता है, अनुमान कभी नहीं लगाया जाता।',
  },
  ovSpecB: { en: 'Specimen wording.', ta: 'மாதிரிச் சொற்கள்.', hi: 'नमूना शब्दावली।' },
  ovSpec: {
    en: '{b} All {n} items are here, each at its real position. Licensed item wording is loaded from the instrument registry; the wording shown is indicative.',
    ta: '{b} அனைத்து {n} கேள்விகளும் அவற்றின் உண்மையான இடத்தில் இங்கே உள்ளன. உரிமம் பெற்ற கேள்விச் சொற்கள் கருவிப் பதிவேட்டிலிருந்து ஏற்றப்படும்; இங்கே காட்டப்படுவது தோராயமானது.',
    hi: '{b} सभी {n} प्रश्न यहाँ हैं, हर एक अपनी असली जगह पर। लाइसेंस वाले प्रश्नों के शब्द उपकरण रजिस्ट्री से आते हैं; यहाँ दिखाए गए शब्द सांकेतिक हैं।',
  },
  ovKept: { en: '{n} answers kept. You stopped at {where}.', ta: '{n} பதில்கள் சேமிக்கப்பட்டுள்ளன. நீங்கள் நிறுத்திய இடம்: {where}.', hi: '{n} जवाब सहेजे गए। आप यहाँ रुके थे: {where}।' },
  ovContinue: { en: 'Continue where you left off', ta: 'விட்ட இடத்திலிருந்து தொடரவும்', hi: 'जहाँ छोड़ा था वहीं से जारी रखें' },
  ovBegin1: { en: 'Begin sitting 1', ta: 'அமர்வு 1-ஐத் தொடங்கவும்', hi: 'सत्र 1 शुरू करें' },
  ovRestart: { en: 'Start again from the beginning', ta: 'முதலிலிருந்து மீண்டும் தொடங்கவும்', hi: 'शुरू से फिर शुरू करें' },
  inOf: { en: 'Instrument {i} of {n}', ta: '{n} இல் கேள்வித்தாள் {i}', hi: '{n} में से प्रश्नावली {i}' },
  inAbout: { en: 'about {m} min · {n} items', ta: 'சுமார் {m} நிமிடம் · {n} கேள்விகள்', hi: 'लगभग {m} मिनट · {n} प्रश्न' },
  inFeeds: { en: 'Feeds', ta: 'பங்களிக்கும் அம்சம்', hi: 'किस पहलू में जुड़ता है' },
  inLicence: { en: 'Licence', ta: 'உரிமம்', hi: 'लाइसेंस' },
  inBegin: { en: 'Begin', ta: 'தொடங்கவும்', hi: 'शुरू करें' },
  itKeys: { en: 'Keys {r} choose an answer.', ta: '{r} விசைகள் மூலம் பதிலைத் தேர்ந்தெடுக்கலாம்.', hi: '{r} कुंजियों से जवाब चुनें।' },
  itBackReview: { en: 'Back to review', ta: 'மதிப்பாய்வுக்குத் திரும்பவும்', hi: 'समीक्षा पर लौटें' },
  itNext: { en: 'Next', ta: 'அடுத்து', hi: 'आगे' },
  sgEyebrow: { en: 'Sitting {n} · your signals', ta: 'அமர்வு {n} · உங்கள் சிக்னல்கள்', hi: 'सत्र {n} · आपके सिग्नल' },
  sgTitle: { en: 'These readings sit *beside* your answers.', ta: 'இந்த அளவீடுகள் உங்கள் பதில்களுக்கு *அருகில்* இருக்கும்.', hi: 'ये रीडिंग आपके जवाबों के *साथ* रहती हैं।' },
  sgBody: {
    en: 'Read on this phone from Oura and Apple Health over the last 30 days, summarised, never shown raw to anyone. Leave any of them out and that term is scored from your answers alone.',
    ta: 'கடந்த 30 நாட்களில் Oura, Apple Health-இலிருந்து இந்த ஃபோனிலேயே படிக்கப்பட்டுச் சுருக்கப்பட்டவை; மூலத் தரவு யாருக்கும் காட்டப்படாது. இவற்றில் எதையாவது விலக்கினால், அந்த அம்சம் உங்கள் பதில்களை வைத்து மட்டும் மதிப்பிடப்படும்.',
    hi: 'पिछले 30 दिनों में Oura और Apple Health से इसी फ़ोन पर पढ़ी गईं, सारांश में; कच्चा डेटा कभी किसी को नहीं दिखाया जाता। इनमें से किसी को भी हटाएँ, तो वह पहलू सिर्फ़ आपके जवाबों से आँका जाएगा।',
  },
  sgShare: { en: '{s}% answers · {g}% signals', ta: '{s}% பதில்கள் · {g}% சிக்னல்கள்', hi: '{s}% जवाब · {g}% सिग्नल' },
  sgReading: { en: 'Reading on this phone', ta: 'இந்த ஃபோனில் உள்ள அளவீடு', hi: 'इस फ़ोन पर रीडिंग' },
  sgConfirmBack: { en: 'Confirm and back to review', ta: 'உறுதிசெய்து மதிப்பாய்வுக்குத் திரும்பவும்', hi: 'पुष्टि करें और समीक्षा पर लौटें' },
  sgConfirm: { en: 'Confirm these signals', ta: 'இந்தச் சிக்னல்களை உறுதிசெய்யவும்', hi: 'इन सिग्नल की पुष्टि करें' },
  brEyebrow: { en: 'Sitting 1 · done', ta: 'அமர்வு 1 · முடிந்தது', hi: 'सत्र 1 · पूरा' },
  brTitle: { en: 'Half way. *Take* a breath.', ta: 'பாதி முடிந்தது. *சற்று* மூச்சு விடுங்கள்.', hi: 'आधा हो गया। *ज़रा* साँस ले लें।' },
  brBody: {
    en: 'Your answers for {s1} are saved. Sitting 2 covers {s2}, about ten minutes. Many people take it the next evening{tail}.',
    ta: '{s1} பற்றிய உங்கள் பதில்கள் சேமிக்கப்பட்டன. அமர்வு 2 {s2} பற்றியது, சுமார் பத்து நிமிடங்கள். பலர் அதை அடுத்த நாள் மாலை செய்கிறார்கள்{tail}.',
    hi: '{s1} के लिए आपके जवाब सहेज लिए गए हैं। सत्र 2 में {s2} हैं, लगभग दस मिनट। कई लोग इसे अगली शाम करते हैं{tail}।',
  },
  brTail: { en: '; the re-measure window stays open until Day 90', ta: '; மறு அளவீட்டுக் காலம் நாள் 90 வரை திறந்திருக்கும்', hi: '; दोबारा माप की अवधि दिन 90 तक खुली रहती है' },
  brNext: { en: 'Next · sitting 2', ta: 'அடுத்து · அமர்வு 2', hi: 'अगला · सत्र 2' },
  brBegin2: { en: 'Begin sitting 2', ta: 'அமர்வு 2-ஐத் தொடங்கவும்', hi: 'सत्र 2 शुरू करें' },
  brLater: { en: 'Continue later', ta: 'பிறகு தொடரவும்', hi: 'बाद में जारी रखें' },
  rvEyebrow: { en: 'Before you submit', ta: 'சமர்ப்பிக்கும் முன்', hi: 'जमा करने से पहले' },
  rvTitle: { en: 'Check your *answers*.', ta: 'உங்கள் *பதில்களைச்* சரிபாருங்கள்.', hi: 'अपने *जवाब* जाँच लें।' },
  rvCount: {
    en: '{a} of {n} items answered. Change anything that does not sound like you.',
    ta: '{n} இல் {a} கேள்விகளுக்குப் பதில் அளிக்கப்பட்டது. உங்களைப் போல் இல்லாத எதையும் மாற்றுங்கள்.',
    hi: '{n} में से {a} प्रश्नों के जवाब दिए गए। जो भी आप जैसा न लगे, उसे बदल दें।',
  },
  rvNotAnswered: { en: 'Not answered', ta: 'பதில் இல்லை', hi: 'जवाब नहीं दिया' },
  rvEditAria: { en: 'Edit answer: {text}', ta: 'பதிலைத் திருத்தவும்: {text}', hi: 'जवाब बदलें: {text}' },
  rvEdit: { en: 'Edit', ta: 'திருத்தவும்', hi: 'बदलें' },
  rvSignals: { en: 'Signals beside these answers', ta: 'இந்தப் பதில்களுடன் உள்ள சிக்னல்கள்', hi: 'इन जवाबों के साथ सिग्नल' },
  rvNone: { en: 'None for these terms', ta: 'இந்த அம்சங்களுக்கு எதுவும் இல்லை', hi: 'इन पहलुओं के लिए कोई नहीं' },
  rvUsed: { en: '{u} of {n} used', ta: '{n} இல் {u} பயன்படுத்தப்பட்டன', hi: '{n} में से {u} इस्तेमाल हुए' },
  rvConfirmed: { en: 'Confirmed', ta: 'உறுதிசெய்யப்பட்டது', hi: 'पुष्टि हो गई' },
  rvNotConfirmed: { en: 'Not yet confirmed', ta: 'இன்னும் உறுதிசெய்யப்படவில்லை', hi: 'अभी पुष्टि नहीं हुई' },
  rvSignalsAria: { en: 'Review signals for sitting {n}', ta: 'அமர்வு {n}-க்கான சிக்னல்களைப் பார்க்கவும்', hi: 'सत्र {n} के सिग्नल देखें' },
  rvPlease: { en: 'Please answer the items marked “not answered”.', ta: '“பதில் இல்லை” எனக் குறிக்கப்பட்ட கேள்விகளுக்குப் பதிலளியுங்கள்.', hi: 'कृपया “जवाब नहीं दिया” वाले प्रश्नों के जवाब दें।' },
  rvFirst: { en: 'Go to the first one', ta: 'முதலாவதுக்குச் செல்லவும்', hi: 'पहले वाले पर जाएँ' },
  rvSubmit: { en: 'Submit for scoring', ta: 'மதிப்பீட்டுக்குச் சமர்ப்பிக்கவும்', hi: 'स्कोर के लिए जमा करें' },
  svEyebrow: { en: 'Saved on this phone', ta: 'இந்த ஃபோனில் சேமிக்கப்பட்டது', hi: 'इस फ़ोन पर सहेजा गया' },
  svTitle: { en: 'Pick it up *whenever*.', ta: '*எப்போது* வேண்டுமானாலும் தொடரலாம்.', hi: '*जब* चाहें, फिर शुरू करें।' },
  svBody: {
    en: '{n} answers kept. You will start again at {where}. Nothing is scored until you submit, and nobody is told you paused.',
    ta: '{n} பதில்கள் சேமிக்கப்பட்டுள்ளன. மீண்டும் தொடங்கும் இடம்: {where}. நீங்கள் சமர்ப்பிக்கும் வரை எதுவும் மதிப்பிடப்படாது; நீங்கள் இடைநிறுத்தியது யாருக்கும் சொல்லப்படாது.',
    hi: '{n} जवाब सहेजे गए। आप यहाँ से फिर शुरू करेंगे: {where}। जमा करने तक कुछ नहीं आँका जाता, और किसी को नहीं बताया जाता कि आप रुके।',
  },
  svOpenUntil: {
    en: 'The re-measure window is open until Day {n}. One gentle reminder, never inside your quiet hours ({q}).',
    ta: 'மறு அளவீட்டுக் காலம் நாள் {n} வரை திறந்திருக்கும். ஒரே ஒரு மென்மையான நினைவூட்டல், உங்கள் அமைதி நேரத்துக்குள் ({q}) ஒருபோதும் இல்லை.',
    hi: 'दोबारा माप की अवधि दिन {n} तक खुली है। बस एक हल्का-सा रिमाइंडर, आपके शांत समय ({q}) में कभी नहीं।',
  },
  svPreview: {
    en: 'This is a preview; your re-measure opens on Day {n}. No reminders are sent for a preview.',
    ta: 'இது ஒரு முன்னோட்டம்; உங்கள் மறு அளவீடு நாள் {n} அன்று தொடங்கும். முன்னோட்டத்துக்கு நினைவூட்டல்கள் அனுப்பப்படாது.',
    hi: 'यह पूर्वावलोकन है; आपका दोबारा माप दिन {n} को खुलेगा। पूर्वावलोकन के लिए कोई रिमाइंडर नहीं भेजा जाता।',
  },
  svNow: { en: 'Continue now', ta: 'இப்போது தொடரவும்', hi: 'अभी जारी रखें' },
  svToday: { en: 'Back to Today', ta: 'இன்றைய பக்கத்துக்குத் திரும்பவும்', hi: 'आज पर वापस जाएँ' },
  scStage1: { en: 'Checking every term has enough answers', ta: 'ஒவ்வொரு அம்சத்துக்கும் போதுமான பதில்கள் உள்ளனவா எனச் சரிபார்க்கிறது', hi: 'जाँच रहे हैं कि हर पहलू के पर्याप्त जवाब हैं' },
  scStage2: { en: 'Scoring six terms · {m} · {b}', ta: 'ஆறு அம்சங்களை மதிப்பிடுகிறது · {m} · {b}', hi: 'छह पहलुओं का स्कोर · {m} · {b}' },
  scStage3: { en: 'Geometric mean of five {gm}, minus λ·B {b}', ta: 'ஐந்தின் பெருக்கல் சராசரி {gm}, கழித்தல் λ·B {b}', hi: 'पाँचों का ज्यामितीय औसत {gm}, घटा λ·B {b}' },
  scStage4: { en: 'Pinning the method, the date and the next measure', ta: 'முறை, தேதி, அடுத்த அளவீடு ஆகியவற்றைப் பதிவு செய்கிறது', hi: 'पद्धति, तारीख़ और अगला माप तय कर रहे हैं' },
  scEyebrow: { en: 'Scoring with {m}', ta: '{m} மூலம் மதிப்பிடுகிறது', hi: '{m} से स्कोर हो रहा है' },
  scReady: { en: 'Your Index is *ready*.', ta: 'உங்கள் குறியீடு *தயார்*.', hi: 'आपका इंडेक्स *तैयार* है।' },
  scMoment: { en: 'One moment.', ta: 'ஒரு நிமிடம்.', hi: 'बस एक पल।' },
  scSame: {
    en: 'The same as {v} on your January measure. Lowest term: {term}.',
    ta: 'உங்கள் ஜனவரி அளவீட்டின் {v} போலவே. மிகக் குறைந்த அம்சம்: {term}.',
    hi: 'जनवरी के माप {v} के बराबर। सबसे कम पहलू: {term}।',
  },
  scUp: {
    en: 'Up from {v} on your January measure. Lowest term: {term}.',
    ta: 'உங்கள் ஜனவரி அளவீட்டின் {v} இலிருந்து உயர்வு. மிகக் குறைந்த அம்சம்: {term}.',
    hi: 'जनवरी के माप {v} से ऊपर। सबसे कम पहलू: {term}।',
  },
  scFrom: {
    en: 'From {v} on your January measure. Lowest term: {term}.',
    ta: 'உங்கள் ஜனவரி அளவீடு {v} ஆக இருந்தது. மிகக் குறைந்த அம்சம்: {term}.',
    hi: 'जनवरी का माप {v} था। सबसे कम पहलू: {term}।',
  },
  scLower: {
    en: 'A lower number is information, not a verdict. {coach} will go through it with you at your next review. Your employer and your circle never see it.',
    ta: 'குறைந்த எண் ஒரு தகவல், தீர்ப்பு அல்ல. உங்கள் அடுத்த மதிப்பாய்வில் {coach} அதை உங்களுடன் பார்ப்பார். உங்கள் முதலாளியும் வட்டமும் அதை ஒருபோதும் பார்ப்பதில்லை.',
    hi: 'कम संख्या एक जानकारी है, फ़ैसला नहीं। आपकी अगली समीक्षा में {coach} इसे आपके साथ देखेंगी। आपका नियोक्ता और आपका सर्कल इसे कभी नहीं देखते।',
  },
  scYourCoach: { en: 'Your coach', ta: 'உங்கள் பயிற்சியாளர்', hi: 'आपकी कोच' },
  scTermsAria: { en: 'Your six terms from this sitting', ta: 'இந்த அமர்வில் உங்கள் ஆறு அம்சங்கள்', hi: 'इस सत्र से आपके छह पहलू' },
  scPreviewDay: {
    en: 'A preview on Day {d}: kept beside your history on My Index. Your recorded Index stays at {v} until the Day-90 re-measure.',
    ta: 'நாள் {d} அன்று ஒரு முன்னோட்டம்: என் குறியீட்டில் உங்கள் வரலாற்றுடன் வைக்கப்படும். நாள்-90 மறு அளவீடு வரை பதிவான உங்கள் குறியீடு {v} ஆகவே இருக்கும்.',
    hi: 'दिन {d} का पूर्वावलोकन: मेरे इंडेक्स पर आपके इतिहास के साथ रखा गया। दिन-90 के दोबारा माप तक आपका दर्ज इंडेक्स {v} ही रहेगा।',
  },
  scPhq: {
    en: 'Some of your {space} answers are above the level where a clinician takes a look. Dr Sanjay Menon will read them within 48 hours and may call. This is routine.',
    ta: '{space} தொடர்பான உங்கள் சில பதில்கள், ஒரு மருத்துவர் பார்க்க வேண்டிய அளவைத் தாண்டியுள்ளன. Dr Sanjay Menon 48 மணி நேரத்துக்குள் அவற்றைப் படித்து, உங்களை அழைக்கக்கூடும். இது வழக்கமான நடைமுறைதான்.',
    hi: '{space} से जुड़े आपके कुछ जवाब उस स्तर से ऊपर हैं जहाँ एक क्लिनिशियन उन्हें देखते हैं। Dr Sanjay Menon 48 घंटों के भीतर इन्हें पढ़ेंगे और फ़ोन कर सकते हैं। यह सामान्य प्रक्रिया है।',
  },
  scSeeDay90: { en: 'See your Day-90 result', ta: 'உங்கள் நாள்-90 முடிவைப் பார்க்கவும்', hi: 'अपना दिन-90 परिणाम देखें' },
  scSeeIndex: { en: 'See your Index', ta: 'உங்கள் குறியீட்டைப் பார்க்கவும்', hi: 'अपना इंडेक्स देखें' },
  scHowDay90: { en: 'How the Day-90 result is shown', ta: 'நாள்-90 முடிவு எப்படிக் காட்டப்படும்', hi: 'दिन-90 का परिणाम कैसे दिखाया जाता है' },

  // ─── Joy Ledger ─────────────────────────────────────────────────────────
  lgName: { en: 'The Joy Ledger', ta: 'ஜாய் லெட்ஜர்', hi: 'जॉय लेजर' },
  lgTitle: { en: 'Anything good, *kept* in ten seconds.', ta: 'நல்லது எதுவானாலும், பத்து வினாடிகளில் *சேமியுங்கள்*.', hi: 'कुछ भी अच्छा, दस सेकंड में *सहेजें*।' },
  lgLead: {
    en: 'Three short prompts a day. Tap what it was, add a word if you like, and move on. Over a week, it shows you where joy came from.',
    ta: 'நாளுக்கு மூன்று சிறிய கேள்விகள். அது என்ன என்று தட்டுங்கள், விரும்பினால் ஒரு சொல் சேருங்கள், தொடருங்கள். ஒரு வாரத்தில், மகிழ்ச்சி எங்கிருந்து வந்தது என்று இது காட்டும்.',
    hi: 'दिन में तीन छोटे सवाल। जो था उस पर टैप करें, चाहें तो एक शब्द जोड़ें, और आगे बढ़ें। एक हफ़्ते में यह दिखाता है कि ख़ुशी कहाँ से आई।',
  },
  lgPromptsOff: { en: 'Prompts off · you can still keep a moment', ta: 'கேள்விகள் நிறுத்தத்தில் · இருந்தாலும் ஒரு தருணத்தைச் சேமிக்கலாம்', hi: 'सवाल बंद · फिर भी आप एक पल सहेज सकते हैं' },
  lgPromptToday: { en: 'Prompt {p} of {n} today', ta: 'இன்று {n} இல் கேள்வி {p}', hi: 'आज {n} में से सवाल {p}' },
  lgPromptOf: { en: 'Prompt {p} of {n}', ta: '{n} இல் கேள்வி {p}', hi: '{n} में से सवाल {p}' },
  lgFeeds: {
    en: 'The Ledger feeds {term}: {f}. Joy moments are counted, never judged.',
    ta: 'லெட்ஜர், {term} அம்சத்துக்குப் பங்களிக்கிறது: {f}. மகிழ்ச்சித் தருணங்கள் எண்ணப்படுகின்றன, ஒருபோதும் மதிப்பிடப்படுவதில்லை.',
    hi: 'लेजर {term} में जुड़ता है: {f}। ख़ुशी के पल गिने जाते हैं, कभी परखे नहीं जाते।',
  },
  lgLegend: { en: 'What was it? Choose any that fit.', ta: 'அது என்ன? பொருந்துபவை எதையும் தேர்ந்தெடுக்கவும்.', hi: 'वह क्या था? जो भी ठीक लगे, चुनें।' },
  lgAddExtra: { en: 'Add a word or a photo (optional)', ta: 'ஒரு சொல் அல்லது புகைப்படம் சேர்க்கவும் (விருப்பம்)', hi: 'एक शब्द या फ़ोटो जोड़ें (वैकल्पिक)' },
  lgWordLabel: { en: 'A word or two', ta: 'ஓரிரு சொற்கள்', hi: 'एक-दो शब्द' },
  lgPlaceholder: { en: 'Lunch with Kavya', ta: 'Kavya உடன் மதிய உணவு', hi: 'Kavya के साथ लंच' },
  lgPhotoAlt: { en: 'Your photo, kept on this phone', ta: 'உங்கள் புகைப்படம், இந்த ஃபோனில் வைக்கப்பட்டுள்ளது', hi: 'आपकी फ़ोटो, इसी फ़ोन पर रखी गई' },
  lgPhotoAdded: { en: 'Photo added', ta: 'புகைப்படம் சேர்க்கப்பட்டது', hi: 'फ़ोटो जुड़ गई' },
  lgRemovePhoto: { en: 'Remove photo', ta: 'புகைப்படத்தை நீக்கவும்', hi: 'फ़ोटो हटाएँ' },
  lgAddPhoto: { en: 'Add a photo', ta: 'புகைப்படம் சேர்க்கவும்', hi: 'फ़ोटो जोड़ें' },
  lgNotPhoto: { en: 'That file is not a photo. Choose a JPEG, PNG or HEIC image.', ta: 'அந்தக் கோப்பு புகைப்படம் அல்ல. JPEG, PNG அல்லது HEIC படத்தைத் தேர்ந்தெடுக்கவும்.', hi: 'यह फ़ाइल फ़ोटो नहीं है। JPEG, PNG या HEIC तस्वीर चुनें।' },
  lgUnreadable: { en: 'That photo could not be read on this device. Try another.', ta: 'இந்தச் சாதனத்தில் அந்தப் புகைப்படத்தைப் படிக்க முடியவில்லை. வேறொன்றை முயலுங்கள்.', hi: 'यह फ़ोटो इस डिवाइस पर पढ़ी नहीं जा सकी। कोई दूसरी आज़माएँ।' },
  lgPhotosStay: { en: 'Photos stay on this phone and are never read by AI.', ta: 'புகைப்படங்கள் இந்த ஃபோனிலேயே இருக்கும்; AI ஒருபோதும் அவற்றைப் படிக்காது.', hi: 'फ़ोटो इसी फ़ोन पर रहती हैं और AI उन्हें कभी नहीं पढ़ता।' },
  lgEmpty: { en: 'Choose a tag, or add a word, to keep this moment.', ta: 'இந்தத் தருணத்தைச் சேமிக்க, ஒரு குறிச்சொல்லைத் தேர்ந்தெடுக்கவும் அல்லது ஒரு சொல் சேர்க்கவும்.', hi: 'यह पल सहेजने के लिए एक टैग चुनें, या एक शब्द जोड़ें।' },
  lgSave: { en: 'Save · 10 seconds', ta: 'சேமிக்கவும் · 10 வினாடிகள்', hi: 'सहेजें · 10 सेकंड' },
  lgNotNow: { en: 'Not now', ta: 'இப்போது வேண்டாம்', hi: 'अभी नहीं' },
  lgKept: { en: 'Kept. *Thank you.*', ta: 'சேமிக்கப்பட்டது. *நன்றி.*', hi: 'सहेज लिया। *धन्यवाद।*' },
  lgAMoment: { en: 'A moment', ta: 'ஒரு தருணம்', hi: 'एक पल' },
  lgAnd: { en: ' and ', ta: ', ', hi: ' और ' },
  lgSaved1: { en: '{what}{word}. That is {n} moment today.', ta: '{what}{word}. இன்று மொத்தம் {n} தருணம்.', hi: '{what}{word}। आज कुल {n} पल।' },
  lgSavedN: { en: '{what}{word}. That is {n} moments today.', ta: '{what}{word}. இன்று மொத்தம் {n} தருணங்கள்.', hi: '{what}{word}। आज कुल {n} पल।' },
  lgNextAt: { en: 'Next prompt at {t}, if you want it.', ta: 'நீங்கள் விரும்பினால், அடுத்த கேள்வி {t} மணிக்கு.', hi: 'चाहें तो अगला सवाल {t} बजे।' },
  lgLastToday: { en: 'That was the last prompt for today.', ta: 'இன்றைய கடைசி கேள்வி இதுதான்.', hi: 'आज का यह आख़िरी सवाल था।' },
  lgNowShows: { en: ' It now shows in this week’s view and the calendar.', ta: ' இது இப்போது இந்த வாரக் காட்சியிலும் நாட்காட்டியிலும் தெரியும்.', hi: ' अब यह इस हफ़्ते के दृश्य और कैलेंडर में दिखता है।' },
  lgAddAnother: { en: 'Add another moment', ta: 'இன்னொரு தருணத்தைச் சேர்க்கவும்', hi: 'एक और पल जोड़ें' },
  lgHeld: { en: 'We paused here, so a person can reach you first.', ta: 'ஒருவர் முதலில் உங்களைத் தொடர்புகொள்ள, இங்கே நிறுத்தியுள்ளோம்.', hi: 'हम यहाँ रुक गए हैं, ताकि पहले कोई व्यक्ति आप तक पहुँच सके।' },
  lgHeldNote: {
    en: 'Your words were not saved and were not sent to any AI. Tele-MANAS is free on 14416, any time.',
    ta: 'நீங்கள் எழுதியவை சேமிக்கப்படவில்லை, எந்த AI-க்கும் அனுப்பப்படவில்லை. Tele-MANAS 14416 இல் எந்நேரமும் இலவசமாகக் கிடைக்கும்.',
    hi: 'आपके शब्द न सहेजे गए, न किसी AI को भेजे गए। Tele-MANAS 14416 पर किसी भी समय मुफ़्त है।',
  },
  lgTalkNow: { en: 'Talk to someone now', ta: 'இப்போதே ஒருவரிடம் பேசுங்கள்', hi: 'अभी किसी से बात करें' },
  lgBackLedger: { en: 'Back to the Ledger', ta: 'லெட்ஜருக்குத் திரும்பவும்', hi: 'लेजर पर लौटें' },
  lgLater: { en: 'That’s fine. *Nothing* is counted against you.', ta: 'பரவாயில்லை. உங்களுக்கு எதிராக *எதுவும்* கணக்கிடப்படாது.', hi: 'कोई बात नहीं। आपके ख़िलाफ़ *कुछ भी* नहीं गिना जाता।' },
  lgNextIs: { en: 'The next prompt is at {t}.', ta: 'அடுத்த கேள்வி {t} மணிக்கு.', hi: 'अगला सवाल {t} बजे है।' },
  lgSleepWell: { en: 'That was the last prompt for today. Sleep well.', ta: 'இன்றைய கடைசி கேள்வி இதுதான். நன்றாகத் தூங்குங்கள்.', hi: 'आज का यह आख़िरी सवाल था। अच्छी नींद लें।' },
  lgActually: { en: 'Actually, add one', ta: 'சரி, ஒன்றைச் சேர்க்கலாம்', hi: 'चलिए, एक जोड़ें' },
  scOff: { en: 'Saved · prompt {p} is off', ta: 'சேமிக்கப்பட்டது · கேள்வி {p} நிறுத்தப்பட்டது', hi: 'सहेजा गया · सवाल {p} बंद है' },
  scQuiet: {
    en: 'Saved · prompt {p} at {t} sits inside quiet hours, so it is paused until you move it',
    ta: 'சேமிக்கப்பட்டது · {t} மணிக் கேள்வி {p} அமைதி நேரத்துக்குள் வருகிறது; நீங்கள் மாற்றும் வரை நிறுத்தி வைக்கப்படும்',
    hi: 'सहेजा गया · {t} बजे का सवाल {p} शांत समय में आता है, इसलिए जब तक आप इसे न बदलें, रुका रहेगा',
  },
  scAt: { en: 'Saved · prompt {p} at {t}', ta: 'சேமிக்கப்பட்டது · கேள்வி {p}, {t} மணிக்கு', hi: 'सहेजा गया · सवाल {p}, {t} बजे' },
  scUsual: { en: 'Saved · back to the usual three prompts', ta: 'சேமிக்கப்பட்டது · வழக்கமான மூன்று கேள்விகளுக்குத் திரும்பியது', hi: 'सहेजा गया · वापस सामान्य तीन सवाल' },
  scOnCount: { en: '{n} of 3 on', ta: '3 இல் {n} இயக்கத்தில்', hi: '3 में से {n} चालू' },
  scTitle: { en: 'Prompts and quiet hours', ta: 'கேள்விகளும் அமைதி நேரமும்', hi: 'सवाल और शांत समय' },
  scRow: { en: 'Prompt {p} · {label}', ta: 'கேள்வி {p} · {label}', hi: 'सवाल {p} · {label}' },
  scTimeFor: { en: 'Time for prompt {p}', ta: 'கேள்வி {p}-க்கான நேரம்', hi: 'सवाल {p} का समय' },
  scInside: { en: 'Inside your quiet hours. Choose a time before {q}.', ta: 'உங்கள் அமைதி நேரத்துக்குள் உள்ளது. {q} க்கு முன் ஒரு நேரத்தைத் தேர்ந்தெடுக்கவும்.', hi: 'यह आपके शांत समय में है। {q} से पहले का समय चुनें।' },
  scInApp: { en: 'In the app', ta: 'ஆப்பில்', hi: 'ऐप में' },
  scOffShort: { en: 'Off', ta: 'நிறுத்தத்தில்', hi: 'बंद' },
  scRestore: { en: 'Restore the usual times', ta: 'வழக்கமான நேரங்களை மீட்டமைக்கவும்', hi: 'सामान्य समय वापस लाएँ' },
  scQuietLine: {
    en: 'Quiet hours {q}. Nothing arrives inside them, and never more than three a day.',
    ta: 'அமைதி நேரம் {q}. அந்த நேரத்தில் எதுவும் வராது; நாளுக்கு மூன்றுக்கு மேல் ஒருபோதும் வராது.',
    hi: 'शांत समय {q}। इस दौरान कुछ नहीं आता, और दिन में तीन से ज़्यादा कभी नहीं।',
  },
  scWhatsApp: { en: 'WhatsApp prompts are off. {link}', ta: 'WhatsApp கேள்விகள் நிறுத்தத்தில் உள்ளன. {link}', hi: 'WhatsApp सवाल बंद हैं। {link}' },
  scTurnOn: { en: 'Turn them on', ta: 'இயக்கவும்', hi: 'चालू करें' },
  wkTitle: { en: 'This week · where joy came from', ta: 'இந்த வாரம் · மகிழ்ச்சி எங்கிருந்து வந்தது', hi: 'इस हफ़्ते · ख़ुशी कहाँ से आई' },
  wkCount1: { en: '{n} moment this week.', ta: 'இந்த வாரம் {n} தருணம்.', hi: 'इस हफ़्ते {n} पल।' },
  wkCountN: { en: '{n} moments this week.', ta: 'இந்த வாரம் {n} தருணங்கள்.', hi: 'इस हफ़्ते {n} पल।' },
  wkEmptyTitle: { en: 'Nothing kept this week yet.', ta: 'இந்த வாரம் இன்னும் எதுவும் சேமிக்கப்படவில்லை.', hi: 'इस हफ़्ते अभी कुछ नहीं सहेजा गया।' },
  wkEmptyBody: { en: 'Quiet weeks are fine; they are not counted against you.', ta: 'அமைதியான வாரங்களும் பரவாயில்லை; அவை உங்களுக்கு எதிராகக் கணக்கிடப்படாது.', hi: 'शांत हफ़्ते भी ठीक हैं; उन्हें आपके ख़िलाफ़ नहीं गिना जाता।' },
  wkSr: { en: '{tag}: {n} moments', ta: '{tag}: {n} தருணங்கள்', hi: '{tag}: {n} पल' },
  wkHidden: { en: 'The weekly story is hidden.', ta: 'வாராந்திரக் கதை மறைக்கப்பட்டுள்ளது.', hi: 'साप्ताहिक कहानी छिपी है।' },
  wkShow: { en: 'Show it', ta: 'காட்டவும்', hi: 'दिखाएँ' },
  wkTwo: { en: 'The week, in two sentences', ta: 'இந்த வாரம், இரண்டு வாக்கியங்களில்', hi: 'यह हफ़्ता, दो वाक्यों में' },
  wkDrafted: {
    en: 'Drafted on Sunday from your tags and words only. Photos are never read. Moments kept since then appear in the chart, not in the story.',
    ta: 'ஞாயிறன்று உங்கள் குறிச்சொற்களையும் சொற்களையும் மட்டும் வைத்து வரையப்பட்டது. புகைப்படங்கள் ஒருபோதும் படிக்கப்படுவதில்லை. அதன் பிறகு சேமித்த தருணங்கள் வரைபடத்தில் தெரியும், கதையில் அல்ல.',
    hi: 'रविवार को सिर्फ़ आपके टैग और शब्दों से तैयार किया गया। फ़ोटो कभी नहीं पढ़ी जातीं। उसके बाद सहेजे गए पल चार्ट में दिखते हैं, कहानी में नहीं।',
  },
  calWeeks: { en: '4 weeks', ta: '4 வாரங்கள்', hi: '4 हफ़्ते' },
  calTitle: { en: 'The last four weeks', ta: 'கடந்த நான்கு வாரங்கள்', hi: 'पिछले चार हफ़्ते' },
  calLine: {
    en: 'Something kept on {a} of {b} days. Quiet days are fine; they are not counted against you.',
    ta: '{b} நாட்களில் {a} நாட்கள் ஏதாவது சேமிக்கப்பட்டது. அமைதியான நாட்களும் பரவாயில்லை; அவை உங்களுக்கு எதிராகக் கணக்கிடப்படாது.',
    hi: '{b} में से {a} दिन कुछ सहेजा गया। शांत दिन भी ठीक हैं; उन्हें आपके ख़िलाफ़ नहीं गिना जाता।',
  },
  calAria: { en: 'Joy Ledger entries per day, last 28 days', ta: 'ஜாய் லெட்ஜர் பதிவுகள், நாள் வாரியாக, கடந்த 28 நாட்கள்', hi: 'जॉय लेजर की प्रविष्टियाँ, हर दिन, पिछले 28 दिन' },
  calCell1: { en: '{day}: {n} entry', ta: '{day}: {n} பதிவு', hi: '{day}: {n} प्रविष्टि' },
  calCellN: { en: '{day}: {n} entries', ta: '{day}: {n} பதிவுகள்', hi: '{day}: {n} प्रविष्टियाँ' },
  calToday: { en: ', today', ta: ', இன்று', hi: ', आज' },
  calFewer: { en: 'Fewer', ta: 'குறைவு', hi: 'कम' },
  calThree: { en: '3 a day', ta: 'நாளுக்கு 3', hi: 'रोज़ 3' },
  enCount: { en: '{n} entries', ta: '{n} பதிவுகள்', hi: '{n} प्रविष्टियाँ' },
  enTitle: { en: 'Your entries', ta: 'உங்கள் பதிவுகள்', hi: 'आपकी प्रविष्टियाँ' },
  enFilter: { en: 'Filter by tag', ta: 'குறிச்சொல் மூலம் வடிகட்டவும்', hi: 'टैग से छाँटें' },
  enAll: { en: 'All', ta: 'அனைத்தும்', hi: 'सभी' },
  enRemoved: { en: 'Removed the entry from {label}.', ta: '{label} பதிவு நீக்கப்பட்டது.', hi: '{label} की प्रविष्टि हटा दी गई।' },
  enNoneTag: { en: 'Nothing tagged {tag} yet.', ta: '{tag} எனக் குறிக்கப்பட்டது இன்னும் எதுவும் இல்லை.', hi: '{tag} टैग वाला अभी कुछ नहीं।' },
  enNone: { en: 'Nothing kept yet.', ta: 'இன்னும் எதுவும் சேமிக்கப்படவில்லை.', hi: 'अभी कुछ नहीं सहेजा गया।' },
  enNoneTagBody: { en: 'It will come. Joy rarely arrives on schedule.', ta: 'வரும். மகிழ்ச்சி அரிதாகவே அட்டவணைப்படி வருகிறது.', hi: 'आएगा। ख़ुशी शायद ही कभी तय समय पर आती है।' },
  enNoneBody: { en: 'The next prompt will ask. Or keep a moment now, above.', ta: 'அடுத்த கேள்வி கேட்கும். அல்லது இப்போதே மேலே ஒரு தருணத்தைச் சேமியுங்கள்.', hi: 'अगला सवाल पूछेगा। या अभी ऊपर एक पल सहेज लें।' },
  enPhotoOf: { en: 'Photo: {word}', ta: 'புகைப்படம்: {word}', hi: 'फ़ोटो: {word}' },
  enPhotoOnly: { en: 'Photo · on this phone only', ta: 'புகைப்படம் · இந்த ஃபோனில் மட்டும்', hi: 'फ़ोटो · सिर्फ़ इसी फ़ोन पर' },
  enRemoveAria: { en: 'Remove entry from {t}', ta: '{t} பதிவை நீக்கவும்', hi: '{t} की प्रविष्टि हटाएँ' },
  enRemove: { en: 'Remove', ta: 'நீக்கவும்', hi: 'हटाएँ' },
  pvTitle: { en: 'Private by default', ta: 'இயல்பாகவே தனிப்பட்டது', hi: 'शुरू से ही निजी' },
  pv1: { en: 'Photos stay on this phone. They are excluded from AI, always.', ta: 'புகைப்படங்கள் இந்த ஃபோனிலேயே இருக்கும். அவை எப்போதும் AI-இலிருந்து விலக்கி வைக்கப்படும்.', hi: 'फ़ोटो इसी फ़ोन पर रहती हैं। उन्हें हमेशा AI से दूर रखा जाता है।' },
  pv2: { en: 'Tags are suggested on the device; words leave it only for your weekly story.', ta: 'குறிச்சொற்கள் சாதனத்திலேயே பரிந்துரைக்கப்படும்; உங்கள் வாராந்திரக் கதைக்காக மட்டுமே சொற்கள் அதை விட்டு வெளியே செல்லும்.', hi: 'टैग डिवाइस पर ही सुझाए जाते हैं; शब्द सिर्फ़ आपकी साप्ताहिक कहानी के लिए बाहर जाते हैं।' },
  pv3: { en: 'Priya sees counts per week, never your words. Kavya sees nothing unless you share.', ta: 'Priya வாரத்துக்கான எண்ணிக்கையை மட்டுமே பார்ப்பார், உங்கள் சொற்களை அல்ல. நீங்கள் பகிராவிட்டால் Kavya எதையும் பார்க்க மாட்டார்.', hi: 'Priya सिर्फ़ हफ़्ते की गिनती देखती हैं, आपके शब्द कभी नहीं। जब तक आप साझा न करें, Kavya कुछ नहीं देखतीं।' },
  pv4: { en: 'Remove any entry here with its bin icon. A full export or deletion lives in the Trust centre.', ta: 'எந்தப் பதிவையும் அதன் குப்பைத்தொட்டி ஐகான் மூலம் இங்கே நீக்கலாம். முழு ஏற்றுமதி அல்லது நீக்கம் நம்பிக்கை மையத்தில் உள்ளது.', hi: 'कोई भी प्रविष्टि उसके कूड़ेदान आइकन से यहाँ हटाएँ। पूरा एक्सपोर्ट या डिलीट भरोसा केंद्र में है।' },

  // ─── VIVA ───────────────────────────────────────────────────────────────
  vvHello: { en: 'Hello', ta: 'வணக்கம்', hi: 'नमस्ते' },
  vvMorning: { en: 'Good morning', ta: 'காலை வணக்கம்', hi: 'सुप्रभात' },
  vvAfternoon: { en: 'Good afternoon', ta: 'மதிய வணக்கம்', hi: 'नमस्ते' },
  vvEvening: { en: 'Good evening', ta: 'மாலை வணக்கம்', hi: 'शुभ संध्या' },
  vvGreeting: {
    en: '{greet}, {name}. I can explain your Index, say why today’s action was chosen, or help with the Practice. I draft; a person signs anything clinical.',
    ta: '{greet}, {name}. உங்கள் குறியீட்டை விளக்க, இன்றைய செயல் ஏன் தேர்ந்தெடுக்கப்பட்டது என்று சொல்ல, அல்லது பயிற்சியில் உதவ என்னால் முடியும். நான் வரைவு மட்டுமே எழுதுகிறேன்; மருத்துவம் சார்ந்த எதற்கும் ஒருவர் கையொப்பமிடுவார்.',
    hi: '{greet}, {name}। आप मुझसे अपना इंडेक्स समझ सकते हैं, जान सकते हैं कि आज की गतिविधि क्यों चुनी गई, या अभ्यास में मदद ले सकते हैं। मसौदा मेरा होता है; क्लिनिकल किसी भी चीज़ पर हस्ताक्षर एक व्यक्ति करता है।',
  },
  vvCrisis: {
    en: 'VIVA has stopped. A person is being told now, and Tele-MANAS is free on 14416, any time. Nothing you wrote was sent to a model.',
    ta: 'VIVA நிறுத்தப்பட்டது. இப்போதே ஒருவருக்குத் தெரிவிக்கப்படுகிறது. Tele-MANAS 14416 இல் எந்நேரமும் இலவசமாகக் கிடைக்கும். நீங்கள் எழுதியது எந்த AI மாதிரிக்கும் அனுப்பப்படவில்லை.',
    hi: 'VIVA रुक गया है। अभी एक व्यक्ति को सूचना दी जा रही है, और Tele-MANAS 14416 पर किसी भी समय मुफ़्त है। आपने जो लिखा, वह किसी मॉडल को नहीं भेजा गया।',
  },
  vvRestingRelay: {
    en: 'VIVA is resting right now, so nothing was drafted. Your message is kept here, and you can send it to Priya, your coach.',
    ta: 'VIVA இப்போது ஓய்வில் உள்ளது, எனவே எதுவும் வரையப்படவில்லை. உங்கள் செய்தி இங்கே வைக்கப்பட்டுள்ளது; அதை உங்கள் பயிற்சியாளர் Priya-வுக்கு அனுப்பலாம்.',
    hi: 'VIVA अभी आराम कर रहा है, इसलिए कोई मसौदा नहीं बना। आपका संदेश यहाँ रखा है, और आप इसे अपनी कोच Priya को भेज सकते हैं।',
  },
  vvForgotOne: {
    en: 'One thing forgotten from {space}. Removed from VIVA within 24 hours, and logged in the Trust centre.',
    ta: '{space} இலிருந்து ஒரு விஷயம் மறக்கப்பட்டது. 24 மணி நேரத்துக்குள் VIVA-இலிருந்து நீக்கப்படும், நம்பிக்கை மையத்தில் பதிவு செய்யப்படும்.',
    hi: '{space} से एक बात भुला दी गई। 24 घंटों के भीतर VIVA से हटा दी जाएगी, और भरोसा केंद्र में दर्ज होगी।',
  },
  vvForgotN: {
    en: '{n} things forgotten from {space}. Removed from VIVA within 24 hours, and logged in the Trust centre.',
    ta: '{space} இலிருந்து {n} விஷயங்கள் மறக்கப்பட்டன. 24 மணி நேரத்துக்குள் VIVA-இலிருந்து நீக்கப்படும், நம்பிக்கை மையத்தில் பதிவு செய்யப்படும்.',
    hi: '{space} से {n} बातें भुला दी गईं। 24 घंटों के भीतर VIVA से हटा दी जाएँगी, और भरोसा केंद्र में दर्ज होंगी।',
  },
  vvRestored: { en: 'Restored to {space}. Nothing was removed.', ta: '{space} இல் மீட்டமைக்கப்பட்டது. எதுவும் நீக்கப்படவில்லை.', hi: '{space} में वापस रखा गया। कुछ भी हटाया नहीं गया।' },
  vvEyebrow: { en: 'VIVA companion · AI drafts, a person signs', ta: 'VIVA துணை · AI வரைகிறது, ஒருவர் கையொப்பமிடுகிறார்', hi: 'VIVA साथी · मसौदा AI का, हस्ताक्षर इंसान के' },
  vvTitle: { en: 'Ask about your *Joyspan*.', ta: 'உங்கள் *ஜாய்ஸ்பான்* பற்றிக் கேளுங்கள்.', hi: 'अपने *जॉयस्पैन* के बारे में पूछें।' },
  vvLead: {
    en: 'VIVA explains, narrates and prompts with six typed tools. It never diagnoses, never advises on money, and never writes about a Suffering result.',
    ta: 'VIVA ஆறு வரையறுக்கப்பட்ட கருவிகள் மூலம் விளக்குகிறது, விவரிக்கிறது, கேள்வி கேட்கிறது. அது ஒருபோதும் நோயறிதல் செய்யாது, பணம் குறித்து ஆலோசனை தராது, துன்பம் தொடர்பான முடிவு பற்றி எழுதாது.',
    hi: 'VIVA छह तय टूल से समझाता है, बताता है और सवाल पूछता है। यह कभी बीमारी नहीं बताता, पैसों पर सलाह नहीं देता, और कष्ट वाले परिणाम पर कभी नहीं लिखता।',
  },
  vvPillResting: { en: 'VIVA resting · fallbacks on', ta: 'VIVA ஓய்வில் · மாற்று வழிகள் இயக்கத்தில்', hi: 'VIVA आराम में · वैकल्पिक व्यवस्था चालू' },
  vvPillOn: { en: 'VIVA available · emergency intercept first', ta: 'VIVA கிடைக்கிறது · முதலில் அவசரத் தடுப்பு', hi: 'VIVA उपलब्ध · आपात रोक सबसे पहले' },
  vvToolsAria: { en: 'VIVA tools', ta: 'VIVA கருவிகள்', hi: 'VIVA टूल' },
  vvTyped: { en: 'typed tools · prompt v3', ta: 'வரையறுக்கப்பட்ட கருவிகள் · prompt v3', hi: 'तय टूल · prompt v3' },
  vvSixTools: { en: 'Six tools', ta: 'ஆறு கருவிகள்', hi: 'छह टूल' },
  vvChatAria: { en: 'Conversation with VIVA', ta: 'VIVA உடன் உரையாடல்', hi: 'VIVA से बातचीत' },
  vvRestingBanner: {
    en: 'VIVA is resting right now. Your Index, Today, the Ledger and the Practice all work without it.',
    ta: 'VIVA இப்போது ஓய்வில் உள்ளது. உங்கள் குறியீடு, இன்று, லெட்ஜர், பயிற்சி அனைத்தும் அது இல்லாமலே இயங்கும்.',
    hi: 'VIVA अभी आराम कर रहा है। आपका इंडेक्स, आज, लेजर और अभ्यास, सब इसके बिना चलते हैं।',
  },
  vvExplains: { en: '{link} explains every score in plain words.', ta: '{link} ஒவ்வொரு மதிப்பெண்ணையும் எளிய சொற்களில் விளக்குகிறது.', hi: '{link} हर स्कोर को आसान शब्दों में समझाता है।' },
  vvDraftingAria: { en: 'VIVA is drafting', ta: 'VIVA வரைகிறது', hi: 'VIVA मसौदा लिख रहा है' },
  vvDrafting: { en: 'drafting', ta: 'வரைகிறது', hi: 'लिख रहा है' },
  vvTryAria: { en: 'Try a guardrail', ta: 'ஒரு பாதுகாப்பு வரம்பைச் சோதிக்கவும்', hi: 'एक सुरक्षा-सीमा आज़माएँ' },
  vvTry: { en: 'Try', ta: 'முயலுங்கள்', hi: 'आज़माएँ' },
  vvMessageLabel: { en: 'Message VIVA', ta: 'VIVA-வுக்குச் செய்தி', hi: 'VIVA को संदेश' },
  vvPhResting: { en: 'VIVA is resting', ta: 'VIVA ஓய்வில் உள்ளது', hi: 'VIVA आराम कर रहा है' },
  vvPhAsk: { en: 'Ask VIVA…', ta: 'VIVA-விடம் கேளுங்கள்…', hi: 'VIVA से पूछें…' },
  vvSend: { en: 'Send', ta: 'அனுப்பவும்', hi: 'भेजें' },
  vvFootnote: {
    en: 'Every message passes the emergency intercept before anything else. Replies are drafts; a person signs anything clinical.',
    ta: 'ஒவ்வொரு செய்தியும் முதலில் அவசரத் தடுப்பைக் கடந்தே செல்லும். பதில்கள் வரைவுகள் மட்டுமே; மருத்துவம் சார்ந்த எதற்கும் ஒருவர் கையொப்பமிடுவார்.',
    hi: 'हर संदेश सबसे पहले आपात रोक से गुज़रता है। जवाब सिर्फ़ मसौदे हैं; क्लिनिकल किसी भी चीज़ पर हस्ताक्षर एक व्यक्ति करता है।',
  },
  vvKnows: { en: 'What VIVA knows', ta: 'VIVA-வுக்கு என்ன தெரியும்', hi: 'VIVA क्या जानता है' },
  vvKnowsBody: {
    en: 'Memory you can see, switch off by space, and forget. Nothing here trains any third-party model.',
    ta: 'நீங்கள் பார்க்கக்கூடிய, இடம் வாரியாக அணைக்கக்கூடிய, மறக்கச் செய்யக்கூடிய நினைவகம். இங்குள்ள எதுவும் வெளி நிறுவனங்களின் எந்த AI மாதிரியையும் பயிற்றுவிப்பதில்லை.',
    hi: 'ऐसी याददाश्त जिसे आप देख सकते हैं, स्पेस के हिसाब से बंद कर सकते हैं, और भुलवा सकते हैं। यहाँ की कोई चीज़ किसी बाहरी मॉडल को प्रशिक्षित नहीं करती।',
  },
  vvKeptDevice: {
    en: 'Kept on this device for the specimen; your choices survive a reload.',
    ta: 'இந்த மாதிரிக்காக இந்தச் சாதனத்தில் வைக்கப்படுகிறது; பக்கத்தை மீண்டும் ஏற்றினாலும் உங்கள் தேர்வுகள் நீடிக்கும்.',
    hi: 'नमूने के लिए इसी डिवाइस पर रखा गया; पेज दोबारा खोलने पर भी आपकी पसंद बनी रहती है।',
  },
  vvNoEase: {
    en: 'VIVA keeps no memory from {space}. Journal text is reflected back once, then not stored.',
    ta: '{space} இடத்திலிருந்து VIVA எந்த நினைவையும் வைத்துக்கொள்வதில்லை. நாட்குறிப்பு உரை ஒருமுறை மட்டும் பிரதிபலிக்கப்பட்டு, பிறகு சேமிக்கப்படாது.',
    hi: 'VIVA {space} से कोई याद नहीं रखता। डायरी का लिखा एक बार लौटाया जाता है, फिर सहेजा नहीं जाता।',
  },
  vvAlwaysOff: { en: 'Always off', ta: 'எப்போதும் நிறுத்தத்தில்', hi: 'हमेशा बंद' },
  vvRemembered1: { en: '{n} thing remembered', ta: '{n} விஷயம் நினைவில்', hi: '{n} बात याद है' },
  vvRememberedN: { en: '{n} things remembered', ta: '{n} விஷயங்கள் நினைவில்', hi: '{n} बातें याद हैं' },
  vvMemOff: { en: 'Off · VIVA will not use or add to this', ta: 'நிறுத்தத்தில் · VIVA இதைப் பயன்படுத்தாது, இதில் சேர்க்காது', hi: 'बंद · VIVA इसका इस्तेमाल नहीं करेगा, न इसमें कुछ जोड़ेगा' },
  vvSeeMem: { en: 'See what VIVA remembers', ta: 'VIVA என்ன நினைவில் வைத்துள்ளது என்று பார்க்கவும்', hi: 'देखें VIVA को क्या याद है' },
  vvConfirmAllAria: { en: 'Confirm forgetting everything in {space}', ta: '{space} இல் உள்ள அனைத்தையும் மறப்பதை உறுதிசெய்யவும்', hi: '{space} की सारी बातें भुलाने की पुष्टि करें' },
  vvForgetQ: { en: 'Forget {n} things in {space}?', ta: '{space} இல் உள்ள {n} விஷயங்களை மறக்கவா?', hi: '{space} की {n} बातें भुला दें?' },
  vvYesForget: { en: 'Yes, forget', ta: 'ஆம், மறக்கவும்', hi: 'हाँ, भुला दें' },
  vvForgetAll: { en: 'Forget everything in {space}', ta: '{space} இல் உள்ள அனைத்தையும் மறக்கவும்', hi: '{space} की सारी बातें भुला दें' },
  vvGuardrails: { en: 'Guardrails, in order', ta: 'பாதுகாப்பு வரம்புகள், முன்னுரிமை வரிசையில்', hi: 'सुरक्षा-सीमाएँ, क्रम से' },
  gr1h: { en: 'Emergency intercept first', ta: 'முதலில் அவசரத் தடுப்பு', hi: 'सबसे पहले आपात रोक' },
  gr1: {
    en: 'Self-harm or emergency language goes to a person and Tele-MANAS 14416 before any model runs.',
    ta: 'தன்னைத் தானே காயப்படுத்துதல் அல்லது அவசரம் தொடர்பான சொற்கள், எந்த மாதிரியும் இயங்கும் முன்பே ஒருவரிடமும் Tele-MANAS 14416-க்கும் செல்லும்.',
    hi: 'ख़ुद को नुक़सान या आपात स्थिति वाले शब्द, किसी भी मॉडल के चलने से पहले, एक व्यक्ति और Tele-MANAS 14416 तक पहुँचते हैं।',
  },
  gr2h: { en: 'No AI text on a Suffering result', ta: 'துன்பம் தொடர்பான முடிவில் AI உரை இல்லை', hi: 'कष्ट वाले परिणाम पर AI का लिखा नहीं' },
  gr2: { en: 'PHQ-4, ISI and PSS-4 show pre-approved passages only.', ta: 'PHQ-4, ISI, PSS-4 முன் அங்கீகரிக்கப்பட்ட பகுதிகளை மட்டுமே காட்டும்.', hi: 'PHQ-4, ISI और PSS-4 पर सिर्फ़ पहले से स्वीकृत अंश दिखते हैं।' },
  gr3h: { en: 'No diagnosis, no treatment', ta: 'நோயறிதல் இல்லை, சிகிச்சை இல்லை', hi: 'न बीमारी की पहचान, न इलाज' },
  gr3: { en: 'Routed to your physician through a sign-off gate.', ta: 'கையொப்ப ஒப்புதல் வழியாக உங்கள் மருத்துவருக்கு அனுப்பப்படும்.', hi: 'हस्ताक्षर की जाँच से होकर आपके डॉक्टर के पास भेजा जाता है।' },
  gr4h: { en: 'No financial advice', ta: 'நிதி ஆலோசனை இல்லை', hi: 'कोई वित्तीय सलाह नहीं' },
  gr4: {
    en: '{term} speaks of time and choice; money goes to your own SEBI-registered adviser.',
    ta: '{term} நேரம், தேர்வு பற்றியது; பணம் தொடர்பானவை உங்கள் சொந்த SEBI-பதிவு பெற்ற ஆலோசகரிடம் செல்லும்.',
    hi: '{term} समय और चुनाव की बात करती है; पैसों की बात आपके अपने SEBI-पंजीकृत सलाहकार के पास जाती है।',
  },
  gr5h: { en: 'Claims-gated', ta: 'கூற்றுச் சரிபார்ப்பு', hi: 'दावों की जाँच' },
  gr5: {
    en: 'Every draft is checked against the refused-words list; it fails closed.',
    ta: 'ஒவ்வொரு வரைவும் தடைசெய்யப்பட்ட சொற்கள் பட்டியலுடன் சரிபார்க்கப்படும்; சந்தேகம் என்றால் அது நிறுத்தப்படும்.',
    hi: 'हर मसौदा मना किए गए शब्दों की सूची से जाँचा जाता है; शक होने पर वह रोक दिया जाता है।',
  },
  gr6h: { en: 'Minimum data', ta: 'குறைந்தபட்சத் தரவு', hi: 'कम से कम डेटा' },
  gr6: {
    en: 'No direct identifiers in model calls; only the fields a tool needs.',
    ta: 'மாதிரி அழைப்புகளில் நேரடி அடையாளங்கள் இல்லை; ஒரு கருவிக்குத் தேவையான புலங்கள் மட்டுமே.',
    hi: 'मॉडल को भेजे अनुरोधों में कोई सीधी पहचान नहीं; सिर्फ़ वही जानकारी जो टूल को चाहिए।',
  },
  gr7h: { en: 'Every output attributable', ta: 'ஒவ்வொரு வெளியீட்டுக்கும் மூலம் பதிவாகும்', hi: 'हर नतीजे का स्रोत दर्ज' },
  gr7: {
    en: 'Model, prompt version, tool, inputs and reviewer are stored.',
    ta: 'மாதிரி, prompt பதிப்பு, கருவி, உள்ளீடுகள், மதிப்பாய்வாளர் அனைத்தும் சேமிக்கப்படும்.',
    hi: 'मॉडल, prompt संस्करण, टूल, इनपुट और समीक्षक, सब दर्ज होते हैं।',
  },
  vvService: { en: 'Service state', ta: 'சேவை நிலை', hi: 'सेवा की स्थिति' },
  vvRestingMsg: {
    en: 'VIVA is resting. Pre-written explainers and your people are still here.',
    ta: 'VIVA ஓய்வில் உள்ளது. முன்பே எழுதப்பட்ட விளக்கங்களும் உங்கள் மனிதர்களும் இன்னும் இங்கே இருக்கிறார்கள்.',
    hi: 'VIVA आराम कर रहा है। पहले से लिखी व्याख्याएँ और आपके लोग अब भी यहाँ हैं।',
  },
  vvShowUnavail: { en: 'Show the AI-unavailable state', ta: 'AI கிடைக்காத நிலையைக் காட்டவும்', hi: 'AI उपलब्ध न होने की स्थिति दिखाएँ' },
  vvShowUnavailDesc: {
    en: 'A tool that fails its evaluation is switched off by flag. The app keeps working.',
    ta: 'மதிப்பீட்டில் தோல்வியடையும் கருவி ஒரு கொடி மூலம் நிறுத்தப்படும். ஆப் தொடர்ந்து இயங்கும்.',
    hi: 'जाँच में फ़ेल होने वाला टूल एक फ़्लैग से बंद कर दिया जाता है। ऐप चलता रहता है।',
  },
  vvForgetAria: { en: 'Forget: {text}', ta: 'மறக்கவும்: {text}', hi: 'भुला दें: {text}' },
  vvForget: { en: 'Forget', ta: 'மறக்கவும்', hi: 'भुलाएँ' },
  vvCrisisTag: { en: 'Emergency intercept · P0 · not AI', ta: 'அவசரத் தடுப்பு · P0 · AI அல்ல', hi: 'आपात रोक · P0 · AI नहीं' },
  vvUnavailTag: { en: 'VIVA unavailable', ta: 'VIVA கிடைக்கவில்லை', hi: 'VIVA उपलब्ध नहीं' },
  vvPassage: { en: '{space} · PHQ-4 · pre-approved passage', ta: '{space} · PHQ-4 · முன் அங்கீகரிக்கப்பட்ட பகுதி', hi: '{space} · PHQ-4 · पहले से स्वीकृत अंश' },
  vvOutside: { en: 'Outside what VIVA does', ta: 'VIVA செய்வதற்கு அப்பாற்பட்டது', hi: 'यह VIVA के दायरे से बाहर है' },
  vvSentTo: { en: 'Sent to {name}. She usually replies within a day, in Care.', ta: '{name}-வுக்கு அனுப்பப்பட்டது. அவர் பொதுவாக ஒரு நாளுக்குள் கவனிப்பு பகுதியில் பதிலளிப்பார்.', hi: '{name} को भेजा गया। वे आमतौर पर एक दिन के भीतर ‘देखभाल’ में जवाब देती हैं।' },
  vvOpenCareMsgs: { en: 'Open Care messages', ta: 'கவனிப்புச் செய்திகளைத் திறக்கவும்', hi: '‘देखभाल’ के संदेश खोलें' },
  vvSendPriyaAria: { en: 'Send to Priya: {text}', ta: 'Priya-வுக்கு அனுப்பவும்: {text}', hi: 'Priya को भेजें: {text}' },
  vvSendPriya: { en: 'Send to Priya', ta: 'Priya-வுக்கு அனுப்பவும்', hi: 'Priya को भेजें' },
  vvOpenCare: { en: 'Open Care', ta: 'கவனிப்பைத் திறக்கவும்', hi: '‘देखभाल’ खोलें' },
  vvRoutedTo: { en: 'Routed to {name}', ta: '{name}-க்கு அனுப்பப்பட்டது', hi: '{name} को भेजा गया' },
  vvGate: { en: 'Physician sign-off gate · usually within a day', ta: 'மருத்துவர் ஒப்புதல் · பொதுவாக ஒரு நாளுக்குள்', hi: 'डॉक्टर की मंज़ूरी · आमतौर पर एक दिन में' },
  vvAdviser: { en: 'Take this to your own SEBI-registered adviser. VIVA does not see your accounts.', ta: 'இதை உங்கள் சொந்த SEBI-பதிவு பெற்ற ஆலோசகரிடம் கொண்டு செல்லுங்கள். VIVA உங்கள் கணக்குகளைப் பார்ப்பதில்லை.', hi: 'इसे अपने SEBI-पंजीकृत सलाहकार के पास ले जाएँ। VIVA आपके खाते नहीं देखता।' },
  vvWritten: { en: 'Written down below.', ta: 'கீழே எழுதப்பட்டுள்ளது.', hi: 'नीचे लिख लिया गया।' },
  vvWriteQ: { en: 'Write the question down', ta: 'கேள்வியை எழுதி வைக்கவும்', hi: 'सवाल लिख लें' },
  vvAdviserMsg: {
    en: 'Questions for my adviser · “{q}?” Before the meeting, note what the money is for, when you might need it, and how you would feel if it fell for a year. VIVA has not judged the answer; that is your adviser’s to give.',
    ta: 'என் ஆலோசகருக்கான கேள்விகள் · “{q}?” சந்திப்புக்கு முன், அந்தப் பணம் எதற்காக, எப்போது தேவைப்படலாம், ஒரு வருடம் அது குறைந்தால் நீங்கள் எப்படி உணர்வீர்கள் என்று குறித்துக்கொள்ளுங்கள். VIVA பதிலைத் தீர்மானிக்கவில்லை; அதைச் சொல்ல வேண்டியவர் உங்கள் ஆலோசகர்.',
    hi: 'मेरे सलाहकार के लिए सवाल · “{q}?” मुलाक़ात से पहले लिख लें कि पैसा किसलिए है, कब ज़रूरत पड़ सकती है, और अगर यह एक साल तक घटे तो आपको कैसा लगेगा। VIVA ने जवाब पर कोई राय नहीं दी; वह आपके सलाहकार का काम है।',
  },
  rtSuffering: {
    en: 'Your answers about mood and worry this quarter sit in the range where no follow-up is needed. If that changes, or if things feel heavier than the numbers say, Dr Sanjay Menon is one message away, and Tele-MANAS is free on 14416.',
    ta: 'இந்தக் காலாண்டில் மனநிலை, கவலை பற்றிய உங்கள் பதில்கள், மேற்கொண்டு கவனிப்பு தேவையில்லாத வரம்பில் உள்ளன. அது மாறினால், அல்லது எண்கள் சொல்வதை விட விஷயங்கள் கனமாக உணர்ந்தால், Dr Sanjay Menon ஒரு செய்தி தூரத்தில் இருக்கிறார்; Tele-MANAS 14416 இல் இலவசமாகக் கிடைக்கும்.',
    hi: 'इस तिमाही मनोदशा और चिंता पर आपके जवाब उस दायरे में हैं जहाँ किसी फ़ॉलो-अप की ज़रूरत नहीं। अगर यह बदले, या चीज़ें आँकड़ों से ज़्यादा भारी लगें, तो Dr Sanjay Menon बस एक संदेश की दूरी पर हैं, और Tele-MANAS 14416 पर मुफ़्त है।',
  },
  rtNoDxSleep: {
    en: 'I can’t diagnose, or suggest a medicine or a dose. That needs a physician. I’ve asked Dr Meera to look at your question with your sleep readings; she’ll reply in Care. Meanwhile, the 22:00 wind-down is still yours to keep.',
    ta: 'நோயறிதல் செய்யவோ, மருந்து அல்லது அளவைப் பரிந்துரைக்கவோ என்னால் முடியாது. அதற்கு ஒரு மருத்துவர் தேவை. உங்கள் தூக்க அளவீடுகளுடன் உங்கள் கேள்வியைப் பார்க்கும்படி Dr Meera-விடம் கேட்டுள்ளேன்; அவர் கவனிப்பு பகுதியில் பதிலளிப்பார். அதுவரை, 22:00 ஓய்வுப் பழக்கத்தைத் தொடரலாம்.',
    hi: 'बीमारी बताना, या कोई दवा या खुराक सुझाना, मेरे बस में नहीं। इसके लिए डॉक्टर ज़रूरी हैं। आपका सवाल आपकी नींद की रीडिंग के साथ Dr Meera को भेजा गया है; वे ‘देखभाल’ में जवाब देंगी। तब तक, 22:00 का विंड-डाउन जारी रखें।',
  },
  rtNoDx: {
    en: 'I can’t diagnose, or suggest a medicine or a dose. That needs a physician. I’ve passed your question to Dr Meera; she’ll reply in Care, usually within a day.',
    ta: 'நோயறிதல் செய்யவோ, மருந்து அல்லது அளவைப் பரிந்துரைக்கவோ என்னால் முடியாது. அதற்கு ஒரு மருத்துவர் தேவை. உங்கள் கேள்வியை Dr Meera-விடம் அனுப்பியுள்ளேன்; அவர் பொதுவாக ஒரு நாளுக்குள் கவனிப்பு பகுதியில் பதிலளிப்பார்.',
    hi: 'बीमारी बताना, या कोई दवा या खुराक सुझाना, मेरे बस में नहीं। इसके लिए डॉक्टर ज़रूरी हैं। आपका सवाल Dr Meera को भेज दिया गया है; वे आमतौर पर एक दिन के भीतर ‘देखभाल’ में जवाब देंगी।',
  },
  rtMoney: {
    en: '{term} here is about time and choice, not where money goes. For that decision, please speak with your own SEBI-registered adviser. If it helps, I can help you write the question down to take with you.',
    ta: 'இங்கே {term} என்பது நேரமும் தேர்வும் பற்றியது, பணம் எங்கே செல்கிறது என்பது அல்ல. அந்த முடிவுக்கு, உங்கள் சொந்த SEBI-பதிவு பெற்ற ஆலோசகரிடம் பேசுங்கள். உதவியாக இருந்தால், கொண்டு செல்ல அந்தக் கேள்வியை எழுதி வைக்க உதவுகிறேன்.',
    hi: 'यहाँ {term} का मतलब समय और चुनाव है, यह नहीं कि पैसा कहाँ जाए। उस फ़ैसले के लिए, कृपया अपने SEBI-पंजीकृत सलाहकार से बात करें। चाहें तो सवाल लिखकर साथ ले जाने में मदद मिल सकती है।',
  },
  rtBody: {
    en: 'From your signals this quarter: {moved}. {b}. {h} is {v}, steady. I can describe your readings, never diagnose them; for a sleep concern, Dr Meera is in Care.',
    ta: 'இந்தக் காலாண்டில் உங்கள் சிக்னல்களிலிருந்து: {moved}. {b}. {h} {v}, சீரானது. உங்கள் அளவீடுகளை விவரிக்க முடியும், அவற்றை வைத்து நோயறிதல் செய்ய முடியாது; தூக்கம் பற்றிய கவலைக்கு, Dr Meera கவனிப்பு பகுதியில் இருக்கிறார்.',
    hi: 'इस तिमाही आपके सिग्नल से: {moved}। {b}। {h} {v} है, स्थिर। आपकी रीडिंग समझाई जा सकती है, उनसे बीमारी नहीं बताई जाती; नींद की चिंता के लिए Dr Meera ‘देखभाल’ में हैं।',
  },
  rtJoin: { en: '; ', ta: '; ', hi: '; ' },
  rtIndex: {
    en: 'Your Index is {v}, {band}. It is the geometric mean of your five positive terms, {gm}, minus a quarter of your Burden, {b}. {low}, at {lv}, is the lowest, so it holds the Index back most: ten points there would bring it to about {lifted}.',
    ta: 'உங்கள் குறியீடு {v}, {band}. இது உங்கள் ஐந்து நேர்மறை அம்சங்களின் பெருக்கல் சராசரி {gm}, அதிலிருந்து உங்கள் சுமையின் நான்கில் ஒரு பங்கு {b} கழிக்கப்படுகிறது. {low}, {lv} இல், மிகக் குறைவானது, எனவே அதுவே குறியீட்டை அதிகம் பின்னுக்கு இழுக்கிறது: அங்கே பத்து புள்ளிகள் கூடினால் குறியீடு சுமார் {lifted} ஆகும்.',
    hi: 'आपका इंडेक्स {v} है, {band}। यह आपके पाँच सकारात्मक पहलुओं का ज्यामितीय औसत {gm} है, जिसमें से आपके बोझ का एक-चौथाई, {b}, घटाया गया है। {low}, {lv} पर, सबसे कम है, इसलिए यही इंडेक्स को सबसे ज़्यादा रोकता है: वहाँ दस अंक बढ़ें तो इंडेक्स लगभग {lifted} हो जाएगा।',
  },
  rtAction: {
    en: '{why} So the one action is: {title} {detail} The evidence: {evidence} “Not today” is always allowed.',
    ta: '{why} எனவே இன்றைய ஒரு செயல்: {title} {detail} ஆதாரம்: {evidence} “இன்று வேண்டாம்” என்று எப்போதும் சொல்லலாம்.',
    hi: '{why} इसलिए आज की एक गतिविधि है: {title} {detail} प्रमाण: {evidence} “आज नहीं” कहना हमेशा ठीक है।',
  },
  rtIkigaiMem: {
    en: 'Let’s keep it small. What would make tomorrow worth waking for? You’ve often mentioned teaching, and Saturdays with the two founders you mentor. Is there one ten-minute piece of that you could do tomorrow?',
    ta: 'சிறியதாகவே வைத்துக்கொள்வோம். நாளை எழுந்திருக்கத் தகுந்ததாக எது ஆக்கும்? நீங்கள் அடிக்கடி கற்பித்தலைப் பற்றியும், நீங்கள் வழிகாட்டும் இரண்டு நிறுவனர்களுடனான சனிக்கிழமைகள் பற்றியும் சொல்லியிருக்கிறீர்கள். அதில் பத்து நிமிடத்தில் செய்யக்கூடிய ஒரு சிறு பகுதியை நாளை செய்ய முடியுமா?',
    hi: 'इसे छोटा ही रखते हैं। कल सुबह उठने की वजह क्या बन सकती है? आपने अक्सर पढ़ाने का ज़िक्र किया है, और उन शनिवारों का जब आप दो संस्थापकों को मार्गदर्शन देते हैं। क्या उसमें से दस मिनट का कोई एक हिस्सा आप कल कर सकते हैं?',
  },
  rtIkigai: {
    en: 'Let’s keep it small. What would make tomorrow worth waking for? Name one thing, however modest, that you would be glad to have done by tomorrow evening.',
    ta: 'சிறியதாகவே வைத்துக்கொள்வோம். நாளை எழுந்திருக்கத் தகுந்ததாக எது ஆக்கும்? நாளை மாலைக்குள் செய்து முடித்தால் மகிழ்ச்சி தரும் ஒரு விஷயத்தைச் சொல்லுங்கள், எவ்வளவு சிறியதாக இருந்தாலும் சரி.',
    hi: 'इसे छोटा ही रखते हैं। कल सुबह उठने की वजह क्या बन सकती है? कोई एक काम बताइए, चाहे कितना भी छोटा हो, जिसे कल शाम तक करके आपको अच्छा लगे।',
  },
  rtCouples: {
    en: 'This week’s State of Us: each of you names one moment in the last seven days when you felt on the same side. Share them at Friday dinner, phones in the basket. Kavya’s answers in the Couples Check stay hers; I will never tell you what she said.',
    ta: 'இந்த வாரத்தின் State of Us: கடந்த ஏழு நாட்களில் நீங்கள் இருவரும் ஒரே பக்கம் இருப்பதாக உணர்ந்த ஒரு தருணத்தை ஒவ்வொருவரும் சொல்லுங்கள். வெள்ளிக்கிழமை இரவு உணவின்போது, ஃபோன்களைக் கூடையில் வைத்துவிட்டு, பகிர்ந்துகொள்ளுங்கள். Couples Check இல் Kavya-வின் பதில்கள் அவருடையவை மட்டுமே; அவர் என்ன சொன்னார் என்று நான் உங்களிடம் ஒருபோதும் சொல்ல மாட்டேன்.',
    hi: 'इस हफ़्ते का State of Us: पिछले सात दिनों का एक ऐसा पल आप दोनों बताएँ, जब आपको लगा कि आप एक ही तरफ़ हैं। शुक्रवार के डिनर पर, फ़ोन टोकरी में रखकर, इन्हें साझा करें। Couples Check में Kavya के जवाब सिर्फ़ उनके हैं; उन्होंने क्या कहा, यह आपको कभी नहीं बताया जाएगा।',
  },
  rtCouplesPlain: {
    en: 'This week’s State of Us: each of you names one moment in the last seven days when you felt on the same side. Share them when you next sit down together, without screens. Kavya’s answers in the Couples Check stay hers; I will never tell you what she said.',
    ta: 'இந்த வாரத்தின் State of Us: கடந்த ஏழு நாட்களில் நீங்கள் இருவரும் ஒரே பக்கம் இருப்பதாக உணர்ந்த ஒரு தருணத்தை ஒவ்வொருவரும் சொல்லுங்கள். அடுத்த முறை நீங்கள் இருவரும் சேர்ந்து அமரும்போது, திரைகள் இல்லாமல், பகிர்ந்துகொள்ளுங்கள். Couples Check இல் Kavya-வின் பதில்கள் அவருடையவை மட்டுமே; அவர் என்ன சொன்னார் என்று நான் உங்களிடம் ஒருபோதும் சொல்ல மாட்டேன்.',
    hi: 'इस हफ़्ते का State of Us: पिछले सात दिनों का एक ऐसा पल आप दोनों बताएँ, जब आपको लगा कि आप एक ही तरफ़ हैं। अगली बार जब आप साथ बैठें, बिना स्क्रीन के, तब इन्हें साझा करें। Couples Check में Kavya के जवाब सिर्फ़ उनके हैं; उन्होंने क्या कहा, यह आपको कभी नहीं बताया जाएगा।',
  },
  rtSavour: {
    en: 'When the tea is poured, wait before the first sip. Name three things: one you can see, one you can hear, and one you are glad of right now. Stay ten seconds longer than feels natural, then tell Kavya one of them.',
    ta: 'தேநீர் ஊற்றியதும், முதல் மிடறுக்கு முன் சற்றுக் காத்திருங்கள். மூன்று விஷயங்களைச் சொல்லுங்கள்: நீங்கள் பார்க்கும் ஒன்று, கேட்கும் ஒன்று, இப்போது மகிழ்ச்சி தரும் ஒன்று. இயல்பாகத் தோன்றுவதை விடப் பத்து வினாடிகள் கூடுதலாக அப்படியே இருங்கள், பிறகு அவற்றில் ஒன்றை Kavya-விடம் சொல்லுங்கள்.',
    hi: 'जब चाय डल जाए, तो पहली चुस्की से पहले रुकें। तीन चीज़ें बताएँ: एक जो आप देख सकते हैं, एक जो सुन सकते हैं, और एक जिसके लिए अभी आप शुक्रगुज़ार हैं। जितना स्वाभाविक लगे, उससे दस सेकंड ज़्यादा ठहरें, फिर उनमें से एक बात Kavya को बताएँ।',
  },
  rtPractice: {
    en: 'Week {n} is “{title}”. The idea is simple: the pleasures we postpone for a better time rarely get one. This week’s practice is to schedule one small pleasure each day, like a meeting, and keep it. Your circle talks about it on {when}.',
    ta: 'வாரம் {n}: “{title}”. கருத்து எளிமையானது: நல்ல நேரத்துக்காக நாம் தள்ளிப்போடும் மகிழ்ச்சிகளுக்கு அந்த நேரம் அரிதாகவே வருகிறது. இந்த வாரப் பயிற்சி: ஒவ்வொரு நாளும் ஒரு சிறிய மகிழ்ச்சியை ஒரு கூட்டம் போல அட்டவணையில் வைத்து, அதைக் கடைப்பிடிப்பது. உங்கள் வட்டம் {when} அன்று இதைப் பற்றிப் பேசும்.',
    hi: 'सप्ताह {n} है “{title}”। बात सीधी है: जिन ख़ुशियों को हम किसी बेहतर समय के लिए टालते हैं, उन्हें वह समय शायद ही मिलता है। इस हफ़्ते का अभ्यास है हर दिन एक छोटी ख़ुशी को मीटिंग की तरह तय करना, और निभाना। आपका सर्कल {when} को इस पर बात करेगा।',
  },
  rtRouter: {
    en: 'I can help with your Index, today’s action, the Practice, the Tomorrow Question, a State of Us prompt for you and Kavya, or savouring something small. Which would be useful?',
    ta: 'உங்கள் குறியீடு, இன்றைய செயல், பயிற்சி, “நாளைய கேள்வி”, உங்களுக்கும் Kavya-வுக்கும் ஒரு State of Us கேள்வி, அல்லது ஒரு சிறிய விஷயத்தை ரசிப்பது, இவற்றில் உதவ முடியும். எது உதவியாக இருக்கும்?',
    hi: 'आपके इंडेक्स, आज की गतिविधि, अभ्यास, “कल का सवाल”, आपके और Kavya के लिए एक State of Us सवाल, या किसी छोटी चीज़ का आनंद लेने में मदद हो सकती है। इनमें से क्या काम का होगा?',
  },

  // ─── Day 90 ─────────────────────────────────────────────────────────────
  d9Eyebrow: { en: 'Day 90 · Re-measured · {date}', ta: 'நாள் 90 · மீண்டும் அளவிடப்பட்டது · {date}', hi: 'दिन 90 · दोबारा मापा गया · {date}' },
  d9Title: { en: 'Ninety days, *honestly* measured.', ta: 'தொண்ணூறு நாட்கள், *நேர்மையாக* அளவிடப்பட்டன.', hi: 'नब्बे दिन, *ईमानदारी से* मापे गए।' },
  d9Lead: {
    en: 'Like for like with Day 0: the same instruments, the same method, the same engine.',
    ta: 'நாள் 0 உடன் அப்படியே ஒப்பீடு: அதே கேள்வித்தாள்கள், அதே முறை, அதே இயந்திரம்.',
    hi: 'दिन 0 से हूबहू तुलना: वही प्रश्नावलियाँ, वही पद्धति, वही इंजन।',
  },
  d9HowShown: {
    en: 'How your Day-90 result will be shown. You are on Day {d}; your re-measure opens on Day {n} ({date}), and the figures here are a specimen of a quarter that fell.',
    ta: 'உங்கள் நாள்-90 முடிவு இப்படித்தான் காட்டப்படும். நீங்கள் இப்போது நாள் {d} இல் இருக்கிறீர்கள்; உங்கள் மறு அளவீடு நாள் {n} ({date}) அன்று தொடங்கும். இங்குள்ள எண்கள், சரிவு கண்ட ஒரு காலாண்டின் மாதிரி.',
    hi: 'आपका दिन-90 परिणाम ऐसे दिखाया जाएगा। आप अभी दिन {d} पर हैं; आपका दोबारा माप दिन {n} ({date}) को खुलेगा, और यहाँ के आँकड़े गिरावट वाली एक तिमाही का नमूना हैं।',
  },
  d9ShowAs: { en: 'Show this screen as', ta: 'இந்தத் திரையை இப்படிக் காட்டவும்', hi: 'यह स्क्रीन ऐसे दिखाएँ' },
  d9Awaiting: { en: 'Awaiting sign-off', ta: 'கையொப்பம் நிலுவை', hi: 'हस्ताक्षर बाक़ी' },
  d9Signed: { en: 'Signed', ta: 'கையொப்பமானது', hi: 'हस्ताक्षरित' },
  d9Aria: { en: 'Joyspan Index {a} of 100, down {d} from {b}', ta: 'ஜாய்ஸ்பான் குறியீடு 100 இல் {a}, {b} இலிருந்து {d} குறைவு', hi: 'जॉयस्पैन इंडेक्स 100 में से {a}, {b} से {d} कम' },
  d9Moved: { en: 'What moved', ta: 'என்ன மாறியது', hi: 'क्या बदला' },
  d9MovedCaption: { en: 'Terms that moved between Day 0 and Day 90', ta: 'நாள் 0 முதல் நாள் 90 வரை மாறிய அம்சங்கள்', hi: 'दिन 0 और दिन 90 के बीच बदले पहलू' },
  d9ZeroTo90: { en: 'Day 0 to Day 90', ta: 'நாள் 0 முதல் நாள் 90 வரை', hi: 'दिन 0 से दिन 90' },
  d9Held: { en: '{held} held. Burden {how}, from {a} to {b}.', ta: '{held} ஆகியவை சீராக இருந்தன. சுமை {a} இலிருந்து {b} ஆக {how}.', hi: '{held} स्थिर रहे। बोझ {a} से {b} पर {how}।' },
  d9HeldJoin: { en: ' and ', ta: ', ', hi: ' और ' },
  d9Rose: { en: 'rose a little', ta: 'சற்று உயர்ந்தது', hi: 'थोड़ा बढ़ा' },
  d9Eased: { en: 'eased', ta: 'குறைந்தது', hi: 'घटा' },
  d9HeldW: { en: 'held', ta: 'மாறவில்லை', hi: 'वहीं रहा' },
  d9Physician: { en: 'Your physician · Clinical grade', ta: 'உங்கள் மருத்துவர் · மருத்துவ நிலை', hi: 'आपकी डॉक्टर · क्लिनिकल ग्रेड' },
  d9CallMeta: { en: '· 20 minutes · video or phone', ta: '· 20 நிமிடங்கள் · வீடியோ அல்லது ஃபோன்', hi: '· 20 मिनट · वीडियो या फ़ोन' },
  d9Choose: { en: 'Choose another time', ta: 'வேறு நேரத்தைத் தேர்ந்தெடுக்கவும்', hi: 'कोई और समय चुनें' },
  d9Booked: { en: 'booked', ta: 'பதிவானது', hi: 'बुक है' },
  d9Asked: {
    en: 'Asked to move to {slot}. Dr Meera will confirm in Care; until she does, the call stays on {day}.',
    ta: '{slot} க்கு மாற்றக் கேட்கப்பட்டது. Dr Meera கவனிப்பு பகுதியில் உறுதிசெய்வார்; அதுவரை அழைப்பு {day} அன்றே இருக்கும்.',
    hi: '{slot} पर बदलने का अनुरोध भेजा गया। Dr Meera ‘देखभाल’ में पुष्टि करेंगी; तब तक कॉल {day} को ही रहेगी।',
  },
  d9ChangeReq: { en: 'Change the request', ta: 'கோரிக்கையை மாற்றவும்', hi: 'अनुरोध बदलें' },
  d9ChangeTime: { en: 'Change the time', ta: 'நேரத்தை மாற்றவும்', hi: 'समय बदलें' },
  d9Message: { en: 'Message', ta: 'செய்தி அனுப்பவும்', hi: 'संदेश भेजें' },
  d9SeeChanged: { en: 'See what changed', ta: 'என்ன மாறியது என்று பார்க்கவும்', hi: 'देखें क्या बदला' },
  d9TermByTerm: { en: 'Day 0 and Day 90, term by term, with the {x}.', ta: 'நாள் 0, நாள் 90, அம்சம் வாரியாக, {x} உடன்.', hi: 'दिन 0 और दिन 90, पहलू-दर-पहलू, {x} के साथ।' },
  d9xSigned: { en: 'signed delta', ta: 'கையொப்பமிட்ட மாற்றம்', hi: 'हस्ताक्षरित बदलाव' },
  d9xProv: { en: 'provisional delta', ta: 'தற்காலிக மாற்றம்', hi: 'अस्थायी बदलाव' },
  d9xMethod: { en: 'method', ta: 'முறை', hi: 'पद्धति' },
  d9Next90: { en: 'The next ninety days · draft', ta: 'அடுத்த தொண்ணூறு நாட்கள் · வரைவு', hi: 'अगले नब्बे दिन · मसौदा' },
  d9NewLowest: {
    en: 'Your lowest term is now {term}. A first plan, for you to change on {day}’s call.',
    ta: 'இப்போது உங்கள் மிகக் குறைந்த அம்சம் {term}. ஒரு முதல் திட்டம்; {day} அழைப்பில் நீங்கள் மாற்றலாம்.',
    hi: 'अब आपका सबसे कम पहलू {term} है। एक पहली योजना, जिसे आप {day} की कॉल पर बदल सकते हैं।',
  },
  d9DraftedBy: {
    en: 'Drafted by {name}, your coach · to agree with you on the call',
    ta: 'உங்கள் பயிற்சியாளர் {name} வரைந்தது · அழைப்பில் உங்களுடன் ஒப்புக்கொள்ள',
    hi: 'आपकी कोच {name} का मसौदा · कॉल पर आपके साथ तय करने के लिए',
  },
  d9FallMeans: { en: 'What a fall means', ta: 'சரிவு என்றால் என்ன', hi: 'गिरावट का मतलब' },
  d9FallBody: {
    en: 'A fall is information, not a verdict. Most quarters have a term that slips; knowing which one is how the next ninety days are chosen.',
    ta: 'சரிவு ஒரு தகவல், தீர்ப்பு அல்ல. பெரும்பாலான காலாண்டுகளில் ஏதாவது ஒரு அம்சம் சற்றுக் குறையும்; அது எது என்று தெரிந்துகொள்வதே அடுத்த தொண்ணூறு நாட்களைத் தீர்மானிக்கிறது.',
    hi: 'गिरावट एक जानकारी है, फ़ैसला नहीं। ज़्यादातर तिमाहियों में कोई एक पहलू फिसलता है; कौन-सा, यह जानकर ही अगले नब्बे दिन तय होते हैं।',
  },
  d9FallNote: {
    en: 'No alert was sent. No streak was broken. Your circle sees nothing unless you share it.',
    ta: 'எந்த எச்சரிக்கையும் அனுப்பப்படவில்லை. எந்தத் தொடரும் உடையவில்லை. நீங்கள் பகிராவிட்டால் உங்கள் வட்டம் எதையும் பார்க்காது.',
    hi: 'कोई अलर्ट नहीं भेजा गया। कोई सिलसिला नहीं टूटा। जब तक आप साझा न करें, आपका सर्कल कुछ नहीं देखता।',
  },
  d9WhoSees: { en: 'Who sees this', ta: 'இதை யார் பார்ப்பார்கள்', hi: 'इसे कौन देखता है' },
  d9WhoBody: {
    en: 'You, {meera} and {priya}. Never your employer or insurer; they see aggregates of fifty or more, at most.',
    ta: 'நீங்கள், {meera}, {priya}. உங்கள் முதலாளியோ காப்பீட்டு நிறுவனமோ ஒருபோதும் இல்லை; அதிகபட்சம் ஐம்பது அல்லது அதற்கு மேற்பட்டோரின் மொத்தத் தரவை மட்டுமே அவர்கள் பார்ப்பார்கள்.',
    hi: 'आप, {meera} और {priya}। आपका नियोक्ता या बीमा कंपनी कभी नहीं; वे ज़्यादा से ज़्यादा पचास या उससे अधिक लोगों का कुल आँकड़ा देखते हैं।',
  },
  d9MyIndex: { en: 'My Index and history', ta: 'என் குறியீடும் வரலாறும்', hi: 'मेरा इंडेक्स और इतिहास' },
  d9Sheet: { en: 'What changed · Day 0 → Day 90', ta: 'என்ன மாறியது · நாள் 0 → நாள் 90', hi: 'क्या बदला · दिन 0 → दिन 90' },
  d9GsIndex: { en: 'Index grade · self-assessed with signals · final as shown', ta: 'குறியீட்டு நிலை · சிக்னல்களுடன் சுய மதிப்பீடு · காட்டியபடியே இறுதியானது', hi: 'इंडेक्स ग्रेड · सिग्नल के साथ स्व-मूल्यांकन · जैसा दिखा, वही अंतिम' },
  d9GsAwaiting: {
    en: 'Clinical grade · awaiting physician sign-off · provisional until Dr Meera signs',
    ta: 'மருத்துவ நிலை · மருத்துவர் கையொப்பத்துக்குக் காத்திருக்கிறது · Dr Meera கையொப்பமிடும் வரை தற்காலிகமானது',
    hi: 'क्लिनिकल ग्रेड · डॉक्टर के हस्ताक्षर बाक़ी · Dr Meera के हस्ताक्षर तक अस्थायी',
  },
  d9GsSigned: { en: ' Clinical grade · signed by Dr Meera Iyer · {date}', ta: ' மருத்துவ நிலை · Dr Meera Iyer கையொப்பமிட்டார் · {date}', hi: ' क्लिनिकल ग्रेड · Dr Meera Iyer के हस्ताक्षर · {date}' },
  d9SdIndexB: { en: 'Index grade.', ta: 'குறியீட்டு நிலை.', hi: 'इंडेक्स ग्रेड।' },
  d9SdIndex: {
    en: '{b} Self-assessed with your signals. No signature is needed; the method is pinned.',
    ta: '{b} உங்கள் சிக்னல்களுடன் சுய மதிப்பீடு. கையொப்பம் தேவையில்லை; முறை நிலைநிறுத்தப்பட்டுள்ளது.',
    hi: '{b} आपके सिग्नल के साथ स्व-मूल्यांकन। हस्ताक्षर की ज़रूरत नहीं; पद्धति तय है।',
  },
  d9SdAwaitingH: { en: 'Awaiting physician sign-off', ta: 'மருத்துவர் கையொப்பத்துக்குக் காத்திருக்கிறது', hi: 'डॉक्टर के हस्ताक्षर का इंतज़ार' },
  d9SdAwaiting: {
    en: 'Clinical grade is final only after Dr Meera Iyer signs. Until then these numbers are provisional and may change at sign-off. Expected before {day}’s call.',
    ta: 'Dr Meera Iyer கையொப்பமிட்ட பிறகே மருத்துவ நிலை இறுதியாகும். அதுவரை இந்த எண்கள் தற்காலிகமானவை; கையொப்பத்தின்போது மாறலாம். {day} அழைப்புக்கு முன் எதிர்பார்க்கப்படுகிறது.',
    hi: 'क्लिनिकल ग्रेड Dr Meera Iyer के हस्ताक्षर के बाद ही अंतिम होता है। तब तक ये संख्याएँ अस्थायी हैं और हस्ताक्षर के समय बदल सकती हैं। {day} की कॉल से पहले अपेक्षित।',
  },
  d9SdSignedH: { en: 'Signed delta', ta: 'கையொப்பமிட்ட மாற்றம்', hi: 'हस्ताक्षरित बदलाव' },
  d9SdSigned: {
    en: 'Reviewed and signed by Dr Meera Iyer on {date}. Panels and capacity battery like for like.',
    ta: '{date} அன்று Dr Meera Iyer மதிப்பாய்வு செய்து கையொப்பமிட்டார். பரிசோதனைகளும் திறன் சோதனைகளும் அப்படியே ஒப்பிடப்பட்டன.',
    hi: '{date} को Dr Meera Iyer ने समीक्षा करके हस्ताक्षर किए। जाँचें और क्षमता परीक्षण हूबहू तुलना में।',
  },
  d9TableCaption: { en: 'Day 0 and Day 90 term scores', ta: 'நாள் 0, நாள் 90 அம்ச மதிப்பெண்கள்', hi: 'दिन 0 और दिन 90 के पहलू स्कोर' },
  d9GmFell: {
    en: 'The geometric mean fell from {a} to {b}, mostly through {term}; Burden added {c}.',
    ta: 'பெருக்கல் சராசரி {a} இலிருந்து {b} ஆகக் குறைந்தது, பெரும்பாலும் {term} காரணமாக; சுமை {c} சேர்த்தது.',
    hi: 'ज्यामितीय औसत {a} से घटकर {b} हुआ, ज़्यादातर {term} की वजह से; बोझ ने {c} जोड़ा।',
  },
  d9NoRecompute: { en: '{method} · λ {l} · no recomputation across methods', ta: '{method} · λ {l} · முறைகளுக்கு இடையே மறுகணக்கீடு இல்லை', hi: '{method} · λ {l} · पद्धतियों के बीच दोबारा गणना नहीं' },
} satisfies Dict

// ─── Specimen data in three languages (English stays the data's own copy) ───

/** Today's action and the action library (data/member is outside this lane). */
export const ACTION_TEXT: Record<string, { title: L; detail: L; why: L; evidence: L }> = {
  a_d_014: {
    title: { en: 'Ten minutes on the verandah with tea.', ta: 'தேநீருடன் வராந்தாவில் பத்து நிமிடங்கள்.', hi: 'चाय के साथ बरामदे में दस मिनट।' },
    detail: { en: 'Notice three things.', ta: 'மூன்று விஷயங்களைக் கவனியுங்கள்.', hi: 'तीन चीज़ों पर ध्यान दें।' },
    why: {
      en: 'Daily Pleasure is your lowest term. Your calendar is clear after 7 pm and Kavya is home.',
      ta: 'தினசரி மகிழ்ச்சி உங்கள் மிகக் குறைந்த அம்சம். இரவு 7 மணிக்குப் பிறகு உங்கள் நாட்காட்டி காலியாக உள்ளது, Kavya-வும் வீட்டில் இருக்கிறார்.',
      hi: 'रोज़ का आनंद आपका सबसे कम पहलू है। शाम 7 बजे के बाद आपका कैलेंडर खाली है और Kavya घर पर हैं।',
    },
    evidence: {
      en: 'Savouring interventions raise positive affect (Bryant & Veroff, 2007).',
      ta: 'ரசித்து அனுபவிக்கும் பயிற்சிகள் நேர்மறை உணர்வுகளை உயர்த்துகின்றன (Bryant & Veroff, 2007).',
      hi: 'आनंद को ठहरकर महसूस करने के अभ्यास सकारात्मक भावनाएँ बढ़ाते हैं (Bryant & Veroff, 2007)।',
    },
  },
}

export const TAG_TEXT: Record<string, L> = {
  People: { en: 'People', ta: 'மனிதர்கள்', hi: 'लोग' },
  Food: { en: 'Food', ta: 'உணவு', hi: 'खाना' },
  Movement: { en: 'Movement', ta: 'உடல் இயக்கம்', hi: 'चलना-फिरना' },
  Beauty: { en: 'Beauty', ta: 'அழகு', hi: 'सुंदरता' },
  Learning: { en: 'Learning', ta: 'கற்றல்', hi: 'सीखना' },
  Rest: { en: 'Rest', ta: 'ஓய்வு', hi: 'आराम' },
  Nature: { en: 'Nature', ta: 'இயற்கை', hi: 'प्रकृति' },
  Music: { en: 'Music', ta: 'இசை', hi: 'संगीत' },
  Work: { en: 'Work', ta: 'வேலை', hi: 'काम' },
  Faith: { en: 'Faith', ta: 'ஆன்மிகம்', hi: 'आस्था' },
}

export const CONFIDENCE_KEY = { High: 'confHigh', Moderate: 'confModerate', 'Survey only': 'confSurvey' } as const

/** Signal sources (keyed by the English source, which is also the scoring key). */
export const SIGNAL_SOURCE_TEXT: Record<string, L> = {
  'Oura · resting HR trend': { en: 'Oura · resting HR trend', ta: 'Oura · ஓய்வு நிலை இதயத் துடிப்புப் போக்கு', hi: 'Oura · आराम के समय हृदय गति का रुझान' },
  'Apple Health · VO₂max estimate': { en: 'Apple Health · VO₂max estimate', ta: 'Apple Health · VO₂max மதிப்பீடு', hi: 'Apple Health · VO₂max अनुमान' },
  'Capacity battery · sit-to-stand': { en: 'Capacity battery · sit-to-stand', ta: 'திறன் சோதனைகள் · உட்கார்ந்து எழுதல்', hi: 'क्षमता परीक्षण · बैठकर उठना' },
  'Ledger · moments tagged People': { en: 'Ledger · moments tagged People', ta: 'லெட்ஜர் · மனிதர்கள் எனக் குறித்த தருணங்கள்', hi: 'लेजर · लोग टैग वाले पल' },
  'Google Calendar · time audit, summarised then discarded': {
    en: 'Google Calendar · time audit, summarised then discarded',
    ta: 'Google Calendar · நேரத் தணிக்கை, சுருக்கிய பின் நீக்கப்படும்',
    hi: 'Google Calendar · समय का हिसाब, सारांश के बाद हटा दिया जाता है',
  },
  'Joy Ledger · 2.6 moments a day': { en: 'Joy Ledger · 2.6 moments a day', ta: 'ஜாய் லெட்ஜர் · நாளுக்கு 2.6 தருணங்கள்', hi: 'जॉय लेजर · रोज़ 2.6 पल' },
  'Savouring prompts answered': { en: 'Savouring prompts answered', ta: 'பதிலளித்த ரசிப்புக் கேள்விகள்', hi: 'जवाब दिए गए आनंद के सवाल' },
  'Oura · sleep regularity': { en: 'Oura · sleep regularity', ta: 'Oura · தூக்க ஒழுங்கு', hi: 'Oura · नींद की नियमितता' },
  'PHQ-4 and PSS-4 (pre-approved copy only)': { en: 'PHQ-4 and PSS-4 (pre-approved copy only)', ta: 'PHQ-4, PSS-4 (முன் அங்கீகரிக்கப்பட்ட உரை மட்டும்)', hi: 'PHQ-4 और PSS-4 (सिर्फ़ पहले से स्वीकृत पाठ)' },
}

export const SIGNAL_READING_TEXT: Record<string, L> = {
  'Oura · resting HR trend': { en: 'Resting heart rate 58 bpm · down 2 over 90 days', ta: 'ஓய்வு நிலை இதயத் துடிப்பு 58 bpm · 90 நாட்களில் 2 குறைவு', hi: 'आराम के समय हृदय गति 58 bpm · 90 दिनों में 2 कम' },
  'Apple Health · VO₂max estimate': { en: 'VO₂max estimate 36 · steady', ta: 'VO₂max மதிப்பீடு 36 · சீரானது', hi: 'VO₂max अनुमान 36 · स्थिर' },
  'Capacity battery · sit-to-stand': { en: 'Five sit-to-stands in 9.8 s · 12 Jan', ta: '9.8 வினாடிகளில் ஐந்து முறை உட்கார்ந்து எழுதல் · 12 ஜன.', hi: '9.8 सेकंड में पाँच बार बैठकर उठना · 12 जन॰' },
  'Ledger · moments tagged People': { en: '41 moments tagged People in 90 days', ta: '90 நாட்களில் மனிதர்கள் எனக் குறித்த 41 தருணங்கள்', hi: '90 दिनों में लोग टैग वाले 41 पल' },
  'Google Calendar · time audit, summarised then discarded': { en: 'Evenings booked 5 nights in 7 · summary only', ta: '7 இல் 5 மாலைகள் நிரம்பியிருந்தன · சுருக்கம் மட்டும்', hi: '7 में से 5 शामें व्यस्त · सिर्फ़ सारांश' },
  'Joy Ledger · 2.6 moments a day': { en: '2.6 moments a day over 30 days', ta: '30 நாட்களில் நாளுக்கு 2.6 தருணங்கள்', hi: '30 दिनों में रोज़ 2.6 पल' },
  'Savouring prompts answered': { en: '18 savouring prompts answered', ta: '18 ரசிப்புக் கேள்விகளுக்குப் பதில்', hi: '18 आनंद के सवालों के जवाब दिए' },
  'Oura · sleep regularity': { en: 'Sleep regularity 74 · bedtime within 40 min', ta: 'தூக்க ஒழுங்கு 74 · படுக்கை நேரம் 40 நிமிடத்துக்குள்', hi: 'नींद की नियमितता 74 · सोने का समय 40 मिनट के भीतर' },
  'PHQ-4 and PSS-4 (pre-approved copy only)': { en: 'Read from your answers in this sitting', ta: 'இந்த அமர்வில் உங்கள் பதில்களிலிருந்து', hi: 'इस सत्र में आपके जवाबों से' },
}

/** TERM_DETAIL sentence and "what moved", in the order of _data.ts. */
export const TERM_DETAIL_TEXT: Record<string, { sentence: L; moved: L[] }> = {
  H: {
    sentence: { en: 'Your body is steady. Sleep and capacity both edged up this quarter.', ta: 'உங்கள் உடல் சீராக உள்ளது. இந்தக் காலாண்டில் தூக்கமும் உடல் திறனும் சற்று உயர்ந்தன.', hi: 'आपका शरीर स्थिर है। इस तिमाही नींद और क्षमता दोनों थोड़ी बढ़ीं।' },
    moved: [
      { en: 'Sleep efficiency up 4 points over the quarter', ta: 'காலாண்டில் தூக்கத் திறன் 4 புள்ளிகள் உயர்வு', hi: 'तिमाही में नींद की दक्षता 4 अंक बढ़ी' },
      { en: 'Five sit-to-stands 1.2 s quicker', ta: 'ஐந்து முறை உட்கார்ந்து எழுதல் 1.2 வினாடி வேகமாக', hi: 'पाँच बार बैठकर उठना 1.2 सेकंड तेज़' },
      { en: 'LE8 diet score unchanged', ta: 'LE8 உணவு மதிப்பெண் மாறவில்லை', hi: 'LE8 आहार स्कोर में बदलाव नहीं' },
    ],
  },
  P: {
    sentence: { en: 'Purpose is your strongest term. The Tomorrow Question has a weekly answer.', ta: 'நோக்கம் உங்கள் வலுவான அம்சம். “நாளைய கேள்வி”க்கு வாரந்தோறும் பதில் இருக்கிறது.', hi: 'उद्देश्य आपका सबसे मज़बूत पहलू है। “कल का सवाल” का हर हफ़्ते जवाब मिलता है।' },
    moved: [
      { en: 'Ikigai-9 up 2 · “I feel my life is useful to others”', ta: 'Ikigai-9 இல் 2 உயர்வு · “I feel my life is useful to others”', hi: 'Ikigai-9 में 2 की बढ़त · “I feel my life is useful to others”' },
      { en: 'MLQ-Presence unchanged', ta: 'MLQ-Presence மாறவில்லை', hi: 'MLQ-Presence में बदलाव नहीं' },
    ],
  },
  R: {
    sentence: { en: 'People hold steady. The circle of eight met four Mondays out of four.', ta: 'மனிதர்கள் அம்சம் சீராக உள்ளது. எட்டுப் பேர் வட்டம் நான்கு திங்கள்களிலும் சந்தித்தது.', hi: 'लोग स्थिर हैं। आठ लोगों का सर्कल चारों सोमवार मिला।' },
    moved: [
      { en: 'UCLA-3 loneliness down 1', ta: 'UCLA-3 தனிமை 1 குறைவு', hi: 'UCLA-3 अकेलापन 1 कम' },
      { en: 'Three of your 15 not seen this month', ta: 'உங்கள் 15 பேரில் மூவரை இந்த மாதம் சந்திக்கவில்லை', hi: 'आपके 15 में से तीन से इस महीने मुलाक़ात नहीं हुई' },
    ],
  },
  F: {
    sentence: { en: 'Freedom slipped. A heavy quarter at work took the evenings.', ta: 'சுதந்திரம் சற்றுக் குறைந்தது. வேலையில் கனமான காலாண்டு மாலை நேரங்களை எடுத்துக்கொண்டது.', hi: 'स्वतंत्रता थोड़ी घटी। काम की भारी तिमाही ने शामें ले लीं।' },
    moved: [
      { en: 'Time affluence down: evenings booked 5 nights in 7', ta: 'நேர வசதி குறைவு: 7 இல் 5 மாலைகள் நிரம்பியிருந்தன', hi: 'समय की गुंजाइश घटी: 7 में से 5 शामें व्यस्त' },
      { en: 'Autonomy unchanged', ta: 'சுய முடிவு மாறவில்லை', hi: 'अपने फ़ैसलों की आज़ादी में बदलाव नहीं' },
      { en: 'Financial wellbeing unchanged', ta: 'நிதி நலம் மாறவில்லை', hi: 'आर्थिक सुकून में बदलाव नहीं' },
    ],
  },
  D: {
    sentence: { en: 'Daily Pleasure is your lowest term, and it rose the most.', ta: 'தினசரி மகிழ்ச்சி உங்கள் மிகக் குறைந்த அம்சம், ஆனால் அதுவே அதிகம் உயர்ந்தது.', hi: 'रोज़ का आनंद आपका सबसे कम पहलू है, और यही सबसे ज़्यादा बढ़ा।' },
    moved: [
      { en: 'SPANE balance up 3', ta: 'SPANE சமநிலை 3 உயர்வு', hi: 'SPANE संतुलन 3 बढ़ा' },
      { en: 'Joy moments up from 1.9 to 2.6 a day', ta: 'மகிழ்ச்சித் தருணங்கள் நாளுக்கு 1.9 இலிருந்து 2.6 ஆக உயர்வு', hi: 'ख़ुशी के पल रोज़ 1.9 से बढ़कर 2.6' },
      { en: 'Savouring unchanged', ta: 'ரசித்தல் மாறவில்லை', hi: 'आनंद लेने की आदत में बदलाव नहीं' },
    ],
  },
  B: {
    sentence: { en: 'Burden eased by 3. Less weight is better here.', ta: 'சுமை 3 குறைந்தது. இங்கே குறைந்த கனமே நல்லது.', hi: 'बोझ 3 कम हुआ। यहाँ कम भार ही बेहतर है।' },
    moved: [
      { en: 'Sleep regularity improved after the 22:00 wind-down', ta: '22:00 ஓய்வுப் பழக்கத்துக்குப் பிறகு தூக்க ஒழுங்கு மேம்பட்டது', hi: '22:00 के विंड-डाउन के बाद नींद की नियमितता सुधरी' },
      { en: 'PSS-4 stress eased by 1', ta: 'PSS-4 மன அழுத்தம் 1 குறைந்தது', hi: 'PSS-4 तनाव 1 कम हुआ' },
    ],
  },
}

/** Instrument intros (our copy, not the instrument's): keyed by block code. */
export const BLOCK_TEXT: Record<string, { about: L; careNote?: L }> = {
  'LE8 self-report': {
    about: {
      en: 'Eight everyday habits and readings the heart cares about. Your Oura and Apple Health data sit beside these answers.',
      ta: 'இதயத்துக்கு முக்கியமான எட்டு அன்றாடப் பழக்கங்களும் அளவீடுகளும். உங்கள் Oura, Apple Health தரவு இந்தப் பதில்களுடன் சேர்ந்து இருக்கும்.',
      hi: 'दिल के लिए ज़रूरी आठ रोज़मर्रा की आदतें और रीडिंग। आपका Oura और Apple Health डेटा इन जवाबों के साथ रहता है।',
    },
  },
  'Ikigai-9': {
    about: {
      en: 'Nine statements on whether your life feels worth living, in the original sense of ikigai.',
      ta: 'இகிகாய் என்பதன் அசல் பொருளில், உங்கள் வாழ்க்கை வாழத் தகுந்ததாக உணர்கிறதா என்பது பற்றிய ஒன்பது கூற்றுகள்.',
      hi: 'इकिगाई के मूल अर्थ में, क्या आपका जीवन जीने लायक़ लगता है, इस पर नौ कथन।',
    },
  },
  'MLQ-P': {
    about: {
      en: 'Five statements on how present meaning feels in your life right now.',
      ta: 'இப்போது உங்கள் வாழ்க்கையில் அர்த்தம் எவ்வளவு உணரப்படுகிறது என்பது பற்றிய ஐந்து கூற்றுகள்.',
      hi: 'अभी आपके जीवन में अर्थ कितना महसूस होता है, इस पर पाँच कथन।',
    },
  },
  'UCLA-3': {
    about: {
      en: 'Three short questions on feeling apart from others. There are no right answers.',
      ta: 'மற்றவர்களிடமிருந்து விலகியிருப்பதாக உணர்வது பற்றிய மூன்று சிறிய கேள்விகள். சரியான பதில் என்று எதுவும் இல்லை.',
      hi: 'दूसरों से अलग महसूस करने पर तीन छोटे प्रश्न। कोई जवाब सही या ग़लत नहीं है।',
    },
  },
  'LSNS-6': {
    about: {
      en: 'Six questions on the size of your circle: family, then friends.',
      ta: 'உங்கள் உறவு வட்டத்தின் அளவு பற்றிய ஆறு கேள்விகள்: முதலில் குடும்பம், பிறகு நண்பர்கள்.',
      hi: 'आपके दायरे के आकार पर छह प्रश्न: पहले परिवार, फिर दोस्त।',
    },
  },
  BPNSFS: {
    about: {
      en: 'Four statements on how much your days feel chosen rather than imposed.',
      ta: 'உங்கள் நாட்கள் திணிக்கப்பட்டவையாக இல்லாமல், நீங்களே தேர்ந்தெடுத்தவையாக எவ்வளவு உணர்கின்றன என்பது பற்றிய நான்கு கூற்றுகள்.',
      hi: 'आपके दिन थोपे हुए नहीं, बल्कि कितने अपनी पसंद के लगते हैं, इस पर चार कथन।',
    },
  },
  'Time affluence': {
    about: {
      en: 'Two statements on whether you have time for what matters.',
      ta: 'முக்கியமானவற்றுக்கு உங்களுக்கு நேரம் இருக்கிறதா என்பது பற்றிய இரண்டு கூற்றுகள்.',
      hi: 'जो ज़रूरी है उसके लिए आपके पास समय है या नहीं, इस पर दो कथन।',
    },
  },
  'CFPB FWB': {
    about: {
      en: 'Five statements on peace of mind about money. This is never used for advice, and never shown to an employer or insurer.',
      ta: 'பணம் பற்றிய மன நிம்மதி குறித்த ஐந்து கூற்றுகள். இது ஆலோசனைக்காக ஒருபோதும் பயன்படுத்தப்படாது; முதலாளிக்கோ காப்பீட்டு நிறுவனத்துக்கோ ஒருபோதும் காட்டப்படாது.',
      hi: 'पैसों को लेकर मन की शांति पर पाँच कथन। इसे कभी सलाह के लिए इस्तेमाल नहीं किया जाता, और कभी किसी नियोक्ता या बीमा कंपनी को नहीं दिखाया जाता।',
    },
  },
  SPANE: {
    about: {
      en: 'Twelve feelings. Think back over the past four weeks.',
      ta: 'பன்னிரண்டு உணர்வுகள். கடந்த நான்கு வாரங்களை நினைத்துப் பாருங்கள்.',
      hi: 'बारह भावनाएँ। पिछले चार हफ़्तों को याद करें।',
    },
  },
  'PHQ-4': {
    about: {
      en: 'Four questions on low mood and worry over the last two weeks.',
      ta: 'கடந்த இரண்டு வாரங்களில் மனச்சோர்வு, கவலை பற்றிய நான்கு கேள்விகள்.',
      hi: 'पिछले दो हफ़्तों में उदासी और चिंता पर चार प्रश्न।',
    },
    careNote: {
      en: 'If your answers cross a threshold, a clinician reads them within 48 hours. No AI writes about these results, ever.',
      ta: 'உங்கள் பதில்கள் ஒரு வரம்பைத் தாண்டினால், 48 மணி நேரத்துக்குள் ஒரு மருத்துவர் அவற்றைப் படிப்பார். இந்த முடிவுகள் பற்றி AI ஒருபோதும் எதுவும் எழுதாது.',
      hi: 'अगर आपके जवाब एक तय सीमा पार करते हैं, तो 48 घंटों के भीतर एक क्लिनिशियन उन्हें पढ़ते हैं। इन नतीजों के बारे में AI कभी कुछ नहीं लिखता।',
    },
  },
  'PSS-4': {
    about: {
      en: 'Four questions on how stretched the last month has felt.',
      ta: 'கடந்த மாதம் எவ்வளவு நெருக்கடியாக உணர்ந்தீர்கள் என்பது பற்றிய நான்கு கேள்விகள்.',
      hi: 'पिछला महीना कितना तनाव भरा लगा, इस पर चार प्रश्न।',
    },
  },
}

export const SITTING_TITLE: Record<number, L> = {
  1: { en: 'Body, Purpose and People', ta: 'உடல், நோக்கம், மனிதர்கள்', hi: 'शरीर, उद्देश्य और लोग' },
  2: { en: 'Freedom, Pleasure and Ease', ta: 'சுதந்திரம், மகிழ்ச்சி, நிம்மதி', hi: 'स्वतंत्रता, आनंद और सहजता' },
}

export const DAY90_WHY_TEXT: Record<string, L> = {
  H: { en: 'Capacity battery and sleep efficiency both a touch better.', ta: 'திறன் சோதனைகளும் தூக்கத் திறனும் சற்று மேம்பட்டன.', hi: 'क्षमता परीक्षण और नींद की दक्षता, दोनों थोड़ी बेहतर।' },
  P: { en: 'Ikigai-9 and MLQ-Presence held.', ta: 'Ikigai-9, MLQ-Presence சீராக இருந்தன.', hi: 'Ikigai-9 और MLQ-Presence स्थिर रहे।' },
  R: { en: 'Loneliness and network size held; the circle met every week.', ta: 'தனிமையும் உறவு வட்டத்தின் அளவும் சீராக இருந்தன; வட்டம் ஒவ்வொரு வாரமும் சந்தித்தது.', hi: 'अकेलापन और दायरे का आकार स्थिर रहे; सर्कल हर हफ़्ते मिला।' },
  F: { en: 'Time affluence fell: evenings booked five nights in seven through March.', ta: 'நேர வசதி குறைந்தது: மார்ச் முழுவதும் ஏழில் ஐந்து மாலைகள் நிரம்பியிருந்தன.', hi: 'समय की गुंजाइश घटी: पूरे मार्च, सात में से पाँच शामें व्यस्त रहीं।' },
  D: { en: 'More joy moments logged; SPANE balance rose.', ta: 'அதிக மகிழ்ச்சித் தருணங்கள் பதிவாகின; SPANE சமநிலை உயர்ந்தது.', hi: 'ख़ुशी के ज़्यादा पल दर्ज हुए; SPANE संतुलन बढ़ा।' },
  B: { en: 'Stress and sleep regularity heavier in the last month.', ta: 'கடந்த மாதம் மன அழுத்தமும் தூக்க ஒழுங்கின்மையும் அதிகம்.', hi: 'पिछले महीने तनाव और नींद की अनियमितता ज़्यादा भारी रहे।' },
}

/** NEXT_90, keyed by its English title. */
export const NEXT90_TEXT: Record<string, { day: L; title: L; detail: L }> = {
  'Write the No list': {
    day: { en: 'Day 1', ta: 'நாள் 1', hi: 'दिन 1' },
    title: { en: 'Write the No list', ta: '“வேண்டாம்” பட்டியலை எழுதுங்கள்', hi: '“ना” की सूची लिखें' },
    detail: { en: 'Three things to stop this quarter. Ten minutes, with Priya on the call.', ta: 'இந்தக் காலாண்டில் நிறுத்த வேண்டிய மூன்று விஷயங்கள். பத்து நிமிடங்கள், Priya அழைப்பில் உடன் இருப்பார்.', hi: 'इस तिमाही में बंद करने वाली तीन चीज़ें। दस मिनट, Priya कॉल पर साथ होंगी।' },
  },
  'Two evenings protected': {
    day: { en: 'Weekly', ta: 'வாரந்தோறும்', hi: 'हर हफ़्ते' },
    title: { en: 'Two evenings protected', ta: 'இரண்டு மாலைகள் உங்களுக்காக', hi: 'दो शामें सुरक्षित' },
    detail: { en: 'Tuesday and Friday after 7 pm, in the calendar like a meeting.', ta: 'செவ்வாய், வெள்ளி இரவு 7 மணிக்குப் பிறகு, ஒரு கூட்டம் போல நாட்காட்டியில்.', hi: 'मंगलवार और शुक्रवार शाम 7 बजे के बाद, कैलेंडर में एक मीटिंग की तरह।' },
  },
  'Time audit review': {
    day: { en: 'Day 15', ta: 'நாள் 15', hi: 'दिन 15' },
    title: { en: 'Time audit review', ta: 'நேரத் தணிக்கை மதிப்பாய்வு', hi: 'समय के हिसाब की समीक्षा' },
    detail: { en: 'Calendar summarised, then discarded. Priya reads the summary, not the calendar.', ta: 'நாட்காட்டி சுருக்கப்பட்டு, பிறகு நீக்கப்படும். Priya சுருக்கத்தை மட்டுமே படிப்பார், நாட்காட்டியை அல்ல.', hi: 'कैलेंडर का सारांश बनता है, फिर उसे हटा दिया जाता है। Priya सारांश पढ़ती हैं, कैलेंडर नहीं।' },
  },
  'Review with Priya': {
    day: { en: 'Day 45', ta: 'நாள் 45', hi: 'दिन 45' },
    title: { en: 'Review with Priya', ta: 'Priya உடன் மதிப்பாய்வு', hi: 'Priya के साथ समीक्षा' },
    detail: { en: 'Drift, if any, becomes a call. Keep the verandah tea going.', ta: 'ஏதாவது தடம் மாறினால், அது ஒரு அழைப்பாகும். வராந்தா தேநீரைத் தொடருங்கள்.', hi: 'अगर कुछ भटका, तो एक कॉल होगी। बरामदे वाली चाय जारी रखें।' },
  },
  'The next step': {
    day: { en: 'Day 60', ta: 'நாள் 60', hi: 'दिन 60' },
    title: { en: 'The next step', ta: 'அடுத்த படி', hi: 'अगला कदम' },
    detail: { en: 'A Wealthcation is one option. So is simply continuing.', ta: 'Wealthcation ஒரு வழி. அப்படியே தொடர்வதும் ஒரு வழிதான்.', hi: 'Wealthcation एक विकल्प है। बस जारी रखना भी।' },
  },
  'Re-measure opens': {
    day: { en: 'Day 76', ta: 'நாள் 76', hi: 'दिन 76' },
    title: { en: 'Re-measure opens', ta: 'மறு அளவீடு தொடங்குகிறது', hi: 'दोबारा माप खुलता है' },
    detail: { en: 'Two sittings, about twenty minutes, like for like.', ta: 'இரண்டு அமர்வுகள், சுமார் இருபது நிமிடங்கள், அப்படியே ஒப்பீடு.', hi: 'दो सत्र, लगभग बीस मिनट, हूबहू तुलना।' },
  },
}

export const SCHEDULE_LABEL: Record<number, L> = {
  1: { en: 'After lunch', ta: 'மதிய உணவுக்குப் பின்', hi: 'दोपहर के खाने के बाद' },
  2: { en: 'Late afternoon', ta: 'பிற்பகல்', hi: 'देर दोपहर' },
  3: { en: 'Before the wind-down', ta: 'ஓய்வெடுக்கும் முன்', hi: 'सोने की तैयारी से पहले' },
}

export const STORY_TEXT: L = {
  en: 'This week, joy came most often from people, and usually around food: lunch with Kavya twice, and dinner with the family on Sunday. The quiet ones counted too: a beach walk, and MS Subbulakshmi before bed.',
  ta: 'இந்த வாரம், மகிழ்ச்சி பெரும்பாலும் மனிதர்களிடமிருந்து வந்தது, அதுவும் பெரும்பாலும் உணவைச் சுற்றி: Kavya உடன் இரண்டு முறை மதிய உணவு, ஞாயிறன்று குடும்பத்துடன் இரவு உணவு. அமைதியான தருணங்களும் கணக்கில் சேர்ந்தன: ஒரு கடற்கரை நடை, தூங்கும் முன் MS Subbulakshmi.',
  hi: 'इस हफ़्ते ख़ुशी ज़्यादातर लोगों से आई, और अक्सर खाने के इर्द-गिर्द: Kavya के साथ दो बार लंच, और रविवार को परिवार के साथ डिनर। शांत पल भी गिने गए: समुद्र किनारे की सैर, और सोने से पहले MS Subbulakshmi।',
}

/** VIVA memory, keyed by item id (the stored copy keeps the English). */
export const MEMORY_TEXT: Record<string, { text: L; source: L }> = {
  mh1: {
    text: { en: 'You prefer morning walks before 7 am, when it is cooler.', ta: 'காலை 7 மணிக்கு முன், குளிர்ச்சியாக இருக்கும்போது நடப்பதை நீங்கள் விரும்புகிறீர்கள்.', hi: 'आपको सुबह 7 बजे से पहले, ठंडक में टहलना पसंद है।' },
    source: { en: 'Told VIVA · 14 Jan', ta: 'VIVA-விடம் சொன்னது · 14 ஜன.', hi: 'VIVA को बताया · 14 जन॰' },
  },
  mh2: {
    text: { en: 'Oura is your main device; Apple Health for workouts.', ta: 'Oura உங்கள் முதன்மைச் சாதனம்; உடற்பயிற்சிக்கு Apple Health.', hi: 'Oura आपका मुख्य डिवाइस है; वर्कआउट के लिए Apple Health।' },
    source: { en: 'Devices · 7 Jul', ta: 'சாதனங்கள் · 7 ஜூலை', hi: 'डिवाइस · 7 जुलाई' },
  },
  mp1: {
    text: { en: 'You mentor two young founders on Saturdays.', ta: 'சனிக்கிழமைகளில் இரண்டு இளம் நிறுவனர்களுக்கு நீங்கள் வழிகாட்டுகிறீர்கள்.', hi: 'आप शनिवार को दो युवा संस्थापकों को मार्गदर्शन देते हैं।' },
    source: { en: 'Ikigai map · 18 Jan', ta: 'இகிகாய் வரைபடம் · 18 ஜன.', hi: 'इकिगाई नक्शा · 18 जन॰' },
  },
  mp2: {
    text: { en: 'Your Tomorrow Question answers often mention teaching.', ta: 'உங்கள் “நாளைய கேள்வி” பதில்களில் கற்பித்தல் அடிக்கடி வருகிறது.', hi: 'आपके “कल का सवाल” के जवाबों में अक्सर पढ़ाने का ज़िक्र आता है।' },
    source: { en: 'Purpose space', ta: 'நோக்கம் இடம்', hi: 'उद्देश्य स्पेस' },
  },
  mr1: {
    text: { en: 'Kavya is your partner. Her answers are never shown to you.', ta: 'Kavya உங்கள் வாழ்க்கைத் துணை. அவரது பதில்கள் உங்களுக்கு ஒருபோதும் காட்டப்படாது.', hi: 'Kavya आपकी जीवनसाथी हैं। उनके जवाब आपको कभी नहीं दिखाए जाते।' },
    source: { en: 'Household · 6 Jul', ta: 'குடும்பம் · 6 ஜூலை', hi: 'परिवार · 6 जुलाई' },
  },
  mr2: {
    text: { en: 'Friday dinner with the Rao family, phones in the basket.', ta: 'வெள்ளிக்கிழமை Rao குடும்பத்துடன் இரவு உணவு, ஃபோன்கள் கூடையில்.', hi: 'शुक्रवार को Rao परिवार के साथ डिनर, फ़ोन टोकरी में।' },
    source: { en: 'Told VIVA · 9 Jan', ta: 'VIVA-விடம் சொன்னது · 9 ஜன.', hi: 'VIVA को बताया · 9 जन॰' },
  },
  mf1: {
    text: { en: 'Evenings after 7 pm are the time you want back.', ta: 'இரவு 7 மணிக்குப் பிறகான மாலை நேரத்தைத்தான் நீங்கள் திரும்பப் பெற விரும்புகிறீர்கள்.', hi: 'शाम 7 बजे के बाद का समय आप वापस चाहते हैं।' },
    source: { en: 'No list · 12 Jan', ta: '“வேண்டாம்” பட்டியல் · 12 ஜன.', hi: '“ना” की सूची · 12 जन॰' },
  },
  md1: {
    text: { en: 'Tea on the verandah at sunset is a reliable pleasure.', ta: 'சூரிய அஸ்தமனத்தில் வராந்தாவில் தேநீர், எப்போதும் கிடைக்கும் ஒரு மகிழ்ச்சி.', hi: 'सूर्यास्त के समय बरामदे में चाय, एक भरोसेमंद आनंद है।' },
    source: { en: 'Joy Ledger', ta: 'ஜாய் லெட்ஜர்', hi: 'जॉय लेजर' },
  },
  md2: {
    text: { en: 'Carnatic music, especially MS Subbulakshmi.', ta: 'கர்நாடக இசை, குறிப்பாக MS Subbulakshmi.', hi: 'कर्नाटक संगीत, ख़ासकर MS Subbulakshmi।' },
    source: { en: 'Joy Ledger', ta: 'ஜாய் லெட்ஜர்', hi: 'जॉय लेजर' },
  },
}

/** VIVA's six tools and the guardrail examples. `ask.en` is also what the router reads. */
export const TOOL_TEXT: Record<string, { title: L; does: L; ask: L }> = {
  index_explainer: {
    title: { en: 'Explain my Index', ta: 'என் குறியீட்டை விளக்கவும்', hi: 'मेरा इंडेक्स समझाएँ' },
    does: { en: 'A score, its band and the lowest term, from the method page.', ta: 'மதிப்பெண், அதன் நிலை, மிகக் குறைந்த அம்சம், முறை விளக்கப் பக்கத்திலிருந்து.', hi: 'स्कोर, उसका स्तर और सबसे कम पहलू, पद्धति वाले पेज से।' },
    ask: { en: 'Why is my Index 64?', ta: 'என் குறியீடு ஏன் 64?', hi: 'मेरा इंडेक्स 64 क्यों है?' },
  },
  next_best_action: {
    title: { en: 'Why today’s action', ta: 'இன்றைய செயல் ஏன்', hi: 'आज की गतिविधि क्यों' },
    does: { en: 'Why this one action was chosen today.', ta: 'இன்று இந்த ஒரு செயல் ஏன் தேர்ந்தெடுக்கப்பட்டது.', hi: 'आज यही एक गतिविधि क्यों चुनी गई।' },
    ask: { en: 'Why the verandah tea today?', ta: 'இன்று ஏன் வராந்தா தேநீர்?', hi: 'आज बरामदे वाली चाय क्यों?' },
  },
  ikigai_coach: {
    title: { en: 'Ikigai coach', ta: 'இகிகாய் பயிற்சியாளர்', hi: 'इकिगाई कोच' },
    does: { en: 'The Ikigai map and the Tomorrow Question.', ta: 'இகிகாய் வரைபடமும் “நாளைய கேள்வி”யும்.', hi: 'इकिगाई नक्शा और “कल का सवाल”।' },
    ask: { en: 'Help me with the Tomorrow Question.', ta: '“நாளைய கேள்வி”க்கு உதவுங்கள்.', hi: '“कल का सवाल” में मेरी मदद करें।' },
  },
  couples_prompt: {
    title: { en: 'Couples prompt', ta: 'தம்பதியர் கேள்வி', hi: 'जोड़े के लिए सवाल' },
    does: { en: 'State of Us prompts. Never reveals one partner to the other.', ta: 'State of Us கேள்விகள். ஒருவரின் பதிலை மற்றவருக்கு ஒருபோதும் வெளிப்படுத்தாது.', hi: 'State of Us सवाल। एक साथी की बात दूसरे को कभी नहीं बताता।' },
    ask: { en: 'A State of Us prompt for Kavya and me.', ta: 'Kavya-வுக்கும் எனக்கும் ஒரு State of Us கேள்வி.', hi: 'Kavya और मेरे लिए एक State of Us सवाल।' },
  },
  savour_prompt: {
    title: { en: 'Savour prompt', ta: 'ரசிப்புக் கேள்வி', hi: 'आनंद लेने का सवाल' },
    does: { en: 'Slow down one small pleasure, today.', ta: 'இன்று, ஒரு சிறிய மகிழ்ச்சியை நிதானமாக அனுபவியுங்கள்.', hi: 'आज, एक छोटे-से आनंद को धीरे-धीरे जिएँ।' },
    ask: { en: 'Help me savour this evening.', ta: 'இன்றைய மாலையை ரசிக்க உதவுங்கள்.', hi: 'आज की शाम का आनंद लेने में मदद करें।' },
  },
  practice_companion: {
    title: { en: 'Practice companion', ta: 'பயிற்சித் துணை', hi: 'अभ्यास साथी' },
    does: { en: 'Questions on this week’s practice, from the book and science notes.', ta: 'இந்த வாரப் பயிற்சி பற்றிய கேள்விகள், புத்தகம் மற்றும் அறிவியல் குறிப்புகளிலிருந்து.', hi: 'इस हफ़्ते के अभ्यास पर सवाल, किताब और विज्ञान नोट्स से।' },
    ask: { en: 'What is this week’s practice about?', ta: 'இந்த வாரப் பயிற்சி எதைப் பற்றியது?', hi: 'इस हफ़्ते का अभ्यास किस बारे में है?' },
  },
}

export const GUARDRAIL_TEXT: { label: L; ask: L }[] = [
  {
    label: { en: 'Do I have insomnia?', ta: 'எனக்குத் தூக்கமின்மை இருக்கிறதா?', hi: 'क्या मुझे अनिद्रा है?' },
    ask: { en: 'Do I have insomnia? Should I take melatonin?', ta: 'எனக்குத் தூக்கமின்மை இருக்கிறதா? நான் மெலடோனின் எடுக்கலாமா?', hi: 'क्या मुझे अनिद्रा है? क्या मुझे मेलाटोनिन लेनी चाहिए?' },
  },
  {
    label: { en: 'My PHQ-4 result', ta: 'என் PHQ-4 முடிவு', hi: 'मेरा PHQ-4 परिणाम' },
    ask: { en: 'What does my PHQ-4 result mean?', ta: 'என் PHQ-4 முடிவின் அர்த்தம் என்ன?', hi: 'मेरे PHQ-4 परिणाम का क्या मतलब है?' },
  },
  {
    label: { en: 'Move my savings?', ta: 'என் சேமிப்பை மாற்றலாமா?', hi: 'अपनी बचत लगाऊँ?' },
    ask: { en: 'Should I move my savings into equity funds?', ta: 'என் சேமிப்பை ஈக்விட்டி ஃபண்டுகளுக்கு மாற்றலாமா?', hi: 'क्या मुझे अपनी बचत इक्विटी फ़ंड में लगानी चाहिए?' },
  },
]

/** The Practice week titles (data/platform is outside this lane). */
export const PRACTICE_TITLE: Record<number, L> = {
  1: { en: 'The Check, the Index and the story', ta: 'செக், குறியீடு, கதை', hi: 'चेक, इंडेक्स और कहानी' },
  2: { en: 'The Tomorrow Question', ta: 'நாளைய கேள்வி', hi: 'कल का सवाल' },
  3: { en: 'Release the Ledger', ta: 'கணக்கை விடுவியுங்கள்', hi: 'हिसाब छोड़ दें' },
  4: { en: 'Don’t Postpone Joy', ta: 'மகிழ்ச்சியைத் தள்ளிப்போடாதீர்கள்', hi: 'ख़ुशी को मत टालिए' },
  5: { en: 'Continuous Correction', ta: 'தொடர்ச்சியான திருத்தம்', hi: 'लगातार सुधार' },
  6: { en: 'The Two Questions', ta: 'இரண்டு கேள்விகள்', hi: 'दो सवाल' },
  7: { en: 'Stay Curious · Own Your Emotional Life', ta: 'ஆர்வத்துடன் இருங்கள் · உங்கள் உணர்வு வாழ்க்கை உங்களுடையது', hi: 'जिज्ञासु रहें · अपनी भावनाओं की बागडोर ख़ुद थामें' },
  8: { en: 'Re-take the Index; the next ninety days', ta: 'குறியீட்டை மீண்டும் எடுங்கள்; அடுத்த தொண்ணூறு நாட்கள்', hi: 'इंडेक्स दोबारा दें; अगले नब्बे दिन' },
}

/** Fixed specimen times, keyed by their English text. */
export const WHEN_TEXT: Record<string, L> = {
  'Monday 7 pm': { en: 'Monday 7 pm', ta: 'திங்கள் இரவு 7 மணி', hi: 'सोमवार शाम 7 बजे' },
  'Thursday 8 April · 18:30': { en: 'Thursday 8 April · 18:30', ta: 'வியாழன், 8 ஏப்ரல் · 18:30', hi: 'गुरुवार, 8 अप्रैल · 18:30' },
  'Friday 9 April · 08:00': { en: 'Friday 9 April · 08:00', ta: 'வெள்ளி, 9 ஏப்ரல் · 08:00', hi: 'शुक्रवार, 9 अप्रैल · 08:00' },
  'Saturday 10 April · 11:00': { en: 'Saturday 10 April · 11:00', ta: 'சனி, 10 ஏப்ரல் · 11:00', hi: 'शनिवार, 10 अप्रैल · 11:00' },
  Thursday: { en: 'Thursday', ta: 'வியாழன்', hi: 'गुरुवार' },
  Friday: { en: 'Friday', ta: 'வெள்ளி', hi: 'शुक्रवार' },
  Saturday: { en: 'Saturday', ta: 'சனி', hi: 'शनिवार' },
}

export const DAY90_SPECIMEN_TEXT = {
  sentence: {
    en: 'Your Index moved from 64 to 61. Freedom fell after a heavy quarter at work. That is useful to know.',
    ta: 'உங்கள் குறியீடு 64 இலிருந்து 61 ஆக மாறியது. வேலையில் கனமான காலாண்டுக்குப் பிறகு சுதந்திரம் குறைந்தது. இது தெரிந்துகொள்ள உதவும் தகவல்.',
    hi: 'आपका इंडेक्स 64 से 61 पर आया। काम की भारी तिमाही के बाद स्वतंत्रता घटी। यह जानना काम का है।',
  } as L,
  person: {
    en: 'Dr Meera will call you on Thursday to plan the next ninety days.',
    ta: 'அடுத்த தொண்ணூறு நாட்களைத் திட்டமிட Dr Meera வியாழக்கிழமை உங்களை அழைப்பார்.',
    hi: 'अगले नब्बे दिनों की योजना बनाने के लिए Dr Meera गुरुवार को आपको फ़ोन करेंगी।',
  } as L,
}

/** The lane's translation hook: t() for CORE, plus the term names and data lookups. */
export function useCore() {
  const t = useDict(CORE)
  const lang = useLang()
  const terms = useTermText()
  /** A data string in the member's language; falls back to the English stored copy. */
  const pick = (l: L | undefined, fallback: string) => (l ? l[lang] ?? fallback : fallback)
  const tag = (s: string) => pick(TAG_TEXT[s], s)
  const when = (s: string) => pick(WHEN_TEXT[s], s)
  const method = (m: string) => t('methodLabel', { m })
  return { t, lang, name: terms.name, space: terms.space, pick, tag, when, method, fill }
}
