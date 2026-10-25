import { describe, it, expect } from 'vitest'
import { EMPTY_HARD_CONSTRAINTS, type MethodPrescription } from '@helux/types'
import { buildMesocycleRequest, buildRetryRequest, buildTrainingMethod } from '../mesocycle-prompts'

// Spec 024 T075 — prompt do Agente de Treino reescrito (R12).

const METHOD: MethodPrescription = {
  goal: 'condicionamento',
  weeks: 4,
  deloadWeek: 4,
  strengthDays: 3,
  cardioSessions: 2,
  mobilitySessions: 1,
  allowedSplits: ['full-body', 'superior-inferior-full'],
  minFrequencyPerGroup: 2,
  weeklySetsPerGroup: { min: 7, max: 11 },
  weekly: [
    { week: 1, setsFactor: 0.6, rirTarget: 3, deload: false },
    { week: 2, setsFactor: 0.8, rirTarget: 3, deload: false },
    { week: 3, setsFactor: 1, rirTarget: 2, deload: false },
    { week: 4, setsFactor: 0.55, rirTarget: 4, deload: true },
  ],
  repRanges: { basicos: [8, 12], acessorios: [12, 15] },
  cardio: { minutes: 25, zone: 'leve', maxImpact: 0, allowed: ['bike', 'eliptico', 'remo', 'natacao'] },
  modifiers: [{ source: 'pausa', description: 'Retorno após 8 meses parado: começa com 60% do volume.' }],
}

describe('buildTrainingMethod', () => {
  const text = buildTrainingMethod()

  it('é o Agente de Treino e trata a prescrição de método e as condições como limites conferidos por código', () => {
    expect(text).toContain('Agente de Treino')
    expect(text).toMatch(/prescrição de método/i)
    expect(text).toMatch(/conferid[ao]s? por código/i)
  })

  it('genética só como ajuste fino, nunca motivo único', () => {
    expect(text).toMatch(/genética/i)
    expect(text).toMatch(/ajuste fino/i)
    expect(text).toMatch(/nunca .*motivo único|nunca é o motivo único/i)
  })

  it('regras de escrita das notas: instrução ao usuário, sem datas de uso anterior nem regras internas', () => {
    expect(text).toMatch(/notas?.*instru/i)
    expect(text).toMatch(/datas de uso anterior/i)
    expect(text).toMatch(/regras do sistema/i)
  })

  it('posiciona cardio e mobilidade e mantém aquecimento, volta à calma e biset; o catálogo vai no pedido (R17)', () => {
    expect(text).toMatch(/cardio/i)
    expect(text).toMatch(/mobilidade/i)
    expect(text).toMatch(/aquecimento/i)
    expect(text).toMatch(/volta à calma/i)
    expect(text).toMatch(/biset/i)
    expect(text).not.toContain('Supino Reto (Barra)')
  })

  it('sem caixa-alta de obrigatoriedade e estável (sem data/hora) para o cache', () => {
    expect(text).not.toMatch(/OBRIGATÓRIO/)
    expect(buildTrainingMethod()).toBe(text)
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/)
  })
})

describe('buildMesocycleRequest', () => {
  it('traz a prescrição de método completa', () => {
    const t = buildMesocycleRequest({ method: METHOD, constraints: EMPTY_HARD_CONSTRAINTS, conditions: [] })
    expect(t).toMatch(/3 dias de força/)
    expect(t).toMatch(/2 sessões com cardio/)
    expect(t).toMatch(/full-body/)
    expect(t).toMatch(/7–11 séries/)
    expect(t).toMatch(/pelo menos 2×/)
    expect(t).toMatch(/8–12/)
    expect(t).toMatch(/bike, eliptico, remo, natacao/)
    expect(t).toMatch(/Retorno após 8 meses/)
    expect(t).toMatch(/semana-modelo/i)
  })

  it('lista as restrições e as regras das condições', () => {
    const t = buildMesocycleRequest({
      method: METHOD,
      constraints: { ...EMPTY_HARD_CONSTRAINTS, availableEquipment: ['halteres'], exercisesToAvoid: ['agachamento-livre-barra'], maxSessionMinutes: 50, maxJointStress: { joelho: 1 }, maxCardioImpact: 0, minRir: 2 },
      conditions: [{ label: 'Reconstrução de LCA (joelho esquerdo, 2×)', rules: ['Carga no joelho ≤ 1', 'Joelho alinhado com a ponta do pé'] }],
    })
    expect(t).toContain('Equipamentos disponíveis: halteres')
    expect(t).toContain('Agachamento Livre (Barra)')
    expect(t).toContain('50 min')
    expect(t).toMatch(/joelho.*≤ 1/)
    expect(t).toMatch(/impacto.*0/i)
    expect(t).toMatch(/RIR.*2/)
    expect(t).toContain('Reconstrução de LCA (joelho esquerdo, 2×)')
    expect(t).toContain('Joelho alinhado com a ponta do pé')
  })

  it('024 T103: achados do ciclo anterior e tendência dos check-ins entram no pedido', () => {
    const t = buildMesocycleRequest({
      method: METHOD,
      constraints: EMPTY_HARD_CONSTRAINTS,
      conditions: [],
      cycle: {
        mesocycleId: 'm1', weeks: 4,
        adherence: { forca: { done: 8, planned: 8 }, cardio: { done: 1, planned: 4 }, mobilidade: { done: 0, planned: 0 } },
        exercises: [], avgRpeByWeek: [7, 8.5], pains: [], tirednessAvg: 2.5, checkinTrend: null,
        findings: [{ kind: 'estagnacao', subject: 'Agachamento Livre (Barra)', evidence: '1RM estimado 126.7 → 127.9 kg' }],
        missingData: ['check-in corporal do mês'],
      },
      checkinTrend: { from: '2026-09', to: '2026-10', deltas: {}, implausible: [], modifiers: ['+1 sessão de cardio por semana.'], suggestGoalChange: null },
    })
    expect(t).toContain('Ciclo anterior (4 semanas)')
    expect(t).toContain('cardio 1/4')
    expect(t).toMatch(/estagnacao.*Agachamento Livre/)
    expect(t).toMatch(/Faltaram dados: check-in corporal/)
    expect(t).toMatch(/tópico "ciclo"/)
    expect(t).toContain('+1 sessão de cardio')
  })

  it('progressão de carga', () => {
    const t = buildMesocycleRequest({
      method: METHOD,
      constraints: EMPTY_HARD_CONSTRAINTS,
      conditions: [],
      loadProgression: [
        { name: 'Supino Reto (Barra)', action: 'aumentar', previousWeightKg: 60, nextWeightKg: 62.5, reason: 'topo da faixa' },
        { name: 'Remada', action: 'sem-dados', previousWeightKg: null, nextWeightKg: null, reason: '—' },
      ],
    })
    expect(t).toMatch(/Supino Reto \(Barra\): 60 kg → 62,5 kg/)
    expect(t).not.toMatch(/Remada:/)
  })

  it('024 R17: catálogo só com os exercícios permitidos, por grupo muscular', () => {
    const all = buildMesocycleRequest({ method: METHOD, constraints: EMPTY_HARD_CONSTRAINTS, conditions: [] })
    expect(all).toMatch(/## Catálogo de exercícios/)
    expect(all).toMatch(/\*\*Peito\*\*: .*Supino Reto \(Barra\)/)
    expect(all).toContain('Agachamento Livre (Barra)')
    const knee = buildMesocycleRequest({ method: METHOD, constraints: { ...EMPTY_HARD_CONSTRAINTS, maxJointStress: { joelho: 1 } }, conditions: [] })
    expect(knee).not.toContain('Agachamento Livre (Barra)')
    expect(knee).toMatch(/\*\*Quadríceps\*\*: /)
    expect(knee).toMatch(/o catálogo abaixo já respeita esse limite/)
  })

  it('024 R17: método com grupo dispensado avisa no pedido', () => {
    const t = buildMesocycleRequest({ method: { ...METHOD, exemptGroups: ['quadriceps'] }, constraints: EMPTY_HARD_CONSTRAINTS, conditions: [] })
    expect(t).toMatch(/Fora da conta de volume \(sem exercício permitido\): quadriceps/)
  })
})

describe('buildRetryRequest (024 R17)', () => {
  it('lista as violações e pede para corrigir só esses pontos', () => {
    const t = buildRetryRequest([
      { sessionIndex: 0, exercise: 'Agachamento Livre (Barra)', rule: 'carga-articular', message: 'Agachamento Livre (Barra) carrega demais' },
      { sessionIndex: 0, exercise: 'peito', rule: 'metodo-frequencia', message: 'peito é treinado 1× na semana; o mínimo é 2×' },
    ])
    expect(t).toMatch(/Agachamento Livre \(Barra\) carrega demais/)
    expect(t).toMatch(/peito é treinado 1×/)
    expect(t).toMatch(/corrigindo só esses pontos/)
  })
})

describe('R17b: justificativas sem falar do sistema', () => {
  it('proíbe mencionar prescrição, código e limites internos; fontes só com dados; biset marcado', () => {
    const text = buildTrainingMethod()
    expect(text).toMatch(/Não mencione a prescrição, o código/)
    expect(text).toMatch(/só fontes do Perfil Integrado que tenham dados/)
    expect(text).toMatch(/Biset citado nas decisões precisa estar marcado/)
  })
})
