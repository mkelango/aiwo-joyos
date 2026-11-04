import { useDict, type Dict } from '@/lib/i18n'

// Member core lane, second dictionary: the Index card (Playbook p59), Correct right
// (append-only amendments), the re-measure chain (Day-76 invite → Clinical grade →
// sign-off → Day-90 card), the morning check-in, the Day-40 page and the Joyspan Letter.
// Same rules as _i18n.ts: English is the source; instrument items, people's own words
// (the coach's note, the Mentor's Letter, what the member types), names, brand lines and
// numbers stay as written.

export const XTRA = {
  // ─── The Index card ─────────────────────────────────────────────────────
  icFront: { en: 'Front of the card', ta: 'அட்டையின் முன்பக்கம்', hi: 'कार्ड का अगला हिस्सा' },
  icBack: { en: 'Back of the card', ta: 'அட்டையின் பின்பக்கம்', hi: 'कार्ड का पिछला हिस्सा' },
  icYourIndex: { en: 'Your Joyspan Index', ta: 'உங்கள் ஜாய்ஸ்பான் குறியீடு', hi: 'आपका जॉयस्पैन इंडेक्स' },
  icOf100: { en: 'of 100 · measured {date}', ta: '100 இல் · அளவிட்டது {date}', hi: '100 में से · मापा {date}' },
  icMethod: { en: 'Method {m}', ta: 'முறை {m}', hi: 'पद्धति {m}' },
  icNextStepH: { en: 'Your next step', ta: 'உங்கள் அடுத்த படி', hi: 'आपका अगला कदम' },
  icNextStepBody: { en: '{term} is your lowest term. {step}', ta: '{term} உங்கள் மிகக் குறைந்த அம்சம். {step}', hi: '{term} आपका सबसे कम पहलू है। {step}' },
  icNextMeasure: { en: 'Next measure {date}', ta: 'அடுத்த அளவீடு {date}', hi: 'अगला माप {date}' },
  icSignedBy: { en: 'Signed · {who}', ta: 'கையொப்பம் · {who}', hi: 'हस्ताक्षर · {who}' },
  icAwaitingSign: { en: 'Awaiting physician sign-off', ta: 'மருத்துவர் கையொப்பத்துக்குக் காத்திருக்கிறது', hi: 'डॉक्टर के हस्ताक्षर बाक़ी' },
  icSelfAssessed: { en: 'Index grade · self-assessed', ta: 'குறியீட்டு நிலை · சுய மதிப்பீடு', hi: 'इंडेक्स ग्रेड · स्व-मूल्यांकन' },
  icNoteClinical: {
    en: 'Clinical grade: your answers and signals with a blood panel and the capacity battery, reviewed and signed by {who} on {date}. Handed over in person, never mailed cold.',
    ta: 'மருத்துவ நிலை: உங்கள் பதில்கள், சிக்னல்கள், இரத்தப் பரிசோதனை, திறன் சோதனைகள் ஆகியவற்றை {who} {date} அன்று மதிப்பாய்வு செய்து கையொப்பமிட்டார். நேரில் வழங்கப்படும்; ஒருபோதும் வெறுமனே அஞ்சலில் அனுப்பப்படாது.',
    hi: 'क्लिनिकल ग्रेड: आपके जवाब और सिग्नल, ख़ून की जाँच और क्षमता परीक्षण के साथ, {who} ने {date} को समीक्षा करके हस्ताक्षर किए। यह हाथ में दिया जाता है, कभी यूँ ही डाक से नहीं भेजा जाता।',
  },
  icNoteIndex: {
    en: 'Index grade is self-assessed with wearable signals and needs no signature. A Clinical-grade card carries your physician’s signature.',
    ta: 'குறியீட்டு நிலை, அணியும் சாதனச் சிக்னல்களுடன் கூடிய சுய மதிப்பீடு; இதற்குக் கையொப்பம் தேவையில்லை. மருத்துவ நிலை அட்டையில் உங்கள் மருத்துவரின் கையொப்பம் இருக்கும்.',
    hi: 'इंडेक्स ग्रेड वियरेबल सिग्नल के साथ स्व-मूल्यांकन है और इस पर हस्ताक्षर की ज़रूरत नहीं। क्लिनिकल ग्रेड कार्ड पर आपके डॉक्टर के हस्ताक्षर होते हैं।',
  },
  icNoteAwaiting: {
    en: 'Clinical grade, awaiting physician sign-off. The numbers are provisional; the card is issued once it is signed.',
    ta: 'மருத்துவ நிலை, மருத்துவர் கையொப்பத்துக்குக் காத்திருக்கிறது. எண்கள் தற்காலிகமானவை; கையொப்பமான பிறகே அட்டை வழங்கப்படும்.',
    hi: 'क्लिनिकल ग्रेड, डॉक्टर के हस्ताक्षर बाक़ी। संख्याएँ अस्थायी हैं; हस्ताक्षर के बाद ही कार्ड जारी होता है।',
  },
  // One next step per term, one sentence (the card's field 08), for a result's lowest term.
  nsH: { en: 'Five sit-to-stands, timed, each morning for fourteen days.', ta: 'பதினான்கு நாட்களுக்கு, ஒவ்வொரு காலையும் ஐந்து முறை எழுந்து உட்காருவதை நேரம் பார்த்துச் செய்யுங்கள்.', hi: 'चौदह दिनों तक, हर सुबह पाँच बार उठना-बैठना, समय नापकर।' },
  nsP: { en: 'Each evening, answer the Tomorrow Question: what would make tomorrow worth waking for?', ta: 'ஒவ்வொரு மாலையும் நாளைய கேள்விக்குப் பதில் சொல்லுங்கள்: நாளை எழுந்திருக்கத் தகுந்ததாக எது ஆக்கும்?', hi: 'हर शाम कल के सवाल का जवाब दें: कल किस बात के लिए उठना सार्थक होगा?' },
  nsR: { en: 'Once a week, call one person you have not spoken to this month.', ta: 'வாரம் ஒருமுறை, இந்த மாதம் பேசாத ஒருவரை அழையுங்கள்.', hi: 'हफ़्ते में एक बार, किसी ऐसे व्यक्ति को फ़ोन करें जिनसे इस महीने बात नहीं हुई।' },
  nsF: { en: 'Write the No list: three things to stop this quarter.', ta: '‘வேண்டாம்’ பட்டியலை எழுதுங்கள்: இந்தக் காலாண்டில் நிறுத்த வேண்டிய மூன்று.', hi: '‘ना’ की सूची लिखें: इस तिमाही में बंद करने वाली तीन चीज़ें।' },
  nsD: { en: 'Ten minutes of savouring, once a day, for fourteen days.', ta: 'பதினான்கு நாட்களுக்கு, நாளுக்கு ஒருமுறை, பத்து நிமிடம் நிதானமாக ரசியுங்கள்.', hi: 'चौदह दिनों तक, दिन में एक बार, दस मिनट ठहरकर आनंद लें।' },
  nsB: { en: 'Begin the wind-down at 22:00: lights low, phone in the basket.', ta: '22:00 மணிக்கு ஓய்வுக்குத் தயாராகுங்கள்: விளக்குகள் மங்கலாக, ஃபோன் கூடையில்.', hi: '22:00 बजे दिन समेटना शुरू करें: रोशनी धीमी, फ़ोन टोकरी में।' },
  icCanGoDown: { en: 'The number can go down', ta: 'எண் குறையவும் கூடும்', hi: 'संख्या घट भी सकती है' },
  icCaption: { en: 'Front and back · 85.6 × 54 mm · specimen, not a real member', ta: 'முன், பின் · 85.6 × 54 மி.மீ · மாதிரி, உண்மையான உறுப்பினர் அல்ல', hi: 'आगे और पीछे · 85.6 × 54 मिमी · नमूना, असली सदस्य नहीं' },

  // ─── Printed for you (My Index) ──────────────────────────────────────────
  prTitle: { en: 'Printed for you', ta: 'உங்களுக்காக அச்சிடப்பட்டவை', hi: 'आपके लिए छपा हुआ' },
  prBody: {
    en: 'Three things arrive on paper: the Index card, the Day-40 page and the Joyspan Letter.',
    ta: 'மூன்று காகிதத்தில் வருகின்றன: குறியீட்டு அட்டை, நாள்-40 பக்கம், ஜாய்ஸ்பான் கடிதம்.',
    hi: 'तीन चीज़ें काग़ज़ पर आती हैं: इंडेक्स कार्ड, दिन-40 का पन्ना और जॉयस्पैन पत्र।',
  },

  // ─── Correct right: amendments after scoring ─────────────────────────────
  amCorrect: { en: 'Correct an answer', ta: 'ஒரு பதிலைத் திருத்தவும்', hi: 'एक जवाब सुधारें' },
  amTitle: { en: 'Correct an answer', ta: 'ஒரு பதிலைத் திருத்தவும்', hi: 'एक जवाब सुधारें' },
  amLead: {
    en: 'This result is scored, so nothing is overwritten. A correction is added to the record with the answer it replaces and why, and your Index is scored again from the corrected answers. The first score stays in the history.',
    ta: 'இந்த முடிவு மதிப்பிடப்பட்டுவிட்டது, எனவே எதுவும் அழித்து எழுதப்படாது. ஒரு திருத்தம், அது மாற்றும் பதிலுடனும் காரணத்துடனும் பதிவில் சேர்க்கப்படும்; திருத்திய பதில்களிலிருந்து உங்கள் குறியீடு மீண்டும் மதிப்பிடப்படும். முதல் மதிப்பெண் வரலாற்றில் அப்படியே இருக்கும்.',
    hi: 'यह परिणाम स्कोर हो चुका है, इसलिए कुछ भी मिटाकर नहीं लिखा जाता। सुधार रिकॉर्ड में जोड़ा जाता है, साथ में वह जवाब जो बदला और क्यों, और सुधरे जवाबों से आपका इंडेक्स दोबारा स्कोर होता है। पहला स्कोर इतिहास में बना रहता है।',
  },
  amBefore: {
    en: 'Before you submit, any answer can be changed freely on the review screen.',
    ta: 'சமர்ப்பிக்கும் முன், மதிப்பாய்வுத் திரையில் எந்தப் பதிலையும் சுதந்திரமாக மாற்றலாம்.',
    hi: 'जमा करने से पहले, समीक्षा स्क्रीन पर कोई भी जवाब आराम से बदला जा सकता है।',
  },
  amNoAnswers: {
    en: 'This result was kept before answers were stored with it, so it cannot be corrected here. Take the Index again; before you submit, every answer can be changed.',
    ta: 'இந்த முடிவு, பதில்கள் சேமிக்கப்படுவதற்கு முன் வைக்கப்பட்டது; எனவே இங்கே திருத்த முடியாது. குறியீட்டை மீண்டும் செய்யவும்; சமர்ப்பிக்கும் முன் எல்லாப் பதில்களையும் மாற்றலாம்.',
    hi: 'यह परिणाम जवाबों के साथ सहेजे जाने से पहले रखा गया था, इसलिए इसे यहाँ सुधारा नहीं जा सकता। इंडेक्स दोबारा दें; जमा करने से पहले हर जवाब बदला जा सकता है।',
  },
  amWhich: { en: 'Which answer', ta: 'எந்தப் பதில்', hi: 'कौन-सा जवाब' },
  amYour: { en: 'Your answer now:', ta: 'இப்போதைய உங்கள் பதில்:', hi: 'अभी आपका जवाब:' },
  amNew: { en: 'The corrected answer', ta: 'திருத்திய பதில்', hi: 'सुधरा हुआ जवाब' },
  amCurrent: { en: 'current', ta: 'தற்போதையது', hi: 'मौजूदा' },
  amWhy: { en: 'Why (optional)', ta: 'ஏன் (விருப்பத்தேர்வு)', hi: 'क्यों (वैकल्पिक)' },
  amWhyPh: { en: 'For example: I misread the question', ta: 'உதாரணம்: கேள்வியைத் தவறாகப் படித்தேன்', hi: 'जैसे: मैंने सवाल ग़लत पढ़ा' },
  amSame: { en: 'That is already your answer.', ta: 'அதுவே ஏற்கனவே உங்கள் பதில்.', hi: 'यही तो पहले से आपका जवाब है।' },
  amAppend: { en: 'Add the correction', ta: 'திருத்தத்தைச் சேர்க்கவும்', hi: 'सुधार जोड़ें' },
  amAdded: { en: 'Correction added. Your Index is now {v}.', ta: 'திருத்தம் சேர்க்கப்பட்டது. உங்கள் குறியீடு இப்போது {v}.', hi: 'सुधार जुड़ गया। आपका इंडेक्स अब {v} है।' },
  amHistory: { en: 'Amendment history', ta: 'திருத்த வரலாறு', hi: 'सुधार का इतिहास' },
  amAppendOnly: { en: 'Append-only', ta: 'சேர்க்க மட்டும்', hi: 'सिर्फ़ जोड़ना' },
  amScored: { en: 'First scored {v} on {date}. Kept as issued.', ta: '{date} அன்று முதலில் {v} என மதிப்பிடப்பட்டது. வழங்கியபடியே வைக்கப்பட்டுள்ளது.', hi: '{date} को पहला स्कोर {v}। जैसा जारी हुआ, वैसा ही रखा गया।' },
  amIndexMoved: { en: 'Index {a} → {b}', ta: 'குறியீடு {a} → {b}', hi: 'इंडेक्स {a} → {b}' },
  amNone: { en: 'No corrections yet.', ta: 'இதுவரை திருத்தங்கள் இல்லை.', hi: 'अभी तक कोई सुधार नहीं।' },
  amAmendedPill: { en: 'Amended', ta: 'திருத்தப்பட்டது', hi: 'सुधारा गया' },
  amAmendedOne: { en: '{n} correction since it was first scored at {v}.', ta: 'முதலில் {v} என மதிப்பிட்டதிலிருந்து {n} திருத்தம்.', hi: 'पहले स्कोर {v} के बाद से {n} सुधार।' },
  amAmendedMany: { en: '{n} corrections since it was first scored at {v}.', ta: 'முதலில் {v} என மதிப்பிட்டதிலிருந்து {n} திருத்தங்கள்.', hi: 'पहले स्कोर {v} के बाद से {n} सुधार।' },

  // ─── The re-measure chain (member side) ──────────────────────────────────
  rmUpcomingEyebrow: { en: 'Day 76 · re-measure · {date}', ta: 'நாள் 76 · மறு அளவீடு · {date}', hi: 'दिन 76 · दोबारा माप · {date}' },
  rmUpcomingBody: {
    en: 'Your re-measure opens on Day 76. The invite comes as one quiet note, never a countdown.',
    ta: 'உங்கள் மறு அளவீடு நாள் 76 அன்று திறக்கும். அழைப்பு ஒரு அமைதியான குறிப்பாக வரும்; ஒருபோதும் கவுண்ட்டவுனாக அல்ல.',
    hi: 'आपका दोबारा माप दिन 76 को खुलता है। न्योता एक शांत सूचना की तरह आता है, कभी उलटी गिनती की तरह नहीं।',
  },
  rmSpecimenClock: {
    en: 'Specimen: {name} is on Day {d}. Opening the invite moves this one flow to Day 76 ({date}); everything else stays on Day {d}.',
    ta: 'மாதிரி: {name} நாள் {d} இல் இருக்கிறார். அழைப்பைத் திறந்தால் இந்த ஒரு செயல்முறை மட்டும் நாள் 76 ({date}) க்குச் செல்லும்; மற்றவை எல்லாம் நாள் {d} இலேயே இருக்கும்.',
    hi: 'नमूना: {name} दिन {d} पर हैं। न्योता खोलने से सिर्फ़ यह एक प्रक्रिया दिन 76 ({date}) पर जाती है; बाक़ी सब दिन {d} पर ही रहता है।',
  },
  rmOpenInvite: { en: 'Open the Day-76 invite', ta: 'நாள்-76 அழைப்பைத் திறக்கவும்', hi: 'दिन-76 का न्योता खोलें' },
  rmInviteEyebrow: { en: 'Day 76 · your re-measure invite · {date}', ta: 'நாள் 76 · உங்கள் மறு அளவீட்டு அழைப்பு · {date}', hi: 'दिन 76 · आपके दोबारा माप का न्योता · {date}' },
  rmInviteTitle: { en: 'Time to *measure* again', ta: 'மீண்டும் *அளவிடும்* நேரம்', hi: 'फिर से *मापने* का समय' },
  rmInviteBody: {
    en: 'Open from {from} to {to}. Like for like with Day 0: the same two sittings, a home blood draw and a short capacity check. It is Clinical grade, so {who} reviews and signs it before it is final.',
    ta: '{from} முதல் {to} வரை திறந்திருக்கும். நாள் 0 உடன் அப்படியே ஒப்பீடு: அதே இரண்டு அமர்வுகள், வீட்டில் இரத்த மாதிரி, ஒரு சிறிய திறன் சோதனை. இது மருத்துவ நிலை; எனவே இறுதியாகும் முன் {who} மதிப்பாய்வு செய்து கையொப்பமிடுவார்.',
    hi: '{from} से {to} तक खुला है। दिन 0 से हूबहू तुलना: वही दो सत्र, घर पर ख़ून का नमूना और एक छोटी क्षमता जाँच। यह क्लिनिकल ग्रेड है, इसलिए अंतिम होने से पहले {who} इसकी समीक्षा करके हस्ताक्षर करती हैं।',
  },
  rmBegin: { en: 'Begin the re-measure', ta: 'மறு அளவீட்டைத் தொடங்கவும்', hi: 'दोबारा माप शुरू करें' },
  rmContinue: { en: 'Continue the re-measure', ta: 'மறு அளவீட்டைத் தொடரவும்', hi: 'दोबारा माप जारी रखें' },
  rmAwaitingEyebrow: { en: 'Re-measure · submitted · measured {date}', ta: 'மறு அளவீடு · சமர்ப்பிக்கப்பட்டது · அளவிட்டது {date}', hi: 'दोबारा माप · जमा · मापा {date}' },
  rmAwaitingBody: {
    en: 'Clinical grade, awaiting sign-off by {who}. Your numbers are provisional until she signs.',
    ta: 'மருத்துவ நிலை, {who} கையொப்பத்துக்குக் காத்திருக்கிறது. அவர் கையொப்பமிடும் வரை உங்கள் எண்கள் தற்காலிகமானவை.',
    hi: 'क्लिनिकल ग्रेड, {who} के हस्ताक्षर बाक़ी। उनके हस्ताक्षर तक आपकी संख्याएँ अस्थायी हैं।',
  },
  rmSignedEyebrow: { en: 'Re-measure · signed {date}', ta: 'மறு அளவீடு · கையொப்பமானது {date}', hi: 'दोबारा माप · हस्ताक्षरित {date}' },
  rmSignedBody: { en: 'Signed by {who}. Your Day-90 card is ready.', ta: '{who} கையொப்பமிட்டார். உங்கள் நாள்-90 அட்டை தயார்.', hi: '{who} ने हस्ताक्षर किए। आपका दिन-90 कार्ड तैयार है।' },
  rmReset: { en: 'Start the specimen again', ta: 'மாதிரியை மீண்டும் தொடங்கவும்', hi: 'नमूना फिर से शुरू करें' },
  rmResetAria: { en: 'Start the specimen re-measure flow again from before the invite', ta: 'மாதிரி மறு அளவீட்டை அழைப்புக்கு முந்தைய நிலையிலிருந்து மீண்டும் தொடங்கவும்', hi: 'नमूना दोबारा माप को न्योते से पहले की स्थिति से फिर शुरू करें' },

  // ─── Take the Index · Clinical grade ─────────────────────────────────────
  tkClGateTitle: { en: 'The Clinical-grade re-measure opens with your *invite*', ta: 'மருத்துவ நிலை மறு அளவீடு உங்கள் *அழைப்புடன்* திறக்கும்', hi: 'क्लिनिकल ग्रेड दोबारा माप आपके *न्योते* से खुलता है' },
  tkClGateBody: {
    en: 'It opens on Day 76. Open the invite from Today or My Index, and begin from there.',
    ta: 'இது நாள் 76 அன்று திறக்கும். இன்று அல்லது என் குறியீடு பக்கத்திலிருந்து அழைப்பைத் திறந்து, அங்கிருந்து தொடங்கவும்.',
    hi: 'यह दिन 76 को खुलता है। आज या मेरा इंडेक्स से न्योता खोलें और वहीं से शुरू करें।',
  },
  tkClGateToday: { en: 'Go to Today', ta: 'இன்று பக்கத்துக்குச் செல்லவும்', hi: 'आज पर जाएँ' },
  tkClDoneTitle: { en: 'Already *submitted*', ta: 'ஏற்கனவே *சமர்ப்பிக்கப்பட்டது*', hi: 'पहले ही *जमा* हो चुका' },
  tkClDoneBody: {
    en: 'Your Clinical-grade re-measure is with {who} for sign-off. The Day-90 result shows where it stands.',
    ta: 'உங்கள் மருத்துவ நிலை மறு அளவீடு கையொப்பத்துக்காக {who} இடம் உள்ளது. அது எந்த நிலையில் உள்ளது என்பதை நாள்-90 முடிவு காட்டும்.',
    hi: 'आपका क्लिनिकल ग्रेड दोबारा माप हस्ताक्षर के लिए {who} के पास है। दिन-90 का परिणाम बताता है कि वह कहाँ तक पहुँचा।',
  },
  ovClinicalAdds: {
    en: 'Clinical grade adds a home blood panel and a short capacity check, and {who} signs the result before it is final.',
    ta: 'மருத்துவ நிலையில் வீட்டில் இரத்தப் பரிசோதனையும் ஒரு சிறிய திறன் சோதனையும் சேரும்; முடிவு இறுதியாகும் முன் {who} கையொப்பமிடுவார்.',
    hi: 'क्लिनिकल ग्रेड में घर पर ख़ून की जाँच और एक छोटी क्षमता जाँच जुड़ती है, और अंतिम होने से पहले {who} परिणाम पर हस्ताक्षर करती हैं।',
  },
  clChip: { en: 'Home draw · capacity', ta: 'வீட்டில் இரத்த மாதிரி · திறன்', hi: 'घर पर नमूना · क्षमता' },
  clEyebrow: { en: 'Clinical grade · in person', ta: 'மருத்துவ நிலை · நேரில்', hi: 'क्लिनिकल ग्रेड · आमने-सामने' },
  clEyebrowShort: { en: 'in person', ta: 'நேரில்', hi: 'आमने-सामने' },
  clTitle: { en: 'Two things a *person* does', ta: 'ஒரு *மனிதர்* செய்யும் இரண்டு', hi: 'दो काम जो एक *इंसान* करता है' },
  clBody: {
    en: 'A Clinical-grade measure adds what a questionnaire cannot. Both are booked here; the results go only to your care team.',
    ta: 'கேள்வித்தாளால் முடியாததை மருத்துவ நிலை அளவீடு சேர்க்கிறது. இரண்டும் இங்கேயே பதிவு செய்யப்படும்; முடிவுகள் உங்கள் கவனிப்புக் குழுவுக்கு மட்டுமே செல்லும்.',
    hi: 'क्लिनिकल ग्रेड माप वह जोड़ता है जो प्रश्नावली नहीं कर सकती। दोनों यहीं बुक होते हैं; नतीजे सिर्फ़ आपकी देखभाल टीम के पास जाते हैं।',
  },
  clDraw: { en: 'Home blood panel', ta: 'வீட்டில் இரத்தப் பரிசோதனை', hi: 'घर पर ख़ून की जाँच' },
  clDrawBody: {
    en: 'A phlebotomist from the lab partner comes to you. Fast from 22:00 the night before; water is fine.',
    ta: 'ஆய்வக கூட்டாளியிடமிருந்து ஒரு இரத்த மாதிரி எடுப்பவர் உங்களிடம் வருவார். முந்தைய இரவு 22:00 முதல் உண்ணாமல் இருக்கவும்; தண்ணீர் பரவாயில்லை.',
    hi: 'लैब पार्टनर से नमूना लेने वाले आपके पास आते हैं। पिछली रात 22:00 से कुछ न खाएँ; पानी ठीक है।',
  },
  clAtHome: { en: 'at home', ta: 'வீட்டில்', hi: 'घर पर' },
  clCapacity: { en: 'Capacity battery', ta: 'திறன் சோதனைகள்', hi: 'क्षमता परीक्षण' },
  clCapacityBody: {
    en: 'Time five sit-to-stands from a dining chair, arms crossed. Grip strength is measured by the nurse at the draw.',
    ta: 'சாப்பாட்டு நாற்காலியிலிருந்து, கைகளைக் குறுக்காக வைத்து, ஐந்து முறை எழுந்து உட்காருவதை நேரம் பார்க்கவும். பிடி வலிமையை இரத்த மாதிரி எடுக்கும்போது செவிலியர் அளப்பார்.',
    hi: 'खाने की कुर्सी से, हाथ बाँधकर, पाँच बार उठने-बैठने का समय नापें। पकड़ की ताक़त नमूना लेते समय नर्स नापेंगी।',
  },
  clSeconds: { en: 'Seconds for five sit-to-stands', ta: 'ஐந்து முறை எழுந்து உட்கார ஆன வினாடிகள்', hi: 'पाँच बार उठने-बैठने में लगे सेकंड' },
  clSecondsHint: { en: 'Between 4 and 60 seconds.', ta: '4 முதல் 60 வினாடிகளுக்குள்.', hi: '4 से 60 सेकंड के बीच।' },
  clSecondsShort: { en: 'five sit-to-stands {s} s', ta: 'ஐந்து எழுந்து-உட்காருதல் {s} வி', hi: 'पाँच बार उठना-बैठना {s} से' },
  clNoSlot: { en: 'no draw time chosen', ta: 'இரத்த மாதிரி நேரம் தேர்ந்தெடுக்கப்படவில்லை', hi: 'नमूने का समय नहीं चुना' },
  clNoSeconds: { en: 'no time entered', ta: 'நேரம் உள்ளிடப்படவில்லை', hi: 'समय नहीं भरा' },
  clEditAria: { en: 'Change the home draw or the capacity check', ta: 'வீட்டு இரத்த மாதிரி அல்லது திறன் சோதனையை மாற்றவும்', hi: 'घर पर नमूना या क्षमता जाँच बदलें' },
  clConsent: {
    en: 'I understand {who} reviews and signs this result, and that it is provisional until she does.',
    ta: 'இந்த முடிவை {who} மதிப்பாய்வு செய்து கையொப்பமிடுவார் என்பதும், அதுவரை இது தற்காலிகமானது என்பதும் எனக்குப் புரிகிறது.',
    hi: 'मैं समझता/समझती हूँ कि {who} इस परिणाम की समीक्षा करके हस्ताक्षर करेंगी, और तब तक यह अस्थायी है।',
  },
  clNeedAll: { en: 'Choose a draw time, enter your time and confirm to continue.', ta: 'தொடர, இரத்த மாதிரி நேரத்தைத் தேர்ந்தெடுத்து, உங்கள் நேரத்தை உள்ளிட்டு, உறுதிசெய்யவும்.', hi: 'आगे बढ़ने के लिए नमूने का समय चुनें, अपना समय भरें और पुष्टि करें।' },
  clContinue: { en: 'Continue to review', ta: 'மதிப்பாய்வுக்குத் தொடரவும்', hi: 'समीक्षा पर चलें' },
  rvSubmitClinical: { en: 'Submit for physician sign-off', ta: 'மருத்துவர் கையொப்பத்துக்குச் சமர்ப்பிக்கவும்', hi: 'डॉक्टर के हस्ताक्षर के लिए जमा करें' },
  scAwaiting: {
    en: 'Clinical grade · awaiting sign-off by {who}. These numbers are provisional until she signs.',
    ta: 'மருத்துவ நிலை · {who} கையொப்பத்துக்குக் காத்திருக்கிறது. அவர் கையொப்பமிடும் வரை இந்த எண்கள் தற்காலிகமானவை.',
    hi: 'क्लिनिकल ग्रेड · {who} के हस्ताक्षर बाक़ी। उनके हस्ताक्षर तक ये संख्याएँ अस्थायी हैं।',
  },

  // ─── Day 90 driven by the re-measure ─────────────────────────────────────
  d9OwnLine: { en: 'Your re-measure · Clinical grade · measured {date}.', ta: 'உங்கள் மறு அளவீடு · மருத்துவ நிலை · அளவிட்டது {date}.', hi: 'आपका दोबारा माप · क्लिनिकल ग्रेड · मापा {date}।' },
  d9OwnUp: { en: 'Your Index rose from {a} to {b}. {term} moved the most.', ta: 'உங்கள் குறியீடு {a} இலிருந்து {b} ஆக உயர்ந்தது. {term} அதிகம் மாறியது.', hi: 'आपका इंडेक्स {a} से बढ़कर {b} हुआ। {term} सबसे ज़्यादा बदला।' },
  d9OwnDown: { en: 'Your Index moved from {a} to {b}. {term} moved the most. That is useful to know.', ta: 'உங்கள் குறியீடு {a} இலிருந்து {b} ஆக மாறியது. {term} அதிகம் மாறியது. இது தெரிந்துகொள்ள உதவும் தகவல்.', hi: 'आपका इंडेक्स {a} से {b} पर आया। {term} सबसे ज़्यादा बदला। यह जानना काम का है।' },
  d9OwnSame: { en: 'Your Index held at {a}. {term} moved the most.', ta: 'உங்கள் குறியீடு {a} இலேயே இருந்தது. {term} அதிகம் மாறியது.', hi: 'आपका इंडेक्स {a} पर टिका रहा। {term} सबसे ज़्यादा बदला।' },
  d9ChainHint: { en: 'Your own re-measure starts from the Day-76 invite on', ta: 'உங்கள் சொந்த மறு அளவீடு நாள்-76 அழைப்பிலிருந்து தொடங்குகிறது:', hi: 'आपका अपना दोबारा माप दिन-76 के न्योते से शुरू होता है:' },
  d9ChainLink: { en: 'Today', ta: 'இன்று', hi: 'आज' },
  d9SpecimenSign: {
    en: 'Specimen: {who} signs this from the clinical portal, where your re-measure is now in her sign-off queue.',
    ta: 'மாதிரி: {who} இதை மருத்துவப் போர்ட்டலில் கையொப்பமிடுவார்; உங்கள் மறு அளவீடு இப்போது அவரது கையொப்ப வரிசையில் உள்ளது.',
    hi: 'नमूना: {who} इस पर क्लिनिकल पोर्टल से हस्ताक्षर करती हैं, जहाँ आपका दोबारा माप अब उनकी हस्ताक्षर सूची में है।',
  },
  d9OpenPortal: { en: 'Open the clinical portal', ta: 'மருத்துவப் போர்ட்டலைத் திறக்கவும்', hi: 'क्लिनिकल पोर्टल खोलें' },
  d9CardTitle: { en: 'Your Day-90 card', ta: 'உங்கள் நாள்-90 அட்டை', hi: 'आपका दिन-90 कार्ड' },
  d9CardPending: {
    en: 'The card is issued once {who} signs, and handed over in person.',
    ta: '{who} கையொப்பமிட்ட பிறகு அட்டை வழங்கப்படும்; நேரில் கொடுக்கப்படும்.',
    hi: '{who} के हस्ताक्षर के बाद कार्ड जारी होता है, और हाथ में दिया जाता है।',
  },
  d9GsSignedBy: { en: ' Clinical grade · signed by {who} · {date}', ta: ' மருத்துவ நிலை · {who} கையொப்பமிட்டார் · {date}', hi: ' क्लिनिकल ग्रेड · {who} के हस्ताक्षर · {date}' },
  d9SdSignedBy: {
    en: 'Reviewed and signed by {who} on {date}. Panels and capacity battery like for like.',
    ta: '{date} அன்று {who} மதிப்பாய்வு செய்து கையொப்பமிட்டார். பரிசோதனைகளும் திறன் சோதனைகளும் அப்படியே ஒப்பிடப்பட்டன.',
    hi: '{date} को {who} ने समीक्षा करके हस्ताक्षर किए। जाँचें और क्षमता परीक्षण हूबहू तुलना में।',
  },
  d9GmRose: {
    en: 'The geometric mean moved from {a} to {b}, most through {term}; Burden changed the Index by {c}.',
    ta: 'பெருக்கல் சராசரி {a} இலிருந்து {b} ஆக மாறியது, பெரும்பாலும் {term} வழியாக; சுமை குறியீட்டை {c} மாற்றியது.',
    hi: 'ज्यामितीय औसत {a} से {b} हुआ, ज़्यादातर {term} के ज़रिए; बोझ ने इंडेक्स को {c} बदला।',
  },

  // ─── Today · the morning check-in, the Day-40 page ───────────────────────
  mcEyebrow: { en: 'Morning check-in', ta: 'காலை நலம் விசாரிப்பு', hi: 'सुबह का हालचाल' },
  mcAsk: { en: 'How did you wake?', ta: 'எப்படி விழித்தீர்கள்?', hi: 'आज कैसे उठे?' },
  mcRested: { en: 'Rested', ta: 'ஓய்வாக', hi: 'तरोताज़ा' },
  mcFine: { en: 'Fine', ta: 'பரவாயில்லை', hi: 'ठीक-ठाक' },
  mcTired: { en: 'Tired', ta: 'சோர்வாக', hi: 'थका हुआ' },
  mcThanks: { en: 'Noted: {a}. It sits beside your ring’s sleep reading.', ta: 'குறித்துக்கொண்டோம்: {a}. இது உங்கள் மோதிரத்தின் தூக்க அளவீட்டுடன் இருக்கும்.', hi: 'दर्ज किया: {a}। यह आपकी रिंग की नींद की रीडिंग के साथ रहेगा।' },
  tdDay40: { en: 'Your Day-40 page · arrives {date}', ta: 'உங்கள் நாள்-40 பக்கம் · {date} அன்று வரும்', hi: 'आपका दिन-40 का पन्ना · {date} को आएगा' },

  // ─── The Day-40 page ─────────────────────────────────────────────────────
  d4Kicker: { en: 'Printed · the middle of the ninety days', ta: 'அச்சு · தொண்ணூறு நாட்களின் நடுப்பகுதி', hi: 'छपा हुआ · नब्बे दिनों का बीच' },
  d4PageTitle: { en: 'The Day-40 *page*', ta: 'நாள்-40 *பக்கம்*', hi: 'दिन-40 का *पन्ना*' },
  d4PageLead: {
    en: 'One page, on paper, at the halfway mark. It arrives with the circle’s note and is kept here to read again.',
    ta: 'பாதி வழியில், காகிதத்தில் ஒரு பக்கம். வட்டத்தின் குறிப்புடன் வரும்; மீண்டும் படிக்க இங்கே வைக்கப்படும்.',
    hi: 'आधे रास्ते पर, काग़ज़ पर एक पन्ना। यह सर्कल के नोट के साथ आता है और दोबारा पढ़ने के लिए यहाँ रखा जाता है।',
  },
  d4Print: { en: 'Print this page', ta: 'இந்தப் பக்கத்தை அச்சிடவும்', hi: 'यह पन्ना प्रिंट करें' },
  d4Arrives: {
    en: 'Arrives on Day 40, {date}. You are on Day {d}, so this specimen is drafted from the days so far.',
    ta: 'நாள் 40, {date} அன்று வரும். நீங்கள் நாள் {d} இல் இருப்பதால், இந்த மாதிரி இதுவரையான நாட்களிலிருந்து வரையப்பட்டது.',
    hi: 'दिन 40, {date} को आता है। आप दिन {d} पर हैं, इसलिए यह नमूना अब तक के दिनों से तैयार किया गया है।',
  },
  d4Aria: { en: 'The Day-40 page', ta: 'நாள்-40 பக்கம்', hi: 'दिन-40 का पन्ना' },
  d4Eyebrow: { en: 'The Day-40 page · Day {n} of 90', ta: 'நாள்-40 பக்கம் · 90 இல் நாள் {n}', hi: 'दिन-40 का पन्ना · 90 में से दिन {n}' },
  d4Title: { en: 'Halfway, and *what is moving*', ta: 'பாதி வழி, *எது நகர்கிறது*', hi: 'आधा रास्ता, और *क्या बदल रहा है*' },
  d4Lead: {
    en: 'Where you started, what you have done and the one step for the next fifty days. There is no new number today: the Index is measured on Day 0 and Day 90, and the middle is for living.',
    ta: 'நீங்கள் எங்கே தொடங்கினீர்கள், என்ன செய்தீர்கள், அடுத்த ஐம்பது நாட்களுக்கான ஒரு படி. இன்று புதிய எண் இல்லை: குறியீடு நாள் 0, நாள் 90 அன்று அளவிடப்படுகிறது; நடுப்பகுதி வாழ்வதற்கானது.',
    hi: 'आपने कहाँ से शुरू किया, क्या किया, और अगले पचास दिनों का एक कदम। आज कोई नई संख्या नहीं: इंडेक्स दिन 0 और दिन 90 को मापा जाता है, बीच का समय जीने के लिए है।',
  },
  d4Start: { en: 'Where you started', ta: 'நீங்கள் தொடங்கிய இடம்', hi: 'आपने कहाँ से शुरू किया' },
  d4StartBody: { en: 'Measured {date}: Index {v}, Clinical grade, signed by {who}.', ta: '{date} அன்று அளவிட்டது: குறியீடு {v}, மருத்துவ நிலை, {who} கையொப்பமிட்டது.', hi: '{date} को मापा: इंडेक्स {v}, क्लिनिकल ग्रेड, {who} के हस्ताक्षर।' },
  d4Lowest: { en: 'Lowest term: {term}, {v}.', ta: 'மிகக் குறைந்த அம்சம்: {term}, {v}.', hi: 'सबसे कम पहलू: {term}, {v}।' },
  d4Done: { en: 'What you have done', ta: 'நீங்கள் செய்தவை', hi: 'आपने क्या किया' },
  d4ActionDays: { en: 'days with the one action done', ta: 'ஒரே செயலைச் செய்த நாட்கள்', hi: 'दिन जब एक काम किया' },
  d4Moments: { en: 'Joy Ledger moments kept', ta: 'பதிவுசெய்த ஜாய் லெட்ஜர் தருணங்கள்', hi: 'जॉय लेजर में रखे पल' },
  d4Calls: { en: 'circle calls joined', ta: 'கலந்துகொண்ட வட்ட அழைப்புகள்', hi: 'सर्कल कॉल में शामिल' },
  d4Practice: { en: 'the Practice week you are in', ta: 'நீங்கள் இருக்கும் பயிற்சி வாரம்', hi: 'अभ्यास का वह हफ़्ता जिसमें आप हैं' },
  d4Action: { en: 'The one action: {title}', ta: 'ஒரே செயல்: {title}', hi: 'एक काम: {title}' },
  d4JoyFrom: { en: 'Joy came most from {list}.', ta: 'மகிழ்ச்சி அதிகம் வந்தது: {list}.', hi: 'सबसे ज़्यादा ख़ुशी इनसे आई: {list}।' },
  d4NoStreak: {
    en: 'Counts, not streaks: a day missed is not a chain broken.',
    ta: 'எண்ணிக்கைகள், தொடர்ச்சிகள் அல்ல: ஒரு நாள் தவறினால் சங்கிலி உடைவதில்லை.',
    hi: 'गिनती, सिलसिला नहीं: एक दिन छूटने से कोई कड़ी नहीं टूटती।',
  },
  d4Signals: { en: 'What your signals say', ta: 'உங்கள் சிக்னல்கள் சொல்வது', hi: 'आपके सिग्नल क्या कहते हैं' },
  d4Sig1: { en: 'Sleep regularity has been steadier since week two.', ta: 'இரண்டாம் வாரத்திலிருந்து தூக்க ஒழுங்கு நிலையாக உள்ளது.', hi: 'दूसरे हफ़्ते से नींद की नियमितता ज़्यादा स्थिर है।' },
  d4Sig2: { en: 'Evenings are still booked four nights in seven; Freedom is the term to watch.', ta: 'ஏழில் நான்கு மாலைகள் இன்னும் நிரம்பியுள்ளன; கவனிக்க வேண்டிய அம்சம் சுதந்திரம்.', hi: 'सात में से चार शामें अब भी बुक हैं; स्वतंत्रता वह पहलू है जिस पर नज़र रखनी है।' },
  d4Sig3: { en: 'Resting heart rate and HRV are within your usual range.', ta: 'ஓய்வு இதயத் துடிப்பும் HRV-யும் உங்கள் வழக்கமான வரம்பிற்குள் உள்ளன.', hi: 'आराम की धड़कन और HRV आपकी सामान्य सीमा में हैं।' },
  d4Coach: { en: 'A note from {coach}', ta: '{coach} இடமிருந்து ஒரு குறிப்பு', hi: '{coach} का एक नोट' },
  d4CoachRole: { en: 'your coach, in her own words', ta: 'உங்கள் பயிற்சியாளர், அவருடைய சொந்த வார்த்தைகளில்', hi: 'आपकी कोच, उनके अपने शब्दों में' },
  d4Next: { en: 'For the next fifty days', ta: 'அடுத்த ஐம்பது நாட்களுக்கு', hi: 'अगले पचास दिनों के लिए' },
  d4NextBody: {
    en: 'Keep the one action for {term}, and hold one evening a week with nothing booked.',
    ta: '{term} அம்சத்துக்கான ஒரே செயலைத் தொடருங்கள்; வாரத்தில் ஒரு மாலையை எதுவும் திட்டமிடாமல் வைத்திருங்கள்.',
    hi: '{term} के लिए एक काम जारी रखें, और हफ़्ते में एक शाम बिना किसी बुकिंग के रखें।',
  },
  d4Dates: { en: 'Re-measure opens {a} · Day 90 {b}', ta: 'மறு அளவீடு திறப்பு {a} · நாள் 90 {b}', hi: 'दोबारा माप खुलेगा {a} · दिन 90 {b}' },
  d4ToLetter: { en: 'The Joyspan Letter', ta: 'ஜாய்ஸ்பான் கடிதம்', hi: 'जॉयस्पैन पत्र' },

  // ─── The Joyspan Letter ──────────────────────────────────────────────────
  ltEyebrow: { en: 'The Joyspan Letter', ta: 'ஜாய்ஸ்பான் கடிதம்', hi: 'जॉयस्पैन पत्र' },
  ltTitle: { en: 'Monthly, in the *Mentor’s* voice', ta: 'மாதந்தோறும், *வழிகாட்டியின்* குரலில்', hi: 'हर महीने, *मार्गदर्शक* की आवाज़ में' },
  ltLead: {
    en: 'Written by C. Sivasankaran, Mentor, AIWO Limited, with real numbers, his own included, up and down. It arrives by email and on paper; every issue is kept here.',
    ta: 'AIWO Limited வழிகாட்டி C. Sivasankaran எழுதுவது; உண்மையான எண்களுடன், அவருடையதும் சேர்த்து, ஏற்றமும் இறக்கமும். மின்னஞ்சலிலும் காகிதத்திலும் வரும்; ஒவ்வொரு இதழும் இங்கே வைக்கப்படும்.',
    hi: 'AIWO Limited के मार्गदर्शक C. Sivasankaran लिखते हैं, असली संख्याओं के साथ, अपनी भी, ऊपर और नीचे। यह ईमेल और काग़ज़ पर आता है; हर अंक यहाँ रखा जाता है।',
  },
  ltEnglishNote: {
    en: '',
    ta: 'வழிகாட்டி ஆங்கிலத்தில் எழுதுகிறார். அவருடைய வார்த்தைகள் இயந்திர மொழிபெயர்ப்பு செய்யப்படுவதில்லை; மனிதர்கள் மொழிபெயர்த்த தமிழ்ப் பதிப்பு பின்னர் வரும்.',
    hi: 'मार्गदर्शक अंग्रेज़ी में लिखते हैं। उनके शब्दों का मशीनी अनुवाद नहीं होता; लोगों द्वारा अनुवादित हिन्दी संस्करण बाद में आता है।',
  },
  ltIssues: { en: 'Issues', ta: 'இதழ்கள்', hi: 'अंक' },
  ltNo: { en: 'Letter No. {n}', ta: 'கடிதம் எண் {n}', hi: 'पत्र संख्या {n}' },
  ltNew: { en: 'New', ta: 'புதியது', hi: 'नया' },
  ltHow: { en: 'How it arrives', ta: 'எப்படி வருகிறது', hi: 'कैसे आता है' },
  ltHowBody: {
    en: 'Once a month, by email and on paper, in a cotton envelope. Never more often, and switched off in one tap.',
    ta: 'மாதம் ஒருமுறை, மின்னஞ்சலிலும், பருத்தி உறையில் காகிதத்திலும். அதற்கு மேல் ஒருபோதும் இல்லை; ஒரே தட்டலில் நிறுத்தலாம்.',
    hi: 'महीने में एक बार, ईमेल पर और सूती लिफ़ाफ़े में काग़ज़ पर। इससे ज़्यादा कभी नहीं, और एक टैप में बंद।',
  },
  ltSettings: { en: 'Change it in Settings', ta: 'அமைப்புகளில் மாற்றவும்', hi: 'सेटिंग्स में बदलें' },
  ltMentorRole: { en: 'Mentor, AIWO Limited · creator of Joyspiration', ta: 'வழிகாட்டி, AIWO Limited · Joyspiration-ஐ உருவாக்கியவர்', hi: 'मार्गदर्शक, AIWO Limited · Joyspiration के रचयिता' },
  ltPrint: { en: 'Print this issue', ta: 'இந்த இதழை அச்சிடவும்', hi: 'यह अंक प्रिंट करें' },
  ltListen: { en: 'Listen to this issue', ta: 'இந்த இதழைக் கேளுங்கள்', hi: 'यह अंक सुनें' },
  ltListenEyebrow: { en: 'Letter No. {n} · the Mentor’s voice', ta: 'கடிதம் எண் {n} · வழிகாட்டியின் குரல்', hi: 'पत्र संख्या {n} · मार्गदर्शक की आवाज़' },
  ltListenBy: { en: 'C. Sivasankaran, Mentor, AIWO Limited · English', ta: 'C. Sivasankaran, வழிகாட்டி, AIWO Limited · ஆங்கிலம்', hi: 'C. Sivasankaran, मार्गदर्शक, AIWO Limited · अंग्रेज़ी' },
  ltListenNote: {
    en: 'Specimen: this player makes no sound and no recording exists yet. In Joy OS the Mentor records each issue in his own voice, with his written consent.',
    ta: 'மாதிரி: இந்த இயக்கியில் ஒலி வராது, பதிவும் இன்னும் இல்லை. Joy OS-இல் வழிகாட்டி ஒவ்வொரு இதழையும் தன் சொந்தக் குரலில், தன் எழுத்துப்பூர்வ ஒப்புதலுடன் பதிவு செய்கிறார்.',
    hi: 'नमूना: इस प्लेयर में कोई आवाज़ नहीं आती और अभी कोई रिकॉर्डिंग नहीं है। Joy OS में मार्गदर्शक हर अंक अपनी आवाज़ में, अपनी लिखित सहमति से रिकॉर्ड करते हैं।',
  },
  ltWriteBack: { en: 'Write back', ta: 'பதில் எழுதுங்கள்', hi: 'जवाब लिखें' },
  ltWriteBackHint: {
    en: 'Your reply goes to the Letter desk. The Mentor reads a selection; nothing you write is published without your consent.',
    ta: 'உங்கள் பதில் கடித மேசைக்குச் செல்லும். வழிகாட்டி சிலவற்றைப் படிப்பார்; உங்கள் ஒப்புதல் இல்லாமல் நீங்கள் எழுதியது எதுவும் வெளியிடப்படாது.',
    hi: 'आपका जवाब पत्र डेस्क पर जाता है। मार्गदर्शक कुछ चुने हुए जवाब पढ़ते हैं; आपकी सहमति के बिना आपका लिखा कुछ भी प्रकाशित नहीं होता।',
  },
  ltPlaceholder: { en: 'The one thing I am changing before my next measure…', ta: 'என் அடுத்த அளவீட்டுக்கு முன் நான் மாற்றும் ஒன்று…', hi: 'अगले माप से पहले जो एक चीज़ मैं बदल रहा/रही हूँ…' },
  ltSend: { en: 'Send to the Letter desk', ta: 'கடித மேசைக்கு அனுப்பவும்', hi: 'पत्र डेस्क को भेजें' },
  ltSent: { en: 'Sent {date}. Specimen: kept in this browser only.', ta: '{date} அன்று அனுப்பப்பட்டது. மாதிரி: இந்த உலாவியில் மட்டுமே வைக்கப்பட்டுள்ளது.', hi: '{date} को भेजा गया। नमूना: सिर्फ़ इसी ब्राउज़र में रखा गया।' },
  ltYours: { en: 'Your replies to this issue', ta: 'இந்த இதழுக்கான உங்கள் பதில்கள்', hi: 'इस अंक पर आपके जवाब' },

  // ─── Not yet measured: a term skipped for now (Take the Index) ───────────
  skSkip: { en: 'Skip {term} for now', ta: '{term} அம்சத்தை இப்போதைக்குத் தவிர்க்கவும்', hi: '{term} को अभी के लिए छोड़ें' },
  skSkipNote: {
    en: 'A skipped term shows as not yet measured. Nothing is guessed, and your Index waits until every term is measured.',
    ta: 'தவிர்த்த அம்சம் “இன்னும் அளவிடப்படவில்லை” எனக் காட்டப்படும். எதுவும் ஊகிக்கப்படாது; எல்லா அம்சங்களும் அளவிடப்படும் வரை உங்கள் குறியீடு காத்திருக்கும்.',
    hi: 'छोड़ा गया पहलू “अभी मापा नहीं गया” दिखता है। कुछ भी अनुमान से नहीं भरा जाता, और हर पहलू मापे जाने तक आपका इंडेक्स रुका रहता है।',
  },
  skSkipped: { en: 'Skipped for now · not yet measured', ta: 'இப்போதைக்குத் தவிர்க்கப்பட்டது · இன்னும் அளவிடப்படவில்லை', hi: 'अभी के लिए छोड़ा · अभी मापा नहीं गया' },
  skAnswer: { en: 'Answer these', ta: 'இவற்றுக்குப் பதில் சொல்லவும்', hi: 'इनके जवाब दें' },
  skAnswerAria: { en: 'Answer the {term} items', ta: '{term} கேள்விகளுக்குப் பதில் சொல்லவும்', hi: '{term} के सवालों के जवाब दें' },
  skReviewNote: {
    en: '{terms}: skipped for now. It will show as not yet measured, and the Index is withheld until it is measured.',
    ta: '{terms}: இப்போதைக்குத் தவிர்க்கப்பட்டது. அது “இன்னும் அளவிடப்படவில்லை” எனக் காட்டப்படும்; அது அளவிடப்படும் வரை குறியீடு நிறுத்திவைக்கப்படும்.',
    hi: '{terms}: अभी के लिए छोड़ा गया। यह “अभी मापा नहीं गया” दिखेगा, और इसके मापे जाने तक इंडेक्स रोका रहेगा।',
  },
  skJoin: { en: ', ', ta: ', ', hi: ', ' },
  skNoIndex: { en: 'No Index yet', ta: 'இன்னும் குறியீடு இல்லை', hi: 'अभी कोई इंडेक्स नहीं' },
  skStage3: { en: 'Index withheld: {terms} not yet measured', ta: 'குறியீடு நிறுத்திவைப்பு: {terms} இன்னும் அளவிடப்படவில்லை', hi: 'इंडेक्स रोका गया: {terms} अभी मापा नहीं गया' },
  skScoringLine: {
    en: '{terms} not yet measured, so the Index is withheld until it is. Nothing is guessed.',
    ta: '{terms} இன்னும் அளவிடப்படவில்லை; அது அளவிடப்படும் வரை குறியீடு நிறுத்திவைக்கப்படும். எதுவும் ஊகிக்கப்படாது.',
    hi: '{terms} अभी मापा नहीं गया, इसलिए उसके मापे जाने तक इंडेक्स रोका गया है। कुछ भी अनुमान से नहीं भरा जाता।',
  },
  skMeasureNow: { en: 'Measure {term} now', ta: '{term} அம்சத்தை இப்போது அளவிடவும்', hi: '{term} अभी मापें' },
  amNotAnswered: { en: 'not answered', ta: 'பதில் இல்லை', hi: 'जवाब नहीं दिया' },
  amLater: { en: 'Answered later: the term was skipped at the sitting.', ta: 'பின்னர் பதிலளிக்கப்பட்டது: அமர்வின்போது இந்த அம்சம் தவிர்க்கப்பட்டது.', hi: 'बाद में जवाब दिया: बैठक में यह पहलू छोड़ा गया था।' },
  amHeld: {
    en: 'Nothing was added. What you wrote sounds heavy, so support is open now. You can come back to the correction any time.',
    ta: 'எதுவும் சேர்க்கப்படவில்லை. நீங்கள் எழுதியது கனமாகத் தெரிகிறது; எனவே உதவி இப்போது திறந்துள்ளது. எப்போது வேண்டுமானாலும் திருத்தத்துக்குத் திரும்பலாம்.',
    hi: 'कुछ नहीं जोड़ा गया। आपने जो लिखा वह भारी लगता है, इसलिए मदद अभी खुली है। सुधार पर आप कभी भी लौट सकते हैं।',
  },
  amTalkNow: { en: 'Talk to someone now', ta: 'இப்போதே ஒருவரிடம் பேசுங்கள்', hi: 'अभी किसी से बात करें' },
  tmEyebrow: { en: 'Measure {term} · your sitting of {date}', ta: '{term} அளவீடு · {date} அன்றைய உங்கள் அமர்வு', hi: '{term} मापें · {date} की आपकी बैठक' },
  tmTitle: { en: 'Answer the items you *skipped*.', ta: 'நீங்கள் *தவிர்த்த* கேள்விகளுக்குப் பதில் சொல்லுங்கள்.', hi: 'जो सवाल आपने *छोड़े* थे, उनके जवाब दें।' },
  tmBody: {
    en: 'Your other answers stay as they were scored. These are added to the record as answered later, and your Index is scored again.',
    ta: 'உங்கள் மற்ற பதில்கள் மதிப்பிட்டபடியே இருக்கும். இவை “பின்னர் பதிலளித்தவை” எனப் பதிவில் சேர்க்கப்படும்; உங்கள் குறியீடு மீண்டும் மதிப்பிடப்படும்.',
    hi: 'आपके बाक़ी जवाब वैसे ही रहते हैं जैसे स्कोर हुए थे। ये रिकॉर्ड में “बाद में दिए गए” जवाबों के रूप में जुड़ते हैं, और आपका इंडेक्स दोबारा स्कोर होता है।',
  },
  tmBegin: { en: 'Begin', ta: 'தொடங்கவும்', hi: 'शुरू करें' },
  tmReviewTitle: { en: 'Ready to add to your *result*.', ta: 'உங்கள் *முடிவில்* சேர்க்கத் தயார்.', hi: 'आपके *परिणाम* में जोड़ने को तैयार।' },
  tmCount: { en: '{a} of {n} answered', ta: '{n} இல் {a} பதில்கள்', hi: '{n} में से {a} जवाब' },
  tmAdd: { en: 'Add to my result', ta: 'என் முடிவில் சேர்க்கவும்', hi: 'मेरे परिणाम में जोड़ें' },
  tmNone: {
    en: 'There is nothing to measure here: this term is already measured, or there is no sitting to add it to.',
    ta: 'இங்கே அளவிட எதுவும் இல்லை: இந்த அம்சம் ஏற்கனவே அளவிடப்பட்டுவிட்டது, அல்லது இதைச் சேர்க்க அமர்வு எதுவும் இல்லை.',
    hi: 'यहाँ मापने को कुछ नहीं है: यह पहलू पहले से मापा जा चुका है, या इसे जोड़ने के लिए कोई बैठक नहीं है।',
  },
  tmBack: { en: 'Back to My Index', ta: 'என் குறியீட்டுக்குத் திரும்பவும்', hi: 'मेरे इंडेक्स पर वापस' },
  nyBanner: {
    en: '{terms} not yet measured. The Index is withheld until every term is measured.',
    ta: '{terms} இன்னும் அளவிடப்படவில்லை. எல்லா அம்சங்களும் அளவிடப்படும் வரை குறியீடு நிறுத்திவைக்கப்படும்.',
    hi: '{terms} अभी मापा नहीं गया। हर पहलू मापे जाने तक इंडेक्स रोका रहता है।',
  },
  nyToday: { en: 'Your sitting of {date}: {terms} not yet measured.', ta: '{date} அன்றைய உங்கள் அமர்வு: {terms} இன்னும் அளவிடப்படவில்லை.', hi: '{date} की आपकी बैठक: {terms} अभी मापा नहीं गया।' },
  nyTodayLink: { en: 'Open My Index', ta: 'என் குறியீட்டைத் திறக்கவும்', hi: 'मेरा इंडेक्स खोलें' },

  // ─── Under 18: never scored (Today) ──────────────────────────────────────
  mnTitle: { en: 'Not scored while you are under 18.', ta: '18 வயதுக்குக் கீழ் இருக்கும் வரை மதிப்பெண் இல்லை.', hi: '18 साल से कम उम्र तक कोई स्कोर नहीं।' },
  mnBody: {
    en: 'Nothing here is turned into a number. Your Spaces, the Ledger and the Practice stay open, and today’s action is chosen from them.',
    ta: 'இங்கே எதுவும் எண்ணாக மாற்றப்படுவதில்லை. உங்கள் இடங்கள், லெட்ஜர், பயிற்சி ஆகியவை திறந்தே இருக்கும்; இன்றைய செயல் அவற்றிலிருந்தே தேர்ந்தெடுக்கப்படுகிறது.',
    hi: 'यहाँ कुछ भी संख्या में नहीं बदला जाता। आपके स्पेस, लेजर और अभ्यास खुले रहते हैं, और आज का काम उन्हीं से चुना जाता है।',
  },
  mnLink: { en: 'What opens at 18', ta: '18 வயதில் என்ன திறக்கும்', hi: '18 पर क्या खुलता है' },
  mnStep1: { en: 'Chosen from your Spaces and your Ledger, never from a score.', ta: 'உங்கள் இடங்கள், லெட்ஜரிலிருந்து தேர்ந்தெடுக்கப்பட்டது; ஒருபோதும் மதிப்பெண்ணிலிருந்து அல்ல.', hi: 'आपके स्पेस और लेजर से चुना गया, कभी किसी स्कोर से नहीं।' },
  mnSpeak: { en: 'Not scored while you are under 18.', ta: '18 வயதுக்குக் கீழ் இருக்கும் வரை மதிப்பெண் இல்லை.', hi: '18 साल से कम उम्र तक कोई स्कोर नहीं।' },

  // ─── The coach's override of today's action ──────────────────────────────
  coChose: { en: 'Chosen by your coach', ta: 'உங்கள் பயிற்சியாளர் தேர்ந்தெடுத்தது', hi: 'आपके कोच ने चुना' },
  coChoseBy: { en: 'Chosen by your coach, {who}, on {date}.', ta: 'உங்கள் பயிற்சியாளர் {who} {date} அன்று தேர்ந்தெடுத்தது.', hi: 'आपके कोच {who} ने {date} को चुना।' },
  coWhy: { en: 'Why: {reason}', ta: 'காரணம்: {reason}', hi: 'वजह: {reason}' },
  coNote: {
    en: 'Your coach changed today’s action from inside the same evidence library. The engine’s choice returns when the coach hands it back.',
    ta: 'உங்கள் பயிற்சியாளர் அதே சான்று நூலகத்திலிருந்து இன்றைய செயலை மாற்றினார். பயிற்சியாளர் திருப்பித் தரும்போது இயந்திரத்தின் தேர்வு மீண்டும் வரும்.',
    hi: 'आपके कोच ने उसी साक्ष्य लाइब्रेरी के भीतर से आज का काम बदला। कोच के लौटाने पर इंजन की पसंद वापस आ जाती है।',
  },

  // ─── Day 90: corrections after a Clinical-grade submission ───────────────
  d9Correct: { en: 'Correct an answer', ta: 'ஒரு பதிலைத் திருத்தவும்', hi: 'एक जवाब सुधारें' },
  d9CorrectSigned: {
    en: 'This card is signed. A correction is added to the record, the signature is withdrawn, and {who} signs the corrected card again.',
    ta: 'இந்த அட்டை கையொப்பமிடப்பட்டது. திருத்தம் பதிவில் சேர்க்கப்படும், கையொப்பம் திரும்பப் பெறப்படும், திருத்திய அட்டையில் {who} மீண்டும் கையொப்பமிடுவார்.',
    hi: 'इस कार्ड पर हस्ताक्षर हो चुके हैं। सुधार रिकॉर्ड में जुड़ता है, हस्ताक्षर वापस ले लिए जाते हैं, और {who} सुधरे कार्ड पर दोबारा हस्ताक्षर करते हैं।',
  },
  d9Resign: {
    en: 'Corrected after sign-off. The earlier signature by {who} on {date} is kept in the history; the corrected card awaits a new signature.',
    ta: 'கையொப்பத்துக்குப் பிறகு திருத்தப்பட்டது. {date} அன்று {who} இட்ட முந்தைய கையொப்பம் வரலாற்றில் இருக்கும்; திருத்திய அட்டை புதிய கையொப்பத்துக்குக் காத்திருக்கிறது.',
    hi: 'हस्ताक्षर के बाद सुधारा गया। {date} को {who} के पहले के हस्ताक्षर इतिहास में रहते हैं; सुधरा कार्ड नए हस्ताक्षर की प्रतीक्षा में है।',
  },
  d9Withheld: {
    en: 'Your Clinical-grade sitting left {terms} not yet measured, so the Index is withheld until it is. Nothing is guessed.',
    ta: 'உங்கள் மருத்துவ நிலை அமர்வில் {terms} இன்னும் அளவிடப்படவில்லை; அது அளவிடப்படும் வரை குறியீடு நிறுத்திவைக்கப்படும். எதுவும் ஊகிக்கப்படாது.',
    hi: 'आपकी क्लिनिकल ग्रेड बैठक में {terms} अभी मापा नहीं गया, इसलिए उसके मापे जाने तक इंडेक्स रोका गया है। कुछ भी अनुमान से नहीं भरा जाता।',
  },

  // ─── Joy Ledger: the evening follow-up for a pleasure ────────────────────
  fuEyebrow: { en: 'This evening · {term}', ta: 'இன்று மாலை · {term}', hi: 'आज शाम · {term}' },
  fuTitle: { en: 'How was it?', ta: 'அது எப்படி இருந்தது?', hi: 'कैसा रहा?' },
  fuKept: { en: 'The savouring prompt you kept today', ta: 'இன்று நீங்கள் வைத்துக்கொண்ட ரசிக்கும் தூண்டல்', hi: 'आज आपने जो रस लेने का संकेत रखा' },
  fuPlanned: { en: 'Your planned pleasure, {time}', ta: 'நீங்கள் திட்டமிட்ட மகிழ்ச்சி, {time}', hi: 'आपका तय किया आनंद, {time}' },
  fuGood: { en: 'It was good', ta: 'நன்றாக இருந்தது', hi: 'अच्छा रहा' },
  fuFine: { en: 'It was fine', ta: 'பரவாயில்லை', hi: 'ठीक रहा' },
  fuMissed: { en: 'It didn’t happen', ta: 'நடக்கவில்லை', hi: 'नहीं हो पाया' },
  fuWord: { en: 'A word about it (optional)', ta: 'அதைப் பற்றி ஒரு சொல் (விருப்பத்தேர்வு)', hi: 'इसके बारे में एक शब्द (वैकल्पिक)' },
  fuSave: { en: 'Keep it in the Ledger', ta: 'லெட்ஜரில் சேமிக்கவும்', hi: 'लेजर में सहेजें' },
  fuSaved: { en: 'Kept in the Ledger.', ta: 'லெட்ஜரில் சேமிக்கப்பட்டது.', hi: 'लेजर में सहेजा गया।' },
  fuMissedSaved: { en: 'Noted. Nothing is added to the Ledger, and that is fine.', ta: 'குறித்துக்கொண்டோம். லெட்ஜரில் எதுவும் சேர்க்கப்படவில்லை; அதுவும் சரிதான்.', hi: 'नोट कर लिया। लेजर में कुछ नहीं जोड़ा गया, और यह ठीक है।' },
  fuAsks: { en: 'Asks at {t}', ta: '{t} மணிக்குக் கேட்கும்', hi: '{t} बजे पूछेगा' },
  fuNow: { en: 'Answer now', ta: 'இப்போதே பதில் சொல்லவும்', hi: 'अभी जवाब दें' },
  fuNoteIt: { en: 'Note it', ta: 'குறித்துக்கொள்ளவும்', hi: 'नोट करें' },
  fuChoose: { en: 'Choose one', ta: 'ஒன்றைத் தேர்ந்தெடுக்கவும்', hi: 'एक चुनें' },
  fuAria: { en: 'How was it: {what}', ta: 'அது எப்படி இருந்தது: {what}', hi: 'कैसा रहा: {what}' },

  // ─── The equation and its credit (Playbook p44, p47; Memorandum) ─────────
  eqTitle: { en: 'The equation', ta: 'சமன்பாடு', hi: 'समीकरण' },
  eqCredit: {
    en: 'The word Joyspan is credited to Dr Kerry Burnight.',
    ta: 'ஜாய்ஸ்பான் என்ற சொல்லின் பெருமை Dr Kerry Burnight அவர்களைச் சேரும்.',
    hi: 'जॉयस्पैन शब्द का श्रेय Dr Kerry Burnight को जाता है।',
  },
  eqOwns: {
    en: 'AIWO owns the equation, the Index and the programmes.',
    ta: 'சமன்பாடு, குறியீடு, திட்டங்கள் ஆகியவை AIWO-வுக்குச் சொந்தமானவை.',
    hi: 'समीकरण, इंडेक्स और कार्यक्रम AIWO के हैं।',
  },

  // ─── Day 90: the change-time request, sent to the physician's Care thread (K1) ──
  d9ReqSend: { en: 'Ask {who} to move it', ta: 'மாற்றும்படி {who}-இடம் கேட்கவும்', hi: '{who} से समय बदलने को कहें' },
  d9ReqKeep: { en: 'Keep the booked time', ta: 'பதிவான நேரத்தையே வைத்திருக்கவும்', hi: 'बुक किया समय ही रखें' },
  d9ReqSubject: { en: 'Day-90 call: the time', ta: 'நாள்-90 அழைப்பு: நேரம்', hi: 'दिन-90 कॉल: समय' },
  d9ReqBody: {
    en: 'Could we move my Day-90 call from {from} to {to}?',
    ta: 'என் நாள்-90 அழைப்பை {from} இலிருந்து {to} க்கு மாற்ற முடியுமா?',
    hi: 'क्या मेरी दिन-90 कॉल {from} से {to} पर की जा सकती है?',
  },
  d9ReqKeepBody: {
    en: 'Please keep my Day-90 call at {from}. I no longer need to move it.',
    ta: 'என் நாள்-90 அழைப்பை {from} நேரத்திலேயே வைத்திருங்கள். இனி மாற்ற வேண்டியதில்லை.',
    hi: 'कृपया मेरी दिन-90 कॉल {from} पर ही रखें। अब इसे बदलने की ज़रूरत नहीं।',
  },
  d9ReqKept: {
    en: 'Back to the booked time. Your note to {who} is in Care.',
    ta: 'பதிவான நேரத்துக்கே திரும்பியது. {who}-க்கான உங்கள் குறிப்பு கவனிப்பு பகுதியில் உள்ளது.',
    hi: 'बुक किए समय पर वापस। {who} के लिए आपका नोट ‘देखभाल’ में है।',
  },
  d9ReqThread: { en: 'Open the thread', ta: 'உரையாடலைத் திறக்கவும்', hi: 'बातचीत खोलें' },
  // ─── Day 90: a term skipped in the Clinical-grade sitting, measured later ──
  d9MeasureLater: {
    en: 'Measure it on its own: only that term’s items. The answers join this sitting as answered later, the Index is scored again, and the record goes back to {who} to sign.',
    ta: 'அதைத் தனியாக அளவிடுங்கள்: அந்த அம்சத்தின் கேள்விகள் மட்டும். பதில்கள் இந்த அமர்வில் “பின்னர் பதிலளித்தவை” எனச் சேரும், குறியீடு மீண்டும் மதிப்பிடப்படும், பதிவு கையொப்பத்துக்காக {who}-இடம் திரும்பச் செல்லும்.',
    hi: 'इसे अलग से मापें: सिर्फ़ उस पहलू के सवाल। जवाब इस बैठक में “बाद में दिए गए” के रूप में जुड़ेंगे, इंडेक्स दोबारा स्कोर होगा, और रिकॉर्ड हस्ताक्षर के लिए {who} के पास लौटेगा।',
  },
  tmBodyClinical: {
    en: 'Only this term’s items. Your other answers stay as they were scored; these join your Clinical-grade sitting as answered later, the Index is scored again, and the record goes back to {who} to sign.',
    ta: 'இந்த அம்சத்தின் கேள்விகள் மட்டும். உங்கள் மற்ற பதில்கள் மதிப்பிட்டபடியே இருக்கும்; இவை உங்கள் மருத்துவ நிலை அமர்வில் “பின்னர் பதிலளித்தவை” எனச் சேரும், குறியீடு மீண்டும் மதிப்பிடப்படும், பதிவு கையொப்பத்துக்காக {who}-இடம் திரும்பச் செல்லும்.',
    hi: 'सिर्फ़ इस पहलू के सवाल। आपके बाक़ी जवाब वैसे ही रहते हैं जैसे स्कोर हुए थे; ये आपकी क्लिनिकल ग्रेड बैठक में “बाद में दिए गए” के रूप में जुड़ते हैं, इंडेक्स दोबारा स्कोर होता है, और रिकॉर्ड हस्ताक्षर के लिए {who} के पास लौटता है।',
  },
  tmAddClinical: { en: 'Add to my Clinical-grade sitting', ta: 'என் மருத்துவ நிலை அமர்வில் சேர்க்கவும்', hi: 'मेरी क्लिनिकल ग्रेड बैठक में जोड़ें' },
  tmBackDay90: { en: 'Back to Day 90', ta: 'நாள் 90-க்குத் திரும்பவும்', hi: 'दिन 90 पर वापस' },
  tmEnglishName: { en: 'Published as', ta: 'வெளியிடப்பட்ட பெயர்', hi: 'प्रकाशित नाम' },

  // ─── My Index: the member's own signed Day-90 re-measure ────────────────
  ixOwnMoved: { en: 'Day 0 {a} → Day 90 {b}', ta: 'நாள் 0 {a} → நாள் 90 {b}', hi: 'दिन 0 {a} → दिन 90 {b}' },
  ixOwnMovedH: { en: 'Your Day-90 re-measure', ta: 'உங்கள் நாள்-90 மறு அளவீடு', hi: 'आपका दिन-90 पुनर्माप' },
  hsOwnLine: {
    en: 'The newest row is your own Day-90 Clinical-grade re-measure, signed by {who} on {date}.',
    ta: 'புதிய வரிசை உங்கள் சொந்த நாள்-90 மருத்துவ நிலை மறு அளவீடு; {date} அன்று {who} கையொப்பமிட்டது.',
    hi: 'सबसे नई पंक्ति आपका अपना दिन-90 क्लिनिकल ग्रेड पुनर्माप है, {date} को {who} के हस्ताक्षर।',
  },

  // ─── VIVA: hand-offs to Care (K1), guardrail labels, and a minor's replies ──
  pvGrNoDx: { en: 'guardrail · no diagnosis', ta: 'காப்பு விதி · நோயறிதல் இல்லை', hi: 'सुरक्षा नियम · कोई निदान नहीं' },
  pvGrNoMoney: { en: 'guardrail · no financial advice', ta: 'காப்பு விதி · நிதி ஆலோசனை இல்லை', hi: 'सुरक्षा नियम · कोई वित्तीय सलाह नहीं' },
  pvGrAdviser: { en: 'guardrail · question for adviser', ta: 'காப்பு விதி · ஆலோசகருக்கான கேள்வி', hi: 'सुरक्षा नियम · सलाहकार के लिए सवाल' },
  vvRelaySubject: { en: 'While VIVA was resting', ta: 'VIVA ஓய்வில் இருந்தபோது', hi: 'जब VIVA आराम कर रहा था' },
  vvDxSubject: { en: 'A question VIVA passed on', ta: 'VIVA அனுப்பிய ஒரு கேள்வி', hi: 'VIVA का आगे भेजा एक सवाल' },
  vvMinorAskTitle: { en: 'How the Index works', ta: 'குறியீடு எப்படிச் செயல்படுகிறது', hi: 'इंडेक्स कैसे काम करता है' },
  vvMinorDoes: {
    en: 'The six terms and the equation. You are not scored while under 18.',
    ta: 'ஆறு அம்சங்களும் சமன்பாடும். 18 வயதுக்குக் கீழ் இருக்கும்போது உங்களுக்கு மதிப்பெண் இல்லை.',
    hi: 'छह पहलू और समीकरण। 18 साल से कम उम्र में आपको स्कोर नहीं किया जाता।',
  },
  vvMinorAsk: { en: 'How is the Index built?', ta: 'குறியீடு எப்படி உருவாக்கப்படுகிறது?', hi: 'इंडेक्स कैसे बनता है?' },
  rtIndexMinor: {
    en: 'The Index is the geometric mean of five positive terms, minus a quarter of Burden, so the lowest term holds it back most. You are not scored while under 18, so I won’t quote a number for you. From your 18th birthday you can choose to take it.',
    ta: 'குறியீடு என்பது ஐந்து நேர்மறை அம்சங்களின் பெருக்கல் சராசரியிலிருந்து சுமையின் நான்கில் ஒரு பங்கைக் கழித்தது; எனவே மிகக் குறைந்த அம்சமே அதை அதிகம் பின்னுக்கு இழுக்கிறது. 18 வயதுக்குக் கீழ் இருக்கும்போது உங்களுக்கு மதிப்பெண் இல்லை, எனவே உங்களுக்கான எண் எதையும் சொல்ல மாட்டேன். உங்கள் 18-வது பிறந்தநாளிலிருந்து நீங்கள் விரும்பினால் அதை எடுக்கலாம்.',
    hi: 'इंडेक्स पाँच सकारात्मक पहलुओं का ज्यामितीय औसत है, जिसमें से बोझ का एक-चौथाई घटाया जाता है, इसलिए सबसे कम पहलू इसे सबसे ज़्यादा रोकता है। 18 साल से कम उम्र में आपको स्कोर नहीं किया जाता, इसलिए मैं आपके लिए कोई संख्या नहीं बताऊँगा। अपने 18वें जन्मदिन से आप चाहें तो इसे ले सकते हैं।',
  },
  rtBodyMinor: {
    en: 'I can describe your signals, never diagnose them. You are not scored while under 18, so I won’t quote a term score. For a sleep concern, Dr Meera is in Care.',
    ta: 'உங்கள் சிக்னல்களை விவரிக்க முடியும், அவற்றை வைத்து நோயறிதல் செய்ய முடியாது. 18 வயதுக்குக் கீழ் இருக்கும்போது உங்களுக்கு மதிப்பெண் இல்லை, எனவே எந்த அம்ச மதிப்பெண்ணையும் சொல்ல மாட்டேன். தூக்கம் பற்றிய கவலைக்கு, Dr Meera கவனிப்பு பகுதியில் இருக்கிறார்.',
    hi: 'आपके सिग्नल समझाए जा सकते हैं, उनसे बीमारी नहीं बताई जाती। 18 साल से कम उम्र में आपको स्कोर नहीं किया जाता, इसलिए मैं किसी पहलू का स्कोर नहीं बताऊँगा। नींद की चिंता के लिए Dr Meera ‘देखभाल’ में हैं।',
  },

  // ─── Day 40, for a member under 18 (no Index, no term score) ────────────
  d4StartMinor: {
    en: 'Your first sitting, {date}. You are not scored while under 18, so this page carries no number.',
    ta: 'உங்கள் முதல் அமர்வு, {date}. 18 வயதுக்குக் கீழ் இருக்கும்போது உங்களுக்கு மதிப்பெண் இல்லை; எனவே இந்தப் பக்கத்தில் எண் எதுவும் இல்லை.',
    hi: 'आपकी पहली बैठक, {date}। 18 साल से कम उम्र में आपको स्कोर नहीं किया जाता, इसलिए इस पन्ने पर कोई संख्या नहीं है।',
  },
  d4PlanMinor: { en: 'Your plan starts with {term}.', ta: 'உங்கள் திட்டம் {term} அம்சத்துடன் தொடங்குகிறது.', hi: 'आपकी योजना {term} से शुरू होती है।' },

  // ─── The Letter: write-back held after the emergency intercept ──────────
  ltHeld: {
    en: 'Nothing was sent. What you wrote sounds heavy, so support is open now. Your words stay in the box and are not kept.',
    ta: 'எதுவும் அனுப்பப்படவில்லை. நீங்கள் எழுதியது கனமாகத் தெரிகிறது; எனவே உதவி இப்போது திறந்துள்ளது. உங்கள் வார்த்தைகள் பெட்டியிலேயே இருக்கும்; சேமிக்கப்படாது.',
    hi: 'कुछ नहीं भेजा गया। आपने जो लिखा वह भारी लगता है, इसलिए मदद अभी खुली है। आपके शब्द बॉक्स में ही हैं और सहेजे नहीं गए।',
  },

  // ─── Today's action follows the latest Index ─────────────────────────────
  tdWhyOwn: {
    en: '{term} is your lowest term on your Day-90 re-measure, signed by {who}. This is its one next step.',
    ta: '{who} கையொப்பமிட்ட உங்கள் நாள்-90 மறு அளவீட்டில் {term} மிகக் குறைந்த அம்சம். இது அதற்கான ஒரே அடுத்த படி.',
    hi: '{who} के हस्ताक्षर वाले आपके दिन-90 दोबारा माप में {term} सबसे कम पहलू है। यह उसका एक अगला कदम है।',
  },
  tdFit: { en: '{n} minutes, {when}, {who}.', ta: '{n} நிமிடங்கள், {when}, {who}.', hi: '{n} मिनट, {when}, {who}।' },
  tdTodMorning: { en: 'in the morning', ta: 'காலையில்', hi: 'सुबह' },
  tdTodAfternoon: { en: 'in the afternoon', ta: 'மதியம்', hi: 'दोपहर में' },
  tdTodEvening: { en: 'in the evening', ta: 'மாலையில்', hi: 'शाम को' },
  tdTodAny: { en: 'at any time of day', ta: 'நாளின் எந்த நேரத்திலும்', hi: 'दिन में किसी भी समय' },
  tdFitKavya: { en: 'with Kavya, who is linked to your account', ta: 'உங்கள் கணக்குடன் இணைக்கப்பட்ட Kavya உடன்', hi: 'Kavya के साथ, जो आपके खाते से जुड़ी हैं' },
  tdFitSolo: { en: 'on your own', ta: 'நீங்கள் தனியாக', hi: 'अकेले' },
  tdFitCal: {
    en: 'Your connected calendar (consented) is clear after {t} pm; sunset is at {s}.',
    ta: 'இணைக்கப்பட்ட உங்கள் நாட்காட்டி (ஒப்புதலுடன்) இரவு {t} மணிக்குப் பிறகு காலியாக உள்ளது; சூரிய அஸ்தமனம் {s}.',
    hi: 'आपका जुड़ा हुआ कैलेंडर (सहमति से) शाम {t} बजे के बाद खाली है; सूर्यास्त {s} पर।',
  },
  tdFitNoCal: {
    en: 'No calendar is connected, so Joy OS does not know your free time: the time is yours to choose.',
    ta: 'நாட்காட்டி எதுவும் இணைக்கப்படவில்லை; எனவே உங்கள் ஓய்வு நேரம் Joy OS-க்குத் தெரியாது: நேரத்தை நீங்களே தேர்ந்தெடுங்கள்.',
    hi: 'कोई कैलेंडर जुड़ा नहीं है, इसलिए Joy OS को आपका ख़ाली समय नहीं पता: समय आप ख़ुद चुनें।',
  },
  tdPoolSubReplaced: {
    en: 'Your coach chose today’s action above, so the one it replaced waits here. Any one is enough, and “not today” is always allowed.',
    ta: 'மேலே உள்ள இன்றைய செயலை உங்கள் பயிற்சியாளர் தேர்ந்தெடுத்தார்; அது மாற்றிய செயல் இங்கே காத்திருக்கிறது. ஏதேனும் ஒன்று போதும்; “இன்று வேண்டாம்” என்று சொல்ல எப்போதும் அனுமதி உண்டு.',
    hi: 'ऊपर का आज का काम आपके कोच ने चुना है, इसलिए जिसे उसने बदला वह यहाँ रखा है। कोई एक काफ़ी है, और “आज नहीं” कहना हमेशा ठीक है।',
  },
  tdPoolSubMixed: {
    en: 'You added most of these; the one your coach’s choice replaced waits here too. Any one is enough, and “not today” is always allowed.',
    ta: 'இவற்றில் பெரும்பாலானவற்றை நீங்கள் சேர்த்தீர்கள்; உங்கள் பயிற்சியாளரின் தேர்வு மாற்றிய செயலும் இங்கே காத்திருக்கிறது. ஏதேனும் ஒன்று போதும்; “இன்று வேண்டாம்” என்று சொல்ல எப்போதும் அனுமதி உண்டு.',
    hi: 'इनमें से ज़्यादातर आपने जोड़े हैं; आपके कोच की पसंद ने जिसे बदला, वह भी यहाँ रखा है। कोई एक काफ़ी है, और “आज नहीं” कहना हमेशा ठीक है।',
  },
  tdPoolReplaced: {
    en: 'The engine’s choice for today, before your coach changed it',
    ta: 'பயிற்சியாளர் மாற்றும் முன், இன்றைக்கான இயந்திரத்தின் தேர்வு',
    hi: 'कोच के बदलने से पहले, आज के लिए इंजन की पसंद',
  },
  vvIndexAsk: { en: 'Why is my Index {v}?', ta: 'என் குறியீடு ஏன் {v}?', hi: 'मेरा इंडेक्स {v} क्यों है?' },
  vvActionAsk: { en: 'Why “{title}” today?', ta: 'இன்று ஏன் “{title}”?', hi: 'आज “{title}” क्यों?' },
  rtActionCoach: {
    en: 'Today’s action was chosen by your coach{who}: {title} Why: {reason} The engine’s choice is still in your pool for today. “Not today” is always allowed.',
    ta: 'இன்றைய செயலை உங்கள் பயிற்சியாளர்{who} தேர்ந்தெடுத்தார்: {title} காரணம்: {reason} இயந்திரத்தின் தேர்வு இன்றைய உங்கள் தொகுப்பில் இன்னும் உள்ளது. “இன்று வேண்டாம்” என்று எப்போதும் சொல்லலாம்.',
    hi: 'आज का काम आपके कोच{who} ने चुना है: {title} वजह: {reason} इंजन की पसंद आज भी आपकी सूची में है। “आज नहीं” कहना हमेशा ठीक है।',
  },

  // ─── The re-measure returned to the lab (clinical portal → member) ───────
  rmReturnedEyebrow: { en: 'Re-measure · returned to the lab · {date}', ta: 'மறு அளவீடு · ஆய்வகத்துக்குத் திருப்பி அனுப்பப்பட்டது · {date}', hi: 'दोबारा माप · लैब को लौटाया गया · {date}' },
  rmReturnedBody: {
    en: '{who} returned your Day-90 draft to the lab: {reason}. Your concierge, {concierge}, is arranging a home redraw. When the lab has the new sample, the draft goes back to {who} to sign.',
    ta: '{who} உங்கள் நாள்-90 வரைவை ஆய்வகத்துக்குத் திருப்பி அனுப்பினார்: {reason}. உங்கள் கன்சியர்ஜ் {concierge} வீட்டில் மீண்டும் இரத்த மாதிரி எடுக்க ஏற்பாடு செய்கிறார். புதிய மாதிரி ஆய்வகத்துக்குக் கிடைத்ததும், வரைவு கையொப்பத்துக்காக மீண்டும் {who} இடம் செல்லும்.',
    hi: '{who} ने आपका दिन-90 ड्राफ़्ट लैब को लौटा दिया: {reason}। आपके कंसीयर्ज {concierge} घर पर दोबारा ख़ून का नमूना लेने की व्यवस्था कर रहे हैं। लैब को नया नमूना मिलते ही ड्राफ़्ट हस्ताक्षर के लिए फिर {who} के पास जाएगा।',
  },
  rmReturnedNext: {
    en: 'Your numbers stay provisional until {who} signs. Nothing is needed from you until {concierge} gets in touch about the time.',
    ta: '{who} கையொப்பமிடும் வரை உங்கள் எண்கள் தற்காலிகமானவை. நேரம் குறித்து {concierge} தொடர்பு கொள்ளும் வரை நீங்கள் எதுவும் செய்ய வேண்டியதில்லை.',
    hi: '{who} के हस्ताक्षर तक आपकी संख्याएँ अस्थायी हैं। समय के बारे में {concierge} के संपर्क करने तक आपको कुछ नहीं करना है।',
  },
  rmReasonNone: { en: 'no reason recorded', ta: 'காரணம் பதிவு செய்யப்படவில்லை', hi: 'कोई कारण दर्ज नहीं' },
  rmRedrawIn: {
    en: 'The redraw is in. Your draft is back with {who} to sign.',
    ta: 'மீண்டும் எடுத்த மாதிரி வந்துவிட்டது. உங்கள் வரைவு கையொப்பத்துக்காக மீண்டும் {who} இடம் உள்ளது.',
    hi: 'दोबारा लिया गया नमूना आ गया है। आपका ड्राफ़्ट हस्ताक्षर के लिए फिर {who} के पास है।',
  },
  rmMessageConcierge: { en: 'Message {who}', ta: '{who}-க்குச் செய்தி அனுப்பவும்', hi: '{who} को संदेश भेजें' },
  d9CardReturned: {
    en: 'The card waits for the redraw and for {who} to sign.',
    ta: 'அட்டை, மீண்டும் எடுக்கும் மாதிரிக்கும் {who} கையொப்பத்துக்கும் காத்திருக்கிறது.',
    hi: 'कार्ड दोबारा नमूने और {who} के हस्ताक्षर का इंतज़ार कर रहा है।',
  },
  d9SpecimenRedraw: {
    en: 'Specimen: {concierge} marks the home redraw received from the concierge desk; the draft then goes back into {who}’s sign-off queue.',
    ta: 'மாதிரி: {concierge} கன்சியர்ஜ் மேசையிலிருந்து வீட்டு மாதிரி கிடைத்ததாகக் குறிப்பார்; அதன் பிறகு வரைவு மீண்டும் {who} அவர்களின் கையொப்ப வரிசைக்குச் செல்லும்.',
    hi: 'नमूना: {concierge} कंसीयर्ज डेस्क से घर का नमूना मिलने का निशान लगाते हैं; फिर ड्राफ़्ट वापस {who} की हस्ताक्षर सूची में जाता है।',
  },
  d9OpenConcierge: { en: 'Open the concierge desk', ta: 'கன்சியர்ஜ் மேசையைத் திறக்கவும்', hi: 'कंसीयर्ज डेस्क खोलें' },
} satisfies Dict

/** The clinical portal's return reasons (console/care/_data.ts RETURN_REASONS), in the member's language. */
export const RETURN_REASON_TEXT: Record<string, { en: string; ta: string; hi: string }> = {
  'Repeat test needed': { en: 'a repeat test is needed', ta: 'பரிசோதனையை மீண்டும் செய்ய வேண்டும்', hi: 'जाँच दोबारा करनी है' },
  'Lab value looks implausible': { en: 'a lab value looks implausible', ta: 'ஒரு ஆய்வக மதிப்பு நம்பத்தகுந்ததாகத் தெரியவில்லை', hi: 'लैब का एक मान सही नहीं लगता' },
  'An input is missing': { en: 'an input is missing', ta: 'ஒரு உள்ளீடு விடுபட்டுள்ளது', hi: 'एक इनपुट छूट गया है' },
}

/**
 * Instrument licence attributions (Take the Index intro). Authors and bodies stay as
 * published; the licence phrase is translated.
 */
export const ATTRIBUTION_TEXT: Record<string, { ta: string; hi: string }> = {
  'American Heart Association · free to use': { ta: 'American Heart Association · பயன்படுத்த இலவசம்', hi: 'American Heart Association · इस्तेमाल के लिए मुफ़्त' },
  'Imai et al. · author permission (pending, specimen)': { ta: 'Imai et al. · ஆசிரியர் அனுமதி (நிலுவையில், மாதிரி)', hi: 'Imai et al. · लेखक की अनुमति (बाकी, नमूना)' },
  'Steger et al. · free for research, commercial use confirmed': { ta: 'Steger et al. · ஆய்வுக்கு இலவசம், வணிகப் பயன் உறுதி', hi: 'Steger et al. · शोध के लिए मुफ़्त, व्यावसायिक उपयोग पक्का' },
  'Hughes et al. · public domain': { ta: 'Hughes et al. · பொதுக் களம்', hi: 'Hughes et al. · सार्वजनिक डोमेन' },
  'Lubben · terms to confirm (specimen)': { ta: 'Lubben · விதிமுறைகள் உறுதியாக வேண்டும் (மாதிரி)', hi: 'Lubben · शर्तें तय होनी हैं (नमूना)' },
  'Chen et al. · terms to confirm (specimen)': { ta: 'Chen et al. · விதிமுறைகள் உறுதியாக வேண்டும் (மாதிரி)', hi: 'Chen et al. · शर्तें तय होनी हैं (नमूना)' },
  'Kasser & Sheldon · free with attribution': { ta: 'Kasser & Sheldon · மேற்கோளுடன் இலவசம்', hi: 'Kasser & Sheldon · श्रेय देकर मुफ़्त' },
  'US CFPB · public domain': { ta: 'US CFPB · பொதுக் களம்', hi: 'US CFPB · सार्वजनिक डोमेन' },
  'Diener et al. · free with attribution': { ta: 'Diener et al. · மேற்கோளுடன் இலவசம்', hi: 'Diener et al. · श्रेय देकर मुफ़्त' },
  'Kroenke et al. · public domain': { ta: 'Kroenke et al. · பொதுக் களம்', hi: 'Kroenke et al. · सार्वजनिक डोमेन' },
  'Cohen et al. · terms to confirm (specimen)': { ta: 'Cohen et al. · விதிமுறைகள் உறுதியாக வேண்டும் (மாதிரி)', hi: 'Cohen et al. · शर्तें तय होनी हैं (नमूना)' },
}

/** Instrument names in the member's language (the published English name is shown beneath). */
export const BLOCK_NAME_TEXT: Record<string, { ta: string; hi: string }> = {
  'Life’s Essential 8 · self-report': { ta: 'Life’s Essential 8 · சுய அறிக்கை', hi: 'Life’s Essential 8 · स्व-रिपोर्ट' },
  'Meaning in Life · Presence': { ta: 'வாழ்க்கையின் பொருள் · இருப்பு', hi: 'जीवन का अर्थ · उपस्थिति' },
  'UCLA Loneliness · three items': { ta: 'UCLA தனிமை · மூன்று கேள்விகள்', hi: 'UCLA अकेलापन · तीन सवाल' },
  'Lubben Social Network Scale · six items': { ta: 'Lubben சமூக வலைப்பின்னல் அளவுகோல் · ஆறு கேள்விகள்', hi: 'Lubben सामाजिक नेटवर्क पैमाना · छह सवाल' },
  'Basic Psychological Needs · autonomy': { ta: 'அடிப்படை உளவியல் தேவைகள் · சுயாட்சி', hi: 'बुनियादी मनोवैज्ञानिक ज़रूरतें · स्वायत्तता' },
  'Time affluence': { ta: 'நேர வளம்', hi: 'समय की भरपूरता' },
  'Financial Well-Being · five items': { ta: 'நிதி நலம் · ஐந்து கேள்விகள்', hi: 'वित्तीय कल्याण · पाँच सवाल' },
  'Scale of Positive and Negative Experience': { ta: 'நேர்மறை, எதிர்மறை அனுபவ அளவுகோல்', hi: 'सकारात्मक और नकारात्मक अनुभव का पैमाना' },
  'Patient Health Questionnaire · four items': { ta: 'நோயாளர் உடல்நலக் கேள்வித்தாள் · நான்கு கேள்விகள்', hi: 'रोगी स्वास्थ्य प्रश्नावली · चार सवाल' },
  'Perceived Stress Scale · four items': { ta: 'உணரப்பட்ட மன அழுத்த அளவுகோல் · நான்கு கேள்விகள்', hi: 'अनुभूत तनाव पैमाना · चार सवाल' },
}

/** A table string in the member's language (English stays as published). */
export function txOf(table: Record<string, { ta: string; hi: string }>, s: string, lang: string) {
  return lang === 'ta' || lang === 'hi' ? table[s]?.[lang] ?? s : s
}

/** The second core dictionary's translator. */
export function useX() {
  return useDict(XTRA)
}
