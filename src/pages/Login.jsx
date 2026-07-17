import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth, ACCOUNTS } from '../contexts/AuthContext'

const ROLE_LABELS = { cliente: 'Cliente', editor: 'Editor', gerente: 'Gerente' }

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function destinationFor(account) {
    if (state?.next) return state.next
    return account.role === 'cliente' ? '/minha-conta' : '/admin'
  }

  function handleSubmit(e) {
    e.preventDefault()
    try {
      const account = login(email, password)
      navigate(destinationFor(account), { replace: true })
    } catch (err) {
      setError(err.message)
    }
  }

  function quickFill(account) {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  const inputClass =
    'w-full border border-slate-300 bg-white px-3 py-2 text-sm focus:border-wine focus:outline-none'

  return (
    <main className="mx-auto max-w-md px-4 py-14">
      <h1 className="font-serif text-3xl font-bold">Entrar</h1>
      <p className="mt-1 text-sm text-ink/60">
        Acesse sua conta para acompanhar pedidos ou administrar a editora.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 border border-slate-300 p-6">
        <label className="block text-sm">
          <span className="text-ink/70">E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            className={`mt-1 font-mono ${inputClass}`}
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink/70">Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={`mt-1 font-mono ${inputClass}`}
          />
        </label>

        {error && <p className="border border-wine bg-wine/5 p-2 text-sm text-wine">{error}</p>}

        <button
          type="submit"
          className="w-full border border-wine bg-wine py-2.5 text-sm font-semibold text-white hover:bg-wine-dark"
        >
          Entrar
        </button>
      </form>

      {/* Contas de demonstração — visíveis de propósito para a apresentação */}
      <section className="mt-6 border border-slate-300 bg-slate-50 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink/50">
          Contas de demonstração
        </h2>
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-300 text-ink/50">
              <th className="py-1 pr-2 font-medium">Perfil</th>
              <th className="py-1 pr-2 font-medium">E-mail</th>
              <th className="py-1 pr-2 font-medium">Senha</th>
              <th className="py-1" />
            </tr>
          </thead>
          <tbody>
            {ACCOUNTS.map((a) => (
              <tr key={a.email} className="border-b border-slate-200 last:border-0">
                <td className="py-1.5 pr-2">{ROLE_LABELS[a.role]}</td>
                <td className="py-1.5 pr-2 font-mono">{a.email}</td>
                <td className="py-1.5 pr-2 font-mono">{a.password}</td>
                <td className="py-1.5 text-right">
                  <button
                    onClick={() => quickFill(a)}
                    className="border border-slate-300 px-2 py-0.5 hover:border-ink hover:bg-ink hover:text-white"
                  >
                    usar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  )
}
