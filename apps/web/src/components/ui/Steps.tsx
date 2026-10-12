/** Passos numerados (`.hx-steps`); o "Erro comum" é o último, em âmbar. */
export function Steps({ items }: { items: { text: string; warn?: boolean }[] }) {
  return (
    <ol className="hx-steps">
      {items.map((s, i) => (
        <li key={i} className={s.warn ? 'is-warn' : undefined}>
          <span>
            {s.warn && <b style={{ color: 'var(--warn)', fontWeight: 600 }}>Erro comum:</b>}
            {s.warn ? ' ' : ''}
            {s.text}
          </span>
        </li>
      ))}
    </ol>
  )
}
