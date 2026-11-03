import type { Lang } from '@/lib/store'

// Specimen dates written in English inside the data ("Mon 1 Feb · 19:00", "Thu 4 Feb 2027",
// "Jan 2027", "Friday 19 Feb") read in the member's language. English keeps the data's own
// wording; Tamil and Hindi are formatted with Intl, so no English month ever sits inside a
// translated line. Anything that is not a date comes back unchanged. The specimen year is 2027.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const LONG_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SPECIMEN_YEAR = 2027
const LOCALE: Record<Lang, string> = { en: 'en-GB', ta: 'ta-IN', hi: 'hi-IN' }

const M = MONTHS.join('|')
const WD = [...LONG_DAYS, ...SHORT_DAYS].join('|')
/** A date inside a sentence: optional weekday, day, month, optional year. */
const IN_TEXT = new RegExp(`(?:\\b(${WD}),? )?\\b(\\d{1,2}) (${M})\\b(?: (\\d{4}))?`, 'g')
const WHOLE = new RegExp(`^(?:(${WD}),? )?(\\d{1,2}) (${M})(?: (\\d{4}))?(?: · (\\d{1,2}:\\d{2}))?$`)
const MONTH_YEAR = new RegExp(`^(${M}) (\\d{4})$`)

function fmt(lang: Lang, day: number, month: string, year: string | undefined, weekday: string | undefined) {
  const d = new Date(year ? Number(year) : SPECIMEN_YEAR, MONTHS.indexOf(month), day)
  const long = !!weekday && LONG_DAYS.includes(weekday)
  return d.toLocaleDateString(LOCALE[lang], {
    ...(weekday ? { weekday: long ? 'long' : 'short' } : {}),
    day: 'numeric',
    month: long ? 'long' : 'short',
    ...(year ? { year: 'numeric' } : {}),
    numberingSystem: 'latn',
  })
}

/** One specimen date string ("Mon 1 Feb · 19:00", "4 Oct 2026", "Jan 2027") in the member's language. */
export function localWhen(s: string, lang: Lang): string {
  if (lang === 'en' || !s) return s
  const w = WHOLE.exec(s.trim())
  if (w) {
    const [, weekday, day, month, year, time] = w
    return `${fmt(lang, Number(day), month, year, weekday)}${time ? ` · ${time}` : ''}`
  }
  const my = MONTH_YEAR.exec(s.trim())
  if (my) return new Date(Number(my[2]), MONTHS.indexOf(my[1]), 1).toLocaleDateString(LOCALE[lang], { month: 'short', year: 'numeric', numberingSystem: 'latn' })
  return s
}

/**
 * A sentence with English dates in it, as a template and its dates: "Next: 5 Apr 2027" becomes
 * "Next: {d0}" plus a formatter. Dictionaries key such lines by the template, so the date is
 * filled in the member's language rather than written into each translation.
 */
export function dateTemplate(s: string): { key: string; fill: (translated: string, lang: Lang) => string } {
  const dates: { weekday?: string; day: number; month: string; year?: string }[] = []
  const key = s.replace(IN_TEXT, (_m, weekday: string | undefined, day: string, month: string, year: string | undefined) => {
    dates.push({ weekday, day: Number(day), month, year })
    return `{d${dates.length - 1}}`
  })
  return {
    key,
    fill: (translated, lang) =>
      dates.reduce((acc, d, i) => acc.split(`{d${i}}`).join(lang === 'en' ? `${d.weekday ? `${d.weekday} ` : ''}${d.day} ${d.month}${d.year ? ` ${d.year}` : ''}` : fmt(lang, d.day, d.month, d.year, d.weekday)), translated),
  }
}
