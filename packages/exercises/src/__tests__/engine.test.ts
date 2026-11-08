import { describe, it, expect } from 'vitest'
import { poseAt, centralPhase } from '../engine/pose-at'
import { validateBase, BONES, boneLength } from '../engine/kinematics'
import type { MovementBase, Point, Pose, ResolvedDemo } from '../engine/types'

/** Ponto a `len` de `p`, no ângulo `deg` (0° = direita, 90° = para baixo, como no SVG). */
const polar = (p: Point, len: number, deg: number): Point => {
  const r = (deg * Math.PI) / 180
  return [p[0] + len * Math.cos(r), p[1] + len * Math.sin(r)]
}
const dist = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1])

/** Agachamento: tornozelo fixo, ossos com comprimento exato. */
function squatPose(shinDeg: number, thighDeg: number, torsoDeg: number, armDeg: number): Pose {
  const an: Point = [110, 230]
  const toe: Point = polar(an, 18, 0)
  const kn = polar(an, 40, shinDeg)
  const hip = polar(kn, 40, thighDeg)
  const sh = polar(hip, 60, torsoDeg)
  const head = polar(sh, 20, torsoDeg)
  const el = polar(sh, 30, armDeg)
  const ha = polar(el, 28, armDeg)
  return { head, sh, el, ha, hip, kn, an, toe }
}

const squat: MovementBase = {
  key: 'agachar-teste', view: 'side', loop: 'reps', durationMs: 2400, root: 'foot', fixed: ['an', 'toe'],
  keyframes: [
    { at: 0, pose: squatPose(-90, -90, -90, 90) },
    { at: 1, pose: squatPose(-55, -160, -60, 0) },
  ],
}

/** Cotovelo/joelho: interseção dos círculos (a, la) e (b, lb), do lado de x maior. */
function twoBone(a: Point, la: number, b: Point, lb: number): Point {
  const d = dist(a, b)
  const x = (d * d + la * la - lb * lb) / (2 * d)
  const h = Math.sqrt(Math.max(0, la * la - x * x))
  const ux = (b[0] - a[0]) / d
  const uy = (b[1] - a[1]) / d
  const c1: Point = [a[0] + ux * x - uy * h, a[1] + uy * x + ux * h]
  const c2: Point = [a[0] + ux * x + uy * h, a[1] + uy * x - ux * h]
  return c1[0] > c2[0] ? c1 : c2
}

const PUSHUP_HAND: Point = [68.44, 237.12]
const PUSHUP_ANKLE: Point = [200, 228]

/** Flexão de braço: mãos e pés fixos (cadeia fechada); corpo reto em ângulo `alphaDeg` com o solo. */
function pushupPose(alphaDeg: number): Pose {
  const an = PUSHUP_ANKLE
  const r = (alphaDeg * Math.PI) / 180
  const along = (len: number): Point => [an[0] - len * Math.cos(r), an[1] - len * Math.sin(r)]
  const kn = along(40)
  const hip = along(80)
  const sh = along(140)
  const head = along(160)
  const ha = PUSHUP_HAND
  const el = twoBone(sh, 30, ha, 28)
  return { head, sh, el, ha, hip, kn, an, toe: [an[0], an[1] + 12] }
}

describe('validateBase — regras físicas', () => {
  it('aceita uma base coerente', () => {
    expect(validateBase(squat)).toEqual([])
  })

  it('exige ao menos 2 keyframes', () => {
    expect(validateBase({ ...squat, keyframes: [squat.keyframes[0]] })).toContain('agachar-teste: menos de 2 keyframes')
  })

  it('exige at crescente entre 0 e 1', () => {
    const k = squat.keyframes
    expect(validateBase({ ...squat, keyframes: [{ ...k[0], at: 0.6 }, { ...k[1], at: 0.4 }] })).toContain('agachar-teste: at não crescente')
    expect(validateBase({ ...squat, keyframes: [k[0], { ...k[1], at: 1.2 }] })).toContain('agachar-teste: at fora de 0 a 1')
  })

  it('recusa osso que muda mais de 3% de comprimento entre keyframes', () => {
    const shrunk = squatPose(-55, -160, -60, 0)
    shrunk.ha = polar(shrunk.el, 24, 0) // antebraço 28 → 24 (−14%)
    const problems = validateBase({ ...squat, keyframes: [squat.keyframes[0], { at: 1, pose: shrunk }] })
    expect(problems.some((p) => p.startsWith('agachar-teste: osso el-ha varia'))).toBe(true)
  })

  it('recusa ponto fixo que se desloca mais de 1 unidade', () => {
    const slid = squatPose(-55, -160, -60, 0)
    const moved = { ...slid, toe: [slid.toe[0] + 3, slid.toe[1]] as Point }
    const problems = validateBase({ ...squat, keyframes: [squat.keyframes[0], { at: 1, pose: moved }] })
    expect(problems.some((p) => p.startsWith('agachar-teste: ponto fixo toe desloca'))).toBe(true)
  })

  it('exige o ponto de apoio presente entre os fixos', () => {
    expect(validateBase({ ...squat, fixed: ['toe'] })).toContain('agachar-teste: apoio an fora de fixed')
  })

  it('alternate exige os membros do lado oposto', () => {
    expect(validateBase({ ...squat, loop: 'alternate' })).toContain('agachar-teste: alternate sem membros do lado oposto')
  })
})

const demoOf = (base: MovementBase): ResolvedDemo => ({
  id: base.key, view: base.view, mirror: false, loop: base.loop, durationMs: base.durationMs, root: base.root,
  fixed: base.fixed, keyframes: base.keyframes, gear: 'halteres', scene: 'solo', implementAt: 'ha',
})

describe('poseAt — interpolação por ângulo', () => {
  const demo = demoOf(squat)

  it('nas extremidades reproduz os keyframes', () => {
    const start = poseAt(demo, 0)
    const end = poseAt(demo, 0.5)
    for (const j of ['hip', 'kn', 'sh', 'ha'] as const) {
      expect(dist(start[j], squat.keyframes[0].pose[j])).toBeLessThan(0.01)
      expect(dist(end[j], squat.keyframes[1].pose[j])).toBeLessThan(0.01)
    }
  })

  it('mantém o comprimento dos ossos no meio do movimento (abaixo de 3%)', () => {
    for (let i = 0; i <= 40; i++) {
      const pose = poseAt(demo, i / 40)
      for (const [a, b] of BONES) {
        if (!pose[a] || !pose[b]) continue
        const ref = boneLength(squat.keyframes[0].pose, a, b)!
        expect(Math.abs(boneLength(pose, a, b)! - ref) / ref, `${a}-${b} em ${i / 40}`).toBeLessThan(0.03)
      }
    }
  })

  it('mantém o apoio fixo', () => {
    for (let i = 0; i <= 40; i++) {
      const pose = poseAt(demo, i / 40)
      expect(dist(pose.an, [110, 230])).toBeLessThanOrEqual(1)
      expect(dist(pose.toe, squat.keyframes[0].pose.toe)).toBeLessThanOrEqual(1)
    }
  })

  it('cadeia fechada: mãos e pés ficam fixos e os ossos mantêm o comprimento', () => {
    const pushup: MovementBase = {
      key: 'flexao-teste', view: 'side', loop: 'reps', durationMs: 2400, root: 'hand', fixed: ['ha', 'an', 'toe'],
      keyframes: [{ at: 0, pose: pushupPose(20) }, { at: 1, pose: pushupPose(8) }],
    }
    expect(validateBase(pushup)).toEqual([])
    const d = demoOf(pushup)
    for (let i = 0; i <= 40; i++) {
      const pose = poseAt(d, i / 40)
      expect(dist(pose.ha, PUSHUP_HAND), `ha em ${i / 40}`).toBeLessThanOrEqual(1)
      expect(dist(pose.an, PUSHUP_ANKLE), `an em ${i / 40}`).toBeLessThanOrEqual(1)
      const ref = boneLength(pushup.keyframes[0].pose, 'el', 'sh')!
      expect(Math.abs(boneLength(pose, 'el', 'sh')! - ref) / ref).toBeLessThan(0.03)
    }
  })
})

describe('poseAt — modos de repetição', () => {
  const k0 = squat.keyframes[0].pose
  const k1 = squat.keyframes[1].pose

  it('reps: vai até o fim na metade do ciclo e volta ao início', () => {
    const d = demoOf(squat)
    expect(dist(poseAt(d, 0.5).hip, k1.hip)).toBeLessThan(0.01)
    expect(dist(poseAt(d, 1).hip, k0.hip)).toBeLessThan(0.01)
    expect(dist(poseAt(d, 0.25).hip, poseAt(d, 0.75).hip)).toBeLessThan(0.01)
  })

  it('hold: chega à posição e permanece nela, sem voltar', () => {
    const d = demoOf({ ...squat, loop: 'hold' })
    expect(dist(poseAt(d, 0.5).hip, k1.hip)).toBeLessThan(0.01)
    expect(dist(poseAt(d, 0.99).hip, k1.hip)).toBeLessThan(0.01)
  })

  it('alternate: um lado por vez', () => {
    const withOpposite = (p: Pose): Pose => ({ ...p, el2: p.el, ha2: p.ha, kn2: p.kn, an2: p.an, toe2: p.toe })
    const base: MovementBase = {
      ...squat, loop: 'alternate',
      keyframes: [
        { at: 0, pose: withOpposite(squatPose(-90, -90, -90, 90)) },
        { at: 1, pose: { ...withOpposite(squatPose(-90, -90, -90, 90)), el: polar(squatPose(-90, -90, -90, 90).sh, 30, 0), ha: polar(polar(squatPose(-90, -90, -90, 90).sh, 30, 0), 28, 0) } },
      ],
    }
    expect(validateBase(base)).toEqual([])
    const d = demoOf(base)
    const first = poseAt(d, 0.25) // primeiro lado no meio da repetição
    const second = poseAt(d, 0.75) // segundo lado no meio da repetição
    expect(dist(first.ha, first.ha2!)).toBeGreaterThan(5) // só um braço se move
    expect(dist(second.ha, second.ha2!)).toBeGreaterThan(5)
    expect(dist(first.ha2!, k0.ha)).toBeLessThan(0.01) // no 1º lado, o braço oposto fica parado
    expect(dist(second.ha, k0.ha)).toBeLessThan(0.01) // no 2º lado, o braço principal fica parado
  })

  it('cycle: contínuo, o fim do ciclo emenda no início', () => {
    const mid = squatPose(-70, -130, -75, 45)
    const d = demoOf({ ...squat, loop: 'cycle', keyframes: [{ at: 0, pose: k0 }, { at: 0.5, pose: k1 }, { at: 0.75, pose: mid }] })
    expect(dist(poseAt(d, 0).hip, poseAt(d, 1).hip)).toBeLessThan(0.01)
    expect(dist(poseAt(d, 0.5).hip, k1.hip)).toBeLessThan(0.01)
    // entre 0,75 e 1 volta do keyframe "mid" para o inicial
    const p = poseAt(d, 0.875).hip
    expect(dist(p, k0.hip)).toBeGreaterThan(0.5)
    expect(dist(p, mid.hip)).toBeGreaterThan(0.5)
  })

  it('pose central para movimento reduzido: meio do trajeto', () => {
    const d = demoOf(squat)
    expect(centralPhase(d)).toBe(0.25)
    expect(centralPhase(demoOf({ ...squat, loop: 'hold' }))).toBe(1)
  })
})
