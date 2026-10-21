import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const chatProps = vi.fn()
vi.mock('@/components/agents/AgentChat', () => ({
  AgentChat: (props: { channel: string; onHandoff?: (to: string) => void }) => {
    chatProps(props)
    return (
      <div>
        <p>chat:{props.channel}</p>
        <button type="button" onClick={() => props.onHandoff?.('nutricao')}>
          simular encaminhamento
        </button>
      </div>
    )
  },
}))

import { EquipeClient } from '@/app/equipe/EquipeClient'
import { Shell } from '@/components/layout/Shell'

describe('Equipe Helux (022 T033, FR-023)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('abre no chat Equipe por padrão e troca de especialista pelas abas', async () => {
    const user = userEvent.setup()
    render(<EquipeClient initial={null} />)
    expect(screen.getByText('chat:equipe')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Medicina' }))
    expect(screen.getByText('chat:medicina')).toBeInTheDocument()
  })

  it('?agente= abre direto no especialista; inválido cai na Equipe', () => {
    const { unmount } = render(<EquipeClient initial="medicina" />)
    expect(screen.getByText('chat:medicina')).toBeInTheDocument()
    unmount()
    render(<EquipeClient initial="dentista" />)
    expect(screen.getByText('chat:equipe')).toBeInTheDocument()
  })

  it('encaminhamento troca para o especialista indicado', async () => {
    const user = userEvent.setup()
    render(<EquipeClient initial="treino" />)
    await user.click(screen.getByRole('button', { name: /simular encaminhamento/i }))
    expect(screen.getByText('chat:nutricao')).toBeInTheDocument()
  })

  it('Shell tem o botão fixo para a Equipe', () => {
    render(<Shell>conteúdo</Shell>)
    expect(screen.getByRole('link', { name: /equipe helux/i })).toHaveAttribute('href', '/equipe')
  })
})
