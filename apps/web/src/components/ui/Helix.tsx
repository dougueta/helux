'use client'

import { useEffect, useState } from 'react'
import { fitColor, litRungs } from '@/lib/fit'
import { prefersReducedMotion } from '@/lib/motion'

/** Altura do traço i: |cos| com uma volta a cada 10,5 pares de base (mín. 2 px). */
export function rungHeight(i: number, h: number): number {
  return Math.max(2, h * (0.26 + 0.74 * Math.abs(Math.cos((2 * Math.PI * i) / 10.5))))
}

/**
 * Assinatura da v2: hélice projetada (research V6). Usos permitidos: fit,
 * fita de marcadores e conclusão. `sequential` acende os traços em sequência
 * depois de montar (35 ms por traço, 200 ms cada), já aceso em movimento reduzido.
 */
export function Helix({
  value,
  n,
  h,
  w = 2,
  gap = 2,
  on,
  off = 'var(--rung-off)',
  sequential = false,
  delayMs = 35,
}: {
  value: number
  n: number
  h: number
  w?: number
  gap?: number
  on?: string
  off?: string
  sequential?: boolean
  delayMs?: number
}) {
  const [armed, setArmed] = useState(!sequential)
  const [animate, setAnimate] = useState(sequential)

  useEffect(() => {
    if (!sequential) return
    if (prefersReducedMotion()) {
      setAnimate(false)
      setArmed(true)
      return
    }
    const id = setTimeout(() => setArmed(true), 250)
    return () => clearTimeout(id)
  }, [sequential])

  const color = on ?? fitColor(value)
  const lit = armed ? litRungs(value, n) : 0
  const W = n * (w + gap) - gap

  return (
    <svg className="hx-helix" width={W} height={h} viewBox={`0 0 ${W} ${h}`} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => {
        const rh = rungHeight(i, h)
        return (
          <rect
            key={i}
            x={i * (w + gap)}
            y={(h - rh) / 2}
            width={w}
            height={rh}
            rx={w / 2}
            fill={i < lit ? color : off}
            style={animate ? { transition: `fill 200ms ${i * delayMs}ms` } : undefined}
          />
        )
      })}
    </svg>
  )
}
