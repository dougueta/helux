import type { TestProject } from 'vitest/node'
import {
  assertDocker,
  assertGeneticProfile,
  assertLocalUrl,
  readLocalEnv,
  resolveAiMode,
  startLocalSupabase,
  stopLocalSupabase,
} from './prerequisites'

/**
 * Garante o Supabase local no ar para a suíte e2e (spec 017). Reaproveita um
 * ambiente já rodando; se foi a suíte que subiu, derruba no fim (salvo
 * E2E_KEEP_DB=1).
 */
export default function setup(project: TestProject): () => void {
  resolveAiMode(process.env)
  assertGeneticProfile()
  assertDocker()

  let env = readLocalEnv()
  let startedBySuite = false
  if (env) {
    console.info('[e2e] Supabase local já está no ar — reaproveitando')
  } else {
    console.info('[e2e] Subindo o Supabase local (pnpm db:start)...')
    startLocalSupabase()
    startedBySuite = true
    env = readLocalEnv()
    if (!env) throw new Error('[e2e] Supabase local não respondeu depois do db:start')
  }
  assertLocalUrl(env.apiUrl)
  project.provide('localEnv', env)

  return () => {
    if (startedBySuite && process.env.E2E_KEEP_DB !== '1') {
      console.info('[e2e] Derrubando o Supabase local que a suíte subiu (pnpm db:stop)')
      stopLocalSupabase()
    }
  }
}
