import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TirednessDialog, type TirednessDialogProps } from '@/components/workout/TirednessDialog'

const CHANGES = [{ name: 'Supino Reto', setsBefore: 4, setsAfter: 3, weightBefore: '80kg', weightAfter: '72kg' }]

function props(overrides: Partial<TirednessDialogProps>): TirednessDialogProps {
  return {
    open: true,
    mode: 'home',
    step: 'changes',
    candidate: 'exausto',
    automaticLevel: null,
    changes: CHANGES,
    changesBase: 'current',
    saving: false,
    error: null,
    onSelectCandidate: vi.fn(),
    onContinue: vi.fn(),
    onConfirmConflict: vi.fn(),
    onDeclineConflict: vi.fn(),
    onConfirmChanges: vi.fn(),
    onCancelChanges: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  }
}

describe('TirednessDialog', () => {
  it('não renderiza quando fechado', () => {
    const { container } = render(<TirednessDialog {...props({ open: false })} />)
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByTestId('tiredness-dialog-backdrop')).not.toBeInTheDocument()
  })

  it('FR-017: fica acima do menu inferior (portal em document.body e z-index > 50 do NavBar)', () => {
    const { container } = render(
      <div style={{ position: 'relative', zIndex: 1 }}>
        <TirednessDialog {...props({})} />
      </div>,
    )
    const backdrop = screen.getByTestId('tiredness-dialog-backdrop')
    expect(backdrop.parentElement).toBe(document.body)
    expect(container.contains(backdrop)).toBe(false)
    expect(Number(backdrop.style.zIndex)).toBeGreaterThan(50)
  })

  describe('US1: etapa de mudanças', () => {
    it('lista o que muda e confirma/cancela', async () => {
      const p = props({})
      const user = userEvent.setup()
      render(<TirednessDialog {...p} />)
      expect(screen.getByRole('heading', { name: 'Seu treino vai mudar' })).toBeInTheDocument()
      expect(screen.getByText('4 → 3 séries')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Aplicar' }))
      expect(p.onConfirmChanges).toHaveBeenCalled()
      await user.click(screen.getByRole('button', { name: 'Cancelar' }))
      expect(p.onCancelChanges).toHaveBeenCalled()
    })

    it('no início o botão é "Aplicar e iniciar" e, vs. planejado, o título explica o ajuste', () => {
      render(<TirednessDialog {...props({ mode: 'start', changesBase: 'planned' })} />)
      expect(screen.getByRole('heading', { name: 'Seu treino de hoje está ajustado' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Aplicar e iniciar' })).toBeInTheDocument()
    })

    it('desabilita enquanto salva e mostra erro', () => {
      render(<TirednessDialog {...props({ saving: true, error: 'falhou' })} />)
      expect(screen.getByRole('button', { name: /aplicar/i })).toBeDisabled()
      expect(screen.getByText('falhou')).toBeInTheDocument()
    })
  })

  describe('US2: pergunta ao iniciar', () => {
    it('mostra os 4 níveis com a pré-seleção, troca e continua', async () => {
      const p = props({ mode: 'start', step: 'question', candidate: 'normal' })
      const user = userEvent.setup()
      render(<TirednessDialog {...p} />)
      expect(screen.getByRole('heading', { name: 'Como você está hoje?' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'normal' })).toHaveAttribute('aria-pressed', 'true')
      await user.click(screen.getByRole('button', { name: 'exausto' }))
      expect(p.onSelectCandidate).toHaveBeenCalledWith('exausto')
      await user.click(screen.getByRole('button', { name: 'Continuar' }))
      expect(p.onContinue).toHaveBeenCalled()
      await user.click(screen.getByRole('button', { name: 'Fechar' }))
      expect(p.onClose).toHaveBeenCalled()
    })
  })

  describe('US3: discordância', () => {
    it('cita os dois níveis e confirma/recusa', async () => {
      const p = props({ step: 'conflict', candidate: 'otimo', automaticLevel: 'cansado' })
      const user = userEvent.setup()
      render(<TirednessDialog {...p} />)
      expect(
        screen.getByRole('heading', { name: 'Seu relógio indica "cansado", mas você marcou "ótimo"' }),
      ).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Sim, ajustar' }))
      expect(p.onConfirmConflict).toHaveBeenCalled()
      await user.click(screen.getByRole('button', { name: 'Manter o relógio' }))
      expect(p.onDeclineConflict).toHaveBeenCalled()
    })
  })
})
