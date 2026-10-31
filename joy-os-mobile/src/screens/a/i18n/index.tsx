import { Fragment, type ReactNode } from 'react'
import { fill, TERM_TEXT, useLang, type Dict } from '@/lib/i18n'
import type { Lang } from '@/lib/store'
import type { TermKey } from '@/shared/types'
import { CARE } from './care'
import { CATION } from './cation'
import { COMMON } from './common'
import { CORE_DATA } from './coreData'
import { JOURNEY_DATA } from './journeyData'
import { SCREEN_BANDS } from './screenBands'
import { PRACTICE } from './practice'
import { SPACES } from './spaces'
import { TODAY } from './today'
import { TOOLS } from './tools'

// Lane A (mobile tabs) copy in Tamil and Hindi. Every key is the English copy exactly as it
// is shown today, so English never changes and data arrays (in this lane and the shared
// specimens shown on these screens) translate by looking their English text up here.
// Stays English by design: instrument items, people's own words, names, brand names.

const ALL = { ...COMMON, ...TODAY, ...SPACES, ...TOOLS, ...CATION, ...PRACTICE, ...CARE, ...CORE_DATA, ...JOURNEY_DATA, ...SCREEN_BANDS }
export type AKey = keyof typeof ALL & string
const LOOKUP: Dict = ALL

type Vars = Record<string, string | number>

/** Look up English copy for one language; unknown strings (people's own words) pass through. */
export function txFor(lang: Lang, s: string, vars?: Vars) {
  return fill(lang === 'en' ? s : (LOOKUP[s]?.[lang] ?? s), vars)
}

/**
 * t(key) for copy written in these screens (keys are checked), tx(text) for data whose
 * English text may or may not have a translation. name/space give the six term names.
 */
export function useA() {
  const lang = useLang()
  const tx = (s: string, vars?: Vars) => txFor(lang, s, vars)
  const t = (k: AKey, vars?: Vars) => txFor(lang, k, vars)
  const name = (k: TermKey) => TERM_TEXT[k].name[lang]
  const space = (k: TermKey) => TERM_TEXT[k].space[lang]
  return { t, tx, lang, name, space, week: WEEK[lang], weekFull: WEEK_FULL[lang], date: (s: string) => localDate(s, lang) }
}

/** Renders "a *b* c": every starred part is wrapped (a serif word, an ink span). */
export function Rich({ text, wrap }: { text: string; wrap: (s: string, i: number) => ReactNode }) {
  const parts = text.split('*')
  return <>{parts.map((p, i) => (i % 2 ? <Fragment key={i}>{wrap(p, i)}</Fragment> : p ? <Fragment key={i}>{p}</Fragment> : null))}</>
}

const WEEK: Record<Lang, string[]> = {
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  ta: ['தி', 'செ', 'பு', 'வி', 'வெ', 'ச', 'ஞா'],
  hi: ['सो', 'मं', 'बु', 'गु', 'शु', 'श', 'र'],
}
const WEEK_FULL: Record<Lang, string[]> = {
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  ta: ['திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி', 'ஞாயிறு'],
  hi: ['सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार', 'रविवार'],
}
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS: Record<Exclude<Lang, 'en'>, string[]> = {
  ta: ['ஜன.', 'பிப்.', 'மார்.', 'ஏப்.', 'மே', 'ஜூன்', 'ஜூலை', 'ஆக.', 'செப்.', 'அக்.', 'நவ.', 'டிச.'],
  hi: ['जन॰', 'फ़र॰', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल॰', 'अग॰', 'सित॰', 'अक्तू॰', 'नव॰', 'दिस॰'],
}
const DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAYS: Record<Exclude<Lang, 'en'>, string[]> = {
  ta: ['திங்.', 'செவ்.', 'புத.', 'வியா.', 'வெள்.', 'சனி', 'ஞாயி.'],
  hi: ['सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'रवि'],
}

/** "28 Jan", "Thu 4 Feb · 18:30": month and weekday words in the member's language; digits stay Latin. */
export function localDate(s: string, lang: Lang) {
  if (lang === 'en') return s
  return s
    .replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (m) => MONTHS[lang][MONTHS_EN.indexOf(m)])
    .replace(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/g, (d) => DAYS[lang][DAYS_EN.indexOf(d)])
}

/** Three-letter weekday ("Thu") in the member's language. */
export function dayShort(d: string, lang: Lang) {
  return lang === 'en' ? d : (DAYS[lang][DAYS_EN.indexOf(d)] ?? d)
}
