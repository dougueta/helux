import { rungHeight } from '@/components/ui/Helix'

const N = 44
const STEP = 7.8
const H = 64

/**
 * Fita de marcadores do DNA (handoff 5.4): hélice estática com os loci dos
 * genes do perfil acesos e os nomes em `.gene` embaixo. Decorativa: os
 * marcadores estão listados nos cards logo abaixo.
 */
export function MarkerStrand({ genes }: { genes: string[] }) {
  if (genes.length === 0) return null
  const loci = new Map(genes.map((g, i) => [Math.floor(((i + 0.5) * N) / genes.length), g]))

  return (
    <div style={{ position: 'relative' }}>
      <svg width="100%" height={H} viewBox={`0 0 ${N * STEP} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: N }, (_, i) => {
          const h = rungHeight(i, H - 4)
          return (
            <rect
              key={i}
              x={i * STEP}
              y={(H - h) / 2}
              width="3"
              height={h}
              rx="1.5"
              fill={loci.has(i) ? 'var(--accent)' : 'var(--rung-off)'}
            />
          )
        })}
      </svg>
      <div style={{ position: 'relative', height: 18, marginTop: 6 }} aria-hidden="true">
        {[...loci].map(([i, g]) => (
          <span
            key={g}
            className="gene"
            style={{
              position: 'absolute',
              left: `${(i / N) * 100}%`,
              fontSize: 11,
              color: 'var(--text-dim)',
              // na metade direita, o rótulo termina no traço, para não vazar em 320 px
              transform: i / N > 0.5 ? 'translateX(calc(-100% + 5px))' : 'translateX(-2px)',
              whiteSpace: 'nowrap',
            }}
          >
            {g}
          </span>
        ))}
      </div>
    </div>
  )
}
