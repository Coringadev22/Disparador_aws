import axios from 'axios'
import type {
  Campaign,
  EmailTemplate,
  Contact,
  ContactList,
  EmailLog,
  DashboardMetrics,
  PaginatedResponse
} from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 errors (token expired)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh/`, { refresh: refreshToken })
          const { access } = response.data
          
          localStorage.setItem('access_token', access)
          originalRequest.headers.Authorization = `Bearer ${access}`
          
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// Campaigns API
export const campaignsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get<PaginatedResponse<Campaign>>('/campaigns/', { params }),

  getById: (id: number) =>
    api.get<Campaign>(`/campaigns/${id}/`),

  create: (data: Partial<Campaign>) =>
    api.post<Campaign>('/campaigns/', data),

  update: (id: number, data: Partial<Campaign>) =>
    api.patch<Campaign>(`/campaigns/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/campaigns/${id}/`),

  send: (id: number) =>
    api.post(`/campaigns/${id}/send/`),

  schedule: (id: number, data: { scheduled_at: string; timezone?: string }) =>
    api.post(`/campaigns/${id}/schedule/`, data),

  pause: (id: number) =>
    api.post(`/campaigns/${id}/pause/`),

  getMetrics: (id: number) =>
    api.get(`/campaigns/${id}/metrics/`),
}

// Templates API
export const templatesApi = {
  getAll: (params?: Record<string, any>) =>
    api.get<PaginatedResponse<EmailTemplate>>('/templates/', { params }),

  getById: (id: number) =>
    api.get<EmailTemplate>(`/templates/${id}/`),

  create: (data: Partial<EmailTemplate>) =>
    api.post<EmailTemplate>('/templates/', data),

  update: (id: number, data: Partial<EmailTemplate>) =>
    api.patch<EmailTemplate>(`/templates/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/templates/${id}/`),

  preview: (id: number, testData: Record<string, any>) =>
    api.post(`/templates/${id}/preview/`, { test_data: testData }),
}

// Contacts API
export const contactsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get<PaginatedResponse<Contact>>('/contacts/', { params }),

  getById: (id: number) =>
    api.get<Contact>(`/contacts/${id}/`),

  create: (data: Partial<Contact>) =>
    api.post<Contact>('/contacts/', data),

  update: (id: number, data: Partial<Contact>) =>
    api.patch<Contact>(`/contacts/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/contacts/${id}/`),

  bulkUpload: (listId: number, contacts: Array<Partial<Contact>>) =>
    api.post('/contacts/bulk_upload/', {
      list_id: listId,
      contacts,
    }),

  exportCSV: (params?: Record<string, any>) => {
    return api.get('/contacts/export_csv/', {
      params,
      responseType: 'blob',
    })
  },
}

// Contact Lists API
export const contactListsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get<PaginatedResponse<ContactList>>('/contact-lists/', { params }),

  getById: (id: number) =>
    api.get<ContactList>(`/contact-lists/${id}/`),

  create: (data: Partial<ContactList>) =>
    api.post<ContactList>('/contact-lists/', data),

  update: (id: number, data: Partial<ContactList>) =>
    api.patch<ContactList>(`/contact-lists/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/contact-lists/${id}/`),

  addContacts: (id: number, contactIds: number[]) =>
    api.post(`/contact-lists/${id}/add_contacts/`, { contact_ids: contactIds }),

  removeContacts: (id: number, contactIds: number[]) =>
    api.post(`/contact-lists/${id}/remove_contacts/`, { contact_ids: contactIds }),
}

// Email Logs API
export const emailLogsApi = {
  getAll: (params?: Record<string, any>) =>
    api.get<PaginatedResponse<EmailLog>>('/email-logs/', { params }),

  getById: (id: number) =>
    api.get<EmailLog>(`/email-logs/${id}/`),
}

// Analytics API
export const analyticsApi = {
  getDashboard: () =>
    api.get<DashboardMetrics>('/analytics/dashboard/'),

  getCampaignAnalytics: (campaignId: number) =>
    api.get(`/analytics/campaign/${campaignId}/`),
}

// Settings API
export const settingsApi = {
  testSES: () =>
    api.post('/settings/test-ses/'),

  getSESStatus: () =>
    api.get('/settings/ses-status/'),
}
