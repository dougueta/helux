import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Spec 024 T025 — envio do laudo genético pelo Perfil.

const uploadMock = vi.fn()
const removeMock = vi.fn()
vi.mock('@/services/genetics.service', () => ({
  uploadGeneticReport: (...a: unknown[]) => uploadMock(...a),
  deleteGeneticReport: (...a: unknown[]) => removeMock(...a),
}))

import { GeneticReportUpload } from '@/components/perfil/GeneticReportUpload'

const file = (content: string) => new File([content], 'genera.json', { type: 'application/json' })

describe('GeneticReportUpload', () => {
  beforeEach(() => vi.clearAllMocks())

  it('envia o JSON escolhido e mostra quantos marcadores entraram', async () => {
    uploadMock.mockResolvedValue({ uploadedAt: '2026-10-24T12:00:00Z', traits: 7 })
    const user = userEvent.setup()
    render(<GeneticReportUpload />)
    await user.upload(screen.getByLabelText(/enviar laudo/i), file('{"fit":{}}'))
    await waitFor(() => expect(uploadMock).toHaveBeenCalledWith({ fit: {} }))
    expect(await screen.findByText(/7 marcadores/i)).toBeInTheDocument()
  })

  it('arquivo que não é JSON → erro sem chamar a API', async () => {
    const user = userEvent.setup()
    render(<GeneticReportUpload />)
    await user.upload(screen.getByLabelText(/enviar laudo/i), file('isso não é json'))
    expect(await screen.findByRole('alert')).toHaveTextContent(/json/i)
    expect(uploadMock).not.toHaveBeenCalled()
  })

  it('laudo recusado pela API → mensagem de erro', async () => {
    uploadMock.mockRejectedValue(new Error('Laudo genético inválido'))
    const user = userEvent.setup()
    render(<GeneticReportUpload />)
    await user.upload(screen.getByLabelText(/enviar laudo/i), file('{"outro":1}'))
    expect(await screen.findByRole('alert')).toHaveTextContent(/inválido/i)
  })

  it('remove o laudo', async () => {
    removeMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    render(<GeneticReportUpload />)
    await user.click(screen.getByRole('button', { name: /remover laudo/i }))
    expect(removeMock).toHaveBeenCalled()
    expect(await screen.findByText(/laudo removido/i)).toBeInTheDocument()
  })
})
