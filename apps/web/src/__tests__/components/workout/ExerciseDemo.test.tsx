import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { MOTION_CATALOG } from '@helux/types'
import { ExerciseDemo } from '@/components/workout/ExerciseDemo'

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

describe('ExerciseDemo', () => {
  it('renders the start pose for press-flat (side view) when not playing', () => {
    const { container } = render(<ExerciseDemo motion="press-flat" implement="barbell" playing={false} />)
    // start.h for press-flat is [104, 106] — with playing=false the animation
    // loop never starts, so phase stays at 0 (the start pose).
    expect(container.querySelector('line[x2="104"][y2="106"]')).toBeInTheDocument()
    expect(container.querySelector('svg[aria-label="demonstração do movimento"]')).toBeInTheDocument()
  })

  it('renders the start pose for press-overhead (front view) when not playing', () => {
    const { container } = render(<ExerciseDemo motion="press-overhead" implement="barbell" playing={false} />)
    // start.h for press-overhead is [176, 58]
    expect(container.querySelector('line[x2="176"][y2="58"]')).toBeInTheDocument()
  })

  it('falls back to press-flat for an unknown motion key', () => {
    const { container } = render(<ExerciseDemo motion="not-a-real-motion" playing={false} />)
    expect(container.querySelector('line[x2="104"][y2="106"]')).toBeInTheDocument()
  })

  it('renders 2 dumbbell end-caps per hand (4 total) in front view with implement="dumbbell"', () => {
    const { container } = render(<ExerciseDemo motion="press-overhead" implement="dumbbell" playing={false} />)
    expect(container.querySelectorAll('circle[r="3.4"]')).toHaveLength(4)
  })

  it('renders a single bar with 2 end-caps in front view with the default barbell implement', () => {
    const { container } = render(<ExerciseDemo motion="press-overhead" implement="barbell" playing={false} />)
    expect(container.querySelectorAll('circle[r="4"]')).toHaveLength(2)
  })

  it('starts the animation loop when playing is true', () => {
    render(<ExerciseDemo motion="press-flat" playing={true} />)
    expect(requestAnimationFrame).toHaveBeenCalled()
  })

  it('does not start the animation loop when playing is false', () => {
    render(<ExerciseDemo motion="press-flat" playing={false} />)
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })

  // spec 012 T051 (FR-008): em movimento reduzido a demonstração fica parada no meio do movimento
  it('stays still at mid-movement under prefers-reduced-motion, without starting the loop', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const { container } = render(<ExerciseDemo motion="press-flat" playing={true} />)
    expect(requestAnimationFrame).not.toHaveBeenCalled()
    // press-flat: h vai de [104,106] a [104,78]; o meio é [104,92]
    expect(container.querySelector('line[x2="104"][y2="92"]')).toBeInTheDocument()
    vi.unstubAllGlobals()
  })

  // spec 012 T051: o acento fica só no implemento (a amplitude usa tom neutro)
  it('uses the accent only on the implement', () => {
    const { container } = render(<ExerciseDemo motion="press-overhead" implement="barbell" playing={false} />)
    const accentish = [...container.querySelectorAll('*')].filter(el =>
      [el.getAttribute('stroke'), el.getAttribute('fill')].some(v => v?.startsWith('var(--accent')),
    )
    expect(accentish.length).toBeGreaterThan(0)
    accentish.forEach(el => {
      expect(el.getAttribute('stroke') ?? el.getAttribute('fill')).toBe('var(--accent)')
      expect(el.closest('[data-part="implement"]')).not.toBeNull()
    })
  })

  // ---- spec 013: animações por padrão de movimento ----
  it.each(Object.keys(MOTION_CATALOG))('tem preset próprio para "%s" (sem cair no genérico)', (key) => {
    const { container } = render(<ExerciseDemo motion={key} implement="barbell" playing={false} />)
    expect(container.querySelector('svg')?.getAttribute('data-motion')).toBe(key)
  })

  it('chave desconhecida cai no preset genérico (press-flat)', () => {
    const { container } = render(<ExerciseDemo motion="chave-antiga" playing={false} />)
    expect(container.querySelector('svg')?.getAttribute('data-motion')).toBe('press-flat')
  })

  it('preset de corpo inteiro desenha as pernas (quadril, joelho e tornozelo)', () => {
    const { container } = render(<ExerciseDemo motion="squat" implement="barbell" playing={false} />)
    expect(container.querySelector('[data-part="legs"]')).not.toBeNull()
    expect(container.querySelectorAll('[data-part="legs"] line').length).toBeGreaterThanOrEqual(2)
  })

  it('preset de corpo inteiro fica parado no meio do movimento em movimento reduzido', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const start = render(<ExerciseDemo motion="squat" implement="barbell" playing={false} />)
    const startKnee = start.container.querySelector('[data-joint="kn"]')?.getAttribute('cx')
    start.unmount()
    const { container } = render(<ExerciseDemo motion="squat" implement="barbell" playing={true} />)
    expect(requestAnimationFrame).not.toHaveBeenCalled()
    const midKnee = container.querySelector('[data-joint="kn"]')?.getAttribute('cx')
    expect(midKnee).toBeDefined()
    expect(midKnee).not.toBe(startKnee)
    vi.unstubAllGlobals()
  })

  it.each(['squat', 'hinge', 'row', 'hip-thrust', 'leg-press', 'shrug'])(
    'em "%s" o acento fica só no implemento',
    (motion) => {
      const { container } = render(<ExerciseDemo motion={motion} implement="barbell" playing={false} />)
      const accentish = [...container.querySelectorAll('*')].filter(el =>
        [el.getAttribute('stroke'), el.getAttribute('fill')].some(v => v?.startsWith('var(--accent')),
      )
      expect(accentish.length).toBeGreaterThan(0)
      accentish.forEach(el => expect(el.closest('[data-part="implement"]')).not.toBeNull())
    },
  )

  it('peso corporal não desenha implemento', () => {
    for (const motion of ['push-up', 'plank', 'pull-vertical']) {
      const { container, unmount } = render(<ExerciseDemo motion={motion} implement="bodyweight" playing={false} />)
      expect(container.querySelector('[data-part="implement"] *')).toBeNull()
      unmount()
    }
  })

  it('polia desenha o cabo tracejado até o implemento', () => {
    const { container } = render(<ExerciseDemo motion="row" implement="cable" playing={false} />)
    expect(container.querySelector('[data-part="implement"] line[stroke-dasharray]')).not.toBeNull()
  })
})

// ---- spec 028: caminho novo, a partir da demonstração resolvida do catálogo ----
import { act } from '@testing-library/react'
import { poseAt, type Pose, type ResolvedDemo } from '@helux/exercises'

const STAND: Pose = { head: [110, 50], sh: [110, 70], el: [110, 100], ha: [110, 128], hip: [110, 130], kn: [110, 170], an: [110, 210], toe: [128, 210] }
const DOWN: Pose = { head: [96, 92], sh: [100, 111], el: [128, 101], ha: [156, 101], hip: [80, 165], kn: [130, 176], an: [110, 210], toe: [128, 210] }
const both = (p: Pose): Pose => ({ ...p, el2: p.el, ha2: p.ha, kn2: p.kn, an2: p.an, toe2: p.toe })

const demoOf = (over: Partial<ResolvedDemo> = {}): ResolvedDemo => ({
  id: 'teste', view: 'side', mirror: false, loop: 'reps', durationMs: 2000, root: 'foot', fixed: ['an', 'toe'],
  keyframes: [{ at: 0, pose: STAND }, { at: 1, pose: DOWN }],
  gear: 'halteres', scene: 'solo', implementAt: 'ha', ...over,
})

const jointAt = (container: HTMLElement, joint: string) => {
  const el = container.querySelector(`[data-joint="${joint}"]`)
  return [Number(el?.getAttribute('cx')), Number(el?.getAttribute('cy'))]
}
const near = (a: number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.6

describe('ExerciseDemo — demonstração do catálogo (028)', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('usa o rótulo como aria-label e mantém o viewBox 220 × 250', () => {
    const { container } = render(<ExerciseDemo demo={demoOf()} playing={false} label="demonstração de Agachamento" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-label')).toBe('demonstração de Agachamento')
    expect(svg.getAttribute('viewBox')).toBe('0 0 220 250')
    expect(svg.getAttribute('data-demo')).toBe('teste')
  })

  it('parado, mostra a pose inicial', () => {
    const { container } = render(<ExerciseDemo demo={demoOf()} playing={false} label="x" />)
    expect(near(jointAt(container, 'kn'), STAND.kn)).toBe(true)
  })

  it('phase fixa o quadro e não inicia a animação, mesmo com playing', () => {
    const demo = demoOf()
    const { container } = render(<ExerciseDemo demo={demo} playing={true} phase={0.5} label="x" />)
    expect(requestAnimationFrame).not.toHaveBeenCalled()
    expect(near(jointAt(container, 'kn'), DOWN.kn)).toBe(true)
    expect(near(jointAt(container, 'hip'), poseAt(demo, 0.5).hip)).toBe(true)
  })

  it('playing inicia o loop; sem playing, não', () => {
    const { unmount } = render(<ExerciseDemo demo={demoOf()} playing={false} label="x" />)
    expect(requestAnimationFrame).not.toHaveBeenCalled()
    unmount()
    render(<ExerciseDemo demo={demoOf()} playing={true} label="x" />)
    expect(requestAnimationFrame).toHaveBeenCalled()
  })

  it('nonce reinicia a animação', () => {
    const { rerender } = render(<ExerciseDemo demo={demoOf()} playing={true} nonce={1} label="x" />)
    const calls = vi.mocked(requestAnimationFrame).mock.calls.length
    rerender(<ExerciseDemo demo={demoOf()} playing={true} nonce={2} label="x" />)
    expect(vi.mocked(requestAnimationFrame).mock.calls.length).toBeGreaterThan(calls)
  })

  it('em movimento reduzido fica na pose central, sem iniciar o loop', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    const demo = demoOf()
    const { container } = render(<ExerciseDemo demo={demo} playing={true} label="x" />)
    expect(requestAnimationFrame).not.toHaveBeenCalled()
    expect(near(jointAt(container, 'kn'), poseAt(demo, 0.25).kn)).toBe(true)
  })

  /** Captura o callback do rAF e o executa no instante `t` (ms desde o início). */
  function driveTo(t: number) {
    const cb = vi.mocked(requestAnimationFrame).mock.calls.at(-1)![0]
    act(() => { cb(t) })
  }

  it('hold: chega à posição e para, sem repetir', () => {
    let now = 0
    vi.stubGlobal('performance', { now: () => now })
    const demo = demoOf({ loop: 'hold' })
    const { container } = render(<ExerciseDemo demo={demo} playing={true} label="x" />)
    now = 0
    driveTo(demo.durationMs * 1.5)
    expect(near(jointAt(container, 'kn'), DOWN.kn)).toBe(true)
    const calls = vi.mocked(requestAnimationFrame).mock.calls.length
    driveTo(demo.durationMs * 3)
    expect(near(jointAt(container, 'kn'), DOWN.kn)).toBe(true)
    expect(vi.mocked(requestAnimationFrame).mock.calls.length).toBe(calls)
  })

  it('cycle: contínuo, a fase volta ao início depois de um ciclo', () => {
    vi.stubGlobal('performance', { now: () => 0 })
    const demo = demoOf({ loop: 'cycle', keyframes: [{ at: 0, pose: STAND }, { at: 0.5, pose: DOWN }] })
    const { container } = render(<ExerciseDemo demo={demo} playing={true} label="x" />)
    driveTo(demo.durationMs * 1.25)
    expect(near(jointAt(container, 'hip'), poseAt(demo, 0.25).hip)).toBe(true)
  })

  it('alternate: um lado por vez', () => {
    const demo = demoOf({ loop: 'alternate', keyframes: [{ at: 0, pose: both(STAND) }, { at: 1, pose: { ...both(STAND), el: DOWN.el, ha: DOWN.ha } }] })
    const first = render(<ExerciseDemo demo={demo} playing={false} phase={0.25} label="x" />)
    expect(near(jointAt(first.container, 'ha2'), STAND.ha)).toBe(true)
    expect(near(jointAt(first.container, 'ha'), STAND.ha)).toBe(false)
    first.unmount()
    const second = render(<ExerciseDemo demo={demo} playing={false} phase={0.75} label="x" />)
    expect(near(jointAt(second.container, 'ha'), STAND.ha)).toBe(true)
    expect(near(jointAt(second.container, 'ha2'), STAND.ha)).toBe(false)
  })

  it('caption aparece como texto real abaixo da demonstração', () => {
    const { getByText, container } = render(<ExerciseDemo demo={demoOf({ caption: 'Pegada fechada' })} playing={false} label="x" />)
    const caption = getByText('Pegada fechada')
    expect(caption.tagName).toBe('FIGCAPTION')
    expect(container.querySelector('svg')!.compareDocumentPosition(caption) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('o acento fica só no implemento', () => {
    const { container } = render(<ExerciseDemo demo={demoOf()} playing={false} label="x" />)
    const accentish = [...container.querySelectorAll('*')].filter(el =>
      [el.getAttribute('stroke'), el.getAttribute('fill')].some(v => v?.startsWith('var(--accent')),
    )
    expect(accentish.length).toBeGreaterThan(0)
    accentish.forEach(el => expect(el.closest('[data-part="implement"]')).not.toBeNull())
  })
})

describe('ExerciseDemo — cenas e implementos (028)', () => {
  it.each(['solo', 'banco-reto', 'banco-inclinado', 'banco-baixo', 'assento', 'assento-reclinado', 'maquina', 'barra-fixa', 'paralelas', 'parede', 'degrau', 'colchonete', 'banco-romano', 'banco-declinado', 'banco-scott', 'bicicleta', 'remo'] as const)(
    'desenha a cena %s',
    (scene) => {
      const { container } = render(<ExerciseDemo demo={demoOf({ scene })} playing={false} label="x" />)
      expect(container.querySelector(`[data-scene="${scene}"]`)).not.toBeNull()
    },
  )

  it.each(['barra', 'halteres', 'kettlebell', 'maquina', 'smith', 'cabo', 'corda', 'elastico', 'roda', 'remo'] as const)(
    'implemento com carga %s é desenhado, com acento só nele',
    (gear) => {
      const { container } = render(<ExerciseDemo demo={demoOf({ gear })} playing={false} label="x" />)
      expect(container.querySelector('[data-part="implement"] *')).not.toBeNull()
      const accentish = [...container.querySelectorAll('*')].filter(el =>
        [el.getAttribute('stroke'), el.getAttribute('fill')].some(v => v?.startsWith('var(--accent')),
      )
      accentish.forEach(el => expect(el.closest('[data-part="implement"]')).not.toBeNull())
    },
  )

  it('elástico sem ponto de fixação fica só nas mãos, sem linha até a polia', () => {
    const { container } = render(<ExerciseDemo demo={demoOf({ gear: 'elastico' })} playing={false} label="x" />)
    expect(container.querySelector('[data-part="implement"] line')).toBeNull()
    expect(container.querySelector('[data-part="implement"] circle')).not.toBeNull()
  })

  it('bastão fica encostado nas costas, do quadril até acima da cabeça', () => {
    const { container } = render(<ExerciseDemo demo={demoOf({ gear: 'bastao' })} playing={false} label="x" />)
    expect(container.querySelector('[data-part="implement"] line[data-dowel]')).not.toBeNull()
  })

  it('barra com ponto de apoio (landmine) desenha a barra do apoio até as mãos', () => {
    const { container } = render(<ExerciseDemo demo={demoOf({ gear: 'barra', anchor: [204, 238] })} playing={false} label="x" />)
    const line = container.querySelector('[data-part="implement"] line[data-landmine]')
    expect(line).not.toBeNull()
    expect(line).toHaveAttribute('x1', '204')
    expect(line).toHaveAttribute('y1', '238')
  })

  it('barra sem ponto de apoio não desenha a barra do landmine', () => {
    const { container } = render(<ExerciseDemo demo={demoOf({ gear: 'barra' })} playing={false} label="x" />)
    expect(container.querySelector('[data-landmine]')).toBeNull()
  })

  it.each(['peso-corporal', 'banco', 'barra-fixa', 'bicicleta', 'nenhum'] as const)('gear sem carga (%s) não desenha implemento', (gear) => {
    const { container } = render(<ExerciseDemo demo={demoOf({ gear })} playing={false} label="x" />)
    expect(container.querySelector('[data-part="implement"] *')).toBeNull()
  })

  it('cabo sai da âncora definida na demonstração', () => {
    const { container } = render(<ExerciseDemo demo={demoOf({ gear: 'cabo', anchor: [12, 30] })} playing={false} label="x" />)
    const cable = container.querySelector('[data-part="implement"] line[stroke-dasharray]')!
    expect([cable.getAttribute('x1'), cable.getAttribute('y1')]).toEqual(['12', '30'])
  })

  it('halteres com o braço oposto desenhado aparecem nas duas mãos', () => {
    const { container } = render(<ExerciseDemo demo={demoOf({ keyframes: [{ at: 0, pose: both(STAND) }, { at: 1, pose: both(DOWN) }] })} playing={false} label="x" />)
    expect(container.querySelectorAll('[data-part="implement"] circle[r="3.4"]')).toHaveLength(4)
  })

  it('vista espelhada com barra liga as duas mãos', () => {
    const { container } = render(<ExerciseDemo demo={demoOf({ gear: 'barra', mirror: true, view: 'front' })} playing={false} label="x" />)
    expect(container.querySelectorAll('[data-part="implement"] circle[r="4"]')).toHaveLength(2)
  })
})
