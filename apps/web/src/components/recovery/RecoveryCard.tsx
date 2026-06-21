import type { RecoveryData } from '@helux/types'

interface RecoveryCardProps {
  data: RecoveryData | null
  isStale: boolean
}

interface MetricTileProps {
  label: string
  value: number | undefined
  unit: string
  color?: string
}

function MetricTile({ label, value, unit, color = 'text-white' }: MetricTileProps) {
  return (
    <div className="bg-helux-dark rounded-xl border border-helux-border p-4 flex flex-col gap-1">
      <p className="text-helux-muted text-xs uppercase tracking-wider font-sans">{label}</p>
      <p className={`font-mono text-2xl font-bold ${color}`}>
        {value != null ? value : '—'}
      </p>
      <p className="text-helux-muted text-xs font-mono">{unit}</p>
    </div>
  )
}

export function RecoveryCard({ data, isStale }: RecoveryCardProps) {
  if (!data) {
    return (
      <div className="bg-helux-surface border border-helux-border rounded-2xl p-6 text-center space-y-3">
        <p className="text-white font-sans text-lg">Sem dados de recovery</p>
        <p className="text-helux-muted text-sm">
          Execute o <span className="text-helux-accent font-mono">Shortcut</span> no iPhone para sincronizar os dados do Apple Watch.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {isStale && (
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl px-4 py-2">
          <p className="text-yellow-400 text-sm font-sans">⚠️ Dados antigos — sincronize novamente</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <MetricTile label="HRV" value={data.hrv} unit="ms" color="text-helux-accent" />
        <MetricTile label="FC Repouso" value={data.restingHR} unit="bpm" />
        <MetricTile label="Calorias" value={data.activeCalories} unit="kcal" />
        <MetricTile
          label="Sono"
          value={data.sleepHours != null ? Math.round(data.sleepHours * 10) / 10 : undefined}
          unit="horas"
        />
        <MetricTile label="Recup. Cardio" value={data.cardioRecovery} unit="bpm" />
      </div>
      <p className="text-helux-muted text-xs font-mono text-right">
        Atualizado: {new Date(data.date).toLocaleDateString('pt-BR')}
      </p>
    </div>
  )
}
