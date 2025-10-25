// Campaign types
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'failed'

export interface Campaign {
  id: number
  name: string
  subject: string
  from_email: string
  from_name: string
  template: number
  template_data?: EmailTemplate
  contact_list: number
  contact_list_data?: ContactList
  status: CampaignStatus
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  total_recipients: number
  sent_count: number
  delivered_count: number
  bounce_count: number
  complaint_count: number
  open_count: number
  click_count: number
  delivery_rate: number
  open_rate: number
  click_rate: number
  bounce_rate: number
  created_at: string
  updated_at: string
}

// Template types
export interface EmailTemplate {
  id: number
  name: string
  subject_template: string
  html_content: string
  plain_text_content: string
  variables: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

// Contact types
export interface ContactList {
  id: number
  name: string
  description: string
  total_contacts: number
  created_at: string
  updated_at: string
}

export interface Contact {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  custom_fields: Record<string, any>
  lists: number[]
  lists_data?: ContactList[]
  is_subscribed: boolean
  is_suppressed: boolean
  suppression_reason: string | null
  created_at: string
  updated_at: string
}

// Email log types
export type EmailLogStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'bounced' | 'failed' | 'complained'

export interface EmailLog {
  id: number
  campaign: number | null
  campaign_name?: string
  contact: number
  contact_email?: string
  message_id: string
  subject: string
  from_email: string
  to_email: string
  status: EmailLogStatus
  error_message: string | null
  sent_at: string | null
  delivered_at: string | null
  events?: EmailEvent[]
  created_at: string
  updated_at: string
}

// Email event types
export type EmailEventType = 'send' | 'delivery' | 'bounce' | 'complaint' | 'open' | 'click' | 'reject'
export type BounceType = 'hard' | 'soft'

export interface EmailEvent {
  id: number
  email_log: number
  event_type: EmailEventType
  bounce_type: BounceType | null
  timestamp: string
  metadata: Record<string, any>
  created_at: string
}

// Dashboard types
export interface DashboardMetrics {
  today: {
    sent: number
    delivered: number
    bounced: number
  }
  overall: {
    delivery_rate: number
    open_rate: number
  }
  chart_data: Array<{
    date: string
    sent: number
  }>
  recent_campaigns: Array<{
    id: number
    name: string
    status: CampaignStatus
    sent_count: number
    delivered_count: number
    created_at: string
  }>
  alerts: Array<{
    type: string
    message: string
  }>
}

// API response types
export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  error?: string
  message?: string
  detail?: string
}
