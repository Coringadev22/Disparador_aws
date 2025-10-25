import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/services/api'
import { CheckCircle, XCircle, Loader, AlertCircle, Mail } from 'lucide-react'

export default function Settings() {
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  // Fetch SES status
  const { data: sesStatus, isLoading: statusLoading, refetch } = useQuery({
    queryKey: ['ses-status'],
    queryFn: () => settingsApi.getSESStatus().then(res => res.data),
  })

  // Test SES connection mutation
  const testSESMutation = useMutation({
    mutationFn: () => settingsApi.testSES(),
    onSuccess: (response) => {
      setTestResult({
        success: true,
        message: response.data.message || 'Conexão com AWS SES testada com sucesso!',
      })
      refetch()
    },
    onError: (error: any) => {
      setTestResult({
        success: false,
        message: error.response?.data?.error || 'Erro ao testar conexão com AWS SES',
      })
    },
  })

  const handleTestSES = () => {
    setTestResult(null)
    testSESMutation.mutate()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie as configurações da plataforma de envio de emails
        </p>
      </div>

      {/* AWS SES Configuration */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-blue-100 p-2">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AWS SES</h2>
            <p className="text-sm text-gray-500">Configuração do Amazon Simple Email Service</p>
          </div>
        </div>

        {/* SES Status */}
        {statusLoading ? (
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin text-gray-500" />
              <span className="text-sm text-gray-600">Verificando status...</span>
            </div>
          </div>
        ) : sesStatus ? (
          <div className="mb-6 space-y-3">
            {/* Configuration Status */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Status da Configuração</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {sesStatus.configured ? 'Credenciais AWS configuradas' : 'Credenciais AWS não configuradas'}
                  </p>
                </div>
                {sesStatus.configured ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            </div>

            {/* Additional Info */}
            {sesStatus.region && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-500">Região</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{sesStatus.region}</p>
                </div>
                {sesStatus.rate_limit && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs font-medium text-gray-500">Taxa de Envio</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      {sesStatus.rate_limit} emails/segundo
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Test Connection */}
        <div className="space-y-4">
          <div>
            <button
              onClick={handleTestSES}
              disabled={testSESMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {testSESMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Testando conexão...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Testar Conexão com SES
                </>
              )}
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`rounded-lg border p-4 ${
                testResult.success
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    testResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {testResult.success ? 'Sucesso!' : 'Erro'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    testResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Instructions */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-orange-900">Configuração AWS SES</h3>
            <div className="mt-2 text-sm text-orange-700 space-y-2">
              <p>
                Para configurar o AWS SES, você precisa definir as seguintes variáveis de ambiente no arquivo <code className="px-1 py-0.5 bg-orange-100 rounded">.env</code>:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><code className="px-1 py-0.5 bg-orange-100 rounded">AWS_ACCESS_KEY_ID</code> - Sua chave de acesso AWS</li>
                <li><code className="px-1 py-0.5 bg-orange-100 rounded">AWS_SECRET_ACCESS_KEY</code> - Sua chave secreta AWS</li>
                <li><code className="px-1 py-0.5 bg-orange-100 rounded">AWS_SES_REGION</code> - Região do SES (ex: us-east-1)</li>
                <li><code className="px-1 py-0.5 bg-orange-100 rounded">AWS_SES_CONFIGURATION_SET</code> - Nome do Configuration Set (opcional)</li>
              </ul>
              <p className="mt-3">
                Consulte o arquivo <code className="px-1 py-0.5 bg-orange-100 rounded">README.md</code> para instruções detalhadas sobre como configurar o AWS SES.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Sistema</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Versão da Plataforma</dt>
            <dd className="mt-1 text-sm text-gray-900">1.0.0</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Ambiente</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {import.meta.env.DEV ? 'Desenvolvimento' : 'Produção'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">API URL</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {import.meta.env.VITE_API_URL || 'http://localhost:8000'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
