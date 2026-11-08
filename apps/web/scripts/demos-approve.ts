/**
 * `pnpm demos:approve <ids...>` ou `pnpm demos:approve --all-in-pr` (028, contracts/review-flow.md).
 * Grava o hash aprovado em `approvals.json` e tira o id de `pending.json`.
 * Rodar só com os ids que o dono aprovou no PR.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { MovementBase } from '@helux/exercises'
import { changedItems, itemHash, missingContent } from '@helux/exercises/src/review/check'
import type { CatalogEntry } from '@helux/exercises/src/gallery'

export interface ReviewState {
  pending: { ids: string[] }
  approvals: Record<string, string>
}

export type Selection = { ids: string[]; allInPr?: false } | { allInPr: true; ids?: undefined }

export function approve(state: ReviewState, selection: Selection, items: CatalogEntry[], bases: Record<string, MovementBase>): ReviewState {
  const byId = new Map(items.map((i) => [i.id, i]))
  const targets = selection.allInPr
    ? changedItems(items, state.approvals, bases)
    : selection.ids.map((id) => {
        const item = byId.get(id)
        if (!item) throw new Error(`${id}: id inexistente`)
        return item
      })

  const errors = targets.flatMap((item) => missingContent(item, bases).map((m) => `${item.id}: falta ${m}`))
  if (errors.length) throw new Error(errors.join('\n'))

  const approvals = { ...state.approvals }
  for (const item of targets) approvals[item.id] = itemHash(item, bases)
  const approved = new Set(targets.map((i) => i.id))
  return { pending: { ids: state.pending.ids.filter((id) => !approved.has(id)) }, approvals }
}

const REVIEW_DIR = path.resolve(__dirname, '../../../packages/exercises/src/review')

async function main(argv: string[]) {
  const allInPr = argv.includes('--all-in-pr')
  const ids = argv.filter((a) => !a.startsWith('--')).flatMap((a) => a.split(',')).map((a) => a.trim()).filter(Boolean)
  if (!allInPr && !ids.length) {
    console.error('Uso: pnpm demos:approve <id...> | --all-in-pr')
    process.exit(1)
  }
  const { CATALOG, MOVEMENT_BASES } = await import('@helux/exercises/src/gallery')
  const pendingFile = path.join(REVIEW_DIR, 'pending.json')
  const approvalsFile = path.join(REVIEW_DIR, 'approvals.json')
  const state: ReviewState = {
    pending: JSON.parse(readFileSync(pendingFile, 'utf8')),
    approvals: JSON.parse(readFileSync(approvalsFile, 'utf8')),
  }
  try {
    const next = approve(state, allInPr ? { allInPr: true } : { ids }, CATALOG, MOVEMENT_BASES)
    const sorted = Object.fromEntries(Object.entries(next.approvals).sort(([a], [b]) => a.localeCompare(b)))
    writeFileSync(approvalsFile, JSON.stringify(sorted, null, 2) + '\n')
    writeFileSync(pendingFile, JSON.stringify(next.pending, null, 2) + '\n')
    const count = Object.keys(next.approvals).filter((id) => next.approvals[id] !== state.approvals[id]).length
    console.log(`${count} item(ns) aprovado(s). Pendentes: ${next.pending.ids.length}.`)
  } catch (e) {
    console.error((e as Error).message)
    process.exit(1)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) void main(process.argv.slice(2))
