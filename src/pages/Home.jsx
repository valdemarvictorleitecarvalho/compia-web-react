import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../contexts/StoreContext'
import { formatBRL } from '../lib/format'
import TypeBadge, { TYPE_LABELS } from '../components/TypeBadge'

export default function Home() {
  const { products } = useStore()
  const [typeFilter, setTypeFilter] = useState('todos')
  const [tagFilter, setTagFilter] = useState('todas')

  const allTags = useMemo(
    () => [...new Set(products.flatMap((p) => p.tags))].sort(),
    [products],
  )

  const visible = products.filter((p) => {
    if (p.status !== 'ativo') return false
    if (typeFilter !== 'todos' && p.type !== typeFilter) return false
    if (tagFilter !== 'todas' && !p.tags.includes(tagFilter)) return false
    return true
  })

  return (
    <main className="mx-auto max-w-6xl px-4">
      <section className="border-b border-slate-300 py-10">
        <h1 className="font-serif text-4xl font-bold leading-tight text-ink md:text-5xl">
          Catálogo da editora
        </h1>
        <p className="mt-3 max-w-2xl text-ink/70">
          Títulos técnicos em Inteligência Artificial, Blockchain, Cibersegurança
          e Criptografia — em edição impressa, e-book ou kits com desconto.
        </p>
      </section>

      {/* Filtros */}
      <section className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-slate-300 py-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-ink/50">Formato</span>
          {['todos', 'fisico', 'ebook', 'kit'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`border px-2.5 py-1 ${
                typeFilter === t
                  ? 'border-wine bg-wine text-white'
                  : 'border-slate-300 text-ink/70 hover:border-ink'
              }`}
            >
              {t === 'todos' ? 'Todos' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-ink/50">Tema</span>
          {['todas', ...allTags].map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className={`border px-2.5 py-1 ${
                tagFilter === tag
                  ? 'border-wine bg-wine text-white'
                  : 'border-slate-300 text-ink/70 hover:border-ink'
              }`}
            >
              {tag === 'todas' ? 'Todos' : tag}
            </button>
          ))}
        </div>
      </section>

      {/* Vitrine */}
      <section className="grid grid-cols-2 gap-x-6 gap-y-10 py-10 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((p) => (
          <Link key={p.id} to={`/produto/${p.id}`} className="group">
            <div className="aspect-2/3 overflow-hidden border border-slate-300 bg-white">
              <img
                src={p.cover}
                alt={`Capa de ${p.title}`}
                className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
              />
            </div>
            <div className="mt-3 space-y-1">
              <TypeBadge type={p.type} />
              <h2 className="font-serif text-base font-semibold leading-snug text-ink group-hover:text-wine">
                {p.title}
              </h2>
              <p className="text-xs text-ink/60">{p.author}</p>
              <p className="font-mono text-sm text-ink">{formatBRL(p.price)}</p>
              {p.type === 'fisico' && p.stock === 0 && (
                <p className="text-xs font-semibold text-wine">Esgotado</p>
              )}
            </div>
          </Link>
        ))}
        {visible.length === 0 && (
          <p className="col-span-full py-10 text-center text-ink/50">
            Nenhum título encontrado com esses filtros.
          </p>
        )}
      </section>
    </main>
  )
}
