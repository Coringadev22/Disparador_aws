import type { CampaignStatus } from '@/types'

interface CampaignStatusBadgeProps {
  status: CampaignStatus
}

const statusConfig: Record<CampaignStatus, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-800' },
  scheduled: { label: 'Agendada', className: 'bg-blue-100 text-blue-800' },
  sending: { label: 'Enviando', className: 'bg-yellow-100 text-yellow-800' },
  sent: { label: 'Enviada', className: 'bg-green-100 text-green-800' },
  paused: { label: 'Pausada', className: 'bg-orange-100 text-orange-800' },
  failed: { label: 'Falhou', className: 'bg-red-100 text-red-800' },
}

export default function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
