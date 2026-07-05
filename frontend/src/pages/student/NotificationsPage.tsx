import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Bell, Trophy, Flame, AlertTriangle, CalendarDays } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

const NOTIFICATIONS = [
  { id: '1', type: 'CONTEST', title: 'LeetCode Weekly Contest 412', body: 'Contest starts in 2 hours. Register now to participate!', time: '2h ago', read: false },
  { id: '2', type: 'ACHIEVEMENT', title: '🔥 7-Day Streak Achieved!', body: "Congratulations! You've maintained a 7-day solving streak. Keep going!", time: '3h ago', read: false },
  { id: '3', type: 'REMINDER', title: 'Daily Coding Reminder', body: "You haven't solved any problem today. Keep your streak alive!", time: '5h ago', read: true },
  { id: '4', type: 'ACHIEVEMENT', title: '🎯 100 Problems Solved!', body: "You've reached the 100 problems milestone. Amazing work!", time: '2d ago', read: true },
  { id: '5', type: 'CONTEST', title: 'Biweekly Contest 126', body: 'This weekend biweekly contest is now live.', time: '3d ago', read: true },
]

const typeConfig = {
  CONTEST: { icon: <Trophy className="w-5 h-5 text-warning" />, badge: 'warning' as const },
  ACHIEVEMENT: { icon: <Flame className="w-5 h-5 text-success" />, badge: 'success' as const },
  REMINDER: { icon: <CalendarDays className="w-5 h-5 text-primary" />, badge: 'default' as const },
  ALERT: { icon: <AlertTriangle className="w-5 h-5 text-error" />, badge: 'error' as const },
}

export default function NotificationsPage() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-2xl">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {NOTIFICATIONS.filter((n) => !n.read).length} unread notifications
          </p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-3">
        {NOTIFICATIONS.map((notif) => {
          const config = typeConfig[notif.type as keyof typeof typeConfig]
          return (
            <div
              key={notif.id}
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors hover:bg-accent
                ${!notif.read ? 'border-primary/20 bg-primary/5' : 'border-border bg-card'}`}
            >
              <div className="mt-0.5 shrink-0">{config?.icon || <Bell className="w-5 h-5 text-muted-foreground" />}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm">{notif.title}</p>
                  {!notif.read && <span className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notif.body}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={config?.badge || 'secondary'} className="text-xs">{notif.type}</Badge>
                  <span className="text-xs text-muted-foreground">{notif.time}</span>
                </div>
              </div>
            </div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}
