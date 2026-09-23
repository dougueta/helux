import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '@/components/ui/Card'

describe('Card', () => {
  it('renderiza os filhos', () => {
    render(<Card>Conteúdo</Card>)
    expect(screen.getByText('Conteúdo')).toBeInTheDocument()
  })

  it('aplica superfície, borda, raio e padding padrão do tema', () => {
    render(<Card data-testid="card">x</Card>)
    const style = screen.getByTestId('card').getAttribute('style') ?? ''
    expect(style).toContain('background: var(--surface-1)')
    expect(style).toContain('var(--hairline)')
    expect(style).toContain('border-radius: var(--r-card)')
    expect(style).toContain('padding: 16px')
  })

  it('aceita padding customizado', () => {
    render(<Card data-testid="card" padding={24}>x</Card>)
    expect(screen.getByTestId('card').getAttribute('style')).toContain('padding: 24px')
  })

  it('mescla o style recebido por último', () => {
    render(<Card data-testid="card" style={{ padding: 4, marginTop: 8 }}>x</Card>)
    const style = screen.getByTestId('card').getAttribute('style') ?? ''
    expect(style).toContain('padding: 4px')
    expect(style).toContain('margin-top: 8px')
  })

  it('respeita a prop as', () => {
    render(<Card data-testid="card" as="section">x</Card>)
    expect(screen.getByTestId('card').tagName).toBe('SECTION')
  })

  it('usa div por padrão', () => {
    render(<Card data-testid="card">x</Card>)
    expect(screen.getByTestId('card').tagName).toBe('DIV')
  })
})
