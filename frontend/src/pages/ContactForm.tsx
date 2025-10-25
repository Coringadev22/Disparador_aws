import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsApi, contactListsApi } from '@/services/api'
import { ArrowLeft, Save } from 'lucide-react'

export default function ContactForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = Boolean(id)

  // Form state
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(true)
  const [selectedLists, setSelectedLists] = useState<number[]>([])
  const [customFields, setCustomFields] = useState<Record<string, any>>({})

  // Custom field management
  const [customFieldKey, setCustomFieldKey] = useState('')
  const [customFieldValue, setCustomFieldValue] = useState('')

  // Fetch contact if editing
  const { data: contact, isLoading: contactLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => contactsApi.getById(Number(id)).then(res => res.data),
    enabled: isEdit,
  })

  // Fetch all contact lists
  const { data: listsData } = useQuery({
    queryKey: ['contact-lists-all'],
    queryFn: () => contactListsApi.getAll({ page: 1, page_size: 100 }).then(res => res.data),
  })

  // Load contact data when fetched
  useEffect(() => {
    if (contact) {
      setEmail(contact.email || '')
      setFirstName(contact.first_name || '')
      setLastName(contact.last_name || '')
      setIsSubscribed(contact.is_subscribed !== false)
      setSelectedLists(contact.lists?.map(l => l.id) || [])
      setCustomFields(contact.custom_fields || {})
    }
  }, [contact])

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      if (isEdit) {
        return contactsApi.update(Number(id), data)
      } else {
        return contactsApi.create(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      navigate('/contacts')
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Erro ao salvar contato')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      alert('Email é obrigatório')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      alert('Email inválido')
      return
    }

    saveMutation.mutate({
      email: email.trim().toLowerCase(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      is_subscribed: isSubscribed,
      list_ids: selectedLists,
      custom_fields: customFields,
    })
  }

  const toggleList = (listId: number) => {
    if (selectedLists.includes(listId)) {
      setSelectedLists(selectedLists.filter(id => id !== listId))
    } else {
      setSelectedLists([...selectedLists, listId])
    }
  }

  const addCustomField = () => {
    if (!customFieldKey.trim()) {
      alert('Nome do campo é obrigatório')
      return
    }

    if (customFields[customFieldKey]) {
      alert('Este campo já existe')
      return
    }

    setCustomFields({
      ...customFields,
      [customFieldKey]: customFieldValue,
    })

    setCustomFieldKey('')
    setCustomFieldValue('')
  }

  const removeCustomField = (key: string) => {
    const newFields = { ...customFields }
    delete newFields[key]
    setCustomFields(newFields)
  }

  if (contactLoading) {
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
            onClick={() => navigate('/contacts')}
            className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Editar Contato' : 'Novo Contato'}
          </h1>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Salvando...' : 'Salvar Contato'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Informações Básicas</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                  disabled={isEdit} // Email can't be changed after creation
                />
                {isEdit && (
                  <p className="mt-1 text-xs text-gray-500">
                    O email não pode ser alterado após criação
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="João"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sobrenome
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Silva"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isSubscribed"
                  checked={isSubscribed}
                  onChange={(e) => setIsSubscribed(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isSubscribed" className="text-sm font-medium text-gray-700">
                  Inscrito (pode receber emails)
                </label>
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Campos Personalizados</h2>

            {/* Current Custom Fields */}
            {Object.keys(customFields).length > 0 && (
              <div className="mb-4 space-y-2">
                {Object.entries(customFields).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">{key}:</span>
                      <span className="ml-2 text-sm text-gray-600">{String(value)}</span>
                    </div>
                    <button
                      onClick={() => removeCustomField(key)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Custom Field */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customFieldKey}
                onChange={(e) => setCustomFieldKey(e.target.value)}
                placeholder="Nome do campo"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                value={customFieldValue}
                onChange={(e) => setCustomFieldValue(e.target.value)}
                placeholder="Valor"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={addCustomField}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Lists */}
        <div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Listas</h2>

            {listsData?.results && listsData.results.length > 0 ? (
              <div className="space-y-2">
                {listsData.results.map((list) => (
                  <label
                    key={list.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLists.includes(list.id)}
                      onChange={() => toggleList(list.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{list.name}</div>
                      {list.description && (
                        <div className="text-xs text-gray-500">{list.description}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        {list.total_contacts} contatos
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Nenhuma lista disponível. Crie uma lista primeiro.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
