import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EffortPicker } from '@/components/workout/EffortPicker'

describe('EffortPicker (spec 014, US3, FR-014)', () => {
  it('mostra os 4 níveis de esforço, sem nenhum marcado por padrão', () => {
    render(<EffortPicker value={null} onChange={() => {}} />)
    const group = screen.getByRole('group', { name: 'Esforço percebido' })
    expect(group).toBeInTheDocument()
    const buttons = screen.getAllByRole('button')
    expect(buttons.map(b => b.textContent)).toEqual(['Fácil', 'Moderado', 'Difícil', 'No limite'])
    for (const b of buttons) expect(b).toHaveAttribute('aria-pressed', 'false')
  })

  it('marca o nível atual e avisa a escolha com um toque', async () => {
    const onChange = vi.fn()
    render(<EffortPicker value="dificil" onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Difícil' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.setup().click(screen.getByRole('button', { name: 'No limite' }))
    expect(onChange).toHaveBeenCalledWith('limite')
  })
})
