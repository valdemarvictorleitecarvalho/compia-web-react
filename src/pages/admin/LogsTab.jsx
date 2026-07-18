import { useStore } from '../../contexts/StoreContext'
import { formatDateTime } from '../../lib/format'
import { table, th, td, zebra } from './tableStyles'

export default function LogsTab() {
  const { logs } = useStore()

  if (logs.length === 0) {
    return (
      <p className="border border-slate-300 bg-white p-6 text-center text-sm text-ink/50">
        Nenhuma atividade registrada.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className={table}>
        <thead>
          <tr>
            <th className={th}>Data/hora</th>
            <th className={th}>Autor</th>
            <th className={th}>Ação</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id} className={zebra}>
              <td className={`${td} whitespace-nowrap font-mono text-xs`}>
                {formatDateTime(l.at)}
              </td>
              <td className={`${td} text-xs`}>{l.actor}</td>
              <td className={`${td} text-xs`}>{l.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
