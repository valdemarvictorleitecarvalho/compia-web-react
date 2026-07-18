import { useState } from 'react'
import { useStore } from '../../contexts/StoreContext'
import { formatDateTime } from '../../lib/format'
import { emailJsConfigured } from '../../lib/email'
import { table, th, td, zebra, btnGhost } from './tableStyles'

const STATUS_LABELS = {
  enviado: { label: 'ENVIADO', cls: 'text-green-800' },
  simulado: { label: 'SIMULADO', cls: 'text-amber-800' },
  falhou: { label: 'FALHOU', cls: 'text-wine' },
  enviando: { label: 'ENVIANDO…', cls: 'text-ink/50' },
}

export default function EmailsTab() {
  const { emails } = useStore()
  const [open, setOpen] = useState(null)

  return (
    <div>
      <p className="mb-3 text-xs text-ink/50">
        Caixa de saída — registro de auditoria de todos os e-mails disparados pelo
        sistema via EmailJS.{' '}
        {emailJsConfigured
          ? 'Credenciais configuradas: envio real ativo.'
          : 'Sem credenciais no .env: e-mails registrados como SIMULADO.'}
      </p>

      {emails.length === 0 ? (
        <p className="border border-slate-300 bg-white p-6 text-center text-sm text-ink/50">
          Nenhum e-mail disparado ainda.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className={table}>
            <thead>
              <tr>
                <th className={th}>Data/hora</th>
                <th className={th}>Tipo</th>
                <th className={th}>Destinatário</th>
                <th className={th}>Assunto</th>
                <th className={th}>Status</th>
                <th className={th}>Conteúdo</th>
              </tr>
            </thead>
            <tbody>
              {emails.map((e) => {
                const st = STATUS_LABELS[e.status] ?? STATUS_LABELS.enviando
                return (
                  <tr key={e.id} className={zebra}>
                    <td className={`${td} font-mono text-xs`}>{formatDateTime(e.at)}</td>
                    <td className={`${td} text-xs`}>{e.kind}</td>
                    <td className={`${td} font-mono text-xs`}>{e.to}</td>
                    <td className={`${td} text-xs`}>{e.subject}</td>
                    <td className={td}>
                      <span className={`font-mono text-xs font-semibold ${st.cls}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className={td}>
                      <button
                        onClick={() => setOpen(open === e.id ? null : e.id)}
                        className={btnGhost}
                      >
                        {open === e.id ? 'Ocultar' : 'Ver'}
                      </button>
                      {open === e.id && (
                        <pre className="mt-2 max-w-md whitespace-pre-wrap border border-slate-200 bg-white p-2 font-mono text-[11px] leading-relaxed text-ink/80">
                          {e.body}
                        </pre>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
