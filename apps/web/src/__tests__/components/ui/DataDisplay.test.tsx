import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Banner } from '@/components/ui/Banner'
import { Bars } from '@/components/ui/Bars'
import { HistoryRow } from '@/components/ui/HistoryRow'
import { PRRow } from '@/components/ui/PRRow'
import { Skeleton } from '@/components/ui/Skeleton'

describe('Banner', () => {
  it('err é alert, com ícone, título e texto', () => {
    const { container } = render(<Banner kind="err" title="Não foi possível salvar">Sem conexão.</Banner>)
    const b = screen.getByRole('alert')
    expect(b).toHaveClass('hx-banner', 'hx-banner--err')
    expect(container.querySelector('svg')).not.toBeNull()
    expect(b).toHaveTextContent('Não foi possível salvar')
    expect(b).toHaveTextContent('Sem conexão.')
  })

  it('warn é status e aceita ação', () => {
    render(<Banner kind="warn" title="Dados antigos" action={<button>Sincronizar</button>}>Última leitura ontem.</Banner>)
    expect(screen.getByRole('status')).toHaveClass('hx-banner--warn')
    expect(screen.getByRole('button', { name: 'Sincronizar' })).toBeInTheDocument()
  })
})

describe('Bars', () => {
  it('img com aria-label dos valores e a semana atual em destaque', () => {
    const { container } = render(
      <Bars data={[{ label: '9/9', value: 16.2 }, { label: '16/9', value: 17.4 }]} currentIndex={1} />,
    )
    const img = screen.getByRole('img')
    expect(img).toHaveClass('hx-bars')
    expect(img.getAttribute('aria-label')).toBe('volume semanal: 9/9 16,2 t, 16/9 17,4 t')
    const bars = container.querySelectorAll('.hx-bar')
    expect(bars[1]).toHaveClass('cur')
    expect(bars[0]).not.toHaveClass('cur')
  })

  it('sem dados, sem barras', () => {
    const { container } = render(<Bars data={[]} />)
    expect(container.querySelectorAll('.hx-bar')).toHaveLength(0)
  })
})

describe('HistoryRow', () => {
  it('link com volume mono pt-BR, séries e duração', () => {
    render(<HistoryRow href="/history/1" name="Treino C" date="Segunda, 21 de set." sets={19} durationMin={52} volumeT={12.64} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/history/1')
    expect(link).toHaveClass('hx-row-btn')
    expect(link).toHaveTextContent('Treino C')
    expect(screen.getByText('12,6')).toHaveClass('n-md')
    expect(link).toHaveTextContent('19 séries, 52 min')
  })

  it('sem duração não inventa minutos', () => {
    render(<HistoryRow href="/h" name="T" date="d" sets={3} durationMin={null} volumeT={1} />)
    expect(screen.getByRole('link')).toHaveTextContent('3 séries')
    expect(screen.getByRole('link')).not.toHaveTextContent('min')
  })
})

describe('PRRow', () => {
  it('acento só com fresh', () => {
    const { rerender } = render(<PRRow lift="Supino" kg={80} reps={6} delta="+2,5 kg" when="Há 9 dias" />)
    expect(screen.getByText('+2,5 kg').style.color).toBe('var(--text-dim)')
    rerender(<PRRow lift="Supino" kg={80} reps={6} delta="+2,5 kg" when="Há 9 dias" fresh />)
    expect(screen.getByText('+2,5 kg').style.color).toBe('var(--accent)')
  })

  it('kg em pt-BR e reps', () => {
    const { container } = render(<PRRow lift="Leg Press" kg={82.5} reps={10} />)
    expect(screen.getByText('Leg Press')).toBeInTheDocument()
    expect(container.querySelector('.n-md')).toHaveTextContent('82,5kg')
    expect(screen.getByText('× 10')).toBeInTheDocument()
  })
})

describe('Skeleton', () => {
  it('hx-sk, aria-hidden e medidas', () => {
    const { container } = render(<Skeleton w={150} h={14} r={999} style={{ marginTop: 16 }} />)
    const sk = container.firstChild as HTMLElement
    expect(sk).toHaveClass('hx-sk')
    expect(sk).toHaveAttribute('aria-hidden', 'true')
    expect(sk.style.width).toBe('150px')
    expect(sk.style.height).toBe('14px')
    expect(sk.style.borderRadius).toBe('999px')
    expect(sk.style.marginTop).toBe('16px')
  })

  it('largura total por padrão', () => {
    const { container } = render(<Skeleton h={10} />)
    expect((container.firstChild as HTMLElement).style.width).toBe('100%')
  })
})
