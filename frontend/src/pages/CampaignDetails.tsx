import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { campaignsApi, analyticsApi } from '@/services/api'
import { ArrowLeft, Mail, CheckCircle, XCircle, Eye, MousePointer, AlertCircle } from 'lucide-react'
import MetricCard from '@/components/MetricCard'
import CampaignStatusBadge from '@/components/CampaignStatusBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function CampaignDetails() {
  const { id } = useParams()

  // Fetch campaign data
  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsApi.getById(Number(id)).then(res => res.data),
    refetchInterval: campaign?.status === 'sending' ? 5000 : false, // Refetch every 5s if sending
  })

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['campaign-analytics', id],
    queryFn: () => analyticsApi.getCampaignAnalytics(Number(id)).then(res => res.data),
    refetchInterval: campaign?.status === 'sending' ? 5000 : false,
  })

  if (isLoading || !campaign) {
    return <div>Carregando...</div>
  }

  const progressPercentage = campaign.total_recipients > 0
    ? (campaign.sent_count / campaign.total_recipients) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/campaigns" className="rounded-lg p-2 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{campaign.subject}</p>
        </div>
        <CampaignStatusBadge status={campaign.status} />
      </div>

      {/* Progress Bar (only if sending) */}
      {campaign.status === 'sending' && (
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Progresso do Envio</span>
            <span className="text-gray-600">
              {campaign.sent_count} / {campaign.total_recipients} ({progressPercentage.toFixed(1)}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Enviados"
          value={campaign.sent_count}
          icon={Mail}
        />
        <MetricCard
          title="Entregues"
          value={campaign.delivered_count}
          icon={CheckCircle}
        />
        <MetricCard
          title="Taxa de Abertura"
          value={`${campaign.open_rate.toFixed(1)}%`}
          icon={Eye}
        />
        <MetricCard
          title="Taxa de Cliques"
          value={`${campaign.click_rate.toFixed(1)}%`}
          icon={MousePointer}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bounces</p>
              <p className="mt-2 text-3xl font-semibold text-red-600">{campaign.bounce_count}</p>
              <p className="mt-1 text-sm text-gray-500">{campaign.bounce_rate.toFixed(2)}%</p>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reclamações</p>
              <p className="mt-2 text-3xl font-semibold text-orange-600">{campaign.complaint_count}</p>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Entrega</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">
                {campaign.delivery_rate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      {analytics?.timeline && analytics.timeline.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Timeline de Envios</h2>
          <div className="h-64 flex items-end gap-1">
            {analytics.timeline.map((item: any) => {
              const maxValue = Math.max(...analytics.timeline.map((t: any) => t.sent))
              const sentHeight = maxValue > 0 ? (item.sent / maxValue) * 100 : 0
              const openedHeight = maxValue > 0 ? (item.opened / maxValue) * 100 : 0

              return (
                <div key={item.hour} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1">
                    <div
                      className="flex-1 bg-blue-500 rounded-t"
                      style={{ height: `${Math.max(sentHeight * 2, 5)}px` }}
                      title={`Enviados: ${item.sent}`}
                    />
                    <div
                      className="flex-1 bg-green-500 rounded-t"
                      style={{ height: `${Math.max(openedHeight * 2, 5)}px` }}
                      title={`Abertos: ${item.opened}`}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{item.hour}</p>
                </div>
              )
            })}
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-blue-500" />
              <span className="text-gray-600">Enviados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-green-500" />
              <span className="text-gray-600">Abertos</span>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Info */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Informações da Campanha</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Remetente</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {campaign.from_name} &lt;{campaign.from_email}&gt;
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Template</dt>
            <dd className="mt-1 text-sm text-gray-900">{campaign.template_data?.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Lista de Contatos</dt>
            <dd className="mt-1 text-sm text-gray-900">{campaign.contact_list_data?.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Total de Destinatários</dt>
            <dd className="mt-1 text-sm text-gray-900">{campaign.total_recipients}</dd>
          </div>
          {campaign.started_at && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Iniciado em</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(new Date(campaign.started_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </dd>
            </div>
          )}
          {campaign.completed_at && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Concluído em</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(new Date(campaign.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {campaign.status === 'sending' && (
          <button
            onClick={() => campaignsApi.pause(campaign.id)}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
          >
            Pausar Envio
          </button>
        )}

        {campaign.status === 'draft' && (
          <button
            onClick={() => campaignsApi.send(campaign.id)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Enviar Agora
          </button>
        )}

        <Link
          to={`/campaigns/${campaign.id}/edit`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Editar
        </Link>
      </div>
    </div>
  )
}
