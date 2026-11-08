// Spec 029 (US4): onde passar a fita em cada medida, com uma silhueta simples.

export type MeasureKey = 'neck' | 'shoulders' | 'chest' | 'waist' | 'hip' | 'arm' | 'leg' | 'calf'

export const MEASURE_GUIDE: Record<MeasureKey, { label: string; text: string }> = {
  neck: { label: 'Pescoço', text: 'Logo abaixo do pomo de Adão, com a fita reta e o olhar para a frente.' },
  shoulders: { label: 'Ombros', text: 'Volta completa pela parte mais larga dos ombros, braços relaxados ao lado do corpo.' },
  chest: { label: 'Peitoral', text: 'Na linha dos mamilos, braços relaxados, no fim da expiração.' },
  waist: { label: 'Cintura', text: 'Na altura do umbigo, barriga relaxada (sem encolher), no fim da expiração.' },
  hip: { label: 'Quadril', text: 'Na parte mais larga dos glúteos, pés juntos.' },
  arm: { label: 'Braço', text: 'No ponto mais largo, relaxado, com o braço solto ao lado do corpo. Meça os dois lados.' },
  leg: { label: 'Coxa', text: 'No meio entre a virilha e o joelho, em pé com o peso nas duas pernas. Meça os dois lados.' },
  calf: { label: 'Panturrilha', text: 'No ponto mais largo, em pé com o peso distribuído nas duas pernas. Meça os dois lados.' },
}

export const MEASURE_PROTOCOL = [
  'De manhã, em jejum, depois de ir ao banheiro, antes de treinar.',
  'Fita justa, sem apertar a pele, paralela ao chão.',
  'Sempre no mesmo horário e nos mesmos pontos, para comparar com a medição anterior.',
]

/** Marcadores (linha horizontal) por medida, no sistema de coordenadas 120×220. */
const MARKERS: Record<MeasureKey, { x1: number; x2: number; y: number }[]> = {
  neck: [{ x1: 52, x2: 68, y: 34 }],
  shoulders: [{ x1: 26, x2: 94, y: 46 }],
  chest: [{ x1: 36, x2: 84, y: 62 }],
  waist: [{ x1: 40, x2: 80, y: 90 }],
  hip: [{ x1: 38, x2: 82, y: 108 }],
  arm: [{ x1: 18, x2: 30, y: 68 }, { x1: 90, x2: 102, y: 68 }],
  leg: [{ x1: 40, x2: 58, y: 140 }, { x1: 62, x2: 80, y: 140 }],
  calf: [{ x1: 43, x2: 56, y: 182 }, { x1: 64, x2: 77, y: 182 }],
}

export function MeasureGuide({ measure }: { measure: MeasureKey }) {
  const info = MEASURE_GUIDE[measure]
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <svg role="img" aria-label={`Onde medir: ${info.label}`} viewBox="0 0 120 220" width={110} height={200} style={{ flex: 'none' }}>
        <g fill="none" stroke="var(--text-dim)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.7}>
          <circle cx={60} cy={18} r={12} />
          <path d="M54 30 L54 38 M66 30 L66 38" />
          <path d="M30 44 Q60 36 90 44 L86 96 Q84 104 82 110 L38 110 Q36 104 34 96 Z" />
          <path d="M30 44 L20 74 L16 112 M90 44 L100 74 L104 112" />
          <path d="M40 110 L44 160 L46 210 M80 110 L76 160 L74 210 M60 112 L58 160 M60 112 L62 160" />
        </g>
        {(Object.keys(MARKERS) as MeasureKey[]).map(key => {
          const active = key === measure
          return (
            <g key={key} data-measure={key} data-active={active ? 'true' : 'false'}>
              {MARKERS[key].map((m, i) => (
                <line
                  key={i}
                  x1={m.x1}
                  x2={m.x2}
                  y1={m.y}
                  y2={m.y}
                  stroke={active ? 'var(--accent)' : 'var(--hairline)'}
                  strokeWidth={active ? 4 : 2}
                  strokeLinecap="round"
                />
              ))}
            </g>
          )
        })}
      </svg>
      <p className="t-body">{info.text}</p>
    </div>
  )
}
