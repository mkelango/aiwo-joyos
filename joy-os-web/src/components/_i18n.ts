import type { Dict } from '@/lib/i18n'

// Shared member chrome and kit: MemberLayout, CrisisSheet, ThemeToggle, ErrorBoundary,
// ui primitives and joy/* components. English is the source and must not change.
// Stays English by design: brand and product names (AIWO, Joy OS, VIVA, WhatsApp,
// Tele-MANAS, plan names), people's names, numbers, method versions.
export const SHARED = {
  // MemberLayout
  skip: { en: 'Skip to content', ta: 'உள்ளடக்கத்திற்குச் செல்லவும்', hi: 'सीधे सामग्री पर जाएँ' },
  navMember: { en: 'Member', ta: 'உறுப்பினர்', hi: 'सदस्य' },
  navTabs: { en: 'Tabs', ta: 'தாவல்கள்', hi: 'टैब' },
  yours: { en: 'Yours', ta: 'உங்களுக்கானவை', hi: 'आपके लिए' },
  notifications: { en: 'Notifications', ta: 'அறிவிப்புகள்', hi: 'सूचनाएँ' },
  ledger: { en: 'Joy Ledger', ta: 'ஜாய் லெட்ஜர்', hi: 'जॉय लेजर' },
  myIndex: { en: 'My Index', ta: 'என் குறியீடு', hi: 'मेरा इंडेक्स' },
  viva: { en: 'VIVA companion', ta: 'VIVA துணை', hi: 'VIVA साथी' },
  circles: { en: 'Circles', ta: 'வட்டங்கள்', hi: 'सर्कल' },
  events: { en: 'Events', ta: 'நிகழ்வுகள்', hi: 'कार्यक्रम' },
  household: { en: 'Household', ta: 'குடும்பம்', hi: 'परिवार' },
  devices: { en: 'Devices', ta: 'சாதனங்கள்', hi: 'डिवाइस' },
  whatsapp: { en: 'WhatsApp', ta: 'WhatsApp', hi: 'WhatsApp' },
  membership: { en: 'Membership', ta: 'உறுப்பினர் திட்டம்', hi: 'सदस्यता' },
  trust: { en: 'Trust centre', ta: 'நம்பிக்கை மையம்', hi: 'भरोसा केंद्र' },
  profile: { en: 'Profile', ta: 'சுயவிவரம்', hi: 'प्रोफ़ाइल' },
  settings: { en: 'Settings', ta: 'அமைப்புகள்', hi: 'सेटिंग्स' },
  nextMeasureOn: { en: 'Next measure {date}', ta: 'அடுத்த அளவீடு {date}', hi: 'अगला माप {date}' },
  offline: {
    en: 'Offline. Today, the Ledger and the Practice still work; 3 entries will sync when you’re back.',
    ta: 'இணைய இணைப்பு இல்லை. இன்று, லெட்ஜர், பயிற்சி மூன்றும் தொடர்ந்து வேலை செய்யும்; நீங்கள் மீண்டும் இணைந்ததும் 3 பதிவுகள் ஒத்திசைக்கப்படும்.',
    hi: 'आप ऑफ़लाइन हैं। आज, लेजर और अभ्यास अब भी चलते हैं; वापस जुड़ते ही 3 एंट्री सिंक हो जाएँगी।',
  },
  dismiss: { en: 'Dismiss', ta: 'மூடு', hi: 'बंद करें' },
  home: { en: 'AIWO {sub} — home', ta: 'AIWO {sub} — முகப்பு', hi: 'AIWO {sub} — होम' },

  // ThemeToggle
  toLight: { en: 'Switch to light, Paper', ta: 'வெளிர் தீமுக்கு மாறவும், Paper', hi: 'हल्की थीम पर जाएँ, Paper' },
  toDark: { en: 'Switch to dark, warm Ink', ta: 'இதமான அடர் தீமுக்கு மாறவும், Ink', hi: 'गहरी गर्म थीम पर जाएँ, Ink' },

  // CrisisSheet: plain, careful, no AI wording
  crisisTitle: { en: 'You don’t have to hold this alone', ta: 'இதை நீங்கள் தனியாகச் சுமக்க வேண்டியதில்லை', hi: 'आपको यह सब अकेले नहीं झेलना है' },
  crisisManual: {
    en: 'A real person, whenever you want one. Nothing here is written by AI.',
    ta: 'நீங்கள் விரும்பும் எந்த நேரத்திலும் ஒரு உண்மையான மனிதர் உங்களுடன் பேசுவார். இங்குள்ள எதுவும் AI எழுதியது அல்ல.',
    hi: 'जब भी आप चाहें, एक असली इंसान आपसे बात करेगा। यहाँ कुछ भी AI ने नहीं लिखा है।',
  },
  crisisIntercept: {
    en: 'What you wrote sounded heavy. A real person can talk with you right now. Nothing here is written by AI.',
    ta: 'நீங்கள் எழுதியது மிகவும் பாரமாகத் தோன்றியது. ஒரு உண்மையான மனிதர் இப்போதே உங்களுடன் பேசலாம். இங்குள்ள எதுவும் AI எழுதியது அல்ல.',
    hi: 'आपने जो लिखा, वह बहुत भारी लगा। एक असली इंसान अभी आपसे बात कर सकता है। यहाँ कुछ भी AI ने नहीं लिखा है।',
  },
  teleManasSub: { en: 'Free, 24 hours, in 20 languages', ta: 'இலவசம், 24 மணி நேரமும், 20 மொழிகளில்', hi: 'मुफ़्त, 24 घंटे, 20 भाषाओं में' },
  hasBeenTold: { en: '{name} has been told', ta: '{name} அவர்களுக்குத் தெரிவிக்கப்பட்டுள்ளது', hi: '{name} को बता दिया गया है' },
  onCall: {
    en: 'On call tonight · will reach you within 15 minutes',
    ta: 'இன்றிரவு பணியில் உள்ளார் · 15 நிமிடங்களுக்குள் உங்களைத் தொடர்புகொள்வார்',
    hi: 'आज रात ड्यूटी पर हैं · 15 मिनट के भीतर आपसे संपर्क करेंगे',
  },
  emergency: { en: 'Emergency services · 112', ta: 'அவசர சேவை · 112', hi: 'आपातकालीन सेवा · 112' },
  p0Logged: {
    en: 'P0 · logged with an SLA, an owner and an audit trail',
    ta: 'P0 · SLA, பொறுப்பாளர், தணிக்கைப் பதிவுடன் பதிவு செய்யப்பட்டது',
    hi: 'P0 · SLA, ज़िम्मेदार व्यक्ति और ऑडिट ट्रेल के साथ दर्ज',
  },

  // ErrorBoundary
  errEyebrow: { en: 'Something went wrong', ta: 'ஏதோ தவறு நடந்துவிட்டது', hi: 'कुछ गड़बड़ हो गई' },
  errPre: { en: 'This screen could not open. ', ta: 'இந்தத் திரையைத் திறக்க முடியவில்லை. நீங்கள் சேமித்த ', hi: 'यह स्क्रीन खुल नहीं पाई। आपका सहेजा हुआ ' },
  errEm: { en: 'Nothing', ta: 'எதுவும்', hi: 'कुछ भी' },
  errPost: { en: ' you saved is lost.', ta: ' இழக்கப்படவில்லை.', hi: ' खोया नहीं है।' },
  errBody: {
    en: 'Your Ledger and answers are kept on this device and sync when the screen is back.',
    ta: 'உங்கள் லெட்ஜரும் பதில்களும் இந்தச் சாதனத்திலேயே பாதுகாப்பாக உள்ளன; திரை மீண்டும் வந்ததும் ஒத்திசைக்கப்படும்.',
    hi: 'आपका लेजर और जवाब इसी डिवाइस पर सुरक्षित हैं, और स्क्रीन वापस आने पर सिंक हो जाएँगे।',
  },
  backToToday: { en: 'Back to Today', ta: 'இன்றைய பக்கத்துக்குத் திரும்பு', hi: 'आज पर वापस जाएँ' },
  backToStart: { en: 'Back to the start', ta: 'தொடக்கத்துக்குத் திரும்பு', hi: 'शुरुआत पर वापस जाएँ' },
  tryAgain: { en: 'Try again', ta: 'மீண்டும் முயலவும்', hi: 'फिर से कोशिश करें' },

  // ui primitives
  close: { en: 'Close', ta: 'மூடு', hi: 'बंद करें' },
  loopDay: { en: 'Day {n} of {of}', ta: '{of} இல் நாள் {n}', hi: '{of} में से दिन {n}' },

  // joy primitives
  notYetMeasuredAria: { en: 'Not yet measured', ta: 'இன்னும் அளவிடப்படவில்லை', hi: 'अभी मापा नहीं गया' },
  indexOf100: { en: 'Joyspan Index {v} of 100', ta: 'ஜாய்ஸ்பான் குறியீடு 100 இல் {v}', hi: 'जॉयस्पैन इंडेक्स 100 में से {v}' },
  bandSteady: { en: 'steady', ta: 'சீரானது', hi: 'स्थिर' },
  bandUneven: { en: 'uneven', ta: 'சீரற்றது', hi: 'असमान' },
  bandThin: { en: 'thin', ta: 'குறைவு', hi: 'कम' },
  bandNone: { en: 'not yet measured', ta: 'இன்னும் அளவிடப்படவில்லை', hi: 'अभी मापा नहीं गया' },
  deltaEased: { en: 'eased by {n}', ta: '{n} தணிந்தது', hi: '{n} कम हुआ' },
  deltaRose: { en: 'rose by {n}', ta: '{n} அதிகரித்தது', hi: '{n} बढ़ा' },
  deltaUp: { en: 'up {n}', ta: '{n} உயர்வு', hi: '{n} ऊपर' },
  deltaDown: { en: 'down {n}', ta: '{n} இறக்கம்', hi: '{n} नीचे' },
  deltaSame: { en: 'unchanged {n}', ta: 'மாற்றமில்லை', hi: 'कोई बदलाव नहीं' },
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
} satisfies Dict
