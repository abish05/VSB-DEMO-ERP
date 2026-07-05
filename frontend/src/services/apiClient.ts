import axios from 'axios'
import { auth } from '@/lib/firebase'
import { API_BASE } from '@/lib/api'

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach Firebase ID token to every request
apiClient.interceptors.request.use(async (config) => {
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
      try {
        await auth.signOut()
      } catch (e) {
        console.error("Failed to sign out user", e)
      }
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
