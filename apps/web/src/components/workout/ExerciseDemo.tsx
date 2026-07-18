'use client'

import { useEffect, useState } from 'react'

type MotionView = 'front' | 'side'

interface MotionPreset {
  view: MotionView
  dur: number
  tilt?: number
  S: [number, number]
  start: { e: [number, number]; h: [number, number] }
  end: { e: [number, number]; h: [number, number] }
}

const HELUX_MOTIONS: Record<string, MotionPreset> = {
  'press-overhead': { view: 'front', dur: 2300, S: [136, 80], start: { e: [168, 96], h: [176, 58] }, end: { e: [150, 42], h: [138, 10] } },
  'raise-lateral': { view: 'front', dur: 2500, S: [136, 80], start: { e: [144, 124], h: [148, 162] }, end: { e: [176, 80], h: [206, 76] } },
  pushdown: { view: 'front', dur: 2000, S: [136, 80], start: { e: [140, 126], h: [118, 102] }, end: { e: [140, 126], h: [128, 168] } },
  'press-flat': { view: 'side', dur: 2300, S: [104, 156], start: { e: [104, 128], h: [104, 106] }, end: { e: [104, 118], h: [104, 78] } },
  'press-incline': { view: 'side', tilt: -16, dur: 2300, S: [104, 156], start: { e: [104, 128], h: [104, 106] }, end: { e: [104, 118], h: [104, 78] } },
  'ext-lying': { view: 'side', dur: 2200, S: [104, 150], start: { e: [104, 120], h: [82, 118] }, end: { e: [104, 120], h: [104, 92] } },
}

const easeIO = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const lerpP = (a: [number, number], b: [number, number], t: number): [number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
]
const mir = (p: [number, number]): [number, number] => [220 - p[0], p[1]]

function Implement({
  view,
  impl,
  Rh,
  Lh,
  Re,
}: {
  view: MotionView
  impl: string
  Rh: [number, number]
  Lh?: [number, number]
  Re?: [number, number]
}) {
  const acc = 'var(--accent)'
  if (view === 'front' && Lh && Re) {
    if (impl === 'dumbbell') {
      const bar = (h: [number, number], e: [number, number]) => {
        const dx = h[0] - e[0]
        const dy = h[1] - e[1]
        const L = Math.hypot(dx, dy) || 1
        const px = (-dy / L) * 11
        const py = (dx / L) * 11
        return (
          <g>
            <line x1={h[0] - px} y1={h[1] - py} x2={h[0] + px} y2={h[1] + py} stroke={acc} strokeWidth="6" strokeLinecap="round" />
            <circle cx={h[0] - px} cy={h[1] - py} r="3.4" fill={acc} />
            <circle cx={h[0] + px} cy={h[1] + py} r="3.4" fill={acc} />
          </g>
        )
      }
      return (
        <g>
          {bar(Rh, Re)}
          {bar(Lh, mir(Re))}
        </g>
      )
    }
    if (impl === 'cable') {
      const mid: [number, number] = [(Rh[0] + Lh[0]) / 2, (Rh[1] + Lh[1]) / 2]
      return (
        <g>
          <line x1={110} y1={2} x2={mid[0]} y2={mid[1]} stroke="var(--text-faint)" strokeWidth="1.6" strokeDasharray="3 3" />
          <line x1={Lh[0]} y1={Lh[1]} x2={Rh[0]} y2={Rh[1]} stroke={acc} strokeWidth="5.5" strokeLinecap="round" />
        </g>
      )
    }
    const rails =
      impl === 'machine' ? (
        <g stroke="var(--text-faint)" strokeWidth="1.6">
          <line x1={70} y1={6} x2={70} y2={150} />
          <line x1={150} y1={6} x2={150} y2={150} />
        </g>
      ) : null
    return (
      <g>
        {rails}
        <line x1={Lh[0]} y1={Lh[1]} x2={Rh[0]} y2={Rh[1]} stroke={acc} strokeWidth="6" strokeLinecap="round" />
        <circle cx={Lh[0]} cy={Lh[1]} r="4" fill={acc} />
        <circle cx={Rh[0]} cy={Rh[1]} r="4" fill={acc} />
      </g>
    )
  }
  const w = impl === 'dumbbell' ? 13 : 20
  return (
    <g>
      <line x1={Rh[0] - w} y1={Rh[1]} x2={Rh[0] + w} y2={Rh[1]} stroke={acc} strokeWidth="6" strokeLinecap="round" />
      <circle cx={Rh[0] - w} cy={Rh[1]} r="3.8" fill={acc} />
      <circle cx={Rh[0] + w} cy={Rh[1]} r="3.8" fill={acc} />
    </g>
  )
}

export function ExerciseDemo({
  motion,
  implement = 'barbell',
  playing,
  nonce,
}: {
  motion: string
  implement?: string
  playing: boolean
  nonce?: string | number
}) {
  const m = HELUX_MOTIONS[motion] || HELUX_MOTIONS['press-flat']
  const [ph, setPh] = useState(0)

  useEffect(() => {
    if (!playing) return
    let raf: number
    const start = performance.now()
    const loop = (now: number) => {
      const u = ((now - start) % m.dur) / m.dur
      const tri = u < 0.5 ? u / 0.5 : (1 - u) / 0.5
      setPh(easeIO(tri))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, motion, nonce])

  const S = m.S
  const e = lerpP(m.start.e, m.end.e, ph)
  const h = lerpP(m.start.h, m.end.h, ph)
  const limbS = { stroke: 'var(--text)', strokeWidth: 7, strokeLinecap: 'round' as const, fill: 'none' }
  const jointFill = 'var(--surface-3)'

  const romFront = (
    <g stroke="var(--accent-line)" strokeWidth="2" strokeDasharray="2 5" fill="none" opacity="0.7">
      <line x1={m.start.h[0]} y1={m.start.h[1]} x2={m.end.h[0]} y2={m.end.h[1]} />
      <line x1={220 - m.start.h[0]} y1={m.start.h[1]} x2={220 - m.end.h[0]} y2={m.end.h[1]} />
    </g>
  )
  const romSide = (
    <line
      x1={m.start.h[0]}
      y1={m.start.h[1]}
      x2={m.end.h[0]}
      y2={m.end.h[1]}
      stroke="var(--accent-line)"
      strokeWidth="2"
      strokeDasharray="2 5"
      opacity="0.7"
    />
  )

  let scene
  if (m.view === 'front') {
    const Le = mir(e)
    const Lh = mir(h)
    const LS = mir(S)
    scene = (
      <g>
        {romFront}
        <g stroke="var(--text-dim)" strokeWidth={7} strokeLinecap="round" fill="none">
          <line x1={LS[0]} y1={LS[1]} x2={S[0]} y2={S[1]} />
          <line x1={110} y1={80} x2={110} y2={150} />
          <line x1={96} y1={150} x2={124} y2={150} />
          <line x1={100} y1={150} x2={98} y2={236} />
          <line x1={120} y1={150} x2={122} y2={236} />
        </g>
        <circle cx={110} cy={42} r={15} fill="none" stroke="var(--text-dim)" strokeWidth={7} />
        <g {...limbS}>
          <line x1={S[0]} y1={S[1]} x2={e[0]} y2={e[1]} />
          <line x1={e[0]} y1={e[1]} x2={h[0]} y2={h[1]} />
          <line x1={LS[0]} y1={LS[1]} x2={Le[0]} y2={Le[1]} />
          <line x1={Le[0]} y1={Le[1]} x2={Lh[0]} y2={Lh[1]} />
        </g>
        <circle cx={e[0]} cy={e[1]} r="4.5" fill={jointFill} />
        <circle cx={Le[0]} cy={Le[1]} r="4.5" fill={jointFill} />
        <Implement view="front" impl={implement} Rh={h} Lh={Lh} Re={e} />
      </g>
    )
  } else {
    const tilt = m.tilt ? `rotate(${m.tilt} 110 150)` : undefined
    scene = (
      <g transform={tilt}>
        <g>
          <rect x={36} y={176} width={150} height={12} rx={6} fill="var(--surface-2)" stroke="var(--hairline)" />
          <line x1={54} y1={188} x2={54} y2={214} stroke="var(--surface-3)" strokeWidth="5" strokeLinecap="round" />
          <line x1={168} y1={188} x2={168} y2={214} stroke="var(--surface-3)" strokeWidth="5" strokeLinecap="round" />
        </g>
        {romSide}
        <g stroke="var(--text-dim)" strokeWidth={7} strokeLinecap="round" fill="none">
          <line x1={72} y1={156} x2={150} y2={160} />
          <line x1={150} y1={160} x2={184} y2={160} />
          <line x1={184} y1={160} x2={190} y2={186} />
        </g>
        <circle cx={58} cy={150} r={14} fill="none" stroke="var(--text-dim)" strokeWidth={7} />
        <g {...limbS}>
          <line x1={S[0]} y1={S[1]} x2={e[0]} y2={e[1]} />
          <line x1={e[0]} y1={e[1]} x2={h[0]} y2={h[1]} />
        </g>
        <circle cx={S[0]} cy={S[1]} r="4.5" fill={jointFill} />
        <circle cx={e[0]} cy={e[1]} r="4.5" fill={jointFill} />
        <Implement view="side" impl={implement} Rh={h} />
      </g>
    )
  }

  return (
    <svg viewBox="0 0 220 250" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-label="demonstração do movimento">
      {scene}
    </svg>
  )
}
