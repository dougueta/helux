import type { GeneticEvidence } from '@helux/types'

// Spec 024 (R14): força da evidência de cada gene para decisões de treino.
// Nenhum marcador isolado tem evidência forte para prescrever treino; os
// "moderada" têm associação replicada com desempenho de força/potência
// (ACTN3) ou com lesões de tendão e ligamento (colágenos, MMP3, GDF5).
// O resto entra como "fraca" e não deve guiar o treino.
const MODERATE = new Set(['ACTN3', 'ACE', 'COL1A1', 'COL5A1', 'COL12A1', 'MMP3', 'GDF5'])

export function evidenceFor(gene: string): GeneticEvidence {
  return MODERATE.has(gene.toUpperCase()) ? 'moderada' : 'fraca'
}
