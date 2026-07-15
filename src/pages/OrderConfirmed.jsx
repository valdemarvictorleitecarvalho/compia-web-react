import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../contexts/StoreContext'
import { formatBRL, formatDateTime } from '../lib/format'

export default function OrderConfirmed() {
  const { id } = useParams()
  const { orders } = useStore()
  const order = orders.find((o) => o.id === id)
  const [copied, setCopied] = useState(false)

  if (!order) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-bold">Pedido não encontrado.</h1>
        <Link to="/" className="mt-4 inline-block text-wine underline">
          Voltar ao catálogo
        </Link>
      </main>
    )
  }

  const ebooks = order.items.filter((i) => i.type === 'ebook' || i.downloadFile)
  const isPixPending = order.payment.method === 'pix' && order.status === 'Pendente'

  async function copyPixKey() {
    await navigator.clipboard.writeText(order.payment.pixKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="border border-slate-300 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-wine">
          {order.status === 'Pago' ? 'Pagamento aprovado' : 'Aguardando pagamento'}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold">Pedido recebido</h1>
        <p className="mt-3 text-sm text-ink/70">
          Enviamos o comprovante para{' '}
          <strong className="text-ink">{order.customer.email}</strong>. Guarde o
          protocolo abaixo para acompanhamento.
        </p>

        {/* Cobrança PIX gerada no checkout */}
        {isPixPending && (
          <section className="mt-6 border border-slate-300 bg-slate-50 p-5">
            <h2 className="font-serif text-lg font-semibold">Pague com PIX</h2>
            <div className="mt-3 flex flex-col items-start gap-5 sm:flex-row">
              <img
                src={order.payment.qrImage}
                alt="QR Code PIX"
                className="h-44 w-44 border border-slate-300 bg-white"
              />
              <div className="text-sm">
                <p className="text-ink/80">
                  Escaneie o QR Code no aplicativo do seu banco ou use a chave
                  copia-e-cola abaixo.
                </p>
                <p className="mt-3 max-h-24 overflow-y-auto break-all border border-slate-300 bg-white p-2.5 font-mono text-xs">
                  {order.payment.pixKey}
                </p>
                <button
                  type="button"
                  onClick={copyPixKey}
                  className="mt-2 border border-ink px-4 py-1.5 text-xs font-semibold hover:bg-ink hover:text-white"
                >
                  {copied ? 'Copiado ✓' : 'Copiar chave'}
                </button>
              </div>
            </div>
          </section>
        )}

        <dl className="mt-6 grid grid-cols-[130px_1fr] gap-y-2 border-t border-slate-200 pt-5 text-sm">
          <dt className="text-ink/50">Protocolo</dt>
          <dd className="font-mono font-semibold">{order.id}</dd>
          <dt className="text-ink/50">Data</dt>
          <dd className="font-mono">{formatDateTime(order.createdAt)}</dd>
          <dt className="text-ink/50">Pagamento</dt>
          <dd>
            {order.payment.method === 'pix'
              ? 'PIX'
              : `Cartão ${order.payment.brand} final ${order.payment.last4}`}
            {order.payment.gateway === 'mercadopago' && (
              <span className="ml-1 text-xs text-ink/50">· Mercado Pago</span>
            )}
          </dd>
          <dt className="text-ink/50">Entrega</dt>
          <dd>{order.shipping.label}</dd>
          {order.address && !order.address.pickup && (
            <>
              <dt className="text-ink/50">Endereço</dt>
              <dd>
                {order.address.street}, {order.address.number}
                {order.address.complement && ` — ${order.address.complement}`}
                <br />
                {order.address.neighborhood}, {order.address.city} –{' '}
                {order.address.uf}{' '}
                <span className="font-mono text-xs">CEP {order.address.cep}</span>
              </dd>
            </>
          )}
          <dt className="text-ink/50">Total</dt>
          <dd className="font-mono font-semibold">{formatBRL(order.total)}</dd>
        </dl>

        {ebooks.length > 0 && (
          <section className="mt-6 border-t border-slate-200 pt-5">
            <h2 className="font-serif text-lg font-semibold">Seus e-books</h2>
            <p className="mt-1 text-xs text-ink/60">
              Os links também foram enviados por e-mail e ficam disponíveis na sua
              conta.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {ebooks.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2">
                  <span>{i.title}</span>
                  <a
                    href={`/downloads/${i.downloadFile || i.id + '.pdf'}`}
                    className="shrink-0 border border-wine px-3 py-1 text-xs font-semibold text-wine hover:bg-wine hover:text-white"
                    download
                  >
                    Baixar PDF
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/minha-conta"
            className="border border-ink px-5 py-2 text-sm font-semibold hover:bg-ink hover:text-white"
          >
            Acompanhar na minha conta
          </Link>
          <Link to="/" className="px-5 py-2 text-sm text-wine underline">
            Continuar comprando
          </Link>
        </div>
      </div>
    </main>
  )
}
