/**
 * Divide a dica de execução (texto livre gerado pela IA) em orientações,
 * uma por item, separando as referências genéticas entre parênteses como
 * marcadores (spec 012, FR-009 opção A e FR-010; research R7).
 *
 * A divisão é conservadora: na dúvida, não divide. Nunca perde texto.
 */
export interface TipItem {
  text: string
  markers: string[]
}

/** Grupo entre parênteses que começa com identificador de gene: "(WNT16)", "(COL1A1 C,C)". */
const GENE_MARKER = /\(([A-Z][A-Z0-9]{1,}[^)]*)\)/g

/** Pontuação solta no fim de uma orientação. */
const TRAILING_PUNCT = /[\s.;,:]+$/

/**
 * Quebra nos separadores de frase fora de parênteses:
 * - `;` seguido de espaço (ou fim);
 * - `.` seguido de espaço e letra maiúscula (ou fim). Assim "2.5kg" e
 *   "aprox. 3 séries" não são divididos.
 */
function splitSentences(text: string): string[] {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
    else if (depth === 0 && (ch === '.' || ch === ';')) {
      const rest = text.slice(i + 1)
      const isEnd = rest.trim() === ''
      const isBreak =
        isEnd ||
        (ch === ';' && /^\s/.test(rest)) ||
        (ch === '.' && /^\s+\p{Lu}/u.test(rest))
      if (isBreak) {
        parts.push(text.slice(start, i))
        start = i + 1
      }
    }
  }
  parts.push(text.slice(start))
  return parts
}

function toItem(fragment: string): TipItem | null {
  const raw = fragment.trim()
  if (!raw) return null
  const markers: string[] = []
  const withoutMarkers = raw.replace(GENE_MARKER, (_, gene: string) => {
    markers.push(gene.trim())
    return ' '
  })
  const text = withoutMarkers.replace(/\s+/g, ' ').replace(TRAILING_PUNCT, '').trim()
  if (!text) {
    // Só havia marcador: mantém o fragmento como texto para não perder nada.
    const fallback = raw.replace(TRAILING_PUNCT, '').trim()
    return fallback ? { text: fallback, markers: [] } : null
  }
  return { text, markers }
}

export function parseTipItems(text: string | null | undefined): TipItem[] {
  if (!text || !text.trim()) return []
  const items = splitSentences(text)
    .map(toItem)
    .filter((item): item is TipItem => item !== null)
  if (items.length === 0) return [{ text: text.trim(), markers: [] }]
  return items
}
