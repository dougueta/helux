'use client'

import { useState, type ChangeEvent } from 'react'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { deleteGeneticReport, uploadGeneticReport } from '@/services/genetics.service'

/** Conteúdo do arquivo (FileReader: funciona também onde `File.text()` não existe). */
function readText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

type State = { kind: 'idle' } | { kind: 'busy' } | { kind: 'ok'; message: string } | { kind: 'error'; message: string }

/**
 * Envio do laudo genético (spec 024, R14): o JSON do Genera fica na conta do
 * usuário, protegido, e passa a valer para os agentes.
 */
export function GeneticReportUpload() {
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0]
    event.target.value = ''
    if (!chosen) return
    let report: unknown
    try {
      report = JSON.parse(await readText(chosen))
    } catch {
      setState({ kind: 'error', message: 'O arquivo precisa ser o JSON do laudo Genera.' })
      return
    }
    setState({ kind: 'busy' })
    try {
      const { traits } = await uploadGeneticReport(report)
      setState({ kind: 'ok', message: `Laudo enviado: ${traits} marcadores de treino.` })
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'Não foi possível enviar o laudo.' })
    }
  }

  async function onRemove() {
    setState({ kind: 'busy' })
    try {
      await deleteGeneticReport()
      setState({ kind: 'ok', message: 'Laudo removido da sua conta.' })
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'Não foi possível remover o laudo.' })
    }
  }

  return (
    <section className="hx-card" style={{ marginTop: 20, padding: 16 }}>
      <p className="t-body-m">Laudo genético</p>
      <p className="t-secondary" style={{ marginTop: 4 }}>
        O JSON do Genera fica só na sua conta. Os agentes usam a genética como ajuste fino.
      </p>
      <label className="t-body-m" style={{ display: 'block', marginTop: 12 }}>
        Enviar laudo (JSON)
        <input type="file" accept="application/json,.json" onChange={onFile} disabled={state.kind === 'busy'} style={{ display: 'block', marginTop: 8 }} />
      </label>
      {state.kind === 'ok' && (
        <p className="t-secondary" role="status" style={{ marginTop: 10 }}>
          {state.message}
        </p>
      )}
      {state.kind === 'error' && (
        <div style={{ marginTop: 10 }}>
          <Banner kind="err" title={state.message} />
        </div>
      )}
      <div style={{ marginTop: 12 }}>
        <Button kind="ghost" onClick={onRemove} loading={state.kind === 'busy'}>
          Remover laudo
        </Button>
      </div>
    </section>
  )
}
