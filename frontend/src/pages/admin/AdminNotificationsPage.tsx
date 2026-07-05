import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminService } from '@/services/admin.service'
import { useToast } from '@/hooks/use-toast'
import { Bell, Send, ShieldAlert, Info } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function AdminNotificationsPage() {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState('ANNOUNCEMENT')
  const [targetRole, setTargetRole] = useState('')

  const sendMutation = useMutation({
    mutationFn: (payload: any) => adminService.sendNotification(payload),
    onSuccess: (res) => {
      toast({
        title: 'Broadcast Sent',
        description: res?.message || 'Notifications have been successfully delivered.',
      })
      setTitle('')
      setBody('')
    },
    onError: (err: any) => {
      toast({
        title: 'Broadcast Failed',
        description: err?.response?.data?.message || 'Failed to dispatch broadcast. Try again.',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMutation.mutate({
      title,
      body,
      type,
      targetRole: targetRole || undefined,
    })
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">Notifications Dispatcher</h1>
        <p className="text-muted-foreground text-sm mt-1">Broadcast system alerts or academic announcements to groups</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Composer Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Compose New Broadcast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Announcement Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekly LeetCode Leaderboard Update"
                className="bg-slate-950 border-slate-800"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-400">Notification Body Message</label>
                <textarea
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Review this week's rankings! Keep solving to maintain your streaks..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-primary placeholder-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Target Group</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="">All Institutional Users</option>
                    <option value="STUDENT">Only Students</option>
                    <option value="FACULTY">Only Faculty Members</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-400">Alert Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="ANNOUNCEMENT">ANNOUNCEMENT</option>
                    <option value="ALERT">ALERT</option>
                    <option value="REMINDER">REMINDER</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={sendMutation.isPending} className="gap-2">
                  <Send className="w-3.5 h-3.5" /> Dispatch Alert
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Broadcast Info */}
        <Card className="md:col-span-1 bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-warning" /> Safety Guidance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-slate-400 leading-relaxed">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <p>Broadcasts will write immediately to target user notification collections.</p>
            </div>
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <p>Verify details. Sent alerts cannot be recalled or edited once dispatched.</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
