// apps/web/src/app/treinos/TreinosClient.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useActiveWorkout } from '@/hooks/useActiveWorkout'
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan'
import { formatDuration } from '@/lib/format-duration'
import type { WorkoutSessionRow } from '@/hooks/useWorkoutHistory'
import type { AdjustedWorkoutPlanView, PlannedExercise } from '@helux/types'

interface TreinosClientProps {
  plan: AdjustedWorkoutPlanView | null
  recentSessions: WorkoutSessionRow[]
}

export function TreinosClient({ plan: initialPlan, recentSessions }: TreinosClientProps) {
  const router = useRouter()
  const { startWorkout } = useActiveWorkout()
  const { plan, generating, generationError, generatePlan } = useWorkoutPlan()
  const currentPlan = plan ?? initialPlan
  const today = currentPlan?.today

  function handleStart() {
    if (!today) return
    startWorkout(today.exercises)
    router.push('/workout')
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-12 pb-24">
      <header style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 6 }}>
          Seu treino atual
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', margin: '6px 0 0' }}>
          Treinos
        </h1>
      </header>

      {today ? (
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 16, marginBottom: 12 }}>
          {today.focus && (
            <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 14 }}>{today.focus}</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {today.exercises?.map((ex: PlannedExercise, i: number) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 12px',
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--r-sm)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', margin: 0 }}>{ex.name}</p>
                  {ex.notes && <p style={{ fontSize: 11, color: 'var(--text-faint)', margin: '2px 0 0' }}>{ex.notes}</p>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--accent)', fontSize: 13, margin: 0 }}>
                    {ex.sets}×{ex.reps}
                  </p>
                  <p style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-faint)', fontSize: 11, margin: 0 }}>{ex.weight}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleStart}
            style={{
              width: '100%',
              marginTop: 14,
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              border: 'none',
              borderRadius: 'var(--r-pill)',
              padding: '14px 20px',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'var(--font-space-grotesk)',
              cursor: 'pointer',
              boxShadow: '0 8px 24px -8px var(--accent-glow)',
            }}
          >
            Iniciar treino
          </button>
        </div>
      ) : (
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 20, textAlign: 'center', marginBottom: 12 }}>
          <p style={{ color: 'var(--text)', marginBottom: 4 }}>Nenhum plano gerado ainda.</p>
          <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Use o botão abaixo para gerar seu primeiro plano.</p>
        </div>
      )}

      {generationError && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>{generationError}</p>}
      <button
        onClick={generatePlan}
        disabled={generating}
        style={{
          width: '100%',
          background: 'transparent',
          border: '1px solid var(--hairline-2)',
          borderRadius: 'var(--r-pill)',
          padding: '12px 20px',
          fontSize: 14,
          fontWeight: 500,
          fontFamily: 'var(--font-space-grotesk)',
          color: generating ? 'var(--text-faint)' : 'var(--text-dim)',
          cursor: generating ? 'not-allowed' : 'pointer',
          minHeight: 44,
          opacity: generating ? 0.6 : 1,
          marginBottom: 24,
        }}
      >
        {generating ? 'Gerando plano…' : 'Gerar Novo Plano'}
      </button>

      {recentSessions.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Treinos recentes</h2>
            <a href="/history" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Ver histórico
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentSessions.slice(0, 3).map(session => (
              <a
                key={session.id}
                href={`/history/${session.id}`}
                style={{
                  display: 'block',
                  background: 'var(--surface-1)',
                  border: '1px solid var(--hairline)',
                  borderRadius: 'var(--r-card)',
                  padding: '12px 14px',
                  textDecoration: 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                    {new Date(session.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text-dim)', fontSize: 12 }}>
                    {formatDuration(session.duration_s)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
