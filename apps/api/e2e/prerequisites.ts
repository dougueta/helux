import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

/** Credenciais do Supabase local (`supabase status -o env`). */
export interface LocalEnv {
  apiUrl: string
  anonKey: string
  serviceRoleKey: string
}

declare module 'vitest' {
  export interface ProvidedContext {
    localEnv: LocalEnv
  }
}

export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..')
export const GENETIC_PROFILE_PATH = path.resolve(__dirname, '..', 'data', 'genetics', 'genera.json')

export function parseStatusEnv(output: string): LocalEnv | null {
  const values = new Map<string, string>()
  for (const line of output.split('\n')) {
    const match = /^([A-Z_]+)="(.*)"\s*$/.exec(line.trim())
    if (match) values.set(match[1], match[2])
  }
  const apiUrl = values.get('API_URL')
  const anonKey = values.get('ANON_KEY')
  const serviceRoleKey = values.get('SERVICE_ROLE_KEY')
  if (!apiUrl || !anonKey || !serviceRoleKey) return null
  return { apiUrl, anonKey, serviceRoleKey }
}

export function assertLocalUrl(url: string): void {
  const { hostname } = new URL(url)
  if (hostname !== '127.0.0.1' && hostname !== 'localhost') {
    throw new Error(`[e2e] SUPABASE_URL não é local (${url}) — a suíte nunca roda contra um projeto remoto`)
  }
}

export type AiMode = 'fake' | 'real'

export function resolveAiMode(env: NodeJS.ProcessEnv | Record<string, string | undefined>): AiMode {
  if (env.E2E_REAL_AI !== '1') return 'fake'
  if (!env.ANTHROPIC_API_KEY) throw new Error('[e2e] E2E_REAL_AI=1 exige ANTHROPIC_API_KEY')
  return 'real'
}

export function assertDocker(): void {
  try {
    execFileSync('docker', ['info'], { stdio: 'ignore' })
  } catch {
    throw new Error('[e2e] Docker não está rodando — inicie o Docker e rode de novo')
  }
}

export function assertGeneticProfile(): void {
  if (!existsSync(GENETIC_PROFILE_PATH)) {
    throw new Error(`[e2e] Perfil genético ausente em apps/api/data/genetics/genera.json — sem ele o mesociclo não é gerado`)
  }
}

function rootScript(script: string, stdio: 'pipe' | 'inherit'): string {
  return execFileSync('pnpm', ['-s', script], { cwd: REPO_ROOT, stdio: ['ignore', stdio, stdio], encoding: 'utf-8' }) ?? ''
}

/** Lê as credenciais do Supabase local; null se ele não estiver no ar. */
export function readLocalEnv(): LocalEnv | null {
  try {
    return parseStatusEnv(rootScript('db:status', 'pipe'))
  } catch {
    return null
  }
}

export function startLocalSupabase(): void {
  rootScript('db:start', 'inherit')
}

export function stopLocalSupabase(): void {
  rootScript('db:stop', 'inherit')
}
