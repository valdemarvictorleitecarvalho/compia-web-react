import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

const navLinkClass = ({ isActive }) =>
  `text-sm tracking-wide ${
    isActive ? 'text-wine font-semibold' : 'text-ink/70 hover:text-ink'
  }`

const ROLE_LABELS = { cliente: 'Cliente', editor: 'Editor', gerente: 'Gerente' }

export default function Header() {
  const { user, role, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <header className="border-b border-slate-300 bg-paper">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4">
        <Link to="/" className="shrink-0">
          <span className="font-serif text-2xl font-bold tracking-tight text-ink">
            COMPIA
          </span>
          <span className="ml-2 hidden text-xs uppercase tracking-[0.2em] text-ink/50 md:inline">
            Editora · Computação e IA
          </span>
        </Link>

        <nav className="flex items-center gap-5">
          <NavLink to="/" className={navLinkClass} end>
            Catálogo
          </NavLink>
          {role === 'cliente' && (
            <NavLink to="/minha-conta" className={navLinkClass}>
              Minha conta
            </NavLink>
          )}
          {(role === 'editor' || role === 'gerente') && (
            <NavLink to="/admin" className={navLinkClass}>
              Painel
            </NavLink>
          )}
          <NavLink to="/carrinho" className={navLinkClass}>
            Carrinho{count > 0 && (
              <span className="ml-1 rounded-sm bg-wine px-1.5 py-0.5 font-mono text-xs text-white">
                {count}
              </span>
            )}
          </NavLink>

          {user ? (
            <span className="flex items-center gap-3 border-l border-slate-300 pl-5">
              <span className="hidden text-xs text-ink/50 sm:inline">
                {user.name}
                <span className="ml-1 text-ink/35">({ROLE_LABELS[role]})</span>
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-ink/60 underline hover:text-wine"
              >
                Sair
              </button>
            </span>
          ) : (
            <NavLink
              to="/login"
              className="border border-ink px-3 py-1 text-xs font-semibold text-ink hover:bg-ink hover:text-white"
            >
              Entrar
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}
