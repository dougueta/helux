/**
 * Evidência das demonstrações para o PR (028, contracts/review-flow.md, R11).
 *
 *   pnpm demos:evidence [--ids a,b] [--out dir] [--url http://localhost:3000]
 *     Gera, para cada item alterado (ou indicado), start.png, mid.png, end.png, card.png e demo.gif
 *     em 390 × 844 com deviceScaleFactor 2, a partir da galeria /dev/demos com `phase` fixa.
 *     Grava também `manifest.json` com os itens. Falha em item sem demonstração ou erro de captura.
 *
 *   pnpm demos:evidence --comment --manifest dir --repo dono/repo --evidence-sha <sha> --pr-sha <sha> [--batch nome]
 *     Imprime o corpo do comentário do PR.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { MovementBase } from '@helux/exercises'
import type { CatalogEntry } from '@helux/exercises/src/gallery'
import { changedItems, missingContent } from '@helux/exercises/src/review/check'

export const COMMENT_MARKER = '<!-- demo-evidence -->'
export const MAX_BATCH = 15
export const GIF_FPS = 12
export const MAX_GIF_BYTES = 2 * 1024 * 1024
export const VIEWPORT = { width: 390, height: 844 } as const

/** Itens da evidência: os indicados em `ids` ou os alterados (com demo e hash diferente do aprovado). */
export function selectEvidenceItems(
  items: CatalogEntry[],
  approvals: Record<string, string>,
  bases: Record<string, MovementBase>,
  ids?: string[],
): CatalogEntry[] {
  if (!ids?.length) return changedItems(items, approvals, bases)
  const byId = new Map(items.map((i) => [i.id, i]))
  const errors: string[] = []
  const selected = ids.flatMap((id) => {
    const item = byId.get(id)
    if (!item) {
      errors.push(`${id}: id inexistente`)
      return []
    }
    if (!item.demo) {
      errors.push(`${id}: falta demo`)
      return []
    }
    errors.push(...missingContent(item, bases).filter((m) => m.startsWith('base ')).map((m) => `${id}: falta ${m}`))
    return [item]
  })
  if (errors.length) throw new Error(errors.join('\n'))
  return selected
}

export interface CommentContext {
  repo: string
  /** commit da branch de evidências, para links fixos */
  evidenceSha: string
  /** commit do PR mostrado no cabeçalho */
  prSha: string
  batch?: string
}

export function buildComment(items: { id: string; name: string }[], ctx: CommentContext): string {
  const head = `Commit: ${ctx.prSha.slice(0, 7)}.${ctx.batch ? ` Lote: ${ctx.batch}.` : ''}`
  if (!items.length) {
    return [COMMENT_MARKER, '## Demonstrações para revisão', head, '', 'Nenhuma demonstração alterada neste PR.', ''].join('\n')
  }
  const link = (id: string, file: string) => `https://github.com/${ctx.repo}/blob/${ctx.evidenceSha}/${id}/${file}?raw=true`
  const lines = [COMMENT_MARKER, `## Demonstrações para revisão: ${items.length} ${items.length === 1 ? 'item' : 'itens'}`, head, '']
  if (items.length > MAX_BATCH) {
    lines.push(`> Aviso: ${items.length} itens passam do limite de ${MAX_BATCH} por lote. Considere dividir a revisão.`, '')
  }
  lines.push('| Item | Demonstração | Quadros |', '|:---|:---|:---|')
  for (const item of items) lines.push(`| ${item.name} | [GIF](${link(item.id, 'demo.gif')}) | [cartão](${link(item.id, 'card.png')}) |`)
  lines.push('', 'Para aprovar, responda com "aprovar tudo", ou "aprovar: id, id".', 'O que não for citado continua pendente.', '')
  return lines.join('\n')
}

// ---------------------------------------------------------------- captura

function arg(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name)
  return i >= 0 ? argv[i + 1] : undefined
}

/** Reduz a imagem pela metade (vizinho mais próximo). */
function halve(rgba: Uint8Array, width: number, height: number) {
  const w = Math.floor(width / 2)
  const h = Math.floor(height / 2)
  const out = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = (y * 2 * width + x * 2) * 4
      out.set(rgba.subarray(src, src + 4), (y * w + x) * 4)
    }
  }
  return { rgba: out, width: w, height: h }
}

async function encodeGif(frames: Buffer[]): Promise<Uint8Array> {
  const { PNG } = await import('pngjs')
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc')
  let decoded = frames.map((f) => {
    const png = PNG.sync.read(f)
    return { rgba: new Uint8Array(png.data), width: png.width, height: png.height }
  })
  for (let attempt = 0; attempt < 3; attempt++) {
    const gif = GIFEncoder()
    for (const frame of decoded) {
      const palette = quantize(frame.rgba, 256)
      gif.writeFrame(applyPalette(frame.rgba, palette), frame.width, frame.height, { palette, delay: Math.round(1000 / GIF_FPS) })
    }
    gif.finish()
    const bytes = gif.bytes()
    if (bytes.length <= MAX_GIF_BYTES) return bytes
    decoded = decoded.map((d) => halve(d.rgba, d.width, d.height))
  }
  throw new Error(`GIF acima de ${MAX_GIF_BYTES} bytes mesmo reduzido`)
}

async function capture(items: CatalogEntry[], outDir: string, baseUrl: string) {
  const { chromium } = await import('playwright')
  const { resolveDemo } = await import('@helux/exercises/src/gallery')
  const { keyPhases } = await import('@helux/exercises')
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 })
    const open = async (id: string, query: string) => {
      const res = await page.goto(`${baseUrl}/dev/demos?ids=${encodeURIComponent(id)}&frame=1&${query}`, { waitUntil: 'networkidle' })
      if (!res || !res.ok()) throw new Error(`${id}: falha ao abrir a galeria (${res?.status() ?? 'sem resposta'})`)
      await page.locator(`[data-demo-id="${id}"] svg`).first().waitFor()
    }
    for (const item of items) {
      const demo = resolveDemo(item.id)
      if (!demo) throw new Error(`${item.id}: falta demo`)
      const dir = path.join(outDir, item.id)
      mkdirSync(dir, { recursive: true })
      const phases = keyPhases(demo)
      const stills: [string, number][] = [['start.png', phases.start], ['mid.png', phases.mid], ['end.png', phases.end]]
      for (const [file, phase] of stills) {
        await open(item.id, `phase=${phase}`)
        await page.screenshot({ path: path.join(dir, file) })
      }
      await open(item.id, 'card=1')
      await page.screenshot({ path: path.join(dir, 'card.png') })

      const count = Math.max(GIF_FPS, Math.round((demo.durationMs / 1000) * GIF_FPS))
      const frames: Buffer[] = []
      for (let i = 0; i < count; i++) {
        await open(item.id, `phase=${(i / count).toFixed(4)}`)
        frames.push(await page.locator(`[data-demo-id="${item.id}"] .hx-stage`).first().screenshot())
      }
      writeFileSync(path.join(dir, 'demo.gif'), await encodeGif(frames))
      console.log(`${item.id}: ok`)
    }
  } finally {
    await browser.close()
  }
}

async function main(argv: string[]) {
  if (argv.includes('--comment')) {
    const manifestDir = arg(argv, '--manifest') ?? 'demo-evidence'
    const items = JSON.parse(readFileSync(path.join(manifestDir, 'manifest.json'), 'utf8')) as { id: string; name: string }[]
    const repo = arg(argv, '--repo')
    const evidenceSha = arg(argv, '--evidence-sha')
    const prSha = arg(argv, '--pr-sha')
    if (!repo || !evidenceSha || !prSha) throw new Error('--comment exige --repo, --evidence-sha e --pr-sha')
    process.stdout.write(buildComment(items, { repo, evidenceSha, prSha, batch: arg(argv, '--batch') }))
    return
  }

  const { CATALOG, MOVEMENT_BASES } = await import('@helux/exercises/src/gallery')
  const approvalsFile = path.resolve(process.cwd(), '../../packages/exercises/src/review/approvals.json')
  const approvals = JSON.parse(readFileSync(approvalsFile, 'utf8')) as Record<string, string>
  const ids = arg(argv, '--ids')?.split(',').map((s) => s.trim()).filter(Boolean)
  const outDir = path.resolve(arg(argv, '--out') ?? 'demo-evidence')
  const items = selectEvidenceItems(CATALOG, approvals, MOVEMENT_BASES, ids)
  mkdirSync(outDir, { recursive: true })
  writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(items.map(({ id, name }) => ({ id, name })), null, 2) + '\n')
  if (!items.length) {
    console.log('Nenhuma demonstração alterada.')
    return
  }
  if (items.length > MAX_BATCH) console.warn(`Aviso: ${items.length} itens passam do limite de ${MAX_BATCH} por lote.`)
  await capture(items, outDir, arg(argv, '--url') ?? 'http://localhost:3000')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((e: Error) => {
    console.error(e.message)
    process.exit(1)
  })
}
