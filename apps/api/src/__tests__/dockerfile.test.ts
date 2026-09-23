import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

// Spec 011 / FR-020: o Dockerfile da API (usado pelo Render) copia cada pacote do
// workspace manualmente. Toda dependência @helux/* da API, inclusive transitiva,
// precisa do package.json no estágio de install e das fontes no estágio final.

const apiDir = path.resolve(__dirname, '../..')
const repoRoot = path.resolve(apiDir, '../..')

function workspaceDeps(pkgJsonPath: string): string[] {
  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as { dependencies?: Record<string, string> }
  return Object.entries(pkg.dependencies ?? {})
    .filter(([name, version]) => name.startsWith('@helux/') && version.startsWith('workspace:'))
    .map(([name]) => name.slice('@helux/'.length))
}

function transitiveWorkspacePackages(): string[] {
  const seen = new Set<string>()
  const queue = workspaceDeps(path.join(apiDir, 'package.json'))
  while (queue.length > 0) {
    const name = queue.shift()!
    if (seen.has(name)) continue
    seen.add(name)
    const pkgJson = path.join(repoRoot, 'packages', name, 'package.json')
    expect(existsSync(pkgJson), `packages/${name}/package.json existe`).toBe(true)
    queue.push(...workspaceDeps(pkgJson))
  }
  return [...seen].sort()
}

describe('apps/api/Dockerfile', () => {
  const dockerfile = readFileSync(path.join(apiDir, 'Dockerfile'), 'utf8')
  const copyLines = dockerfile
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('COPY '))

  const packages = transitiveWorkspacePackages()

  it('encontra as dependências de workspace da API (sanidade)', () => {
    expect(packages).toEqual(expect.arrayContaining(['types', 'workouts']))
  })

  it.each(packages)('copia package.json e fontes de packages/%s', (name) => {
    expect(copyLines).toContain(`COPY packages/${name}/package.json ./packages/${name}/package.json`)
    expect(copyLines).toContain(`COPY packages/${name}/ ./packages/${name}/`)
  })
})
