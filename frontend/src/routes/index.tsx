import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom'
import { ProtectedRoute, RoleRedirect } from './ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { DashboardSkeleton } from '@/components/shared/Skeleton'

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'))
const AdminLoginPage = lazy(() => import('@/pages/admin/AdminLoginPage'))

// Admin
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const DepartmentsPage = lazy(() => import('@/pages/admin/DepartmentsPage'))
const FacultyManagementPage = lazy(() => import('@/pages/admin/FacultyManagementPage'))
const StudentManagementPage = lazy(() => import('@/pages/admin/StudentManagementPage'))
const AcademicYearsPage = lazy(() => import('@/pages/admin/AcademicYearsPage'))
const BatchesPage = lazy(() => import('@/pages/admin/BatchesPage'))
const SectionsPage = lazy(() => import('@/pages/admin/SectionsPage'))
const CSVImportPage = lazy(() => import('@/pages/admin/CSVImportPage'))
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'))
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'))
const SystemSettingsPage = lazy(() => import('@/pages/admin/SystemSettingsPage'))
const AdminLeaderboardPage = lazy(() => import('@/pages/admin/AdminLeaderboardPage'))
const AdminNotificationsPage = lazy(() => import('@/pages/admin/AdminNotificationsPage'))
const AdminProfilePage = lazy(() => import('@/pages/admin/AdminProfilePage'))

// Faculty
const FacultyDashboard = lazy(() => import('@/pages/faculty/FacultyDashboard'))
const FacultyStudentsPage = lazy(() => import('@/pages/faculty/FacultyStudentsPage'))
const StudentProgressPage = lazy(() => import('@/pages/faculty/StudentProgressPage'))
const FacultyLeaderboardPage = lazy(() => import('@/pages/faculty/FacultyLeaderboardPage'))
const InactiveStudentsPage = lazy(() => import('@/pages/faculty/InactiveStudentsPage'))
const WeeklyReportPage = lazy(() => import('@/pages/faculty/WeeklyReportPage'))
const MonthlyReportPage = lazy(() => import('@/pages/faculty/MonthlyReportPage'))
const StudentComparePage = lazy(() => import('@/pages/faculty/StudentComparePage'))

// Student
const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard'))
const MyProgressPage = lazy(() => import('@/pages/student/MyProgressPage'))
const CalendarPage = lazy(() => import('@/pages/student/CalendarPage'))
const DailyActivityPage = lazy(() => import('@/pages/student/DailyActivityPage'))
const WeeklyActivityPage = lazy(() => import('@/pages/student/WeeklyActivityPage'))
const MonthlyActivityPage = lazy(() => import('@/pages/student/MonthlyActivityPage'))
const ContestHistoryPage = lazy(() => import('@/pages/student/ContestHistoryPage'))
const BadgesPage = lazy(() => import('@/pages/student/BadgesPage'))
const LeaderboardPage = lazy(() => import('@/pages/student/LeaderboardPage'))
const ProfilePage = lazy(() => import('@/pages/student/ProfilePage'))
const NotificationsPage = lazy(() => import('@/pages/student/NotificationsPage'))
const SettingsPage = lazy(() => import('@/pages/student/SettingsPage'))

function LoadingFallback() {
  return (
    <div className="p-6">
      <DashboardSkeleton />
    </div>
  )
}

function AuthenticatedLayout() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </AppShell>
    </ProtectedRoute>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RoleRedirect />,
  },
  // Auth routes
  {
    path: '/login',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/admin',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <AdminLoginPage />
      </Suspense>
    ),
  },
  {
    path: '/register',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <ForgotPasswordPage />
      </Suspense>
    ),
  },
  // Admin routes
  {
    element: <ProtectedRoute allowedRoles={['ADMIN']}><AppShell><ErrorBoundary><Suspense fallback={<LoadingFallback />}><Outlet /></Suspense></ErrorBoundary></AppShell></ProtectedRoute>,
    children: [
      { path: '/admin/dashboard', element: <AdminDashboard /> },
      { path: '/admin/departments', element: <DepartmentsPage /> },
      { path: '/admin/faculty', element: <FacultyManagementPage /> },
      { path: '/admin/students', element: <StudentManagementPage /> },
      { path: '/admin/academic-years', element: <AcademicYearsPage /> },
      { path: '/admin/batches', element: <BatchesPage /> },
      { path: '/admin/sections', element: <SectionsPage /> },
      { path: '/admin/csv-import', element: <CSVImportPage /> },
      { path: '/admin/users', element: <UsersPage /> },
      { path: '/admin/reports', element: <AdminReportsPage /> },
      { path: '/admin/settings', element: <SystemSettingsPage /> },
      { path: '/admin/leaderboard', element: <AdminLeaderboardPage /> },
      { path: '/admin/notifications', element: <AdminNotificationsPage /> },
      { path: '/admin/profile', element: <AdminProfilePage /> },
    ],
  },
  // Faculty routes
  {
    element: <ProtectedRoute allowedRoles={['FACULTY']}><AppShell><ErrorBoundary><Suspense fallback={<LoadingFallback />}><Outlet /></Suspense></ErrorBoundary></AppShell></ProtectedRoute>,
    children: [
      { path: '/faculty/dashboard', element: <FacultyDashboard /> },
      { path: '/faculty/students', element: <FacultyStudentsPage /> },
      { path: '/faculty/progress', element: <StudentProgressPage /> },
      { path: '/faculty/leaderboard', element: <FacultyLeaderboardPage /> },
      { path: '/faculty/inactive', element: <InactiveStudentsPage /> },
      { path: '/faculty/reports/weekly', element: <WeeklyReportPage /> },
      { path: '/faculty/reports/monthly', element: <MonthlyReportPage /> },
      { path: '/faculty/compare', element: <StudentComparePage /> },
    ],
  },
  // Student routes
  {
    element: <ProtectedRoute allowedRoles={['STUDENT']}><AppShell><ErrorBoundary><Suspense fallback={<LoadingFallback />}><Outlet /></Suspense></ErrorBoundary></AppShell></ProtectedRoute>,
    children: [
      { path: '/student/dashboard', element: <StudentDashboard /> },
      { path: '/student/progress', element: <MyProgressPage /> },
      { path: '/student/calendar', element: <CalendarPage /> },
      { path: '/student/activity/daily', element: <DailyActivityPage /> },
      { path: '/student/activity/weekly', element: <WeeklyActivityPage /> },
      { path: '/student/activity/monthly', element: <MonthlyActivityPage /> },
      { path: '/student/contests', element: <ContestHistoryPage /> },
      { path: '/student/badges', element: <BadgesPage /> },
      { path: '/student/leaderboard', element: <LeaderboardPage /> },
      { path: '/student/profile', element: <ProfilePage /> },
      { path: '/student/notifications', element: <NotificationsPage /> },
      { path: '/student/settings', element: <SettingsPage /> },
    ],
  },
], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_skipActionErrorRevalidation: true,
  }
})

export function AppRouter() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />
}

export { AuthenticatedLayout }
