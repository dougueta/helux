import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { NutriMarker } from '@helux/types'

const getGeneticProfileMock = vi.fn()
vi.mock('@/services/nutrition.service', () => ({ getGeneticProfile: () => getGeneticProfileMock() }))

import { NutriProfile } from '@/components/nutrition/NutriProfile'

const MARKERS: NutriMarker[] = [
  {
    gene: 'MCM6',
    genotype: 'G,G',
    label: 'Intolerância à lactose',
    result: 'Intolerante',
    category: 'metabolismo-sensibilidades',
    status: 'atencao',
    conduct: { recommend: ['Leites vegetais ou zero lactose'], avoid: ['Leite e queijos frescos com lactose'] },
  },
  { gene: 'ADORA2A', genotype: 'C,G', label: 'Ansiedade por cafeína', result: 'Baixa', category: 'metabolismo-sensibilidades', status: 'favoravel' },
  { gene: 'GC', genotype: 'A,C', label: 'Vitamina D', result: 'Risco de níveis baixos', category: 'micronutrientes-vitaminas', status: 'atencao' },
  { gene: 'ACTN3', genotype: 'C,C', label: 'Potência', result: 'Fibras rápidas', category: 'perfil-muscular-dieta', status: 'favoravel' },
]

describe('NutriProfile (spec 018, US4)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('3 grupos com os cards e o status em palavra', async () => {
    getGeneticProfileMock.mockResolvedValue({ active: true, markers: MARKERS })
    render(<NutriProfile />)

    const meta = await screen.findByRole('region', { name: /metabolismo & sensibilidades/i })
    expect(within(meta).getByText('MCM6')).toBeInTheDocument()
    expect(within(meta).getByText('ADORA2A')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /micronutrientes & vitaminas/i })).toHaveTextContent('GC')
    expect(screen.getByRole('region', { name: /perfil muscular & dieta/i })).toHaveTextContent('ACTN3')

    const mcm6 = screen.getByRole('button', { name: /MCM6/ })
    expect(within(mcm6).getByText('atenção')).toBeInTheDocument()
    expect(within(screen.getByRole('button', { name: /ADORA2A/ })).getByText('favorável')).toBeInTheDocument()
  })

  it('tocar no card abre a conduta (recomendar / evitar)', async () => {
    getGeneticProfileMock.mockResolvedValue({ active: true, markers: MARKERS })
    const user = userEvent.setup()
    render(<NutriProfile />)
    await user.click(await screen.findByRole('button', { name: /MCM6/ }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText(/Leites vegetais ou zero lactose/)).toBeInTheDocument()
    expect(within(dialog).getByText(/Leite e queijos frescos com lactose/)).toBeInTheDocument()
  })

  it('perfil genético não carregado', async () => {
    getGeneticProfileMock.mockResolvedValue({ active: false, markers: [] })
    render(<NutriProfile />)
    expect(await screen.findByText(/perfil genético não carregado/i)).toBeInTheDocument()
  })

  it('erro ao carregar', async () => {
    getGeneticProfileMock.mockRejectedValue(new Error('x'))
    render(<NutriProfile />)
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
