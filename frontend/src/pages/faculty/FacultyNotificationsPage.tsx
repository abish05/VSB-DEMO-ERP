import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/services/apiClient'
import { Bell, Send, CheckCircle2, Megaphone, Clock, Info, ShieldAlert } from 'lucide-react'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

interface DBNotification {
  id: string
  title: string
  message: string
  type: string
  createdAt: string
  read: boolean
}

export default function FacultyNotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<DBNotification[]>([])
  const [loading, setLoading] = useState(true)

  // Announcement inputs
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState<'ANNOUNCEMENT' | 'CONTEST' | 'ALERT' | 'REMINDER'>('ANNOUNCEMENT')
  const [targetAudience, setTargetAudience] = useState<'ALL' | 'STUDENTS'>('STUDENTS')
  const [sending, setSending] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.get('/notifications')
      setNotifications(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !message) return
    setSending(true)
    setStatusMsg('')
    try {
      await apiClient.post('/notifications', {
        title,
        message,
        type: category,
        targetAudience,
        departmentId: user?.departmentId || undefined,
      })
      setStatusMsg('Announcement sent successfully! Students will see it in real-time.')
      setTitle('')
      setMessage('')
      void loadNotifications()
    } catch (err) {
      console.error(err)
      setStatusMsg('Failed to send announcement. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark-read')
      void loadNotifications()
    } catch (err) {
      console.error(err)
    }
  }

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'ALERT':
        return <ShieldAlert className="w-4 h-4 text-error" />
      case 'CONTEST':
        return <Bell className="w-4 h-4 text-warning" />
      case 'REMINDER':
        return <Clock className="w-4 h-4 text-indigo-400" />
      default:
        return <Megaphone className="w-4 h-4 text-primary" />
    }
  }

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={iv} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Announcements & Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Broadcast updates to your students or view system alerts
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>
          Mark All as Read
        </Button>
      </motion.div>

      {statusMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm bg-primary/10 border border-primary/20 rounded-lg px-3 py-2.5 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span>{statusMsg}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Announcement */}
        <motion.div variants={iv} className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" /> Broadcast Announcement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Announcement Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Weekly LeetCode Challenge"
                    className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe details, deadlines or tasks..."
                    className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-primary text-foreground resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as any)}
                      className="w-full bg-background border border-border rounded-lg h-10 px-2 text-xs focus:outline-none focus:border-primary text-foreground"
                    >
                      <option value="ANNOUNCEMENT">Announcement</option>
                      <option value="CONTEST">Contest Info</option>
                      <option value="REMINDER">Reminder</option>
                      <option value="ALERT">Alert</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Audience
                    </label>
                    <select
                      value={targetAudience}
                      onChange={e => setTargetAudience(e.target.value as any)}
                      className="w-full bg-background border border-border rounded-lg h-10 px-2 text-xs focus:outline-none focus:border-primary text-foreground"
                    >
                      <option value="STUDENTS">My Students</option>
                      <option value="ALL">All Departments</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" className="w-full" isLoading={sending}>
                  Send Announcement
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sent Announcements & Logs */}
        <motion.div variants={iv} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-warning" /> Message History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading history...</p>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground space-y-2">
                  <Info className="w-8 h-8 mx-auto opacity-40" />
                  <p className="text-sm">No announcements sent yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-lg border border-border bg-muted/10 hover:bg-muted/20 transition-colors flex items-start gap-3 ${
                        !n.read ? 'border-l-primary border-l-2' : ''
                      }`}
                    >
                      <div className="p-2 bg-background border border-border rounded-lg shrink-0">
                        {getCategoryIcon(n.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-foreground truncate">{n.title}</p>
                          <Badge variant="secondary" className="text-[9px] font-mono">
                            {n.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2 font-mono">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
