import type { RecoveryData } from '@helux/types'

interface RecoveryCardProps {
  data: RecoveryData | null
  isStale: boolean
}

interface MetricTileProps {
  label: string
  value: number | undefined
  unit: string
  accent?: boolean
}

function MetricTile({ label, value, unit, accent = false }: MetricTileProps) {
  return (
    <div
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--r-card)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)', margin: 0 }}>
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-jetbrains-mono)',
          fontSize: 22,
          fontWeight: 700,
          color: accent ? 'var(--accent)' : 'var(--text)',
          margin: 0,
        }}
      >
        {value != null ? value : '—'}
      </p>
      <p style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--text-faint)', margin: 0 }}>
        {unit}
      </p>
    </div>
  )
}

export function RecoveryCard({ data, isStale }: RecoveryCardProps) {
  if (!data) {
    return (
      <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--text)', fontSize: 16, margin: '0 0 8px' }}>Sem dados de recovery</p>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>
          Execute o{' '}
          <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-jetbrains-mono)' }}>Shortcut</span> no
          iPhone para sincronizar os dados do Apple Watch.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {isStale && (
        <div
          style={{
            background: 'rgba(245,183,62,0.14)',
            border: '1px solid rgba(245,183,62,0.34)',
            borderRadius: 'var(--r-sm)',
            padding: '8px 14px',
          }}
        >
          <p style={{ color: 'var(--warn)', fontSize: 13, margin: 0 }}>Dados antigos — sincronize novamente</p>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MetricTile label="HRV" value={data.hrv} unit="ms" accent />
        <MetricTile label="FC Repouso" value={data.restingHR} unit="bpm" />
        <MetricTile label="Calorias" value={data.activeCalories} unit="kcal" />
        <MetricTile
          label="Sono"
          value={data.sleepHours != null ? Math.round(data.sleepHours * 10) / 10 : undefined}
          unit="horas"
        />
        <MetricTile label="Recup. Cardio" value={data.cardioRecovery} unit="bpm" />
      </div>
      <p style={{ color: 'var(--text-faint)', fontSize: 11, fontFamily: 'var(--font-jetbrains-mono)', textAlign: 'right', margin: 0 }}>
        Atualizado: {new Date(data.date).toLocaleDateString('pt-BR')}
      </p>
    </div>
  )
}
