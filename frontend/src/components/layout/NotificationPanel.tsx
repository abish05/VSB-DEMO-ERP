import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { X, Bell, Trophy, CalendarDays, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'CONTEST',
    title: 'LeetCode Weekly Contest 412',
    body: 'Contest starts in 2 hours. Get ready!',
    time: '2h ago',
    read: false,
  },
  {
    id: '2',
    type: 'ACHIEVEMENT',
    title: '🔥 7-Day Streak!',
    body: 'Congratulations! You have maintained a 7-day solving streak.',
    time: '3h ago',
    read: false,
  },
  {
    id: '3',
    type: 'REMINDER',
    title: 'Daily Coding Reminder',
    body: "You haven't solved any problem today. Keep your streak alive!",
    time: '5h ago',
    read: true,
  },
  {
    id: '4',
    type: 'ALERT',
    title: 'Student Inactivity Alert',
    body: '5 students have been inactive for more than 3 days.',
    time: '1d ago',
    read: true,
  },
]

const typeIcon = {
  CONTEST: <Trophy className="w-4 h-4 text-warning" />,
  ACHIEVEMENT: <Bell className="w-4 h-4 text-success" />,
  REMINDER: <CalendarDays className="w-4 h-4 text-primary" />,
  ALERT: <AlertTriangle className="w-4 h-4 text-error" />,
  ANNOUNCEMENT: <Bell className="w-4 h-4 text-primary" />,
}

export function NotificationPanel() {
  const { notificationPanelOpen, closeNotifications } = useUIStore()

  return (
    <AnimatePresence>
      {notificationPanelOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={closeNotifications}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-background border-l border-border z-50 flex flex-col shadow-xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-xs text-muted-foreground">
                  {MOCK_NOTIFICATIONS.filter((n) => !n.read).length} unread
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeNotifications}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="p-3 space-y-2">
                {MOCK_NOTIFICATIONS.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors hover:bg-accent ${
                      !notif.read ? 'border-primary/20 bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {typeIcon[notif.type as keyof typeof typeIcon]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                    {!notif.read && (
                      <span className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-border">
              <Button variant="outline" className="w-full text-sm">
                Mark all as read
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
