import { describe, it, expect } from 'vitest'
import { parseTipItems, type TipItem } from '@/lib/tipItems'

const REFERENCE =
  'Desça até paralelo ou abaixo — carga óssea controlada favorece densidade (WNT16). ' +
  'Joelhos alinhados com os dedos dos pés; evite valgismo para proteger o ligamento cruzado (COL1A1 C,C). ' +
  'Descanso 90-120s entre séries.'

// Dica real de um plano do usuário (Agachamento Livre (Barra)), 2026-09-23:
// marcador sem parênteses no meio da frase, "(3s)" e "5km".
const REAL_SQUAT =
  'ATENÇÃO: alerta COL1A1 C,C indica maior suscetibilidade a lesões no ligamento cruzado. ' +
  'Mantenha joelhos alinhados com a ponta dos pés, sem colapso valgo. ' +
  'Desça controlado (3s), suba explosivo. ' +
  'Profundidade: até paralelo — não force além do conforto. ' +
  'Calcanhares no chão o tempo todo. ' +
  'Dado o objetivo de voltar a correr 5km sem dor no joelho, priorize qualidade técnica absoluta sobre carga.'

function words(s: string): string[] {
  return s.match(/[\p{L}\p{N}]+/gu) ?? []
}

function expectNothingLost(input: string, items: TipItem[]) {
  const output = new Set(items.flatMap(i => [...words(i.text), ...i.markers.flatMap(words)]))
  for (const w of words(input)) expect(output, `palavra perdida: ${w}`).toContain(w)
}

describe('parseTipItems', () => {
  it('divide o texto de referência em 4 orientações com os marcadores genéticos', () => {
    expect(parseTipItems(REFERENCE)).toEqual([
      { text: 'Desça até paralelo ou abaixo — carga óssea controlada favorece densidade', markers: ['WNT16'] },
      { text: 'Joelhos alinhados com os dedos dos pés', markers: [] },
      { text: 'evite valgismo para proteger o ligamento cruzado', markers: ['COL1A1 C,C'] },
      { text: 'Descanso 90-120s entre séries', markers: [] },
    ])
  })

  it('não divide no ponto de um número ("2.5kg")', () => {
    expect(parseTipItems('Progressão: +2.5kg quando completar 10 reps')).toEqual([
      { text: 'Progressão: +2.5kg quando completar 10 reps', markers: [] },
    ])
  })

  it('mantém no texto parênteses que não são gene', () => {
    expect(parseTipItems('Carga sugerida 40kg (usado em 2026-08-29).')).toEqual([
      { text: 'Carga sugerida 40kg (usado em 2026-08-29)', markers: [] },
    ])
  })

  it('uma frase só vira 1 item', () => {
    expect(parseTipItems('Mantenha o core firme durante todo o movimento.')).toEqual([
      { text: 'Mantenha o core firme durante todo o movimento', markers: [] },
    ])
  })

  it('não divide em abreviação seguida de minúscula ou número', () => {
    expect(parseTipItems('Use aprox. 3 séries e descanse bem')).toHaveLength(1)
  })

  it.each([[''], ['   '], [null], [undefined]])('entrada vazia (%j) devolve []', (input) => {
    expect(parseTipItems(input as string | null | undefined)).toEqual([])
  })

  it('caso real: 6 orientações, "(3s)" e "5km" preservados, marcador sem parênteses fica no texto', () => {
    const items = parseTipItems(REAL_SQUAT)
    expect(items).toEqual([
      { text: 'ATENÇÃO: alerta COL1A1 C,C indica maior suscetibilidade a lesões no ligamento cruzado', markers: [] },
      { text: 'Mantenha joelhos alinhados com a ponta dos pés, sem colapso valgo', markers: [] },
      { text: 'Desça controlado (3s), suba explosivo', markers: [] },
      { text: 'Profundidade: até paralelo — não force além do conforto', markers: [] },
      { text: 'Calcanhares no chão o tempo todo', markers: [] },
      {
        text: 'Dado o objetivo de voltar a correr 5km sem dor no joelho, priorize qualidade técnica absoluta sobre carga',
        markers: [],
      },
    ])
  })

  it.each([[REFERENCE], [REAL_SQUAT], ['Progressão: +2.5kg quando completar 10 reps'], ['Carga 40kg (usado em 2026-08-29). Foco (ACTN3 R,X) na explosão; sem pressa']])(
    'nada se perde: toda palavra da entrada aparece em algum item (%#)',
    (input) => {
      expectNothingLost(input, parseTipItems(input))
    },
  )

  it('nunca devolve item com texto vazio', () => {
    for (const input of [REFERENCE, REAL_SQUAT, 'Um. Dois; ; Três.', '(WNT16).']) {
      for (const item of parseTipItems(input)) expect(item.text.trim()).not.toBe('')
    }
  })

  it('texto só com marcador não perde o marcador', () => {
    const items = parseTipItems('(WNT16).')
    expect(items).toHaveLength(1)
    expectNothingLost('(WNT16).', items)
  })
})
