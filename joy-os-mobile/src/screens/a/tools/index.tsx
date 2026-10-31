import type { TermKey } from '@/shared/types'
import { BodyTools } from './body'
import { EaseTools } from './ease'
import { FreedomTools } from './freedom'
import { PeopleTools } from './people'
import { PleasureTools } from './pleasure'
import { PurposeTools } from './purpose'

/** Headline per room: [before, one serif word, after]. */
export const SPACE_TITLE: Record<TermKey, [string, string, string]> = {
  H: ['How your body ', 'carries', ' you.'],
  P: ['What you ', 'get up', ' for.'],
  R: ['Who you would ', 'call', '.'],
  F: ['Whose ', 'time', ' it is.'],
  D: ['What you ', 'notice', ', and keep.'],
  B: ['What you can ', 'put down', '.'],
}

/** Each space's signature tools, in compact mobile form. */
export function SpaceTools({ term }: { term: TermKey }) {
  switch (term) {
    case 'H':
      return <BodyTools />
    case 'P':
      return <PurposeTools />
    case 'R':
      return <PeopleTools />
    case 'F':
      return <FreedomTools />
    case 'D':
      return <PleasureTools />
    case 'B':
      return <EaseTools />
  }
}
