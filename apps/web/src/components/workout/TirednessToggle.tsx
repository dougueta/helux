import { Icon } from '@/components/ui/icons'

interface TirednessToggleProps {
  active: boolean
  onToggle: () => Promise<void>
}

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '4px 10px',
  borderRadius: 'var(--r-pill)',
  fontSize: 11.5,
  fontWeight: 600,
  cursor: 'pointer',
}

export function TirednessToggle({ active, onToggle }: TirednessToggleProps) {
  if (active) {
    return (
      <button
        type="button"
        onClick={() => { void onToggle() }}
        style={{
          ...baseStyle,
          color: 'var(--accent-ink)',
          background: 'var(--accent)',
          border: '1px solid transparent',
        }}
      >
        <Icon name="flame" size={12} stroke="var(--accent-ink)" />
        Cansaço sinalizado hoje — desfazer
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => { void onToggle() }}
      style={{
        ...baseStyle,
        color: 'var(--text-dim)',
        background: 'var(--surface-2)',
        border: '1px solid var(--hairline)',
      }}
    >
      Hoje estou muito cansado
    </button>
  )
}
