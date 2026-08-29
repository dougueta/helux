import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TirednessToggle } from '@/components/workout/TirednessToggle'

describe('TirednessToggle', () => {
  it('quando active=false, renderiza o botão de sinalizar cansaço e chama onToggle ao tocar', async () => {
    const onToggle = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<TirednessToggle active={false} onToggle={onToggle} />)

    const button = screen.getByRole('button', { name: /hoje estou muito cansado/i })
    await user.click(button)

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('quando active=true, renderiza o chip de cansaço sinalizado com ação de desfazer e chama onToggle ao tocar', async () => {
    const onToggle = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<TirednessToggle active={true} onToggle={onToggle} />)

    expect(screen.getByText(/cansaço sinalizado/i)).toBeInTheDocument()
    const button = screen.getByRole('button')
    await user.click(button)

    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
