import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { planWith, tirednessStub } from './_planFixture'

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), push: vi.fn() }) }))
vi.mock('@/services/api-client', async importOriginal => ({
  ...(await importOriginal<typeof import('@/services/api-client')>()),
  apiFetch: vi.fn(() => Promise.resolve({})),
}))
const hooks = vi.hoisted(() => ({ plan: null as unknown }))
vi.mock('@/hooks/useWorkoutPlan', () => ({
  useWorkoutPlan: () => ({ plan: hooks.plan, loading: false, generating: false, refetch: vi.fn() }),
}))
vi.mock('@/hooks/useActiveWorkout', () => ({
  useActiveWorkout: () => ({ isActive: false, loaded: true, startWorkout: vi.fn() }),
}))
vi.mock('@/hooks/useTirednessFlow', () => ({ useTirednessFlow: () => tirednessStub() }))

import { HomeClient } from '@/app/HomeClient'

beforeEach(() => {
  hooks.plan = planWith()
})

describe('HomeClient — "Ver treino" (spec 026, FR-009)', () => {
  it('com próximo treino, mostra "Ver treino" para o preview junto de "Iniciar treino"', () => {
    render(<HomeClient plan={null} firstName="Doug" checkins={[]} analytics={null} />)
    expect(screen.getByRole('button', { name: 'Iniciar treino' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver treino' })).toHaveAttribute('href', '/treinos/proximo?de=home')
  })

  it('sem plano, não mostra "Ver treino"', () => {
    hooks.plan = null
    render(<HomeClient plan={null} firstName="Doug" checkins={[]} analytics={null} />)
    expect(screen.getByRole('button', { name: 'Gerar meu plano' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ver treino' })).not.toBeInTheDocument()
  })
})
