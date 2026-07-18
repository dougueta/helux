import { Icon } from './icons'

export function MiniStep({
  value,
  step,
  onChange,
  done,
}: {
  value: number
  step: number
  onChange: (v: number) => void
  done: boolean
}) {
  const press = (d: number) => onChange(Math.max(0, Math.round((value + d * step) * 100) / 100))
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
      <button
        type="button"
        onClick={() => press(-1)}
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: done ? 'var(--accent-soft)' : 'var(--surface-2)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Icon name="minus" size={11} stroke={done ? 'var(--accent)' : 'var(--text-dim)'} sw={2.4} />
      </button>
      <span
        style={{
          fontFamily: 'var(--font-jetbrains-mono)',
          fontSize: 14,
          fontWeight: 600,
          color: done ? 'var(--accent)' : 'var(--text)',
          minWidth: 28,
          textAlign: 'center',
        }}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => press(1)}
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: done ? 'var(--accent-soft)' : 'var(--surface-2)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <Icon name="plus" size={11} stroke={done ? 'var(--accent)' : 'var(--text-dim)'} sw={2.4} />
      </button>
    </div>
  )
}
