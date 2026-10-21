import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DevBar } from '@/components/dev/DevBar'
import { getDataSource, getPersonaId, setDataSource } from '@/lib/data-source'
import { MOCK_STATE_KEY } from '@/mocks/mock-store'

const reload = vi.fn()

function clearCookies() {
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0].trim()
    if (name) document.cookie = `${name}=; path=/; max-age=0`
  }
}

describe('DevBar (021 US3–US5)', () => {
  beforeEach(() => {
    clearCookies()
    localStorage.clear()
    reload.mockReset()
    vi.restoreAllMocks()
    Object.defineProperty(window, 'location', { configurable: true, value: { ...window.location, reload } })
  })

  it('mostra o modo atual e alterna para mock com recarga', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DevBar onDataSourceChange={onChange} />)
    expect(screen.getByText('Real data')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /usar dados mockados/i }))
    expect(getDataSource()).toBe('mock')
    expect(onChange).toHaveBeenCalledWith('mock')
    expect(reload).toHaveBeenCalled()
  })

  it('em mock mostra o estado, a persona e o reset', async () => {
    setDataSource('mock')
    render(<DevBar />)
    expect(screen.getByText('Mock data')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /persona/i })).toHaveValue('standard-athlete')
    expect(screen.getByRole('button', { name: /resetar dados de teste/i })).toBeInTheDocument()
  })

  it('recolhida mostra só o selo do modo', async () => {
    const user = userEvent.setup()
    render(<DevBar initialCollapsed />)
    expect(screen.queryByRole('button', { name: /usar dados/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /abrir a dev bar/i }))
    expect(screen.getByRole('button', { name: /usar dados mockados/i })).toBeInTheDocument()
  })

  it('formulário com alterações: pede confirmação antes de trocar', async () => {
    const user = userEvent.setup()
    const form = document.createElement('form')
    form.dataset.dirty = 'true'
    document.body.appendChild(form)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<DevBar />)
    await user.click(screen.getByRole('button', { name: /usar dados mockados/i }))
    expect(confirm).toHaveBeenCalled()
    expect(getDataSource()).toBe('real')
    form.remove()
  })

  it('reset (US4): restaura as fixtures, avisa e recarrega', async () => {
    setDataSource('mock')
    localStorage.setItem(MOCK_STATE_KEY, JSON.stringify({ version: 1, personaId: 'standard-athlete', dataset: { profile: null }, updatedAt: '' }))
    const user = userEvent.setup()
    const listener = vi.fn()
    window.addEventListener('helux:mock-reset', listener)
    render(<DevBar />)
    await user.click(screen.getByRole('button', { name: /resetar dados de teste/i }))
    const saved = JSON.parse(localStorage.getItem(MOCK_STATE_KEY)!)
    expect(saved.dataset.profile).not.toBeNull()
    expect((listener.mock.calls[0][0] as CustomEvent).detail).toEqual({ personaId: 'standard-athlete' })
    expect(reload).toHaveBeenCalled()
    window.removeEventListener('helux:mock-reset', listener)
  })

  it('persona (US5): troca, grava o cookie e o dataset, e recarrega', async () => {
    setDataSource('mock')
    const user = userEvent.setup()
    render(<DevBar />)
    await user.selectOptions(screen.getByRole('combobox', { name: /persona/i }), 'zero-state')
    expect(getPersonaId()).toBe('zero-state')
    expect(JSON.parse(localStorage.getItem(MOCK_STATE_KEY)!).personaId).toBe('zero-state')
    expect(reload).toHaveBeenCalled()
  })

  it('estado local corrompido: avisa que voltou para as fixtures', () => {
    setDataSource('mock')
    localStorage.setItem(MOCK_STATE_KEY, '{oops')
    render(<DevBar />)
    expect(screen.getByRole('status')).toHaveTextContent(/dados de teste corrompidos/i)
  })
})
