import { SOURCE_KEYS, type IntegratedProfile, type SourceKey, type SourcesUsed } from '@helux/types'

export const SOURCE_LABEL: Record<SourceKey, string> = {
  perfil: 'Perfil declarado',
  preferencias: 'Preferências de treino',
  historico: 'Histórico de treinos e cargas',
  mesociclo: 'Mesociclo vigente',
  cansaco: 'Cansaço e recuperação do dia',
  checkins: 'Check-ins corporais',
  genetica: 'Genética',
  exames: 'Exames',
  nutricao: 'Nutrição',
  relatos: 'Relatos nas conversas',
  restricoes: 'Restrições e recomendações compartilhadas',
  edicoes: 'Edições manuais do treino',
}

/** Contexto volátil do dia (bloco sem cache). */
export interface DayContext {
  date: string
  todaySession: string | null
  tiredness: string | null
  /** Avisos do dia: restrições expiradas, conflitos etc. */
  notices: string[]
}

export function sourcesUsedOf(profile: IntegratedProfile): SourcesUsed {
  const used: SourcesUsed = { ativa: [], vazia: [], desativada: [] }
  for (const key of SOURCE_KEYS) used[profile.sources[key].status].push(key)
  return used
}

/**
 * Snapshot do Perfil Integrado para o prompt (R6): ordem fixa das fontes, só
 * resumos das ativas, sem data/hora nem ids, para o cache não quebrar à toa.
 */
export function renderProfile(profile: IntegratedProfile): string {
  const lines = ['# Perfil Integrado do usuário', '']
  for (const key of SOURCE_KEYS) {
    const s = profile.sources[key]
    const label = SOURCE_LABEL[key]
    if (s.status === 'ativa') {
      lines.push(`## ${label}${s.stale ? ' (desatualizado)' : ''}`, s.summary.trim(), '')
    }
  }
  const status = SOURCE_KEYS.filter(k => profile.sources[k].status !== 'ativa').map(k =>
    profile.sources[k].status === 'desativada' ? `- ${SOURCE_LABEL[k]}: desativada pelo usuário` : `- ${SOURCE_LABEL[k]}: sem dados`,
  )
  if (status.length > 0) lines.push('## Fontes não usadas', ...status, '')
  return lines.join('\n').trim()
}

/** Bloco do dia (volátil). */
export function renderDay(day: DayContext): string {
  const lines = [`# Hoje`, `Data: ${day.date}`, `Treino do dia: ${day.todaySession ?? 'nenhum treino pendente hoje'}`, `Cansaço do dia: ${day.tiredness ?? 'não informado'}`]
  if (day.notices.length > 0) lines.push('', 'Avisos para comentar com o usuário quando for relevante:', ...day.notices.map(n => `- ${n}`))
  return lines.join('\n')
}
