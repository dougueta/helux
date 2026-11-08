/**
 * Trava do catálogo (R12, FR-021 a FR-025): todo item fora de `pending.json` precisa de demonstração,
 * orientação e hash igual ao aprovado. Usado pelos testes e pelos scripts de revisão; fora do bundle da web.
 */
import type { CatalogEntry } from '../catalog'
import { resolveDemoSpec } from '../engine/resolve-demo'
import type { MovementBase, ResolvedDemo } from '../engine/types'
import type { CatalogKind } from '../types'
import { canonicalJson, contentHash } from './hash'

export interface CheckContext {
  pending: ReadonlySet<string>
  approvals: Record<string, string>
  bases: Record<string, MovementBase>
}

/** Demonstração resolvida do item, ou null se não houver demo ou base. */
export function resolvedDemoOf(item: CatalogEntry, bases: Record<string, MovementBase>): ResolvedDemo | null {
  return item.demo ? resolveDemoSpec(item.id, item.demo, bases) : null
}

/** Hash do conteúdo revisado do item: demonstração resolvida (com a base) + orientação. */
export function itemHash(item: CatalogEntry, bases: Record<string, MovementBase>): string {
  return contentHash({ demo: resolvedDemoOf(item, bases), guidance: item.guidance ?? null })
}

/** O que falta no conteúdo do item (demo, base, orientação), sem olhar a aprovação. */
export function missingContent(item: CatalogEntry, bases: Record<string, MovementBase>): string[] {
  const missing: string[] = []
  if (!item.demo) missing.push('demo')
  else {
    if (!bases[item.demo.base]) missing.push(`base ${item.demo.base}`)
    if (item.gear && item.demo.gear !== item.gear) missing.push(`gear ${item.gear} na demo`)
  }
  const g = item.guidance
  if (!g) missing.push('orientação')
  else {
    if (!g.setup?.some((s) => s.trim())) missing.push('posição inicial')
    if (!g.steps?.some((s) => s.trim())) missing.push('passos')
    if (item.kind === 'forca' && !g.commonError?.trim()) missing.push('erro comum')
  }
  return missing
}

/** Mensagens no formato "<id>: falta <item>", na ordem do catálogo. Vazio = tudo em dia. */
export function checkCatalog(items: CatalogEntry[], ctx: CheckContext): string[] {
  const problems: string[] = []
  const ready = items.filter((i) => !ctx.pending.has(i.id))
  const complete: CatalogEntry[] = []

  for (const item of ready) {
    const missing = missingContent(item, ctx.bases)
    if (missing.length) {
      for (const m of missing) problems.push(`${item.id}: falta ${m}`)
      continue
    }
    complete.push(item)
  }

  // FR-003: a mesma demonstração resolvida em dois itens exige legendas distintas.
  const groups = new Map<string, CatalogEntry[]>()
  for (const item of complete) {
    const demo = resolvedDemoOf(item, ctx.bases)!
    const { id: _id, caption: _caption, ...visual } = demo
    const key = canonicalJson(visual)
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  const needsCaption = new Set<string>()
  for (const group of groups.values()) {
    if (group.length < 2) continue
    const captions = group.map((i) => i.demo!.caption?.trim() ?? '')
    group.forEach((item, idx) => {
      const caption = captions[idx]
      if (!caption || captions.filter((c) => c === caption).length > 1) needsCaption.add(item.id)
    })
  }

  for (const item of complete) {
    if (needsCaption.has(item.id)) {
      problems.push(`${item.id}: falta legenda`)
      continue
    }
    const approved = ctx.approvals[item.id]
    if (!approved) problems.push(`${item.id}: falta aprovação`)
    else if (approved !== itemHash(item, ctx.bases)) problems.push(`${item.id}: falta nova aprovação`)
  }

  const order = new Map(items.map((i, idx) => [i.id, idx]))
  return problems.sort((a, b) => order.get(a.split(':')[0])! - order.get(b.split(':')[0])!)
}

/** Linhas "<catálogo>: aprovados/total" (FR-022, FR-023). */
export function coverageByKind(items: CatalogEntry[], pending: ReadonlySet<string>): string[] {
  const kinds: CatalogKind[] = ['forca', 'preparacao', 'cardio']
  return kinds.map((kind) => {
    const ofKind = items.filter((i) => i.kind === kind)
    const approved = ofKind.filter((i) => !pending.has(i.id)).length
    return `${kind}: ${approved}/${ofKind.length}`
  })
}

/**
 * Itens alterados: têm demonstração e o hash atual difere do aprovado (ou não há aprovação).
 * Itens pendentes sem demonstração ficam de fora (contracts/review-flow.md).
 */
export function changedItems(items: CatalogEntry[], approvals: Record<string, string>, bases: Record<string, MovementBase>): CatalogEntry[] {
  return items.filter((item) => item.demo && approvals[item.id] !== itemHash(item, bases))
}
