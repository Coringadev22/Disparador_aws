import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { contactsApi } from '@/services/api'
import { Link } from 'react-router-dom'
import { Download, Upload, Plus, Search, CheckCircle, XCircle } from 'lucide-react'

export default function Contacts() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isSubscribed, setIsSubscribed] = useState<string>('all')
  const [isSuppressed, setIsSuppressed] = useState<string>('all')

  // Fetch contacts
  const { data, isLoading } = useQuery({
    queryKey: ['contacts', page, search, isSubscribed, isSuppressed],
    queryFn: () => {
      const params: Record<string, any> = { page }

      if (search) params.search = search
      if (isSubscribed !== 'all') params.is_subscribed = isSubscribed === 'true'
      if (isSuppressed !== 'all') params.is_suppressed = isSuppressed === 'true'

      return contactsApi.getAll(params).then(res => res.data)
    },
  })

  const handleExportCSV = async () => {
    try {
      const params: Record<string, any> = {}

      if (search) params.search = search
      if (isSubscribed !== 'all') params.is_subscribed = isSubscribed === 'true'
      if (isSuppressed !== 'all') params.is_suppressed = isSuppressed === 'true'

      const response = await contactsApi.exportCSV(params)

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'contacts.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Erro ao exportar CSV')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contatos</h1>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
          <Link
            to="/contacts/upload"
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            Upload CSV
          </Link>
          <Link
            to="/contacts/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Novo Contato
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Email, nome ou sobrenome..."
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Subscribed Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inscrito
            </label>
            <select
              value={isSubscribed}
              onChange={(e) => setIsSubscribed(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>

          {/* Suppressed Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Suprimido
            </label>
            <select
              value={isSuppressed}
              onChange={(e) => setIsSuppressed(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="false">Não</option>
              <option value="true">Sim</option>
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
            Nenhum contato encontrado
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
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Listas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {data.results.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {contact.email}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {contact.first_name} {contact.last_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {contact.lists?.map(list => list.name).join(', ') || '-'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          {contact.is_subscribed ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              <CheckCircle className="h-3 w-3" />
                              Inscrito
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                              <XCircle className="h-3 w-3" />
                              Não inscrito
                            </span>
                          )}
                          {contact.is_suppressed && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                              Suprimido
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <Link
                          to={`/contacts/${contact.id}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && (data.next || data.previous) && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
                <div className="text-sm text-gray-700">
                  Mostrando {data.results.length} de {data.count} contatos
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
