/**
 * Teste de guarda do design system (spec 012, FR-008).
 *
 * O padrão único do app web é estilo inline + variáveis CSS declaradas no
 * `:root` de `src/app/globals.css`. Este teste falha, apontando arquivo e
 * linha, quando algum arquivo de `src/` (fora de `__tests__`):
 *   1. usa `className` (classes utilitárias antigas);
 *   2. usa `var(--x)` sem `--x` declarado no `:root` de `globals.css`;
 *   3. usa uma cor hexadecimal literal (as cores vivem só em `globals.css`).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = path.resolve(__dirname, '..')
const GLOBALS_CSS = path.join(SRC, 'app', 'globals.css')

/**
 * Exceção única de `className`: o `<html>` de `app/layout.tsx` recebe as
 * classes geradas pelo `next/font` (que injetam `--font-space-grotesk` e
 * `--font-jetbrains-mono`). Não há como aplicar essas variáveis sem className.
 */
const CLASSNAME_ALLOWED: Array<{ file: string; pattern: RegExp }> = [
  { file: 'app/layout.tsx', pattern: /<html\b[^>]*className=\{`\$\{\w+\.variable\} \$\{\w+\.variable\}`\}/ },
]

/**
 * Variáveis com prefixo `--font-` são injetadas em tempo de execução pelo
 * `next/font` (via className do `<html>`), então não aparecem no `:root`.
 */
const RUNTIME_VAR_PREFIXES = ['--font-']

function listSourceFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue
      out.push(...listSourceFiles(full))
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.d\.ts$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

function declaredRootVars(): Set<string> {
  const css = readFileSync(GLOBALS_CSS, 'utf-8')
  const root = css.match(/:root\s*\{([^}]*)\}/)
  const vars = new Set<string>()
  if (!root) return vars
  for (const m of root[1].matchAll(/(--[\w-]+)\s*:/g)) vars.add(m[1])
  return vars
}

const rel = (file: string) => path.relative(SRC, file).split(path.sep).join('/')

function scan() {
  const declared = declaredRootVars()
  const classNames: string[] = []
  const undeclaredVars: string[] = []
  const hexColors: string[] = []

  for (const file of listSourceFiles(SRC)) {
    const name = rel(file)
    const lines = readFileSync(file, 'utf-8').split(/\r?\n/)
    lines.forEach((line, i) => {
      const where = `${name}:${i + 1}`

      if (/\bclassName\b/.test(line)) {
        const allowed = CLASSNAME_ALLOWED.some(a => a.file === name && a.pattern.test(line))
        if (!allowed) classNames.push(where)
      }

      for (const m of line.matchAll(/var\(\s*(--[\w-]+)/g)) {
        const v = m[1]
        if (declared.has(v) || RUNTIME_VAR_PREFIXES.some(p => v.startsWith(p))) continue
        undeclaredVars.push(`${where} ${v}`)
      }

      for (const m of line.matchAll(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
        hexColors.push(`${where} ${m[0]}`)
      }
    })
  }
  return { classNames, undeclaredVars, hexColors }
}

describe('design system — teste de guarda (FR-008)', () => {
  const result = scan()

  it('nenhum className fora da exceção do next/font no <html>', () => {
    expect(result.classNames).toEqual([])
  })

  it('toda var(--x) usada está declarada no :root de globals.css', () => {
    expect(result.undeclaredVars).toEqual([])
  })

  it('nenhuma cor hexadecimal literal fora de globals.css', () => {
    expect(result.hexColors).toEqual([])
  })
})
