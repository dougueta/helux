import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SetLogger } from '@/components/workout/SetLogger'

describe('SetLogger', () => {
  it('renders reps, weight, and effort inputs', () => {
    render(<SetLogger onLog={vi.fn()} setNumber={1} targetReps="8-10" targetWeight="80kg" />)
    expect(screen.getByLabelText(/reps/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/peso/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/esforço/i)).toBeInTheDocument()
  })

  it('calls onLog with correct values on submit', async () => {
    const onLog = vi.fn()
    const user = userEvent.setup()
    render(<SetLogger onLog={onLog} setNumber={1} targetReps="8" targetWeight="80kg" />)

    const repsInput = screen.getByLabelText(/reps/i)
    const weightInput = screen.getByLabelText(/peso/i)
    const effortInput = screen.getByLabelText(/esforço/i)

    await user.clear(repsInput)
    await user.type(repsInput, '8')
    await user.clear(weightInput)
    await user.type(weightInput, '80')
    await user.clear(effortInput)
    await user.type(effortInput, '8')

    await user.click(screen.getByRole('button', { name: /confirmar/i }))

    expect(onLog).toHaveBeenCalledWith({ reps: 8, weight: 80, effort: 8 })
  })
})
