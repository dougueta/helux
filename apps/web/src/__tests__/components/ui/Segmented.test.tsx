import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Segmented } from '@/components/ui/Segmented'

describe('Segmented', () => {
  it('grupo com aria-label e botões com aria-pressed', () => {
    render(<Segmented label="como você está hoje" options={['ótimo', 'normal']} value="normal" onChange={() => {}} />)
    const group = screen.getByRole('group', { name: 'como você está hoje' })
    expect(group).toHaveClass('hx-seg')
    expect(group).not.toHaveClass('hx-seg--tabs')
    expect(screen.getByRole('button', { name: 'normal' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'ótimo' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('opções com value/label e clique chama onChange com o value', () => {
    const onChange = vi.fn()
    render(
      <Segmented
        label="x"
        options={[{ value: 'a', label: 'Alfa' }, { value: 'b', label: 'Beta' }]}
        value="a"
        onChange={onChange}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Beta' }))
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('abas: tablist, tab e aria-selected', () => {
    const onChange = vi.fn()
    render(
      <Segmented
        tabs
        label="conteúdo"
        options={[{ value: 'exec', label: 'Execução' }, { value: 'var', label: 'Variantes (4)' }]}
        value="exec"
        onChange={onChange}
      />,
    )
    const list = screen.getByRole('tablist', { name: 'conteúdo' })
    expect(list).toHaveClass('hx-seg', 'hx-seg--tabs')
    expect(screen.getByRole('tab', { name: 'Execução' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Variantes (4)' })).toHaveAttribute('aria-selected', 'false')
    fireEvent.click(screen.getByRole('tab', { name: 'Variantes (4)' }))
    expect(onChange).toHaveBeenCalledWith('var')
  })

  it('desabilitado', () => {
    render(<Segmented label="x" options={['a', 'b']} value="a" onChange={() => {}} disabled />)
    for (const b of screen.getAllByRole('button')) expect(b).toBeDisabled()
  })

  it('nada selecionado quando value é null', () => {
    render(<Segmented label="x" options={['a', 'b']} value={null} onChange={() => {}} />)
    for (const b of screen.getAllByRole('button')) expect(b).toHaveAttribute('aria-pressed', 'false')
  })
})
