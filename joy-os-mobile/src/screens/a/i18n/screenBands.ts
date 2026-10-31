import { dict } from './make'

// src/screens/a/spacesData.ts SCREEN_META band labels and result copy (PHQ-4, ISI, PSS-4, pain).
// Same wording as joy-os-web/src/routes/member/spaces/_i18n.ts. The routing logic still
// reads the English copy. Clinical Office sign-off of the translations is pending.
export const SCREEN_BANDS = dict({
  Mild: ['லேசானது', 'हल्का'],
  Severe: ['தீவிரமானது', 'गंभीर'],
  Subthreshold: ['எல்லைக்குக் கீழ்', 'सीमा से नीचे'],
  Lower: ['குறைவு', 'कम'],
  Higher: ['அதிகம்', 'ज़्यादा'],
  None: ['இல்லை', 'कोई नहीं'],
  'Usual range': ['வழக்கமான வரம்பு', 'सामान्य दायरा'],
  'No clinically significant insomnia': ['மருத்துவ ரீதியாகக் குறிப்பிடத்தக்க தூக்கமின்மை இல்லை', 'चिकित्सकीय रूप से अहम अनिद्रा नहीं'],
  'Your answers are within the usual range.': ['உங்கள் பதில்கள் வழக்கமான வரம்புக்குள் உள்ளன.', 'आपके जवाब सामान्य दायरे में हैं।'],
  'Your answers suggest mild distress. We will ask again in two weeks.': ['உங்கள் பதில்கள் லேசான மன உளைச்சலைக் காட்டுகின்றன. இரண்டு வாரங்களில் மீண்டும் கேட்போம்.', 'आपके जवाब हल्की परेशानी की ओर इशारा करते हैं। हम दो हफ़्ते में फिर पूछेंगे।'],
  'Your answers suggest moderate distress. A clinician will review them within 48 hours.': ['உங்கள் பதில்கள் மிதமான மன உளைச்சலைக் காட்டுகின்றன. 48 மணி நேரத்துக்குள் ஒரு மருத்துவ நிபுணர் இவற்றைப் பரிசீலிப்பார்.', 'आपके जवाब मध्यम परेशानी की ओर इशारा करते हैं। 48 घंटे के भीतर एक क्लिनिशियन इन्हें देखेंगे।'],
  'Your answers suggest severe distress. A clinician will call you today.': ['உங்கள் பதில்கள் தீவிரமான மன உளைச்சலைக் காட்டுகின்றன. இன்றே ஒரு மருத்துவ நிபுணர் உங்களை அழைப்பார்.', 'आपके जवाब गंभीर परेशानी की ओर इशारा करते हैं। एक क्लिनिशियन आज ही आपको फ़ोन करेंगे।'],
  'Your answers do not suggest clinically significant insomnia.': ['உங்கள் பதில்கள் மருத்துவ ரீதியாகக் குறிப்பிடத்தக்க தூக்கமின்மையைக் காட்டவில்லை.', 'आपके जवाब चिकित्सकीय रूप से अहम अनिद्रा की ओर इशारा नहीं करते।'],
  'Your answers suggest some difficulty with sleep. The sleep plan is a good place to start.': ['உங்கள் பதில்கள் தூக்கத்தில் சிறிது சிரமம் இருப்பதைக் காட்டுகின்றன. தூக்கத் திட்டம் தொடங்க நல்ல இடம்.', 'आपके जवाब नींद में कुछ दिक़्क़त दिखाते हैं। नींद की योजना शुरुआत के लिए अच्छी जगह है।'],
  'Your answers suggest moderate insomnia. A clinician will review them within 48 hours.': ['உங்கள் பதில்கள் மிதமான தூக்கமின்மையைக் காட்டுகின்றன. 48 மணி நேரத்துக்குள் ஒரு மருத்துவ நிபுணர் இவற்றைப் பரிசீலிப்பார்.', 'आपके जवाब मध्यम अनिद्रा दिखाते हैं। 48 घंटे के भीतर एक क्लिनिशियन इन्हें देखेंगे।'],
  'Your answers suggest severe insomnia. A clinician will review them within 48 hours.': ['உங்கள் பதில்கள் தீவிரமான தூக்கமின்மையைக் காட்டுகின்றன. 48 மணி நேரத்துக்குள் ஒரு மருத்துவ நிபுணர் இவற்றைப் பரிசீலிப்பார்.', 'आपके जवाब गंभीर अनिद्रा दिखाते हैं। 48 घंटे के भीतर एक क्लिनिशियन इन्हें देखेंगे।'],
  'Your answers suggest lower perceived stress.': ['உங்கள் பதில்கள் குறைவான மன அழுத்தத்தைக் காட்டுகின்றன.', 'आपके जवाब कम तनाव दिखाते हैं।'],
  'Your answers suggest moderate perceived stress.': ['உங்கள் பதில்கள் மிதமான மன அழுத்தத்தைக் காட்டுகின்றன.', 'आपके जवाब मध्यम तनाव दिखाते हैं।'],
  'Your answers suggest higher perceived stress. Your coach will be in touch this week.': ['உங்கள் பதில்கள் அதிகமான மன அழுத்தத்தைக் காட்டுகின்றன. இந்த வாரம் உங்கள் பயிற்சியாளர் தொடர்புகொள்வார்.', 'आपके जवाब ज़्यादा तनाव दिखाते हैं। आपके कोच इस हफ़्ते संपर्क करेंगे।'],
  'You reported no pain.': ['வலி இல்லை என்று தெரிவித்தீர்கள்.', 'आपने बताया कि दर्द नहीं है।'],
  'You reported mild pain.': ['லேசான வலி என்று தெரிவித்தீர்கள்.', 'आपने हल्का दर्द बताया।'],
  'You reported moderate pain. Your physician will see this at your next review.': ['மிதமான வலி என்று தெரிவித்தீர்கள். அடுத்த மதிப்பாய்வில் உங்கள் மருத்துவர் இதைப் பார்ப்பார்.', 'आपने मध्यम दर्द बताया। आपके डॉक्टर अगली समीक्षा में इसे देखेंगे।'],
  'You reported severe pain. Your physician will review it within 48 hours.': ['தீவிரமான வலி என்று தெரிவித்தீர்கள். 48 மணி நேரத்துக்குள் உங்கள் மருத்துவர் இதைப் பரிசீலிப்பார்.', 'आपने गंभीर दर्द बताया। आपके डॉक्टर 48 घंटे के भीतर इसे देखेंगे।'],})
