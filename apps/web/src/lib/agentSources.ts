import type { AgentKey, SourceKey } from '@helux/types'

/** Rótulos curtos das fontes do Perfil Integrado (spec 022). */
export const SOURCE_LABEL: Record<SourceKey, string> = {
  perfil: 'Perfil',
  preferencias: 'Preferências',
  historico: 'Histórico',
  mesociclo: 'Mesociclo',
  cansaco: 'Cansaço',
  checkins: 'Check-ins',
  genetica: 'Genética',
  exames: 'Exames',
  nutricao: 'Nutrição',
  relatos: 'Relatos nas conversas',
  restricoes: 'Restrições compartilhadas',
  edicoes: 'Edições manuais',
}

export const AGENT_LABEL: Record<AgentKey, string> = {
  treino: 'Agente de Treino',
  medicina: 'Medicina Esportiva',
  nutricao: 'Nutrição Genética',
}
