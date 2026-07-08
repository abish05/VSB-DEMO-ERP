import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Bell, Send, ShieldAlert, Info, BarChart2, Calendar, FileText, Globe, Mail,
  MessageSquare, Clock, Plus, Trash2, Edit2, Play, Copy, Archive, Search,
  Filter, CheckCircle, HelpCircle, AlertOctagon, Sparkles, User, RefreshCw, X
} from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from 'recharts'
import { adminService } from '@/services/admin.service'

// ─── Design Tokens ────────────────────────────────────────────
const GOLD = '#F5B301'
const DARK_SURFACE = '#1E293B'
const BORDER = '#334155'
const SUCCESS = '#22C55E'
const DANGER = '#EF4444'
const WARNING = '#F59E0B'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const iv = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

interface NotificationBroadcast {
  id: string
  title: string
  subject: string
  category: string
  priority: 'High' | 'Medium' | 'Low'
  sender: string
  target: string
  sentTime: string
  status: 'Delivered' | 'Scheduled' | 'Draft'
  readCount: number
  totalCount: number
}

interface DeliveryTracker {
  id: string
  user: string
  email: string
  status: 'Delivered' | 'Read' | 'Pending' | 'Failed'
  time: string
  clicked: boolean
}

export default function AdminNotificationsPage() {
  const { toast } = useToast()

  // ─── Active Operations Views ──────────────────────────────────
  const [activeView, setActiveView] = useState<'composer' | 'history' | 'analytics'>('composer')

  // ─── Composer Form States ─────────────────────────────────────
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('Academic Announcement')
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium')
  
  // Target filters selections
  const [targetRole, setTargetRole] = useState('ALL')
  const [targetDept, setTargetDept] = useState('ALL')
  const [targetYear, setTargetYear] = useState('ALL')

  // Channels triggers
  const [channelInApp, setChannelInApp] = useState(true)
  const [channelEmail, setChannelEmail] = useState(true)
  const [channelPush, setChannelPush] = useState(false)

  // Scheduling options
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>('immediate')
  const [scheduleDate, setScheduleDate] = useState('')

  const [attachmentsList, setAttachmentsList] = useState<string[]>([])
  const [newAttachmentName, setNewAttachmentName] = useState('')

  // ─── Mock History Logs State ──────────────────────────────────
  const [broadcasts, setBroadcasts] = useState<NotificationBroadcast[]>([
    { id: 'bc-1', title: 'Weekly LeetCode Leaderboard Out!', subject: 'Check your department ranks', category: 'Coding Contest', priority: 'Medium', sender: 'Placement Cell', target: 'All Students', sentTime: 'Today, 10:15 AM', status: 'Delivered', readCount: 384, totalCount: 412 },
    { id: 'bc-2', title: 'Placement Drive: CodePulse AI Recruiting', subject: 'Eligibility criteria details', category: 'Placement Drive', priority: 'High', sender: 'Officer Sundaram', target: 'CSE & IT (Year 4)', sentTime: 'Yesterday, 02:30 PM', status: 'Delivered', readCount: 180, totalCount: 195 },
    { id: 'bc-3', title: 'Semester Lab Examination Schedule', subject: 'Dates sheets PDF appended', category: 'Academic Announcement', priority: 'High', sender: 'HOD Office', target: 'All Students', sentTime: 'Jul 06, 09:00 AM', status: 'Delivered', readCount: 310, totalCount: 412 },
    { id: 'bc-4', title: 'System Maintenance Scheduled Downtime', subject: 'In-app statistics sync freeze', category: 'System Maintenance', priority: 'Low', sender: 'Super Admin', target: 'All Users', sentTime: 'Scheduled for tonight', status: 'Scheduled', readCount: 0, totalCount: 520 },
  ])

  // ─── Mock Live Delivery Logs State ─────────────────────────────
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryTracker[]>([
    { id: 'dt-1', user: 'Anandamirtharaj D', email: 'anandamirtharaj.vsb@gmail.com', status: 'Read', time: '10 mins ago', clicked: true },
    { id: 'dt-2', user: 'ABISH A', email: 'rioabish@gmail.com', status: 'Read', time: '12 mins ago', clicked: true },
    { id: 'dt-3', user: 'Yugesh S', email: 'sivayugesh90@gmail.com', status: 'Delivered', time: '20 mins ago', clicked: false },
    { id: 'dt-4', user: 'Kalaikumaran T', email: 'tkalaikumaran@gmail.com', status: 'Pending', time: 'Just now', clicked: false },
  ])

  // ─── Search & Filters States ──────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  // ─── Simulated Metrics ────────────────────────────────────────
  const totalSent = broadcasts.reduce((acc, curr) => acc + curr.totalCount, 0)
  const totalRead = broadcasts.reduce((acc, curr) => acc + curr.readCount, 0)
  const readRate = Math.round((totalRead / (totalSent || 1)) * 100)

  // ─── Analytics Recharts Data ──────────────────────────────────
  const lineChartData = [
    { name: 'Mon', Sent: 120, Read: 98 },
    { name: 'Tue', Sent: 240, Read: 198 },
    { name: 'Wed', Sent: 180, Read: 160 },
    { name: 'Thu', Sent: 300, Read: 280 },
    { name: 'Fri', Sent: 412, Read: 384 },
  ]

  const barChartData = [
    { name: 'CSE', Delivered: 180, Read: 170 },
    { name: 'IT', Delivered: 120, Read: 110 },
    { name: 'ECE', Delivered: 90, Read: 80 },
    { name: 'EEE', Delivered: 60, Read: 45 },
  ]

  // ─── Operations & Dispatch Handlers ───────────────────────────
  const addAttachment = () => {
    if (!newAttachmentName.trim()) return
    setAttachmentsList(prev => [...prev, newAttachmentName.trim()])
    setNewAttachmentName('')
  }

  const removeAttachment = (idx: number) => {
    setAttachmentsList(prev => prev.filter((_, i) => i !== idx))
  }

  const dispatchNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) {
      toast({ title: 'Validation Warning', description: 'Title and broadcast message body are required.', variant: 'destructive' })
      return
    }

    try {
      const payload = {
        title,
        body: message,
        type: category.toUpperCase().replace(' ', '_'),
        targetRole: targetRole !== 'ALL' ? targetRole : undefined,
      }
      await adminService.sendNotification(payload)

      // Add to mock broadcasts lists
      const newBc: NotificationBroadcast = {
        id: `bc-${Date.now()}`,
        title,
        subject: subject || 'No Subject',
        category,
        priority,
        sender: 'Administrator',
        target: `${targetRole} (${targetDept})`,
        sentTime: scheduleType === 'immediate' ? 'Just Now' : `Scheduled for ${scheduleDate}`,
        status: scheduleType === 'immediate' ? 'Delivered' : 'Scheduled',
        readCount: 0,
        totalCount: targetRole === 'STUDENT' ? 412 : 520
      }

      setBroadcasts(prev => [newBc, ...prev])
      toast({ title: 'Broadcast Dispatched', description: 'Real-time alert pushed to all targeted users dashboard.' })

      // Clear composer states
      setTitle('')
      setSubject('')
      setMessage('')
      setAttachmentsList([])
    } catch (err: any) {
      toast({
        title: 'Broadcast Failed',
        description: err?.response?.data?.message || 'Failed to dispatch broadcast. Try again.',
        variant: 'destructive',
      })
    }
  }

  const deleteBroadcast = (id: string) => {
    setBroadcasts(prev => prev.filter(b => b.id !== id))
    toast({ title: 'Broadcast Removed', description: 'Alert deleted from chronological archives.', variant: 'destructive' })
  }

  const duplicateTemplate = (b: NotificationBroadcast) => {
    setTitle(b.title)
    setSubject(b.subject)
    setCategory(b.category)
    setPriority(b.priority)
    setActiveView('composer')
    toast({ title: 'Template Copied', description: 'Fields populated. Review details before sending.' })
  }

  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter(b => {
      const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.sender.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = filterCategory ? b.category === filterCategory : true
      return matchesSearch && matchesCategory
    })
  }, [broadcasts, searchQuery, filterCategory])

  const categoriesList = useMemo(() => {
    return [...new Set(broadcasts.map(b => b.category))]
  }, [broadcasts])

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">

      {/* ─── Header View Toggle Tab links ───────────────────────── */}
      <motion.div variants={iv} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Announcements Dispatch Center</h1>
          <p className="text-muted-foreground text-sm mt-1">Compose alerts, monitor read clicks status, and review scheduled feeds</p>
        </div>

        <div className="flex gap-1.5 bg-slate-900 border border-border p-1 rounded-xl">
          {[
            { id: 'composer', label: 'Compose', icon: <Plus className="w-3.5 h-3.5" /> },
            { id: 'history', label: 'Broadcast History', icon: <Clock className="w-3.5 h-3.5" /> },
            { id: 'analytics', label: 'Engagement Stats', icon: <BarChart2 className="w-3.5 h-3.5" /> },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveView(t.id as any)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all"
              style={activeView === t.id
                ? { background: GOLD, color: '#111827' }
                : { color: 'var(--muted-foreground)' }
              }
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ─── Real-Time Analytics HUD Cards ─────────────────────── */}
      <motion.div variants={iv} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total Broadcasts</p>
              <p className="text-2xl font-extrabold mt-1">{broadcasts.length}</p>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
              <Bell className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Estimated Recipients</p>
              <p className="text-2xl font-extrabold mt-1 text-blue-500">{totalSent}</p>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-500">
              <Globe className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Read Analytics Rate</p>
              <p className="text-2xl font-extrabold mt-1 text-success">{readRate}%</p>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-success/10 text-success">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Queue status</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-success animate-ping" />
                <span className="text-xs font-bold text-success uppercase">Active (Websockets)</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-success/10 text-success">
              <RefreshCw className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Tab Content Views ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >

          {/* ═══ VIEW 1: COMPOSE BROADCASTS ═════════════════════════ */}
          {activeView === 'composer' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Broadcast Composer</CardTitle>
                    <CardDescription>Target classrooms, cohorts, or specific departments.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={dispatchNotification} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Broadcast Title</label>
                          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Daily LeetCode Reminder" required />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Subject Header</label>
                          <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Maintain streak scores..." />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Category</label>
                          <select className="w-full bg-background border border-input rounded-lg h-10 px-3 text-xs focus:outline-none focus:border-primary text-foreground" value={category} onChange={e => setCategory(e.target.value)}>
                            <option>Academic Announcement</option>
                            <option>Placement Drive</option>
                            <option>Coding Contest</option>
                            <option>System Maintenance</option>
                            <option>Emergency Alert</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Alert Priority</label>
                          <select className="w-full bg-background border border-input rounded-lg h-10 px-3 text-xs focus:outline-none focus:border-primary text-foreground" value={priority} onChange={e => setPriority(e.target.value as any)}>
                            <option value="High">🔴 High Priority</option>
                            <option value="Medium">🟡 Medium Priority</option>
                            <option value="Low">🟢 Low Priority</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Target Roster Role</label>
                          <select className="w-full bg-background border border-input rounded-lg h-10 px-3 text-xs focus:outline-none focus:border-primary text-foreground" value={targetRole} onChange={e => setTargetRole(e.target.value)}>
                            <option value="ALL">All Roster roles</option>
                            <option value="STUDENT">Only Students</option>
                            <option value="FACULTY">Only Faculty Members</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/60">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Target Department</label>
                          <select className="w-full bg-background border border-input rounded-lg h-10 px-3 text-xs focus:outline-none focus:border-primary text-foreground" value={targetDept} onChange={e => setTargetDept(e.target.value)}>
                            <option value="ALL">All Departments</option>
                            <option value="CSE">CSE</option>
                            <option value="IT">IT</option>
                            <option value="ECE">ECE</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Academic Year</label>
                          <select className="w-full bg-background border border-input rounded-lg h-10 px-3 text-xs focus:outline-none focus:border-primary text-foreground" value={targetYear} onChange={e => setTargetYear(e.target.value)}>
                            <option value="ALL">All Cohorts (Years 1-4)</option>
                            <option value="4">Final Year (Year 4)</option>
                            <option value="3">Third Year (Year 3)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground block">Notification Body Message (supports markdown formatting)</label>
                        <textarea
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          placeholder="Compose details here..."
                          className="w-full min-h-[120px] bg-background border border-input rounded-lg p-3 text-xs focus:outline-none focus:border-primary text-foreground"
                          required
                        />
                      </div>

                      {/* Attachments list mock */}
                      <div className="space-y-2 pt-2 border-t border-border/60">
                        <label className="text-xs font-bold text-muted-foreground block">Attachments / Reference Files</label>
                        <div className="flex gap-2">
                          <Input value={newAttachmentName} onChange={e => setNewAttachmentName(e.target.value)} placeholder="e.g. Schedule_Lab.pdf" className="h-9 text-xs" />
                          <Button type="button" variant="outline" size="sm" className="h-9 border-border" onClick={addAttachment}>Add</Button>
                        </div>
                        {attachmentsList.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {attachmentsList.map((att, idx) => (
                              <Badge key={idx} variant="secondary" className="gap-1 px-2.5 py-1 text-[10px]">
                                {att}
                                <X className="w-3 h-3 cursor-pointer text-error" onClick={() => removeAttachment(idx)} />
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Scheduling option toggle */}
                      <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Delivery Timing</label>
                          <select className="w-full bg-background border border-input rounded-lg h-10 px-3 text-xs focus:outline-none focus:border-primary text-foreground" value={scheduleType} onChange={e => setScheduleType(e.target.value as any)}>
                            <option value="immediate">Send Immediately</option>
                            <option value="scheduled">Schedule for later time</option>
                          </select>
                        </div>
                        {scheduleType === 'scheduled' && (
                          <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">Scheduled Date &amp; Time</label>
                            <Input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="h-10 text-xs" />
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="submit" className="gap-2">
                          <Send className="w-3.5 h-3.5" /> Dispatch Broadcast
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Broadcast Preview HUD */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Preview Card Hub</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl border border-border bg-slate-900/60 text-xs space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase text-primary px-2 py-0.5 rounded bg-primary/10">
                          {category}
                        </span>
                        <span className="text-[9px] text-muted-foreground">Just Now</span>
                      </div>
                      <h4 className="font-extrabold text-foreground">{title || 'Broadcast Title'}</h4>
                      <p className="text-muted-foreground leading-relaxed truncate">{message || 'Announcement message body...'}</p>
                      {attachmentsList.length > 0 && (
                        <div className="pt-2 border-t border-border text-[10px] text-muted-foreground">
                          📎 Attachments: {attachmentsList.join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-muted/10 border border-border rounded-xl text-xs space-y-2 text-muted-foreground leading-relaxed">
                      <div className="flex items-center gap-2 text-foreground font-bold">
                        <ShieldAlert className="w-4 h-4 text-warning" /> Broadcast Guidance
                      </div>
                      <p>Dispatched messages are saved in user notifications logs and cannot be undone.</p>
                      <p>Automation triggers for student inactivity checks are processed by background cron queues.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ═══ VIEW 2: HISTORY LOGS ══════════════════════════════ */}
          {activeView === 'history' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 pb-3">
                <div>
                  <CardTitle>Broadcast logs History</CardTitle>
                  <CardDescription>Archive records of sent alerts and templates.</CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-44">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search log..."
                      className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-border bg-background text-[11px] focus:outline-none focus:border-primary text-foreground"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="h-8 px-2 bg-background border border-border rounded-lg text-[11px] focus:outline-none focus:border-primary text-foreground"
                  >
                    <option value="">All Categories</option>
                    {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="px-4 py-3 font-semibold text-muted-foreground">Broadcast Title</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground">Category</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground">Target</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground">Sent Time</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground">Read Ratio</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                        <th className="px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredBroadcasts.map(bc => (
                        <tr key={bc.id} className="hover:bg-slate-50/5 text-muted-foreground">
                          <td className="px-4 py-3 font-semibold text-foreground">{bc.title}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px]">{bc.category}</Badge>
                          </td>
                          <td className="px-4 py-3">{bc.target}</td>
                          <td className="px-4 py-3 font-mono text-[10px]">{bc.sentTime}</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-foreground">{bc.readCount}</span> / {bc.totalCount} ({Math.round((bc.readCount / bc.totalCount) * 100)}%)
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={bc.status === 'Delivered' ? 'success' : 'secondary'} className="text-[9px] uppercase font-mono">
                              {bc.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <button onClick={() => duplicateTemplate(bc)} className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20" title="Duplicate">
                                <Copy className="w-3 h-3" />
                              </button>
                              <button onClick={() => deleteBroadcast(bc.id)} className="w-6 h-6 rounded bg-error/10 text-error flex items-center justify-center hover:bg-error/20" title="Delete">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredBroadcasts.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground italic">No notification archives match search criteria</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ═══ VIEW 3: ENGAGEMENT ANALYTICS ══════════════════════ */}
          {activeView === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Line Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Daily Broadcast Volume &amp; Opens</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={lineChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} />
                        <YAxis stroke="#94A3B8" fontSize={9} />
                        <Tooltip contentStyle={{ background: DARK_SURFACE, borderColor: BORDER }} />
                        <Area dataKey="Sent" stroke={GOLD} fill="rgba(245,179,1,0.06)" strokeWidth={2} />
                        <Area dataKey="Read" stroke={SUCCESS} fill="rgba(34,197,94,0.06)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Department-wise Delivery Success</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} />
                        <YAxis stroke="#94A3B8" fontSize={9} />
                        <Tooltip contentStyle={{ background: DARK_SURFACE, borderColor: BORDER }} />
                        <Bar dataKey="Delivered" fill={GOLD} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Read" fill={SUCCESS} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Delivery log grid */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Real-Time Delivery Logs Tracker</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          <th className="px-4 py-2.5 font-semibold text-muted-foreground">User</th>
                          <th className="px-4 py-2.5 font-semibold text-muted-foreground">Email Address</th>
                          <th className="px-4 py-2.5 font-semibold text-muted-foreground">Received Time</th>
                          <th className="px-4 py-2.5 font-semibold text-muted-foreground">Delivery Method</th>
                          <th className="px-4 py-2.5 font-semibold text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-muted-foreground">
                        {deliveryLogs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50/5">
                            <td className="px-4 py-2.5 font-semibold text-foreground">{log.user}</td>
                            <td className="px-4 py-2.5 font-mono text-[11px]">{log.email}</td>
                            <td className="px-4 py-2.5">{log.time}</td>
                            <td className="px-4 py-2.5 uppercase text-[9px] font-bold tracking-wider">In-App + Email</td>
                            <td className="px-4 py-2.5">
                              <Badge variant={log.status === 'Read' ? 'success' : log.status === 'Delivered' ? 'default' : 'secondary'} className="text-[9px] uppercase tracking-wider font-mono">
                                {log.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
