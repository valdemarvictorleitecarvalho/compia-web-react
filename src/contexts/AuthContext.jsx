import { createContext, useContext, useEffect, useState } from 'react'
import { loadJSON, saveJSON } from '../lib/storage'

// Contas falsas para a demonstração — as credenciais aparecem na tela de login.
export const ACCOUNTS = [
  {
    email: 'mariana.duarte@exemplo.com.br',
    password: 'cliente123',
    role: 'cliente',
    name: 'Mariana Duarte',
    cpf: '084.512.339-20',
    since: '2024-03-11',
  },
  {
    email: 'otavio.lins@compia.com.br',
    password: 'editor123',
    role: 'editor',
    name: 'Otávio Lins',
  },
  {
    email: 'regina.bastos@compia.com.br',
    password: 'gerente123',
    role: 'gerente',
    name: 'Regina Bastos',
  },
]

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [email, setEmail] = useState(() => loadJSON('session', null))

  useEffect(() => {
    saveJSON('session', email)
  }, [email])

  const user = ACCOUNTS.find((a) => a.email === email) ?? null
  const role = user?.role ?? null

  function login(loginEmail, password) {
    const account = ACCOUNTS.find(
      (a) => a.email.toLowerCase() === loginEmail.trim().toLowerCase(),
    )
    if (!account || account.password !== password) {
      throw new Error('E-mail ou senha incorretos.')
    }
    setEmail(account.email)
    return account
  }

  function logout() {
    setEmail(null)
  }

  return (
    <AuthContext.Provider value={{ user, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
