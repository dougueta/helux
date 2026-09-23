import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { assessTiredness } from '@helux/workouts'
import { TirednessSelector } from '@/components/workout/TirednessSelector'

const DATE = '2026-09-22'
const CHANGES = [{ name: 'Supino Reto', setsBefore: 4, setsAfter: 3, weightBefore: '80kg', weightAfter: '72kg' }]

function assessment(input: Partial<Parameters<typeof assessTiredness>[0]>) {
  return assessTiredness({ date: DATE, manualLevel: null, overrideAutomatic: false, hrv: null, ...input })
}

describe('TirednessSelector', () => {
  it('US1: mostra os 4 níveis, "Não informado" e chama onChoose', async () => {
    const onChoose = vi.fn()
    const user = userEvent.setup()
    render(<TirednessSelector assessment={assessment({})} changes={[]} onChoose={onChoose} />)
    for (const label of ['ótimo', 'normal', 'cansado', 'exausto']) {
      expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'false')
    }
    expect(screen.getByText('Não informado')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'exausto' }))
    expect(onChoose).toHaveBeenCalledWith('exausto')
  })

  it('US1: marca o nível vigente informado pelo usuário', () => {
    render(<TirednessSelector assessment={assessment({ manualLevel: 'cansado' })} changes={[]} onChoose={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'cansado' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Informado por você')).toBeInTheDocument()
  })

  it('US1: "Ver o que mudou" lista as mudanças do treino', async () => {
    const user = userEvent.setup()
    render(
      <TirednessSelector
        assessment={assessment({ manualLevel: 'exausto' })}
        changes={CHANGES}
        reason='Você marcou "exausto" hoje'
        onChoose={vi.fn()}
      />,
    )
    expect(screen.getByText('Você marcou "exausto" hoje')).toBeInTheDocument()
    expect(screen.queryByText('4 → 3 séries')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /ver o que mudou/i }))
    expect(screen.getByText('4 → 3 séries')).toBeInTheDocument()
  })

  it('desabilita os botões enquanto salva e mostra erro', () => {
    render(<TirednessSelector assessment={assessment({})} changes={[]} onChoose={vi.fn()} disabled error="falhou" />)
    expect(screen.getByRole('button', { name: 'normal' })).toBeDisabled()
    expect(screen.getByText('falhou')).toBeInTheDocument()
  })

  it('US3: origem automática com HRV', () => {
    render(<TirednessSelector assessment={assessment({ hrv: 45 })} changes={[]} onChoose={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'cansado' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Indicado pelo relógio (HRV 45 ms)')).toBeInTheDocument()
  })

  it('US3: avisa quando o manual discorda do relógio e o relógio prevalece', () => {
    render(<TirednessSelector assessment={assessment({ hrv: 45, manualLevel: 'otimo' })} changes={[]} onChoose={vi.fn()} />)
    expect(screen.getByText('Você marcou "ótimo", mas o relógio indica "cansado".')).toBeInTheDocument()
  })

  it('US3: indica a escolha manual contra o relógio', () => {
    render(
      <TirednessSelector
        assessment={assessment({ hrv: 45, manualLevel: 'otimo', overrideAutomatic: true })}
        changes={[]}
        onChoose={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'ótimo' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Escolhido por você (relógio indica "cansado")')).toBeInTheDocument()
  })
})
