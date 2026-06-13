import type { GeneticProfile } from '@helux/types'

type FitEntry = {
  snp: string
  gene: string
  genotipo: string
  resultado: string
  categoria?: string
}

type GeneraFit = {
  pontos_de_atencao?: FitEntry[]
  cuidados_relevantes?: FitEntry[]
  achados_adicionais?: FitEntry[]
  curiosidades?: FitEntry[]
}

type GeneraInput = {
  fit?: GeneraFit
  escala_risco_genetico?: {
    risco_aumentado?: Array<{ condicao: string; nivel: string }>
    risco_padrao?: Array<{ condicao: string; nivel: string }>
    risco_reduzido?: Array<{ condicao: string; nivel: string }>
  }
  painel_saude_esportiva?: {
    resultados?: FitEntry[]
  }
  resumo_fitness?: {
    pontos_fortes?: string[]
    pontos_de_atencao?: string[]
  }
}

const CARDIOVASCULAR_CONDITIONS = [
  'fibrilação atrial',
  'doença arterial coronariana',
  'acidente vascular cerebral',
  'insuficiência cardíaca',
  'infarto',
]

function isCardiovascular(condicao: string): boolean {
  const lower = condicao.toLowerCase()
  return CARDIOVASCULAR_CONDITIONS.some((c) => lower.includes(c))
}

function buildSNPMap(genera: GeneraInput): Map<string, FitEntry> {
  const map = new Map<string, FitEntry>()
  const sections: (FitEntry[] | undefined)[] = [
    genera.fit?.pontos_de_atencao,
    genera.fit?.cuidados_relevantes,
    genera.fit?.achados_adicionais,
    genera.fit?.curiosidades,
    genera.painel_saude_esportiva?.resultados,
  ]
  for (const section of sections) {
    for (const entry of section ?? []) {
      if (!map.has(entry.snp)) {
        map.set(entry.snp, entry)
      }
    }
  }
  return map
}

function deriveMetabolismo(snpMap: Map<string, FitEntry>): GeneticProfile['metabolismo'] {
  const fto = snpMap.get('rs9939609')
  if (fto?.genotipo === 'A,A') return 'lento'
  if (fto?.genotipo === 'T,T') return 'moderado'
  return 'moderado'
}

function deriveRecuperacaoMuscular(snpMap: Map<string, FitEntry>): GeneticProfile['recuperacaoMuscular'] {
  const chrm2 = snpMap.get('rs324640')
  if (!chrm2) return 'media'
  if (chrm2.genotipo === 'A,A') return 'baixa'
  if (chrm2.genotipo === 'G,A') return 'media'
  return 'alta'
}

function deriveRiscoCardiovascular(genera: GeneraInput): GeneticProfile['riscoCardiovascular'] {
  const aumentadas = (genera.escala_risco_genetico?.risco_aumentado ?? []).filter((r) =>
    isCardiovascular(r.condicao)
  )
  if (aumentadas.length >= 2) return 'alto'
  if (aumentadas.length === 1) return 'medio'
  return 'baixo'
}

function derivePredisposicao(snpMap: Map<string, FitEntry>): GeneticProfile['predisposicao'] {
  const actn3 = snpMap.get('rs1815739')
  const hasForce = actn3?.genotipo === 'C,C'

  const enduranceSnps = ['rs1572312', 'rs4253778']
  const hasEndurance = enduranceSnps.some((snp) => snpMap.has(snp))

  if (hasForce && hasEndurance) return 'misto'
  if (hasForce) return 'forca'
  if (hasEndurance) return 'endurance'
  return 'misto'
}

function buildAlertas(genera: GeneraInput): string[] {
  return genera.resumo_fitness?.pontos_de_atencao ?? []
}

export function parseGeneraJson(raw: unknown): GeneticProfile {
  const genera = raw as GeneraInput

  if (!genera.fit) {
    throw new Error('Dados Genera inválidos: seção "fit" ausente')
  }
  if (!genera.escala_risco_genetico) {
    throw new Error('Dados Genera inválidos: seção "escala_risco_genetico" ausente')
  }

  const snpMap = buildSNPMap(genera)

  return {
    metabolismo: deriveMetabolismo(snpMap),
    recuperacaoMuscular: deriveRecuperacaoMuscular(snpMap),
    riscoCardiovascular: deriveRiscoCardiovascular(genera),
    predisposicao: derivePredisposicao(snpMap),
    alertas: buildAlertas(genera),
  }
}
