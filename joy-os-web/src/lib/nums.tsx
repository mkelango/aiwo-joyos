import type { ReactNode } from 'react'

// Mono for every number, numbers inside sentences included (Playbook p40), for the shared
// components and layouts. Each route group keeps its own richer helper (entry/_parts nums,
// core/_parts nums, spaces mono, journey monoDigits, account nums); this one serves the pieces
// outside them. A digit joined to a word ("LE8", "PHQ-4") is part of a name and stays as written;
// a method version ("v1.0") is a number, and is set whole, v included.

const NUM_RE = /\bv\d+(?:\.\d+)*|[−+]?\d+(?:[.,:/]\d+)*%?(?:\s?[–-]\s?\d+(?:[.,:/]\d+)*%?)?/g

/** The text with every figure wrapped in the .num Mono span. */
export function nums(text: string): ReactNode {
  if (!/\d/.test(text)) return text
  const out: ReactNode[] = []
  let last = 0
  let k = 0
  for (const m of text.matchAll(NUM_RE)) {
    const at = m.index ?? 0
    const prev = text[at - 1] ?? ''
    if (/[A-Za-z]/.test(prev) || (prev === '-' && /[A-Z]/.test(text[at - 2] ?? ''))) continue
    if (at > last) out.push(text.slice(last, at))
    out.push(<span key={k++} className="num">{m[0]}</span>)
    last = at + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
