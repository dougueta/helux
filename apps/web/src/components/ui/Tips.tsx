import { GeneTag } from '@/components/ui/Tag'
import { parseTipItems } from '@/lib/tipItems'

/**
 * Dicas de execução (`.hx-tips`, research V4): uma orientação por linha com
 * divisória; a orientação com gene ganha o quadrado âmbar e o marcador abaixo.
 */
export function Tips({ text }: { text: string | null | undefined }) {
  const items = parseTipItems(text)
  if (items.length === 0) return null
  return (
    <ul className="hx-tips">
      {items.map((item, i) => (
        <li key={i} className={item.gene ? 'is-gene' : undefined}>
          <div>
            <div className="hx-tip-t">{item.text}</div>
            {item.gene && (
              <div className="hx-tip-meta">
                <GeneTag symbol={item.gene.symbol} genotype={item.gene.genotype} warn />
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
