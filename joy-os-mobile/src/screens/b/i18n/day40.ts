import type { Dict } from '@/lib/i18n'
import type { TermKey } from '@/shared/types'
import type { L3 } from './common'

// The Day-40 page (Memo p17, print artefacts): one printed page at Day 40 of the loop.
export const DAY40 = {
  eyebrow: { en: 'Day 40 of 90 · the Day-40 page', ta: '90 இல் நாள் 40 · நாள்-40 பக்கம்', hi: '90 में से दिन 40 · दिन-40 पन्ना' },
  titleA: { en: 'Forty days ', ta: 'நாற்பது நாட்கள் ', hi: 'चालीस दिन ' },
  titleSerif: { en: 'in', ta: 'கடந்துவிட்டன', hi: 'बीत गए' },
  titleB: { en: '.', ta: '.', hi: '।' },
  lead: { en: 'One page, printed at Day 40: where your ninety days stand, what your signals say so far, and the one thing to keep. There is no new Index until Day 90.', ta: 'நாள் 40-இல் அச்சிடப்படும் ஒரு பக்கம்: உங்கள் தொண்ணூறு நாட்கள் எங்கே நிற்கின்றன, இதுவரை உங்கள் சமிக்ஞைகள் என்ன சொல்கின்றன, தொடர வேண்டிய ஒன்று. நாள் 90 வரை புதிய குறியீடு இல்லை.', hi: 'दिन 40 पर छपने वाला एक पन्ना: आपके नब्बे दिन कहाँ हैं, अब तक आपके संकेत क्या कहते हैं, और एक चीज़ जो जारी रखनी है। दिन 90 तक कोई नया इंडेक्स नहीं।' },
  previewOwn: { en: 'Specimen: issued on Day 40 ({date}). Shown early.', ta: 'மாதிரி: நாள் 40 ({date}) அன்று வழங்கப்படும். முன்கூட்டியே காட்டப்படுகிறது.', hi: 'नमूना: दिन 40 ({date}) को जारी होगा। पहले दिखाया जा रहा है।' },
  preview: { en: 'Specimen: issued on Day 40 ({date}). Shown early because the app is at Day {n}.', ta: 'மாதிரி: நாள் 40 ({date}) அன்று வழங்கப்படும். செயலி நாள் {n}-இல் இருப்பதால் முன்கூட்டியே காட்டப்படுகிறது.', hi: 'नमूना: दिन 40 ({date}) को जारी होता है। ऐप दिन {n} पर है, इसलिए पहले दिखाया गया है।' },
  pageHead: { en: 'The Day-40 page · {name}', ta: 'நாள்-40 பக்கம் · {name}', hi: 'दिन-40 पन्ना · {name}' },
  dayOf: { en: 'Day 40 of 90', ta: '90 இல் நாள் 40', hi: '90 में से दिन 40' },
  wheelNote: { en: 'Your Day-0 Wheel, measured {date}. The next one is drawn on Day 90.', ta: '{date} அன்று அளவிட்ட உங்கள் நாள்-0 சக்கரம். அடுத்தது நாள் 90-இல் வரையப்படும்.', hi: '{date} को मापा गया आपका दिन-0 चक्र। अगला दिन 90 पर बनेगा।' },
  signalsTitle: { en: 'What your signals say so far', ta: 'இதுவரை உங்கள் சமிக்ஞைகள் சொல்வது', hi: 'अब तक आपके संकेत क्या कहते हैं' },
  signalsNote: { en: 'From your ring, your Ledger and your circle. Signals are not a score.', ta: 'உங்கள் மோதிரம், லெட்ஜர், வட்டத்திலிருந்து. சமிக்ஞைகள் மதிப்பெண் அல்ல.', hi: 'आपकी अंगूठी, लेजर और सर्कल से। संकेत स्कोर नहीं हैं।' },
  focusTitle: { en: 'The one thing to keep', ta: 'தொடர வேண்டிய ஒன்று', hi: 'एक चीज़ जो जारी रखनी है' },
  focusBody: { en: '{space} was your lowest term at Day 0, so it is where the next fifty days go.', ta: 'நாள் 0-இல் {space} உங்கள் மிகக் குறைந்த அம்சம், அதனால் அடுத்த ஐம்பது நாட்கள் அங்கே செல்கின்றன.', hi: 'दिन 0 पर {space} आपका सबसे कमज़ोर पहलू था, इसलिए अगले पचास दिन वहीं जाते हैं।' },
  ledgerKept: { en: 'Moments kept in your Ledger since Day 0', ta: 'நாள் 0 முதல் உங்கள் லெட்ஜரில் வைத்த தருணங்கள்', hi: 'दिन 0 से आपके लेजर में रखे पल' },
  fromCoach: { en: 'From Priya, your coach', ta: 'உங்கள் பயிற்சியாளர் Priya-விடமிருந்து', hi: 'आपकी कोच Priya से' },
  nextTitle: { en: 'What comes next', ta: 'அடுத்து என்ன', hi: 'आगे क्या' },
  next45: { en: 'Review with Priya', ta: 'Priya உடன் மறுஆய்வு', hi: 'Priya के साथ समीक्षा' },
  next76: { en: 'The re-measure opens', ta: 'மறு அளவீடு திறக்கிறது', hi: 'दोबारा माप खुलता है' },
  next90: { en: 'Your signed Day-90 measure', ta: 'உங்கள் கையொப்பமிட்ட நாள்-90 அளவீடு', hi: 'आपका हस्ताक्षरित दिन-90 माप' },
  dayN: { en: 'Day {d}', ta: 'நாள் {d}', hi: 'दिन {d}' },
  footer: { en: 'aiwo.com/method · the number can go down', ta: 'aiwo.com/method · எண் குறையவும் கூடும்', hi: 'aiwo.com/method · नंबर नीचे भी जा सकता है' },
  save: { en: 'Save the page to Photos', ta: 'பக்கத்தை Photos-இல் சேமி', hi: 'पन्ना Photos में सहेजें' },
  print: { en: 'Print the page', ta: 'பக்கத்தை அச்சிடு', hi: 'पन्ना प्रिंट करें' },
  saved: { en: 'Saved to Photos (specimen: nothing left the phone).', ta: 'Photos-இல் சேமிக்கப்பட்டது (மாதிரி: எதுவும் தொலைபேசியை விட்டு வெளியேறவில்லை).', hi: 'Photos में सहेजा गया (नमूना: कुछ भी फ़ोन से बाहर नहीं गया)।' },
  printed: { en: 'The print dialog is open.', ta: 'அச்சு உரையாடல் திறந்துள்ளது.', hi: 'प्रिंट डायलॉग खुला है।' },
  // Under 18 (minors gate): no Wheel, no lowest term, no measure.
  minorNote: { en: 'Not scored while under 18. Your ninety days run without a number: the Ledger, the practice and your people are all here.', ta: '18 வயதுக்குக் கீழ் இருக்கும்வரை மதிப்பெண் இல்லை. உங்கள் தொண்ணூறு நாட்கள் எண் இல்லாமல் நடக்கின்றன: லெட்ஜர், பயிற்சி, உங்கள் மனிதர்கள் எல்லாம் இங்கே இருக்கின்றன.', hi: '18 से कम उम्र तक कोई स्कोर नहीं। आपके नब्बे दिन बिना नंबर के चलते हैं: लेजर, अभ्यास और आपके लोग, सब यहीं हैं।' },
  minorFocus: { en: 'Keep the one practice you chose. It is the thing that carries the next fifty days.', ta: 'நீங்கள் தேர்ந்தெடுத்த ஒரு பயிற்சியைத் தொடருங்கள். அடுத்த ஐம்பது நாட்களை அதுதான் எடுத்துச் செல்லும்.', hi: 'जो एक अभ्यास आपने चुना, उसे जारी रखें। अगले पचास दिन वही आगे ले जाएगा।' },
  minorNext90: { en: 'Your ninety days close, with your coach', ta: 'உங்கள் தொண்ணூறு நாட்கள் உங்கள் பயிற்சியாளருடன் நிறைவடைகின்றன', hi: 'आपके नब्बे दिन आपके कोच के साथ पूरे होते हैं' },
  // No Index yet, and an account the specimen's signal lines were not written for.
  noneLead: { en: 'The Day-40 page starts from your Day-0 Wheel, and you have not taken your first Index yet. Take it, and this page is drawn from it.', ta: 'நாள்-40 பக்கம் உங்கள் நாள்-0 சக்கரத்திலிருந்து தொடங்குகிறது, நீங்கள் இன்னும் முதல் குறியீட்டை எடுக்கவில்லை. அதை எடுங்கள், இந்தப் பக்கம் அதிலிருந்து வரையப்படும்.', hi: 'दिन-40 पन्ना आपके दिन-0 चक्र से शुरू होता है, और आपने अभी अपना पहला इंडेक्स नहीं लिया है। उसे लें, और यह पन्ना उसी से बनेगा।' },
  signalsNone: { en: 'No signal summary for you yet. Signals are not a score.', ta: 'உங்களுக்கு இன்னும் சமிக்ஞைச் சுருக்கம் இல்லை. சமிக்ஞைகள் மதிப்பெண் அல்ல.', hi: 'आपके लिए अभी संकेतों का सारांश नहीं है। संकेत स्कोर नहीं होते।' },
  seeIndex: { en: 'Your Index, explained', ta: 'உங்கள் குறியீடு, விளக்கமாக', hi: 'आपका इंडेक्स, समझाया हुआ' },
} satisfies Dict

/** What the signals say at Day 40, per term (specimen). */
export const DAY40_SIGNALS: Record<TermKey, L3> = {
  H: { en: 'Sleep a little longer and steadier; resting heart rate held.', ta: 'உறக்கம் சற்று நீளமாகவும் சீராகவும்; ஓய்வு இதயத் துடிப்பு மாறவில்லை.', hi: 'नींद थोड़ी लंबी और स्थिर; आराम के समय दिल की धड़कन वैसी ही।' },
  P: { en: 'No signal reads Purpose; your answers will, on Day 90.', ta: 'எந்தச் சமிக்ஞையும் நோக்கத்தைப் படிப்பதில்லை; நாள் 90-இல் உங்கள் பதில்கள் படிக்கும்.', hi: 'कोई संकेत उद्देश्य नहीं पढ़ता; दिन 90 पर आपके जवाब पढ़ेंगे।' },
  R: { en: 'The circle met every week; Kavya appears in most Ledger moments.', ta: 'வட்டம் ஒவ்வொரு வாரமும் சந்தித்தது; பெரும்பாலான லெட்ஜர் தருணங்களில் Kavya இருக்கிறார்.', hi: 'सर्कल हर हफ़्ते मिला; ज़्यादातर लेजर पलों में Kavya हैं।' },
  F: { en: 'Evenings booked more often than in January.', ta: 'ஜனவரியை விட அதிக மாலைகள் முன்பதிவாகியுள்ளன.', hi: 'जनवरी से ज़्यादा शामें बुक रहीं।' },
  D: { en: 'More joy moments logged, most of them in the evening.', ta: 'அதிக மகிழ்ச்சித் தருணங்கள் பதிவாகின, பெரும்பாலும் மாலையில்.', hi: 'ज़्यादा ख़ुशी के पल दर्ज हुए, ज़्यादातर शाम को।' },
  B: { en: 'Stress a touch heavier in the last two weeks.', ta: 'கடந்த இரண்டு வாரங்களில் மன அழுத்தம் சற்று அதிகம்.', hi: 'पिछले दो हफ़्तों में तनाव थोड़ा ज़्यादा।' },
}
