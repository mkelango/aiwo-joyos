import { useApp, type Lang } from '@/lib/store'
import { useDict, type Dict } from '@/lib/i18n'

// Lane B shared copy: chrome repeated across the stack screens, plus helpers for data that
// stays in English files (roles, tags) and is translated here by its English key or id.
// English is exactly what the screens showed before; Tamil and Hindi sit beside it.

export type L3 = Record<Lang, string>

/** Pick the member's language from a { en, ta, hi } record, falling back to the English data. */
export function useTx() {
  const { lang } = useApp()
  return (r: L3 | undefined, fallback: string) => (lang === 'en' || !r ? fallback : r[lang] ?? fallback)
}

export const COMMON = {
  back: { en: 'Back', ta: 'பின்செல்', hi: 'वापस' },
  close: { en: 'Close', ta: 'மூடு', hi: 'बंद करें' },
  done: { en: 'Done', ta: 'முடிந்தது', hi: 'हो गया' },
  cancel: { en: 'Cancel', ta: 'ரத்துசெய்', hi: 'रद्द करें' },
  continue: { en: 'Continue', ta: 'தொடரவும்', hi: 'आगे बढ़ें' },
  next: { en: 'Next', ta: 'அடுத்து', hi: 'आगे' },
  edit: { en: 'Edit', ta: 'மாற்று', hi: 'बदलें' },
  save: { en: 'Save', ta: 'சேமி', hi: 'सेव करें' },
  saved: { en: 'Saved', ta: 'சேமிக்கப்பட்டது', hi: 'सेव हो गया' },
  keepIt: { en: 'Keep it', ta: 'அப்படியே வைத்திருங்கள்', hi: 'रहने दें' },
  crisis: { en: 'Need to talk now? Tele-MANAS 14416', ta: 'இப்போதே யாரிடமாவது பேச வேண்டுமா? Tele-MANAS 14416', hi: 'अभी किसी से बात करनी है? Tele-MANAS 14416' },
  goToday: { en: 'Go to Today', ta: 'இன்றைய பக்கத்துக்குச் செல்லவும்', hi: 'आज वाले पेज पर जाएँ' },
  backToday: { en: 'Back to Today', ta: 'இன்றைய பக்கத்துக்குத் திரும்பு', hi: 'आज वाले पेज पर लौटें' },
  signOut: { en: 'Sign out', ta: 'வெளியேறு', hi: 'साइन आउट करें' },
  signOutQ: { en: 'Sign out?', ta: 'வெளியேற வேண்டுமா?', hi: 'साइन आउट करें?' },
  staySignedIn: { en: 'Stay signed in', ta: 'உள்நுழைந்தே இருங்கள்', hi: 'साइन इन रहें' },
  name: { en: 'Name', ta: 'பெயர்', hi: 'नाम' },
  email: { en: 'Email', ta: 'மின்னஞ்சல்', hi: 'ईमेल' },
  language: { en: 'Language', ta: 'மொழி', hi: 'भाषा' },
  quietHours: { en: 'Quiet hours', ta: 'அமைதி நேரம்', hi: 'शांत समय' },
  remindersADay: { en: 'Reminders a day', ta: 'ஒரு நாளில் நினைவூட்டல்கள்', hi: 'दिन में रिमाइंडर' },
  howToReach: { en: 'How to reach you', ta: 'உங்களை எப்படித் தொடர்புகொள்வது', hi: 'आप तक कैसे पहुँचें' },
  from: { en: 'From', ta: 'தொடக்கம்', hi: 'से' },
  until: { en: 'Until', ta: 'வரை', hi: 'तक' },
  quietException: { en: 'The only exception: if you ever ask for help, a person can reach you at any hour.', ta: 'ஒரே விதிவிலக்கு: நீங்கள் எப்போதாவது உதவி கேட்டால், ஒருவர் எந்த நேரத்திலும் உங்களைத் தொடர்புகொள்ளலாம்.', hi: 'बस एक अपवाद: अगर आप कभी मदद माँगें, तो कोई व्यक्ति किसी भी समय आप तक पहुँच सकता है।' },
  quietExceptionShort: { en: 'If you ever ask for help, a person can reach you at any hour.', ta: 'நீங்கள் எப்போதாவது உதவி கேட்டால், ஒருவர் எந்த நேரத்திலும் உங்களைத் தொடர்புகொள்ளலாம்.', hi: 'अगर आप कभी मदद माँगें, तो कोई व्यक्ति किसी भी समय आप तक पहुँच सकता है।' },
  per0: { en: 'None. You open Joy OS when you choose.', ta: 'எதுவும் இல்லை. நீங்கள் விரும்பும்போது Joy OS-ஐத் திறக்கலாம்.', hi: 'कोई नहीं। जब मन हो, आप Joy OS खोलें।' },
  per1: { en: 'One: today’s action, in the morning.', ta: 'ஒன்று: இன்றைய செயல், காலையில்.', hi: 'एक: आज का काम, सुबह।' },
  per2: { en: 'Two: today’s action, and one Joy Ledger prompt.', ta: 'இரண்டு: இன்றைய செயல், மற்றும் ஒரு ஜாய் லெட்ஜர் கேள்வி.', hi: 'दो: आज का काम, और जॉय लेजर का एक सवाल।' },
  per3: { en: 'Three: today’s action and two Ledger prompts. Never more.', ta: 'மூன்று: இன்றைய செயல் மற்றும் இரண்டு லெட்ஜர் கேள்விகள். இதற்கு மேல் ஒருபோதும் இல்லை.', hi: 'तीन: आज का काम और लेजर के दो सवाल। इससे ज़्यादा कभी नहीं।' },
  chApp: { en: 'App notifications', ta: 'ஆப் அறிவிப்புகள்', hi: 'ऐप नोटिफ़िकेशन' },
  chAppD: { en: 'Today’s action and Ledger prompts.', ta: 'இன்றைய செயலும் லெட்ஜர் கேள்விகளும்.', hi: 'आज का काम और लेजर के सवाल।' },
  chWa: { en: 'WhatsApp', ta: 'WhatsApp', hi: 'WhatsApp' },
  chWaD: { en: 'Ledger prompts and reminders only. Never clinical content.', ta: 'லெட்ஜர் கேள்விகளும் நினைவூட்டல்களும் மட்டும். மருத்துவத் தகவல் ஒருபோதும் இல்லை.', hi: 'सिर्फ़ लेजर के सवाल और रिमाइंडर। इलाज से जुड़ी बात कभी नहीं।' },
  chEmail: { en: 'Email', ta: 'மின்னஞ்சல்', hi: 'ईमेल' },
  chEmailD: { en: 'The quarterly Joyspan Letter and receipts.', ta: 'காலாண்டு ஜாய்ஸ்பான் கடிதமும் ரசீதுகளும்.', hi: 'हर तिमाही का जॉयस्पैन लेटर और रसीदें।' },
  kAction: { en: 'Today’s action', ta: 'இன்றைய செயல்', hi: 'आज का काम' },
  kActionD: { en: 'One a day, at a time that fits your calendar.', ta: 'நாளுக்கு ஒன்று, உங்கள் நாள்காட்டிக்கு ஏற்ற நேரத்தில்.', hi: 'दिन में एक, आपके कैलेंडर के हिसाब से सही समय पर।' },
  kLedger: { en: 'Joy Ledger prompts', ta: 'ஜாய் லெட்ஜர் கேள்விகள்', hi: 'जॉय लेजर के सवाल' },
  kLedgerD: { en: 'Ten seconds: anything good in the last few hours?', ta: 'பத்து விநாடிகள்: கடந்த சில மணிநேரங்களில் ஏதாவது நல்லது நடந்ததா?', hi: 'दस सेकंड: पिछले कुछ घंटों में कुछ अच्छा हुआ?' },
  kCircle: { en: 'Circle reminder', ta: 'வட்ட நினைவூட்டல்', hi: 'सर्कल रिमाइंडर' },
  kCircleD: { en: 'Monday, an hour before the call.', ta: 'திங்கள், அழைப்புக்கு ஒரு மணிநேரம் முன்.', hi: 'सोमवार, कॉल से एक घंटा पहले।' },
  kLetter: { en: 'The Joyspan Letter', ta: 'ஜாய்ஸ்பான் கடிதம்', hi: 'जॉयस्पैन लेटर' },
  kLetterD: { en: 'Quarterly, by email.', ta: 'காலாண்டுக்கு ஒருமுறை, மின்னஞ்சலில்.', hi: 'हर तिमाही, ईमेल से।' },
  quietErrSame: { en: 'Quiet hours need a different start and end time.', ta: 'அமைதி நேரத்துக்குத் தொடக்கமும் முடிவும் வேறு வேறாக இருக்க வேண்டும்.', hi: 'शांत समय के शुरू और ख़त्म होने का समय अलग होना चाहिए।' },
  quietErrChannel: { en: 'Choose at least one way to hear from us, or set reminders to none.', ta: 'நாங்கள் உங்களைத் தொடர்புகொள்ள குறைந்தது ஒரு வழியைத் தேர்ந்தெடுங்கள், அல்லது நினைவூட்டல்களை "எதுவும் இல்லை" என வையுங்கள்.', hi: 'हमसे ख़बर पाने का कम से कम एक तरीका चुनें, या रिमाइंडर शून्य कर दें।' },
  specimen: { en: 'Specimen', ta: 'மாதிரி', hi: 'नमूना' },
  clinical: { en: 'Clinical', ta: 'மருத்துவம்', hi: 'क्लिनिकल' },
  you: { en: 'You', ta: 'நீங்கள்', hi: 'आप' },
  and: { en: ' and ', ta: ' மற்றும் ', hi: ' और ' },
  allSix: { en: 'All six terms', ta: 'ஆறு அம்சங்களும்', hi: 'सभी छह पहलू' },
} satisfies Dict

export const useCommon = () => useDict(COMMON)

/** validatePrefs() returns the English message; this gives the member's language for it. */
export function usePrefsError() {
  const t = useCommon()
  return (err: string | null) => (err === COMMON.quietErrSame.en ? t('quietErrSame') : err === COMMON.quietErrChannel.en ? t('quietErrChannel') : err)
}

export const perDayKey = (n: number) => (n === 0 ? 'per0' : n === 1 ? 'per1' : n === 2 ? 'per2' : 'per3') as 'per0' | 'per1' | 'per2' | 'per3'

/** People's roles and access-log roles, by their English value. */
export const ROLE: Record<string, L3> = {
  Coach: { en: 'Coach', ta: 'பயிற்சியாளர்', hi: 'कोच' },
  Physician: { en: 'Physician', ta: 'மருத்துவர்', hi: 'डॉक्टर' },
  Psychologist: { en: 'Psychologist', ta: 'உளவியலாளர்', hi: 'मनोवैज्ञानिक' },
  Concierge: { en: 'Concierge', ta: 'கான்சியர்ஜ்', hi: 'कंसीयर्ज' },
  System: { en: 'System', ta: 'அமைப்பு', hi: 'सिस्टम' },
  Research: { en: 'Research', ta: 'ஆய்வு', hi: 'रिसर्च' },
  Household: { en: 'Household', ta: 'குடும்பம்', hi: 'परिवार' },
  Venue: { en: 'Venue', ta: 'தங்குமிடம்', hi: 'वेन्यू' },
  Partner: { en: 'Partner', ta: 'வாழ்க்கைத் துணை', hi: 'जीवनसाथी' },
  You: { en: 'You', ta: 'நீங்கள்', hi: 'आप' },
  'Mother · elder mode': { en: 'Mother · elder mode', ta: 'அம்மா · மூத்தோர் பயன்முறை', hi: 'माँ · बुज़ुर्ग मोड' },
}

/** Joy Ledger tags, by their English value (the stored tag stays English). */
export const LEDGER_TAG: Record<string, L3> = {
  People: { en: 'People', ta: 'மனிதர்கள்', hi: 'लोग' },
  Food: { en: 'Food', ta: 'உணவு', hi: 'खाना' },
  Movement: { en: 'Movement', ta: 'உடலசைவு', hi: 'चलना-फिरना' },
  Beauty: { en: 'Beauty', ta: 'அழகு', hi: 'सुंदरता' },
  Learning: { en: 'Learning', ta: 'கற்றல்', hi: 'सीखना' },
  Rest: { en: 'Rest', ta: 'ஓய்வு', hi: 'आराम' },
  Nature: { en: 'Nature', ta: 'இயற்கை', hi: 'प्रकृति' },
  Music: { en: 'Music', ta: 'இசை', hi: 'संगीत' },
  Work: { en: 'Work', ta: 'வேலை', hi: 'काम' },
  Faith: { en: 'Faith', ta: 'நம்பிக்கை', hi: 'आस्था' },
}

/** Band words for screens that print a band themselves. */
export const BAND: Record<'steady' | 'uneven' | 'thin', L3> = {
  steady: { en: 'steady', ta: 'சீரானது', hi: 'स्थिर' },
  uneven: { en: 'uneven', ta: 'சீரற்றது', hi: 'असमान' },
  thin: { en: 'thin', ta: 'குறைவு', hi: 'कम' },
}

/** The eight Joyspiration Practice week titles, by week number. */
export const PRACTICE_TITLE: Record<number, L3> = {
  1: { en: 'The Check, the Index and the story', ta: 'செக், குறியீடு, கதை', hi: 'चेक, इंडेक्स और कहानी' },
  2: { en: 'The Tomorrow Question', ta: 'நாளைய கேள்வி', hi: 'कल का सवाल' },
  3: { en: 'Release the Ledger', ta: 'கணக்கை விடுவியுங்கள்', hi: 'हिसाब छोड़ दें' },
  4: { en: 'Don’t Postpone Joy', ta: 'மகிழ்ச்சியைத் தள்ளிப்போடாதீர்கள்', hi: 'ख़ुशी को मत टालिए' },
  5: { en: 'Continuous Correction', ta: 'தொடர்ச்சியான திருத்தம்', hi: 'लगातार सुधार' },
  6: { en: 'The Two Questions', ta: 'இரண்டு கேள்விகள்', hi: 'दो सवाल' },
  7: { en: 'Stay Curious · Own Your Emotional Life', ta: 'ஆர்வத்துடன் இருங்கள் · உங்கள் உணர்வு வாழ்க்கை உங்களுடையது', hi: 'जिज्ञासु रहें · अपनी भावनाओं की बागडोर ख़ुद थामें' },
  8: { en: 'Re-take the Index; the next ninety days', ta: 'குறியீட்டை மீண்டும் எடுங்கள்; அடுத்த தொண்ணூறு நாட்கள்', hi: 'इंडेक्स दोबारा दें; अगले नब्बे दिन' },
}

/** A language's name in the member's current language, shown under its native name in the pickers. */
export const LANG_LABEL: Record<Lang, Record<Lang, string>> = {
  en: { en: 'English', ta: 'Tamil', hi: 'Hindi' },
  ta: { en: 'ஆங்கிலம்', ta: 'தமிழ்', hi: 'இந்தி' },
  hi: { en: 'अंग्रेज़ी', ta: 'तमिल', hi: 'हिन्दी' },
}
