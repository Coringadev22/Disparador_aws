import { useQuery } from '@tanstack/react-query'
import { Mail, CheckCircle, XCircle, TrendingUp } from 'lucide-react'
import { analyticsApi } from '@/services/api'
import MetricCard from '@/components/MetricCard'
import { Link } from 'react-router-dom'
import CampaignStatusBadge from '@/components/CampaignStatusBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => analyticsApi.getDashboard().then(res => res.data),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  if (isLoading) {
    return <div>Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Visão geral das suas campanhas de email
        </p>
      </div>

      {/* Alerts */}
      {metrics?.alerts && metrics.alerts.length > 0 && (
        <div className="space-y-2">
          {metrics.alerts.map((alert, index) => (
            <div
              key={index}
              className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4"
            >
              <p className="text-sm text-yellow-800">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Enviados Hoje"
          value={metrics?.today.sent || 0}
          icon={Mail}
        />
        <MetricCard
          title="Entregues Hoje"
          value={metrics?.today.delivered || 0}
          icon={CheckCircle}
        />
        <MetricCard
          title="Bounces Hoje"
          value={metrics?.today.bounced || 0}
          icon={XCircle}
        />
        <MetricCard
          title="Taxa de Abertura"
          value={`${metrics?.overall.open_rate.toFixed(1) || 0}%`}
          icon={TrendingUp}
        />
      </div>

      {/* Chart and Recent Campaigns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Envios - Últimos 7 dias
          </h2>
          <div className="h-64 flex items-end gap-2">
            {metrics?.chart_data.map((item) => (
              <div key={item.date} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{
                    height: `${Math.max((item.sent / Math.max(...metrics.chart_data.map(d => d.sent)) * 100), 5)}%`
                  }}
                />
                <p className="mt-2 text-xs text-gray-500">
                  {format(new Date(item.date), 'dd/MM', { locale: ptBR })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Campanhas Recentes
            </h2>
            <Link
              to="/campaigns"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Ver todas
            </Link>
          </div>
          <div className="space-y-3">
            {metrics?.recent_campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                to={`/campaigns/${campaign.id}`}
                className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-sm text-gray-500">
                      {campaign.sent_count} enviados • {campaign.delivered_count} entregues
                    </p>
                  </div>
                  <CampaignStatusBadge status={campaign.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
