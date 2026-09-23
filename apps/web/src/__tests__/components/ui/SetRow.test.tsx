import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Check } from '@/components/ui/Check'
import { SetRow } from '@/components/ui/SetRow'
import { CurrentSet } from '@/components/ui/CurrentSet'

describe('Check', () => {
  it('aria-pressed e classes', () => {
    const { rerender } = render(<Check on={false} onClick={() => {}} />)
    const b = screen.getByRole('button', { name: 'concluir série' })
    expect(b).toHaveClass('hx-chk')
    expect(b).toHaveAttribute('aria-pressed', 'false')
    expect(b).not.toHaveClass('is-on')
    rerender(<Check on pop onClick={() => {}} />)
    expect(b).toHaveAttribute('aria-pressed', 'true')
    expect(b).toHaveClass('is-on', 'is-pop')
  })

  it('big usa ícone de 24 px (52 px pela classe do contêiner)', () => {
    const { container } = render(<Check on={false} big onClick={() => {}} label="concluir série 2" />)
    expect(screen.getByRole('button', { name: 'concluir série 2' })).toBeInTheDocument()
    expect(container.querySelector('svg')).toHaveAttribute('width', '24')
  })
})

describe('SetRow', () => {
  it('mostra "—" quando não há anterior e o valor em pt-BR', () => {
    const { container } = render(
      <SetRow no={3} prev={null} weight={82.5} reps={8} done={false} onToggle={() => {}} onEdit={() => {}} />,
    )
    expect(container.querySelector('.hx-set-prev')).toHaveTextContent('—')
    expect(container.querySelector('.hx-set-val')).toHaveTextContent('82,5 kg × 8')
    expect(container.querySelector('.hx-set-no')).toHaveTextContent('3')
    expect(container.querySelector('.hx-set')).toHaveClass('is-upcoming')
  })

  it('concluída', () => {
    const { container } = render(
      <SetRow no={1} prev="80 × 8" weight={80} reps={8} done onToggle={() => {}} onEdit={() => {}} />,
    )
    expect(container.querySelector('.hx-set')).toHaveClass('hx-set', 'is-done')
    expect(container.querySelector('.hx-set-prev')).toHaveTextContent('80 × 8')
    expect(screen.getByRole('button', { name: /concluída/ })).toHaveAttribute('aria-pressed', 'true')
  })

  it('clicar na linha edita; o ✓ alterna sem propagar', () => {
    const onEdit = vi.fn()
    const onToggle = vi.fn()
    const { container } = render(
      <SetRow no={2} prev={null} weight={80} reps={8} done={false} onToggle={onToggle} onEdit={onEdit} />,
    )
    fireEvent.click(container.querySelector('.hx-set')!)
    expect(onEdit).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: /concluir série 2/ }))
    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('edição acessível por teclado (botão)', () => {
    const onEdit = vi.fn()
    render(<SetRow no={2} prev={null} weight={80} reps={8} done={false} onToggle={() => {}} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button', { name: /editar série 2/i }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })
})

describe('CurrentSet', () => {
  function setup(extra: Partial<Parameters<typeof CurrentSet>[0]> = {}) {
    const props = {
      no: 2, total: 4, prev: null, weight: 80, reps: 8, done: false,
      onWeight: vi.fn(), onReps: vi.fn(), onDone: vi.fn(), ...extra,
    }
    const utils = render(<CurrentSet {...props} />)
    return { ...utils, props }
  }

  it('"Série 2 de 4", anterior "—", dois steppers e ✓ grande', () => {
    const { container } = setup()
    expect(container.querySelector('.hx-cur')).toHaveTextContent('Série 2 de 4')
    expect(container.querySelector('.hx-cur')).toHaveTextContent('Anterior —')
    expect(container.querySelectorAll('.hx-step')).toHaveLength(2)
    expect(container.querySelector('.hx-cur-row .hx-chk svg')).toHaveAttribute('width', '24')
  })

  it('kg com passo 2,5 e reps com passo 1', () => {
    const { props } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'aumentar kg' }))
    expect(props.onWeight).toHaveBeenCalledWith(82.5)
    fireEvent.click(screen.getByRole('button', { name: 'aumentar reps' }))
    expect(props.onReps).toHaveBeenCalledWith(9)
  })

  it('✓ conclui a série', () => {
    const { props } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'concluir série 2' }))
    expect(props.onDone).toHaveBeenCalledTimes(1)
  })
})
