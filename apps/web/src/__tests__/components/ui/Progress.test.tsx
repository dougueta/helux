import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WorkoutProgress } from '@/components/ui/WorkoutProgress'
import { CycleProgress } from '@/components/ui/CycleProgress'
import { Ring } from '@/components/ui/Ring'

describe('WorkoutProgress', () => {
  it('progressbar com total de séries feitas sobre o total', () => {
    render(<WorkoutProgress groups={[4, 3, 3]} done={[4, 1, 0]} current={1} onPick={() => {}} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '5')
    expect(bar).toHaveAttribute('aria-valuemax', '10')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
  })

  it('um botão por grupo, com rótulo e traços acesos', () => {
    const { container } = render(<WorkoutProgress groups={[4, 3, 3]} done={[4, 1, 0]} current={1} onPick={() => {}} />)
    const g2 = screen.getByRole('button', { name: 'Exercício 2, 1 de 3 séries' })
    expect(g2).toHaveClass('hx-prog-g', 'is-cur')
    expect(screen.getByRole('button', { name: 'Exercício 1, 4 de 4 séries' })).not.toHaveClass('is-cur')
    expect(g2.querySelectorAll('i')).toHaveLength(3)
    expect(g2.querySelectorAll('i.on')).toHaveLength(1)
    expect(container.querySelectorAll('.hx-prog-g')).toHaveLength(3)
  })

  it('tocar num grupo navega ao exercício', () => {
    const onPick = vi.fn()
    render(<WorkoutProgress groups={[2, 2]} done={[0, 0]} current={0} onPick={onPick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Exercício 2, 0 de 2 séries' }))
    expect(onPick).toHaveBeenCalledWith(1)
  })
})

describe('CycleProgress', () => {
  it('rótulo ", hoje" no atual e estado por texto', () => {
    const { container } = render(
      <CycleProgress sessions={[
        { label: 'A', state: 'done' },
        { label: 'B', state: 'todo' },
        { label: 'C', state: 'current' },
      ]} />,
    )
    const items = container.querySelectorAll('.hx-cycle-s')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveClass('on')
    expect(items[2]).toHaveClass('cur')
    expect(items[2]).toHaveTextContent('C, hoje')
    expect(items[0]).toHaveTextContent(/concluído/)
    expect(screen.getByRole('list', { name: 'ciclo atual' })).toBeInTheDocument()
  })
})

describe('Ring', () => {
  it('dashoffset proporcional ao valor 0–1 e filhos', () => {
    const { container } = render(<Ring size={48} stroke={3} value={0.25}><span>t</span></Ring>)
    const c = 2 * Math.PI * ((48 - 3) / 2)
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(2)
    expect(Number(circles[1].getAttribute('stroke-dashoffset'))).toBeCloseTo(c * 0.75)
    expect(circles[0]).toHaveAttribute('stroke', 'var(--rung-off)')
    expect(circles[1]).toHaveAttribute('stroke', 'var(--accent)')
    expect(container.querySelector('.hx-ring')).toHaveTextContent('t')
  })

  it('limita o valor entre 0 e 1', () => {
    const { container } = render(<Ring size={40} stroke={4} value={2} />)
    expect(Number(container.querySelectorAll('circle')[1].getAttribute('stroke-dashoffset'))).toBeCloseTo(0)
  })
})
