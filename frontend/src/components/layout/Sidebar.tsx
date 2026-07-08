import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  Layers,
  Medal,
  Settings,
  Trophy,
  UserCircle,
  Users,
  Activity,
  TrendingUp,
} from 'lucide-react'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  end?: boolean
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, end: true },
  { label: 'Departments', to: '/admin/departments', icon: <Building2 className="w-4 h-4" /> },
  { label: 'Academic Years', to: '/admin/academic-years', icon: <BookOpen className="w-4 h-4" /> },
  { label: 'Batches', to: '/admin/batches', icon: <Layers className="w-4 h-4" /> },
  { label: 'Sections', to: '/admin/sections', icon: <FolderOpen className="w-4 h-4" /> },
  { label: 'Faculty', to: '/admin/faculty', icon: <GraduationCap className="w-4 h-4" /> },
  { label: 'Students', to: '/admin/students', icon: <Users className="w-4 h-4" /> },
  { label: 'Leaderboard', to: '/admin/leaderboard', icon: <Trophy className="w-4 h-4" /> },
  { label: 'CSV Import', to: '/admin/csv-import', icon: <FileSpreadsheet className="w-4 h-4" /> },
  { label: 'User Management', to: '/admin/users', icon: <UserCircle className="w-4 h-4" /> },
  { label: 'Reports', to: '/admin/reports', icon: <BarChart3 className="w-4 h-4" /> },
  { label: 'Notifications', to: '/admin/notifications', icon: <Bell className="w-4 h-4" /> },
  { label: 'Profile', to: '/admin/profile', icon: <UserCircle className="w-4 h-4" /> },
  { label: 'Settings', to: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
]

const studentNav: NavItem[] = [
  { label: 'Dashboard', to: '/student/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, end: true },
  { label: 'Daily Activity', to: '/student/activity/daily', icon: <CalendarDays className="w-4 h-4" /> },
  { label: 'Weekly Activity', to: '/student/activity/weekly', icon: <BarChart3 className="w-4 h-4" /> },
  { label: 'Monthly Activity', to: '/student/activity/monthly', icon: <TrendingUp className="w-4 h-4" /> },
  { label: 'Contest History', to: '/student/contests', icon: <Trophy className="w-4 h-4" /> },
  { label: 'Badges', to: '/student/badges', icon: <Medal className="w-4 h-4" /> },
  { label: 'Leaderboard', to: '/student/leaderboard', icon: <Award className="w-4 h-4" /> },
  { label: 'Notifications', to: '/student/notifications', icon: <Bell className="w-4 h-4" /> },
  { label: 'Profile', to: '/student/profile', icon: <UserCircle className="w-4 h-4" /> },
  { label: 'Settings', to: '/student/settings', icon: <Settings className="w-4 h-4" /> },
]

const facultyNav: NavItem[] = [
  { label: 'Dashboard', to: '/faculty/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, end: true },
  { label: 'Students', to: '/faculty/students', icon: <Users className="w-4 h-4" /> },
  { label: 'Daily Activity', to: '/faculty/features/daily-activity', icon: <CalendarDays className="w-4 h-4" /> },
  { label: 'Weekly Activity', to: '/faculty/reports/weekly', icon: <BarChart3 className="w-4 h-4" /> },
  { label: 'Monthly Activity', to: '/faculty/reports/monthly', icon: <TrendingUp className="w-4 h-4" /> },
  { label: 'Contest History', to: '/faculty/features/contest-history', icon: <Trophy className="w-4 h-4" /> },
  { label: 'Leaderboard', to: '/faculty/leaderboard', icon: <Award className="w-4 h-4" /> },
  { label: 'Reports', to: '/faculty/reports/weekly', icon: <FileText className="w-4 h-4" /> },
  { label: 'Notifications', to: '/faculty/features/notifications', icon: <Bell className="w-4 h-4" /> },
  { label: 'Profile', to: '/faculty/features/profile', icon: <UserCircle className="w-4 h-4" /> },
  { label: 'Settings', to: '/faculty/features/settings', icon: <Settings className="w-4 h-4" /> },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user } = useAuth()
  const navigate = useNavigate()

  const navItems =
    user?.role === 'ADMIN' ? adminNav : user?.role === 'FACULTY' ? facultyNav : studentNav

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 256 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen bg-sidebar flex flex-col z-40 shadow-sidebar overflow-hidden"
    >
      <div className="h-16 shrink-0 border-b border-white/10">
        <div className="flex items-center h-full px-4 gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 cursor-pointer overflow-hidden shadow-sm" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="VSBCETC Logo" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <p className="text-white font-bold text-sm leading-tight">VSBCETC LeetCode</p>
                <p className="text-sidebar-foreground text-xs">Analytics Dashboard</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-3 border-b border-white/10"
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {user?.role || 'Navigation'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn('sidebar-link', isActive && 'active', sidebarCollapsed && 'justify-center px-0')
            }
            title={sidebarCollapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  )
}
