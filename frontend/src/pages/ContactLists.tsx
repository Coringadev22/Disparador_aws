import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { contactListsApi } from '@/services/api'
import { Link } from 'react-router-dom'
import { Plus, Search, Users } from 'lucide-react'

export default function ContactLists() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  // Fetch contact lists
  const { data, isLoading } = useQuery({
    queryKey: ['contact-lists', page, search],
    queryFn: () => {
      const params: Record<string, any> = { page }
      if (search) params.search = search

      return contactListsApi.getAll(params).then(res => res.data)
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Listas de Contatos</h1>
        <Link
          to="/contact-lists/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nova Lista
        </Link>
      </div>

      {/* Search */}
      <div className="rounded-lg bg-white p-6 shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buscar Lista
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome da lista..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Contact Lists Grid */}
      {isLoading ? (
        <div className="rounded-lg bg-white p-12 text-center text-gray-500 shadow">
          Carregando...
        </div>
      ) : !data?.results || data.results.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center text-gray-500 shadow">
          Nenhuma lista encontrada
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.results.map((list) => (
              <Link
                key={list.id}
                to={`/contact-lists/${list.id}`}
                className="group rounded-lg bg-white p-6 shadow transition-all hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                        {list.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {list.total_contacts} contatos
                      </p>
                    </div>
                  </div>
                </div>

                {list.description && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {list.description}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-500">
                    Criado em {new Date(list.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-xs font-medium text-blue-600 group-hover:text-blue-700">
                    Ver detalhes →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {data && (data.next || data.previous) && (
            <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow">
              <div className="text-sm text-gray-700">
                Mostrando {data.results.length} de {data.count} listas
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
  )
}
