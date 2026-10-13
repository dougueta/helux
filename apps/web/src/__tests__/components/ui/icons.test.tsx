import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Icon, HelixMark, ICONS } from '@/components/ui/icons'

// Paths do objeto IC de design_handoff_helux_v2/v2/v2-core.jsx.
const V2 = {
  close: 'M6 6l12 12M18 6L6 18',
  timer: 'M12 8.5v4.5l2.5 1.5M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9.5 2.5h5',
  play: 'M8 5.5v13l10.5-6.5z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  chev: 'M9.5 6l6 6-6 6',
  swap: 'M7 4v14M3.5 14.5L7 18l3.5-3.5M17 20V6M13.5 9.5L17 6l3.5 3.5',
  sync: 'M20 11a8 8 0 0 0-14.3-4.5L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0 0 14.3 4.5l1.7-2M20 20v-4.5h-4.5',
  up: 'M12 19V5M6 11l6-6 6 6',
  cloud: 'M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.6A3.8 3.8 0 0 1 17.5 18.5z',
}

describe('Icon (v2)', () => {
  it('usa os paths do IC da v2', () => {
    for (const [name, d] of Object.entries(V2)) {
      expect(ICONS[name as keyof typeof ICONS], name).toBe(d)
    }
  })

  it('tem todos os ícones do IC', () => {
    for (const name of ['close', 'timer', 'play', 'pause', 'repeat', 'check', 'plus', 'minus', 'chev', 'back', 'swap', 'flame', 'user', 'home', 'dumbbell', 'checkin', 'chart', 'dna', 'sync', 'alert', 'trophy', 'up', 'heart', 'moon', 'wave', 'bolt', 'cloud']) {
      expect(ICONS, name).toHaveProperty(name)
    }
  })

  it('mantém os nomes usados hoje como sinônimos (chevron, arrowUp)', () => {
    expect(ICONS.chevron).toBe(ICONS.chev)
    expect(ICONS.arrowUp).toBe(ICONS.up)
  })

  it('traço 1.9, pontas redondas, sem preenchimento e aria-hidden', () => {
    const { container } = render(<Icon name="check" />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('stroke-width', '1.9')
    expect(svg).toHaveAttribute('stroke-linecap', 'round')
    expect(svg).toHaveAttribute('fill', 'none')
    expect(svg).toHaveAttribute('stroke', 'currentColor')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('path')).toHaveAttribute('d', ICONS.check)
  })

  it('play preenchido só com filled', () => {
    const { container, rerender } = render(<Icon name="play" />)
    expect(container.querySelector('svg')).toHaveAttribute('fill', 'none')
    rerender(<Icon name="play" filled />)
    expect(container.querySelector('svg')).toHaveAttribute('fill', 'currentColor')
  })

  it('aplica tamanho, traço e estilo', () => {
    const { container } = render(<Icon name="dna" size={30} sw={2.6} style={{ transform: 'rotate(180deg)' }} />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('width', '30')
    expect(svg).toHaveAttribute('stroke-width', '2.6')
    expect(svg).toHaveStyle({ transform: 'rotate(180deg)' })
  })
})

describe('HelixMark (v2)', () => {
  it('7 traços, os 4 primeiros em acento, aria-hidden', () => {
    const { container } = render(<HelixMark />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(7)
    rects.forEach((r, i) => {
      expect(r).toHaveAttribute('fill', i < 4 ? 'var(--accent)' : 'var(--text-dim)')
    })
  })

  it('altura dos traços segue |cos|', () => {
    const { container } = render(<HelixMark />)
    const h = [...container.querySelectorAll('rect')].map(r => Number(r.getAttribute('height')))
    expect(h[0]).toBeCloseTo(19)
    expect(h[0]).toBeGreaterThan(h[1])
  })
})
