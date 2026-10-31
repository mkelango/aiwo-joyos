import type { Dict } from '@/lib/i18n'

export const PARTS = {
  allSixA11y: { en: 'All six terms: Healthspan, Purpose, Relationships, Freedom, Daily Pleasure and Preventable Suffering', ta: 'ஆறு அம்சங்களும்: ஆரோக்கிய ஆயுள், நோக்கம், உறவுகள், சுதந்திரம், தினசரி மகிழ்ச்சி, தவிர்க்கக்கூடிய துன்பம்', hi: 'सभी छह पहलू: स्वस्थ आयु, उद्देश्य, रिश्ते, स्वतंत्रता, रोज़ का आनंद और टाला जा सकने वाला कष्ट' },
  allSix: { en: 'All six terms', ta: 'ஆறு அம்சங்களும்', hi: 'सभी छह पहलू' },
  earlier: { en: '{label} earlier by 15 minutes', ta: '{label}: 15 நிமிடம் முன்னதாக', hi: '{label}: 15 मिनट पहले' },
  later: { en: '{label} later by 15 minutes', ta: '{label}: 15 நிமிடம் தாமதமாக', hi: '{label}: 15 मिनट बाद' },
  pause: { en: 'Pause', ta: 'இடைநிறுத்து', hi: 'रोकें' },
  play: { en: 'Play {title}', ta: '{title} — இயக்கு', hi: '{title} चलाएँ' },
  played: { en: 'Played {pos} of {total}', ta: '{total} இல் {pos} கேட்டாகிவிட்டது', hi: '{total} में से {pos} सुना' },
  back15: { en: 'Back fifteen seconds', ta: 'பதினைந்து விநாடிகள் பின்னால்', hi: 'पंद्रह सेकंड पीछे' },
  speed: { en: 'Playback speed {rate} times. Changes speed.', ta: 'இயக்க வேகம் {rate} மடங்கு. வேகத்தை மாற்றும்.', hi: 'चलाने की रफ़्तार {rate} गुना। रफ़्तार बदलता है।' },
  transcript: { en: 'Transcript', ta: 'எழுத்து வடிவம்', hi: 'लिखित पाठ' },
  hideTranscript: { en: 'Hide transcript', ta: 'எழுத்து வடிவத்தை மறை', hi: 'लिखित पाठ छिपाएँ' },
  showTranscript: { en: 'Show transcript', ta: 'எழுத்து வடிவத்தைக் காட்டு', hi: 'लिखित पाठ दिखाएँ' },
  offline: { en: 'Keep for offline', ta: 'இணையம் இல்லாமல் கேட்கச் சேமி', hi: 'बिना इंटरनेट के लिए रखें' },
  downloading: { en: 'Downloading… {pct}%', ta: 'பதிவிறக்குகிறது… {pct}%', hi: 'डाउनलोड हो रहा है… {pct}%' },
  savedDevice: { en: 'Saved on this device · 4.6 MB · plays with no signal', ta: 'இந்தச் சாதனத்தில் சேமிக்கப்பட்டது · 4.6 MB · சிக்னல் இல்லாமலும் இயங்கும்', hi: 'इस डिवाइस पर सेव · 4.6 MB · बिना सिग्नल के भी चलेगा' },
  downloadHint: { en: 'Download this week’s audio for a flight or the car.', ta: 'விமானப் பயணத்துக்கோ காருக்கோ இந்த வார ஒலிப்பதிவைப் பதிவிறக்குங்கள்.', hi: 'फ़्लाइट या गाड़ी के लिए इस हफ़्ते का ऑडियो डाउनलोड करें।' },
  transcriptFollows: { en: 'Transcript · follows the audio', ta: 'எழுத்து வடிவம் · ஒலியுடன் தொடரும்', hi: 'लिखित पाठ · ऑडियो के साथ चलता है' },
  stepOf: { en: 'Step {n} of {total}', ta: 'படி {n} / {total}', hi: 'चरण {n} / {total}' },
  stepOfA11y: { en: 'Step {n} of {total}: {name}', ta: 'படி {n} / {total}: {name}', hi: 'चरण {n} / {total}: {name}' },
} satisfies Dict
