import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const authApi = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const authEndpoints = {
  login: (username: string, password: string) =>
    authApi.post('/login/', { username, password }),

  register: (username: string, email: string, password: string, password_confirm: string) =>
    authApi.post('/register/', { username, email, password, password_confirm }),

  refreshToken: (refresh: string) =>
    authApi.post('/refresh/', { refresh }),

  getCurrentUser: () =>
    authApi.get('/user/'),
}
