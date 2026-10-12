import type { ReactNode } from 'react'

const TAG_KIND = {
  default: 'hx-tag',
  outline: 'hx-tag hx-tag--outline',
  warn: 'hx-tag hx-tag--warn',
} as const

/** Etiqueta informativa (retângulo de 6 px). Nunca é tocável. */
export function Tag({ kind = 'default', children }: { kind?: keyof typeof TAG_KIND; children: ReactNode }) {
  return <span className={TAG_KIND[kind]}>{children}</span>
}

/** Marcador genético: símbolo em itálico mono e genótipo ao lado. */
export function GeneTag({ symbol, genotype, warn }: { symbol: string; genotype?: string; warn?: boolean }) {
  const label = ['marcador genético', symbol, genotype].filter(Boolean).join(' ')
  return (
    <span className={warn ? 'hx-gtag hx-gtag--warn' : 'hx-gtag'} role="img" aria-label={label}>
      <i>{symbol}</i>
      {genotype}
    </span>
  )
}
