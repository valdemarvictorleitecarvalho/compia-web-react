import { useAuth } from '../../contexts/AuthContext'
import { useStore, ORDER_STATUSES } from '../../contexts/StoreContext'
import { formatBRL, formatDateTime } from '../../lib/format'
import { buildConfirmationEmail } from '../../lib/email'
import { table, th, td, zebra } from './tableStyles'

const STATUS_STYLES = {
  Pendente: 'text-amber-800',
  Pago: 'text-green-800',
  Enviado: 'text-blue-800',
  Entregue: 'text-ink/60',
  Cancelado: 'text-wine',
}

export default function OrdersTab() {
  const { user } = useAuth()
  const { orders, updateOrderStatus, dispatchEmail } = useStore()

  async function handleStatusChange(order, status) {
    updateOrderStatus(order.id, status, user.name)
    // Ao aprovar um pedido pendente (ex.: PIX compensado), dispara a confirmação
    if (status === 'Pago' && order.status === 'Pendente') {
      await dispatchEmail(
        'Confirmação do pedido',
        buildConfirmationEmail({ ...order, status }),
      )
    }
  }

  if (orders.length === 0) {
    return (
      <p className="border border-slate-300 bg-white p-6 text-center text-sm text-ink/50">
        Nenhum pedido registrado. Faça uma compra como Cliente para vê-la aqui.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className={table}>
        <thead>
          <tr>
            <th className={th}>Protocolo</th>
            <th className={th}>Data</th>
            <th className={th}>Cliente</th>
            <th className={th}>Produtos</th>
            <th className={th}>Entrega</th>
            <th className={th}>Pagamento</th>
            <th className={th}>Total</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className={zebra}>
              <td className={`${td} font-mono text-xs font-semibold`}>{o.id}</td>
              <td className={`${td} font-mono text-xs`}>{formatDateTime(o.createdAt)}</td>
              <td className={td}>
                <div>{o.customer.name}</div>
                <div className="text-xs text-ink/50">{o.customer.email}</div>
              </td>
              <td className={`${td} text-xs`}>
                {o.items.map((i) => (
                  <div key={i.id}>
                    <span className="font-mono">{i.quantity}x</span> {i.title}
                  </div>
                ))}
              </td>
              <td className={`${td} text-xs`}>
                {o.shipping.label}
                {o.address && !o.address.pickup && (
                  <div className="text-ink/50">
                    {o.address.street}, {o.address.number}
                    {o.address.complement && ` — ${o.address.complement}`} ·{' '}
                    {o.address.neighborhood}, {o.address.city} – {o.address.uf}
                  </div>
                )}
                {o.shipping.cep && (
                  <div className="font-mono text-ink/50">CEP {o.shipping.cep}</div>
                )}
              </td>
              <td className={`${td} text-xs`}>
                {o.payment.method === 'pix'
                  ? 'PIX'
                  : `${o.payment.brand} •${o.payment.last4}`}
                <div className="font-mono text-ink/50">NSU {o.payment.nsu}</div>
              </td>
              <td className={`${td} font-mono`}>{formatBRL(o.total)}</td>
              <td className={td}>
                <select
                  value={o.status}
                  onChange={(e) => handleStatusChange(o, e.target.value)}
                  className={`border border-slate-300 bg-white px-1.5 py-1 text-xs font-semibold ${
                    STATUS_STYLES[o.status] ?? ''
                  }`}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
