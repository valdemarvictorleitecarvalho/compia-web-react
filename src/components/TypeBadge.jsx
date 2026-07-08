export const TYPE_LABELS = {
  fisico: 'Livro físico',
  ebook: 'E-book',
  kit: 'Kit',
}

export default function TypeBadge({ type }) {
  return (
    <span className="inline-block border border-slate-300 px-1.5 py-0.5 text-[11px] uppercase tracking-wider text-ink/70">
      {TYPE_LABELS[type] ?? type}
    </span>
  )
}
