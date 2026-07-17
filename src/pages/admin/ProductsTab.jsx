import { useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'
import { formatBRL } from '../../lib/format'
import { TYPE_LABELS } from '../../components/TypeBadge'
import ProductForm from './ProductForm'
import { table, th, td, zebra, btnGhost, btnDanger } from './tableStyles'

export default function ProductsTab() {
  const { user } = useAuth()
  const { products, deleteProduct } = useStore()
  const [editing, setEditing] = useState(null) // null | 'new' | produto
  const [tagFilter, setTagFilter] = useState('todas')

  const allTags = useMemo(
    () => [...new Set(products.flatMap((p) => p.tags))].sort(),
    [products],
  )
  const visible =
    tagFilter === 'todas' ? products : products.filter((p) => p.tags.includes(tagFilter))

  function handleDelete(p) {
    if (window.confirm(`Excluir "${p.title}" (${p.id})? Esta ação não pode ser desfeita.`)) {
      deleteProduct(p.id, user.name)
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink/60">Filtrar por tag:</span>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="border border-slate-300 bg-white px-2 py-1 text-sm"
          >
            <option value="todas">Todas</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => setEditing('new')}
          className="border border-wine bg-wine px-4 py-1.5 text-sm font-semibold text-white hover:bg-wine-dark"
        >
          + Novo produto
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className={table}>
          <thead>
            <tr>
              <th className={th}>ID</th>
              <th className={th}>Capa</th>
              <th className={th}>Título</th>
              <th className={th}>Tipo</th>
              <th className={th}>Preço</th>
              <th className={th}>Estoque</th>
              <th className={th}>Tags</th>
              <th className={th}>Status</th>
              <th className={th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id} className={zebra}>
                <td className={`${td} font-mono text-xs`}>{p.id}</td>
                <td className={td}>
                  <img src={p.cover} alt="" className="h-12 w-8 border border-slate-200 object-cover" />
                </td>
                <td className={td}>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-ink/50">{p.author}</div>
                </td>
                <td className={td}>{TYPE_LABELS[p.type]}</td>
                <td className={`${td} font-mono`}>{formatBRL(p.price)}</td>
                <td className={`${td} font-mono text-center`}>
                  {p.stock === null ? '∞' : p.stock}
                </td>
                <td className={`${td} text-xs`}>{p.tags.join(', ')}</td>
                <td className={td}>
                  <span
                    className={`text-xs font-semibold uppercase ${
                      p.status === 'ativo' ? 'text-green-800' : 'text-ink/40'
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className={`${td} whitespace-nowrap`}>
                  <button onClick={() => setEditing(p)} className={btnGhost}>
                    Editar
                  </button>{' '}
                  <button onClick={() => handleDelete(p)} className={btnDanger}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ink/40">
        {visible.length} produto(s) · alterações persistidas no navegador (localStorage)
      </p>

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
