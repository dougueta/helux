/**
 * Fit genético (spec 012, research V6): faixa, token de cor e traços acesos
 * na hélice. ≥ 75 alto, 50–74 médio, < 50 baixo.
 */
export type FitBand = 'alto' | 'médio' | 'baixo'

export function fitBand(value: number): FitBand {
  if (value >= 75) return 'alto'
  if (value >= 50) return 'médio'
  return 'baixo'
}

const COLOR: Record<FitBand, string> = {
  alto: 'var(--fit-hi)',
  médio: 'var(--fit-mid)',
  baixo: 'var(--fit-lo)',
}

export function fitColor(value: number): string {
  return COLOR[fitBand(value)]
}

export function litRungs(value: number, n: number): number {
  return Math.round((n * value) / 100)
}
