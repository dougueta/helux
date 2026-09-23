import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ExecutionTips } from '@/components/workout/ExecutionTips'

const REFERENCE =
  'Desça até paralelo ou abaixo — carga óssea controlada favorece densidade (WNT16). ' +
  'Joelhos alinhados com os dedos dos pés; evite valgismo para proteger o ligamento cruzado (COL1A1 C,C). ' +
  'Descanso 90-120s entre séries.'

describe('ExecutionTips', () => {
  it.each([[''], ['   '], [null], [undefined]])('não renderiza nada com texto vazio (%j)', (text) => {
    const { container } = render(<ExecutionTips text={text as string | null | undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('com 1 orientação, mostra o texto sem marcador de lista', () => {
    render(<ExecutionTips text="Cargas altas — seu forte" />)
    expect(screen.getByText('Cargas altas — seu forte')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('com 2 ou mais orientações, mostra uma lista com um item por orientação', () => {
    render(<ExecutionTips text={REFERENCE} />)
    const list = screen.getByRole('list')
    expect(list.tagName).toBe('UL')
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(items[0]).toHaveTextContent('Desça até paralelo ou abaixo — carga óssea controlada favorece densidade')
    expect(items[1]).toHaveTextContent('Joelhos alinhados com os dedos dos pés')
    expect(items[3]).toHaveTextContent('Descanso 90-120s entre séries')
  })

  it('mostra cada marcador genético como etiqueta acessível junto ao item', () => {
    render(<ExecutionTips text={REFERENCE} />)
    const items = screen.getAllByRole('listitem')
    expect(within(items[0]).getByLabelText('marcador genético WNT16')).toHaveTextContent('WNT16')
    expect(within(items[2]).getByLabelText('marcador genético COL1A1 C,C')).toHaveTextContent('COL1A1 C,C')
    expect(within(items[1]).queryByLabelText(/marcador genético/)).not.toBeInTheDocument()
  })

  it('mostra o marcador também quando há uma orientação só', () => {
    render(<ExecutionTips text="Priorize a fase excêntrica (ACTN3 R,X)." />)
    expect(screen.getByText('Priorize a fase excêntrica')).toBeInTheDocument()
    expect(screen.getByLabelText('marcador genético ACTN3 R,X')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('tem os visuais inline (padrão) e panel', () => {
    const { container, rerender } = render(<ExecutionTips text="Uma dica" />)
    expect(container.firstChild).toHaveAttribute('data-variant', 'inline')
    rerender(<ExecutionTips text="Uma dica" variant="panel" />)
    expect(container.firstChild).toHaveAttribute('data-variant', 'panel')
  })
})
