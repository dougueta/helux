/**
 * Cinemática da figura (R5): cada osso gira em torno da articulação anterior, a partir do apoio fixo.
 * Isso produz arcos reais e mantém o comprimento dos membros. Apoios adicionais (ex.: mãos e pés na
 * flexão) são mantidos por FABRIK, que também preserva o comprimento dos ossos.
 */
import type { Joint, MovementBase, Point, Pose, Root } from './types'

/** Ossos da figura, como pares de articulações. */
export const BONES: readonly [Joint, Joint][] = [
  ['head', 'sh'],
  ['sh', 'hip'],
  ['sh', 'el'],
  ['el', 'ha'],
  ['hip', 'kn'],
  ['kn', 'an'],
  ['an', 'toe'],
  ['sh', 'el2'],
  ['el2', 'ha2'],
  ['hip', 'kn2'],
  ['kn2', 'an2'],
  ['an2', 'toe2'],
]

/** Articulação que serve de raiz da cadeia para cada tipo de apoio. */
export const ROOT_JOINT: Record<Root, Joint> = { foot: 'an', hand: 'ha', hip: 'hip', seat: 'hip', toe: 'toe' }

export const MAX_BONE_VARIATION = 0.03
export const MAX_FIXED_DRIFT = 1

const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpPoint = (a: Point, b: Point, t: number): Point => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]

export function boneLength(pose: Pose, a: Joint, b: Joint): number | null {
  const pa = pose[a]
  const pb = pose[b]
  return pa && pb ? dist(pa, pb) : null
}

interface Tree {
  order: Joint[]
  parent: Partial<Record<Joint, Joint>>
}

/** Árvore de ossos a partir da raiz, só com as articulações presentes. */
function buildTree(root: Joint, present: ReadonlySet<Joint>): Tree {
  const order: Joint[] = [root]
  const parent: Tree['parent'] = {}
  const seen = new Set<Joint>([root])
  for (let i = 0; i < order.length; i++) {
    const j = order[i]
    for (const [a, b] of BONES) {
      const other = a === j ? b : b === j ? a : null
      if (other && present.has(other) && !seen.has(other)) {
        seen.add(other)
        parent[other] = j
        order.push(other)
      }
    }
  }
  return { order, parent }
}

const JOINTS: readonly Joint[] = ['head', 'sh', 'el', 'ha', 'hip', 'kn', 'an', 'toe', 'el2', 'ha2', 'kn2', 'an2', 'toe2']

/** Diferença angular mais curta, em radianos. */
function angleDelta(a0: number, a1: number): number {
  let d = a1 - a0
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  return d
}

/** FABRIK: ajusta `points` (o primeiro é âncora) para o último atingir `target`, mantendo `lengths`. */
function fabrik(points: Point[], lengths: number[], target: Point): Point[] {
  const p = points.map((q) => [q[0], q[1]] as Point)
  const anchor = p[0]
  const n = p.length - 1
  for (let iter = 0; iter < 64; iter++) {
    p[n] = [target[0], target[1]]
    for (let i = n - 1; i >= 0; i--) {
      const d = dist(p[i], p[i + 1]) || 1e-9
      const k = lengths[i] / d
      p[i] = [p[i + 1][0] + (p[i][0] - p[i + 1][0]) * k, p[i + 1][1] + (p[i][1] - p[i + 1][1]) * k]
    }
    p[0] = [anchor[0], anchor[1]]
    for (let i = 0; i < n; i++) {
      const d = dist(p[i], p[i + 1]) || 1e-9
      const k = lengths[i] / d
      p[i + 1] = [p[i][0] + (p[i + 1][0] - p[i][0]) * k, p[i][1] + (p[i + 1][1] - p[i][1]) * k]
    }
    if (dist(p[n], target) < 0.01) break
  }
  return p
}

/**
 * Pose entre `p0` e `p1` em `t` (0 a 1): ângulo de cada osso interpolado a partir da raiz,
 * comprimento interpolado e apoios em `fixed` mantidos no lugar.
 */
export function interpolatePose(p0: Pose, p1: Pose, t: number, root: Root, fixed: readonly Joint[]): Pose {
  const present = new Set(JOINTS.filter((j) => p0[j] && p1[j]))
  const rootJoint = ROOT_JOINT[root]
  const { order, parent } = buildTree(rootJoint, present)
  const out: Partial<Pose> = {}
  const angle: Partial<Record<Joint, number>> = {}
  const length: Partial<Record<Joint, number>> = {}

  out[rootJoint] = lerpPoint(p0[rootJoint]!, p1[rootJoint]!, t)
  for (const j of order.slice(1)) {
    const par = parent[j]!
    const a0 = Math.atan2(p0[j]![1] - p0[par]![1], p0[j]![0] - p0[par]![0])
    const a1 = Math.atan2(p1[j]![1] - p1[par]![1], p1[j]![0] - p1[par]![0])
    angle[j] = a0 + angleDelta(a0, a1) * t
    length[j] = lerp(dist(p0[j]!, p0[par]!), dist(p1[j]!, p1[par]!), t)
  }
  const place = (j: Joint) => {
    const par = out[parent[j]!]!
    out[j] = [par[0] + length[j]! * Math.cos(angle[j]!), par[1] + length[j]! * Math.sin(angle[j]!)]
  }
  for (const j of order.slice(1)) place(j)

  // Apoios adicionais: corrige o caminho raiz → apoio, do mais próximo ao mais distante.
  const depth = (j: Joint) => { let d = 0; for (let c: Joint | undefined = j; c && parent[c]; c = parent[c]) d++; return d }
  const locked = new Set<Joint>([rootJoint])
  const extra = fixed.filter((j) => j !== rootJoint && present.has(j) && order.includes(j)).sort((a, b) => depth(a) - depth(b))
  for (const f of extra) {
    const path: Joint[] = [f]
    while (!locked.has(path[0])) path.unshift(parent[path[0]]!)
    const target = lerpPoint(p0[f]!, p1[f]!, t)
    if (dist(out[f]!, target) > 0.01 && path.length > 1) {
      const solved = fabrik(path.map((j) => out[j]!), path.slice(1).map((j) => length[j]!), target)
      path.forEach((j, i) => { out[j] = solved[i] })
      // o restante da árvore acompanha as articulações corrigidas
      for (const j of order.slice(1)) {
        if (path.includes(j) || locked.has(j)) continue
        place(j)
      }
    }
    for (const j of path) locked.add(j)
  }
  return out as Pose
}

/** Pares (pose inicial, pose final) de cada trecho percorrido pela base, inclusive o retorno do ciclo. */
function segments(base: MovementBase): [Pose, Pose][] {
  const kf = base.keyframes
  const segs: [Pose, Pose][] = []
  for (let i = 0; i + 1 < kf.length; i++) segs.push([kf[i].pose, kf[i + 1].pose])
  if (base.loop === 'cycle' && kf.length > 1) segs.push([kf[kf.length - 1].pose, kf[0].pose])
  return segs
}

/** Problemas físicos da base, no formato "<key>: <problema>". Vazio = base válida (R5, data-model). */
export function validateBase(base: MovementBase): string[] {
  const problems: string[] = []
  const key = base.key
  const kf = base.keyframes
  if (kf.length < 2) return [`${key}: menos de 2 keyframes`]
  if (kf.some((k) => k.at < 0 || k.at > 1)) problems.push(`${key}: at fora de 0 a 1`)
  if (kf.some((k, i) => i > 0 && k.at <= kf[i - 1].at)) problems.push(`${key}: at não crescente`)

  const rootJoint = ROOT_JOINT[base.root]
  if (!base.fixed.includes(rootJoint)) problems.push(`${key}: apoio ${rootJoint} fora de fixed`)
  if (base.loop === 'alternate') {
    const hasArms = kf.every((k) => k.pose.el2 && k.pose.ha2)
    const hasLegs = kf.every((k) => k.pose.kn2 && k.pose.an2)
    if (!hasArms && !hasLegs) problems.push(`${key}: alternate sem membros do lado oposto`)
  }

  // comprimento dos ossos: entre keyframes e ao longo do movimento
  const samples: Pose[] = kf.map((k) => k.pose)
  for (const [a, b] of segments(base)) {
    for (let i = 1; i < 12; i++) samples.push(interpolatePose(a, b, i / 12, base.root, base.fixed))
  }
  for (const [a, b] of BONES) {
    const lengths = samples.map((p) => boneLength(p, a, b)).filter((l): l is number => l !== null)
    if (!lengths.length) continue
    const min = Math.min(...lengths)
    const max = Math.max(...lengths)
    const variation = min > 0 ? (max - min) / min : 1
    if (variation >= MAX_BONE_VARIATION) problems.push(`${key}: osso ${a}-${b} varia ${(variation * 100).toFixed(1)}%`)
  }

  // apoios fixos
  for (const j of base.fixed) {
    const ref = kf[0].pose[j]
    if (!ref) {
      problems.push(`${key}: ponto fixo ${j} ausente`)
      continue
    }
    const drift = Math.max(...samples.map((p) => (p[j] ? dist(p[j]!, ref) : 0)))
    if (drift > MAX_FIXED_DRIFT) problems.push(`${key}: ponto fixo ${j} desloca ${drift.toFixed(1)}`)
  }
  return problems
}
