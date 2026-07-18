import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { formatBRL, formatDate, formatDateTime } from '../lib/format'

const STATUS_STYLES = {
  Pendente: 'text-amber-800',
  Pago: 'text-green-800',
  Enviado: 'text-blue-800',
  Entregue: 'text-ink/60',
  Cancelado: 'text-wine',
}

export default function MyAccount() {
  const { role, user } = useAuth()
  const { orders } = useStore()

  if (!role) {
    return <Navigate to="/login" replace state={{ next: '/minha-conta' }} />
  }
  if (role !== 'cliente') {
    return <Navigate to="/admin" replace />
  }

  // Sem login real: consideramos do cliente os pedidos feitos com o e-mail dele
  // ou informados manualmente no checkout durante a sessão.
  const myOrders = orders

  const ebooks = myOrders
    .filter((o) => o.status !== 'Cancelado')
    .flatMap((o) =>
      o.items
        .filter((i) => i.type === 'ebook' || i.downloadFile)
        .map((i) => ({ ...i, orderId: o.id })),
    )

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Minha conta</h1>

      <section className="mt-6 border border-slate-300 p-5">
        <h2 className="font-serif text-lg font-semibold">Dados cadastrais</h2>
        <dl className="mt-3 grid grid-cols-[110px_1fr] gap-y-1.5 text-sm">
          <dt className="text-ink/50">Nome</dt>
          <dd>{user.name}</dd>
          <dt className="text-ink/50">E-mail</dt>
          <dd className="font-mono">{user.email}</dd>
          <dt className="text-ink/50">CPF</dt>
          <dd className="font-mono">{user.cpf}</dd>
          <dt className="text-ink/50">Cliente desde</dt>
          <dd>{formatDate(user.since)}</dd>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-semibold">Meus pedidos</h2>
        {myOrders.length === 0 ? (
          <p className="mt-3 border border-slate-300 bg-white p-6 text-center text-sm text-ink/50">
            Você ainda não fez nenhum pedido.{' '}
            <Link to="/" className="text-wine underline">
              Conheça o catálogo
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 space-y-4">
            {myOrders.map((o) => (
              <li key={o.id} className="border border-slate-300">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-sm">
                  <span className="font-mono font-semibold">{o.id}</span>
                  <span className="font-mono text-xs text-ink/50">
                    {formatDateTime(o.createdAt)}
                  </span>
                  <span
                    className={`font-mono text-xs font-bold uppercase ${
                      STATUS_STYLES[o.status] ?? ''
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
                <div className="px-4 py-3 text-sm">
                  <ul className="space-y-1">
                    {o.items.map((i) => (
                      <li key={i.id} className="flex justify-between gap-2">
                        <span>
                          <span className="font-mono">{i.quantity}x</span> {i.title}
                        </span>
                        <span className="font-mono">{formatBRL(i.price * i.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-xs text-ink/60">
                    <span>{o.shipping.label}</span>
                    <span className="font-mono font-semibold text-ink">
                      Total {formatBRL(o.total)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {ebooks.length > 0 && (
        <section className="mt-8">
          <h2 className="font-serif text-xl font-semibold">Meus e-books</h2>
          <p className="mt-1 text-xs text-ink/50">
            Downloads liberados após a confirmação da compra. Os links não expiram.
          </p>
          <ul className="mt-3 divide-y divide-slate-200 border border-slate-300 bg-white">
            {ebooks.map((e, idx) => (
              <li
                key={`${e.orderId}-${e.id}-${idx}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span>
                  {e.title}
                  <span className="ml-2 font-mono text-xs text-ink/40">{e.orderId}</span>
                </span>
                <a
                  href={`/downloads/${e.downloadFile || e.id + '.pdf'}`}
                  download
                  className="border border-wine px-3 py-1 text-xs font-semibold text-wine hover:bg-wine hover:text-white"
                >
                  Baixar PDF
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
