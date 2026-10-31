import type { TermKey, TermScore } from '@/domain/types'
import { INDEX_HISTORY } from '@/data/member'

// Lane-local specimen data for the member core (Index, Day 90, Ledger, VIVA).
// SPECIMEN — not a real member. Shaped like the future BFF responses.

// ─── Index: per-term detail (instruments, signals vs survey, what moved) ─────
export interface TermDetail {
  /** Share of the term score that comes from questionnaire items vs wearable signals. */
  survey: number
  signals: number
  confidence: 'High' | 'Moderate' | 'Survey only'
  signalSources: string[]
  moved: string[]
  sentence: string
}

export const TERM_DETAIL: Record<TermKey, TermDetail> = {
  H: {
    survey: 60,
    signals: 40,
    confidence: 'High',
    signalSources: ['Oura · resting HR trend', 'Apple Health · VO₂max estimate', 'Capacity battery · sit-to-stand'],
    moved: ['Sleep efficiency up 4 points over the quarter', 'Five sit-to-stands 1.2 s quicker', 'LE8 diet score unchanged'],
    sentence: 'Your body is steady. Sleep and capacity both edged up this quarter.',
  },
  P: {
    survey: 100,
    signals: 0,
    confidence: 'Survey only',
    signalSources: [],
    moved: ['Ikigai-9 up 2 · “I feel my life is useful to others”', 'MLQ-Presence unchanged'],
    sentence: 'Purpose is your strongest term. The Tomorrow Question has a weekly answer.',
  },
  R: {
    survey: 85,
    signals: 15,
    confidence: 'Moderate',
    signalSources: ['Ledger · moments tagged People'],
    moved: ['UCLA-3 loneliness down 1', 'Three of your 15 not seen this month'],
    sentence: 'People hold steady. The circle of eight met four Mondays out of four.',
  },
  F: {
    survey: 80,
    signals: 20,
    confidence: 'Moderate',
    signalSources: ['Google Calendar · time audit, summarised then discarded'],
    moved: ['Time affluence down: evenings booked 5 nights in 7', 'Autonomy unchanged', 'Financial wellbeing unchanged'],
    sentence: 'Freedom slipped. A heavy quarter at work took the evenings.',
  },
  D: {
    survey: 55,
    signals: 45,
    confidence: 'High',
    signalSources: ['Joy Ledger · 2.6 moments a day', 'Savouring prompts answered'],
    moved: ['SPANE balance up 3', 'Joy moments up from 1.9 to 2.6 a day', 'Savouring unchanged'],
    sentence: 'Daily Pleasure is your lowest term, and it rose the most.',
  },
  B: {
    survey: 70,
    signals: 30,
    confidence: 'High',
    signalSources: ['Oura · sleep regularity', 'PHQ-4 and PSS-4 (pre-approved copy only)'],
    moved: ['Sleep regularity improved after the 22:00 wind-down', 'PSS-4 stress eased by 1'],
    sentence: 'Burden eased by 3. Less weight is better here.',
  },
}

// ─── Index: “not yet measured” example (Memo p.11, missing data handled in the open) ──
export const NOT_YET_EXAMPLE: TermScore[] = INDEX_HISTORY[0].terms.map((t) =>
  t.key === 'F' ? { key: 'F', value: null, band: 'not-yet-measured' } : t,
)

// ─── Take the Index: two sittings, organised by instrument ──────────────────
export interface ScaleOption {
  value: number
  label: string
}
export interface SampleItem {
  id: string
  /** Position of this item within its sitting (the full sitting is longer). */
  position: number
  text: string
  stem?: string
  /** Item-specific answer scale; falls back to the block's scale. */
  scale?: ScaleOption[]
  /** Reverse-scored: a higher answer means less of the term. */
  reverse?: boolean
}
export interface InstrumentBlock {
  code: string // matches INSTRUMENTS[].code where it exists
  name: string
  term: TermKey
  items: number
  minutes: number
  attribution: string
  about: string
  scale: ScaleOption[]
  timeframe: string
  sample: SampleItem[]
  careNote?: string
}
export interface Sitting {
  n: 1 | 2
  title: string
  minutes: number
  total: number
  blocks: InstrumentBlock[]
}

const AGREE5: ScaleOption[] = [
  { value: 1, label: 'Not at all true' },
  { value: 2, label: 'A little true' },
  { value: 3, label: 'Somewhat true' },
  { value: 4, label: 'Mostly true' },
  { value: 5, label: 'Completely true' },
]
const MLQ7: ScaleOption[] = [
  { value: 1, label: 'Absolutely untrue' },
  { value: 2, label: 'Mostly untrue' },
  { value: 3, label: 'Somewhat untrue' },
  { value: 4, label: 'Can’t say true or false' },
  { value: 5, label: 'Somewhat true' },
  { value: 6, label: 'Mostly true' },
  { value: 7, label: 'Absolutely true' },
]
const FREQ5: ScaleOption[] = [
  { value: 1, label: 'Very rarely or never' },
  { value: 2, label: 'Rarely' },
  { value: 3, label: 'Sometimes' },
  { value: 4, label: 'Often' },
  { value: 5, label: 'Very often or always' },
]

const SPANE_STEM = 'In the past four weeks, how often did you feel…'
const PHQ_STEM = 'Over the last two weeks, how often have you been bothered by…'
const PSS_STEM = 'In the last month, how often have you felt…'
const UCLA_STEM = 'How often do you feel…'
const CFPB_SCALE: ScaleOption[] = [
  { value: 4, label: 'Completely' },
  { value: 3, label: 'Very well' },
  { value: 2, label: 'Somewhat' },
  { value: 1, label: 'Very little' },
  { value: 0, label: 'Not at all' },
]
const LAST_CHECK = (worst: string, mid: string, best: string): ScaleOption[] => [
  { value: 1, label: worst },
  { value: 2, label: mid },
  { value: 3, label: 'Not checked in the last three years' },
  { value: 4, label: best },
]

/** Item numbers run 1–31 in each sitting; every instrument is complete. */
export const SITTINGS: Sitting[] = [
  {
    n: 1,
    title: 'Body, Purpose and People',
    minutes: 10,
    total: 31,
    blocks: [
      {
        code: 'LE8 self-report',
        name: 'Life’s Essential 8 · self-report',
        term: 'H',
        items: 8,
        minutes: 3,
        attribution: 'American Heart Association · free to use',
        about: 'Eight everyday habits and readings the heart cares about. Your Oura and Apple Health data sit beside these answers.',
        timeframe: 'In a typical week',
        scale: [
          { value: 1, label: 'Fewer than 5 hours' },
          { value: 2, label: '5 to 6 hours' },
          { value: 3, label: '6 to 7 hours' },
          { value: 5, label: '7 to 9 hours' }, // the healthiest band scores highest
          { value: 4, label: 'More than 9 hours' },
        ],
        sample: [
          {
            id: 'le8-1', position: 1, text: 'On a typical day, how many portions of fruit and vegetables do you eat?',
            scale: [
              { value: 1, label: 'None' },
              { value: 2, label: 'One or two' },
              { value: 3, label: 'Three or four' },
              { value: 4, label: 'Five or more' },
            ],
          },
          { id: 'le8-2', position: 2, text: 'On most nights, how many hours of sleep do you get?' },
          {
            id: 'le8-3', position: 3, text: 'In a typical week, how many minutes of brisk walking or harder activity do you do?',
            scale: [
              { value: 1, label: 'Fewer than 30 minutes' },
              { value: 2, label: '30 to 74 minutes' },
              { value: 3, label: '75 to 149 minutes' },
              { value: 4, label: '150 to 299 minutes' },
              { value: 5, label: '300 minutes or more' },
            ],
          },
          {
            id: 'le8-4', position: 4, text: 'Do you smoke, chew tobacco or use nicotine in any form?',
            scale: [
              { value: 1, label: 'Every day' },
              { value: 2, label: 'Some days' },
              { value: 3, label: 'I stopped within the last year' },
              { value: 4, label: 'I stopped more than a year ago' },
              { value: 5, label: 'Never' },
            ],
          },
          {
            id: 'le8-5', position: 5, text: 'At your last check, how did your doctor describe your weight?',
            scale: [
              { value: 1, label: 'Well above a healthy range' },
              { value: 2, label: 'A little above or below it' },
              { value: 3, label: 'Not checked, or not sure' },
              { value: 4, label: 'Within a healthy range' },
            ],
          },
          { id: 'le8-6', position: 6, text: 'At your last check, what was said about your cholesterol?', scale: LAST_CHECK('High', 'Borderline, or on treatment', 'In a healthy range') },
          { id: 'le8-7', position: 7, text: 'At your last check, what was said about your blood sugar?', scale: LAST_CHECK('Diabetes', 'Pre-diabetes, or on treatment', 'Normal') },
          { id: 'le8-8', position: 8, text: 'At your last check, what was said about your blood pressure?', scale: LAST_CHECK('High', 'Raised, or on treatment', 'Normal') },
        ],
      },
      {
        code: 'Ikigai-9',
        name: 'Ikigai-9',
        term: 'P',
        items: 9,
        minutes: 2,
        attribution: 'Imai et al. · author permission (pending, specimen)',
        about: 'Nine statements on whether your life feels worth living, in the original sense of ikigai.',
        timeframe: 'These days',
        scale: AGREE5,
        sample: [
          { id: 'ik-9', position: 9, text: 'I often feel that I am content with my days.' },
          { id: 'ik-10', position: 10, text: 'I feel that my life is useful to other people.' },
          { id: 'ik-11', position: 11, text: 'I would like to learn something new, or start something.' },
          { id: 'ik-12', position: 12, text: 'I have something I want to try, or a place I want to go.' },
          { id: 'ik-13', position: 13, text: 'I feel I am contributing to someone, or to society.' },
          { id: 'ik-14', position: 14, text: 'I feel that I am needed by someone.' },
          { id: 'ik-15', position: 15, text: 'My life has some influence on the people around me.' },
          { id: 'ik-16', position: 16, text: 'I feel I have grown as a person over the last year.' },
          { id: 'ik-17', position: 17, text: 'I feel my days have a direction I chose.' },
        ],
      },
      {
        code: 'MLQ-P',
        name: 'Meaning in Life · Presence',
        term: 'P',
        items: 5,
        minutes: 1,
        attribution: 'Steger et al. · free for research, commercial use confirmed',
        about: 'Five statements on how present meaning feels in your life right now.',
        timeframe: 'Right now',
        scale: MLQ7,
        sample: [
          { id: 'mlq-18', position: 18, text: 'I understand what my life is about.' },
          { id: 'mlq-19', position: 19, text: 'I have a good sense of what makes my life meaningful.' },
          { id: 'mlq-20', position: 20, text: 'I have found a purpose that satisfies me.' },
          { id: 'mlq-21', position: 21, text: 'My life has a clear sense of purpose.' },
          { id: 'mlq-22', position: 22, text: 'My life has no clear purpose.', reverse: true },
        ],
      },
      {
        code: 'UCLA-3',
        name: 'UCLA Loneliness · three items',
        term: 'R',
        items: 3,
        minutes: 1,
        attribution: 'Hughes et al. · public domain',
        about: 'Three short questions on feeling apart from others. There are no right answers.',
        timeframe: 'How often do you feel',
        scale: [
          { value: 1, label: 'Hardly ever' },
          { value: 2, label: 'Some of the time' },
          { value: 3, label: 'Often' },
        ],
        sample: [
          { id: 'ucla-23', position: 23, stem: UCLA_STEM, text: '…that you lack companionship?', reverse: true },
          { id: 'ucla-24', position: 24, stem: UCLA_STEM, text: '…left out?', reverse: true },
          { id: 'ucla-25', position: 25, stem: UCLA_STEM, text: '…apart from the people around you?', reverse: true },
        ],
      },
      {
        code: 'LSNS-6',
        name: 'Lubben Social Network Scale · six items',
        term: 'R',
        items: 6,
        minutes: 2,
        attribution: 'Lubben · terms to confirm (specimen)',
        about: 'Six questions on the size of your circle: family, then friends.',
        timeframe: 'Count the people',
        scale: [
          { value: 0, label: 'None' },
          { value: 1, label: 'One' },
          { value: 2, label: 'Two' },
          { value: 3, label: 'Three or four' },
          { value: 4, label: 'Five to eight' },
          { value: 5, label: 'Nine or more' },
        ],
        sample: [
          { id: 'lsns-26', position: 26, stem: 'Family', text: 'How many relatives do you see or hear from at least once a month?' },
          { id: 'lsns-27', position: 27, stem: 'Family', text: 'How many relatives do you feel at ease with, that you can talk to about private matters?' },
          { id: 'lsns-28', position: 28, stem: 'Family', text: 'How many relatives do you feel close enough to call on for help?' },
          { id: 'lsns-29', position: 29, stem: 'Friends', text: 'How many friends do you see or hear from at least once a month?' },
          { id: 'lsns-30', position: 30, stem: 'Friends', text: 'How many friends do you feel at ease with, that you can talk to about private matters?' },
          { id: 'lsns-31', position: 31, stem: 'Friends', text: 'How many friends do you feel close enough to call on for help?' },
        ],
      },
    ],
  },
  {
    n: 2,
    title: 'Freedom, Pleasure and Ease',
    minutes: 10,
    total: 31,
    blocks: [
      {
        code: 'BPNSFS',
        name: 'Basic Psychological Needs · autonomy',
        term: 'F',
        items: 4,
        minutes: 1,
        attribution: 'Chen et al. · terms to confirm (specimen)',
        about: 'Four statements on how much your days feel chosen rather than imposed.',
        timeframe: 'In the last few weeks',
        scale: AGREE5,
        sample: [
          { id: 'bp-1', position: 1, text: 'I feel a sense of choice and freedom in the things I take on.' },
          { id: 'bp-2', position: 2, text: 'I feel my choices express who I really am.' },
          { id: 'bp-3', position: 3, text: 'I feel I have been doing what really interests me.' },
          { id: 'bp-4', position: 4, text: 'Most of the things I do feel like “I have to”.', reverse: true },
        ],
      },
      {
        code: 'Time affluence',
        name: 'Time affluence',
        term: 'F',
        items: 2,
        minutes: 1,
        attribution: 'Kasser & Sheldon · free with attribution',
        about: 'Two statements on whether you have time for what matters.',
        timeframe: 'In the last few weeks',
        scale: AGREE5,
        sample: [
          { id: 'ta-5', position: 5, text: 'I have had enough time to do what I wanted to do.' },
          { id: 'ta-6', position: 6, text: 'I have felt rushed most days.', reverse: true },
        ],
      },
      {
        code: 'CFPB FWB',
        name: 'Financial Well-Being · five items',
        term: 'F',
        items: 5,
        minutes: 1,
        attribution: 'US CFPB · public domain',
        about: 'Five statements on peace of mind about money. This is never used for advice, and never shown to an employer or insurer.',
        timeframe: 'How well does this describe you',
        scale: CFPB_SCALE,
        sample: [
          { id: 'cfpb-7', position: 7, text: 'Because of my money situation, I feel I will never have the things I want in life.', reverse: true },
          { id: 'cfpb-8', position: 8, text: 'I could handle a major unexpected expense.' },
          { id: 'cfpb-9', position: 9, text: 'I am securing my financial future.' },
          { id: 'cfpb-10', position: 10, text: 'I am just getting by, financially.', reverse: true },
          { id: 'cfpb-11', position: 11, text: 'I am concerned that the money I have will not last.', reverse: true },
        ],
      },
      {
        code: 'SPANE',
        name: 'Scale of Positive and Negative Experience',
        term: 'D',
        items: 12,
        minutes: 2,
        attribution: 'Diener et al. · free with attribution',
        about: 'Twelve feelings. Think back over the past four weeks.',
        timeframe: 'In the past four weeks, how often did you feel',
        scale: FREQ5,
        sample: [
          { id: 'sp-12', position: 12, stem: SPANE_STEM, text: '…positive?' },
          { id: 'sp-13', position: 13, stem: SPANE_STEM, text: '…negative?', reverse: true },
          { id: 'sp-14', position: 14, stem: SPANE_STEM, text: '…good?' },
          { id: 'sp-15', position: 15, stem: SPANE_STEM, text: '…bad?', reverse: true },
          { id: 'sp-16', position: 16, stem: SPANE_STEM, text: '…pleasant?' },
          { id: 'sp-17', position: 17, stem: SPANE_STEM, text: '…unpleasant?', reverse: true },
          { id: 'sp-18', position: 18, stem: SPANE_STEM, text: '…happy?' },
          { id: 'sp-19', position: 19, stem: SPANE_STEM, text: '…sad?', reverse: true },
          { id: 'sp-20', position: 20, stem: SPANE_STEM, text: '…afraid?', reverse: true },
          { id: 'sp-21', position: 21, stem: SPANE_STEM, text: '…joyful?' },
          { id: 'sp-22', position: 22, stem: SPANE_STEM, text: '…angry?', reverse: true },
          { id: 'sp-23', position: 23, stem: SPANE_STEM, text: '…contented?' },
        ],
      },
      {
        code: 'PHQ-4',
        name: 'Patient Health Questionnaire · four items',
        term: 'B',
        items: 4,
        minutes: 1,
        attribution: 'Kroenke et al. · public domain',
        about: 'Four questions on low mood and worry over the last two weeks.',
        careNote: 'If your answers cross a threshold, a clinician reads them within 48 hours. No AI writes about these results, ever.',
        timeframe: 'Over the last two weeks, how often have you been bothered by',
        scale: [
          { value: 0, label: 'Not at all' },
          { value: 1, label: 'Several days' },
          { value: 2, label: 'More than half the days' },
          { value: 3, label: 'Nearly every day' },
        ],
        sample: [
          { id: 'phq-24', position: 24, stem: PHQ_STEM, text: '…feeling nervous, anxious or on edge?' },
          { id: 'phq-25', position: 25, stem: PHQ_STEM, text: '…not being able to stop or control worrying?' },
          { id: 'phq-26', position: 26, stem: PHQ_STEM, text: '…little interest or pleasure in doing things?' },
          { id: 'phq-27', position: 27, stem: PHQ_STEM, text: '…feeling down, low or hopeless?' },
        ],
      },
      {
        code: 'PSS-4',
        name: 'Perceived Stress Scale · four items',
        term: 'B',
        items: 4,
        minutes: 1,
        attribution: 'Cohen et al. · terms to confirm (specimen)',
        about: 'Four questions on how stretched the last month has felt.',
        timeframe: 'In the last month, how often have you felt',
        scale: [
          { value: 0, label: 'Never' },
          { value: 1, label: 'Almost never' },
          { value: 2, label: 'Sometimes' },
          { value: 3, label: 'Fairly often' },
          { value: 4, label: 'Very often' },
        ],
        sample: [
          { id: 'pss-28', position: 28, stem: PSS_STEM, text: '…unable to control the important things in your life?' },
          { id: 'pss-29', position: 29, stem: PSS_STEM, text: '…confident about handling your personal problems?', reverse: true },
          { id: 'pss-30', position: 30, stem: PSS_STEM, text: '…that things were going your way?', reverse: true },
          { id: 'pss-31', position: 31, stem: PSS_STEM, text: '…that difficulties were piling up too high to overcome?' },
        ],
      },
    ],
  },
]

/**
 * History across methods. The July 2026 baseline predates Method v1.0 (published
 * 22 Oct 2026); it was scored with the pilot weights and is shown as recorded.
 */
export const HISTORY_METHOD: Record<string, { method: string; note?: string }> = {
  ix_001: { method: 'v0.9 pilot', note: 'Pilot weights, same six terms · shown as recorded, never recomputed' },
}
export const METHOD_V10_PUBLISHED = '2026-10-22'

// ─── Day 90: full six-term re-measure (Memo p.18 screen 04) ──────────────────
// Day 0 is the January Index; Day 90 adds DAY90_SPECIMEN.moved and a heavier Burden.
export const DAY90_TERMS: TermScore[] = [
  { key: 'H', value: 72, band: 'steady', delta: 1 },
  { key: 'P', value: 84, band: 'steady', delta: 0 },
  { key: 'R', value: 77, band: 'steady', delta: 0 },
  { key: 'F', value: 51, band: 'uneven', delta: -11 },
  { key: 'D', value: 60, band: 'uneven', delta: 2 },
  { key: 'B', value: 27, band: 'uneven', delta: 3 },
]

export const DAY90_DATES = { day0: '2027-01-02', day90: '2027-04-02', call: 'Thursday 8 April · 18:30' }

export const DAY90_WHY: Record<TermKey, string> = {
  H: 'Capacity battery and sleep efficiency both a touch better.',
  P: 'Ikigai-9 and MLQ-Presence held.',
  R: 'Loneliness and network size held; the circle met every week.',
  F: 'Time affluence fell: evenings booked five nights in seven through March.',
  D: 'More joy moments logged; SPANE balance rose.',
  B: 'Stress and sleep regularity heavier in the last month.',
}

export const NEXT_90 = [
  { day: 'Day 1', title: 'Write the No list', detail: 'Three things to stop this quarter. Ten minutes, with Priya on the call.', term: 'F' as TermKey },
  { day: 'Weekly', title: 'Two evenings protected', detail: 'Tuesday and Friday after 7 pm, in the calendar like a meeting.', term: 'F' as TermKey },
  { day: 'Day 15', title: 'Time audit review', detail: 'Calendar summarised, then discarded. Priya reads the summary, not the calendar.', term: 'F' as TermKey },
  { day: 'Day 45', title: 'Review with Priya', detail: 'Drift, if any, becomes a call. Keep the verandah tea going.', term: 'D' as TermKey },
  { day: 'Day 60', title: 'The next step', detail: 'A Wealthcation is one option. So is simply continuing.', term: 'F' as TermKey },
  { day: 'Day 76', title: 'Re-measure opens', detail: 'Two sittings, about twenty minutes, like for like.', term: 'F' as TermKey },
]

// ─── Joy Ledger: schedule and four-week calendar ────────────────────────────
export const LEDGER_SCHEDULE = [
  { prompt: 1 as const, time: '12:40', label: 'After lunch' },
  { prompt: 2 as const, time: '16:15', label: 'Late afternoon' },
  { prompt: 3 as const, time: '21:30', label: 'Before the wind-down' },
]

/** Entries per day for the four weeks ending yesterday (oldest first). Specimen. */
export const LEDGER_CALENDAR = [
  2, 1, 3, 0, 2, 3, 1,
  1, 2, 2, 3, 0, 0, 2,
  3, 2, 1, 2, 3, 3, 2,
  2, 3, 3, 1, 2, 3,
]

export const LEDGER_STORY = {
  sentences:
    'This week, joy came most often from people, and usually around food: lunch with Kavya twice, and dinner with the family on Sunday. The quiet ones counted too: a beach walk, and MS Subbulakshmi before bed.',
  tool: 'ledger_weekly_story',
  prompt: 'prompt v3',
}

// ─── VIVA: memory the member can see and edit (WHOOP “My Memory” pattern) ───
export interface MemoryItem {
  id: string
  text: string
  source: string
}
export const VIVA_MEMORY: Record<TermKey, MemoryItem[]> = {
  H: [
    { id: 'mh1', text: 'You prefer morning walks before 7 am, when it is cooler.', source: 'Told VIVA · 14 Jan' },
    { id: 'mh2', text: 'Oura is your main device; Apple Health for workouts.', source: 'Devices · 7 Jul' },
  ],
  P: [
    { id: 'mp1', text: 'You mentor two young founders on Saturdays.', source: 'Ikigai map · 18 Jan' },
    { id: 'mp2', text: 'Your Tomorrow Question answers often mention teaching.', source: 'Purpose space' },
  ],
  R: [
    { id: 'mr1', text: 'Kavya is your partner. Her answers are never shown to you.', source: 'Household · 6 Jul' },
    { id: 'mr2', text: 'Friday dinner with the Rao family, phones in the basket.', source: 'Told VIVA · 9 Jan' },
  ],
  F: [{ id: 'mf1', text: 'Evenings after 7 pm are the time you want back.', source: 'No list · 12 Jan' }],
  D: [
    { id: 'md1', text: 'Tea on the verandah at sunset is a reliable pleasure.', source: 'Joy Ledger' },
    { id: 'md2', text: 'Carnatic music, especially MS Subbulakshmi.', source: 'Joy Ledger' },
  ],
  B: [],
}

// ─── Take the Index: the signals that sit beside the answers (specimen readings) ──
export const SIGNAL_READINGS: Record<string, string> = {
  'Oura · resting HR trend': 'Resting heart rate 58 bpm · down 2 over 90 days',
  'Apple Health · VO₂max estimate': 'VO₂max estimate 36 · steady',
  'Capacity battery · sit-to-stand': 'Five sit-to-stands in 9.8 s · 12 Jan',
  'Ledger · moments tagged People': '41 moments tagged People in 90 days',
  'Google Calendar · time audit, summarised then discarded': 'Evenings booked 5 nights in 7 · summary only',
  'Joy Ledger · 2.6 moments a day': '2.6 moments a day over 30 days',
  'Savouring prompts answered': '18 savouring prompts answered',
  'Oura · sleep regularity': 'Sleep regularity 74 · bedtime within 40 min',
  'PHQ-4 and PSS-4 (pre-approved copy only)': 'Read from your answers in this sitting',
}
