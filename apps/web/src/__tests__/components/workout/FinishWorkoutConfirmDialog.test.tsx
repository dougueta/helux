import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FinishWorkoutConfirmDialog } from '@/components/workout/FinishWorkoutConfirmDialog'

describe('FinishWorkoutConfirmDialog', () => {
  it('renders nothing when there are no skipped exercises', () => {
    const { container } = render(
      <FinishWorkoutConfirmDialog skippedNames={[]} onConfirm={vi.fn()} onCancel={vi.fn()} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the count and names of the skipped exercises', () => {
    render(
      <FinishWorkoutConfirmDialog
        skippedNames={['Supino', 'Levantamento terra']}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    )
    expect(screen.getByText('2', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Supino')).toBeInTheDocument()
    expect(screen.getByText('Levantamento terra')).toBeInTheDocument()
  })

  it('calls onConfirm when the user confirms', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(
      <FinishWorkoutConfirmDialog skippedNames={['Supino']} onConfirm={onConfirm} onCancel={vi.fn()} />
    )
    await user.click(screen.getByText('Finalizar mesmo assim'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onCancel when the user cancels', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(
      <FinishWorkoutConfirmDialog skippedNames={['Supino']} onConfirm={vi.fn()} onCancel={onCancel} />
    )
    await user.click(screen.getByText('Cancelar'))
    expect(onCancel).toHaveBeenCalled()
  })
})
