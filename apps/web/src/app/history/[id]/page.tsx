'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Shell } from '@/components/layout/Shell'
import { apiFetch } from '@/services/api-client'
import type { WorkoutSessionRow } from '@/hooks/useWorkoutHistory'

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
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-helux-surface rounded-xl border border-helux-border h-16 animate-pulse" />
          ))}
        </div>
      </Shell>
    )
  }

  if (!session) {
    return (
      <Shell>
        <p className="text-helux-muted text-center py-12">Sessão não encontrada.</p>
        <button onClick={() => router.back()} className="text-helux-accent text-sm underline min-h-[44px]">
          ← Voltar
        </button>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-helux-muted text-sm min-h-[44px] pr-2">←</button>
        <div>
          <h1 className="font-sans font-semibold text-lg text-white">
            {new Date(session.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h1>
          {session.duration_s && (
            <p className="text-helux-muted text-sm font-mono">
              {Math.floor(session.duration_s / 60)}min
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {session.exercises.map((ex, i) => (
          <div key={i} className="bg-helux-surface border border-helux-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-helux-border">
              <p className="font-sans font-medium text-white">{ex.name}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-helux-muted text-xs font-mono border-b border-helux-border">
                  <th className="px-4 py-2 text-left">Série</th>
                  <th className="px-4 py-2 text-right">Reps</th>
                  <th className="px-4 py-2 text-right">Peso</th>
                  <th className="px-4 py-2 text-right">RPE</th>
                </tr>
              </thead>
              <tbody>
                {ex.sets.map((set, j) => (
                  <tr key={j} className="border-b border-helux-border/50 last:border-0">
                    <td className="px-4 py-2 font-mono text-helux-muted">{j + 1}</td>
                    <td className="px-4 py-2 font-mono text-white text-right">{set.reps}</td>
                    <td className="px-4 py-2 font-mono text-helux-accent text-right">{set.weight}kg</td>
                    <td className="px-4 py-2 font-mono text-helux-muted text-right">{set.effort}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </Shell>
  )
}
