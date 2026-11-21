'use client'

import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '@/lib/motion'
import { centralPhase, poseAt, type ResolvedDemo } from '@helux/exercises'
import { DemoFigure, DemoImplement, DemoRange, DemoScene } from './demo-parts'

/** Spec 028: demonstração resolvida do catálogo (contracts/ui.md). */
interface CatalogDemoProps {
  demo: ResolvedDemo
  playing: boolean
  nonce?: string | number
  /** 0 a 1; fixa o quadro (galeria e captura) */
  phase?: number
  /** aria-label: "demonstração de <nome>" */
  label: string
}

/** Demonstração do catálogo (028): a única forma de animação desde o encerramento (T095). */
export function ExerciseDemo({ demo, playing, nonce, phase, label }: CatalogDemoProps) {
  const [ph, setPh] = useState(phase ?? 0)

  useEffect(() => {
    if (phase !== undefined) {
      setPh(phase)
      return
    }
    if (!playing) return
    // FR-008: em movimento reduzido, fica na pose central.
    if (prefersReducedMotion()) {
      setPh(centralPhase(demo))
      return
    }
    let raf = 0
    const start = performance.now()
    const loop = (now: number) => {
      const elapsed = now - start
      if (demo.loop === 'hold') {
        // hold: chega à posição e permanece, sem repetir
        const p = Math.min(1, elapsed / demo.durationMs)
        setPh(p)
        if (p < 1) raf = requestAnimationFrame(loop)
        return
      }
      setPh((elapsed % demo.durationMs) / demo.durationMs)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, demo.id, nonce, phase])

  const pose = poseAt(demo, ph)
  const svg = (
    <svg viewBox="0 0 220 250" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-label={label} data-demo={demo.id}>
      <g>
        <DemoScene scene={demo.scene} />
        <DemoRange demo={demo} />
        <DemoFigure pose={pose} mirror={demo.mirror} />
        <g data-part="implement">
          <DemoImplement demo={demo} pose={pose} />
        </g>
      </g>
    </svg>
  )
  if (!demo.caption) return svg
  return (
    <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, minHeight: 0 }}>{svg}</div>
      <figcaption className="t-caption" style={{ textAlign: 'center' }}>{demo.caption}</figcaption>
    </figure>
  )
}
