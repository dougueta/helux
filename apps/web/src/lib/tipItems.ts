/**
 * Divide a dica de execução (texto livre gerado pela IA) em orientações,
 * uma por item, separando o marcador genético como etiqueta
 * (spec 012, research R7 e V4).
 *
 * Regras v2 (V4):
 * - "(COL1A1 C,C)" → gene { symbol: 'COL1A1', genotype: 'C,C' }; "(WNT16)" → { symbol: 'WNT16' };
 * - gene sem parênteses seguido de genótipo em par de bases ("COL1A1 C,C") também é extraído;
 * - só o primeiro marcador vira etiqueta; os demais ficam no texto;
 * - o prefixo "ATENÇÃO:" é removido (a urgência vem do marcador âmbar).
 *
 * A divisão é conservadora: na dúvida, não divide. Nunca perde texto.
 */
export interface TipGene {
  symbol: string
  genotype?: string
}

export interface TipItem {
  text: string
  gene?: TipGene
}

/** Grupo entre parênteses que começa com identificador de gene: "(WNT16)", "(COL1A1 C,C)". */
const GENE_MARKER = /\(([A-Z][A-Z0-9]{1,}[^)]*)\)/

/** Gene sem parênteses seguido de genótipo em par de bases: "COL1A1 C,C". */
const BARE_GENE = /\b([A-Z][A-Z0-9]{2,})\s+([ACGT],[ACGT])\b/

/** Prefixo de alerta proibido pelo handoff. */
const ALERT_PREFIX = /^aten[çc][ãa]o\s*:\s*/i

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

function toGene(raw: string): TipGene {
  const trimmed = raw.trim()
  const space = trimmed.indexOf(' ')
  if (space < 0) return { symbol: trimmed }
  return { symbol: trimmed.slice(0, space), genotype: trimmed.slice(space + 1).trim() }
}

const clean = (s: string) => s.replace(/\s+/g, ' ').replace(/\s+([,;.:])/g, '$1').replace(TRAILING_PUNCT, '').trim()

function toItem(fragment: string): TipItem | null {
  let raw = fragment.trim()
  if (!raw) return null

  let prefixRemoved = false
  if (ALERT_PREFIX.test(raw)) {
    raw = raw.replace(ALERT_PREFIX, '')
    prefixRemoved = true
  }

  let gene: TipGene | undefined
  let rest = raw
  const paren = rest.match(GENE_MARKER)
  if (paren) {
    gene = toGene(paren[1])
    rest = rest.replace(GENE_MARKER, ' ')
  } else {
    const bare = rest.match(BARE_GENE)
    if (bare) {
      gene = { symbol: bare[1], genotype: bare[2] }
      rest = rest.replace(BARE_GENE, ' ')
    }
  }

  let text = clean(rest)
  if (!text) {
    // Só havia marcador: mantém o fragmento como texto para não perder nada.
    const fallback = clean(raw)
    return fallback ? { text: fallback } : null
  }
  if (prefixRemoved) text = text.charAt(0).toLocaleUpperCase('pt-BR') + text.slice(1)
  return gene ? { text, gene } : { text }
}

export function parseTipItems(text: string | null | undefined): TipItem[] {
  if (!text || !text.trim()) return []
  const items = splitSentences(text)
    .map(toItem)
    .filter((item): item is TipItem => item !== null)
  if (items.length === 0) return [{ text: text.trim() }]
  return items
}
