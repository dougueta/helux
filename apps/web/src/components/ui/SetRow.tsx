import { Check } from '@/components/ui/Check'
import { formatNumber } from '@/lib/format'

/**
 * Linha de série compacta (`.hx-set`), concluída ou próxima. Tocar na linha
 * a torna a série atual; o ✓ alterna sem propagar. A edição também é um botão
 * (o valor), para teclado e leitor de tela, sem aninhar controles.
 */
export function SetRow({
  no,
  prev,
  weight,
  reps,
  done,
  pop,
  onToggle,
  onEdit,
}: {
  no: number
  prev: string | null
  weight: number
  reps: number
  done: boolean
  pop?: boolean
  onToggle: () => void
  onEdit: () => void
}) {
  const kg = formatNumber(weight)
  return (
    <div className={done ? 'hx-set is-done' : 'hx-set is-upcoming'} onClick={onEdit}>
      <span className="hx-set-no">{no}</span>
      <span className="hx-set-prev">{prev ?? '—'}</span>
      <button type="button" className="hx-set-val" aria-label={`Editar série ${no}: ${kg} kg × ${reps}`}>
        {kg}
        <span> kg</span> × {reps}
      </button>
      <span onClick={e => e.stopPropagation()}>
        <Check
          on={done}
          pop={pop}
          onClick={onToggle}
          label={done ? `série ${no} concluída, desfazer` : `concluir série ${no}`}
        />
      </span>
    </div>
  )
}
