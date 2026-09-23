'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Card } from '@/components/ui/Card'
import { Chip } from '@/components/ui/Chip'

interface TraitCardProps {
  name: string
  summary: string
  detail: string
  level: 'low' | 'medium' | 'high'
}

// Os tons azul/amarelo antigos não existiam no tema; agora só cores do tema (FR-005).
const levelStyles: Record<TraitCardProps['level'], CSSProperties> = {
  low: { color: 'var(--text-dim)', background: 'var(--surface-2)', border: '1px solid var(--hairline-2)' },
  medium: { color: 'var(--warn)', background: 'rgba(245,183,62,0.12)', border: '1px solid rgba(245,183,62,0.3)' },
  high: { color: 'var(--accent)', background: 'var(--accent-soft)', border: '1px solid var(--accent-line)' },
}

const levelLabels = { low: 'Baixo', medium: 'Médio', high: 'Alto' }

export function TraitCard({ name, summary, detail, level }: TraitCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <Card padding={0} style={{ overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: 16, textAlign: 'left', display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: 12, minHeight: 56,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 500, color: 'var(--text)', fontSize: 14, lineHeight: '20px' }}>{name}</span>
            <Chip style={{ ...levelStyles[level], fontFamily: 'var(--font-jetbrains-mono), monospace', padding: '2px 8px', fontWeight: 400 }}>
              {levelLabels[level]}
            </Chip>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: 14, lineHeight: '20px' }}>{summary}</p>
        </div>
        <span
          style={{
            color: 'var(--text-dim)', flexShrink: 0, marginTop: 2, display: 'inline-block',
            transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: open ? 'rotate(180deg)' : undefined,
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--hairline)' }}>
          <p style={{ color: 'var(--text)', opacity: 0.8, fontSize: 14, lineHeight: 1.625 }}>{detail}</p>
        </div>
      )}
    </Card>
  )
}
