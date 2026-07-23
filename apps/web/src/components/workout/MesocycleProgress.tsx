export function MesocycleProgress({ completed, total }: { completed: number; total: number }) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-card)', padding: '14px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        Progresso do ciclo
      </div>
      <p style={{ fontSize: 13, color: 'var(--text)', margin: '0 0 10px' }}>{`${completed} de ${total} treinos concluídos`}</p>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            data-testid="progress-dot"
            data-filled={i < completed}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              background: i < completed ? 'var(--accent)' : 'var(--surface-3)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
