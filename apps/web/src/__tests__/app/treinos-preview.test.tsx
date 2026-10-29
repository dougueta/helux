import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { planWith } from './_planFixture'

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }))
vi.mock('@/services/api-client', async importOriginal => ({
  ...(await importOriginal<typeof import('@/services/api-client')>()),
  apiFetch: vi.fn(() => Promise.resolve({})),
}))
vi.mock('@/hooks/useWorkoutPlan', () => ({
  useWorkoutPlan: () => ({ plan: planWith(), loading: false, generating: false, refetch: vi.fn() }),
}))
vi.mock('@/hooks/useActiveWorkout', () => ({
  useActiveWorkout: () => ({ isActive: false, loaded: true, startWorkout: vi.fn() }),
}))

import { TreinosClient } from '@/app/treinos/TreinosClient'

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})

describe('TreinosClient — preview (spec 026, FR-016)', () => {
  it('tem "Ver treino completo" para o preview e mantém Iniciar/Editar', () => {
    render(<TreinosClient plan={null} recentSessions={[]} />)
    expect(screen.getByRole('link', { name: 'Ver treino completo' })).toHaveAttribute('href', '/treinos/proximo')
    expect(screen.getByRole('button', { name: 'Iniciar treino' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'editar Supino Reto' })).toBeInTheDocument()
  })

  it('tocar num exercício da lista abre a execução só leitura', async () => {
    const user = userEvent.setup()
    render(<TreinosClient plan={null} recentSessions={[]} />)
    await user.click(screen.getByRole('button', { name: /^ver execução de Supino Reto/ }))
    expect(screen.getByRole('dialog', { name: 'Execução do exercício' })).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Variantes (2)' }))
    expect(screen.queryByRole('button', { name: /^Trocar/ })).not.toBeInTheDocument()
  })
})
