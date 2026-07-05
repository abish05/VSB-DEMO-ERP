import axios from 'axios'
import { auth, signOut } from '@/lib/firebase'
import { API_BASE } from '@/lib/api'

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach Firebase ID token (or mockToken) to every request
apiClient.interceptors.request.use(async (config) => {
  // If a specific Authorization header was passed explicitly, don't override it
  if (config.headers.Authorization || config.headers.get?.('Authorization')) {
    return config
  }

  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  } else {
    const mockToken = localStorage.getItem('mockToken')
    if (mockToken) {
      config.headers.Authorization = `Bearer ${mockToken}`
    }
  }
  return config
})

// Global error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear any stored session data
      localStorage.removeItem('mockToken')
      try {
        await signOut(auth)
      } catch (e) {
        console.error('Failed to sign out user', e)
      }
      // Redirect to the appropriate login page based on current URL
      const isAdminRoute = window.location.pathname.startsWith('/admin')
      window.location.href = isAdminRoute ? '/admin' : '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
