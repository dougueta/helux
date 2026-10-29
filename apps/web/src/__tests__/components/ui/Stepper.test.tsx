import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Stepper } from '@/components/ui/Stepper'
import { Field } from '@/components/ui/Field'

describe('Stepper', () => {
  it('− e + com aria-label e valor pt-BR', () => {
    const { container } = render(<Stepper value={82.5} unit="kg" step={2.5} label="kg" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'diminuir kg' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'aumentar kg' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'kg' })).toHaveValue('82,5')
    expect(container.querySelector('.hx-step-v')).toHaveTextContent('kg')
    expect(container.querySelector('.hx-step')).not.toHaveClass('is-err')
  })

  it('soma e subtrai o passo', () => {
    const onChange = vi.fn()
    render(<Stepper value={80} unit="kg" step={2.5} label="kg" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'aumentar kg' }))
    expect(onChange).toHaveBeenLastCalledWith(82.5)
    fireEvent.click(screen.getByRole('button', { name: 'diminuir kg' }))
    expect(onChange).toHaveBeenLastCalledWith(77.5)
  })

  it('respeita o mínimo', () => {
    const onChange = vi.fn()
    render(<Stepper value={1} unit="reps" step={2.5} label="reps" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'diminuir reps' }))
    expect(onChange).toHaveBeenLastCalledWith(0)
  })

  it('erro e desabilitado', () => {
    const { container } = render(<Stepper value={1} unit="kg" step={1} label="kg" onChange={() => {}} error disabled />)
    expect(container.querySelector('.hx-step')).toHaveClass('hx-step', 'is-err')
    expect(screen.getByRole('button', { name: 'aumentar kg' })).toBeDisabled()
    expect(screen.getByRole('textbox', { name: 'kg' })).toBeDisabled()
  })
})

/** Stepper controlado, como no `CurrentSet`: o pai guarda o valor recebido. */
function Controlled({ initial, onChange, ...props }: { initial: number; onChange: (v: number) => void; max?: number }) {
  const [value, setValue] = useState(initial)
  return (
    <Stepper value={value} unit="kg" step={2.5} label="kg" {...props}
      onChange={v => { setValue(v); onChange(v) }} />
  )
}

describe('Stepper — digitação (spec 026, US1)', () => {
  it('o valor é um campo de texto com teclado numérico', () => {
    const { unmount } = render(<Stepper value={82.5} unit="kg" step={2.5} decimals={2} label="kg" onChange={() => {}} />)
    expect(screen.getByRole('textbox', { name: 'kg' })).toHaveValue('82,5')
    expect(screen.getByRole('textbox', { name: 'kg' })).toHaveAttribute('inputmode', 'decimal')
    unmount()
    render(<Stepper value={10} unit="reps" step={1} decimals={0} label="reps" onChange={() => {}} />)
    expect(screen.getByRole('textbox', { name: 'reps' })).toHaveAttribute('inputmode', 'numeric')
  })

  it('envia o valor válido a cada tecla, sem depender do blur (revisão PR #20)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { unmount } = render(<Controlled initial={20} onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'kg' })
    await user.clear(input)
    await user.type(input, '10,25')
    expect(onChange).toHaveBeenLastCalledWith(10.25)
    expect(input).toHaveValue('10,25')
    // ✓ tocado sem o campo perder o foco: a série sai da tela e o valor já foi enviado.
    const calls = onChange.mock.calls.length
    unmount()
    expect(onChange).toHaveBeenCalledTimes(calls)
    expect(onChange).toHaveBeenLastCalledWith(10.25)
  })

  it('Enter encerra a edição e mostra o valor normalizado', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled initial={20} max={500} onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'kg' })
    await user.clear(input)
    await user.type(input, '900{Enter}')
    expect(onChange).toHaveBeenLastCalledWith(500)
    expect(input).toHaveValue('500')
  })

  it('vazio mantém o valor anterior; Escape volta ao valor de antes da edição', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled initial={20} onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'kg' })
    await user.clear(input)
    await user.tab()
    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveValue('20')

    await user.clear(input)
    await user.type(input, '99{Escape}')
    expect(onChange).toHaveBeenLastCalledWith(20)
    expect(input).toHaveValue('20')
  })

  it('focar e sair sem digitar não muda o valor', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<Stepper value={12.345} unit="kg" step={2.5} label="kg" onChange={onChange} />)
    await user.click(screen.getByRole('textbox', { name: 'kg' }))
    await user.tab()
    rerender(<Stepper value={1000} unit="kg" step={2.5} label="kg" onChange={onChange} />)
    await user.click(screen.getByRole('textbox', { name: 'kg' }))
    expect(screen.getByRole('textbox', { name: 'kg' })).toHaveValue('1000')
    await user.tab()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('"+" com o campo em edição parte do valor digitado e o blur não sobrescreve', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Controlled initial={40} onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'kg' })
    await user.clear(input)
    await user.type(input, '50')
    // Toque sem blur (celular): o clique não tira o foco do campo.
    fireEvent.click(screen.getByRole('button', { name: 'aumentar kg' }))
    expect(onChange).toHaveBeenLastCalledWith(52.5)
    expect(input).toHaveValue('52,5')
    fireEvent.blur(input)
    expect(onChange).toHaveBeenLastCalledWith(52.5)
    expect(input).toHaveValue('52,5')
  })

  it('valor alterado de fora com o campo focado substitui o rascunho', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const { rerender } = render(<Stepper value={20} unit="kg" step={2.5} label="kg" onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'kg' })
    await user.click(input)
    rerender(<Stepper value={30} unit="kg" step={2.5} label="kg" onChange={onChange} />)
    expect(input).toHaveValue('30')
    await user.tab()
    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveValue('30')
  })

  it('ignora valor igual ao atual', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Stepper value={20} unit="kg" step={2.5} max={500} label="kg" onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'kg' })
    await user.clear(input)
    await user.type(input, '20,0')
    await user.tab()
    expect(onChange).not.toHaveBeenCalledWith(20)
  })

  it('os botões preservam duas casas e respeitam o máximo', () => {
    const onChange = vi.fn()
    const { rerender } = render(<Stepper value={10.25} unit="kg" step={2.5} decimals={2} label="kg" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'aumentar kg' }))
    expect(onChange).toHaveBeenLastCalledWith(12.75)
    fireEvent.click(screen.getByRole('button', { name: 'diminuir kg' }))
    expect(onChange).toHaveBeenLastCalledWith(7.75)
    rerender(<Stepper value={499} unit="kg" step={2.5} max={500} label="kg" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'aumentar kg' }))
    expect(onChange).toHaveBeenLastCalledWith(500)
  })

  it('o campo mostra o novo valor quando a prop muda', () => {
    const { rerender } = render(<Stepper value={20} unit="kg" step={2.5} label="kg" onChange={() => {}} />)
    rerender(<Stepper value={22.5} unit="kg" step={2.5} label="kg" onChange={() => {}} />)
    expect(screen.getByRole('textbox', { name: 'kg' })).toHaveValue('22,5')
  })

  it('a região aria-live fica fora do campo e anuncia só os botões', async () => {
    const user = userEvent.setup()
    const { container } = render(<Controlled initial={20} onChange={() => {}} />)
    const live = container.querySelector('[aria-live="polite"]')!
    expect(live.querySelector('input')).toBeNull()
    const input = screen.getByRole('textbox', { name: 'kg' })
    await user.clear(input)
    await user.type(input, '50')
    expect(live).toHaveTextContent('')
    fireEvent.click(screen.getByRole('button', { name: 'aumentar kg' }))
    expect(live).toHaveTextContent('52,5 kg')
  })
})

describe('Field', () => {
  it('label associado, inputMode decimal e unidade', () => {
    render(<Field label="Peso" value="82" unit="kg" onChange={() => {}} />)
    const input = screen.getByLabelText('Peso')
    expect(input).toHaveAttribute('inputmode', 'decimal')
    expect(input).toHaveValue('82')
    expect(screen.getByText('kg')).toHaveClass('u')
    expect(input).toHaveAttribute('aria-invalid', 'false')
  })

  it('onChange com o texto digitado', () => {
    const onChange = vi.fn()
    render(<Field label="Peso" value="" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Peso'), { target: { value: '81,5' } })
    expect(onChange).toHaveBeenCalledWith('81,5')
  })

  it('erro: aria-invalid e mensagem ligada por aria-describedby', () => {
    const { container } = render(<Field label="Gordura" value="90" unit="%" error="Use um valor entre 3 e 50 %" onChange={() => {}} />)
    const input = screen.getByLabelText('Gordura')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const msg = screen.getByText('Use um valor entre 3 e 50 %')
    expect(input.getAttribute('aria-describedby')).toContain(msg.id)
    expect(msg).toHaveClass('hx-field-help', 'is-err')
    expect(container.querySelector('.hx-input')).toHaveClass('is-err')
  })

  it('ajuda ligada por aria-describedby', () => {
    render(<Field label="Peso" value="" help="Em jejum" onChange={() => {}} />)
    const help = screen.getByText('Em jejum')
    expect(screen.getByLabelText('Peso').getAttribute('aria-describedby')).toContain(help.id)
  })

  it('desabilitado', () => {
    const { container } = render(<Field label="Peso" value="" disabled onChange={() => {}} />)
    expect(screen.getByLabelText('Peso')).toBeDisabled()
    expect(container.querySelector('.hx-input')).toHaveClass('is-dis')
  })
})
