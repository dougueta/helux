import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MiniStep } from '@/components/ui/MiniStep'

describe('MiniStep', () => {
  it('shows the current value', () => {
    render(<MiniStep value={62.5} step={2.5} onChange={vi.fn()} done={false} />)
    expect(screen.getByText('62.5')).toBeInTheDocument()
  })

  it('calls onChange with value + step when the plus button is clicked', async () => {
    const onChange = vi.fn()
    render(<MiniStep value={60} step={2.5} onChange={onChange} done={false} />)
    await userEvent.click(screen.getAllByRole('button')[1])
    expect(onChange).toHaveBeenCalledWith(62.5)
  })

  it('calls onChange with value - step when the minus button is clicked', async () => {
    const onChange = vi.fn()
    render(<MiniStep value={60} step={2.5} onChange={onChange} done={false} />)
    await userEvent.click(screen.getAllByRole('button')[0])
    expect(onChange).toHaveBeenCalledWith(57.5)
  })

  it('never calls onChange with a value below zero', async () => {
    const onChange = vi.fn()
    render(<MiniStep value={1} step={2.5} onChange={onChange} done={false} />)
    await userEvent.click(screen.getAllByRole('button')[0])
    expect(onChange).toHaveBeenCalledWith(0)
  })
})
