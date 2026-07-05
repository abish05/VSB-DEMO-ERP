import { useLocation, Link } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getInitials, capitalizeFirst } from '@/lib/utils'
import {
  Bell,
  Search,
  ChevronRight,
  LogOut,
  Settings,
  UserCircle,
} from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'

function Breadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      {segments.map((seg, i) => {
        const path = '/' + segments.slice(0, i + 1).join('/')
        const isLast = i === segments.length - 1
        return (
          <div key={path} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3" />}
            {isLast ? (
              <span className="text-foreground font-medium capitalize">{seg.replace(/-/g, ' ')}</span>
            ) : (
              <Link to={path} className="hover:text-foreground capitalize transition-colors">
                {seg.replace(/-/g, ' ')}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

function UserMenu({ user, logout }: { user: { name: string; email: string; role: string } | null; logout: () => void }) {
  const [open, setOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
      >
        <Avatar fallback={getInitials(user.name)} size="sm" />
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium leading-none">{user.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{capitalizeFirst(user.role)}</p>
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-popover z-50 p-1">
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <Badge variant="default" className="mt-1">{capitalizeFirst(user.role)}</Badge>
            </div>
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
              onClick={() => { setOpen(false) }}
            >
              <UserCircle className="w-4 h-4" /> Profile
            </button>
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
              onClick={() => { setOpen(false) }}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
            <div className="border-t border-border mt-1 pt-1">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-error/10 text-error transition-colors"
                onClick={() => { setOpen(false); logout() }}
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function Topbar() {
  const { openNotifications, openCommandPalette, sidebarCollapsed } = useUIStore()
  const { user, logout } = useAuth()

  return (
    <motion.header 
      initial={false}
      animate={{ left: sidebarCollapsed ? 64 : 256 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed top-0 right-0 h-16 bg-card backdrop-blur border-b border-border z-30 flex items-center px-4 gap-4"
    >
      {/* Left: breadcrumbs */}
      <div className="flex-1">
        <Breadcrumbs />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Global Search */}
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex items-center gap-2 text-muted-foreground w-48 justify-start"
          onClick={openCommandPalette}
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-xs">Search... </span>
          <kbd className="ml-auto text-xs bg-muted px-1 rounded">⌘K</kbd>
        </Button>

        <ThemeToggle />

        {/* Notifications */}
        <Button variant="ghost" size="icon" onClick={openNotifications} className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
        </Button>

        <UserMenu
          user={user ? { name: user.name, email: user.email, role: user.role } : null}
          logout={logout}
        />
      </div>
    </motion.header>
  )
}
