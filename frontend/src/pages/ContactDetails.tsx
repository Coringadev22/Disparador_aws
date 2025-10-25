import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsApi, emailLogsApi } from '@/services/api'
import { ArrowLeft, Mail, Edit, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ContactDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch contact
  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => contactsApi.getById(Number(id)).then(res => res.data),
  })

  // Fetch email logs for this contact
  const { data: emailLogs } = useQuery({
    queryKey: ['email-logs', 'contact', contact?.email],
    queryFn: () => emailLogsApi.getAll({ search: contact?.email, page_size: 50 }).then(res => res.data),
    enabled: !!contact?.email,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => contactsApi.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      navigate('/contacts')
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Erro ao excluir contato')
    },
  })

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir o contato ${contact?.email}?`)) {
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

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-gray-900 text-lg font-medium mb-2">Contato não encontrado</div>
        <Link to="/contacts" className="text-blue-600 hover:text-blue-700">
          Voltar para contatos
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
            onClick={() => navigate('/contacts')}
            className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {contact.first_name} {contact.last_name}
            </h1>
            <p className="text-sm text-gray-500">{contact.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/contacts/${id}/edit`}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Informações</h2>

            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{contact.email}</dd>
              </div>

              {contact.first_name && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">Nome</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contact.first_name}</dd>
                </div>
              )}

              {contact.last_name && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">Sobrenome</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contact.last_name}</dd>
                </div>
              )}

              <div>
                <dt className="text-xs font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
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
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                      <AlertTriangle className="h-3 w-3" />
                      Suprimido
                    </span>
                  )}
                </dd>
              </div>

              {contact.suppression_reason && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">Motivo da Supressão</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contact.suppression_reason}</dd>
                </div>
              )}

              <div>
                <dt className="text-xs font-medium text-gray-500">Criado em</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {format(new Date(contact.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </dd>
              </div>
            </dl>
          </div>

          {/* Lists */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Listas</h2>

            {contact.lists && contact.lists.length > 0 ? (
              <div className="space-y-2">
                {contact.lists.map((list) => (
                  <Link
                    key={list.id}
                    to={`/contact-lists/${list.id}`}
                    className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                  >
                    <div className="text-sm font-medium text-gray-900">{list.name}</div>
                    {list.description && (
                      <div className="text-xs text-gray-500 mt-1">{list.description}</div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Não pertence a nenhuma lista</p>
            )}
          </div>

          {/* Custom Fields */}
          {contact.custom_fields && Object.keys(contact.custom_fields).length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Campos Personalizados</h2>

              <dl className="space-y-2">
                {Object.entries(contact.custom_fields).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-xs font-medium text-gray-500">{key}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Email History */}
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Histórico de Emails</h2>
            </div>

            {emailLogs && emailLogs.results && emailLogs.results.length > 0 ? (
              <div className="space-y-3">
                {emailLogs.results.map((log) => (
                  <div key={log.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {log.campaign_data?.name || 'Email Avulso'}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              log.status === 'delivered'
                                ? 'bg-green-100 text-green-700'
                                : log.status === 'bounced' || log.status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : log.status === 'complained'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {log.status === 'delivered'
                              ? 'Entregue'
                              : log.status === 'bounced'
                              ? 'Bounce'
                              : log.status === 'failed'
                              ? 'Falhou'
                              : log.status === 'complained'
                              ? 'Reclamação'
                              : log.status === 'sent'
                              ? 'Enviado'
                              : log.status}
                          </span>
                        </div>

                        {log.subject && (
                          <p className="mt-1 text-sm text-gray-600">{log.subject}</p>
                        )}

                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          {log.sent_at && (
                            <span>
                              Enviado em {format(new Date(log.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          )}
                          {log.delivered_at && (
                            <span>
                              Entregue em {format(new Date(log.delivered_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  Nenhum email enviado para este contato ainda
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
