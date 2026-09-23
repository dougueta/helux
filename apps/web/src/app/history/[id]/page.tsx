'use client'

import type { CSSProperties } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'
import { MatchBadge } from '@/components/ui/MatchBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { apiFetch } from '@/services/api-client'
import type { WorkoutSessionRow } from '@/hooks/useWorkoutHistory'

const mono = 'var(--font-jetbrains-mono), monospace'
const cell: CSSProperties = { padding: '8px 16px', fontFamily: mono }
const headCell: CSSProperties = { padding: '8px 16px' }

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [session, setSession] = useState<WorkoutSessionRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch(`/api/workouts/history`)
      .then(data => {
        const d = data as { sessions: WorkoutSessionRow[] }
        setSession(d.sessions.find(s => s.id === id) ?? null)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <Shell>
        <div aria-busy="true" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height={64} radius="var(--r-sm)" style={{ border: '1px solid var(--hairline)' }} />
          ))}
        </div>
      </Shell>
    )
  }

  if (!session) {
    return (
      <Shell>
        <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '48px 0' }}>Sessão não encontrada.</p>
        <button
          onClick={() => router.back()}
          style={{ color: 'var(--accent)', fontSize: 14, lineHeight: '20px', textDecoration: 'underline', minHeight: 44 }}
        >
          ← Voltar
        </button>
      </Shell>
    )
  }

  return (
    <Shell>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => router.back()}
          style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: '20px', minHeight: 44, paddingRight: 8 }}
        >
          ←
        </button>
        <div>
          <h1 style={{ fontWeight: 600, fontSize: 18, lineHeight: '28px', color: 'var(--text)' }}>
            {new Date(session.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h1>
          {session.duration_s && (
            <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: '20px', fontFamily: mono }}>
              {Math.floor(session.duration_s / 60)}min
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {session.exercises.map((ex, i) => (
          <Card key={i} padding={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--hairline)' }}>
              <p style={{ fontWeight: 500, color: 'var(--text)' }}>
                {ex.executedVariant ? ex.executedVariant.name : ex.name}
              </p>
              {ex.executedVariant && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text-dim)', fontSize: 12, lineHeight: '16px' }}>
                    variante de {ex.name}
                  </span>
                  <MatchBadge value={ex.executedVariant.match} size="sm" />
                </div>
              )}
            </div>
            <table style={{ width: '100%', fontSize: 14, lineHeight: '20px' }}>
              <thead>
                <tr style={{ color: 'var(--text-dim)', fontSize: 12, lineHeight: '16px', fontFamily: mono, borderBottom: '1px solid var(--hairline)' }}>
                  <th style={{ ...headCell, textAlign: 'left' }}>Série</th>
                  <th style={{ ...headCell, textAlign: 'right' }}>Reps</th>
                  <th style={{ ...headCell, textAlign: 'right' }}>Peso</th>
                  <th style={{ ...headCell, textAlign: 'right' }}>RPE</th>
                </tr>
              </thead>
              <tbody>
                {ex.sets.map((set, j) => (
                  <tr key={j} style={{ borderBottom: j < ex.sets.length - 1 ? '1px solid var(--hairline)' : 0 }}>
                    <td style={{ ...cell, color: 'var(--text-dim)' }}>{j + 1}</td>
                    <td style={{ ...cell, color: 'var(--text)', textAlign: 'right' }}>{set.reps}</td>
                    <td style={{ ...cell, color: 'var(--accent)', textAlign: 'right' }}>{set.weight}kg</td>
                    <td style={{ ...cell, color: 'var(--text-dim)', textAlign: 'right' }}>{set.effort}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
    </Shell>
  )
}
