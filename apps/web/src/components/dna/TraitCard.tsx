export type LevelWord = 'baixo' | 'médio' | 'alto'

/** Nível 0–1 do perfil em palavra: < 0,34 baixo, < 0,67 médio, ≥ 0,67 alto (FR-022). */
export function levelWord(level: number): LevelWord {
  if (level < 0.34) return 'baixo'
  if (level < 0.67) return 'médio'
  return 'alto'
}

const BARS: Record<LevelWord, number> = { baixo: 1, médio: 2, alto: 3 }

function Level({ level }: { level: number }) {
  const word = levelWord(level)
  const n = BARS[word]
  return (
    <span aria-label={`nível ${word}`} style={{ display: 'inline-flex', gap: 3, alignItems: 'center', flexShrink: 0 }}>
      {[1, 2, 3].map(i => (
        <i
          key={i}
          style={{ width: 3, height: 6 + i * 3, borderRadius: 1.5, background: i <= n ? 'var(--trait-on)' : 'var(--trait-off)' }}
        />
      ))}
      <span className="t-caption" style={{ marginLeft: 6, color: 'var(--text)' }}>
        {word}
      </span>
    </span>
  )
}

/** Card de marcador genético (handoff 5.4): gene, genótipo, nível, traço e impacto; âmbar só no risco. */
export function TraitCard({
  gene,
  genotype,
  label,
  level,
  status,
  note,
  warn,
}: {
  gene: string
  genotype?: string
  label: string
  /** Nível 0–1 (tela DNA). Sem nível, mostra `status` em palavra (perfil nutrigenômico, 018). */
  level?: number
  status?: string
  note: string
  warn?: boolean
}) {
  return (
    <article className="hx-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <span>
          <span className="gene" style={{ fontSize: 17, color: 'var(--text)' }}>
            {gene}
          </span>
          {genotype && (
            <span className="n-sm dim" style={{ marginLeft: 8 }}>
              {genotype}
            </span>
          )}
        </span>
        {level !== undefined ? (
          <Level level={level} />
        ) : (
          status && (
            <span className="t-caption" style={{ color: 'var(--text)', flexShrink: 0 }}>
              {status}
            </span>
          )
        )}
      </div>
      <div className="t-secondary" style={{ marginTop: 6, color: 'var(--text)' }}>
        {label}
      </div>
      {note && (
        <p className="t-secondary" style={{ marginTop: 10, display: 'flex', gap: 8 }}>
          {warn && (
            <i
              data-warn
              aria-hidden="true"
              style={{ width: 6, height: 6, borderRadius: 1, background: 'var(--warn)', marginTop: 6, flexShrink: 0 }}
            />
          )}
          <span>{note}</span>
        </p>
      )}
    </article>
  )
}
