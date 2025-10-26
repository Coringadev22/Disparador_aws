import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authEndpoints } from '@/services/authApi'

interface User {
  id: number
  username: string
  email: string
  is_staff?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, passwordConfirm: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to get user from localStorage on mount
    const storedUser = localStorage.getItem('user')
    const token = localStorage.getItem('access_token')
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Error parsing stored user:', e)
        localStorage.removeItem('user')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const response = await authEndpoints.login(username, password)
    
    localStorage.setItem('access_token', response.data.access)
    localStorage.setItem('refresh_token', response.data.refresh)
    
    // Ensure user object has all necessary fields including is_staff
    const userData = response.data.user
    if (!userData.hasOwnProperty('is_staff')) {
      // If is_staff is not in response, fetch it from API
      try {
        const userResponse = await authEndpoints.getCurrentUser()
        userData.is_staff = userResponse.data.is_staff
      } catch (error) {
        console.error('Error fetching user details:', error)
      }
    }
    
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const register = async (username: string, email: string, password: string, passwordConfirm: string) => {
    const response = await authEndpoints.register(username, email, password, passwordConfirm)
    
    localStorage.setItem('access_token', response.data.access)
    localStorage.setItem('refresh_token', response.data.refresh)
    localStorage.setItem('user', JSON.stringify(response.data.user))
    
    setUser(response.data.user)
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        register, 
        logout, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
