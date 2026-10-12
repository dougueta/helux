import type { GeneticTrait } from '@helux/types'

type RawEntry = {
  snp?: unknown
  gene?: unknown
  genotipo?: unknown
  caracteristica?: unknown
  resultado?: unknown
  categoria?: unknown
}

type Section = 'pontos_de_atencao' | 'cuidados_relevantes' | 'curiosidades' | 'achados_adicionais' | 'resultados'

const RISK_SECTIONS = new Set<Section>(['pontos_de_atencao', 'cuidados_relevantes'])
const RISK_CATEGORIES = new Set(['ponto_atencao', 'cuidado_relevante', 'lesao'])

const HIGH = /^maior (predisposição|suscetibilidade)/i
const LOW = /^(sem|menor) predisposição/i

function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function arr(v: unknown): RawEntry[] {
  return Array.isArray(v) ? (v.filter(e => e && typeof e === 'object') as RawEntry[]) : []
}

/**
 * Marcadores de treino do teste Genera (spec 020): só `fit` e
 * `painel_saude_esportiva`, com os textos originais. Risco primeiro
 * (pontos de atenção, depois cuidados relevantes e lesões), o resto na
 * ordem do teste; repetições de SNP + traço aparecem uma vez.
 */
export function parseGeneraTraits(raw: unknown): GeneticTrait[] {
  const genera = (raw && typeof raw === 'object' ? raw : {}) as {
    fit?: Record<string, unknown>
    painel_saude_esportiva?: Record<string, unknown>
  }
  const fit = genera.fit ?? {}
  const sources: [Section, RawEntry[]][] = [
    ['pontos_de_atencao', arr(fit.pontos_de_atencao)],
    ['cuidados_relevantes', arr(fit.cuidados_relevantes)],
    ['curiosidades', arr(fit.curiosidades)],
    ['resultados', arr(genera.painel_saude_esportiva?.resultados)],
    ['achados_adicionais', arr(fit.achados_adicionais)],
  ]

  const seen = new Set<string>()
  const ranked: { trait: GeneticTrait; priority: number }[] = []

  for (const [section, entries] of sources) {
    for (const e of entries) {
      const snp = str(e.snp)
      const gene = str(e.gene)
      const label = str(e.caracteristica)
      const note = str(e.resultado)
      if (!snp || !gene || !label || !note) continue

      const key = `${snp}:${slug(label)}`
      if (seen.has(key)) continue
      seen.add(key)

      const categoria = str(e.categoria)
      const attention = section === 'pontos_de_atencao' || categoria === 'ponto_atencao'
      const warn = RISK_SECTIONS.has(section) || RISK_CATEGORIES.has(categoria)
      const level = attention || HIGH.test(note) ? 0.9 : LOW.test(note) ? 0.2 : 0.5
      const genotype = str(e.genotipo)

      ranked.push({
        trait: { key, gene, ...(genotype ? { genotype } : {}), label, level, note, warn },
        priority: attention ? 0 : warn ? 1 : 2,
      })
    }
  }

  return ranked.sort((a, b) => a.priority - b.priority).map(r => r.trait)
}
