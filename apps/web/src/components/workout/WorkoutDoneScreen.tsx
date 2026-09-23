'use client'

import type { CSSProperties } from 'react'
import { Icon } from '@/components/ui/icons'
import { Ring } from '@/components/ui/Ring'

export type WorkoutDoneStatus = 'saving' | 'saved' | 'error'

const primaryButton: CSSProperties = {
  width: '100%',
  maxWidth: 360,
  height: 52,
  borderRadius: 'var(--r-pill)',
  background: 'var(--accent)',
  border: 'none',
  color: 'var(--accent-ink)',
  fontSize: 15,
  fontWeight: 600,
  fontFamily: 'var(--font-space-grotesk)',
  cursor: 'pointer',
  marginTop: 8,
  boxShadow: '0 8px 24px -8px var(--accent-glow)',
}

const secondaryButton: CSSProperties = {
  ...primaryButton,
  marginTop: 0,
  background: 'transparent',
  border: '1px solid var(--hairline-2)',
  color: 'var(--text)',
  boxShadow: 'none',
}

const COPY: Record<WorkoutDoneStatus, { title: string; text: string }> = {
  saving: {
    title: 'Salvando treino…',
    text: 'Estamos registrando suas cargas.',
  },
  saved: {
    title: 'Treino concluído',
    text: 'Mandou bem! O Helux registrou suas cargas e vai recalibrar o próximo treino.',
  },
  error: {
    title: 'Não foi possível salvar',
    text: 'Seu treino continua guardado neste aparelho. Verifique a conexão e tente de novo.',
  },
}

export function WorkoutDoneScreen({
  status,
  totalDone,
  elapsed,
  onGoHome,
  onRetry,
  onBackToWorkout,
}: {
  status: WorkoutDoneStatus
  totalDone: number
  elapsed: number
  onGoHome: () => void
  onRetry: () => void
  onBackToWorkout: () => void
}) {
  const { title, text } = COPY[status]

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '32px 24px',
        zIndex: 50,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: status === 'error' ? 'rgba(245,183,62,0.12)' : 'var(--accent-soft)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <Ring value={status === 'saved' ? 100 : status === 'saving' ? 60 : 0} size={120} sw={8}>
        {status === 'saved' && <Icon name="check" size={48} stroke="var(--accent)" sw={2.4} />}
        {status === 'error' && <Icon name="close" size={44} stroke="var(--warn)" sw={2.4} />}
      </Ring>
      <h2
        style={{
          fontSize: 25,
          fontWeight: 700,
          color: 'var(--text)',
          textAlign: 'center',
          margin: 0,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: 14,
          color: 'var(--text-dim)',
          textAlign: 'center',
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {text}
      </p>

      {status === 'saved' && (
        <>
          <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
            {[
              { v: totalDone, k: 'séries' },
              { v: elapsed, k: 'minutos' },
            ].map(({ v, k }) => (
              <div key={k} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    fontFamily: 'var(--font-jetbrains-mono)',
                    color: 'var(--accent)',
                  }}
                >
                  {v}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>{k}</div>
              </div>
            ))}
          </div>
          <button type="button" onClick={onGoHome} style={primaryButton}>
            Voltar ao início
          </button>
        </>
      )}

      {status === 'error' && (
        <>
          <button type="button" onClick={onRetry} style={primaryButton}>
            Tentar novamente
          </button>
          <button type="button" onClick={onBackToWorkout} style={secondaryButton}>
            Voltar ao treino
          </button>
        </>
      )}
    </div>
  )
}
