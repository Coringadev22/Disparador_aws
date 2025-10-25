import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactListsApi, contactsApi } from '@/services/api'
import { ArrowLeft, Edit, Trash2, Users, Mail } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ContactListDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch contact list
  const { data: contactList, isLoading } = useQuery({
    queryKey: ['contact-list', id],
    queryFn: () => contactListsApi.getById(Number(id)).then(res => res.data),
  })

  // Fetch contacts in this list
  const { data: contactsData } = useQuery({
    queryKey: ['contacts', 'list', id],
    queryFn: () => contactsApi.getAll({ list_id: id, page_size: 100 }).then(res => res.data),
    enabled: !!id,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => contactListsApi.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] })
      navigate('/contact-lists')
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Erro ao excluir lista')
    },
  })

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir a lista "${contactList?.name}"?\n\nOs contatos não serão excluídos, apenas removidos desta lista.`)) {
      deleteMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!contactList) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-gray-900 text-lg font-medium mb-2">Lista não encontrada</div>
        <Link to="/contact-lists" className="text-blue-600 hover:text-blue-700">
          Voltar para listas
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/contact-lists')}
            className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contactList.name}</h1>
            {contactList.description && (
              <p className="text-sm text-gray-500">{contactList.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/contact-lists/${id}/edit`}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Contatos</p>
              <p className="text-2xl font-bold text-gray-900">{contactList.total_contacts}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Inscritos</p>
              <p className="text-2xl font-bold text-gray-900">
                {contactsData?.results?.filter(c => c.is_subscribed).length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div>
            <p className="text-sm font-medium text-gray-500">Criada em</p>
            <p className="mt-1 text-sm text-gray-900">
              {format(new Date(contactList.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div>
            <p className="text-sm font-medium text-gray-500">Atualizada em</p>
            <p className="mt-1 text-sm text-gray-900">
              {format(new Date(contactList.updated_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="rounded-lg bg-white shadow">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Contatos ({contactList.total_contacts})</h2>
          <Link
            to="/contacts/upload"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Importar CSV
          </Link>
        </div>

        {contactsData?.results && contactsData.results.length > 0 ? (
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Adicionado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {contactsData.results.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {contact.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {contact.first_name} {contact.last_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {contact.is_subscribed ? (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          Inscrito
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                          Não inscrito
                        </span>
                      )}
                      {contact.is_suppressed && (
                        <span className="ml-2 inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                          Suprimido
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {format(new Date(contact.created_at), "dd/MM/yyyy", { locale: ptBR })}
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
        ) : (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              Nenhum contato nesta lista ainda
            </p>
            <Link
              to="/contacts/upload"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Importar Contatos
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
