import { useAuthStore } from '@/store/authStore'
import { auth, signOut } from '@/lib/firebase'
import type { UserRole } from '@/types'

export function useAuth() {
  const { user, isLoading, isAuthenticated, logout } = useAuthStore()

  const handleLogout = async () => {
    localStorage.removeItem('mockToken')
    await signOut(auth)
    logout()
  }

  const hasRole = (role: UserRole) => user?.role === role
  const isAdmin = user?.role === 'ADMIN'
  const isFaculty = user?.role === 'FACULTY'
  const isStudent = user?.role === 'STUDENT'

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isFaculty,
    isStudent,
    hasRole,
    logout: handleLogout,
  }
}
