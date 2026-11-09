import { describe, it, expect } from 'vitest'
import { DEMO_SPECS, MOVEMENT_BASES, resolveDemo } from '../demos'
import { validateBase } from '../engine/kinematics'
import { poseAt } from '../engine/pose-at'
import { angleAt } from '../engine/geometry'
import { FLOOR_Y, FLAT_BENCH } from '../engine/scene-geometry'
import { STRENGTH_EXERCISES } from '../strength'

const PILOT = ['pullover-halteres', 'russian-twist-halteres', 'cadeira-adutora', 'flexao-pike-corporal', 'mesa-flexora']
const samples = (id: string) => {
  const demo = resolveDemo(id)!
  return Array.from({ length: 41 }, (_, i) => poseAt(demo, i / 40))
}
const range = (xs: number[]) => Math.max(...xs) - Math.min(...xs)

describe('piloto — registro', () => {
  it.each(PILOT)('%s tem demonstração com base válida e implemento igual ao do item', (id) => {
    const spec = DEMO_SPECS[id]
    expect(spec, id).toBeDefined()
    expect(validateBase(MOVEMENT_BASES[spec.base])).toEqual([])
    expect(spec.gear).toBe(STRENGTH_EXERCISES.find((e) => e.id === id)!.gear)
  })

  it('cada item do piloto usa uma base própria (sem legenda obrigatória)', () => {
    const bases = PILOT.map((id) => DEMO_SPECS[id].base)
    expect(new Set(bases).size).toBe(PILOT.length)
  })
})

// T036: o pullover é extensão de ombro com o cotovelo quase fixo; a puxada é flexão de cotovelo.
describe('pullover-halteres', () => {
  it('deitado no banco, o halter faz um arco atrás da cabeça com o cotovelo quase fixo', () => {
    const poses = samples('pullover-halteres')
    const demo = resolveDemo('pullover-halteres')!
    expect(demo.scene).toBe('banco-reto')
    expect(Math.abs(poses[0].sh[1] - poses[0].hip[1])).toBeLessThan(8) // tronco na horizontal
    const elbow = poses.map((p) => angleAt(p.sh, p.el, p.ha))
    expect(range(elbow)).toBeLessThan(15) // cotovelo quase fixo
    const shoulder = poses.map((p) => angleAt(p.hip, p.sh, p.el))
    expect(range(shoulder)).toBeGreaterThan(90) // grande amplitude no ombro
    const end = poseAt(demo, 0.5)
    expect(end.ha[0]).toBeLessThan(end.head[0]) // no fim, o halter passa atrás da cabeça
  })

  it('difere de uma puxada: a mão não desce em direção ao ombro dobrando o cotovelo', () => {
    const poses = samples('pullover-halteres')
    expect(Math.min(...poses.map((p) => angleAt(p.sh, p.el, p.ha)))).toBeGreaterThan(140)
  })
})

// T037: sentado no solo, sem cabo, girando o tronco de um lado para o outro.
describe('russian-twist-halteres', () => {
  it('sentado no solo, sem cabo nem âncora', () => {
    const demo = resolveDemo('russian-twist-halteres')!
    expect(demo.gear).toBe('halteres')
    expect(demo.anchor).toBeUndefined()
    expect(['solo', 'colchonete']).toContain(demo.scene)
    const p = poseAt(demo, 0)
    expect(FLOOR_Y - p.hip[1]).toBeLessThan(30) // quadril perto do chão
    expect(p.kn[1]).toBeLessThan(p.an[1]) // joelhos dobrados acima dos pés
  })

  it('o halter vai de um lado ao outro do corpo, com o tronco no lugar', () => {
    const poses = samples('russian-twist-halteres')
    const xs = poses.map((p) => p.ha[0])
    expect(Math.min(...xs)).toBeLessThan(poses[0].hip[0] - 25)
    expect(Math.max(...xs)).toBeGreaterThan(poses[0].hip[0] + 25)
    expect(range(poses.map((p) => p.sh[0]))).toBeLessThan(1)
  })
})

// T038: adução é o oposto da abdução; mesa flexora é deitada.
describe('cadeira-adutora e mesa-flexora', () => {
  it('adução fecha os joelhos; a abdução registrada faz o caminho inverso', () => {
    const add = MOVEMENT_BASES[DEMO_SPECS['cadeira-adutora'].base]
    const abd = MOVEMENT_BASES['abducao-sentado']
    expect(abd).toBeDefined()
    const gap = (b: typeof add, i: number) => Math.abs(110 - b.keyframes[i].pose.kn[0])
    const last = add.keyframes.length - 1
    expect(gap(add, last)).toBeLessThan(gap(add, 0) - 20) // fecha
    expect(abd.keyframes[0].pose).toEqual(add.keyframes[last].pose)
    expect(abd.keyframes[last].pose).toEqual(add.keyframes[0].pose)
  })

  it('cadeira adutora: vista de frente, simétrica, sentado, com a almofada no joelho', () => {
    const demo = resolveDemo('cadeira-adutora')!
    expect(demo.view).toBe('front')
    expect(demo.mirror).toBe(true)
    expect(demo.implementAt).toBe('kn')
  })

  it('mesa flexora: deitado de bruços no banco, só o joelho dobra', () => {
    const demo = resolveDemo('mesa-flexora')!
    expect(demo.view).toBe('side')
    const poses = samples('mesa-flexora')
    for (const p of poses) {
      expect(Math.abs(p.sh[1] - p.hip[1])).toBeLessThan(8)
      expect(p.hip[1]).toBeLessThanOrEqual(FLAT_BENCH.top)
    }
    const knee = poses.map((p) => angleAt(p.hip, p.kn, p.an))
    expect(range(knee)).toBeGreaterThan(70)
    expect(range(poses.map((p) => p.hip[1]))).toBeLessThan(1) // quadril não sai da mesa
    expect(demo.implementAt).toBe('an') // rolo acima dos calcanhares
  })
})

// T039: apoio de mãos e pés fixos, quadril alto.
describe('flexao-pike-corporal', () => {
  it('mãos e pés não saem do lugar e o quadril fica acima dos ombros', () => {
    const demo = resolveDemo('flexao-pike-corporal')!
    expect(demo.fixed).toEqual(expect.arrayContaining(['ha', 'an', 'toe']))
    const poses = samples('flexao-pike-corporal')
    expect(range(poses.map((p) => p.ha[0]))).toBeLessThanOrEqual(1)
    expect(range(poses.map((p) => p.an[0]))).toBeLessThanOrEqual(1)
    for (const p of poses) expect(p.hip[1]).toBeLessThan(p.sh[1])
  })

  it('na descida, a cabeça vai em direção ao chão entre as mãos', () => {
    const demo = resolveDemo('flexao-pike-corporal')!
    const top = poseAt(demo, 0)
    const bottom = poseAt(demo, 0.5)
    expect(bottom.head[1]).toBeGreaterThan(top.head[1] + 15)
    expect(angleAt(bottom.sh, bottom.el, bottom.ha)).toBeLessThan(angleAt(top.sh, top.el, top.ha) - 40)
  })
})
