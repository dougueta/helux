import type { CSSProperties } from 'react'
import { Chip } from '@/components/ui/Chip'
import { Icon } from '@/components/ui/icons'
import { parseTipItems, type TipItem } from '@/lib/tipItems'

type Variant = 'inline' | 'panel'

const containers: Record<Variant, CSSProperties> = {
  // Bloco compacto da tela de treino (no lugar do antigo chip verde).
  inline: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 12,
    lineHeight: 1.45,
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-line)',
    borderRadius: 'var(--r-sm)',
    padding: '8px 12px',
  },
  // Aba Execução do ExerciseSheet.
  panel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: 12.5,
    lineHeight: 1.5,
    background: 'var(--accent-soft)',
    border: '1px solid var(--accent-line)',
    borderRadius: 'var(--r-sm)',
    padding: '10px 13px',
  },
}

const markerStyle: CSSProperties = {
  padding: '1px 7px',
  fontSize: 10.5,
  fontFamily: 'var(--font-jetbrains-mono), monospace',
  verticalAlign: 'middle',
  marginLeft: 6,
}

function ItemContent({ item }: { item: TipItem }) {
  return (
    <>
      <span style={{ color: 'var(--text)' }}>{item.text}</span>
      {item.markers.map(m => (
        <Chip key={m} aria-label={`marcador genético ${m}`} style={markerStyle}>
          {m}
        </Chip>
      ))}
    </>
  )
}

/**
 * Dicas de execução com uma orientação por linha e as referências genéticas
 * como etiquetas (spec 012, FR-009 opção A, FR-010, FR-011).
 */
export function ExecutionTips({ text, variant = 'inline' }: { text: string | null | undefined; variant?: Variant }) {
  const items = parseTipItems(text)
  if (items.length === 0) return null

  return (
    <div data-variant={variant} style={containers[variant]}>
      <span style={{ flexShrink: 0, marginTop: 2 }}>
        <Icon name="dna" size={variant === 'panel' ? 14 : 12} stroke="var(--accent)" sw={1.8} />
      </span>
      {items.length === 1 ? (
        <p style={{ margin: 0 }}>
          <ItemContent item={items[0]} />
        </p>
      ) : (
        <ul role="list" style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item, i) => (
            <li key={i} style={{ display: 'flex', gap: 8 }}>
              <span
                aria-hidden="true"
                style={{ flexShrink: 0, width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)', marginTop: '0.6em' }}
              />
              <span>
                <ItemContent item={item} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
