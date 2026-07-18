'use client'

import { useRouter } from 'next/navigation'
import { useActiveWorkout } from '@/hooks/useActiveWorkout'
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan'
import { CheckinCard } from '@/components/checkin/CheckinCard'
import type { BodyCheckin } from '@helux/types'
import { Icon, HelixMark } from '@/components/ui/icons'
import { Ring } from '@/components/ui/Ring'

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface HomeClientProps {
  plan: any
  recovery: { hrv?: number; restingHR?: number; activeCalories?: number; sleepHours?: number; date?: string } | null
  insight: { title?: string; text?: string; icon?: string } | null
  firstName: string
  checkins: BodyCheckin[]
  analytics: { thisWeekSessions: number; currentStreakWeeks: number } | null
}

function todayLabel() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
    .replace(/^\w/, c => c.toUpperCase())
}

function recoveryScore(hrv?: number): number {
  if (!hrv) return 0
  return Math.min(100, Math.round((hrv / 80) * 100))
}

function recoveryLabel(score: number): string {
  if (score >= 75) return 'Pronto p/ treinar'
  if (score >= 50) return 'Moderado'
  return 'Descanse hoje'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function HomeClient({ plan: initialPlan, recovery, insight, firstName, checkins, analytics }: HomeClientProps) {
  const router = useRouter()
  const { startWorkout } = useActiveWorkout()
  const { plan, generating, generationError, generatePlan } = useWorkoutPlan()
  const currentPlan = plan ?? initialPlan
  const WEEKLY_TARGET = 4

  function handleStart() {
    if (!currentPlan) return
    startWorkout(currentPlan.exercises)
    router.push('/workout')
  }

  const score = recoveryScore(recovery?.hrv)

  return (
    <div className="max-w-lg mx-auto pb-24">
      {/* Topbar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2">
        <div className="flex items-center gap-2">
          <HelixMark size={24} />
          <span style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>
            helux
          </span>
        </div>
        {analytics && analytics.currentStreakWeeks > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '6px 11px',
            borderRadius: 'var(--r-pill)',
            background: 'var(--surface-2)',
            border: '1px solid var(--hairline)',
          }}>
            <Icon name="flame" size={14} stroke="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              {analytics.currentStreakWeeks}
            </span>
            <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>sem</span>
          </div>
        )}
      </div>

      {/* Greeting */}
      <header className="px-4 pt-3 pb-4">
        <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 4 }}>{todayLabel()}</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
          Bom treino,<br />
          <span style={{ color: 'var(--accent)' }}>{firstName}</span>
        </h1>
      </header>

      <div className="px-4 space-y-3">
        {/* Hero — Treino de hoje */}
        {currentPlan ? (
          <div style={{
            background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-1) 100%)',
            border: '1px solid var(--hairline-2)',
            borderRadius: 'var(--r-card)',
            padding: '18px 18px 14px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* glow */}
            <div style={{ position: 'absolute', top: -40, right: -20, width: 140, height: 140,
              borderRadius: '50%', background: 'var(--accent-soft)', pointerEvents: 'none' }} />
            <div className="flex items-center justify-between mb-2" style={{ position: 'relative' }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: 'var(--text-faint)', textTransform: 'uppercase' }}>
                Treino de hoje
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4, position: 'relative' }}>
              {currentPlan.exercises?.[0]?.name ?? 'Treino Personalizado'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12, position: 'relative' }}>
              {currentPlan.exercises?.slice(1,3).map((e: any) => e.name).join(' · ')}
            </div>
            <div className="flex items-center gap-4" style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 14, position: 'relative' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="dumbbell" size={15} stroke="var(--text-dim)" />
                {currentPlan.exercises?.length ?? 0} exercícios
              </span>
            </div>
            <button onClick={handleStart} style={{
              width: '100%',
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              border: 'none',
              borderRadius: 'var(--r-pill)',
              padding: '14px 20px',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'var(--font-space-grotesk)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: '0 8px 24px -8px var(--accent-glow)',
              position: 'relative',
            }}>
              <span>Iniciar treino</span>
              <span style={{ background: 'var(--accent-ink)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="play" size={14} stroke="var(--accent)" sw={0} />
              </span>
            </button>
          </div>
        ) : (
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 20, textAlign: 'center' }}>
            <p style={{ color: 'var(--text)', marginBottom: 4 }}>Nenhum plano gerado ainda.</p>
            <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>Use o botão abaixo para gerar seu primeiro plano.</p>
          </div>
        )}

        {/* Generate button */}
        {generationError && <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'center' }}>{generationError}</p>}
        <button onClick={generatePlan} disabled={generating} style={{
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
        }}>
          {generating ? 'Gerando plano…' : 'Gerar Novo Plano'}
        </button>

        {/* Check-in card */}
        <CheckinCard checkins={checkins} />

        {/* Recovery ring + week */}
        <div className="grid grid-cols-2 gap-3">
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            {recovery ? (
              <>
                <Ring value={score} size={56} sw={5}>
                  <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--accent)' }}>
                    {score}
                  </span>
                </Ring>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Recuperação</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{recoveryLabel(score)}</div>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Sync o Shortcut</div>
            )}
          </div>
          <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '14px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Semana</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
              <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text)' }}>
                {analytics?.thisWeekSessions ?? 0}
              </span>
              <span style={{ fontSize: 15, color: 'var(--text-faint)', fontWeight: 500 }}>/ {WEEKLY_TARGET}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: WEEKLY_TARGET }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    background: i < (analytics?.thisWeekSessions ?? 0) ? 'var(--accent)' : 'var(--surface-3)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* DNA insight */}
        {insight && (
          <button onClick={() => router.push('/dna')} style={{
            width: '100%',
            background: 'var(--surface-1)',
            border: '1px solid var(--hairline)',
            borderRadius: 'var(--r-card)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer',
            textAlign: 'left',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="dna" size={18} stroke="var(--accent)" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 2 }}>Insight do seu DNA</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{insight.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{insight.text}</div>
            </div>
            <Icon name="chevron" size={16} stroke="var(--text-faint)" />
          </button>
        )}
      </div>
    </div>
  )
}
