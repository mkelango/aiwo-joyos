import clsx from 'clsx'

// The Joyspan equation (Playbook p44, p47): "Set once. Set verbatim. Forever."
//  · Verbatim, always: one line of copy, never edited for fit; fixed order, fixed capitals, the
//    true minus sign (U+2212), never a hyphen. It is a brand line, so it stays English in every
//    language of the app.
//  · Newsreader Roman 300–400 on Umber, Ink or Paper.
//  · The minus in Amber (on Paper) or Amber Light #E3A86E (on dark): the only colour in the line.
//  · One break only: before "Freedom" or before the minus, never inside a term. Every other
//    space is non-breaking.

const NB = ' '
export const JOYSPAN_EQUATION = 'Joyspan = Healthspan + Purpose + Relationships + Freedom + Daily Pleasure − Preventable Suffering'

export function JoyspanEquation({ className, onDark = false, as: As = 'p' }: {
  className?: string
  /** On an Ink or Umber ground in the light theme (the Index card back): Stone text, Amber Light minus. */
  onDark?: boolean
  as?: 'p' | 'span' | 'div'
}) {
  const minus = onDark ? '#e3a86e' : 'var(--minus-amber)'
  return (
    <As
      lang="en"
      className={clsx('font-serif font-light not-italic leading-snug', onDark ? 'text-[color:var(--aiwo-stone)]' : 'text-ink', className)}
      aria-label="Joyspan equals Healthspan plus Purpose plus Relationships plus Freedom plus Daily Pleasure minus Preventable Suffering"
      role="img"
    >
      <span aria-hidden>
        {`Joyspan${NB}=${NB}Healthspan${NB}+${NB}Purpose${NB}+${NB}Relationships${NB}+`}
        {/* break point 1: before Freedom */}
        {' '}
        {`Freedom${NB}+${NB}Daily${NB}Pleasure`}
        {/* break point 2: before the minus */}
        {' '}
        <span style={{ color: minus }}>{'−'}</span>
        {`${NB}Preventable${NB}Suffering`}
      </span>
    </As>
  )
}
