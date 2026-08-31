'use client'

export function FinishWorkoutConfirmDialog({
  skippedNames,
  onConfirm,
  onCancel,
}: {
  skippedNames: string[]
  onConfirm: () => void
  onCancel: () => void
}) {
  if (skippedNames.length === 0) return null

  return (
    <div
      data-testid="finish-confirm-backdrop"
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        background: 'rgba(4,6,4,.62)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: '24px 20px 28px',
          background: 'var(--bg)',
          border: '1px solid var(--hairline-2)',
          borderBottom: 'none',
          borderRadius: '26px 26px 0 0',
          boxShadow: '0 -20px 50px -12px rgba(0,0,0,.6)',
        }}
      >
        <div style={{ width: 38, height: 4, borderRadius: 2, background: 'var(--surface-3)', margin: '-14px auto 4px' }} />

        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: 0, fontFamily: 'var(--font-space-grotesk)' }}>
          {skippedNames.length === 1
            ? '1 exercício será salvo como pulado'
            : `${skippedNames.length} exercícios serão salvos como pulados`}
        </h2>

        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {skippedNames.map((name) => (
            <li key={name} style={{ fontSize: 14, color: 'var(--text-dim)' }}>
              {name}
            </li>
          ))}
        </ul>

        <p style={{ fontSize: 13, color: 'var(--text-faint)', margin: 0 }}>
          Confirma finalizar o treino mesmo assim?
        </p>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 'var(--r-pill)',
              background: 'transparent',
              border: '1px solid var(--hairline-2)',
              color: 'var(--text-dim)',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-space-grotesk)',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 'var(--r-pill)',
              background: 'var(--accent)',
              border: 'none',
              color: 'var(--accent-ink)',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-space-grotesk)',
              cursor: 'pointer',
            }}
          >
            Finalizar mesmo assim
          </button>
        </div>
      </div>
    </div>
  )
}
