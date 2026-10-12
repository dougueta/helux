import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
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
})
