import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Stepper } from '@/components/ui/Stepper'
import { Field } from '@/components/ui/Field'

describe('Stepper', () => {
  it('− e + com aria-label e valor pt-BR com aria-live', () => {
    const { container } = render(<Stepper value={82.5} unit="kg" step={2.5} label="kg" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'diminuir kg' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'aumentar kg' })).toBeInTheDocument()
    const live = container.querySelector('[aria-live="polite"]')!
    expect(live).toHaveTextContent('82,5')
    expect(live).toHaveTextContent('kg')
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
