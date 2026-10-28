/**
 * Entrada digitada no Stepper (spec 026, data-model): vírgula ou ponto,
 * faixa [min, max] e casas decimais por campo (kg: 2, reps: 0).
 */

/** Arredonda para `decimals` casas sem erro de ponto flutuante (10,25 + 2,5 = 12,75). */
export function roundTo(n: number, decimals: number): number {
  const f = 10 ** decimals
  return Math.round((n + Math.sign(n) * Number.EPSILON) * f) / f
}

/** Texto digitado → número normalizado, ou null se vazio/não numérico (o chamador mantém o valor anterior). */
export function parseStepperInput(
  raw: string,
  { min, max, decimals }: { min: number; max: number; decimals: number },
): number | null {
  const text = raw.trim().replace(',', '.')
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(text)) return null
  const n = Number(text)
  if (!Number.isFinite(n)) return null
  return roundTo(Math.min(max, Math.max(min, n)), decimals)
}
