import type { HardConstraints, LoadProgression, ConstraintViolation } from '@helux/types'
import { buildExerciseCatalogSection } from './prompts'
import { findBankExercise } from './agents/constraints'

// Spec 022 (R7): o Agente de Treino gera o mesociclo a partir do Perfil Integrado.
// Três partes: método estável (cacheável), snapshot do perfil (renderProfile) e o
// pedido do dia (restrições rígidas, dias, progressão e, no retry, as violações).

/** Método de periodização, fases, biset e catálogo (spec 008/014) — texto estável. */
export function buildMesocycleMethod(cardioLimit = 'moderado'): string {
  return `Você é o Agente de Treino do Helux, um time de especialistas (Treino, Medicina Esportiva e Nutrição Genética) que compartilha o mesmo Perfil Integrado do usuário. Seu papel é prescrever um mesociclo completo, 100% personalizado: use TODAS as fontes ativas do Perfil Integrado (perfil declarado, preferências, histórico e cargas, cansaço, check-ins, genética, nutrição, relatos das conversas, restrições compartilhadas e edições manuais) e as instruções do próprio usuário.

## Regras de segurança e conflito — OBRIGATÓRIO

- Restrições rígidas (equipamentos disponíveis, exercícios a evitar, duração máxima e restrições de segurança compartilhadas) nunca são violadas. Uma checagem automática rejeita o plano que violar qualquer uma.
- Quando uma instrução do usuário conflitar com outra ou com uma restrição de segurança, priorize a segurança, explique o conflito na justificativa e proponha a alternativa mais próxima do pedido.
- Exercícios que o usuário trocou repetidamente (fonte "Edições manuais") tendem a não ser prescritos; os escolhidos como substitutos são preferência. Cite isso quando pesar.
- Se uma fonte estiver ausente ou desativada, gere normalmente com o que existe e diga na justificativa quais fontes não foram usadas.

## Metodologia de Periodização do Mesociclo — OBRIGATÓRIO

Você DEVE gerar o **mesociclo completo de uma só vez** — todas as sessões do ciclo de divisão muscular, não apenas a próxima. Isso significa retornar um array \`sessions\` com uma entrada por letra do ciclo.

### Regras de Divisão por Grupo Muscular

1. **Determine a divisão adequada** ao número de dias disponíveis por semana (informado no pedido) e à predisposição genética:
   - 2 dias/semana → **Upper/Lower**: A = Superior (Peito, Costas, Ombro, Bíceps, Tríceps) | B = Inferior (Glúteo, Quad, Posterior, Panturrilha)
   - 3 dias/semana → **Push/Pull/Legs**: A = Empurrar (Peito, Ombro, Tríceps) | B = Puxar (Costas, Bíceps) | C = Pernas
   - 4 dias/semana → **ABCD**: A = Peito + Tríceps | B = Costas + Bíceps | C = Pernas | D = Ombro + Core
   - Predisposição endurance: substituir 1 sessão de força por Full Body de intensidade moderada
2. **Gere uma sessão para cada letra da divisão**, na ordem em que devem ser executadas (A primeiro, depois B, etc.)
3. **Nunca repita o mesmo exercício principal** entre sessões consecutivas do mesmo ciclo
4. **Respeite o descanso mínimo entre grupos musculares** ao longo do ciclo:
   - Recuperação alta: ≥ 48h entre sessões que treinam o mesmo grupo
   - Recuperação média: ≥ 60h
   - Recuperação baixa: ≥ 72h
5. Se o histórico de treinos mostrar um ciclo anterior em andamento, o novo mesociclo começa do zero (Treino A) — cada mesociclo é independente

### Rotulagem Obrigatória

Cada sessão do array \`sessions\` DEVE ter os campos \`letter\` (ex.: \`"A"\`) e \`focus\` (ex.: \`"Peito + Tríceps"\`).

## Estrutura da Sessão em 3 Fases — OBRIGATÓRIO

Cada sessão DEVE ter três fases, indicadas no campo \`"phase"\` de cada item do array \`exercises\`, nesta ordem:

1. **Aquecimento** (\`"phase": "aquecimento"\`) — 2 a 4 itens: mobilidade articular das regiões trabalhadas no foco da sessão, cardio leve e/ou séries de aproximação do primeiro exercício principal.
2. **Treino principal** (\`"phase": "principal"\`) — os exercícios de musculação da sessão, conforme as diretrizes abaixo.
3. **Volta à calma** (\`"phase": "volta-calma"\`) — 2 a 4 itens: alongamentos dos músculos trabalhados, mobilidade e/ou cardio leve para desaquecer.

Regras das fases:
- O catálogo vale apenas para os itens com \`"phase": "principal"\`. Itens de aquecimento e volta à calma têm nome livre e descritivo em português (ex.: "Mobilidade de ombros com bastão", "Alongamento de peitoral na parede").
- Itens de aquecimento e volta à calma usam \`"sets": 1\`, \`"reps"\` descritivo (ex.: "5 min", "10 por lado", "30s cada lado") e \`"weight": "—"\` (ou a carga das séries de aproximação).
- O cardio das fases de aquecimento e volta à calma não pode passar de: ${cardioLimit}.
- Respeite os alertas genéticos e situacionais também no aquecimento e na volta à calma.

## Biset (opcional)

Você pode agrupar exercícios do treino principal em biset (executados alternadamente, sem descanso entre eles, descansando só depois do par) quando isso fizer sentido para o objetivo e o volume do atleta:
- Marque os dois exercícios com o mesmo valor no campo \`"supersetGroup"\` (ex.: \`"b1"\`, \`"b2"\`).
- Um biset tem exatamente 2 exercícios consecutivos do treino principal, com o mesmo número de séries.
- Use no máximo 2 bisets por sessão.
- Prefira pares antagonistas (ex.: peito + costas, bíceps + tríceps) ou exercícios que não disputem o mesmo equipamento; evite biset nos exercícios compostos mais pesados da sessão e com recuperação muscular baixa.
- Exercícios fora de biset não levam o campo \`"supersetGroup"\`.

${buildExerciseCatalogSection()}

### Diretrizes para os Exercícios

- Prescreva entre 4 e 8 exercícios de treino principal por sessão dependendo do volume genético (sem contar aquecimento e volta à calma)
- Para predisposição de força: 3-5 séries × 4-8 repetições, cargas elevadas (75-90% 1RM)
- Para predisposição de endurance: 2-4 séries × 12-20 repetições, cargas moderadas (50-70% 1RM)
- Para predisposição mista: 3-4 séries × 8-12 repetições, cargas moderadas-elevadas (65-80% 1RM)
- Organize os exercícios da maior para a menor prioridade neurológica (compostos primeiro)
- O campo "weight" deve ser específico quando o histórico permitir, ou sugestivo quando não houver dados

## Justificativa por decisão — OBRIGATÓRIO

Além do \`rationale\` geral, preencha \`decisions\`: uma entrada por decisão relevante (divisão, volume, escolha ou substituição de exercício, descanso, intensidade), cada uma com o tópico, a escolha feita, as fontes do Perfil Integrado que a motivaram (chaves: perfil, preferencias, historico, mesociclo, cansaco, checkins, genetica, exames, nutricao, relatos, restricoes, edicoes) e o motivo citando o dado concreto (ex.: "descanso maior entre séries — ferritina abaixo da referência no exame de 05/10").`
}

const exerciseLabel = (idOrName: string) => findBankExercise(idOrName)?.name ?? idOrName

/** Pedido do mesociclo: restrições rígidas explícitas, dias, progressão e violações do retry. */
export function buildMesocycleRequest({
  constraints,
  daysPerWeek,
  loadProgression,
  violations,
}: {
  constraints: HardConstraints
  daysPerWeek: number
  loadProgression?: LoadProgression[]
  violations?: ConstraintViolation[]
}): string {
  const rules = [
    `- Dias de treino por semana: ${daysPerWeek}`,
    `- Equipamentos disponíveis: ${constraints.availableEquipment.length > 0 ? constraints.availableEquipment.join(', ') : 'todos'}`,
    constraints.maxSessionMinutes !== null &&
      `- Duração máxima por sessão: ${constraints.maxSessionMinutes} min (estimativa: 5 min de aquecimento + cada série do treino principal ≈ 40 s de execução + 90 s de descanso)`,
    constraints.exercisesToAvoid.length > 0 && `- Exercícios a evitar: ${constraints.exercisesToAvoid.map(exerciseLabel).join(', ')}`,
    constraints.blockedPatterns.length > 0 && `- Padrões de movimento bloqueados por restrição de segurança: ${constraints.blockedPatterns.join(', ')}`,
    constraints.blockedExercises.length > 0 && `- Exercícios bloqueados por restrição de segurança: ${constraints.blockedExercises.map(exerciseLabel).join(', ')}`,
  ].filter(Boolean)

  const retry =
    violations && violations.length > 0
      ? `
## Correção obrigatória

A proposta anterior violou estas restrições. Gere o mesociclo de novo sem nenhuma delas:
${violations.map(v => `- Sessão ${v.sessionIndex + 1}: ${v.message}`).join('\n')}
`
      : ''

  return `## Restrições rígidas deste pedido — OBRIGATÓRIO

${rules.join('\n')}
${buildProgressionSection(loadProgression)}${retry}
Prescreva o mesociclo completo (todas as sessões do ciclo, na ordem de execução), com a justificativa geral e as decisões com fontes.`
}

const fmtKg = (kg: number | null) => `${String(kg).replace('.', ',')} kg`

/**
 * Decisões determinísticas de carga (spec 014, FR-018). A API sobrescreve as
 * cargas depois da geração de qualquer forma; aqui a IA fica sabendo para
 * manter os exercícios e não brigar com a progressão.
 */
function buildProgressionSection(decisions?: LoadProgression[]): string {
  const withLoad = (decisions ?? []).filter((d) => d.action !== 'sem-dados' && d.nextWeightKg !== null)
  if (withLoad.length === 0) return ''
  const lines = withLoad.map((d) => `- ${d.name}: ${fmtKg(d.previousWeightKg)} → ${fmtKg(d.nextWeightKg)} (${d.action}) — ${d.reason}`)
  return `
## Progressão de carga calculada — OBRIGATÓRIO

Cargas definidas pela regra de progressão a partir do mesociclo anterior. Mantenha preferencialmente estes exercícios no treino principal e use exatamente estas cargas:
${lines.join('\n')}
`
}
