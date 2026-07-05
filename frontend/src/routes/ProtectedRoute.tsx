import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types'
import { DashboardSkeleton } from '@/components/shared/Skeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <DashboardSkeleton />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to correct dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
    if (user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />
    return <Navigate to="/student/dashboard" replace />
  }

  return <>{children}</>
}

export function RoleRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <DashboardSkeleton />

  if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
  if (user?.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />
  if (user?.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />
  return <Navigate to="/login" replace />
}
