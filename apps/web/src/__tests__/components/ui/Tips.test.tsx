import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { Tips } from '@/components/ui/Tips'
import { Steps } from '@/components/ui/Steps'

const REFERENCE =
  'Desça até paralelo ou abaixo — carga óssea controlada favorece densidade (WNT16). ' +
  'Joelhos alinhados com os dedos dos pés; evite valgismo para proteger o ligamento cruzado (COL1A1 C,C). ' +
  'Descanso 90-120s entre séries.'

describe('Tips', () => {
  it.each([[''], ['   '], [null], [undefined]])('nada com texto vazio (%j)', text => {
    const { container } = render(<Tips text={text as string | null | undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('ul.hx-tips com um li por orientação', () => {
    render(<Tips text={REFERENCE} />)
    const list = screen.getByRole('list')
    expect(list.tagName).toBe('UL')
    expect(list).toHaveClass('hx-tips')
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(4)
    expect(items[1]).toHaveTextContent('Joelhos alinhados com os dedos dos pés')
  })

  it('item com gene: li.is-gene e GeneTag warn abaixo do texto', () => {
    render(<Tips text={REFERENCE} />)
    const items = screen.getAllByRole('listitem')
    expect(items[2]).toHaveClass('is-gene')
    const tag = within(items[2]).getByLabelText('marcador genético COL1A1 C,C')
    expect(tag).toHaveClass('hx-gtag--warn')
    expect(items[1]).not.toHaveClass('is-gene')
    expect(within(items[1]).queryByLabelText(/marcador genético/)).toBeNull()
  })

  it('1 item continua sendo lista', () => {
    render(<Tips text="Priorize a fase excêntrica (ACTN3 R,X)." />)
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Priorize a fase excêntrica')).toBeInTheDocument()
  })

  it('nunca mostra "ATENÇÃO"', () => {
    render(<Tips text="ATENÇÃO: alerta COL1A1 C,C indica risco. Desça devagar." />)
    expect(screen.queryByText(/ATENÇÃO/)).toBeNull()
  })
})

describe('Steps', () => {
  it('ol.hx-steps e "Erro comum" com is-warn e prefixo', () => {
    render(<Steps items={[{ text: 'Desça' }, { text: 'deixar os joelhos colapsarem', warn: true }]} />)
    const list = screen.getByRole('list')
    expect(list.tagName).toBe('OL')
    expect(list).toHaveClass('hx-steps')
    const items = within(list).getAllByRole('listitem')
    expect(items[0]).not.toHaveClass('is-warn')
    expect(items[1]).toHaveClass('is-warn')
    expect(items[1]).toHaveTextContent('Erro comum: deixar os joelhos colapsarem')
    expect(within(items[1]).getByText('Erro comum:')).toHaveStyle({ color: 'var(--warn)' })
  })
})
