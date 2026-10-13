import type { CSSProperties } from 'react'

/** Skeleton (`.hx-sk`) com a forma do conteúdo final; sem brilho em movimento reduzido. */
export function Skeleton({
  w = '100%',
  h,
  r,
  style,
}: {
  w?: number | string
  h: number | string
  r?: number | string
  style?: CSSProperties
}) {
  return <div className="hx-sk" aria-hidden="true" style={{ width: w, height: h, borderRadius: r, ...style }} />
}
