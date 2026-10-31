import type { Dict } from '@/lib/i18n'
import type { L3 } from './common'

export const METHOD = {
  eyebrow: { en: 'The method · v1.0', ta: 'முறை · v1.0', hi: 'तरीका · v1.0' },
  titleA: { en: 'How the number is ', ta: 'எண் எப்படி ', hi: 'नंबर कैसे ' },
  titleSerif: { en: 'made', ta: 'உருவாகிறது', hi: 'बनता' },
  titleB: { en: '.', ta: '.', hi: ' है।' },
  lead: { en: 'Every score in Joy OS says “method v1.0”. This is that method, in full: the formula, the instruments, and what we never do.', ta: 'Joy OS-இல் ஒவ்வொரு மதிப்பெண்ணும் “method v1.0” என்று சொல்கிறது. அந்த முறை இதோ, முழுமையாக: சூத்திரம், அளவுகருவிகள், நாங்கள் ஒருபோதும் செய்யாதவை.', hi: 'Joy OS का हर स्कोर “method v1.0” कहता है। यह रहा वह तरीका, पूरा: फ़ॉर्मूला, प्रश्नावलियाँ, और जो हम कभी नहीं करते।' },
  formula: { en: 'The formula', ta: 'சூத்திரம்', hi: 'फ़ॉर्मूला' },
  formulaBody: { en: 'The geometric mean of five terms rewards balance: one low term pulls the Index down more than an average would. Burden (B) is subtracted with λ = {lambda}. Bounded 0–100.', ta: 'ஐந்து அம்சங்களின் பெருக்கல் சராசரி (geometric mean) சமநிலைக்கு மதிப்பளிக்கிறது: ஒரு குறைந்த அம்சம், சாதாரண சராசரியை விட குறியீட்டை அதிகம் கீழே இழுக்கும். சுமை (B) λ = {lambda} கொண்டு கழிக்கப்படுகிறது. வரம்பு 0–100.', hi: 'पाँच पहलुओं का ज्यामितीय माध्य (geometric mean) संतुलन को महत्व देता है: एक कमज़ोर पहलू इंडेक्स को साधारण औसत से ज़्यादा नीचे खींचता है। बोझ (B) को λ = {lambda} से घटाया जाता है। सीमा 0–100।' },
  worked: { en: 'A worked example', ta: 'ஒரு செய்முறை எடுத்துக்காட்டு', hi: 'एक उदाहरण, हल करके' },
  workedBody: { en: 'Specimen, not a member. Move any term and the same engine that scores your Index recomputes it.', ta: 'மாதிரி, உறுப்பினர் அல்ல. எந்த அம்சத்தையும் மாற்றுங்கள்; உங்கள் குறியீட்டைக் கணக்கிடும் அதே இயந்திரம் மீண்டும் கணக்கிடும்.', hi: 'नमूना, कोई सदस्य नहीं। कोई भी पहलू बदलें, आपका इंडेक्स निकालने वाला वही इंजन इसे दोबारा गिनेगा।' },
  lowerBetter: { en: '{name} · lower is better', ta: '{name} · குறைவாக இருப்பதே நல்லது', hi: '{name} · कम होना बेहतर' },
  down5: { en: '{space} down 5', ta: '{space} 5 குறை', hi: '{space} 5 कम' },
  up5: { en: '{space} up 5', ta: '{space} 5 கூட்டு', hi: '{space} 5 ज़्यादा' },
  specIdxA11y: { en: 'Specimen Index {v}, {band}', ta: 'மாதிரி குறியீடு {v}, {band}', hi: 'नमूना इंडेक्स {v}, {band}' },
  specIdx: { en: 'Specimen Index', ta: 'மாதிரி குறியீடு', hi: 'नमूना इंडेक्स' },
  lowestA: { en: 'Lowest term: ', ta: 'மிகக் குறைந்த அம்சம்: ', hi: 'सबसे कमज़ोर पहलू: ' },
  lowestB: { en: '. That is where the ninety days would begin.', ta: '. தொண்ணூறு நாட்கள் அங்கிருந்துதான் தொடங்கும்.', hi: '। नब्बे दिन यहीं से शुरू होंगे।' },
  grades: { en: 'Three grades', ta: 'மூன்று நிலைகள்', hi: 'तीन ग्रेड' },
  registry: { en: 'Instrument registry', ta: 'அளவுகருவிப் பதிவேடு', hi: 'प्रश्नावली रजिस्टर' },
  registryBody: { en: 'Validated instruments only, each with its licence. Gated ones are not used until the licence is in place.', ta: 'சரிபார்க்கப்பட்ட அளவுகருவிகள் மட்டும், ஒவ்வொன்றும் அதன் உரிமத்துடன். உரிமம் கிடைக்கும் வரை தடைசெய்யப்பட்டவை பயன்படுத்தப்படாது.', hi: 'सिर्फ़ प्रमाणित प्रश्नावलियाँ, हर एक अपने लाइसेंस के साथ। रोकी गई प्रश्नावलियाँ लाइसेंस मिलने तक इस्तेमाल नहीं होतीं।' },
  inUse: { en: 'In use', ta: 'பயன்பாட்டில்', hi: 'इस्तेमाल में' },
  gated: { en: 'Gated', ta: 'தடைசெய்யப்பட்டது', hi: 'रोका गया' },
  inReview: { en: 'In review', ta: 'மறுஆய்வில்', hi: 'समीक्षा में' },
  items: { en: ' items · {licence} · {tr}', ta: ' கேள்விகள் · {licence} · {tr}', hi: ' सवाल · {licence} · {tr}' },
  versions: { en: 'Method versions', ta: 'முறையின் பதிப்புகள்', hi: 'तरीके के संस्करण' },
  current: { en: 'Current', ta: 'நடப்பு', hi: 'मौजूदा' },
  calibrating: { en: 'Calibrating', ta: 'அளவுதிருத்தத்தில்', hi: 'कैलिब्रेशन जारी' },
  planned: { en: 'Planned', ta: 'திட்டமிடப்பட்டது', hi: 'योजना में' },
  neverRewrite: { en: 'A new version never rewrites an old score. Each score keeps the method it was made with.', ta: 'புதிய பதிப்பு பழைய மதிப்பெண்ணை ஒருபோதும் மாற்றி எழுதாது. ஒவ்வொரு மதிப்பெண்ணும் அது உருவான முறையையே வைத்திருக்கும்.', hi: 'नया संस्करण पुराना स्कोर कभी नहीं बदलता। हर स्कोर उसी तरीके के साथ रहता है जिससे वह बना था।' },
  rules: { en: 'Display rules', ta: 'காட்சி விதிகள்', hi: 'दिखाने के नियम' },
  never: { en: 'Never imported into the Index', ta: 'குறியீட்டில் ஒருபோதும் சேர்க்கப்படாதவை', hi: 'जो इंडेक्स में कभी नहीं आता' },
  neverBody: { en: 'Devices give us raw signals. Their own scores stay outside your number.', ta: 'சாதனங்கள் எங்களுக்கு மூலச் சமிக்ஞைகளைத் தருகின்றன. அவற்றின் சொந்த மதிப்பெண்கள் உங்கள் எண்ணுக்கு வெளியே இருக்கும்.', hi: 'डिवाइस हमें कच्चे संकेत देते हैं। उनके अपने स्कोर आपके नंबर से बाहर रहते हैं।' },
  ai: { en: 'What the AI may and may not do', ta: 'AI செய்யக்கூடியதும் செய்யக்கூடாததும்', hi: 'AI क्या कर सकता है और क्या नहीं' },
  tryA: { en: 'Five minutes, eighteen statements, ', ta: 'ஐந்து நிமிடங்கள், பதினெட்டு வாக்கியங்கள், ', hi: 'पाँच मिनट, अठारह कथन, ' },
  trySerif: { en: 'bands', ta: 'நிலைகள்', hi: 'सिर्फ़' },
  tryB: { en: ' only.', ta: ' மட்டும்.', hi: ' स्तर।' },
  tryBtn: { en: 'Try the method on yourself', ta: 'இந்த முறையை உங்கள் மீது முயன்று பாருங்கள்', hi: 'यह तरीका ख़ुद पर आज़माएँ' },
  published: { en: 'Published by the AIWO Science Office. Weights and λ are configuration, reviewed quarterly, with results published up and down.', ta: 'AIWO அறிவியல் அலுவலகம் வெளியிட்டது. எடைகளும் λ-வும் அமைப்பு மதிப்புகள், காலாண்டுதோறும் மறுஆய்வு செய்யப்படுகின்றன; முடிவுகள் ஏற்றமோ இறக்கமோ வெளியிடப்படுகின்றன.', hi: 'AIWO साइंस ऑफ़िस द्वारा प्रकाशित। वज़न और λ कॉन्फ़िगरेशन हैं, हर तिमाही समीक्षा होती है, और नतीजे ऊपर-नीचे दोनों प्रकाशित होते हैं।' },
} satisfies Dict

export const GRADE_TEXT: Record<string, { name: L3; what: L3; who: L3 }> = {
  check: { name: { en: 'Check', ta: 'செக்', hi: 'चेक' }, what: { en: '18 statements, five minutes, no login. Bands only, never a number.', ta: '18 வாக்கியங்கள், ஐந்து நிமிடங்கள், உள்நுழைவு இல்லை. நிலைகள் மட்டும், எண் ஒருபோதும் இல்லை.', hi: '18 कथन, पाँच मिनट, लॉगिन नहीं। सिर्फ़ स्तर, नंबर कभी नहीं।' }, who: { en: 'Anyone', ta: 'யார் வேண்டுமானாலும்', hi: 'कोई भी' } },
  index: { name: { en: 'Index grade', ta: 'குறியீட்டு நிலை', hi: 'इंडेक्स ग्रेड' }, what: { en: 'Validated instruments per term, about twenty minutes. A number, 0–100, with the method on it.', ta: 'ஒவ்வொரு அம்சத்துக்கும் சரிபார்க்கப்பட்ட அளவுகருவிகள், சுமார் இருபது நிமிடங்கள். முறையுடன் கூடிய 0–100 எண்.', hi: 'हर पहलू की प्रमाणित प्रश्नावलियाँ, लगभग बीस मिनट। तरीके के साथ एक नंबर, 0–100।' }, who: { en: 'Members', ta: 'உறுப்பினர்கள்', hi: 'सदस्य' } },
  clinical: { name: { en: 'Clinical grade', ta: 'மருத்துவ நிலை', hi: 'क्लिनिकल ग्रेड' }, what: { en: 'The Index plus panels, the capacity battery and a physician’s signature.', ta: 'குறியீட்டுடன் பரிசோதனைகள், திறன் சோதனைத் தொகுப்பு, மருத்துவரின் கையொப்பம்.', hi: 'इंडेक्स के साथ जाँचें, क्षमता परीक्षण और डॉक्टर के हस्ताक्षर।' }, who: { en: 'Clinical members', ta: 'மருத்துவ உறுப்பினர்கள்', hi: 'क्लिनिकल सदस्य' } },
}

export const RULES_TEXT: L3[] = [
  { en: 'Every score carries its method, grade, date and next measure.', ta: 'ஒவ்வொரு மதிப்பெண்ணும் அதன் முறை, நிலை, தேதி, அடுத்த அளவீட்டைக் கொண்டிருக்கும்.', hi: 'हर स्कोर के साथ उसका तरीका, ग्रेड, तारीख़ और अगला माप होता है।' },
  { en: 'Burden is hatched, never red. A fall is shown in ink, never in alarm colours.', ta: 'சுமை கோடிட்டுக் காட்டப்படும், சிவப்பில் ஒருபோதும் இல்லை. சரிவு மையில் காட்டப்படும், எச்சரிக்கை நிறங்களில் ஒருபோதும் இல்லை.', hi: 'बोझ धारियों से दिखता है, लाल रंग में कभी नहीं। गिरावट स्याही में दिखती है, ख़तरे वाले रंगों में कभी नहीं।' },
  { en: 'The lowest term is named; the others are not ranked.', ta: 'மிகக் குறைந்த அம்சம் சுட்டப்படும்; மற்றவை வரிசைப்படுத்தப்படாது.', hi: 'सबसे कमज़ोर पहलू का नाम बताया जाता है; बाक़ी की रैंकिंग नहीं होती।' },
  { en: 'No streaks, badges or league tables. Skipping is never counted.', ta: 'தொடர் எண்ணிக்கை, பதக்கங்கள், தரவரிசைப் பட்டியல்கள் இல்லை. தவிர்ப்பது ஒருபோதும் கணக்கிடப்படாது.', hi: 'न स्ट्रीक, न बैज, न लीग टेबल। छोड़ना कभी गिना नहीं जाता।' },
  { en: 'A fall at re-measure is told to you by a person before you see it.', ta: 'மறு அளவீட்டில் சரிவு இருந்தால், நீங்கள் பார்ப்பதற்கு முன் ஒரு மனிதர் உங்களிடம் சொல்வார்.', hi: 'दोबारा माप में गिरावट हो, तो आपके देखने से पहले कोई इंसान आपको बताता है।' },
]

export const NEVER_TEXT: L3[] = [
  { en: 'Vendor readiness, strain or recovery scores', ta: 'நிறுவனங்களின் readiness, strain அல்லது recovery மதிப்பெண்கள்', hi: 'कंपनियों के readiness, strain या recovery स्कोर' },
  { en: 'Biological or “body” age estimates', ta: 'உயிரியல் அல்லது “உடல்” வயது மதிப்பீடுகள்', hi: 'जैविक या “शरीर की” उम्र के अनुमान' },
  { en: 'Sleep scores from any device', ta: 'எந்தச் சாதனத்தின் உறக்க மதிப்பெண்களும்', hi: 'किसी भी डिवाइस के नींद स्कोर' },
  { en: 'Calendar contents (only summarised, then discarded)', ta: 'நாள்காட்டி உள்ளடக்கம் (சுருக்கப்பட்டு, பிறகு அழிக்கப்படும்)', hi: 'कैलेंडर की बातें (सिर्फ़ सार लिया जाता है, फिर मिटा दिया जाता है)' },
]

export const AI_TEXT: L3[] = [
  { en: 'VIVA explains your Index and today’s action. It never diagnoses or prescribes.', ta: 'VIVA உங்கள் குறியீட்டையும் இன்றைய செயலையும் விளக்குகிறது. அது ஒருபோதும் நோயறிவதோ மருந்து எழுதுவதோ இல்லை.', hi: 'VIVA आपका इंडेक्स और आज का काम समझाता है। यह कभी बीमारी नहीं बताता, न दवा लिखता है।' },
  { en: 'VIVA may draft a message; a named person reads and signs it.', ta: 'VIVA ஒரு செய்தியை வரைவு செய்யலாம்; ஒரு குறிப்பிட்ட மனிதர் அதைப் படித்துக் கையொப்பமிடுவார்.', hi: 'VIVA संदेश का मसौदा बना सकता है; एक तय व्यक्ति उसे पढ़कर हस्ताक्षर करता है।' },
  { en: 'Crisis language opens Tele-MANAS 14416 and a person, before anything else.', ta: 'நெருக்கடியைக் குறிக்கும் சொற்கள் வந்தால், எல்லாவற்றுக்கும் முன் Tele-MANAS 14416-உம் ஒரு மனிதரும் திறக்கப்படுவார்கள்.', hi: 'संकट वाले शब्दों पर, सबसे पहले Tele-MANAS 14416 और एक इंसान सामने आते हैं।' },
  { en: 'No model is trained on your record. Answers cite the method page.', ta: 'உங்கள் பதிவைக் கொண்டு எந்த மாடலும் பயிற்றுவிக்கப்படுவதில்லை. பதில்கள் முறைப் பக்கத்தைச் சுட்டுகின்றன.', hi: 'आपके रिकॉर्ड से कोई मॉडल नहीं सिखाया जाता। जवाब तरीके वाले पेज का हवाला देते हैं।' },
]

export const LICENCE_TEXT: Record<string, L3> = {
  'Author permission · pending': { en: 'Author permission · pending', ta: 'ஆசிரியர் அனுமதி · நிலுவையில்', hi: 'लेखक की अनुमति · बाकी' },
  'Free for research · commercial confirmed': { en: 'Free for research · commercial confirmed', ta: 'ஆய்வுக்கு இலவசம் · வணிகப் பயன்பாடு உறுதி', hi: 'रिसर्च के लिए मुफ़्त · व्यावसायिक उपयोग पक्का' },
  'Public domain': { en: 'Public domain', ta: 'பொதுக் களம்', hi: 'सार्वजनिक' },
  'Terms to confirm': { en: 'Terms to confirm', ta: 'நிபந்தனைகள் உறுதிசெய்யப்பட வேண்டும்', hi: 'शर्तें पक्की होनी बाकी' },
  'Free with attribution': { en: 'Free with attribution', ta: 'மூலம் குறிப்பிட்டால் இலவசம்', hi: 'श्रेय देकर मुफ़्त' },
  'Licence required': { en: 'Licence required', ta: 'உரிமம் தேவை', hi: 'लाइसेंस ज़रूरी' },
  'AHA · free': { en: 'AHA · free', ta: 'AHA · இலவசம்', hi: 'AHA · मुफ़्त' },
  'AIWO protocol': { en: 'AIWO protocol', ta: 'AIWO நெறிமுறை', hi: 'AIWO प्रोटोकॉल' },
  'EN · TA, HI in review': { en: 'EN · TA, HI in review', ta: 'EN · TA, HI மறுஆய்வில்', hi: 'EN · TA, HI समीक्षा में' },
}

export const METHOD_LABEL: Record<string, L3> = {
  'v1.0': { en: 'Method v1.0', ta: 'முறை v1.0', hi: 'तरीका v1.0' },
  'v1.1': { en: 'Method v1.1 (calibration)', ta: 'முறை v1.1 (அளவுதிருத்தம்)', hi: 'तरीका v1.1 (कैलिब्रेशन)' },
  'v2.0': { en: 'Index v2 (adaptive, <₹100)', ta: 'குறியீடு v2 (தகவமைப்பு, <₹100)', hi: 'इंडेक्स v2 (अनुकूली, <₹100)' },
}
