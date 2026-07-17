import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useStore } from '../../contexts/StoreContext'
import ProductsTab from './ProductsTab'
import OrdersTab from './OrdersTab'
import EmailsTab from './EmailsTab'
import LogsTab from './LogsTab'

const TABS = [
  { id: 'produtos', label: 'Produtos', roles: ['editor', 'gerente'] },
  { id: 'pedidos', label: 'Pedidos', roles: ['gerente'] },
  { id: 'mensageria', label: 'Mensageria', roles: ['gerente'] },
  { id: 'logs', label: 'Logs de atividade', roles: ['gerente'] },
]

export default function Admin() {
  const { role, user } = useAuth()
  const { orders, products, emails } = useStore()
  const [tab, setTab] = useState('produtos')

  // Controle de acesso: exige login; cliente não entra no painel
  if (!role) {
    return <Navigate to="/login" replace state={{ next: '/admin' }} />
  }
  if (role === 'cliente') {
    return <Navigate to="/minha-conta" replace />
  }

  const allowedTabs = TABS.filter((t) => t.roles.includes(role))
  const activeTab = allowedTabs.some((t) => t.id === tab) ? tab : allowedTabs[0].id

  const pending = orders.filter((o) => o.status === 'Pendente').length

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="border-b border-slate-300 pb-4">
        <h1 className="font-serif text-3xl font-bold">Painel administrativo</h1>
        <p className="mt-1 text-sm text-ink/60">
          Sessão de <strong>{user.name}</strong> ({role === 'gerente' ? 'Gerência' : 'Editorial'})
          {' · '}
          <span className="font-mono text-xs">
            {products.length} produtos / {orders.length} pedidos ({pending} pendentes) /{' '}
            {emails.length} e-mails
          </span>
        </p>
      </header>

      <nav className="mt-5 flex flex-wrap gap-1 border-b border-slate-300">
        {allowedTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`-mb-px border px-4 py-2 text-sm ${
              activeTab === t.id
                ? 'border-slate-300 border-b-paper bg-paper font-semibold text-wine'
                : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            {t.label}
            {t.id === 'pedidos' && pending > 0 && (
              <span className="ml-1.5 bg-wine px-1.5 font-mono text-xs text-white">
                {pending}
              </span>
            )}
          </button>
        ))}
      </nav>

      <section className="mt-6">
        {activeTab === 'produtos' && <ProductsTab />}
        {activeTab === 'pedidos' && <OrdersTab />}
        {activeTab === 'mensageria' && <EmailsTab />}
        {activeTab === 'logs' && <LogsTab />}
      </section>
    </main>
  )
}
