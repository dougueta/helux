/**
 * Nomes antigos de séries de aproximação (planos gerados antes do `approachOf`) que apontam para um único exercício
 * de força (data-model.md, "Resolução de um item na tela", passo 6; R10). Só entram nomes sem ambiguidade: "no supino"
 * ou "na remada curvada" servem para barra e halteres, e ficam documentados em `__tests__/fixtures/legacy-unresolved.json`.
 */
export const APPROACH_NAMES: Readonly<Record<string, string>> = {
  'Série de aproximação no leg press': 'leg-press-45',
  'Séries de aproximação no leg press': 'leg-press-45',
  'Séries de aproximação no agachamento box': 'agachamento-box-barra',
  'Séries de aproximação no agachamento frontal': 'agachamento-frontal-barra',
  'Séries de aproximação no agachamento com barra vazia': 'agachamento-livre-barra',
  'Séries de aproximação no levantamento terra': 'levantamento-terra-barra',
  'Séries de aproximação no terra': 'levantamento-terra-barra',
  'Agachamento goblet de aproximação com halter leve': 'agachamento-goblet-halteres',
}
