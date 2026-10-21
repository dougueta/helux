import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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
    // spec 012 T060: o nível usa o seletor segmentado da v2
    const level = screen.getByRole('group', { name: /nível de experiência/i })
    expect(within(level).getByRole('button', { name: 'Avançado' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText(/tempo treinando/i)).toHaveValue('5 anos')
    expect(screen.getByLabelText(/lesão/i)).toHaveValue('Dor no ombro')
  })

  it('chama onSave com o input preenchido ao salvar', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ProfileForm initial={null} saving={false} onSave={onSave} />)

    await user.type(screen.getByLabelText(/objetivo/i), 'Voltar a correr')
    await user.click(screen.getByRole('button', { name: 'Intermediário' }))
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

describe('ProfileForm — dados corporais (spec 018)', () => {
  it('pré-preenche altura, nascimento e sexo', () => {
    render(
      <ProfileForm
        initial={{ heightCm: 178, birthDate: '1990-05-10', sex: 'masculino', updatedAt: '2026-10-13T00:00:00Z' }}
        saving={false}
        onSave={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(/altura/i)).toHaveValue(178)
    expect(screen.getByLabelText(/data de nascimento/i)).toHaveValue('1990-05-10')
    const sex = screen.getByRole('group', { name: /sexo/i })
    expect(within(sex).getByRole('button', { name: 'Masculino' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('envia os dados corporais ao salvar', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ProfileForm initial={null} saving={false} onSave={onSave} />)

    await user.type(screen.getByLabelText(/altura/i), '172')
    await user.type(screen.getByLabelText(/data de nascimento/i), '1988-03-02')
    await user.click(screen.getByRole('button', { name: 'Feminino' }))
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ heightCm: 172, birthDate: '1988-03-02', sex: 'feminino' }))
  })

  it('não envia dados corporais vazios', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<ProfileForm initial={null} saving={false} onSave={onSave} />)
    await user.click(screen.getByRole('button', { name: /salvar/i }))
    const input = onSave.mock.calls[0][0]
    expect(input).not.toHaveProperty('heightCm')
    expect(input).not.toHaveProperty('birthDate')
    expect(input).not.toHaveProperty('sex')
  })
})
