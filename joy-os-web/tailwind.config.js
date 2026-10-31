// Token colours are CSS variables (swapped for dark mode). Wrapping them in color-mix with
// <alpha-value> lets opacity modifiers such as `border-line/70` or `bg-paper/90` work.
const v = (name) => `color-mix(in srgb, var(--${name}) calc(<alpha-value> * 100%), transparent)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: { DEFAULT: v('paper'), raised: v('paper-raised'), sunk: v('paper-sunk') },
        ink: { DEFAULT: v('ink'), 2: v('ink-2'), 3: v('ink-3'), ground: v('ink-ground') },
        line: { DEFAULT: v('line'), strong: v('line-strong') },
        daybreak: { DEFAULT: v('daybreak'), ink: v('daybreak-ink'), soft: v('daybreak-soft') },
        term: {
          h: v('term-h'), p: v('term-p'), r: v('term-r'), f: v('term-f'), d: v('term-d'), b: v('term-b'),
        },
        error: v('error'),
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: { card: 'var(--radius-card)' },
      boxShadow: { card: 'var(--shadow-card)', lift: 'var(--shadow-lift)' },
      maxWidth: { page: '1280px' },
      transitionTimingFunction: { brand: 'cubic-bezier(0.2, 0, 0, 1)' },
    },
  },
  plugins: [],
}
