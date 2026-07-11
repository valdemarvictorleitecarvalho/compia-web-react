import { createContext, useContext, useEffect, useState } from 'react'
import seedProducts from '../data/products.json'
import { loadJSON, saveJSON } from '../lib/storage'
import { sendEmail } from '../lib/email'

// Estado global da "base de dados" mockada: produtos (seed do JSON + edições),
// pedidos, caixa de saída de e-mails e log de atividades — tudo no localStorage.
const StoreContext = createContext(null)

export const ORDER_STATUSES = ['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado']

function nowISO() {
  return new Date().toISOString()
}

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(() => loadJSON('products', seedProducts))
  const [orders, setOrders] = useState(() => loadJSON('orders', []))
  const [emails, setEmails] = useState(() => loadJSON('emails', []))
  const [logs, setLogs] = useState(() => loadJSON('logs', []))

  useEffect(() => saveJSON('products', products), [products])
  useEffect(() => saveJSON('orders', orders), [orders])
  useEffect(() => saveJSON('emails', emails), [emails])
  useEffect(() => saveJSON('logs', logs), [logs])

  function addLog(actor, action) {
    setLogs((prev) => [{ id: crypto.randomUUID(), at: nowISO(), actor, action }, ...prev])
  }

  // ---- Produtos (CRUD) ----
  function upsertProduct(product, actor) {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id)
      if (exists) {
        addLog(actor, `Produto ${product.id} ("${product.title}") editado`)
        return prev.map((p) => (p.id === product.id ? product : p))
      }
      addLog(actor, `Produto ${product.id} ("${product.title}") cadastrado`)
      return [...prev, product]
    })
  }

  function deleteProduct(id, actor) {
    setProducts((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) addLog(actor, `Produto ${id} ("${target.title}") excluído`)
      return prev.filter((p) => p.id !== id)
    })
  }

  function nextProductId() {
    const max = products.reduce((acc, p) => {
      const n = parseInt(String(p.id).replace(/\D/g, ''), 10)
      return Number.isNaN(n) ? acc : Math.max(acc, n)
    }, 0)
    return `CMP-${String(max + 1).padStart(4, '0')}`
  }

  // ---- Pedidos ----
  function createOrder(order) {
    setOrders((prev) => [order, ...prev])
    // Baixa de estoque dos itens físicos
    setProducts((prev) =>
      prev.map((p) => {
        const item = order.items.find((i) => i.id === p.id)
        if (item && typeof p.stock === 'number') {
          return { ...p, stock: Math.max(0, p.stock - item.quantity) }
        }
        return p
      }),
    )
    addLog(order.customer.name, `Pedido ${order.id} criado (${order.payment.method.toUpperCase()})`)
  }

  function updateOrderStatus(orderId, status, actor) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
    addLog(actor, `Pedido ${orderId} alterado para "${status}"`)
  }

  // ---- E-mails ----
  // Envia via EmailJS (real, se configurado) e registra na Caixa de Saída.
  async function dispatchEmail(kind, { to, subject, body }) {
    const record = {
      id: crypto.randomUUID(),
      at: nowISO(),
      kind,
      to,
      subject,
      body,
      status: 'enviando',
    }
    setEmails((prev) => [record, ...prev])
    const { status } = await sendEmail({ to, subject, body })
    setEmails((prev) => prev.map((e) => (e.id === record.id ? { ...e, status } : e)))
    addLog('Sistema', `E-mail "${kind}" ${status === 'falhou' ? 'FALHOU' : status} para ${to}`)
    return status
  }

  const value = {
    products,
    orders,
    emails,
    logs,
    upsertProduct,
    deleteProduct,
    nextProductId,
    createOrder,
    updateOrderStatus,
    dispatchEmail,
    addLog,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext)
}
