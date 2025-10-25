import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { emailLogsApi } from '@/services/api'
import { Search, Mail, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusConfig = {
  queued: { label: 'Na fila', color: 'bg-gray-100 text-gray-700', icon: Clock },
  sending: { label: 'Enviando', color: 'bg-blue-100 text-blue-700', icon: Mail },
  sent: { label: 'Enviado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  bounced: { label: 'Bounce', color: 'bg-red-100 text-red-700', icon: XCircle },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-700', icon: XCircle },
  complained: { label: 'Reclamação', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
}

export default function EmailLogs() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('all')

  // Fetch email logs
  const { data, isLoading } = useQuery({
    queryKey: ['email-logs', page, search, status],
    queryFn: () => {
      const params: Record<string, any> = { page }

      if (search) params.search = search
      if (status !== 'all') params.status = status

      return emailLogsApi.getAll(params).then(res => res.data)
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Envios</h1>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar por email
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Endereço de email..."
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="queued">Na fila</option>
              <option value="sending">Enviando</option>
              <option value="sent">Enviado</option>
              <option value="delivered">Entregue</option>
              <option value="bounced">Bounce</option>
              <option value="failed">Falhou</option>
              <option value="complained">Reclamação</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white shadow overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Carregando...</div>
        ) : !data?.results || data.results.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            Nenhum registro encontrado
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Campanha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Enviado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Último evento
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.results.map((log) => {
                    const statusInfo = statusConfig[log.status as keyof typeof statusConfig]
                    const StatusIcon = statusInfo?.icon || Mail

                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {log.recipient_email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {log.campaign_data?.name || '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {statusInfo ? (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusInfo.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">{log.status}</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {log.sent_at
                            ? format(new Date(log.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {log.last_event_at
                            ? format(new Date(log.last_event_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && (data.next || data.previous) && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
                <div className="text-sm text-gray-700">
                  Mostrando {data.results.length} de {data.count} registros
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={!data.previous}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!data.next}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
