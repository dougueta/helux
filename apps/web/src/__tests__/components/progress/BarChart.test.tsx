import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BarChart } from '@/components/progress/BarChart'

describe('BarChart', () => {
  it('renders one bar per data point with its label', () => {
    const { getByText, getAllByTestId } = render(
      <BarChart data={[{ label: 'S27', value: 800 }, { label: 'S28', value: 1000 }]} />
    )
    expect(getByText('S27')).toBeInTheDocument()
    expect(getByText('S28')).toBeInTheDocument()
    expect(getAllByTestId('bar')).toHaveLength(2)
  })

  it('highlights only the last bar as the current week', () => {
    const { getAllByTestId } = render(
      <BarChart data={[{ label: 'S27', value: 800 }, { label: 'S28', value: 1000 }]} />
    )
    const bars = getAllByTestId('bar')
    expect(bars[1]).toHaveStyle({ background: 'var(--accent)' })
    expect(bars[0]).toHaveStyle({ background: 'var(--surface-3)' })
  })

  it('renders nothing for empty data without crashing', () => {
    const { container } = render(<BarChart data={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('gives every bar at least a 6% height floor even for a zero value', () => {
    const { getAllByTestId } = render(
      <BarChart data={[{ label: 'S27', value: 0 }, { label: 'S28', value: 1000 }]} />
    )
    const bars = getAllByTestId('bar')
    expect(bars[0]).toHaveStyle({ height: '6%' })
  })
})
