/**
 * Guarda do design system v2 (spec 012, FR-010, research V3).
 *
 * A aparência vem da folha do sistema `src/app/helux-v2.css` e dos tokens
 * declarados nos `:root` de `globals.css` e `helux-v2.css`. Este teste falha,
 * apontando arquivo e linha, quando algum arquivo `.ts`/`.tsx` de `src/`
 * (fora de `__tests__`):
 *   1. usa em `className` uma classe que não está definida em `helux-v2.css`.
 *      Também vale para qualquer string com prefixo `hx-` no código (classes
 *      montadas em mapas/arrays), o que obriga nomes de classe completos;
 *   2. usa `var(--x)` sem `--x` declarado num dos `:root` (exceto `--font-*`,
 *      injetadas pelo next/font);
 *   3. usa cor literal (hex, `rgb()`, `rgba()`) fora da camada de tokens;
 *   4. usa `--accent-glow` (em qualquer lugar, inclusive CSS) ou um
 *      `box-shadow` externo com o acento (brilho).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = path.resolve(__dirname, '..')
const GLOBALS_CSS = path.join(SRC, 'app', 'globals.css')
const SYSTEM_CSS = path.join(SRC, 'app', 'helux-v2.css')

/** Variáveis injetadas em tempo de execução pelo next/font (className do `<html>`). */
const RUNTIME_VAR_PREFIXES = ['--font-']

function listFiles(dir: string, ext: RegExp): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue
      out.push(...listFiles(full, ext))
    } else if (ext.test(entry) && !/\.d\.ts$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

function rootVars(file: string): Set<string> {
  const css = stripComments(readFileSync(file, 'utf-8'))
  const vars = new Set<string>()
  for (const root of css.matchAll(/:root\s*\{([^}]*)\}/g)) {
    for (const m of root[1].matchAll(/(--[\w-]+)\s*:/g)) vars.add(m[1])
  }
  return vars
}

/** Classes definidas na folha do sistema: todo `.nome` que aparece num seletor. */
function systemClasses(): Set<string> {
  const css = stripComments(readFileSync(SYSTEM_CSS, 'utf-8'))
  const classes = new Set<string>()
  for (const sel of css.matchAll(/([^{}]+)\{/g)) {
    if (sel[1].trim().startsWith('@')) continue
    for (const m of sel[1].matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) classes.add(m[1])
  }
  return classes
}

/** Conteúdo dos literais de string de um trecho, sem as interpolações `${...}`. */
function stringLiterals(code: string): string[] {
  const out: string[] = []
  for (const m of code.matchAll(/'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g)) {
    const raw = m[1] ?? m[2] ?? m[3] ?? ''
    out.push(raw.replace(/\$\{[^}]*\}/g, ' '))
  }
  return out
}

/** Valor de cada `className=` da linha: `"..."` ou a expressão `{...}` balanceada. */
function classNameValues(line: string): string[] {
  const out: string[] = []
  let from = 0
  for (;;) {
    const at = line.indexOf('className=', from)
    if (at < 0) break
    let i = at + 'className='.length
    if (line[i] === '"' || line[i] === "'") {
      const end = line.indexOf(line[i], i + 1)
      out.push(line.slice(i, end < 0 ? undefined : end + 1))
      from = end < 0 ? line.length : end + 1
    } else if (line[i] === '{') {
      let depth = 0
      const start = i
      for (; i < line.length; i++) {
        if (line[i] === '{') depth++
        else if (line[i] === '}' && --depth === 0) break
      }
      out.push(line.slice(start, i + 1))
      from = i + 1
    } else {
      from = i
    }
  }
  return out
}

const rel = (file: string) => path.relative(SRC, file).split(path.sep).join('/')

function scan() {
  const declared = new Set([...rootVars(GLOBALS_CSS), ...rootVars(SYSTEM_CSS)])
  const classes = systemClasses()
  const unknownClasses: string[] = []
  const undeclaredVars: string[] = []
  const literalColors: string[] = []
  const glow: string[] = []

  for (const file of listFiles(SRC, /\.(ts|tsx)$/)) {
    const name = rel(file)
    const lines = readFileSync(file, 'utf-8').split(/\r?\n/)
    lines.forEach((line, i) => {
      const where = `${name}:${i + 1}`

      // 1a. classes em className (string, template ou expressão na mesma linha)
      for (const expr of classNameValues(line)) {
        for (const lit of stringLiterals(expr)) {
          for (const token of lit.split(/\s+/).filter(Boolean)) {
            if (!classes.has(token)) unknownClasses.push(`${where} ${token}`)
          }
        }
      }
      // 1b. qualquer literal com prefixo hx- precisa ser uma classe completa
      for (const lit of stringLiterals(line)) {
        for (const token of lit.split(/\s+/).filter(t => t.startsWith('hx-'))) {
          if (!classes.has(token)) unknownClasses.push(`${where} ${token}`)
        }
      }

      // 2. tokens
      for (const m of line.matchAll(/var\(\s*(--[\w-]+)/g)) {
        const v = m[1]
        if (declared.has(v) || RUNTIME_VAR_PREFIXES.some(p => v.startsWith(p))) continue
        undeclaredVars.push(`${where} ${v}`)
      }

      // 3. cores literais
      for (const m of line.matchAll(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b|\brgba?\(/g)) {
        literalColors.push(`${where} ${m[0]}`)
      }

      // 4. brilho do acento
      if (line.includes('--accent-glow')) glow.push(`${where} --accent-glow`)
      if (/box-?shadow/i.test(line) && /--accent\b/.test(line) && !/inset/.test(line)) {
        glow.push(`${where} box-shadow com acento`)
      }
    })
  }

  for (const file of listFiles(path.join(SRC, 'app'), /\.css$/)) {
    const name = rel(file)
    readFileSync(file, 'utf-8')
      .split(/\r?\n/)
      .forEach((line, i) => {
        if (line.includes('--accent-glow')) glow.push(`${name}:${i + 1} --accent-glow`)
      })
  }

  return { unknownClasses, undeclaredVars, literalColors, glow }
}

describe('design system v2 — leitura da folha do sistema', () => {
  it('extrai as classes dos seletores, inclusive modificadores e estados', () => {
    const classes = systemClasses()
    for (const c of ['hx-btn', 'hx-btn--primary', 't-display', 'n-md', 'u', 'on', 'cur', 'is-gene', 'hx-page']) {
      expect(classes, c).toContain(c)
    }
  })

  it('não contém as classes que só existiam no protótipo', () => {
    const classes = systemClasses()
    for (const c of ['hx-phone', 'hx-status', 'hx-status-r', 'hx-scroll', 'hx-home-ind']) {
      expect(classes, c).not.toContain(c)
    }
  })

  it('lê os tokens dos dois :root', () => {
    expect(rootVars(SYSTEM_CSS)).toContain('--fit-hi')
    expect(rootVars(SYSTEM_CSS)).toContain('--z-sheet')
  })
})

describe('design system v2 — teste de guarda (FR-010)', () => {
  const result = scan()

  it('toda classe usada está definida em app/helux-v2.css', () => {
    expect(result.unknownClasses).toEqual([])
  })

  it('toda var(--x) usada está declarada num :root (globals.css ou helux-v2.css)', () => {
    expect(result.undeclaredVars).toEqual([])
  })

  it('nenhuma cor literal (hex, rgb, rgba) fora da camada de tokens', () => {
    expect(result.literalColors).toEqual([])
  })

  it('nenhum brilho do acento (--accent-glow ou box-shadow externo com acento)', () => {
    expect(result.glow).toEqual([])
  })
})
