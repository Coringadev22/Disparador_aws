import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contactsApi, contactListsApi } from '@/services/api'
import { ArrowLeft, Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface ParsedContact {
  email: string
  first_name?: string
  last_name?: string
  [key: string]: any
}

export default function ContactUpload() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [selectedList, setSelectedList] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'preview' | 'uploading' | 'success' | 'error'>('idle')

  // Fetch all contact lists
  const { data: listsData } = useQuery({
    queryKey: ['contact-lists-all'],
    queryFn: () => contactListsApi.getAll({ page: 1, page_size: 100 }).then(res => res.data),
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (data: { list_id: number; contacts: ParsedContact[] }) =>
      contactsApi.bulkUpload(data.list_id, data.contacts),
    onSuccess: (response) => {
      setUploadStatus('success')
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] })

      setTimeout(() => {
        navigate('/contacts')
      }, 2000)
    },
    onError: (error: any) => {
      setUploadStatus('error')
      setErrors([error.response?.data?.error || 'Erro ao fazer upload'])
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]

    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setErrors(['Por favor, selecione um arquivo CSV'])
      return
    }

    setFile(selectedFile)
    parseCSV(selectedFile)
  }

  const parseCSV = (file: File) => {
    setUploadStatus('parsing')
    setErrors([])

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())

        if (lines.length < 2) {
          setErrors(['O arquivo CSV está vazio ou possui apenas o cabeçalho'])
          setUploadStatus('error')
          return
        }

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())

        if (!headers.includes('email')) {
          setErrors(['O CSV deve conter uma coluna "email"'])
          setUploadStatus('error')
          return
        }

        // Parse rows
        const contacts: ParsedContact[] = []
        const parseErrors: string[] = []

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim())

          if (values.length !== headers.length) {
            parseErrors.push(`Linha ${i + 1}: Número de colunas incorreto`)
            continue
          }

          const contact: ParsedContact = { email: '' }

          headers.forEach((header, index) => {
            const value = values[index]

            if (header === 'email') {
              contact.email = value
            } else if (header === 'first_name' || header === 'nome') {
              contact.first_name = value
            } else if (header === 'last_name' || header === 'sobrenome') {
              contact.last_name = value
            } else {
              // Custom field
              contact[header] = value
            }
          })

          // Validate email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!contact.email || !emailRegex.test(contact.email)) {
            parseErrors.push(`Linha ${i + 1}: Email inválido - "${contact.email}"`)
            continue
          }

          contacts.push(contact)
        }

        if (contacts.length === 0) {
          setErrors(['Nenhum contato válido encontrado no arquivo'])
          setUploadStatus('error')
          return
        }

        setParsedContacts(contacts)
        setErrors(parseErrors)
        setUploadStatus('preview')
      } catch (error) {
        setErrors(['Erro ao fazer parse do arquivo CSV'])
        setUploadStatus('error')
      }
    }

    reader.onerror = () => {
      setErrors(['Erro ao ler o arquivo'])
      setUploadStatus('error')
    }

    reader.readAsText(file)
  }

  const handleUpload = () => {
    if (!selectedList) {
      alert('Selecione uma lista')
      return
    }

    if (parsedContacts.length === 0) {
      alert('Nenhum contato para fazer upload')
      return
    }

    setUploadStatus('uploading')
    uploadMutation.mutate({
      list_id: selectedList,
      contacts: parsedContacts,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/contacts')}
          className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Upload de Contatos (CSV)</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upload Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Instructions */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-medium text-blue-900">
              <AlertCircle className="h-4 w-4" />
              Instruções
            </h3>
            <ul className="mt-2 space-y-1 text-xs text-blue-700">
              <li>• O arquivo deve ser CSV (valores separados por vírgula)</li>
              <li>• Obrigatório: coluna "email"</li>
              <li>• Opcionais: "first_name", "last_name" ou "nome", "sobrenome"</li>
              <li>• Outras colunas serão campos personalizados</li>
              <li>• Primeira linha deve conter os nomes das colunas</li>
            </ul>
          </div>

          {/* Select List */}
          <div className="rounded-lg bg-white p-6 shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Lista *
            </label>

            {listsData?.results && listsData.results.length > 0 ? (
              <select
                value={selectedList || ''}
                onChange={(e) => setSelectedList(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Escolha uma lista...</option>
                {listsData.results.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name} ({list.total_contacts} contatos)
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500">
                Nenhuma lista disponível.{' '}
                <button
                  onClick={() => navigate('/contact-lists/new')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Criar uma lista
                </button>
              </p>
            )}
          </div>

          {/* File Upload */}
          <div className="rounded-lg bg-white p-6 shadow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo CSV *
            </label>

            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-blue-500">
              <Upload className="h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">Arraste um arquivo ou clique para selecionar</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-4 w-full"
              />
              {file && (
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                  <FileText className="h-4 w-4" />
                  {file.name}
                </div>
              )}
            </div>
          </div>

          {/* Upload Button */}
          {uploadStatus === 'preview' && (
            <button
              onClick={handleUpload}
              disabled={!selectedList || uploadStatus === 'uploading'}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {uploadStatus === 'uploading' ? 'Enviando...' : `Importar ${parsedContacts.length} Contatos`}
            </button>
          )}
        </div>

        {/* Preview/Results */}
        <div className="lg:col-span-2">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {uploadStatus === 'preview' ? 'Preview dos Contatos' :
               uploadStatus === 'success' ? 'Upload Concluído!' :
               uploadStatus === 'error' ? 'Erro no Upload' :
               'Aguardando arquivo...'}
            </h2>

            {uploadStatus === 'parsing' && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600" />
                <p className="mt-4 text-sm text-gray-500">Processando arquivo...</p>
              </div>
            )}

            {uploadStatus === 'preview' && (
              <div>
                {errors.length > 0 && (
                  <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <h4 className="flex items-center gap-2 text-sm font-medium text-orange-900 mb-2">
                      <AlertCircle className="h-4 w-4" />
                      Avisos ({errors.length})
                    </h4>
                    <ul className="space-y-1 text-xs text-orange-700">
                      {errors.slice(0, 10).map((error, i) => (
                        <li key={i}>• {error}</li>
                      ))}
                      {errors.length > 10 && (
                        <li className="font-medium">... e mais {errors.length - 10} avisos</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Nome
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Sobrenome
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {parsedContacts.slice(0, 50).map((contact, i) => (
                        <tr key={i}>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                            {contact.email}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                            {contact.first_name || '-'}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                            {contact.last_name || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedContacts.length > 50 && (
                    <p className="mt-4 text-sm text-gray-500 text-center">
                      Mostrando 50 de {parsedContacts.length} contatos
                    </p>
                  )}
                </div>
              </div>
            )}

            {uploadStatus === 'success' && (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
                <p className="mt-4 text-lg font-medium text-gray-900">Upload realizado com sucesso!</p>
                <p className="mt-2 text-sm text-gray-500">
                  {parsedContacts.length} contatos foram importados
                </p>
                <p className="mt-4 text-xs text-gray-400">
                  Redirecionando para lista de contatos...
                </p>
              </div>
            )}

            {uploadStatus === 'error' && errors.length > 0 && (
              <div className="text-center py-12">
                <XCircle className="mx-auto h-16 w-16 text-red-600" />
                <p className="mt-4 text-lg font-medium text-gray-900">Erro no upload</p>
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <ul className="space-y-1 text-sm text-red-700 text-left">
                    {errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {uploadStatus === 'uploading' && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600" />
                <p className="mt-4 text-sm text-gray-500">Importando contatos...</p>
              </div>
            )}

            {uploadStatus === 'idle' && (
              <div className="text-center py-12 text-gray-400">
                <Upload className="mx-auto h-12 w-12" />
                <p className="mt-4 text-sm">
                  Selecione um arquivo CSV para começar
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
