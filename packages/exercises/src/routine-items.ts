/**
 * Itens das Rotinas Complementares (spec 030) → item do catálogo (028 FR-036).
 * Correspondência curada por id, como `approach-names.ts`: a Rotina guarda o id do próprio
 * banco (`STRETCH_MOBILITY_BANK`, `CORE_ROUTINE_ITEMS`); o cardio usa o id de `CARDIO_BANK`,
 * que já é o do catálogo. Vale também para rotinas já salvas, que guardam o mesmo id.
 */
export const ROUTINE_ITEMS: Readonly<Record<string, string>> = {
  // alongamento e mobilidade
  'mob-tornozelo-parede': 'tornozelo-joelho-parede',
  'alongamento-flexores-quadril': 'alongamento-flexor-quadril',
  'alongamento-posterior-deitado': 'alongamento-posterior-coxa-faixa',
  'alongamento-gluteo-figura-4': 'alongamento-gluteo-figura-4',
  'mobilidade-quadril-90-90': 'quadril-90-90',
  'ponte-gluteo-ativacao': 'ponte-gluteo-sustentada',
  'gato-camelo-coluna': 'gato-camelo',
  'rotacao-toracica-livro-aberto': 'rotacao-toracica-deitado-lado',
  'alongamento-peitoral-porta': 'alongamento-peitoral-parede',
  'deslizamento-escapular-parede': 'deslizamento-parede',
  'alongamento-dorsal-crianca': 'postura-crianca',
  'alongamento-panturrilha-parede': 'alongamento-panturrilha-parede',
  'alongamento-quadriceps-lateral': 'alongamento-quadriceps-deitado',
  'mobilidade-punhos-antebraco': 'alongamento-antebraco',
  'alongamento-triceps-ombro': 'alongamento-triceps',
  'respiracao-diafragmatica-recuperacao': 'respiracao-diafragmatica',
  // core: os ids já são os do catálogo de força, menos o dead bug
  'prancha-abdominal-corporal': 'prancha-abdominal-corporal',
  'prancha-lateral-corporal': 'prancha-lateral-corporal',
  'dead-bug-estabilidade': 'dead-bug-corporal',
  'abdominal-supra-corporal': 'abdominal-supra-corporal',
  'abdominal-infra-corporal': 'abdominal-infra-corporal',
  'prancha-toque-ombro-corporal': 'prancha-toque-ombro-corporal',
  'hollow-hold-corporal': 'hollow-hold-corporal',
  'abdominal-bicicleta-corporal': 'abdominal-bicicleta-corporal',
}

/** Id do catálogo para um item de Rotina: pela tabela, ou o próprio id (cardio). */
export function routineCatalogId(routineItemId: string): string {
  return ROUTINE_ITEMS[routineItemId] ?? routineItemId
}
