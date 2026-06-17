'use client'

import { useRouter } from 'next/navigation'
import { useActiveWorkout } from '@/hooks/useActiveWorkout'
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan'

// ─── Design tokens: icons, mark, ring ────────────────────────────────────────

const ICONS: Record<string, string> = {
  home:     'M4 11.5 12 4l8 7.5M6 10v9h12v-9',
  dumbbell: 'M6.5 9v6M9.5 7.5v9M14.5 7.5v9M17.5 9v6M9.5 12h5M4.5 11v2M19.5 11v2',
  dna:      'M8 3c0 5 8 7 8 12s-8 6-8 9M16 3c0 5-8 7-8 12s8 6 8 9M8.5 7h7M7.5 12h9M8.5 17h7',
  chart:    'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8',
  play:     'M7 4.5v15l13-7.5z',
  flame:    'M12 3c1 4 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 1-2-1-4-1-8z',
  chevron:  'M9 6l6 6-6 6',
}

function Icon({ name, size = 22, stroke = 'currentColor', sw = 1.9 }: { name: keyof typeof ICONS; size?: number; stroke?: string; sw?: number }) {
  const solid = name === 'play'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={solid ? stroke : 'none'} stroke={solid ? 'none' : stroke}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

function HelixMark({ size = 28, stroke = 'var(--accent)' }: { size?: number; stroke?: string }) {
  const rungs = [0.16, 0.34, 0.5, 0.66, 0.84]
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M11 3 C 21 9, 21 23, 11 29" stroke={stroke} strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M21 3 C 11 9, 11 23, 21 29" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" opacity="0.55"/>
      {rungs.map((t, i) => {
        const y = 3 + t * 26
        const amp = Math.sin(t * Math.PI) * 5
        return <line key={i} x1={16 - amp} y1={y} x2={16 + amp} y2={y} stroke={stroke} strokeWidth="1.6" strokeLinecap="round" opacity={0.5} />
      })}
    </svg>
  )
}

function Ring({ value, size = 64, sw = 6, children }: { value: number; size?: number; sw?: number; children?: React.ReactNode }) {
  const r = (size - sw) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - value / 100)
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'grid', placeItems: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--accent)" strokeWidth={sw}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(.2,.8,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center', lineHeight: 1 }}>
        {children}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface HomeClientProps {
  plan: any
  recovery: { hrv?: number; restingHR?: number; activeCalories?: number; sleepHours?: number; date?: string } | null
  insight: { title?: string; text?: string; icon?: string } | null
  firstName: string
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

export function HomeClient({ plan: initialPlan, recovery, insight, firstName }: HomeClientProps) {
  const router = useRouter()
  const { startWorkout } = useActiveWorkout()
  const { plan, generating, generationError, generatePlan } = useWorkoutPlan()
  const currentPlan = plan ?? initialPlan

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
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-jetbrains-mono)', color: 'var(--text)' }}>
              — <span style={{ fontSize: 15, color: 'var(--text-faint)', fontWeight: 500 }}>/ 5</span>
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
