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
  // Your people: the on-call clinician, then whoever the signed-in member named as their
  // emergency contact (never a fixed name), or an honest empty state when no one is named.
  yourPeopleOnCall: {
    en: 'Dr Sanjay Menon, your psychologist, is on call tonight.',
    ta: 'உங்கள் உளவியலாளர் Dr Sanjay Menon இன்றிரவு பணியில் இருக்கிறார்.',
    hi: 'आपके मनोवैज्ञानिक Dr Sanjay Menon आज रात ड्यूटी पर हैं।',
  },
  yourPeopleContact: {
    en: '{name} is your emergency contact; we only tell them if you ask us to.',
    ta: '{name} உங்கள் அவசரத் தொடர்பு; நீங்கள் கேட்டால் மட்டுமே அவருக்குத் தெரிவிப்போம்.',
    hi: '{name} आपके इमरजेंसी संपर्क हैं; हम उन्हें तभी बताएँगे जब आप कहेंगे।',
  },
  yourPeopleNoContact: {
    en: 'You have not added an emergency contact yet.',
    ta: 'நீங்கள் இன்னும் அவசரத் தொடர்பு யாரையும் சேர்க்கவில்லை.',
    hi: 'आपने अभी तक कोई इमरजेंसी संपर्क नहीं जोड़ा है।',
  },
  messageOnCall: { en: 'Message the on-call clinician', ta: 'பணியில் உள்ள மருத்துவருக்குச் செய்தி அனுப்பவும்', hi: 'ड्यूटी पर मौजूद क्लिनिशियन को संदेश भेजें' },

  // CrisisSheet: your people, made actionable. Pre-approved copy.
  callOnCall: { en: 'Message Dr Sanjay Menon now', ta: 'Dr Sanjay Menon-க்கு இப்போதே செய்தி அனுப்பவும்', hi: 'Dr Sanjay Menon को अभी संदेश भेजें' },
  callOnCallHint: { en: 'Opens a new message to the on-call clinician', ta: 'பணியில் உள்ள மருத்துவருக்குப் புதிய செய்தியைத் திறக்கும்', hi: 'ड्यूटी पर मौजूद क्लिनिशियन के लिए नया संदेश खोलता है' },
  tellContact: { en: 'Ask us to tell {name}', ta: '{name}-இடம் தெரிவிக்கச் சொல்லுங்கள்', hi: 'हमसे कहें कि {name} को बताएँ' },
  tellContactHint: { en: 'We tell your emergency contact that you asked for support. Nothing else is shared.', ta: 'நீங்கள் உதவி கேட்டீர்கள் என்று மட்டும் உங்கள் அவசரத் தொடர்புக்குத் தெரிவிப்போம். வேறு எதுவும் பகிரப்படாது.', hi: 'हम आपकी इमरजेंसी संपर्क को बस इतना बताएँगे कि आपने सहारा माँगा है। और कुछ साझा नहीं होता।' },
  toldContact: { en: 'We are telling {name} now that you asked for support. Nothing else is shared.', ta: 'நீங்கள் உதவி கேட்டீர்கள் என்று {name}-இடம் இப்போது தெரிவிக்கிறோம். வேறு எதுவும் பகிரப்படாது.', hi: 'हम अभी {name} को बता रहे हैं कि आपने सहारा माँगा है। और कुछ साझा नहीं होता।' },
  undoTell: { en: 'Don’t tell {name}', ta: '{name}-இடம் சொல்ல வேண்டாம்', hi: '{name} को न बताएँ' },
  callContact: { en: 'Call {name}', ta: '{name}-ஐ அழைக்கவும்', hi: '{name} को कॉल करें' },
  callContactHint: { en: 'Calls your emergency contact', ta: 'உங்கள் அவசரத் தொடர்பை அழைக்கும்', hi: 'आपकी इमरजेंसी संपर्क को कॉल करता है' },
  // Signed out (Welcome, Sign in, the Check, Onboarding): no member yet, so no contact and no Messages.
  yourPeopleBodyOut: {
    en: 'A clinician from AIWO’s care team is on call day and night. You don’t need an account to call.',
    ta: 'AIWO பராமரிப்புக் குழுவின் மருத்துவர் ஒருவர் இரவும் பகலும் பணியில் இருக்கிறார். அழைக்க உங்களுக்குக் கணக்கு தேவையில்லை.',
    hi: 'AIWO की केयर टीम का एक क्लिनिशियन दिन-रात ड्यूटी पर रहता है। कॉल करने के लिए आपको खाते की ज़रूरत नहीं है।',
  },
  onCallLineCall: { en: 'Call the on-call clinician', ta: 'பணியில் உள்ள மருத்துவரை அழைக்கவும்', hi: 'ड्यूटी पर मौजूद क्लिनिशियन को कॉल करें' },
  onCallLineHint: { en: 'Calls AIWO’s on-call clinician line', ta: 'AIWO-வின் பணியில் உள்ள மருத்துவர் எண்ணை அழைக்கும்', hi: 'AIWO की ड्यूटी क्लिनिशियन लाइन पर कॉल करता है' },
  onCallLineMeta: { en: 'On-call line (specimen number):', ta: 'பணியில் உள்ள மருத்துவர் எண் (மாதிரி எண்):', hi: 'ड्यूटी लाइन (नमूना नंबर):' },
  emergencyContact: { en: 'Emergency contact · {relation}', ta: 'அவசரத் தொடர்பு · {relation}', hi: 'इमरजेंसी संपर्क · {relation}' },
  emergencyContactPlain: { en: 'Emergency contact', ta: 'அவசரத் தொடர்பு', hi: 'इमरजेंसी संपर्क' },
  // No emergency contact on this account yet (a new account, or one removed in Profile).
  noContactBody: {
    en: 'No one is added yet. You can add someone in Profile; we would tell them only if you asked us to.',
    ta: 'இன்னும் யாரும் சேர்க்கப்படவில்லை. சுயவிவரத்தில் ஒருவரைச் சேர்க்கலாம்; நீங்கள் கேட்டால் மட்டுமே அவருக்குத் தெரிவிப்போம்.',
    hi: 'अभी कोई नहीं जोड़ा गया। आप प्रोफ़ाइल में किसी को जोड़ सकते हैं; हम उन्हें तभी बताएँगे जब आप कहेंगे।',
  },
  addContact: { en: 'Add one in Profile', ta: 'சுயவிவரத்தில் சேர்க்கவும்', hi: 'प्रोफ़ाइल में जोड़ें' },
  addContactHint: {
    en: 'Closes this and opens Profile, where Edit beside Emergency contact adds someone',
    ta: 'இதை மூடி சுயவிவரத்தைத் திறக்கும்; அங்கே அவசரத் தொடர்பு அருகே உள்ள மாற்று மூலம் ஒருவரைச் சேர்க்கலாம்',
    hi: 'इसे बंद करके प्रोफ़ाइल खोलता है, जहाँ इमरजेंसी संपर्क के पास बदलें से किसी को जोड़ सकते हैं',
  },

  // App-wide banners: offline with its sync queue, and payments grace.
  offlineNone: { en: 'Offline. Anything you add is kept on this phone and sent when you are back.', ta: 'இணையம் இல்லை. நீங்கள் சேர்ப்பது இந்தத் தொலைபேசியில் வைக்கப்பட்டு, இணைப்பு வந்ததும் அனுப்பப்படும்.', hi: 'ऑफ़लाइन। आप जो भी जोड़ें, इसी फ़ोन पर रहेगा और वापस जुड़ने पर भेजा जाएगा।' },
  offlineOne: { en: 'Offline · 1 change kept on this phone, sent when you are back.', ta: 'இணையம் இல்லை · 1 மாற்றம் இந்தத் தொலைபேசியில் உள்ளது, இணைப்பு வந்ததும் அனுப்பப்படும்.', hi: 'ऑफ़लाइन · 1 बदलाव इसी फ़ोन पर रखा है, वापस जुड़ने पर भेजा जाएगा।' },
  offlineMany: { en: 'Offline · {n} changes kept on this phone, sent when you are back.', ta: 'இணையம் இல்லை · {n} மாற்றங்கள் இந்தத் தொலைபேசியில் உள்ளன, இணைப்பு வந்ததும் அனுப்பப்படும்.', hi: 'ऑफ़लाइन · {n} बदलाव इसी फ़ोन पर रखे हैं, वापस जुड़ने पर भेजे जाएँगे।' },
  offlineLedger: { en: '{n} of them in your Joy Ledger.', ta: 'அவற்றில் {n} உங்கள் மகிழ்ச்சி லெட்ஜரில்.', hi: 'इनमें से {n} आपके जॉय लेजर में।' },
  goOnline: { en: 'I’m back online', ta: 'இணைப்பு திரும்பியது', hi: 'मैं फिर ऑनलाइन हूँ' },
  syncing: { en: 'Back online · sending {n} kept on this phone…', ta: 'இணைப்பு திரும்பியது · தொலைபேசியில் இருந்த {n} அனுப்பப்படுகிறது…', hi: 'फिर ऑनलाइन · फ़ोन पर रखे {n} भेजे जा रहे हैं…' },
  synced: { en: 'Synced · {n} sent. Nothing was lost.', ta: 'ஒத்திசைந்தது · {n} அனுப்பப்பட்டது. எதுவும் இழக்கப்படவில்லை.', hi: 'सिंक हो गया · {n} भेजे गए। कुछ नहीं खोया।' },
  graceBanner: { en: 'Your {month} payment didn’t go through. Nothing changes until {date}.', ta: 'உங்கள் {month} கட்டணம் செல்லவில்லை. {date} வரை எதுவும் மாறாது.', hi: 'आपका {month} का भुगतान नहीं हो पाया। {date} तक कुछ नहीं बदलेगा।' },
  graceBannerPatron: { en: 'Your Patron renewal invoice is still unpaid. Nothing changes until {date}.', ta: 'உங்கள் Patron புதுப்பிப்பு ரசீது இன்னும் செலுத்தப்படவில்லை. {date} வரை எதுவும் மாறாது.', hi: 'आपका Patron नवीनीकरण इनवॉइस अभी बाक़ी है। {date} तक कुछ नहीं बदलेगा।' },
  gracePay: { en: 'Pay {amount}', ta: '{amount} செலுத்தவும்', hi: '{amount} चुकाएँ' },
  gracePayHint: { en: 'Opens Membership', ta: 'உறுப்பினர் பக்கத்தைத் திறக்கும்', hi: 'सदस्यता खोलता है' },

  // Error boundary: a screen that failed is never blank.
  errEyebrow: { en: 'Something went wrong', ta: 'ஏதோ தவறாகிவிட்டது', hi: 'कुछ गड़बड़ हो गई' },
  errTitleA: { en: 'This screen ', ta: 'இந்தத் திரை ', hi: 'यह स्क्रीन ' },
  errTitleSerif: { en: 'stumbled', ta: 'தடுமாறியது', hi: 'लड़खड़ा गई' },
  errTitleB: { en: '. Your data is safe.', ta: '. உங்கள் தரவு பாதுகாப்பாக உள்ளது.', hi: '। आपका डेटा सुरक्षित है।' },
  errLead: { en: 'Nothing you saved is lost: your Ledger, answers and settings are kept on this phone. Try again, or go back to Today.', ta: 'நீங்கள் சேமித்த எதுவும் இழக்கப்படவில்லை: உங்கள் லெட்ஜர், பதில்கள், அமைப்புகள் இந்தத் தொலைபேசியில் உள்ளன. மீண்டும் முயலுங்கள், அல்லது இன்றைய பக்கத்துக்குத் திரும்புங்கள்.', hi: 'आपका सहेजा कुछ भी नहीं खोया: आपका लेजर, जवाब और सेटिंग इसी फ़ोन पर हैं। फिर से कोशिश करें, या आज पर लौटें।' },
  errRetry: { en: 'Try again', ta: 'மீண்டும் முயலவும்', hi: 'फिर से कोशिश करें' },
  errHome: { en: 'Go to Today', ta: 'இன்றைய பக்கத்துக்குச் செல்லவும்', hi: 'आज पर जाएँ' },
  errDetail: { en: 'What happened', ta: 'என்ன நடந்தது', hi: 'क्या हुआ' },
  errCrisis: { en: 'If you need someone now: Tele-MANAS 14416, free, any time.', ta: 'இப்போதே யாராவது தேவைப்பட்டால்: Tele-MANAS 14416, இலவசம், எந்த நேரத்திலும்.', hi: 'अगर अभी किसी की ज़रूरत है: Tele-MANAS 14416, मुफ़्त, कभी भी।' },

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
  wheelDay0: { en: ', Day 0 {v}', ta: ', நாள் 0 இல் {v}', hi: ', दिन 0 पर {v}' },
  wheelGhost: { en: 'Outline · Day 0', ta: 'வெளிக்கோடு · நாள் 0', hi: 'रूपरेखा · दिन 0' },

  // Biometric lock screen (Architecture p21). Specimen: no biometric is read.
  lockEyebrow: { en: 'Joy OS is locked', ta: 'Joy OS பூட்டப்பட்டுள்ளது', hi: 'Joy OS लॉक है' },
  lockTitleA: { en: 'Welcome ', ta: 'மீண்டும் ', hi: 'फिर से ' },
  lockTitleSerif: { en: 'back', ta: 'வருக', hi: 'स्वागत' },
  lockTitleB: { en: '.', ta: '.', hi: '।' },
  lockLead: { en: 'What you keep in Joy OS stays private on this phone. Unlock to carry on where you were.', ta: 'Joy OS-இல் நீங்கள் வைத்திருப்பவை இந்தத் தொலைபேசியில் தனிப்பட்டதாகவே இருக்கும். விட்ட இடத்திலிருந்து தொடர பூட்டைத் திறங்கள்.', hi: 'Joy OS में जो आप रखते हैं, वह इसी फ़ोन पर निजी रहता है। जहाँ थे वहीं से आगे बढ़ने के लिए अनलॉक करें।' },
  lockFace: { en: 'Unlock with Face ID', ta: 'Face ID மூலம் திற', hi: 'Face ID से अनलॉक करें' },
  lockFinger: { en: 'Unlock with your fingerprint', ta: 'கைரேகை மூலம் திற', hi: 'फ़िंगरप्रिंट से अनलॉक करें' },
  lockDevice: { en: 'Unlock with this device', ta: 'இந்தச் சாதனம் மூலம் திற', hi: 'इस डिवाइस से अनलॉक करें' },
  lockChecking: { en: 'Checking…', ta: 'சரிபார்க்கிறது…', hi: 'जाँच हो रही है…' },
  lockPasscode: { en: 'Use the phone’s passcode instead', ta: 'அதற்குப் பதிலாகத் தொலைபேசியின் கடவுக்குறியீட்டைப் பயன்படுத்து', hi: 'इसके बजाय फ़ोन का पासकोड इस्तेमाल करें' },
  lockPasscodeLabel: { en: 'Phone passcode', ta: 'தொலைபேசி கடவுக்குறியீடு', hi: 'फ़ोन पासकोड' },
  lockPasscodeHelp: { en: 'Any six digits work in the specimen.', ta: 'மாதிரியில் எந்த ஆறு இலக்கங்களும் வேலை செய்யும்.', hi: 'नमूने में कोई भी छह अंक चलेंगे।' },
  lockPasscodeGo: { en: 'Unlock', ta: 'திற', hi: 'अनलॉक करें' },
  lockPasscodeErr: { en: 'Enter all six digits.', ta: 'ஆறு இலக்கங்களையும் உள்ளிடுங்கள்.', hi: 'सभी छह अंक डालें।' },
  lockSpecimen: { en: 'Specimen: no face or fingerprint is read. Unlocking is simulated on this phone.', ta: 'மாதிரி: முகமோ கைரேகையோ படிக்கப்படுவதில்லை. திறப்பது இந்தத் தொலைபேசியில் உருவகப்படுத்தப்படுகிறது.', hi: 'नमूना: कोई चेहरा या फ़िंगरप्रिंट नहीं पढ़ा जाता। अनलॉक इसी फ़ोन पर दिखावटी है।' },
  lockCrisis: { en: 'Need to talk to someone now? Tele-MANAS 14416, free, day and night.', ta: 'இப்போதே யாரிடமாவது பேச வேண்டுமா? Tele-MANAS 14416, இலவசம், இரவும் பகலும்.', hi: 'अभी किसी से बात करनी है? Tele-MANAS 14416, मुफ़्त, दिन-रात।' },

  // Jailbreak / root warning (Architecture p21: warn, not block)
  rootBanner: { en: 'This phone looks jailbroken or rooted. Joy OS still works; what it keeps here is less protected.', ta: 'இந்தத் தொலைபேசி jailbreak அல்லது root செய்யப்பட்டது போலத் தெரிகிறது. Joy OS வேலை செய்யும்; ஆனால் இங்கே வைத்திருப்பவை குறைவான பாதுகாப்பில் இருக்கும்.', hi: 'यह फ़ोन jailbreak या root किया हुआ लगता है। Joy OS चलता रहेगा; पर यहाँ रखी चीज़ें कम सुरक्षित हैं।' },
  rootWhat: { en: 'What this means', ta: 'இதன் பொருள் என்ன', hi: 'इसका मतलब क्या है' },
} satisfies Dict

export type KitKey = keyof typeof KIT

/** Non-hook lookup for plain functions (describeWheel, fmtDate callers). */
export function kit(lang: Lang, key: KitKey, vars?: Record<string, string | number>) {
  let s: string = KIT[key][lang] ?? KIT[key].en
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v))
  return s
}
