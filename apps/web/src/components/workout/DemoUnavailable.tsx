import { Icon } from '@/components/ui/icons'

/**
 * Item sem demonstração (028, FR-006): aviso neutro com o nome e as notas do plano.
 * Nunca mostra outra animação no lugar.
 */
export function DemoUnavailable({ name, notes }: { name: string; notes?: string | null }) {
  return (
    <div
      role="status"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, textAlign: 'center', padding: '0 16px' }}
    >
      <span style={{ color: 'var(--text-faint)' }}>
        <Icon name="dumbbell" size={28} />
      </span>
      <p className="t-secondary">Demonstração indisponível para este item</p>
      <p className="t-body-m">{name}</p>
      {notes && (
        <p className="t-caption" data-testid="demo-unavailable-notes">
          {notes}
        </p>
      )}
    </div>
  )
}
