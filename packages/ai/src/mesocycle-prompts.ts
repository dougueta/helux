import type { CheckinTrend, ConstraintViolation, CycleSummary, HardConstraints, LoadProgression, MethodPrescription } from '@helux/types'
import { buildExerciseCatalogSection } from './prompts'
import { allowedExercises, findBankExercise } from './agents/constraints'

// Spec 024 (R12): o Agente de Treino monta a semana-modelo dentro de uma
// prescrição de método calculada por código. Três blocos: método e regras de
// escrita (estável, cache de 1 h), Perfil Integrado (renderProfile) e o pedido
// (prescrição, restrições, condições, catálogo permitido, ciclo anterior,
// progressão). Violações voltam num turno próprio, sobre a resposta anterior (R17).

/** Método, papel de cada fonte e regras de escrita — texto estável (sem data/hora). */
export function buildTrainingMethod(): string {
  return `Você é o Agente de Treino do Helux, num time com a Medicina Esportiva e a Nutrição que compartilha o Perfil Integrado do usuário. Seu trabalho é montar a semana-modelo de um mesociclo: os dias da semana com força, cardio e mobilidade, os exercícios de cada dia e a justificativa das escolhas. O código depois repete essa semana por todas as semanas do mesociclo, aplicando a progressão semanal de séries, o esforço-alvo e a semana de deload; por isso você monta só uma semana, no volume da semana mais forte.

## O que é limite e o que é escolha sua

O pedido traz uma prescrição de método (dias de força, divisões permitidas, frequência mínima por grupo muscular, faixa de séries semanais por grupo, faixas de repetições, esforço-alvo, cardio e mobilidade) e as regras das condições de saúde e das restrições do usuário. Esses limites são conferidos por código: um plano fora deles é recusado e você recebe as violações para corrigir. Dentro deles, quem decide é você: escolha dos exercícios, ordem, distribuição dos grupos nos dias, bisets, cargas iniciais e onde encaixar cardio e mobilidade. Use o que o Perfil Integrado mostra sobre a pessoa (objetivo, nível, tempo parado, histórico e cargas, cansaço, check-ins, relatos, preferências) para escolher bem.

Os grupos musculares principais são peito, costas, ombro, quadríceps, posterior de coxa e glúteo. Conte as séries semanais de cada grupo pelo músculo principal de cada exercício e mantenha todos dentro da faixa pedida, com a frequência mínima pedida.

## Fontes e o peso de cada uma

- Condições de saúde, cirurgias e restrições de segurança vêm primeiro. Quando um pedido do usuário conflita com elas, siga a segurança, diga na justificativa qual foi o conflito e ofereça a alternativa mais próxima.
- Objetivo, nível e tempo parado definem o tom do ciclo; o histórico real (cargas, repetições, esforço) define as cargas iniciais.
- Exercícios que o usuário trocou várias vezes (fonte de edições manuais) tendem a não voltar; os escolhidos como substitutos são preferência.
- Genética é ajuste fino: pode desempatar uma escolha ou reforçar um cuidado já justificado por outra fonte, e só com traços de evidência forte ou moderada. A genética nunca é o motivo único de uma divisão, de uma faixa de repetições ou da escolha de um exercício.
- Se uma fonte estiver vazia ou desligada, monte com o que existe e diga na justificativa o que faltou.

## Estrutura dos dias

Cada dia de força tem aquecimento (2 a 4 itens livres: mobilidade das articulações que vão trabalhar, cardio leve, séries de aproximação), o treino principal e a volta à calma (2 a 4 itens livres: alongamento e mobilidade do que foi trabalhado). Itens livres têm nome descritivo em português, 1 série, repetições descritivas ("5 min", "10 por lado") e carga "—".

O cardio usa só as modalidades permitidas no pedido, com os minutos e a zona indicados. Ele pode ser um dia próprio ou um bloco no fim de um dia de força. Prefira colocar o cardio fora dos dias de perna pesada e nunca use modalidade acima do impacto permitido. A mobilidade dedicada pode ser um dia próprio ou um bloco do treino principal, com a região trabalhada; quando houver condição numa articulação, inclua mobilidade dessa região depois dos treinos de membros inferiores.

Biset é opcional: dois exercícios consecutivos do treino principal com o mesmo número de séries e o mesmo rótulo em "supersetGroup", no máximo dois por dia. Prefira pares que não disputem o mesmo grupo ou equipamento e não use biset nos compostos mais pesados.

Cada exercício principal leva o esforço-alvo em "rirTarget" (repetições na reserva) da semana mais forte, dentro do pedido.

## Como escrever

- Notas ("notes") são instruções de execução para o usuário: postura, amplitude, ritmo, o que sentir, quando parar. Uma ou duas frases.
- Não escreva nas notas datas de uso anterior, que um exercício "foi usado recentemente", o que você evitou, nem regras do sistema. O motivo das escolhas vai nas decisões.
- Em "decisions", uma entrada por decisão relevante (divisão, volume, exercício, condição, cardio, mobilidade, ciclo anterior), com as fontes que a motivaram e o dado concreto ("cintura estável em 2 check-ins", "dor no joelho relatada no leg press 3 vezes").
- A justificativa geral ("rationale") explica o ciclo em poucas frases, em linguagem simples.
- Justificativa e decisões falam com o usuário sobre ele: o objetivo, as condições, o histórico, o tempo disponível. Não mencione a prescrição, o código, a conferência, o catálogo, "modalidade permitida" nem limites numéricos internos; diga o motivo real ("sem impacto por causa da artrose no joelho", não "impacto máximo 0").
- Cite como fonte de uma decisão só fontes do Perfil Integrado que tenham dados; não atribua ao usuário preferências que ele não declarou.
- Biset citado nas decisões precisa estar marcado no plano com "supersetGroup".`
}

const exerciseLabel = (idOrName: string) => findBankExercise(idOrName)?.name ?? idOrName
const fmtKg = (kg: number | null) => `${String(kg).replace('.', ',')} kg`

function methodSection(m: MethodPrescription): string {
  const strongest = m.weekly.filter(w => !w.deload).at(-1)
  const lines = [
    `- Objetivo: ${m.goal}`,
    `- ${m.strengthDays} dias de força por semana; divisões permitidas: ${m.allowedSplits.join(' ou ')}`,
    `- Cada grupo muscular principal pelo menos ${m.minFrequencyPerGroup}× por semana, com ${m.weeklySetsPerGroup.min}–${m.weeklySetsPerGroup.max} séries semanais por grupo na semana-modelo`,
    `- Repetições: básicos ${m.repRanges.basicos[0]}–${m.repRanges.basicos[1]}, acessórios ${m.repRanges.acessorios[0]}–${m.repRanges.acessorios[1]}`,
    `- Esforço-alvo da semana mais forte: ${strongest?.rirTarget ?? 2} repetições na reserva`,
    `- ${m.cardioSessions} sessões com cardio por semana (dia próprio ou bloco), ${m.cardio.minutes} min na zona ${m.cardio.zone}; modalidades permitidas, na ordem de preferência: ${m.cardio.allowed.join(', ') || 'nenhuma'}`,
    `- ${m.mobilitySessions} sessão ou bloco de mobilidade por semana`,
    `- Mesociclo de ${m.weeks} semanas com deload na semana ${m.deloadWeek} (o código aplica a progressão)`,
    ...(m.exemptGroups?.length ? [`- Fora da conta de volume (sem exercício permitido): ${m.exemptGroups.join(', ')}`] : []),
    ...m.modifiers.map(x => `- Ajuste (${x.source}): ${x.description}`),
  ]
  return `## Prescrição de método\n\n${lines.join('\n')}`
}

function constraintsSection(c: HardConstraints): string {
  const rules = [
    `- Equipamentos disponíveis: ${c.availableEquipment.length > 0 ? c.availableEquipment.join(', ') : 'todos'}`,
    c.maxSessionMinutes !== null && `- Duração máxima por dia: ${c.maxSessionMinutes} min (estimativa: 5 min de aquecimento + cada série ≈ 40 s de execução + 90 s de descanso + minutos de cardio)`,
    c.exercisesToAvoid.length > 0 && `- Exercícios a evitar: ${c.exercisesToAvoid.map(exerciseLabel).join(', ')}`,
    c.blockedPatterns.length > 0 && `- Padrões de movimento bloqueados: ${c.blockedPatterns.join(', ')}`,
    c.blockedExercises.length > 0 && `- Exercícios bloqueados: ${c.blockedExercises.map(exerciseLabel).join(', ')}`,
    ...Object.entries(c.maxJointStress).map(([j, l]) => `- Carga no ${j} ≤ ${l} (0 = nenhuma, 1 = moderada, 2 = alta; o catálogo abaixo já respeita esse limite)`),
    c.maxCardioImpact !== null && `- Impacto máximo do cardio: ${c.maxCardioImpact}`,
    c.minRir !== null && `- RIR mínimo em qualquer série: ${c.minRir}`,
  ].filter(Boolean)
  return `## Restrições do usuário\n\n${rules.join('\n')}`
}

function conditionsSection(conditions: { label: string; rules: string[] }[]): string {
  if (conditions.length === 0) return ''
  return `\n\n## Condições de saúde\n\n${conditions.map(c => `- ${c.label}: ${c.rules.join('; ')}`).join('\n')}`
}

function cycleSection(cycle?: CycleSummary, trend?: CheckinTrend): string {
  const parts: string[] = []
  if (cycle) {
    const adh = Object.entries(cycle.adherence)
      .filter(([, a]) => a.planned > 0)
      .map(([k, a]) => `${k} ${a.done}/${a.planned}`)
      .join(', ')
    parts.push(
      `## Ciclo anterior (${cycle.weeks} semanas)`,
      `- Aderência: ${adh || 'sem dados'}`,
      cycle.avgRpeByWeek.length > 0 ? `- Esforço percebido médio por semana: ${cycle.avgRpeByWeek.map(v => v.toFixed(1).replace('.', ',')).join(' → ')}` : '',
      ...cycle.findings.map(f => `- Achado (${f.kind}): ${f.subject} — ${f.evidence}`),
      cycle.missingData.length > 0 ? `- Faltaram dados: ${cycle.missingData.join(', ')}` : '',
      'Trate cada achado no novo ciclo e diga nas decisões (tópico "ciclo") o que mudou e por quê.',
    )
  }
  if (trend && trend.modifiers.length > 0) {
    parts.push('## Tendência dos check-ins', ...trend.modifiers.map(m => `- ${m}`))
  }
  const text = parts.filter(Boolean).join('\n')
  return text ? `\n\n${text}` : ''
}

function progressionSection(decisions?: LoadProgression[]): string {
  const withLoad = (decisions ?? []).filter(d => d.action !== 'sem-dados' && d.nextWeightKg !== null)
  if (withLoad.length === 0) return ''
  const lines = withLoad.map(d => `- ${d.name}: ${fmtKg(d.previousWeightKg)} → ${fmtKg(d.nextWeightKg)} (${d.action}) — ${d.reason}`)
  return `\n\n## Progressão de carga do ciclo anterior\n\nCargas calculadas pela regra de progressão. Se mantiver estes exercícios, use estas cargas:\n${lines.join('\n')}`
}

/** Pedido do mesociclo: prescrição, restrições, condições, catálogo permitido, ciclo anterior e progressão. */
export function buildMesocycleRequest(args: {
  method: MethodPrescription
  constraints: HardConstraints
  conditions: { label: string; rules: string[] }[]
  cycle?: CycleSummary
  checkinTrend?: CheckinTrend
  loadProgression?: LoadProgression[]
}): string {
  return `${methodSection(args.method)}\n\n${constraintsSection(args.constraints)}${conditionsSection(args.conditions)}\n\n${buildExerciseCatalogSection(allowedExercises(args.constraints))}${cycleSection(args.cycle, args.checkinTrend)}${progressionSection(args.loadProgression)}\n\nMonte a semana-modelo, com a justificativa e as decisões com fontes.`
}

/** Turno de correção (024 R17, D): o modelo ajusta a própria resposta só nos pontos recusados. */
export function buildRetryRequest(violations: ConstraintViolation[]): string {
  return `## Corrija estes pontos

A conferência automática recusou a proposta acima:
${violations.map(v => `- ${v.message}`).join('\n')}

Devolva a semana-modelo completa corrigindo só esses pontos e mantendo o resto como estava. Atualize a justificativa e as decisões se a correção mudar alguma escolha.`
}
