'use client'

import { useEffect, useState } from 'react'
import { Banner } from '@/components/ui/Banner'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { sessionDateLabel } from '@/lib/sessionSummary'
import { confirmSession, deleteSession, getSessionsToReview, type ReviewSession } from '@/services/session-checkins.service'

/**
 * Revisar treinos suspeitos (spec 024, R9): sessões curtas ou sem séries ficam
 * fora da progressão até o usuário confirmar que são reais ou excluí-las.
 */
export function ReviewSessions() {
  const [sessions, setSessions] = useState<ReviewSession[]>([])
  const [deleting, setDeleting] = useState<ReviewSession | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getSessionsToReview()
      .then(setSessions)
      .catch(() => setSessions([]))
  }, [])

  if (sessions.length === 0) return null

  const drop = (id: string) => setSessions(list => list.filter(s => s.id !== id))

  async function confirm(id: string) {
    setBusy(true)
    try {
      await confirmSession(id)
      drop(id)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!deleting) return
    setBusy(true)
    try {
      await deleteSession(deleting.id)
      drop(deleting.id)
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  const n = sessions.length
  return (
    <section style={{ marginTop: 24 }} aria-label="revisar treinos">
      <Banner kind="warn" title={n === 1 ? '1 treino parece teste' : `${n} treinos parecem testes`}>
        Eles ficam fora da progressão de carga até você dizer se são reais.
      </Banner>
      <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0 }}>
        {sessions.map(s => (
          <li key={s.id} style={{ padding: '12px 0', borderTop: '1px solid var(--hairline)' }}>
            <div className="t-body">{sessionDateLabel(s.date)}</div>
            <div className="t-secondary" style={{ marginTop: 2 }}>
              {s.reasons.join(' · ')}
              {s.exercises.length > 0 ? ` · ${s.exercises.join(', ')}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Button kind="secondary" disabled={busy} onClick={() => { void confirm(s.id) }}>
                É real
              </Button>
              <Button kind="ghost" disabled={busy} onClick={() => setDeleting(s)}>
                Excluir
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Dialog
        open={!!deleting}
        role="alertdialog"
        onClose={() => setDeleting(null)}
        title="Excluir este treino?"
        actions={
          <>
            <Button kind="primary" block loading={busy} onClick={() => { void remove() }}>
              Excluir
            </Button>
            <Button kind="ghost" block disabled={busy} onClick={() => setDeleting(null)}>
              Cancelar
            </Button>
          </>
        }
      >
        {deleting ? `O treino de ${sessionDateLabel(deleting.date)} sai do histórico de vez.` : null}
      </Dialog>
    </section>
  )
}
