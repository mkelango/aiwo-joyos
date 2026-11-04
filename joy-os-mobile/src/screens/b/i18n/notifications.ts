import type { Dict } from '@/lib/i18n'
import type { L3 } from './common'

export const NOTIF = {
  eyebrow: { en: 'Notifications', ta: 'அறிவிப்புகள்', hi: 'नोटिफ़िकेशन' },
  titleA: { en: 'A few things, then ', ta: 'சில விஷயங்கள், பிறகு ', hi: 'कुछ बातें, फिर ' },
  titleSerif: { en: 'quiet', ta: 'அமைதி', hi: 'शांति' },
  titleB: { en: '.', ta: '.', hi: '।' },
  lead: { en: 'At most three a day, never in your quiet hours. A fall in your Index is never sent here; a person tells you.', ta: 'நாளுக்கு அதிகபட்சம் மூன்று, உங்கள் அமைதி நேரத்தில் ஒருபோதும் இல்லை. குறியீடு குறைந்தால் அது இங்கே ஒருபோதும் அனுப்பப்படாது; ஒரு மனிதர் உங்களிடம் சொல்வார்.', hi: 'दिन में ज़्यादा से ज़्यादा तीन, शांत समय में कभी नहीं। इंडेक्स गिरने की ख़बर यहाँ कभी नहीं आती; कोई इंसान आपको बताता है।' },
  notOpened: { en: '{n} not yet opened', ta: '{n} இன்னும் திறக்கப்படவில்லை', hi: '{n} अभी नहीं खोले' },
  allRead: { en: 'All read', ta: 'அனைத்தும் படிக்கப்பட்டன', hi: 'सब पढ़ लिए' },
  markAll: { en: 'Mark all read', ta: 'அனைத்தையும் படித்ததாகக் குறி', hi: 'सबको पढ़ा हुआ करें' },
  clear: { en: 'Clear', ta: 'அழி', hi: 'हटाएँ' },
  nothingNew: { en: 'Nothing new. We stay quiet by design.', ta: 'புதிதாக எதுவும் இல்லை. வேண்டுமென்றே நாங்கள் அமைதியாக இருக்கிறோம்.', hi: 'कुछ नया नहीं। हम जान-बूझकर शांत रहते हैं।' },
  showAgain: { en: 'Show recent again', ta: 'சமீபத்தியவற்றை மீண்டும் காட்டு', hi: 'हाल के फिर दिखाएँ' },
  Today: { en: 'Today', ta: 'இன்று', hi: 'आज' },
  Earlier: { en: 'Earlier', ta: 'முன்னதாக', hi: 'पहले' },
  newA11y: { en: 'New. ', ta: 'புதியது. ', hi: 'नया। ' },
  quietNowA: { en: 'Quiet now from ', ta: 'இப்போது அமைதி: ', hi: 'अभी शांत समय: ' },
  quietNowB: { en: ' until ', ta: ' முதல் ', hi: ' से ' },
  quietNowC: { en: '. {n} a day at most.', ta: ' வரை. நாளுக்கு அதிகபட்சம் {n}.', hi: ' तक। दिन में ज़्यादा से ज़्यादा {n}।' },
  savedLine: { en: 'Quiet from {from} until {to} · {n} a day. Settings shows the same.', ta: 'அமைதி {from} முதல் {to} வரை · நாளுக்கு {n}. அமைப்புகளிலும் இதுவே காட்டப்படும்.', hi: 'शांत समय {from} से {to} तक · दिन में {n}। सेटिंग्स में भी यही दिखेगा।' },
  noStreaks: { en: 'No streaks · no countdowns · no badges', ta: 'தொடர் எண்ணிக்கை இல்லை · கவுண்ட்டவுன் இல்லை · பதக்கங்கள் இல்லை', hi: 'न स्ट्रीक · न उलटी गिनती · न बैज' },
} satisfies Dict

export const NOTICE_TEXT: Record<string, { title: L3; body: L3; cta: L3; at?: L3 }> = {
  n1: { title: { en: 'Today’s action', ta: 'இன்றைய செயல்', hi: 'आज का काम' }, body: { en: 'Ten minutes on the verandah with tea. Notice three things.', ta: 'தேநீருடன் வராந்தாவில் பத்து நிமிடங்கள். மூன்று விஷயங்களைக் கவனியுங்கள்.', hi: 'बरामदे में चाय के साथ दस मिनट। तीन चीज़ों पर ध्यान दें।' }, cta: { en: 'Open Today', ta: 'இன்றைய பக்கத்தைத் திற', hi: 'आज वाला पेज खोलें' } },
  n2: { title: { en: 'Priya replied', ta: 'Priya பதிலளித்தார்', hi: 'Priya ने जवाब दिया' }, body: { en: 'Skipping is allowed — it is never counted against you…', ta: 'Skipping is allowed — it is never counted against you…', hi: 'Skipping is allowed — it is never counted against you…' }, cta: { en: 'Read the reply', ta: 'பதிலைப் படி', hi: 'जवाब पढ़ें' }, at: { en: 'Yesterday', ta: 'நேற்று', hi: 'कल' } },
  n7: { title: { en: 'Ravi wrote to you', ta: 'Ravi உங்களுக்கு எழுதினார்', hi: 'Ravi ने आपको लिखा' }, body: { en: 'Vanakkam, Lakshmi-amma. Arjun asked me to keep you a place…', ta: 'Vanakkam, Lakshmi-amma. Arjun asked me to keep you a place…', hi: 'Vanakkam, Lakshmi-amma. Arjun asked me to keep you a place…' }, cta: { en: 'Read the message', ta: 'செய்தியைப் படி', hi: 'संदेश पढ़ें' } },
  n3: { title: { en: 'Anything good in the last few hours?', ta: 'கடந்த சில மணிநேரங்களில் ஏதாவது நல்லது நடந்ததா?', hi: 'पिछले कुछ घंटों में कुछ अच्छा हुआ?' }, body: { en: 'Ten seconds for the Joy Ledger.', ta: 'ஜாய் லெட்ஜருக்குப் பத்து விநாடிகள்.', hi: 'जॉय लेजर के लिए दस सेकंड।' }, cta: { en: 'Add to the Ledger', ta: 'லெட்ஜரில் சேர்', hi: 'लेजर में जोड़ें' } },
  n4: { title: { en: 'Circle on Monday, 19:00', ta: 'திங்கள் வட்டம், 19:00', hi: 'सोमवार को सर्कल, 19:00' }, body: { en: 'Week 4 · Don’t Postpone Joy. Thirty minutes with the same eight.', ta: 'வாரம் 4 · மகிழ்ச்சியைத் தள்ளிப்போடாதீர்கள். அதே எட்டுப் பேருடன் முப்பது நிமிடங்கள்.', hi: 'हफ़्ता 4 · ख़ुशी को टालें नहीं। उन्हीं आठ लोगों के साथ तीस मिनट।' }, cta: { en: 'See the circle', ta: 'வட்டத்தைப் பார்', hi: 'सर्कल देखें' }, at: { en: 'Yesterday', ta: 'நேற்று', hi: 'कल' } },
  n5: { title: { en: 'Your January panel is signed', ta: 'உங்கள் ஜனவரி பரிசோதனை முடிவுகளில் கையொப்பமிடப்பட்டது', hi: 'आपकी जनवरी की जाँच पर हस्ताक्षर हो गए' }, body: { en: 'Dr Meera Iyer signed it with a note in plain words.', ta: 'Dr Meera Iyer எளிய சொற்களில் ஒரு குறிப்புடன் கையொப்பமிட்டார்.', hi: 'Dr Meera Iyer ने सीधे शब्दों में एक नोट के साथ हस्ताक्षर किए।' }, cta: { en: 'See results', ta: 'முடிவுகளைப் பார்', hi: 'नतीजे देखें' } },
  n6: { title: { en: 'The Joyspan Letter · Winter', ta: 'ஜாய்ஸ்பான் கடிதம் · குளிர்காலம்', hi: 'जॉयस्पैन लेटर · सर्दी' }, body: { en: 'Published results, up and down, and what we changed.', ta: 'வெளியிடப்பட்ட முடிவுகள், ஏற்றமும் இறக்கமும், நாங்கள் மாற்றியவையும்.', hi: 'प्रकाशित नतीजे, ऊपर और नीचे, और हमने क्या बदला।' }, cta: { en: 'Read the method', ta: 'முறையைப் படி', hi: 'तरीका पढ़ें' } },
}
