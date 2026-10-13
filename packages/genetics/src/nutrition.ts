import type { GeneraNutritionEntry } from '@helux/types'

type RawEntry = {
  snp?: unknown
  gene?: unknown
  genotipo?: unknown
  caracteristica?: unknown
  resultado?: unknown
}

type Section = GeneraNutritionEntry['section']

const SECTIONS: Section[] = ['pontos_de_atencao', 'cuidados_relevantes', 'curiosidades', 'achados_adicionais']

/** Genes do módulo `fit` que também orientam a nutrição (densidade óssea, potência, FTO). */
const FIT_GENES_FOR_NUTRITION = new Set(['WNT16', 'ACTN3', 'FTO'])

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function arr(v: unknown): RawEntry[] {
  return Array.isArray(v) ? (v.filter(e => e && typeof e === 'object') as RawEntry[]) : []
}

/**
 * Marcadores do teste Genera relevantes para nutrição (spec 018): todo o
 * módulo `nutri` e, de `fit`, WNT16/ACTN3/FTO. Textos originais, na ordem do
 * teste (nutri primeiro); SNP + traço repetidos aparecem uma vez.
 */
export function parseGeneraNutrition(raw: unknown): GeneraNutritionEntry[] {
  const genera = (raw && typeof raw === 'object' ? raw : {}) as {
    nutri?: Record<string, unknown>
    fit?: Record<string, unknown>
  }
  const seen = new Set<string>()
  const out: GeneraNutritionEntry[] = []

  const collect = (source: 'nutri' | 'fit', module: Record<string, unknown> | undefined, keep: (gene: string) => boolean) => {
    for (const section of SECTIONS) {
      for (const e of arr(module?.[section])) {
        const gene = str(e.gene)
        const snp = str(e.snp)
        const label = str(e.caracteristica)
        const result = str(e.resultado)
        if (!gene || !snp || !label || !result || !keep(gene)) continue
        const key = `${snp}:${label.toLowerCase()}`
        if (seen.has(key)) continue
        seen.add(key)
        const genotype = str(e.genotipo)
        out.push({ gene, snp, ...(genotype ? { genotype } : {}), label, result, section, source })
      }
    }
  }

  collect('nutri', genera.nutri, () => true)
  collect('fit', genera.fit, gene => FIT_GENES_FOR_NUTRITION.has(gene))
  return out
}
