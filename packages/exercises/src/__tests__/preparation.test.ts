import { describe, it, expect } from 'vitest'
import { DEMO_SPECS } from '../demos'
import { PREPARATION_ITEMS, preparationIssues } from '../preparation'
import type { PreparationItem } from '../types'

const valid: PreparationItem = {
  id: 'teste-item',
  name: 'Item de teste',
  kind: 'preparacao',
  phases: ['aquecimento'],
  regions: ['ombro'],
  mode: 'reps',
  needs: ['elastico'],
  knownNames: ['Nome antigo exato'],
}

// T078 (data-model.md, PreparationItem): dados obrigatórios, ao menos uma região e needs válido.
describe('preparationIssues', () => {
  it('item completo não tem problemas', () => {
    expect(preparationIssues(valid)).toEqual([])
    expect(preparationIssues({ ...valid, needs: [], knownNames: [] })).toEqual([])
  })

  it.each([
    ['sem região', { regions: [] }, 'falta ao menos uma região'],
    ['região fora de REGIONS', { regions: ['pescoco'] }, 'região inválida pescoco'],
    ['sem fase', { phases: [] }, 'falta ao menos uma fase'],
    ['fase principal', { phases: ['principal'] }, 'fase inválida principal'],
    ['modo inválido', { mode: 'series' }, 'modo inválido series'],
    ['equipamento fora de GEARS', { needs: ['trampolim'] }, 'equipamento inválido trampolim'],
    ['peso corporal como equipamento', { needs: ['peso-corporal'] }, 'peso-corporal não é equipamento'],
    ['kind de força', { kind: 'forca' }, 'kind deveria ser preparacao'],
    ['nome vazio', { name: ' ' }, 'falta nome'],
  ])('%s é recusado', (_label, patch, expected) => {
    const issues = preparationIssues({ ...valid, ...(patch as Partial<PreparationItem>) })
    expect(issues.join('\n')).toContain(expected)
    expect(issues.every((i) => i.startsWith('teste-item: '))).toBe(true)
  })
})

describe('PREPARATION_ITEMS', () => {
  it('todo item cumpre os dados obrigatórios', () => {
    expect(PREPARATION_ITEMS.flatMap(preparationIssues)).toEqual([])
  })

  it('ids e nomes antigos não se repetem entre itens', () => {
    const ids = PREPARATION_ITEMS.map((p) => p.id)
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
    const known = PREPARATION_ITEMS.flatMap((p) => p.knownNames)
    expect(known.filter((n, i) => known.indexOf(n) !== i)).toEqual([])
  })

  it('item de preparação nunca fica pendente: nasce com orientação e demonstração', () => {
    for (const p of PREPARATION_ITEMS) {
      expect(p.guidance?.steps.length, `${p.id}: falta orientação`).toBeGreaterThan(0)
      expect(p.demo ?? DEMO_SPECS[p.id], `${p.id}: falta demonstração`).toBeDefined()
    }
  })
})
