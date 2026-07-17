import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'

const KNOWN_TAGS = ['Inteligência Artificial', 'Blockchain', 'Cibersegurança', 'Criptografia']

const inputClass =
  'w-full border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-wine focus:outline-none'

export default function ProductForm({ product, onClose }) {
  const { user } = useAuth()
  const { upsertProduct, nextProductId } = useStore()
  const isNew = !product

  const [form, setForm] = useState(
    product ?? {
      id: nextProductId(),
      title: '',
      author: '',
      type: 'fisico',
      price: '',
      stock: 0,
      pages: '',
      isbn: '',
      year: new Date().getFullYear(),
      tags: [],
      cover: '',
      description: '',
      status: 'ativo',
    },
  )
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleTag(tag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }))
  }

  // "Upload" da capa: lemos o arquivo como data URL e guardamos no localStorage
  function handleCoverFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => set('cover', reader.result)
    reader.readAsDataURL(file)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return setError('Informe o título.')
    const price = parseFloat(String(form.price).replace(',', '.'))
    if (Number.isNaN(price) || price <= 0) return setError('Informe um preço válido.')
    if (form.tags.length === 0) return setError('Selecione ao menos uma categoria/tag.')

    upsertProduct(
      {
        ...form,
        price,
        stock: form.type === 'ebook' ? null : parseInt(form.stock, 10) || 0,
        pages: form.pages ? parseInt(form.pages, 10) : null,
        year: parseInt(form.year, 10) || new Date().getFullYear(),
        cover: form.cover || '/covers/fundamentos-ia.svg',
      },
      user.name,
    )
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="mt-8 w-full max-w-xl border border-slate-400 bg-paper shadow-sm"
      >
        <div className="flex items-center justify-between border-b border-slate-300 bg-slate-100 px-4 py-2.5">
          <h2 className="font-serif text-lg font-semibold">
            {isNew ? 'Novo produto' : `Editar ${form.id}`}
          </h2>
          <button type="button" onClick={onClose} className="text-xl leading-none text-ink/50 hover:text-ink">
            ×
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <label className="block text-sm">
              <span className="text-ink/70">Título</span>
              <input value={form.title} onChange={(e) => set('title', e.target.value)} className={`mt-1 ${inputClass}`} />
            </label>
            <label className="block text-sm">
              <span className="text-ink/70">ID</span>
              <input value={form.id} disabled className={`mt-1 font-mono ${inputClass} bg-slate-100`} />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-ink/70">Autor(es)</span>
            <input value={form.author} onChange={(e) => set('author', e.target.value)} className={`mt-1 ${inputClass}`} />
          </label>

          <label className="block text-sm">
            <span className="text-ink/70">Descrição</span>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className={`mt-1 ${inputClass}`}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-4">
            <label className="block text-sm">
              <span className="text-ink/70">Tipo</span>
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className={`mt-1 ${inputClass}`}>
                <option value="fisico">Livro físico</option>
                <option value="ebook">E-book</option>
                <option value="kit">Kit</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-ink/70">Preço (R$)</span>
              <input
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                inputMode="decimal"
                className={`mt-1 font-mono ${inputClass}`}
              />
            </label>
            <label className="block text-sm">
              <span className="text-ink/70">Estoque</span>
              <input
                value={form.type === 'ebook' ? '—' : form.stock ?? 0}
                onChange={(e) => set('stock', e.target.value.replace(/\D/g, ''))}
                disabled={form.type === 'ebook'}
                inputMode="numeric"
                className={`mt-1 font-mono ${inputClass} disabled:bg-slate-100`}
              />
            </label>
            <label className="block text-sm">
              <span className="text-ink/70">Status</span>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={`mt-1 ${inputClass}`}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </label>
          </div>

          <fieldset className="text-sm">
            <legend className="text-ink/70">Categorias / tags</legend>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5">
              {KNOWN_TAGS.map((tag) => (
                <label key={tag} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.tags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                    className="accent-wine"
                  />
                  {tag}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid items-end gap-4 sm:grid-cols-[1fr_90px]">
            <label className="block text-sm">
              <span className="text-ink/70">Capa (imagem)</span>
              <input type="file" accept="image/*" onChange={handleCoverFile} className="mt-1 block w-full text-xs" />
            </label>
            {form.cover && (
              <img src={form.cover} alt="Prévia da capa" className="h-24 w-16 border border-slate-300 object-cover" />
            )}
          </div>

          {error && <p className="border border-wine bg-wine/5 p-2 text-sm text-wine">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-300 bg-slate-50 px-4 py-3">
          <button type="button" onClick={onClose} className="border border-slate-300 px-4 py-1.5 text-sm hover:border-ink">
            Cancelar
          </button>
          <button type="submit" className="border border-wine bg-wine px-4 py-1.5 text-sm font-semibold text-white hover:bg-wine-dark">
            {isNew ? 'Cadastrar' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
