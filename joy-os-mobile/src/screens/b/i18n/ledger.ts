import type { Dict } from '@/lib/i18n'
import type { L3 } from './common'

export const LEDGER = {
  eyebrow: { en: 'Joy Ledger · prompt {n} of 3 · {time}', ta: 'ஜாய் லெட்ஜர் · கேள்வி {n} / 3 · {time}', hi: 'जॉय लेजर · सवाल {n} / 3 · {time}' },
  errTag: { en: 'Choose at least one tag, or tap “Nothing just now”.', ta: 'குறைந்தது ஒரு குறிச்சொல்லைத் தேர்ந்தெடுங்கள், அல்லது “இப்போது எதுவும் இல்லை” என்பதைத் தட்டுங்கள்.', hi: 'कम से कम एक टैग चुनें, या “अभी कुछ नहीं” पर टैप करें।' },
  where: { en: 'Where was it? Up to three', ta: 'எங்கே இருந்தது? மூன்று வரை', hi: 'कहाँ था? तीन तक' },
  word: { en: 'A word or a few · optional', ta: 'ஒரு சொல் அல்லது சில · விருப்பத்தேர்வு', hi: 'एक-दो शब्द · वैकल्पिक' },
  wordPh: { en: 'Lunch with Kavya', ta: 'Kavya-வுடன் மதிய உணவு', hi: 'Kavya के साथ लंच' },
  wordPhOwn: { en: 'Lunch with a friend', ta: 'நண்பருடன் மதிய உணவு', hi: 'दोस्त के साथ लंच' },
  photo: { en: 'Photo attached', ta: 'புகைப்படம் இணைக்கப்பட்டது', hi: 'फ़ोटो जुड़ी है' },
  photoKept: { en: 'Kept on this phone with the moment.', ta: 'அந்தத் தருணத்துடன் இந்தத் தொலைபேசியில் வைக்கப்பட்டது.', hi: 'उस पल के साथ इसी फ़ोन पर रखी गई।' },
  removePhoto: { en: 'Remove the photo', ta: 'புகைப்படத்தை நீக்கு', hi: 'फ़ोटो हटाएँ' },
  addPhotoHint: { en: 'Attaches a photo to this moment', ta: 'இந்தத் தருணத்துடன் ஒரு புகைப்படத்தை இணைக்கும்', hi: 'इस पल के साथ एक फ़ोटो जोड़ता है' },
  addPhoto: { en: 'Add a photo · optional', ta: 'புகைப்படம் சேர் · விருப்பத்தேர்வு', hi: 'फ़ोटो जोड़ें · वैकल्पिक' },
  saveHint: { en: 'Saves this moment to your Joy Ledger', ta: 'இந்தத் தருணத்தை உங்கள் ஜாய் லெட்ஜரில் சேமிக்கும்', hi: 'इस पल को आपके जॉय लेजर में सेव करता है' },
  save: { en: 'Save · 10 seconds', ta: 'சேமி · 10 விநாடிகள்', hi: 'सेव करें · 10 सेकंड' },
  nothing: { en: 'Nothing just now', ta: 'இப்போது எதுவும் இல்லை', hi: 'अभी कुछ नहीं' },
  keptA: { en: 'Kept. ', ta: 'சேமிக்கப்பட்டது. ', hi: 'रख लिया। ' },
  keptSerif: { en: 'Thank you.', ta: 'நன்றி.', hi: 'शुक्रिया।' },
  fine: { en: 'That’s fine. The next prompt is at {time}.', ta: 'பரவாயில்லை. அடுத்த கேள்வி {time} மணிக்கு.', hi: 'कोई बात नहीं। अगला सवाल {time} बजे।' },
  withPhoto: { en: ' · with a photo', ta: ' · புகைப்படத்துடன்', hi: ' · फ़ोटो के साथ' },
  savedSync: { en: '. Saved on this phone; it syncs when you are online.', ta: '. இந்தத் தொலைபேசியில் சேமிக்கப்பட்டது; இணைப்பு வந்ததும் ஒத்திசையும்.', hi: '। इसी फ़ोन पर सेव; ऑनलाइन होने पर सिंक होगा।' },
  emptyOk: { en: 'An empty few hours is not a missed day. Nothing is counted against you.', ta: 'சில மணிநேரங்கள் எதுவும் இல்லாமல் போனால் அது தவறிய நாள் அல்ல. எதுவும் உங்களுக்கு எதிராகக் கணக்கிடப்படாது.', hi: 'कुछ घंटे ख़ाली जाना, छूटा हुआ दिन नहीं है। कुछ भी आपके ख़िलाफ़ नहीं गिना जाता।' },
  addAnother: { en: 'Add another moment', ta: 'இன்னொரு தருணத்தைச் சேர்', hi: 'एक और पल जोड़ें' },
  actually: { en: 'Actually, there was something', ta: 'உண்மையில், ஒன்று இருந்தது', hi: 'असल में, कुछ था' },
  thisWeek: { en: 'This week · where joy came from', ta: 'இந்த வாரம் · மகிழ்ச்சி எங்கிருந்து வந்தது', hi: 'इस हफ़्ते · ख़ुशी कहाँ से आई' },
  byTagA: { en: 'Moments by tag, Monday to today. ', ta: 'குறிச்சொல் வாரியாகத் தருணங்கள், திங்கள் முதல் இன்று வரை. இதுவரை ', hi: 'टैग के हिसाब से पल, सोमवार से आज तक। अब तक ' },
  // An account with no seeded week: one tag so far, or none.
  byTagOne: { en: ' so far; all from {a}.', ta: '; அனைத்தும் {a} இலிருந்து.', hi: '; सब {a} से।' },
  weekNone: { en: 'Nothing kept this week yet, and that is fine. The moments you keep here show by tag.', ta: 'இந்த வாரம் இன்னும் எதுவும் வைக்கப்படவில்லை, அது பரவாயில்லை. நீங்கள் வைக்கும் தருணங்கள் இங்கே குறிச்சொல் வாரியாகக் காட்டப்படும்.', hi: 'इस हफ़्ते अभी कुछ नहीं रखा गया, और यह ठीक है। आप जो पल रखेंगे, वे यहाँ टैग के हिसाब से दिखेंगे।' },
  recentNone: { en: 'No moments yet. The first one you keep shows here.', ta: 'இன்னும் தருணங்கள் இல்லை. நீங்கள் வைக்கும் முதல் தருணம் இங்கே தெரியும்.', hi: 'अभी कोई पल नहीं। आपका रखा पहला पल यहाँ दिखेगा।' },
  byTagB: { en: ' so far; most from {a} and {b}.', ta: '; பெரும்பாலும் {a}, {b} இலிருந்து.', hi: '; सबसे ज़्यादा {a} और {b} से।' },
  fourWeeks: { en: 'Four weeks', ta: 'நான்கு வாரங்கள்', hi: 'चार हफ़्ते' },
  dotsBody: { en: 'Each dot is a day, Monday to Sunday; larger means more moments. Empty days are part of it.', ta: 'ஒவ்வொரு புள்ளியும் ஒரு நாள், திங்கள் முதல் ஞாயிறு வரை; பெரியது என்றால் அதிகத் தருணங்கள். காலியான நாட்களும் இதன் பகுதியே.', hi: 'हर बिंदु एक दिन है, सोमवार से रविवार; बड़ा मतलब ज़्यादा पल। ख़ाली दिन भी इसका हिस्सा हैं।' },
  calA11y: { en: 'Joy Ledger, Daily Pleasure, the last four weeks: {days} of {total} days with at least one moment, {n} moments in all.', ta: 'ஜாய் லெட்ஜர், தினசரி மகிழ்ச்சி, கடந்த நான்கு வாரங்கள்: {total} நாட்களில் {days} நாட்களில் குறைந்தது ஒரு தருணம், மொத்தம் {n} தருணங்கள்.', hi: 'जॉय लेजर, रोज़ का आनंद, पिछले चार हफ़्ते: {total} में से {days} दिनों में कम से कम एक पल, कुल {n} पल।' },
  todayRing: { en: 'The dashed ring is today: {n} {unit} so far.', ta: 'கோடிட்ட வட்டம் இன்று: இதுவரை {n} {unit}.', hi: 'धारीदार घेरा आज है: अब तक {n} {unit}।' },
  moment: { en: 'moment', ta: 'தருணம்', hi: 'पल' },
  moments: { en: 'moments', ta: 'தருணங்கள்', hi: 'पल' },
  todayNone: { en: 'The dashed ring is today. Nothing yet, and that is fine.', ta: 'கோடிட்ட வட்டம் இன்று. இன்னும் எதுவும் இல்லை, அது பரவாயில்லை.', hi: 'धारीदार घेरा आज है। अभी कुछ नहीं, और यह ठीक है।' },
  recent: { en: 'Recent moments', ta: 'சமீபத்திய தருணங்கள்', hi: 'हाल के पल' },
  withAPhoto: { en: 'With a photo', ta: 'புகைப்படத்துடன்', hi: 'फ़ोटो के साथ' },
  whenPrompts: { en: 'When the prompts come', ta: 'கேள்விகள் எப்போது வரும்', hi: 'सवाल कब आते हैं' },
  now: { en: 'Now', ta: 'இப்போது', hi: 'अभी' },
  quietLine: { en: 'Quiet hours {from} – {to}. ', ta: 'அமைதி நேரம் {from} – {to}. ', hi: 'शांत समय {from} – {to}। ' },
  waOn: { en: 'Prompts also come by WhatsApp, never clinical content.', ta: 'கேள்விகள் WhatsApp-இலும் வரும், மருத்துவத் தகவல் ஒருபோதும் இல்லை.', hi: 'सवाल WhatsApp पर भी आते हैं, इलाज से जुड़ी बात कभी नहीं।' },
  waOff: { en: 'WhatsApp prompts are off until you allow them.', ta: 'நீங்கள் அனுமதிக்கும் வரை WhatsApp கேள்விகள் அணைக்கப்பட்டிருக்கும்.', hi: 'जब तक आप अनुमति न दें, WhatsApp पर सवाल बंद हैं।' },
  newTimes: { en: 'Saved. New times start with the next prompt.', ta: 'சேமிக்கப்பட்டது. புதிய நேரங்கள் அடுத்த கேள்வியிலிருந்து தொடங்கும்.', hi: 'सेव हो गया। नए समय अगले सवाल से लागू होंगे।' },
  changeTimes: { en: 'Change the times', ta: 'நேரங்களை மாற்று', hi: 'समय बदलें' },
  saveTimes: { en: 'Save these times', ta: 'இந்த நேரங்களைச் சேமி', hi: 'ये समय सेव करें' },
  sheetBody: { en: 'Three light prompts a day. Move each one in fifteen-minute steps; they stay at least an hour apart.', ta: 'நாளுக்கு மூன்று இலகுவான கேள்விகள். ஒவ்வொன்றையும் பதினைந்து நிமிடப் படிகளில் நகர்த்தலாம்; அவை குறைந்தது ஒரு மணிநேர இடைவெளியில் இருக்கும்.', hi: 'दिन में तीन हल्के सवाल। हर एक को पंद्रह-पंद्रह मिनट आगे-पीछे करें; उनके बीच कम से कम एक घंटे का फ़ासला रहता है।' },
  promptN: { en: 'Prompt {n}', ta: 'கேள்வி {n}', hi: 'सवाल {n}' },
  earlier: { en: 'Prompt {n} fifteen minutes earlier', ta: 'கேள்வி {n} பதினைந்து நிமிடம் முன்னதாக', hi: 'सवाल {n} पंद्रह मिनट पहले' },
  later: { en: 'Prompt {n} fifteen minutes later', ta: 'கேள்வி {n} பதினைந்து நிமிடம் தாமதமாக', hi: 'सवाल {n} पंद्रह मिनट बाद' },
  lastBefore: { en: 'The last prompt stays before quiet hours begin at {from}.', ta: 'கடைசிக் கேள்வி, {from} மணிக்கு அமைதி நேரம் தொடங்கும் முன்பே இருக்கும்.', hi: 'आख़िरी सवाल {from} बजे शांत समय शुरू होने से पहले रहता है।' },
} satisfies Dict

export const WEEKDAY_LETTERS: Record<'en' | 'ta' | 'hi', string[]> = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  ta: ['தி', 'செ', 'பு', 'வி', 'வெ', 'ச', 'ஞா'],
  hi: ['सो', 'मं', 'बु', 'गु', 'शु', 'श', 'र'],
}

/** The three prompt slots, by prompt number. */
export const SCHEDULE_LABEL: Record<number, L3> = {
  1: { en: 'After lunch', ta: 'மதிய உணவுக்குப் பின்', hi: 'लंच के बाद' },
  2: { en: 'Late afternoon', ta: 'பிற்பகல் கடைசியில்', hi: 'देर दोपहर' },
  3: { en: 'Before the wind-down', ta: 'ஓய்வுக்கு முன்', hi: 'सोने की तैयारी से पहले' },
}
