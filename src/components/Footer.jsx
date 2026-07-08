export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-300 bg-paper">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-ink/60 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-serif text-sm font-bold text-ink">COMPIA</span>{' '}
          — Editora universitária de Computação e Inteligência Artificial.
        </p>
        <p>
          Projeto acadêmico (Web 1 · UFCG). Loja de demonstração — nenhuma venda
          real é efetuada.
        </p>
      </div>
    </footer>
  )
}
