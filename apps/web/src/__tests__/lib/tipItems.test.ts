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

// Invariante (research V4): tudo aparece em text ou gene, exceto o prefixo
// "ATENÇÃO:" removido. Comparação sem caixa: a 1ª letra pode ser capitalizada
// quando o prefixo sai.
function expectNothingLost(input: string, items: TipItem[]) {
  const output = new Set(
    items
      .flatMap(i => [...words(i.text), ...words(i.gene?.symbol ?? ''), ...words(i.gene?.genotype ?? '')])
      .map(w => w.toLowerCase()),
  )
  for (const w of words(input)) {
    if (w.toLowerCase() === 'atenção') continue
    expect(output, `palavra perdida: ${w}`).toContain(w.toLowerCase())
  }
}

describe('parseTipItems', () => {
  it('divide o texto de referência em 4 orientações com o gene separado em símbolo e genótipo', () => {
    expect(parseTipItems(REFERENCE)).toEqual([
      { text: 'Desça até paralelo ou abaixo — carga óssea controlada favorece densidade', gene: { symbol: 'WNT16' } },
      { text: 'Joelhos alinhados com os dedos dos pés' },
      { text: 'evite valgismo para proteger o ligamento cruzado', gene: { symbol: 'COL1A1', genotype: 'C,C' } },
      { text: 'Descanso 90-120s entre séries' },
    ])
  })

  it('extrai gene sem parênteses seguido de genótipo em par de bases', () => {
    expect(parseTipItems('Cuidado com o joelho COL1A1 C,C na descida.')).toEqual([
      { text: 'Cuidado com o joelho na descida', gene: { symbol: 'COL1A1', genotype: 'C,C' } },
    ])
  })

  it('não trata sigla sem genótipo como gene', () => {
    expect(parseTipItems('Use o RPE 8 no fim da série')).toEqual([{ text: 'Use o RPE 8 no fim da série' }])
  })

  it('remove o prefixo "ATENÇÃO:"/"Atenção:" e capitaliza a orientação', () => {
    expect(parseTipItems('ATENÇÃO: joelhos alinhados.')).toEqual([{ text: 'Joelhos alinhados' }])
    expect(parseTipItems('Atenção: joelhos alinhados.')).toEqual([{ text: 'Joelhos alinhados' }])
  })

  it('só o primeiro marcador vira etiqueta; os demais ficam no texto', () => {
    expect(parseTipItems('Foco na explosão (ACTN3 R,X) e no osso (WNT16).')).toEqual([
      { text: 'Foco na explosão e no osso (WNT16)', gene: { symbol: 'ACTN3', genotype: 'R,X' } },
    ])
  })

  it('não divide no ponto de um número ("2.5kg")', () => {
    expect(parseTipItems('Progressão: +2.5kg quando completar 10 reps')).toEqual([
      { text: 'Progressão: +2.5kg quando completar 10 reps' },
    ])
  })

  it('mantém no texto parênteses que não são gene', () => {
    expect(parseTipItems('Carga sugerida 40kg (usado em 2026-08-29).')).toEqual([
      { text: 'Carga sugerida 40kg (usado em 2026-08-29)' },
    ])
  })

  it('uma frase só vira 1 item', () => {
    expect(parseTipItems('Mantenha o core firme durante todo o movimento.')).toEqual([
      { text: 'Mantenha o core firme durante todo o movimento' },
    ])
  })

  it('não divide em abreviação seguida de minúscula ou número', () => {
    expect(parseTipItems('Use aprox. 3 séries e descanse bem')).toHaveLength(1)
  })

  it.each([[''], ['   '], [null], [undefined]])('entrada vazia (%j) devolve []', (input) => {
    expect(parseTipItems(input as string | null | undefined)).toEqual([])
  })

  it('caso real: 6 orientações, "(3s)" e "5km" preservados, gene sem parênteses extraído e sem "ATENÇÃO"', () => {
    const items = parseTipItems(REAL_SQUAT)
    expect(items).toEqual([
      {
        text: 'Alerta indica maior suscetibilidade a lesões no ligamento cruzado',
        gene: { symbol: 'COL1A1', genotype: 'C,C' },
      },
      { text: 'Mantenha joelhos alinhados com a ponta dos pés, sem colapso valgo' },
      { text: 'Desça controlado (3s), suba explosivo' },
      { text: 'Profundidade: até paralelo — não force além do conforto' },
      { text: 'Calcanhares no chão o tempo todo' },
      {
        text: 'Dado o objetivo de voltar a correr 5km sem dor no joelho, priorize qualidade técnica absoluta sobre carga',
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
