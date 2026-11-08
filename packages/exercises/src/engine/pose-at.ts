/**
 * Pose da demonstração em uma fase do ciclo (0 a 1). Pura e determinística: a captura de evidência
 * usa fases fixas em vez do relógio (R11).
 */
import { interpolatePose } from './kinematics'
import type { Pose, ResolvedDemo } from './types'

/** Fração do ciclo que o modo `hold` usa para chegar à posição; depois ela é mantida. */
const HOLD_ARRIVAL = 0.4

const ease = (x: number) => (1 - Math.cos(Math.PI * x)) / 2
const pingPong = (x: number) => (x < 0.5 ? x * 2 : 2 - x * 2)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/** Pose no ponto `p` (0 a 1) do trajeto de ida definido pelos keyframes. */
function along(demo: ResolvedDemo, p: number): Pose {
  const kf = demo.keyframes
  if (p <= kf[0].at) return kf[0].pose
  for (let i = 0; i + 1 < kf.length; i++) {
    const a = kf[i]
    const b = kf[i + 1]
    if (p <= b.at) return interpolatePose(a.pose, b.pose, (p - a.at) / (b.at - a.at), demo.root, demo.fixed)
  }
  return kf[kf.length - 1].pose
}

/** Ciclo contínuo: depois do último keyframe, volta ao primeiro. */
function cyclic(demo: ResolvedDemo, phase: number): Pose {
  const kf = demo.keyframes
  const p = phase - Math.floor(phase)
  const first = kf[0]
  const last = kf[kf.length - 1]
  if (p >= first.at && p <= last.at) {
    for (let i = 0; i + 1 < kf.length; i++) {
      if (p <= kf[i + 1].at) return interpolatePose(kf[i].pose, kf[i + 1].pose, (p - kf[i].at) / (kf[i + 1].at - kf[i].at), demo.root, demo.fixed)
    }
  }
  const span = 1 - last.at + first.at
  if (span <= 0) return first.pose
  const offset = p > last.at ? p - last.at : p + 1 - last.at
  return interpolatePose(last.pose, first.pose, offset / span, demo.root, demo.fixed)
}

/** Troca os membros principais pelos do lado oposto (modo `alternate`). */
function swapSides(pose: Pose): Pose {
  const out: Pose = { ...pose }
  if (pose.el2 && pose.ha2) Object.assign(out, { el: pose.el2, ha: pose.ha2, el2: pose.el, ha2: pose.ha })
  if (pose.kn2 && pose.an2 && pose.toe2) Object.assign(out, { kn: pose.kn2, an: pose.an2, toe: pose.toe2, kn2: pose.kn, an2: pose.an, toe2: pose.toe })
  return out
}

export function poseAt(demo: ResolvedDemo, phase: number): Pose {
  const x = clamp01(phase)
  switch (demo.loop) {
    case 'reps':
      return along(demo, ease(pingPong(x)))
    case 'hold':
      return along(demo, ease(Math.min(1, x / HOLD_ARRIVAL)))
    case 'alternate': {
      const second = x >= 0.5
      const local = second ? (x - 0.5) * 2 : x * 2
      const pose = along(demo, ease(pingPong(local)))
      return second ? swapSides(pose) : pose
    }
    case 'cycle':
      return cyclic(demo, phase)
  }
}

/** Fase mostrada com movimento reduzido: o meio do trajeto, ou a posição mantida no `hold`. */
export function centralPhase(demo: ResolvedDemo): number {
  return demo.loop === 'hold' ? 1 : 0.25
}

/** Fases de início, meio e fim usadas na evidência (R11). */
export function keyPhases(demo: ResolvedDemo): { start: number; mid: number; end: number } {
  if (demo.loop === 'hold') return { start: 0, mid: HOLD_ARRIVAL / 2, end: 1 }
  if (demo.loop === 'cycle') return { start: 0, mid: 1 / 3, end: 2 / 3 }
  return { start: 0, mid: 0.25, end: 0.5 }
}
