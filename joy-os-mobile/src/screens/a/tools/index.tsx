import type { TermKey } from '@/shared/types'
import { BodyTools } from './body'
import { EaseTools } from './ease'
import { FreedomTools } from './freedom'
import { PeopleTools } from './people'
import { PleasureTools } from './pleasure'
import { PurposeTools } from './purpose'

/** Headline per room, the *starred* word set in serif (translated in ../i18n/spaces). */
export const SPACE_TITLE = {
  H: 'How your body *carries* you.',
  P: 'What you *get up* for.',
  R: 'Who you would *call*.',
  F: 'Whose *time* it is.',
  D: 'What you *notice*, and keep.',
  B: 'What you can *put down*.',
} as const satisfies Record<TermKey, string>

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
