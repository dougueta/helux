import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

// Spec 023 / FR-001, FR-002: o Render é o único destino de deploy, e toda variável
// do render.yaml e do contrato de ambiente está documentada no .env.example.

const apiDir = path.resolve(__dirname, '../..')
const repoRoot = path.resolve(apiDir, '../..')

const REQUIRED_IN_PRODUCTION = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'ANTHROPIC_API_KEY',
  'CORS_ORIGIN',
  'PERSONAL_API_KEY',
  'PERSONAL_USER_ID',
  'SUPABASE_SERVICE_ROLE_KEY',
]

/** Variáveis com valor fixo e não secreto no render.yaml. */
const PUBLIC_RENDER_VARS = ['NODE_ENV', 'HOST', 'PORT']

interface RenderEnvVar {
  key: string
  value?: string
  sync?: boolean
}

/** Lê os `envVars` do render.yaml sem depender de um parser YAML. */
function renderEnvVars(yaml: string): RenderEnvVar[] {
  const vars: RenderEnvVar[] = []
  for (const line of yaml.split(/\r?\n/)) {
    const key = line.match(/^\s*-\s*key:\s*(\S+)/)
    if (key) {
      vars.push({ key: key[1] })
      continue
    }
    const current = vars[vars.length - 1]
    if (!current) continue
    const value = line.match(/^\s*value:\s*(.+)$/)
    if (value) current.value = value[1].trim()
    const sync = line.match(/^\s*sync:\s*(true|false)/)
    if (sync) current.sync = sync[1] === 'true'
  }
  return vars
}

/** Nomes definidos no .env.example (linhas `NOME=` ou `# NOME=`). */
function envExampleKeys(content: string): Set<string> {
  const keys = new Set<string>()
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*#?\s*([A-Z][A-Z0-9_]*)=/)
    if (m) keys.add(m[1])
  }
  return keys
}

describe('configuração de deploy', () => {
  const renderPath = path.join(repoRoot, 'render.yaml')
  const render = existsSync(renderPath) ? readFileSync(renderPath, 'utf8') : ''
  const envVars = renderEnvVars(render)
  const envExample = envExampleKeys(readFileSync(path.join(repoRoot, '.env.example'), 'utf8'))

  it('não tem fly.toml na raiz (destino único: Render)', () => {
    expect(existsSync(path.join(repoRoot, 'fly.toml'))).toBe(false)
  })

  it('tem render.yaml com healthCheckPath /health', () => {
    expect(existsSync(renderPath)).toBe(true)
    expect(render).toMatch(/^\s*healthCheckPath:\s*\/health\s*$/m)
  })

  it('documenta no .env.example toda variável do render.yaml', () => {
    expect(envVars.length).toBeGreaterThan(0)
    const missing = envVars.map((v) => v.key).filter((key) => !envExample.has(key))
    expect(missing).toEqual([])
  })

  it.each(REQUIRED_IN_PRODUCTION)('declara %s no .env.example e no render.yaml', (name) => {
    expect(envExample.has(name), '.env.example').toBe(true)
    expect(envVars.map((v) => v.key), 'render.yaml').toContain(name)
  })

  it('usa sync: false em toda variável secreta do render.yaml', () => {
    const secrets = envVars.filter((v) => !PUBLIC_RENDER_VARS.includes(v.key))
    const exposed = secrets.filter((v) => v.sync !== false || v.value !== undefined).map((v) => v.key)
    expect(exposed).toEqual([])
  })
})

// Spec 023 / FR-005: CI mínimo em push e pull request (contrato 5).
describe('workflow de CI', () => {
  const ciPath = path.join(repoRoot, '.github', 'workflows', 'ci.yml')
  const ci = existsSync(ciPath) ? readFileSync(ciPath, 'utf8').replace(/\r\n/g, '\n') : ''

  /** Bloco `on:` do topo do workflow, até a próxima chave de nível 0. */
  const triggers = ci.match(/^on:\s*\n((?:[ \t]+.*\n|\s*\n)*)/m)?.[1] ?? ''

  it('existe em .github/workflows/ci.yml', () => {
    expect(existsSync(ciPath)).toBe(true)
  })

  it('dispara em push e pull_request', () => {
    expect(triggers).toMatch(/^\s+push:/m)
    expect(triggers).toMatch(/^\s+pull_request:/m)
  })

  it('instala com lockfile congelado e roda typecheck e testes, nessa ordem', () => {
    const steps = ci
      .split(/\r?\n/)
      .map((l) => l.match(/^\s*-?\s*run:\s*(.+)$/)?.[1]?.trim())
      .filter((cmd): cmd is string => !!cmd)
    const install = steps.indexOf('pnpm install --frozen-lockfile')
    const typecheck = steps.indexOf('pnpm typecheck')
    const test = steps.indexOf('pnpm test')
    expect(install).toBeGreaterThanOrEqual(0)
    expect(typecheck).toBeGreaterThan(install)
    expect(test).toBeGreaterThan(typecheck)
  })
})
