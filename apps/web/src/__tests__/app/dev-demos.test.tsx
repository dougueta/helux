import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { Pose, ResolvedDemo } from '@helux/exercises'
import type { GalleryItem } from '@/lib/demo-gallery'

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

const STAND: Pose = { head: [110, 50], sh: [110, 70], el: [110, 100], ha: [110, 128], hip: [110, 130], kn: [110, 170], an: [110, 210], toe: [128, 210] }
const DOWN: Pose = { ...STAND, el: [128, 101], ha: [156, 101] }
const demo = (id: string): ResolvedDemo => ({
  id, view: 'side', mirror: false, loop: 'reps', durationMs: 2000, root: 'foot', fixed: ['an'],
  keyframes: [{ at: 0, pose: STAND }, { at: 1, pose: DOWN }], gear: 'halteres', scene: 'solo', implementAt: 'ha',
})

const ITEMS: GalleryItem[] = [
  { id: 'pullover-halteres', name: 'Pullover (Halteres)', kind: 'forca', pending: true, demo: demo('pullover-halteres'),
    guidance: { setup: ['Deite no banco'], steps: ['Leve o halter atrás da cabeça'], commonError: 'Dobrar demais os cotovelos', context: 'Boa opção para dorsal' } },
  { id: 'rosca-direta-barra', name: 'Rosca Direta (Barra)', kind: 'forca', pending: true, demo: null, guidance: null },
  { id: 'gato-camelo', name: 'Gato-camelo', kind: 'preparacao', pending: false, demo: demo('gato-camelo'),
    guidance: { setup: ['Quatro apoios'], steps: ['Arredonde e estenda a coluna'] } },
  { id: 'bike', name: 'Bike ergométrica', kind: 'cardio', pending: true, demo: null, guidance: null },
]

vi.mock('@/lib/demo-gallery', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/demo-gallery')>()
  return { ...actual, galleryItems: () => ITEMS }
})

import DevDemosPage from '@/app/dev/demos/page'

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

const renderPage = (searchParams: Record<string, string> = {}) => render(DevDemosPage({ searchParams }))

describe('/dev/demos (028, FR-024)', () => {
  it('em produção responde notFound()', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(() => DevDemosPage({ searchParams: {} })).toThrow('NEXT_NOT_FOUND')
  })

  it('lista todos os catálogos com situação e orientações', () => {
    renderPage()
    for (const item of ITEMS) expect(screen.getByRole('heading', { name: item.name })).toBeInTheDocument()
    const pullover = screen.getByTestId('demo-card-pullover-halteres')
    expect(within(pullover).getByText('Pendente')).toBeInTheDocument()
    expect(within(pullover).getByText('Deite no banco')).toBeInTheDocument()
    expect(within(pullover).getByText('Leve o halter atrás da cabeça')).toBeInTheDocument()
    expect(within(pullover).getByText('Dobrar demais os cotovelos')).toBeInTheDocument()
    expect(within(pullover).getByText('Boa opção para dorsal')).toBeInTheDocument()
    expect(within(pullover).getByLabelText('demonstração de Pullover (Halteres)')).toBeInTheDocument()
    expect(within(screen.getByTestId('demo-card-gato-camelo')).getByText('Aprovado')).toBeInTheDocument()
    expect(within(screen.getByTestId('demo-card-rosca-direta-barra')).getByText('Sem demonstração')).toBeInTheDocument()
  })

  it('mostra a cobertura aprovados/total por catálogo', () => {
    renderPage()
    expect(screen.getByText('Força: 0/2')).toBeInTheDocument()
    expect(screen.getByText('Preparação: 1/1')).toBeInTheDocument()
    expect(screen.getByText('Cardio: 0/1')).toBeInTheDocument()
  })

  it('filtra por catálogo', () => {
    renderPage({ kind: 'cardio' })
    expect(screen.getByRole('heading', { name: 'Bike ergométrica' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Gato-camelo' })).toBeNull()
  })

  it('filtra só pendentes', () => {
    renderPage({ pending: '1' })
    expect(screen.queryByRole('heading', { name: 'Gato-camelo' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Pullover (Halteres)' })).toBeInTheDocument()
  })

  it('ids restringe aos itens pedidos, na ordem pedida', () => {
    renderPage({ ids: 'gato-camelo,pullover-halteres' })
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(['Gato-camelo', 'Pullover (Halteres)'])
  })

  it('phase fixa o quadro de todas as demonstrações', () => {
    const { container } = renderPage({ ids: 'pullover-halteres', phase: '0.5' })
    expect(requestAnimationFrame).not.toHaveBeenCalled()
    const hand = container.querySelector('[data-joint="ha"]')!
    expect([hand.getAttribute('cx'), hand.getAttribute('cy')]).toEqual(['156', '101'])
  })

  it('frame=1 mostra só o cartão do item, em 390 × 844, sem filtros nem cobertura', () => {
    renderPage({ ids: 'pullover-halteres', frame: '1', phase: '0' })
    const card = screen.getByTestId('demo-card-pullover-halteres')
    expect(card.closest('[data-frame]')).toHaveStyle({ width: '390px', height: '844px', position: 'fixed' })
    expect(screen.queryByText(/^Força:/)).toBeNull()
    expect(screen.queryByRole('navigation')).toBeNull()
  })

  it('frame=1&card=1 mostra o cartão de revisão: nome, início, meio e fim, e orientações', () => {
    const { container } = renderPage({ ids: 'pullover-halteres', frame: '1', card: '1' })
    expect(screen.getByRole('heading', { name: 'Pullover (Halteres)' })).toBeInTheDocument()
    for (const label of ['início', 'meio', 'fim']) expect(screen.getByLabelText(`demonstração de Pullover (Halteres), ${label}`)).toBeInTheDocument()
    expect(screen.getByText('Leve o halter atrás da cabeça')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Dobrar demais os cotovelos')
    expect(requestAnimationFrame).not.toHaveBeenCalled()
    expect(container.querySelector('[data-frame]')).toHaveStyle({ width: '390px', height: '844px' })
  })
})
