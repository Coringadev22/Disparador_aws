import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactListsApi } from '@/services/api'
import { ArrowLeft, Save } from 'lucide-react'

export default function ContactListForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  // Fetch list if editing
  const { data: contactList, isLoading } = useQuery({
    queryKey: ['contact-list', id],
    queryFn: () => contactListsApi.getById(Number(id)).then(res => res.data),
    enabled: isEdit,
  })

  // Load data when fetched
  useEffect(() => {
    if (contactList) {
      setFormData({
        name: contactList.name || '',
        description: contactList.description || '',
      })
    }
  }, [contactList])

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEdit) {
        return contactListsApi.update(Number(id), data)
      } else {
        return contactListsApi.create(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] })
      navigate('/contact-lists')
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.name?.[0] ||
                          error.message ||
                          'Erro ao salvar lista'
      alert(errorMessage)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Nome da lista é obrigatório')
      return
    }

    saveMutation.mutate({
      name: formData.name.trim(),
      description: formData.description.trim(),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-500">Carregando...</div>
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
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Editar Lista de Contatos' : 'Nova Lista de Contatos'}
          </h1>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar Lista'}
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Lista *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Clientes VIP, Newsletter, Prospects..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o propósito desta lista..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/500 caracteres
            </p>
          </div>

          {isEdit && contactList && (
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Informações</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Total de contatos:</dt>
                  <dd className="font-medium text-gray-900">{contactList.total_contacts}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Criado em:</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(contactList.created_at).toLocaleDateString('pt-BR')}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
