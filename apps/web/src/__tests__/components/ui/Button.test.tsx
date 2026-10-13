import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button, IconButton } from '@/components/ui/Button'

describe('Button', () => {
  it('é primary/md por padrão, com type="button"', () => {
    render(<Button>Iniciar</Button>)
    const b = screen.getByRole('button', { name: 'Iniciar' })
    expect(b).toHaveClass('hx-btn', 'hx-btn--primary')
    expect(b).not.toHaveClass('hx-btn--lg')
    expect(b).toHaveAttribute('type', 'button')
  })

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)('variante %s', kind => {
    render(<Button kind={kind}>X</Button>)
    expect(screen.getByRole('button')).toHaveClass(`hx-btn--${kind}`)
  })

  it('tamanho lg e bloco', () => {
    render(<Button size="lg" block>X</Button>)
    expect(screen.getByRole('button')).toHaveClass('hx-btn--lg', 'hx-btn--block')
  })

  it('carregando: aria-busy, is-loading e sem efeito ao clicar', () => {
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>Salvar</Button>)
    const b = screen.getByRole('button')
    expect(b).toHaveAttribute('aria-busy', 'true')
    expect(b).toHaveClass('is-loading')
    fireEvent.click(b)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('desabilitado', () => {
    render(<Button disabled>X</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('primary com iconRight="play" coloca o play num círculo', () => {
    const { container } = render(<Button iconRight="play">Iniciar treino</Button>)
    const circle = container.querySelector('.hx-btn-ico')
    expect(circle).not.toBeNull()
    expect(circle!.querySelector('svg')).toHaveAttribute('fill', 'currentColor')
  })

  it('ícone à esquerda sem círculo', () => {
    const { container } = render(<Button kind="ghost" icon="plus">Adicionar série</Button>)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container.querySelector('.hx-btn-ico')).toBeNull()
  })
})

describe('IconButton', () => {
  it('exige aria-label e usa a classe de 44×44', () => {
    render(<IconButton icon="close" label="encerrar treino" />)
    const b = screen.getByRole('button', { name: 'encerrar treino' })
    expect(b).toHaveClass('hx-icbtn')
    expect(b).not.toHaveClass('hx-icbtn--bare')
  })

  it('bare', () => {
    render(<IconButton icon="back" label="voltar" bare />)
    expect(screen.getByRole('button', { name: 'voltar' })).toHaveClass('hx-icbtn', 'hx-icbtn--bare')
  })

  it('repassa onClick', () => {
    const onClick = vi.fn()
    render(<IconButton icon="timer" label="cronômetro" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
