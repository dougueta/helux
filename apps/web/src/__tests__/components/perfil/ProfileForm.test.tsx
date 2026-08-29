import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileForm } from '@/components/perfil/ProfileForm'

describe('ProfileForm', () => {
  it('renderiza vazio quando initial é null (usuário nunca preencheu)', () => {
    render(<ProfileForm initial={null} saving={false} onSave={vi.fn()} />)
    expect(screen.getByLabelText(/objetivo/i)).toHaveValue('')
    expect(screen.getByLabelText(/tempo treinando/i)).toHaveValue('')
  })

  it('pré-preenche os campos com os valores de initial', () => {
    render(
      <ProfileForm
        initial={{
          goal: 'Hipertrofia',
          level: 'avancado',
          trainingTime: '5 anos',
          timeOff: null,
          currentInjury: 'Dor no ombro',
          updatedAt: '2026-08-27T00:00:00Z',
        }}
        saving={false}
        onSave={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(/objetivo/i)).toHaveValue('Hipertrofia')
    expect(screen.getByLabelText(/nível de experiência/i)).toHaveValue('avancado')
    expect(screen.getByLabelText(/tempo treinando/i)).toHaveValue('5 anos')
    expect(screen.getByLabelText(/lesão/i)).toHaveValue('Dor no ombro')
  })

  it('chama onSave com o input preenchido ao salvar', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ProfileForm initial={null} saving={false} onSave={onSave} />)

    await user.type(screen.getByLabelText(/objetivo/i), 'Voltar a correr')
    await user.selectOptions(screen.getByLabelText(/nível de experiência/i), 'intermediario')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ goal: 'Voltar a correr', level: 'intermediario' }),
    )
  })

  it('permite salvar com todos os campos vazios (FR-011)', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ProfileForm initial={null} saving={false} onSave={onSave} />)

    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).toHaveBeenCalled()
  })

  it('desabilita o botão de salvar quando saving é true', () => {
    render(<ProfileForm initial={null} saving={true} onSave={vi.fn()} />)
    expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled()
  })
})
