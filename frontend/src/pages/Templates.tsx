import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { templatesApi } from '@/services/api'
import { Link } from 'react-router-dom'
import { Plus, Search, Mail } from 'lucide-react'

export default function Templates() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  // Fetch templates
  const { data, isLoading } = useQuery({
    queryKey: ['templates', page, search],
    queryFn: () => {
      const params: Record<string, any> = { page }
      if (search) params.search = search

      return templatesApi.getAll(params).then(res => res.data)
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Templates de Email</h1>
        <Link
          to="/templates/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Novo Template
        </Link>
      </div>

      {/* Search */}
      <div className="rounded-lg bg-white p-6 shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buscar Template
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome do template..."
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="rounded-lg bg-white p-12 text-center text-gray-500 shadow">
          Carregando...
        </div>
      ) : !data?.results || data.results.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center text-gray-500 shadow">
          Nenhum template encontrado
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.results.map((template) => (
              <Link
                key={template.id}
                to={`/templates/${template.id}`}
                className="group rounded-lg bg-white p-6 shadow transition-all hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                        {template.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {template.variables?.length || 0} variáveis
                      </p>
                    </div>
                  </div>
                </div>

                {template.subject_template && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Assunto:</p>
                    <p className="text-sm text-gray-700 line-clamp-1">
                      {template.subject_template}
                    </p>
                  </div>
                )}

                {template.html_content && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Preview:</p>
                    <div
                      className="text-xs text-gray-600 line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html: template.html_content.substring(0, 150) + '...'
                      }}
                    />
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-500">
                    Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
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
                Mostrando {data.results.length} de {data.count} templates
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
