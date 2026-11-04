import { AnimatePresence, motion } from 'framer-motion'
import { cloneElement, createElement, Fragment, isValidElement, type ReactElement, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DaybreakButton, Eyebrow } from '@/components/joy/primitives'
import { Button, Card, EmptyState, PageHeader, Pill, SectionTitle, Sheet, Tabs, Toggle } from '@/components/ui'

// Mono for every number (Playbook, type): a number inside a sentence — "Day 76",
// "Mondays 7 pm", "05 Jan 2027", "LE8" — is set in the Mono `num` style like any
// standalone figure. Each journey component passes its returned tree through
// monoDigits(): text it renders directly, and the text it hands to the shared
// pieces below, has its digit runs wrapped. Attributes (aria-label, placeholder,
// title) stay plain strings. Components keep their own text: each journey component
// wraps its own return, and shared pieces outside this list set their own numbers.

/** A digit run with the word it is part of ("LE8", "HbA1c", "7.30", "1–3", "60th", "−17"). */
const DIGITS = /[+−]?[A-Za-z]*\d(?:[.,:/–-]?[A-Za-z0-9])*%?/g

/** Host elements whose children must stay text, or that are drawn rather than read. */
const KEEP = new Set(['option', 'select', 'textarea', 'input', 'script', 'style', 'title', 'svg', 'code', 'pre'])

const MOTION: unknown[] = [motion.div, motion.li, motion.p, motion.span, motion.form, motion.section, motion.ol, motion.ul, motion.article]

/** Shared pieces that render these props as text (children are always walked). */
const NODE_PROPS = new Map<unknown, string[]>([
  [PageHeader, ['eyebrow', 'title', 'lead', 'actions']],
  [SectionTitle, ['aside']],
  [EmptyState, ['title', 'body', 'action']],
  [Toggle, ['label', 'description']],
  // Sheet keeps its title a string: it is the dialog's accessible name.
  [Sheet, []],
  [Card, []],
  [Button, []],
  [DaybreakButton, []],
  [Pill, []],
  [Eyebrow, []],
  [Link, []],
  [AnimatePresence, []],
  [Tabs, []],
])

const isMono = (className: unknown) => typeof className === 'string' && /(^|\s)(num|font-mono)(\s|$)/.test(className)

function splitDigits(s: string, key?: string): ReactNode {
  DIGITS.lastIndex = 0
  if (!DIGITS.test(s)) return s
  DIGITS.lastIndex = 0
  const out: ReactNode[] = []
  let at = 0
  for (const m of s.matchAll(DIGITS)) {
    const i = m.index ?? 0
    if (i > at) out.push(s.slice(at, i))
    out.push(createElement('span', { className: 'num', key: out.length }, m[0]))
    at = i + m[0].length
  }
  if (at < s.length) out.push(s.slice(at))
  return createElement(Fragment, key === undefined ? null : { key }, ...out)
}

function walkChildren(children: ReactNode): { changed: boolean; next: ReactNode } {
  const next = walk(children)
  return { changed: next !== children, next }
}

function rebuild(el: ReactElement, props: Record<string, unknown> | undefined, children: ReactNode, childrenChanged: boolean): ReactElement {
  if (!childrenChanged) return props ? cloneElement(el, props) : el
  // Spread an array back into arguments so static siblings are not read as a keyed list.
  return Array.isArray(children) ? cloneElement(el, props, ...children) : cloneElement(el, props, children)
}

function walkElement(el: ReactElement): ReactElement {
  const props = el.props as Record<string, unknown>
  if (isMono(props.className) || props.dangerouslySetInnerHTML) return el
  const type = el.type as unknown
  const host = typeof type === 'string'
  if (host && KEEP.has(type)) return el
  if (!host && type !== Fragment && !MOTION.includes(type) && !NODE_PROPS.has(type)) return el
  if (typeof props.children === 'function') return el

  let extra: Record<string, unknown> | undefined
  for (const name of NODE_PROPS.get(type) ?? []) {
    const v = props[name]
    if (v === undefined || v === null) continue
    const w = walk(v as ReactNode)
    if (w !== v) (extra ??= {})[name] = w
  }
  if (type === Tabs && Array.isArray(props.items)) {
    const items = (props.items as { label: ReactNode }[]).map((it) => {
      const label = walk(it.label)
      return label === it.label ? it : { ...it, label }
    })
    if (items.some((it, i) => it !== (props.items as unknown[])[i])) (extra ??= {}).items = items
  }
  const { changed, next } = walkChildren(props.children as ReactNode)
  if (!changed && !extra) return el
  return rebuild(el, extra, next, changed)
}

function walk(node: ReactNode, key?: string): ReactNode {
  if (typeof node === 'string') return splitDigits(node, key)
  if (typeof node === 'number') return createElement('span', { className: 'num', key }, node)
  if (Array.isArray(node)) {
    let changed = false
    const out = node.map((c, i) => {
      const w = walk(c, `d${i}`)
      if (w !== c) changed = true
      return w
    })
    return changed ? out : node
  }
  if (isValidElement(node)) return walkElement(node)
  return node
}

/** The tree with every number in its text set in Mono. */
export function monoDigits(node: ReactNode): ReactNode {
  return walk(node)
}
