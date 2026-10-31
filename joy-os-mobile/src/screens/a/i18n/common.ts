import { dict } from './make'

// Words shared by several Lane A screens and helpers (parts.tsx, local.ts).
export const COMMON = dict({
  // Bands (a11y labels; the visible band comes from BandLabel)
  steady: ['நிலையானது', 'स्थिर'],
  uneven: ['சீரற்றது', 'असमान'],
  thin: ['குறைவு', 'कमज़ोर'],
  'not-yet-measured': ['இன்னும் அளவிடப்படவில்லை', 'अभी मापा नहीं गया'],
  'minus ': ['கழித்தல் ', 'माइनस '],
  '’Cation': ['’கேஷன்', '’केशन'],
  Spaces: ['இடங்கள்', 'स्पेस'],
  Undo: ['செயல்தவிர்', 'वापस लें'],
  Edit: ['திருத்து', 'बदलें'],
  Save: ['சேமி', 'सहेजें'],
  Close: ['மூடு', 'बंद करें'],
  Done: ['முடிந்தது', 'हो गया'],
  Hide: ['மறை', 'छिपाएँ'],
  Another: ['இன்னொன்று', 'एक और'],
  '{n} min': ['{n} நிமி.', '{n} मिनट'],
  '{n} minutes': ['{n} நிமிடங்கள்', '{n} मिनट'],
  'Kept. Private to you.': ['வைத்துக்கொள்ளப்பட்டது. உங்களுக்கு மட்டும்.', 'सहेज लिया। सिर्फ़ आपके लिए।'],
  'Private to you': ['உங்களுக்கு மட்டும்', 'सिर्फ़ आपके लिए'],
  // parts.tsx
  'Drafted by VIVA ·': ['VIVA வரைந்தது ·', 'VIVA का मसौदा ·'],
  '· {prompt} · method {method}': ['· {prompt} · முறை {method}', '· {prompt} · विधि {method}'],
  'Drafted by VIVA, tool {tool}, {prompt}, method {method}': ['VIVA வரைந்தது, கருவி {tool}, {prompt}, முறை {method}', 'VIVA का मसौदा, टूल {tool}, {prompt}, विधि {method}'],
  'Not written by AI · pre-approved · {by}': ['AI எழுதியது அல்ல · முன்பே அங்கீகரிக்கப்பட்டது · {by}', 'AI ने नहीं लिखा · पहले से स्वीकृत · {by}'],
  // Ledger tags (shared LEDGER_TAGS), shown in Today and Pleasure
  People: ['மனிதர்கள்', 'लोग'],
  Food: ['உணவு', 'खाना'],
  Movement: ['அசைவு', 'चलना-फिरना'],
  Beauty: ['அழகு', 'सुंदरता'],
  Learning: ['கற்றல்', 'सीखना'],
  Rest: ['ஓய்வு', 'आराम'],
  Nature: ['இயற்கை', 'प्रकृति'],
  Music: ['இசை', 'संगीत'],
  Work: ['வேலை', 'काम'],
  Faith: ['நம்பிக்கை', 'आस्था'],
  // Times of day on actions
  morning: ['காலை', 'सुबह'],
  evening: ['மாலை', 'शाम'],
  'any time': ['எந்த நேரமும்', 'किसी भी समय'],
  // Shared specimen: circle
  'Monday 7 pm': ['திங்கள் இரவு 7 மணி', 'सोमवार शाम 7 बजे'],
  'Circle of eight · Fairmont January': ['எட்டு பேர் வட்டம் · Fairmont ஜனவரி', 'आठ लोगों का सर्कल · Fairmont जनवरी'],
})
