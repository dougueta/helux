/**
 * `pnpm demos:check-pending [--base origin/main]` (028, contracts/review-flow.md).
 * Compara `pending.json` com a branch base e falha se algum id foi adicionado: a lista só diminui.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const PENDING_PATH = 'packages/exercises/src/review/pending.json'

export interface PendingCheck {
  ok: boolean
  added: string[]
  message: string
}

/** `baseJson` é o conteúdo do arquivo na base, ou null se ele ainda não existir lá. */
export function checkPending(baseJson: string | null, current: { ids: string[] }): PendingCheck {
  if (baseJson === null) return { ok: true, added: [], message: 'pending.json não existe na base; nada a comparar.' }
  const before = new Set<string>((JSON.parse(baseJson) as { ids: string[] }).ids)
  const added = current.ids.filter((id) => !before.has(id))
  if (added.length) {
    return {
      ok: false,
      added,
      message: `pending.json só pode diminuir. Ids adicionados: ${added.join(', ')}. Item novo precisa nascer com demonstração, orientação e aprovação.`,
    }
  }
  const removed = [...before].filter((id) => !current.ids.includes(id)).length
  return { ok: true, added: [], message: `pending.json ok (${current.ids.length} pendentes, ${removed} saíram da lista).` }
}

function repoRoot(): string {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
}

function readAtRef(ref: string, file: string): string | null {
  try {
    return execFileSync('git', ['show', `${ref}:${file}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  } catch {
    return null
  }
}

function main(argv: string[]) {
  const i = argv.indexOf('--base')
  const base = i >= 0 ? argv[i + 1] : 'origin/main'
  const root = repoRoot()
  const current = JSON.parse(readFileSync(path.join(root, PENDING_PATH), 'utf8')) as { ids: string[] }
  const result = checkPending(readAtRef(base, PENDING_PATH), current)
  console.log(result.message)
  if (!result.ok) process.exit(1)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2))
