import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Ring } from '@/components/ui/Ring'

describe('Ring', () => {
  it('sets stroke-dashoffset to 0 when value is 100', () => {
    const { container } = render(<Ring value={100} size={64} sw={6} />)
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(2)
    expect(circles[1]).toHaveAttribute('stroke-dashoffset', '0')
  })

  it('sets a partial stroke-dashoffset for a partial value', () => {
    const { container } = render(<Ring value={0} size={64} sw={6} />)
    const circles = container.querySelectorAll('circle')
    const circumference = 2 * Math.PI * ((64 - 6) / 2)
    expect(circles[1]).toHaveAttribute('stroke-dashoffset', String(circumference))
  })

  it('renders children centered inside the ring', () => {
    const { getByText } = render(<Ring value={50}><span>86</span></Ring>)
    expect(getByText('86')).toBeInTheDocument()
  })
})
