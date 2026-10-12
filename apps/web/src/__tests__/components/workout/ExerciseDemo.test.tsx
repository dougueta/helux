import { describe, it, expect, vi, beforeEach } from 'vitest'
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
