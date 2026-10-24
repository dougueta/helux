import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Spec 024 T064 — crise de gota além do prazo: orientar procurar o médico (FR-009).

const getMock = vi.fn()
const endFlareMock = vi.fn()
vi.mock('@/services/conditions.service', () => ({ getConditions: () => getMock(), endFlare: (...a: unknown[]) => endFlareMock(...a) }))

import { FlareNotice } from '@/components/conditions/FlareNotice'

const gout = (until: string | null) => ({
  id: 'g1', catalogKey: 'gota', customLabel: null, region: 'sistemica', side: null, since: null, count: 1, status: 'controlada', notes: null,
  flare: until ? { region: 'joelho', until } : null, rules: {},
})
const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)

describe('FlareNotice', () => {
  beforeEach(() => vi.clearAllMocks())

  it('crise vencida: aviso para procurar o médico e "a crise acabou"', async () => {
    getMock.mockResolvedValue({ conditions: [gout(day(-2))], catalog: [] })
    endFlareMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<FlareNotice />)
    expect(await screen.findByText(/procure seu médico/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /a crise acabou/i }))
    expect(endFlareMock).toHaveBeenCalledWith('g1')
    await waitFor(() => expect(screen.queryByText(/procure seu médico/i)).not.toBeInTheDocument())
  })

  it('crise dentro do prazo ou sem crise: nada', async () => {
    getMock.mockResolvedValue({ conditions: [gout(day(2)), { ...gout(null), id: 'g2' }], catalog: [] })
    const { container } = render(<FlareNotice />)
    await waitFor(() => expect(getMock).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
