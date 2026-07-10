import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../contexts/StoreContext'
import { useCart } from '../contexts/CartContext'
import { formatBRL } from '../lib/format'
import TypeBadge from '../components/TypeBadge'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products } = useStore()
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const product = products.find((p) => p.id === id)

  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl">Título não encontrado.</h1>
        <Link to="/" className="mt-4 inline-block text-wine underline">
          Voltar ao catálogo
        </Link>
      </main>
    )
  }

  const outOfStock = product.type !== 'ebook' && product.stock === 0
  const kitBooks = (product.kitItems ?? [])
    .map((kid) => products.find((p) => p.id === kid))
    .filter(Boolean)

  function handleAdd(goToCart) {
    addItem(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
    if (goToCart) navigate('/carrinho')
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-8 text-xs text-ink/50">
        <Link to="/" className="hover:text-wine">Catálogo</Link>
        <span className="mx-2">/</span>
        <span>{product.title}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-[320px_1fr]">
        <div>
          <div className="aspect-2/3 border border-slate-300 bg-white">
            <img
              src={product.cover}
              alt={`Capa de ${product.title}`}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div>
          <TypeBadge type={product.type} />
          <h1 className="mt-2 font-serif text-3xl font-bold leading-tight text-ink md:text-4xl">
            {product.title}
          </h1>
          <p className="mt-1 text-ink/70">{product.author}</p>

          <p className="mt-6 font-mono text-3xl text-ink">{formatBRL(product.price)}</p>
          <p className="mt-1 text-xs text-ink/50">
            {product.type === 'ebook'
              ? 'Entrega imediata por link de download após a confirmação do pagamento.'
              : product.type === 'kit'
                ? 'Itens físicos enviados pelos Correios; e-books liberados imediatamente.'
                : outOfStock
                  ? 'Título esgotado — reimpressão em breve.'
                  : `Em estoque: ${product.stock} unidades.`}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => handleAdd(false)}
              disabled={outOfStock}
              className="border border-wine bg-wine px-6 py-2.5 text-sm font-semibold text-white hover:bg-wine-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {added ? 'Adicionado ✓' : 'Adicionar ao carrinho'}
            </button>
            <button
              onClick={() => handleAdd(true)}
              disabled={outOfStock}
              className="border border-ink px-6 py-2.5 text-sm font-semibold text-ink hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Comprar agora
            </button>
          </div>

          <section className="mt-10 border-t border-slate-300 pt-6">
            <h2 className="font-serif text-xl font-semibold">Sobre a obra</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-ink/80">
              {product.description}
            </p>
          </section>

          {kitBooks.length > 0 && (
            <section className="mt-8 border-t border-slate-300 pt-6">
              <h2 className="font-serif text-xl font-semibold">Este kit inclui</h2>
              <ul className="mt-3 space-y-2">
                {kitBooks.map((b) => (
                  <li key={b.id}>
                    <Link to={`/produto/${b.id}`} className="text-wine hover:underline">
                      {b.title}
                    </Link>{' '}
                    <span className="text-xs text-ink/50">
                      ({b.type === 'ebook' ? 'e-book' : 'impresso'})
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8 border-t border-slate-300 pt-6 text-sm">
            <h2 className="font-serif text-xl font-semibold">Ficha técnica</h2>
            <dl className="mt-3 grid max-w-md grid-cols-[120px_1fr] gap-y-1.5">
              <dt className="text-ink/50">ISBN</dt>
              <dd className="font-mono">{product.isbn}</dd>
              <dt className="text-ink/50">Ano</dt>
              <dd className="font-mono">{product.year}</dd>
              {product.pages && (
                <>
                  <dt className="text-ink/50">Páginas</dt>
                  <dd className="font-mono">{product.pages}</dd>
                </>
              )}
              <dt className="text-ink/50">Temas</dt>
              <dd>{product.tags.join(', ')}</dd>
            </dl>
          </section>
        </div>
      </div>
    </main>
  )
}
