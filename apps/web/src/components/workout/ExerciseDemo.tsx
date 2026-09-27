'use client'

import { useEffect, useState } from 'react'
import { GENERIC_MOTION, type MotionKey } from '@helux/types'
import { prefersReducedMotion } from '@/lib/motion'

type P = [number, number]
type MotionView = 'front' | 'side'

/** Preset de braço: só ombro-cotovelo-mão se movem sobre um corpo parado (em pé ou deitado no banco). */
interface ArmPreset {
  kind?: 'arm'
  view: MotionView
  dur: number
  tilt?: number
  S: P
  start: { e: P; h: P }
  end: { e: P; h: P }
}

/** Pontos de uma pose de corpo inteiro (spec 013). `kn2/an2/toe2` = perna de trás (avanço). */
interface Pose {
  head: P
  sh: P
  el: P
  ha: P
  hip: P
  kn: P
  an: P
  toe: P
  kn2?: P
  an2?: P
  toe2?: P
}

type Scene = 'floor' | 'bench-low' | 'seat' | 'seat-recline' | 'dip-bars'
type ImplAt = 'ha' | 'sh' | 'hip' | 'an' | 'kn'

/** Preset de pose: duas poses de corpo inteiro interpoladas; `mirror` = vista frontal simétrica. */
interface PosePreset {
  kind: 'pose'
  dur: number
  scene: Scene
  implAt: ImplAt
  mirror?: boolean
  /** ponto de ancoragem do cabo quando o implemento é polia */
  anchor?: P
  start: Pose
  end: Pose
}

type MotionPreset = ArmPreset | PosePreset

// Em pé, de perfil (virado para a direita): base comum das poses.
const STAND = {
  head: [110, 40] as P,
  sh: [110, 66] as P,
  hip: [110, 136] as P,
  kn: [113, 186] as P,
  an: [110, 234] as P,
  toe: [128, 238] as P,
}
const shiftY = (pose: Pose, dy: number): Pose => {
  const out = { ...pose }
  for (const k of ['head', 'sh', 'el', 'ha', 'hip', 'kn'] as const) out[k] = [pose[k][0], pose[k][1] + dy]
  return out
}

const CALF_START: Pose = { ...STAND, el: [112, 100], ha: [114, 134] }

const HELUX_MOTIONS: Record<MotionKey, MotionPreset> = {
  // ---- presets de braço (originais) ----
  'press-overhead': { view: 'front', dur: 2300, S: [136, 80], start: { e: [168, 96], h: [176, 58] }, end: { e: [150, 42], h: [138, 10] } },
  'raise-lateral': { view: 'front', dur: 2500, S: [136, 80], start: { e: [144, 124], h: [148, 162] }, end: { e: [176, 80], h: [206, 76] } },
  pushdown: { view: 'front', dur: 2000, S: [136, 80], start: { e: [140, 126], h: [118, 102] }, end: { e: [140, 126], h: [128, 168] } },
  'press-flat': { view: 'side', dur: 2300, S: [104, 156], start: { e: [104, 128], h: [104, 106] }, end: { e: [104, 118], h: [104, 78] } },
  'press-incline': { view: 'side', tilt: -16, dur: 2300, S: [104, 156], start: { e: [104, 128], h: [104, 106] }, end: { e: [104, 118], h: [104, 78] } },
  'ext-lying': { view: 'side', dur: 2200, S: [104, 150], start: { e: [104, 120], h: [82, 118] }, end: { e: [104, 120], h: [104, 92] } },
  // ---- presets de braço (spec 013) ----
  'pull-vertical': { view: 'front', dur: 2400, S: [136, 80], start: { e: [164, 40], h: [168, 6] }, end: { e: [164, 116], h: [150, 80] } },
  curl: { view: 'front', dur: 2200, S: [136, 80], start: { e: [140, 126], h: [144, 168] }, end: { e: [140, 126], h: [146, 88] } },
  fly: { view: 'front', dur: 2600, S: [136, 80], start: { e: [178, 92], h: [208, 104] }, end: { e: [150, 100], h: [118, 106] } },
  'upright-row': { view: 'front', dur: 2300, S: [136, 80], start: { e: [140, 126], h: [124, 150] }, end: { e: [176, 76], h: [128, 86] } },
  'ext-overhead': { view: 'front', dur: 2300, S: [136, 80], start: { e: [144, 40], h: [124, 64] }, end: { e: [144, 40], h: [148, 4] } },
  // ---- presets de corpo inteiro (spec 013) ----
  squat: {
    kind: 'pose', dur: 2600, scene: 'floor', implAt: 'sh',
    start: { ...STAND, el: [96, 88], ha: [104, 66] },
    end: { head: [106, 90], sh: [100, 114], el: [86, 132], ha: [96, 114], hip: [72, 176], kn: [128, 182], an: [110, 234], toe: [128, 238] },
  },
  lunge: {
    kind: 'pose', dur: 2600, scene: 'floor', implAt: 'ha',
    start: { head: [104, 32], sh: [104, 58], el: [106, 92], ha: [108, 124], hip: [104, 128], kn: [126, 180], an: [140, 234], toe: [158, 238], kn2: [92, 180], an2: [66, 228], toe2: [56, 238] },
    end: { head: [104, 74], sh: [104, 100], el: [106, 134], ha: [108, 166], hip: [104, 170], kn: [146, 178], an: [140, 234], toe: [158, 238], kn2: [90, 222], an2: [62, 230], toe2: [52, 238] },
  },
  'leg-press': {
    kind: 'pose', dur: 2600, scene: 'seat-recline', implAt: 'an',
    start: { head: [34, 118], sh: [46, 142], el: [62, 168], ha: [76, 184], hip: [84, 190], kn: [104, 142], an: [140, 160], toe: [146, 148] },
    end: { head: [34, 118], sh: [46, 142], el: [62, 168], ha: [76, 184], hip: [84, 190], kn: [128, 152], an: [172, 122], toe: [178, 110] },
  },
  hinge: {
    kind: 'pose', dur: 2600, scene: 'floor', implAt: 'ha',
    start: { ...STAND, el: [112, 100], ha: [112, 134] },
    end: { head: [172, 100], sh: [152, 112], el: [152, 146], ha: [152, 180], hip: [88, 140], kn: [116, 188], an: [110, 234], toe: [128, 238] },
  },
  'hip-thrust': {
    kind: 'pose', dur: 2400, scene: 'bench-low', implAt: 'hip',
    start: { head: [42, 168], sh: [60, 178], el: [80, 206], ha: [96, 214], hip: [96, 218], kn: [144, 190], an: [150, 234], toe: [166, 238] },
    end: { head: [42, 168], sh: [60, 178], el: [84, 186], ha: [104, 174], hip: [106, 176], kn: [152, 178], an: [150, 234], toe: [166, 238] },
  },
  row: {
    kind: 'pose', dur: 2300, scene: 'floor', implAt: 'ha', anchor: [212, 196],
    start: { head: [168, 92], sh: [148, 104], el: [148, 140], ha: [150, 174], hip: [88, 138], kn: [108, 186], an: [104, 234], toe: [122, 238] },
    end: { head: [168, 92], sh: [148, 104], el: [122, 118], ha: [136, 146], hip: [88, 138], kn: [108, 186], an: [104, 234], toe: [122, 238] },
  },
  'push-up': {
    kind: 'pose', dur: 2300, scene: 'floor', implAt: 'sh',
    start: { head: [52, 160], sh: [70, 168], el: [72, 202], ha: [70, 236], hip: [132, 196], kn: [162, 214], an: [190, 230], toe: [196, 238] },
    end: { head: [54, 206], sh: [72, 212], el: [98, 220], ha: [70, 236], hip: [134, 220], kn: [164, 228], an: [190, 232], toe: [196, 238] },
  },
  plank: {
    kind: 'pose', dur: 3200, scene: 'floor', implAt: 'hip',
    start: { head: [44, 196], sh: [62, 204], el: [62, 236], ha: [88, 236], hip: [132, 214], kn: [170, 224], an: [200, 232], toe: [206, 238] },
    end: { head: [44, 194], sh: [62, 202], el: [62, 236], ha: [88, 236], hip: [132, 206], kn: [170, 222], an: [200, 232], toe: [206, 238] },
  },
  crunch: {
    kind: 'pose', dur: 2200, scene: 'floor', implAt: 'ha', anchor: [8, 150],
    start: { head: [42, 222], sh: [60, 228], el: [52, 208], ha: [44, 216], hip: [120, 228], kn: [150, 196], an: [178, 232], toe: [190, 236] },
    end: { head: [68, 186], sh: [82, 202], el: [74, 180], ha: [64, 190], hip: [120, 228], kn: [150, 196], an: [178, 232], toe: [190, 236] },
  },
  'leg-raise': {
    kind: 'pose', dur: 2600, scene: 'floor', implAt: 'an',
    start: { head: [42, 224], sh: [60, 228], el: [82, 236], ha: [104, 236], hip: [124, 230], kn: [166, 230], an: [204, 230], toe: [212, 222] },
    end: { head: [42, 224], sh: [60, 228], el: [82, 236], ha: [104, 236], hip: [124, 230], kn: [140, 186], an: [150, 140], toe: [162, 134] },
  },
  rollout: {
    kind: 'pose', dur: 2800, scene: 'floor', implAt: 'ha',
    start: { head: [166, 136], sh: [148, 150], el: [156, 186], ha: [160, 222], hip: [104, 178], kn: [100, 232], an: [60, 234], toe: [52, 238] },
    end: { head: [190, 186], sh: [170, 196], el: [188, 210], ha: [204, 224], hip: [122, 204], kn: [100, 232], an: [60, 234], toe: [52, 238] },
  },
  'cable-rotation': {
    kind: 'pose', dur: 2400, scene: 'floor', implAt: 'ha', anchor: [14, 80],
    start: { ...STAND, el: [122, 94], ha: [128, 76] },
    end: { ...STAND, el: [146, 72], ha: [178, 70] },
  },
  dip: {
    kind: 'pose', dur: 2400, scene: 'dip-bars', implAt: 'sh',
    start: { head: [108, 60], sh: [106, 86], el: [100, 110], ha: [110, 132], hip: [104, 154], kn: [110, 200], an: [88, 222], toe: [80, 230] },
    end: { head: [106, 94], sh: [104, 120], el: [82, 128], ha: [110, 132], hip: [102, 186], kn: [110, 226], an: [86, 236], toe: [78, 240] },
  },
  'raise-front': {
    kind: 'pose', dur: 2500, scene: 'floor', implAt: 'ha',
    start: { ...STAND, el: [112, 100], ha: [114, 134] },
    end: { ...STAND, el: [146, 68], ha: [180, 70] },
  },
  shrug: {
    kind: 'pose', dur: 2000, scene: 'floor', implAt: 'ha', mirror: true,
    start: { head: [110, 42], sh: [136, 80], el: [142, 120], ha: [144, 156], hip: [122, 150], kn: [122, 194], an: [122, 234], toe: [130, 238] },
    end: { head: [110, 34], sh: [136, 68], el: [142, 108], ha: [144, 144], hip: [122, 150], kn: [122, 194], an: [122, 234], toe: [130, 238] },
  },
  'hip-abduction': {
    kind: 'pose', dur: 2400, scene: 'floor', implAt: 'kn', mirror: true,
    start: { head: [110, 42], sh: [136, 80], el: [142, 120], ha: [144, 156], hip: [120, 150], kn: [121, 194], an: [120, 234], toe: [128, 238] },
    end: { head: [110, 42], sh: [136, 80], el: [142, 120], ha: [144, 156], hip: [120, 150], kn: [134, 192], an: [148, 232], toe: [156, 236] },
  },
  'leg-ext': {
    kind: 'pose', dur: 2400, scene: 'seat', implAt: 'an',
    start: { head: [84, 80], sh: [84, 106], el: [96, 140], ha: [104, 170], hip: [90, 176], kn: [140, 178], an: [144, 228], toe: [156, 234] },
    end: { head: [84, 80], sh: [84, 106], el: [96, 140], ha: [104, 170], hip: [90, 176], kn: [140, 178], an: [190, 172], toe: [198, 160] },
  },
  'leg-curl': {
    kind: 'pose', dur: 2400, scene: 'seat', implAt: 'an',
    start: { head: [84, 80], sh: [84, 106], el: [96, 140], ha: [104, 170], hip: [90, 176], kn: [140, 178], an: [190, 172], toe: [198, 160] },
    end: { head: [84, 80], sh: [84, 106], el: [96, 140], ha: [104, 170], hip: [90, 176], kn: [140, 178], an: [126, 226], toe: [136, 234] },
  },
  'calf-raise': {
    kind: 'pose', dur: 1800, scene: 'floor', implAt: 'ha',
    start: CALF_START,
    end: { ...shiftY(CALF_START, -16), an: [116, 218], toe: [128, 238] },
  },
}

const easeIO = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const lerpP = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const mir = (p: P): P => [220 - p[0], p[1]]

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const out = {} as Pose
  for (const k of Object.keys(a) as (keyof Pose)[]) {
    const pa = a[k]
    const pb = b[k] ?? pa
    if (pa) out[k] = lerpP(pa, pb, t)
  }
  return out
}

function Implement({
  view,
  impl,
  Rh,
  Lh,
  Re,
}: {
  view: MotionView
  impl: string
  Rh: P
  Lh?: P
  Re?: P
}) {
  const acc = 'var(--accent)'
  if (impl === 'bodyweight') return null
  if (view === 'front' && Lh && Re) {
    if (impl === 'dumbbell') {
      const bar = (h: P, e: P) => {
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
      const mid: P = [(Rh[0] + Lh[0]) / 2, (Rh[1] + Lh[1]) / 2]
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

/** Implemento de um preset de pose, desenhado no ponto `at` (vista de perfil) ou nos dois lados (frontal). */
function PoseImplement({ impl, at, anchor, mirror }: { impl: string; at: P; anchor: P; mirror?: boolean }) {
  const acc = 'var(--accent)'
  if (impl === 'bodyweight') return null
  const other = mirror ? mir(at) : undefined
  if (impl === 'cable') {
    return (
      <g>
        <line x1={anchor[0]} y1={anchor[1]} x2={at[0]} y2={at[1]} stroke="var(--text-faint)" strokeWidth="1.6" strokeDasharray="3 3" />
        <circle cx={at[0]} cy={at[1]} r="4.5" fill={acc} />
        {other && <circle cx={other[0]} cy={other[1]} r="4.5" fill={acc} />}
      </g>
    )
  }
  if (impl === 'machine') {
    const pad = (p: P) => <rect x={p[0] - 9} y={p[1] - 5} width={18} height={10} rx={4} fill={acc} />
    return (
      <g>
        {pad(at)}
        {other && pad(other)}
      </g>
    )
  }
  if (impl === 'dumbbell') {
    const db = (p: P) => (
      <g>
        <line x1={p[0] - 8} y1={p[1]} x2={p[0] + 8} y2={p[1]} stroke={acc} strokeWidth="5" strokeLinecap="round" />
        <circle cx={p[0] - 8} cy={p[1]} r="3.4" fill={acc} />
        <circle cx={p[0] + 8} cy={p[1]} r="3.4" fill={acc} />
      </g>
    )
    return (
      <g>
        {db(at)}
        {other && db(other)}
      </g>
    )
  }
  // barra: de frente, a barra liga as duas mãos; de perfil, vê-se a anilha.
  if (other) {
    return (
      <g>
        <line x1={other[0] - 12} y1={other[1]} x2={at[0] + 12} y2={at[1]} stroke={acc} strokeWidth="6" strokeLinecap="round" />
        <circle cx={other[0] - 12} cy={other[1]} r="4" fill={acc} />
        <circle cx={at[0] + 12} cy={at[1]} r="4" fill={acc} />
      </g>
    )
  }
  return (
    <g>
      <circle cx={at[0]} cy={at[1]} r="10" fill="none" stroke={acc} strokeWidth="4" />
      <circle cx={at[0]} cy={at[1]} r="2.6" fill={acc} />
    </g>
  )
}

function SceneProps({ scene }: { scene: Scene }) {
  const floor = <line x1={16} y1={240} x2={204} y2={240} stroke="var(--hairline)" strokeWidth="2" strokeLinecap="round" />
  switch (scene) {
    case 'bench-low':
      return (
        <g>
          {floor}
          <rect x={14} y={184} width={60} height={12} rx={6} fill="var(--surface-2)" stroke="var(--hairline)" />
          <line x1={30} y1={196} x2={30} y2={238} stroke="var(--surface-3)" strokeWidth="5" strokeLinecap="round" />
        </g>
      )
    case 'seat':
      return (
        <g>
          {floor}
          <rect x={62} y={180} width={84} height={12} rx={6} fill="var(--surface-2)" stroke="var(--hairline)" />
          <line x1={68} y1={96} x2={68} y2={180} stroke="var(--surface-3)" strokeWidth="6" strokeLinecap="round" />
          <line x1={104} y1={192} x2={104} y2={238} stroke="var(--surface-3)" strokeWidth="5" strokeLinecap="round" />
        </g>
      )
    case 'seat-recline':
      return (
        <g>
          {floor}
          <line x1={20} y1={120} x2={92} y2={204} stroke="var(--surface-2)" strokeWidth="12" strokeLinecap="round" />
          <line x1={60} y1={204} x2={60} y2={238} stroke="var(--surface-3)" strokeWidth="5" strokeLinecap="round" />
        </g>
      )
    case 'dip-bars':
      return (
        <g>
          {floor}
          <line x1={92} y1={136} x2={134} y2={136} stroke="var(--text-faint)" strokeWidth="5" strokeLinecap="round" />
          <line x1={128} y1={136} x2={128} y2={238} stroke="var(--surface-3)" strokeWidth="4" strokeLinecap="round" />
        </g>
      )
    default:
      return floor
  }
}

function PoseScene({ m, pose, implement }: { m: PosePreset; pose: Pose; implement: string }) {
  const limb = { stroke: 'var(--text)', strokeWidth: 7, strokeLinecap: 'round' as const, fill: 'none' }
  const body = { stroke: 'var(--text-dim)', strokeWidth: 7, strokeLinecap: 'round' as const, fill: 'none' }
  const jointFill = 'var(--surface-3)'
  const seg = (a: P, b: P, key?: string) => <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
  const side = (p: Pose, flip: boolean) => {
    const f = (q: P) => (flip ? mir(q) : q)
    return {
      arm: [seg(f(p.sh), f(p.el), 'a1'), seg(f(p.el), f(p.ha), 'a2')],
      leg: [seg(f(p.hip), f(p.kn), 'l1'), seg(f(p.kn), f(p.an), 'l2'), seg(f(p.an), f(p.toe), 'l3')],
    }
  }
  const near = side(pose, false)
  const far = m.mirror ? side(pose, true) : undefined
  const back =
    pose.kn2 && pose.an2 && pose.toe2
      ? [seg(pose.hip, pose.kn2, 'b1'), seg(pose.kn2, pose.an2, 'b2'), seg(pose.an2, pose.toe2, 'b3')]
      : null
  const midSh: P = m.mirror ? [110, pose.sh[1]] : pose.sh
  const midHip: P = m.mirror ? [110, pose.hip[1]] : pose.hip
  const at = pose[m.implAt] ?? pose.ha
  const romA = m.start[m.implAt] ?? m.start.ha
  const romB = m.end[m.implAt] ?? m.end.ha

  return (
    <g>
      <SceneProps scene={m.scene} />
      <line x1={romA[0]} y1={romA[1]} x2={romB[0]} y2={romB[1]} stroke="var(--hairline-3)" strokeWidth="2" strokeDasharray="2 5" />
      <g {...body}>
        {back}
        {m.mirror && seg(pose.sh, mir(pose.sh))}
        {m.mirror && seg(pose.hip, mir(pose.hip))}
        {seg(midSh, midHip)}
      </g>
      <circle cx={pose.head[0]} cy={pose.head[1]} r={14} fill="none" stroke="var(--text-dim)" strokeWidth={7} />
      <g data-part="legs" {...limb}>
        {near.leg}
        {far?.leg}
      </g>
      <g {...limb}>
        {near.arm}
        {far?.arm}
      </g>
      <circle data-joint="kn" cx={pose.kn[0]} cy={pose.kn[1]} r="4.5" fill={jointFill} />
      <circle cx={pose.el[0]} cy={pose.el[1]} r="4.5" fill={jointFill} />
      <g data-part="implement">
        <PoseImplement impl={implement} at={at} anchor={m.anchor ?? [212, 40]} mirror={m.mirror} />
      </g>
    </g>
  )
}

function resolvePreset(motion: string): [MotionKey, MotionPreset] {
  if (Object.prototype.hasOwnProperty.call(HELUX_MOTIONS, motion)) {
    const key = motion as MotionKey
    return [key, HELUX_MOTIONS[key]]
  }
  return [GENERIC_MOTION, HELUX_MOTIONS[GENERIC_MOTION]]
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
  const [key, m] = resolvePreset(motion)
  const [ph, setPh] = useState(0)

  useEffect(() => {
    if (!playing) return
    // FR-008: em movimento reduzido, a demonstração fica parada no meio do movimento.
    if (prefersReducedMotion()) {
      setPh(0.5)
      return
    }
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

  let scene
  if (m.kind === 'pose') {
    scene = <PoseScene m={m} pose={lerpPose(m.start, m.end, ph)} implement={implement} />
  } else {
    scene = <ArmScene m={m} ph={ph} implement={implement} />
  }

  return (
    <svg
      viewBox="0 0 220 250"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      aria-label="demonstração do movimento"
      data-motion={key}
    >
      {scene}
    </svg>
  )
}

function ArmScene({ m, ph, implement }: { m: ArmPreset; ph: number; implement: string }) {
  const S = m.S
  const e = lerpP(m.start.e, m.end.e, ph)
  const h = lerpP(m.start.h, m.end.h, ph)
  const limbS = { stroke: 'var(--text)', strokeWidth: 7, strokeLinecap: 'round' as const, fill: 'none' }
  const jointFill = 'var(--surface-3)'

  if (m.view === 'front') {
    const Le = mir(e)
    const Lh = mir(h)
    const LS = mir(S)
    return (
      <g>
        <g stroke="var(--hairline-3)" strokeWidth="2" strokeDasharray="2 5" fill="none">
          <line x1={m.start.h[0]} y1={m.start.h[1]} x2={m.end.h[0]} y2={m.end.h[1]} />
          <line x1={220 - m.start.h[0]} y1={m.start.h[1]} x2={220 - m.end.h[0]} y2={m.end.h[1]} />
        </g>
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
        <g data-part="implement"><Implement view="front" impl={implement} Rh={h} Lh={Lh} Re={e} /></g>
      </g>
    )
  }

  const tilt = m.tilt ? `rotate(${m.tilt} 110 150)` : undefined
  return (
    <g transform={tilt}>
      <g>
        <rect x={36} y={176} width={150} height={12} rx={6} fill="var(--surface-2)" stroke="var(--hairline)" />
        <line x1={54} y1={188} x2={54} y2={214} stroke="var(--surface-3)" strokeWidth="5" strokeLinecap="round" />
        <line x1={168} y1={188} x2={168} y2={214} stroke="var(--surface-3)" strokeWidth="5" strokeLinecap="round" />
      </g>
      <line
        x1={m.start.h[0]}
        y1={m.start.h[1]}
        x2={m.end.h[0]}
        y2={m.end.h[1]}
        stroke="var(--hairline-3)"
        strokeWidth="2"
        strokeDasharray="2 5"
      />
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
      <g data-part="implement"><Implement view="side" impl={implement} Rh={h} /></g>
    </g>
  )
}
