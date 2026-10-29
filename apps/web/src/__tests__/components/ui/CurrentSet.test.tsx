import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CurrentSet } from '@/components/ui/CurrentSet'

function setup(overrides: Partial<Parameters<typeof CurrentSet>[0]> = {}) {
  const props = {
    no: 1,
    total: 3,
    prev: null,
    weight: 20,
    reps: 10,
    onWeight: vi.fn(),
    onReps: vi.fn(),
    onDone: vi.fn(),
    ...overrides,
  }
  render(<CurrentSet {...props} />)
  return props
}

async function typeInto(name: string, text: string) {
  const user = userEvent.setup()
  const input = screen.getByRole('textbox', { name })
  await user.clear(input)
  await user.type(input, text)
  await user.tab()
}

describe('CurrentSet — digitação (spec 026, US1)', () => {
  it('kg aceita duas casas decimais', async () => {
    const p = setup()
    await typeInto('kg', '10,25')
    expect(p.onWeight).toHaveBeenLastCalledWith(10.25)
  })

  it('reps são inteiras', async () => {
    const p = setup()
    await typeInto('reps', '12')
    expect(p.onReps).toHaveBeenLastCalledWith(12)
    await typeInto('reps', '11,6')
    expect(p.onReps).toHaveBeenLastCalledWith(12)
  })

  it('limites: kg até 500 e reps até 100', async () => {
    const p = setup()
    await typeInto('kg', '900')
    expect(p.onWeight).toHaveBeenLastCalledWith(500)
    await typeInto('reps', '150')
    expect(p.onReps).toHaveBeenLastCalledWith(100)
  })

  it('digitar e tocar direto no ✓ confirma a carga antes de concluir (FR-006)', async () => {
    const user = userEvent.setup()
    const order: string[] = []
    setup({
      onWeight: vi.fn(v => order.push(`w:${v}`)),
      onDone: vi.fn(() => order.push('done')),
    })
    const input = screen.getByRole('textbox', { name: 'kg' })
    await user.clear(input)
    await user.type(input, '60')
    await user.click(screen.getByRole('button', { name: 'concluir série 1' }))
    // O valor vai a cada tecla (revisão do PR #20): o último antes do ✓ é o digitado.
    expect(order.slice(-2)).toEqual(['w:60', 'done'])
  })
})
