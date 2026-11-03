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
  day40: { en: 'The Day-40 page', ta: 'நாள்-40 பக்கம்', hi: 'दिन-40 का पन्ना' },
  letter: { en: 'The Joyspan Letter', ta: 'ஜாய்ஸ்பான் கடிதம்', hi: 'जॉयस्पैन पत्र' },
  nextMeasureOn: { en: 'Next measure {date}', ta: 'அடுத்த அளவீடு {date}', hi: 'अगला माप {date}' },
  offlineNone: {
    en: 'Offline. Today, the Ledger and the Practice still work; anything you add waits here and syncs when you’re back.',
    ta: 'இணைய இணைப்பு இல்லை. இன்று, லெட்ஜர், பயிற்சி மூன்றும் தொடர்ந்து வேலை செய்யும்; நீங்கள் சேர்ப்பவை இங்கேயே காத்திருந்து, மீண்டும் இணைந்ததும் ஒத்திசைக்கப்படும்.',
    hi: 'आप ऑफ़लाइन हैं। आज, लेजर और अभ्यास अब भी चलते हैं; आप जो जोड़ेंगे वह यहीं रुकेगा और वापस जुड़ते ही सिंक हो जाएगा।',
  },
  offlineOne: {
    en: 'Offline. Today, the Ledger and the Practice still work; {n} change will sync when you’re back.',
    ta: 'இணைய இணைப்பு இல்லை. இன்று, லெட்ஜர், பயிற்சி மூன்றும் தொடர்ந்து வேலை செய்யும்; நீங்கள் மீண்டும் இணைந்ததும் {n} மாற்றம் ஒத்திசைக்கப்படும்.',
    hi: 'आप ऑफ़लाइन हैं। आज, लेजर और अभ्यास अब भी चलते हैं; वापस जुड़ते ही {n} बदलाव सिंक हो जाएगा।',
  },
  offlineMany: {
    en: 'Offline. Today, the Ledger and the Practice still work; {n} changes will sync when you’re back.',
    ta: 'இணைய இணைப்பு இல்லை. இன்று, லெட்ஜர், பயிற்சி மூன்றும் தொடர்ந்து வேலை செய்யும்; நீங்கள் மீண்டும் இணைந்ததும் {n} மாற்றங்கள் ஒத்திசைக்கப்படும்.',
    hi: 'आप ऑफ़लाइन हैं। आज, लेजर और अभ्यास अब भी चलते हैं; वापस जुड़ते ही {n} बदलाव सिंक हो जाएँगे।',
  },
  backOnline: { en: 'I’m back online', ta: 'மீண்டும் இணைந்துவிட்டேன்', hi: 'मैं फिर से ऑनलाइन हूँ' },
  syncingOne: { en: 'Back online · syncing {n} change…', ta: 'மீண்டும் இணைப்பில் · {n} மாற்றம் ஒத்திசைக்கப்படுகிறது…', hi: 'फिर से ऑनलाइन · {n} बदलाव सिंक हो रहा है…' },
  syncingMany: { en: 'Back online · syncing {n} changes…', ta: 'மீண்டும் இணைப்பில் · {n} மாற்றங்கள் ஒத்திசைக்கப்படுகின்றன…', hi: 'फिर से ऑनलाइन · {n} बदलाव सिंक हो रहे हैं…' },
  syncedOne: { en: 'Synced · {n} change is up to date. Specimen: nothing left this browser.', ta: 'ஒத்திசைந்தது · {n} மாற்றம் புதுப்பிக்கப்பட்டது. மாதிரி: எதுவும் இந்த உலாவியை விட்டு வெளியேறவில்லை.', hi: 'सिंक हो गया · {n} बदलाव अद्यतन है। नमूना: इस ब्राउज़र से कुछ भी बाहर नहीं गया।' },
  syncedMany: { en: 'Synced · {n} changes are up to date. Specimen: nothing left this browser.', ta: 'ஒத்திசைந்தது · {n} மாற்றங்கள் புதுப்பிக்கப்பட்டன. மாதிரி: எதுவும் இந்த உலாவியை விட்டு வெளியேறவில்லை.', hi: 'सिंक हो गया · {n} बदलाव अद्यतन हैं। नमूना: इस ब्राउज़र से कुछ भी बाहर नहीं गया।' },
  graceBanner: {
    en: 'Your February UPI payment didn’t go through. Nothing changes until {date}.',
    ta: 'பிப்ரவரிக்கான உங்கள் UPI கட்டணம் செல்லவில்லை. {date} வரை எதுவும் மாறாது.',
    hi: 'फ़रवरी का आपका UPI भुगतान नहीं हो पाया। {date} तक कुछ नहीं बदलेगा।',
  },
  graceLink: { en: 'See membership', ta: 'உறுப்பினர் திட்டத்தைப் பார்க்கவும்', hi: 'सदस्यता देखें' },
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
  // A voluntary tap tells no one, so manual mode promises no call-back: it says how to reach them.
  onCallManual: {
    en: 'On call tonight · nobody has been told; write to them below if you want a person',
    ta: 'இன்றிரவு பணியில் உள்ளார் · யாருக்கும் தெரிவிக்கப்படவில்லை; ஒரு மனிதர் வேண்டுமெனில் கீழே அவருக்கு எழுதுங்கள்',
    hi: 'आज रात ड्यूटी पर हैं · किसी को बताया नहीं गया है; किसी इंसान से बात करनी हो तो नीचे उन्हें लिखें',
  },
  clinicianOnCall: { en: '{name} · psychologist on call', ta: '{name} · பணியில் உள்ள உளவியலாளர்', hi: '{name} · ड्यूटी पर मनोवैज्ञानिक' },
  clinicianMessage: { en: 'Message {name} now', ta: '{name} அவர்களுக்கு இப்போதே செய்தி அனுப்பவும்', hi: '{name} को अभी संदेश भेजें' },
  clinicianMessageSub: {
    en: 'Opens your Care messages. A person reads it, not AI.',
    ta: 'உங்கள் கவனிப்புச் செய்திகளைத் திறக்கும். இதை AI அல்ல, ஒரு மனிதர் படிப்பார்.',
    hi: 'आपके देखभाल संदेश खुलेंगे। इसे AI नहीं, एक इंसान पढ़ेगा।',
  },
  ecEyebrow: { en: 'Your emergency contact', ta: 'உங்கள் அவசரத் தொடர்பு', hi: 'आपका आपातकालीन संपर्क' },
  ecCall: { en: 'Call {name}', ta: '{name} அவர்களை அழைக்கவும்', hi: '{name} को कॉल करें' },
  ecTell: { en: 'Tell {name} for me', ta: 'எனக்காக {name} அவர்களிடம் சொல்லுங்கள்', hi: 'मेरी ओर से {name} को बता दें' },
  ecTellSub: {
    en: 'One short message: you could use them right now. Nothing you wrote is shared.',
    ta: 'ஒரு சிறிய செய்தி: இப்போது உங்களுக்கு அவர்கள் தேவை. நீங்கள் எழுதிய எதுவும் பகிரப்படாது.',
    hi: 'बस एक छोटा संदेश: अभी आपको उनकी ज़रूरत है। आपने जो लिखा, वह साझा नहीं होगा।',
  },
  ecTold: { en: '{name} has been sent a message', ta: '{name} அவர்களுக்குச் செய்தி அனுப்பப்பட்டது', hi: '{name} को संदेश भेज दिया गया है' },
  ecToldSub: { en: 'Specimen · nothing left this device', ta: 'மாதிரி · எதுவும் இந்தச் சாதனத்தை விட்டு வெளியேறவில்லை', hi: 'नमूना · इस डिवाइस से कुछ भी बाहर नहीं गया' },
  ecUndo: { en: 'Undo', ta: 'செயல்தவிர்', hi: 'वापस लें' },
  ecNone: { en: 'No emergency contact yet.', ta: 'இன்னும் அவசரத் தொடர்பு இல்லை.', hi: 'अभी कोई आपातकालीन संपर्क नहीं है।' },
  ecAdd: { en: 'Add one in Profile', ta: 'சுயவிவரத்தில் சேர்க்கவும்', hi: 'प्रोफ़ाइल में जोड़ें' },
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
  wheelDay0: { en: '. Day 0 outline: {list}', ta: '. நாள் 0 வெளிக்கோடு: {list}', hi: '। दिन 0 की रूपरेखा: {list}' },
  wheelGhostKey: { en: 'Outline: where each petal stood on Day 0', ta: 'வெளிக்கோடு: நாள் 0 அன்று ஒவ்வொரு இதழும் இருந்த அளவு', hi: 'रूपरेखा: दिन 0 पर हर पंखुड़ी कहाँ थी' },

  // Minors: never scored (Architecture p26)
  minorNotScored: { en: 'Not scored while under 18', ta: '18 வயது ஆகும் வரை மதிப்பெண் இல்லை', hi: '18 साल का होने तक कोई स्कोर नहीं' },
  minorNotScoredSub: {
    en: 'Your Spaces, Ledger and Practice stay open. The Index opens on your 18th birthday.',
    ta: 'உங்கள் இடங்கள், லெட்ஜர், பயிற்சி எல்லாம் திறந்தே இருக்கும். உங்கள் 18வது பிறந்தநாளில் குறியீடு திறக்கும்.',
    hi: 'आपके स्पेस, लेजर और अभ्यास खुले रहेंगे। इंडेक्स आपके 18वें जन्मदिन पर खुलेगा।',
  },
  minorBand: { en: 'not scored', ta: 'மதிப்பெண் இல்லை', hi: 'स्कोर नहीं' },
  minorWheel: { en: 'six petals, not scored while under 18', ta: 'ஆறு இதழ்கள், 18 வயது ஆகும் வரை மதிப்பெண் இல்லை', hi: 'छह पंखुड़ियाँ, 18 साल का होने तक कोई स्कोर नहीं' },

  // App lock (Settings · Biometric lock): simulated, nothing biometric is read
  lockTitle: { en: 'Joy OS is locked', ta: 'Joy OS பூட்டப்பட்டுள்ளது', hi: 'Joy OS लॉक है' },
  lockGreeting: { en: 'Welcome back, {name}', ta: 'மீண்டும் வருக, {name}', hi: 'फिर से स्वागत है, {name}' },
  lockBody: {
    en: 'Use Face ID or your fingerprint to open. Your biometrics stay on this device.',
    ta: 'திறக்க Face ID அல்லது கைரேகையைப் பயன்படுத்தவும். உங்கள் பயோமெட்ரிக் தகவல் இந்தச் சாதனத்திலேயே இருக்கும்.',
    hi: 'खोलने के लिए Face ID या फ़िंगरप्रिंट का उपयोग करें। आपकी बायोमेट्रिक जानकारी इसी डिवाइस पर रहती है।',
  },
  lockAway: {
    en: 'Locked after {x} away. Change this in Settings.',
    ta: '{x} விலகியிருந்ததால் பூட்டப்பட்டது. அமைப்புகளில் மாற்றலாம்.',
    hi: '{x} दूर रहने पर लॉक हुआ। इसे सेटिंग्स में बदलें।',
  },
  lockAwayNow: {
    en: 'Locked as soon as you left. Change this in Settings.',
    ta: 'நீங்கள் விலகியதும் பூட்டப்பட்டது. அமைப்புகளில் மாற்றலாம்.',
    hi: 'आपके हटते ही लॉक हुआ। इसे सेटिंग्स में बदलें।',
  },
  lockMinutes: { en: '{n} min', ta: '{n} நிமி', hi: '{n} मिनट' },
  lockUnlock: { en: 'Unlock with Face ID or fingerprint', ta: 'Face ID அல்லது கைரேகை மூலம் திறக்கவும்', hi: 'Face ID या फ़िंगरप्रिंट से खोलें' },
  lockChecking: { en: 'Checking…', ta: 'சரிபார்க்கிறது…', hi: 'जाँच हो रही है…' },
  lockUnlocked: { en: 'Unlocked', ta: 'திறக்கப்பட்டது', hi: 'खुल गया' },
  lockUseId: { en: 'Use your AIWO ID instead', ta: 'பதிலாக உங்கள் AIWO ID-ஐப் பயன்படுத்தவும்', hi: 'इसके बजाय अपनी AIWO ID का उपयोग करें' },
  lockIdBody: {
    en: 'We send a six-digit code to the phone or email on your AIWO ID.',
    ta: 'உங்கள் AIWO ID-யில் உள்ள தொலைபேசி அல்லது மின்னஞ்சலுக்கு ஆறு இலக்கக் குறியீட்டை அனுப்புவோம்.',
    hi: 'हम आपकी AIWO ID वाले फ़ोन या ईमेल पर छह अंकों का कोड भेजते हैं।',
  },
  lockSendCode: { en: 'Send a code', ta: 'குறியீட்டை அனுப்பவும்', hi: 'कोड भेजें' },
  lockCodeSent: { en: 'Code sent to your AIWO ID', ta: 'உங்கள் AIWO ID-க்குக் குறியீடு அனுப்பப்பட்டது', hi: 'आपकी AIWO ID पर कोड भेजा गया' },
  lockCodeLabel: { en: 'Six-digit code', ta: 'ஆறு இலக்கக் குறியீடு', hi: 'छह अंकों का कोड' },
  lockCodeHint: {
    en: 'Specimen: nothing is sent. Any six digits unlock.',
    ta: 'மாதிரி: எதுவும் அனுப்பப்படவில்லை. எந்த ஆறு இலக்கங்களும் திறக்கும்.',
    hi: 'नमूना: कुछ भी नहीं भेजा जाता। कोई भी छह अंक खोल देंगे।',
  },
  lockCodeError: { en: 'Enter all six digits of the code.', ta: 'குறியீட்டின் ஆறு இலக்கங்களையும் உள்ளிடவும்.', hi: 'कोड के सभी छह अंक डालें।' },
  lockUnlockCode: { en: 'Unlock', ta: 'திறக்கவும்', hi: 'खोलें' },
  lockBack: { en: 'Use Face ID or fingerprint instead', ta: 'பதிலாக Face ID அல்லது கைரேகையைப் பயன்படுத்தவும்', hi: 'इसके बजाय Face ID या फ़िंगरप्रिंट का उपयोग करें' },
  lockSpecimen: { en: 'Specimen lock · no biometric data is read', ta: 'மாதிரிப் பூட்டு · பயோமெட்ரிக் தரவு எதுவும் படிக்கப்படவில்லை', hi: 'नमूना लॉक · कोई बायोमेट्रिक डेटा नहीं पढ़ा जाता' },
} satisfies Dict
