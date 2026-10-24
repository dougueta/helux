import { describe, it, expect } from 'vitest'
import type { HealthCondition } from '@helux/types'
import { CONDITION_CATALOG, constraintsFromConditions, mergeRules, rulesFor } from '../conditions'

// Spec 024 T049 — catálogo de condições com regras fixas (R1, R2).

const NOW = new Date('2026-10-24T12:00:00Z')
const cond = (catalogKey: string, over: Partial<HealthCondition> = {}): HealthCondition => ({
  id: catalogKey,
  catalogKey,
  customLabel: null,
  region: 'joelho',
  side: null,
  since: null,
  count: 1,
  status: 'controlada',
  notes: null,
  flare: null,
  ...over,
})

describe('CONDITION_CATALOG', () => {
  it('tem as 8 condições do research R1, cada uma com rótulo e regiões', () => {
    expect(CONDITION_CATALOG.map(c => c.key).sort()).toEqual(
      ['artrose', 'gota', 'hipertensao', 'lca-reconstrucao', 'lesao-ligamentar', 'lesao-menisco', 'lombalgia', 'tendinopatia-ombro'].sort(),
    )
    for (const c of CONDITION_CATALOG) {
      expect(c.label.length).toBeGreaterThan(3)
      expect(c.regions.length).toBeGreaterThan(0)
    }
  })
})

describe('rulesFor', () => {
  it('LCA controlada: joelho ≤ 1, cardio de impacto ≤ 1 e cuidados', () => {
    const r = rulesFor(cond('lca-reconstrucao'), NOW)
    expect(r.maxJointStress).toEqual({ joelho: 1 })
    expect(r.maxCardioImpact).toBe(1)
    expect(r.cues.length).toBeGreaterThan(0)
  })

  it('artrose no joelho: joelho ≤ 1 e cardio sem impacto', () => {
    expect(rulesFor(cond('artrose'), NOW)).toMatchObject({ maxJointStress: { joelho: 1 }, maxCardioImpact: 0 })
  })

  it('artrose no ombro: limite no ombro, sem limite de impacto', () => {
    expect(rulesFor(cond('artrose', { region: 'ombro' }), NOW)).toMatchObject({ maxJointStress: { ombro: 1 }, maxCardioImpact: null })
  })

  it('estado ativa reduz o limite articular em 1; resolvida desliga as regras', () => {
    expect(rulesFor(cond('lca-reconstrucao', { status: 'ativa' }), NOW).maxJointStress).toEqual({ joelho: 0 })
    expect(rulesFor(cond('lca-reconstrucao', { status: 'resolvida' }), NOW)).toEqual({
      maxJointStress: {},
      blockedPatterns: [],
      blockedExercises: [],
      maxCardioImpact: null,
      minRir: null,
      cues: [],
      medicalNoteOnFlare: false,
    })
  })

  it('hipertensão: RIR mínimo 2; lombalgia: lombar ≤ 1', () => {
    expect(rulesFor(cond('hipertensao', { region: 'sistemica' }), NOW).minRir).toBe(2)
    expect(rulesFor(cond('lombalgia', { region: 'lombar' }), NOW).maxJointStress).toEqual({ lombar: 1 })
  })

  it('gota sem crise: impacto ≤ 1; em crise no joelho: joelho 0, impacto 0 e aviso médico', () => {
    expect(rulesFor(cond('gota', { region: 'sistemica' }), NOW)).toMatchObject({ maxJointStress: {}, maxCardioImpact: 1, medicalNoteOnFlare: true })
    const flare = rulesFor(cond('gota', { region: 'sistemica', flare: { region: 'joelho', until: '2026-10-27' } }), NOW)
    expect(flare).toMatchObject({ maxJointStress: { joelho: 0 }, maxCardioImpact: 0 })
  })

  it('crise vencida não vale', () => {
    const r = rulesFor(cond('gota', { region: 'sistemica', flare: { region: 'joelho', until: '2026-10-20' } }), NOW)
    expect(r.maxJointStress).toEqual({})
    expect(r.maxCardioImpact).toBe(1)
  })

  it('condição "outra" (sem catálogo) não tem regra fixa: vem das orientações aceitas', () => {
    expect(rulesFor(cond('x', { catalogKey: null, customLabel: 'Fascite plantar' }), NOW).maxJointStress).toEqual({})
  })
})

describe('mergeRules / constraintsFromConditions', () => {
  it('fica com a regra mais restritiva de cada campo', () => {
    const merged = mergeRules([
      rulesFor(cond('lca-reconstrucao'), NOW),
      rulesFor(cond('artrose'), NOW),
      rulesFor(cond('gota', { region: 'sistemica' }), NOW),
      rulesFor(cond('hipertensao', { region: 'sistemica' }), NOW),
    ])
    expect(merged.maxJointStress).toEqual({ joelho: 1 })
    expect(merged.maxCardioImpact).toBe(0)
    expect(merged.minRir).toBe(2)
  })

  it('caso do dono (LCA ×3, artrose E, gota) vira restrições do validador', () => {
    const c = constraintsFromConditions(
      [
        cond('lca-reconstrucao', { side: 'esquerdo', count: 2 }),
        cond('lca-reconstrucao', { side: 'direito' }),
        cond('artrose', { side: 'esquerdo' }),
        cond('gota', { region: 'sistemica' }),
      ],
      NOW,
    )
    expect(c).toEqual({ maxJointStress: { joelho: 1 }, maxCardioImpact: 0, minRir: null, blockedPatterns: [], blockedExercises: [] })
  })
})
