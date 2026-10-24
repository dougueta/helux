import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import { fakeSupabase } from './helpers/fake-supabase'
import { deleteGeneticReport, getGeneticRaw, getGeneticReport, InvalidGeneticReportError, saveGeneticReport } from '../services/genetics.service'

// Spec 024 T017 — laudo genético por usuário no banco (R14).

const RAW = JSON.parse(readFileSync(path.resolve(__dirname, '../../e2e/fixtures/genera.fake.json'), 'utf-8'))

describe('genetics.service', () => {
  it('sem laudo → null', async () => {
    const fake = fakeSupabase({ genetic_reports: [] })
    expect(await getGeneticRaw('u1', fake.client as never)).toBeNull()
    expect(await getGeneticReport('u1', fake.client as never)).toBeNull()
  })

  it('com laudo → resumo + traços com evidência, só do próprio usuário', async () => {
    const fake = fakeSupabase({ genetic_reports: [{ user_id: 'u2', raw: {} }, { user_id: 'u1', raw: RAW }] })
    const report = await getGeneticReport('u1', fake.client as never)
    expect(report?.predisposicao).toBeDefined()
    expect(report?.traits.map(t => [t.gene, t.evidence])).toEqual([
      ['COL1A1', 'moderada'],
      ['ACTN3', 'moderada'],
    ])
  })

  it('salva com upsert por usuário; inválido → InvalidGeneticReportError', async () => {
    const fake = fakeSupabase({ genetic_reports: [] })
    const saved = await saveGeneticReport('u1', RAW, fake.client as never)
    expect(saved.traits).toBe(2)
    expect(fake.calls[0]).toMatchObject({ table: 'genetic_reports', op: 'upsert', values: { user_id: 'u1', source: 'genera', raw: RAW } })
    await expect(saveGeneticReport('u1', { qualquer: 1 }, fake.client as never)).rejects.toBeInstanceOf(InvalidGeneticReportError)
    await expect(saveGeneticReport('u1', 'texto', fake.client as never)).rejects.toBeInstanceOf(InvalidGeneticReportError)
  })

  it('remove o laudo do usuário', async () => {
    const fake = fakeSupabase({ genetic_reports: [{ user_id: 'u1', raw: RAW }] })
    await deleteGeneticReport('u1', fake.client as never)
    expect(fake.db.genetic_reports).toEqual([])
  })
})
