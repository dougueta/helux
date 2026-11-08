import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { resolvePlannedItem } from '@helux/exercises'
import { ItemDemo } from '@/components/workout/ItemDemo'

const base = { sets: 3, reps: '10', weight: '' }
const legacyVariant = { id: 'supino-reto-barra', rec: true, name: 'Supino Reto (Barra)', equip: 'Barra', level: 'Avançado', match: 90, motion: 'press-flat', implement: 'barbell', why: '' }

describe('ItemDemo (028)', () => {
  it('nova: carrega a demonstração do catálogo sob demanda', async () => {
    const resolved = resolvePlannedItem({ ...base, name: 'Pullover (Halteres)' })
    const { container } = render(<ItemDemo resolved={resolved} playing={false} size="stage" />)
    await waitFor(() => expect(container.querySelector('[data-joint]')).not.toBeNull())
    expect(screen.getByLabelText('demonstração de Pullover (Halteres)')).toBeInTheDocument()
  })

  it('legada: usa a animação salva no plano', () => {
    const ex = { ...base, name: 'Supino Reto (Barra)', variants: [legacyVariant] }
    const { container } = render(<ItemDemo resolved={resolvePlannedItem(ex)} variant={legacyVariant} playing={false} size="stage" />)
    expect(container.querySelector('[data-motion="press-flat"]')).not.toBeNull()
  })

  it('indisponível no palco: aviso com nome e notas, sem animação', () => {
    const resolved = resolvePlannedItem({ ...base, name: 'Inventado' })
    const { container } = render(<ItemDemo resolved={resolved} notes="Devagar" playing={false} size="stage" />)
    expect(screen.getByText('Demonstração indisponível para este item')).toBeInTheDocument()
    expect(screen.getByText('Devagar')).toBeInTheDocument()
    expect(container.querySelector('[data-motion]')).toBeNull()
  })

  it('indisponível na miniatura: só o ícone neutro', () => {
    const resolved = resolvePlannedItem({ ...base, name: 'Inventado' })
    const { container } = render(<ItemDemo resolved={resolved} playing={false} size="thumb" />)
    expect(container.querySelector('[data-demo-unavailable-icon]')).not.toBeNull()
    expect(container.querySelector('[data-motion]')).toBeNull()
    expect(screen.queryByText('Demonstração indisponível para este item')).toBeNull()
  })
})
