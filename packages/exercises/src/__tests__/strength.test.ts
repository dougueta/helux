import { describe, it, expect } from 'vitest'
import { STRENGTH_EXERCISES, effectiveFields } from '../strength'
import { GEARS } from '../types'
import snapshot from './fixtures/strength-snapshot.json'

// R3 e R4: nenhum dos 122 nomes muda, e equipment/muscleGroup/pattern/stress mantêm valor e significado.
// Correção de classificação justificada em bank-review.md atualiza este snapshot no mesmo commit.
describe('STRENGTH_EXERCISES — congelamento do banco (R3, R4)', () => {
  it('mantém os 122 exercícios, na mesma ordem e com os mesmos ids', () => {
    expect(STRENGTH_EXERCISES.map((e) => e.id)).toEqual(snapshot.map((e) => e.id))
  })

  it('nenhum nome foi alterado ou removido', () => {
    expect(STRENGTH_EXERCISES.map((e) => e.name)).toEqual(snapshot.map((e) => e.name))
  })

  it('muscleGroup, equipment, pattern e stress iguais ao snapshot', () => {
    const current = STRENGTH_EXERCISES.map(({ id, name, muscleGroup, equipment, pattern, stress }) => ({ id, name, muscleGroup, equipment, pattern, stress }))
    expect(current).toEqual(snapshot)
  })

  it('todo item é do catálogo de força', () => {
    for (const e of STRENGTH_EXERCISES) expect(e.kind, e.id).toBe('forca')
  })
})

// FR-014: `gear` é o implemento real, sem alterar `equipment` (o filtro de disponibilidade).
describe('STRENGTH_EXERCISES — implemento real (gear)', () => {
  const gearOf = (id: string) => STRENGTH_EXERCISES.find((e) => e.id === id)!.gear

  it('todo item tem gear válido', () => {
    for (const e of STRENGTH_EXERCISES) expect(GEARS, `${e.id}: falta gear`).toContain(e.gear)
  })

  it.each([
    ['leg-press-45', 'maquina'],
    ['peck-deck-maquina', 'maquina'],
    ['crossover-cabo', 'cabo'],
    ['rosca-cabo', 'cabo'],
    ['kettlebell-swing', 'kettlebell'],
    ['triceps-corda-cabo', 'corda'],
    ['agachamento-smith-maquina', 'smith'],
    ['roda-abdominal', 'roda'],
    ['barra-fixa-corporal', 'barra-fixa'],
  ])('%s usa %s', (id, gear) => {
    expect(gearOf(id)).toBe(gear)
  })

  it('kettlebell-swing continua com equipment halteres (filtro inalterado)', () => {
    expect(STRENGTH_EXERCISES.find((e) => e.id === 'kettlebell-swing')!.equipment).toBe('halteres')
  })
})

// data-model: enquanto o item está pendente, cues e muscles continuam com os valores atuais;
// depois de aprovado, cues vem de guidance e muscles é o explícito.
describe('effectiveFields', () => {
  const raw = {
    id: 'x', name: 'X', muscleGroup: 'posterior', equipment: 'maquina-cabo' as const, gear: 'maquina' as const, pattern: 'isolamento',
    cues: ['antigo 1', 'antigo 2', 'antigo 3'],
    muscles: { primary: ['posterior' as const], secondary: ['panturrilha' as const] },
    guidance: { setup: ['Deite de bruços'], steps: ['Dobre os joelhos', 'Desça devagar'], commonError: 'Levantar o quadril' },
  }

  it('pendente: mantém cues atuais e músculos derivados', () => {
    const out = effectiveFields(raw, true)
    expect(out.cues).toEqual(['antigo 1', 'antigo 2', 'antigo 3'])
    expect(out.muscles).toEqual({ primary: ['quadriceps'], secondary: [] })
  })

  it('aprovado: cues vêm da orientação e músculos são os explícitos', () => {
    const out = effectiveFields(raw, false)
    expect(out.cues).toEqual(['Deite de bruços', 'Dobre os joelhos', 'Desça devagar', 'Erro comum: Levantar o quadril'])
    expect(out.muscles).toEqual(raw.muscles)
  })

  it('aprovado sem orientação nem músculos explícitos: mantém os valores atuais', () => {
    const { guidance: _g, muscles: _m, ...bare } = raw
    expect(effectiveFields(bare, false)).toEqual({ cues: raw.cues, muscles: { primary: ['quadriceps'], secondary: [] } })
  })
})
