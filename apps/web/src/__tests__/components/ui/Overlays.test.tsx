import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Sheet } from '@/components/ui/Sheet'
import { Dialog } from '@/components/ui/Dialog'
import { Toast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'

function SheetHarness({ onClose }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>abrir</button>
      <Sheet
        open={open}
        onClose={() => { onClose?.(); setOpen(false) }}
        label="Execução do exercício"
        footer={<Button kind="secondary" size="lg" block onClick={() => setOpen(false)}>Fechar</Button>}
      >
        <p>conteúdo</p>
      </Sheet>
    </>
  )
}

describe('Sheet', () => {
  it('fechada não renderiza', () => {
    render(<Sheet open={false} onClose={() => {}} label="x"><p>c</p></Sheet>)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('dialog modal com rótulo, via portal no body', () => {
    const { container } = render(<Sheet open onClose={() => {}} label="Execução do exercício"><p>c</p></Sheet>)
    const d = screen.getByRole('dialog', { name: 'Execução do exercício' })
    expect(d).toHaveAttribute('aria-modal', 'true')
    expect(d).toHaveClass('hx-sheet')
    expect(container.contains(d)).toBe(false)
    expect(document.body.contains(d)).toBe(true)
    expect(document.querySelector('.hx-sheet-h')).not.toBeNull()
  })

  it('scrim e Esc fecham', () => {
    const onClose = vi.fn()
    render(<Sheet open onClose={onClose} label="x"><p>c</p></Sheet>)
    fireEvent.click(document.querySelector('.hx-scrim')!)
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('foco vai para a folha ao abrir e volta ao gatilho ao fechar', () => {
    render(<SheetHarness />)
    const trigger = screen.getByRole('button', { name: 'abrir' })
    trigger.focus()
    fireEvent.click(trigger)
    const d = screen.getByRole('dialog')
    expect(d.contains(document.activeElement)).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('rodapé fixo', () => {
    render(<SheetHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'abrir' }))
    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveClass('hx-btn--secondary', 'hx-btn--lg')
  })
})

describe('Dialog', () => {
  it('dialog modal com título, ações empilhadas, scrim e Esc', () => {
    const onClose = vi.fn()
    render(
      <Dialog
        open
        onClose={onClose}
        title="Finalizar treino?"
        actions={<><Button kind="danger" block>Finalizar mesmo assim</Button><Button kind="ghost" block>Continuar treinando</Button></>}
      >
        <p>Há exercícios sem séries.</p>
      </Dialog>,
    )
    const d = screen.getByRole('dialog', { name: 'Finalizar treino?' })
    expect(d).toHaveAttribute('aria-modal', 'true')
    expect(d).toHaveClass('hx-dialog')
    expect(d.contains(document.activeElement)).toBe(true)
    const actions = screen.getByRole('button', { name: 'Finalizar mesmo assim' }).parentElement!
    expect(actions.style.flexDirection).toBe('column')
    fireEvent.click(document.querySelector('.hx-scrim')!)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('alertdialog quando pedido', () => {
    render(<Dialog open onClose={() => {}} title="T" role="alertdialog" actions={null}>x</Dialog>)
    expect(screen.getByRole('alertdialog', { name: 'T' })).toBeInTheDocument()
  })

  it('fechado não renderiza', () => {
    render(<Dialog open={false} onClose={() => {}} title="T" actions={null}>x</Dialog>)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})

describe('Toast', () => {
  it('status com ação', () => {
    const onAction = vi.fn()
    render(<Toast message="Série removida" actionLabel="Desfazer" onAction={onAction} />)
    const t = screen.getByRole('status')
    expect(t).toHaveClass('hx-toast')
    expect(t).toHaveTextContent('Série removida')
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }))
    expect(onAction).toHaveBeenCalled()
  })

  it('erro vira alert', () => {
    render(<Toast message="Falhou" kind="err" />)
    expect(screen.getByRole('alert')).toHaveClass('hx-toast', 'hx-toast--err')
  })
})
