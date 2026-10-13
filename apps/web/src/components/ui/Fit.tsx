import { Helix } from '@/components/ui/Helix'
import { fitBand, fitColor } from '@/lib/fit'

const SIZE = {
  sm: { cls: 'hx-fit hx-fit--sm', n: 11, h: 12, w: 2, gap: 2 },
  md: { cls: 'hx-fit hx-fit--md', n: 16, h: 16, w: 2, gap: 2 },
  lg: { cls: 'hx-fit hx-fit--lg', n: 32, h: 28, w: 2.5, gap: 2.5 },
} as const

/** Fit genético: hélice + número na cor da faixa + "fit" (research V6). */
export function Fit({ value, size = 'sm', label = true }: { value: number; size?: keyof typeof SIZE; label?: boolean }) {
  const cfg = SIZE[size]
  const color = fitColor(value)
  return (
    <span className={cfg.cls} role="img" aria-label={`fit genético ${value} de 100, ${fitBand(value)}`}>
      <Helix value={value} n={cfg.n} h={cfg.h} w={cfg.w} gap={cfg.gap} on={color} />
      <span className="hx-fit-n" style={{ color }}>{value}</span>
      {label && <span className="hx-fit-u">fit</span>}
    </span>
  )
}
