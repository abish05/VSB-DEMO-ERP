import { useUIStore } from '@/store/uiStore'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { NotificationPanel } from './NotificationPanel'
import { motion } from 'framer-motion'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Topbar />
      <NotificationPanel />

      {/* Main content shifts with sidebar */}
      <motion.main
        initial={false}
        animate={{
          marginLeft: sidebarCollapsed ? 64 : 256,
          paddingTop: 64,
        }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="min-h-screen"
      >
        <div className="p-6 page-enter">
          {children}
        </div>
      </motion.main>
    </div>
  )
}
