import type { Lang } from '@/lib/store'

/** Tamil and Hindi for one English string. The English key is the English copy, unchanged. */
export type Pair = readonly [ta: string, hi: string]

/** Builds a `{ key: { en, ta, hi } }` dictionary (the shape `useDict` reads) where en is the key. */
export function dict<T extends Record<string, Pair>>(m: T): { [K in keyof T]: Record<Lang, string> } {
  const out = {} as { [K in keyof T]: Record<Lang, string> }
  for (const k of Object.keys(m) as (keyof T & string)[]) out[k] = { en: k, ta: m[k][0], hi: m[k][1] }
  return out
}
