import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { calculateTaxes, cartHasPhysical, ISS_RATE } from '../lib/taxes'
import { quoteShipping } from '../lib/shipping'
import { lookupCEP } from '../lib/cep'
import { formatBRL, maskCEP } from '../lib/format'
import TypeBadge from '../components/TypeBadge'

export default function Cart() {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, subtotal } = useCart()

  const [cep, setCep] = useState('')
  const [quoting, setQuoting] = useState(false)
  const [quoteError, setQuoteError] = useState('')
  const [destination, setDestination] = useState(null) // { cep, uf, city, ... }
  const [options, setOptions] = useState(null)
  const [selected, setSelected] = useState(null)

  const needsShipping = cartHasPhysical(items)
  const taxes = calculateTaxes(items, needsShipping ? destination?.uf : null)
  const shippingPrice = needsShipping ? (selected?.price ?? null) : 0
  const totalKnown = taxes.total !== null && (!needsShipping || shippingPrice !== null)
  const total = totalKnown ? subtotal + taxes.total + (shippingPrice ?? 0) : null

  const physicalCount = items
    .filter((i) => i.type !== 'ebook')
    .reduce((acc, i) => acc + i.quantity, 0)

  async function handleQuote(e) {
    e.preventDefault()
    setQuoting(true)
    setQuoteError('')
    setOptions(null)
    setSelected(null)
    setDestination(null)
    try {
      const [dest, opts] = await Promise.all([
        lookupCEP(cep),
        quoteShipping(cep, physicalCount),
      ])
      setDestination(dest)
      setOptions(opts)
    } catch (err) {
      setQuoteError(err.message)
    } finally {
      setQuoting(false)
    }
  }

  function goToCheckout() {
    const shipping = needsShipping
      ? { ...selected, cep: maskCEP(cep) }
      : { id: 'digital', label: 'Entrega digital (e-mail)', price: 0, days: 0, cep: null }
    navigate('/checkout', { state: { shipping, destination } })
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl font-bold">Seu carrinho está vazio</h1>
        <Link to="/" className="mt-4 inline-block text-wine underline">
          Explorar o catálogo
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Carrinho</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Itens */}
        <section>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wider text-ink/50">
                <th className="py-2 pr-4 font-medium">Item</th>
                <th className="py-2 pr-4 font-medium">Preço</th>
                <th className="py-2 pr-4 font-medium">Qtde.</th>
                <th className="py-2 pr-4 font-medium text-right">Subtotal</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b border-slate-200">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={i.cover}
                        alt=""
                        className="h-16 w-11 border border-slate-300 object-cover"
                      />
                      <div>
                        <Link
                          to={`/produto/${i.id}`}
                          className="font-serif font-semibold hover:text-wine"
                        >
                          {i.title}
                        </Link>
                        <div className="mt-1">
                          <TypeBadge type={i.type} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-mono">{formatBRL(i.price)}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center border border-slate-300">
                      <button
                        onClick={() => updateQuantity(i.id, i.quantity - 1)}
                        className="px-2 py-1 hover:bg-slate-100"
                        aria-label="Diminuir quantidade"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-mono">{i.quantity}</span>
                      <button
                        onClick={() => updateQuantity(i.id, i.quantity + 1)}
                        className="px-2 py-1 hover:bg-slate-100"
                        aria-label="Aumentar quantidade"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono">
                    {formatBRL(i.price * i.quantity)}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => removeItem(i.id)}
                      className="text-xs text-ink/50 underline hover:text-wine"
                    >
                      remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Frete e destino */}
          {needsShipping && (
            <section className="mt-8 border border-slate-300 p-4">
              <h2 className="font-serif text-lg font-semibold">Frete e impostos</h2>
              <p className="mt-1 text-xs text-ink/50">
                O CEP define as opções de entrega e a alíquota de ICMS do estado
                de destino.
              </p>
              <form onSubmit={handleQuote} className="mt-3 flex flex-wrap gap-2">
                <input
                  value={cep}
                  onChange={(e) => setCep(maskCEP(e.target.value))}
                  placeholder="CEP (ex: 58429-900)"
                  className="w-40 border border-slate-300 px-3 py-2 font-mono text-sm focus:border-wine focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={quoting}
                  className="border border-ink px-4 py-2 text-sm font-semibold hover:bg-ink hover:text-white disabled:opacity-50"
                >
                  {quoting ? 'Consultando…' : 'Consultar'}
                </button>
              </form>
              {quoteError && <p className="mt-2 text-sm text-wine">{quoteError}</p>}
              {destination && (
                <p className="mt-2 text-xs text-ink/60">
                  Destino:{' '}
                  <strong className="text-ink">
                    {destination.city ? `${destination.city} – ` : ''}
                    {destination.uf}
                  </strong>
                </p>
              )}
              {options && (
                <ul className="mt-3 divide-y divide-slate-200 border-t border-slate-200">
                  {options.map((opt) => (
                    <li key={opt.id}>
                      <label className="flex cursor-pointer items-center justify-between gap-2 py-2.5 text-sm">
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="frete"
                            checked={selected?.id === opt.id}
                            onChange={() => setSelected(opt)}
                            className="accent-wine"
                          />
                          {opt.label}
                          {opt.days > 0 && (
                            <span className="text-xs text-ink/50">
                              até {opt.days} dias úteis
                            </span>
                          )}
                        </span>
                        <span className="font-mono">
                          {opt.price === 0 ? 'Grátis' : formatBRL(opt.price)}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </section>

        {/* Resumo */}
        <aside className="h-fit border border-slate-300 p-5">
          <h2 className="font-serif text-lg font-semibold">Resumo do pedido</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/70">Subtotal</dt>
              <dd className="font-mono">{formatBRL(subtotal)}</dd>
            </div>
            {needsShipping && (
              <div className="flex justify-between">
                <dt className="text-ink/70">
                  ICMS
                  {taxes.uf && taxes.icmsRate !== null && (
                    <span className="ml-1 text-xs text-ink/50">
                      ({taxes.uf} · {(taxes.icmsRate * 100).toLocaleString('pt-BR')}%)
                    </span>
                  )}
                </dt>
                <dd className="font-mono">
                  {taxes.icms === null ? 'informe o CEP' : formatBRL(taxes.icms)}
                </dd>
              </div>
            )}
            {taxes.iss > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink/70">
                  ISS
                  <span className="ml-1 text-xs text-ink/50">
                    ({(ISS_RATE * 100).toFixed(0)}% · e-books)
                  </span>
                </dt>
                <dd className="font-mono">{formatBRL(taxes.iss)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink/70">Frete</dt>
              <dd className="font-mono">
                {!needsShipping
                  ? 'Grátis (digital)'
                  : shippingPrice === null
                    ? '—'
                    : shippingPrice === 0
                      ? 'Grátis'
                      : formatBRL(shippingPrice)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-slate-300 pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd className="font-mono">{total === null ? '—' : formatBRL(total)}</dd>
            </div>
          </dl>
          {needsShipping && !selected && (
            <p className="mt-3 text-xs text-ink/50">
              Informe o CEP e selecione o frete para continuar.
            </p>
          )}
          <button
            onClick={goToCheckout}
            disabled={needsShipping && (!selected || !destination)}
            className="mt-5 w-full border border-wine bg-wine py-2.5 text-sm font-semibold text-white hover:bg-wine-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ir para o pagamento
          </button>
        </aside>
      </div>
    </main>
  )
}
