import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getInitials } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  User, KeyRound, ShieldAlert, BadgeCheck, Smartphone, Eye, EyeOff,
  History, Laptop, LogOut, CheckCircle, RefreshCw, X, Download, ShieldCheck,
  Globe, AlertTriangle, Play, Settings, Bell, Palette, Database, Trash, Sliders
} from 'lucide-react'

// ─── Design Tokens ────────────────────────────────────────────
const GOLD = '#F5B301'
const DARK_SURFACE = '#1E293B'
const BORDER = '#334155'
const SUCCESS = '#22C55E'
const DANGER = '#EF4444'
const WARNING = '#F59E0B'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const iv = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

interface LoginSession {
  id: string
  device: string
  browser: string
  os: string
  ip: string
  location: string
  loginTime: string
  lastActivity: string
  current: boolean
}

interface LoginLog {
  id: string
  date: string
  time: string
  ip: string
  browser: string
  device: string
  location: string
  status: 'Success' | 'Failed'
}

interface ProfileAuditLog {
  id: string
  date: string
  action: string
  field: string
  oldVal: string
  newVal: string
  ip: string
}

export default function AdminProfilePage() {
  const { toast } = useToast()
  const { user } = useAuth()

  // ─── Component Navigation Tabs ────────────────────────────────
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'security' | 'sessions' | 'preferences' | 'connected' | 'audit'>('overview')

  // ─── Personal Info State ──────────────────────────────────────
  const [name, setName] = useState(user?.name || 'Administrator')
  const [email, setEmail] = useState(user?.email || 'admin@vsbcetc.edu.in')
  const [phone, setPhone] = useState('+91 98765 43210')
  const [dept, setDept] = useState('Computer Science & Engineering')
  const [designation, setDesignation] = useState('Chief Systems Architect')
  const [bio, setBio] = useState('Supervising student and faculty LeetCode onboarding logs, database health indices, and system cron jobs.')

  // ─── Password Change State ────────────────────────────────────
  const [currPassword, setCurrPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  // ─── Two Factor Authentication ────────────────────────────────
  const [tfaEnabled, setTfaEnabled] = useState(false)
  const [tfaMethod, setTfaMethod] = useState<'app' | 'email' | 'sms'>('app')

  // ─── Appearance Preferences ───────────────────────────────────
  const [accentColor, setAccentColor] = useState(GOLD)
  const [tableDensity, setTableDensity] = useState<'cozy' | 'compact'>('cozy')
  const [sidebarStyle, setSidebarStyle] = useState<'expanded' | 'collapsed'>('expanded')

  // ─── Mock Session State ───────────────────────────────────────
  const [sessions, setSessions] = useState<LoginSession[]>([
    { id: 'sess-1', device: 'Desktop PC', browser: 'Chrome', os: 'Windows 11', ip: '192.168.1.45', location: 'Chennai, India', loginTime: 'Today, 08:30 AM', lastActivity: 'Active Now', current: true },
    { id: 'sess-2', device: 'MacBook Pro', browser: 'Safari', os: 'macOS Sonoma', ip: '10.0.4.12', location: 'Coimbatore, India', loginTime: 'Yesterday, 04:12 PM', lastActivity: '2 hours ago', current: false },
    { id: 'sess-3', device: 'OnePlus 11', browser: 'Chrome Mobile', os: 'Android 14', ip: '157.44.12.89', location: 'Karur, India', loginTime: 'Jul 06, 09:14 AM', lastActivity: '2 days ago', current: false },
  ])

  // ─── Mock Login History State ─────────────────────────────────
  const [loginHistory, setLoginHistory] = useState<LoginLog[]>([
    { id: 'h-1', date: '2026-07-08', time: '08:30 AM', ip: '192.168.1.45', browser: 'Chrome', device: 'Windows Desktop', location: 'Karur, India', status: 'Success' },
    { id: 'h-2', date: '2026-07-08', time: '08:28 AM', ip: '192.168.1.45', browser: 'Chrome', device: 'Windows Desktop', location: 'Karur, India', status: 'Failed' },
    { id: 'h-3', date: '2026-07-07', time: '04:12 PM', ip: '10.0.4.12', browser: 'Safari', device: 'macOS Laptop', location: 'Coimbatore, India', status: 'Success' },
    { id: 'h-4', date: '2026-07-06', time: '09:14 AM', ip: '157.44.12.89', browser: 'Chrome Mobile', device: 'Android Phone', location: 'Chennai, India', status: 'Success' },
  ])
  const [historyFilter, setHistoryFilter] = useState<'all' | 'today' | 'week'>('all')

  // ─── Mock Audit Logs State ────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<ProfileAuditLog[]>([
    { id: 'log-1', date: '2026-07-08 11:45 AM', action: 'Update Profile Details', field: 'Designation', oldVal: 'Systems Architect', newVal: 'Chief Systems Architect', ip: '192.168.1.45' },
    { id: 'log-2', date: '2026-07-07 09:20 AM', action: 'Security Modification', field: 'Two-Factor Authentication', oldVal: 'Disabled', newVal: 'Enabled (App)', ip: '10.0.4.12' },
  ])

  // ─── Connected integrations State ─────────────────────────────
  const [leetcodeConnected, setLeetcodeConnected] = useState(true)
  const [githubConnected, setGithubConnected] = useState(true)

  // ─── Password Strength Evaluator ──────────────────────────────
  const passStrength = useMemo(() => {
    if (!newPassword) return 0
    let score = 0
    if (newPassword.length >= 8) score++
    if (/[A-Z]/.test(newPassword)) score++
    if (/[a-z]/.test(newPassword)) score++
    if (/[0-9]/.test(newPassword)) score++
    if (/[^A-Za-z0-9]/.test(newPassword)) score++
    return score
  }, [newPassword])

  // ─── Handlers & Operations ───────────────────────────────────
  const savePersonalInfo = () => {
    toast({ title: 'Profile Updated', description: 'Your personal parameters have been saved.' })
    const newLog: ProfileAuditLog = {
      id: String(Date.now()),
      date: new Date().toLocaleString(),
      action: 'Update Profile Details',
      field: 'Bio & Contact details',
      oldVal: 'Previous details',
      newVal: 'Active details',
      ip: '192.168.1.45'
    }
    setAuditLogs(prev => [newLog, ...prev])
  }

  const changePassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({ title: 'Validation Error', description: 'New passwords do not match.', variant: 'destructive' })
      return
    }
    if (passStrength < 3) {
      toast({ title: 'Weak Password', description: 'Please choose a stronger password matching requirements.', variant: 'destructive' })
      return
    }
    toast({ title: 'Password Changed', description: 'Your account access credential has been updated.' })
    setCurrPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const toggle2FA = () => {
    setTfaEnabled(!tfaEnabled)
    toast({
      title: tfaEnabled ? '2FA Disabled' : '2FA Security Enabled',
      description: tfaEnabled ? 'Two factor check bypassed.' : `Verification code requested via chosen Method.`
    })
  }

  const logoutSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    toast({ title: 'Session Logged Out', description: 'Selected device authentication has been terminated.' })
  }

  const logoutAllDevices = () => {
    setSessions(prev => prev.filter(s => s.current))
    toast({ title: 'Logged Out Other Devices', description: 'Terminated all secondary active login contexts.' })
  }

  const exportHistoryLogs = (format: 'PDF' | 'CSV') => {
    toast({ title: 'Export Initiated', description: `Compiling login logs table into ${format} file...` })
  }

  const filterLoginHistory = useMemo(() => {
    if (historyFilter === 'today') {
      return loginHistory.filter(h => h.date === '2026-07-08')
    }
    return loginHistory
  }, [loginHistory, historyFilter])

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">

      {/* ─── Header ────────────────────────────────────────────── */}
      <motion.div variants={iv} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Account Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Configure profile details, 2FA credentials, active sessions, and layouts</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* ═══ LEFT SIDE PANEL: PROFILE RESUME CARD & TABS ═══════ */}
        <div className="lg:col-span-1 space-y-6">
          {/* Summary Resume Card */}
          <motion.div variants={iv}>
            <Card className="text-center overflow-hidden relative">
              {/* Background gradient accent */}
              <div className="h-16 w-full opacity-60" style={{ background: `linear-gradient(90deg, ${accentColor} 0%, rgba(245,179,1,0.2) 100%)` }} />
              
              <CardContent className="p-6 -mt-10 relative">
                {/* Photo upload mock */}
                <div className="relative w-20 h-20 mx-auto rounded-full border-4 border-slate-900 overflow-hidden group shadow-xl">
                  <Avatar fallback={getInitials(name)} size="lg" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <span className="text-[10px] uppercase font-bold text-white tracking-wider">Change</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-base font-bold text-foreground flex items-center justify-center gap-1">
                    {name} <BadgeCheck className="w-4 h-4 text-primary" />
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-semibold">{designation}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1 bg-slate-800/80 px-2 py-0.5 rounded-full inline-block">
                    EMP-92810
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-5 pt-5 border-t border-border/60 text-left text-xs">
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">Role</span>
                    <p className="font-semibold text-foreground mt-0.5">Super Admin</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-bold">Status</span>
                    <p className="font-semibold text-success mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Active
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Navigation Tab Lists */}
          <motion.div variants={iv}>
            <Card>
              <CardContent className="p-2 space-y-1">
                {[
                  { id: 'overview', label: 'Security Dashboard', icon: <ShieldCheck className="w-4 h-4" /> },
                  { id: 'personal', label: 'Personal Information', icon: <User className="w-4 h-4" /> },
                  { id: 'security', label: 'Credentials & 2FA', icon: <KeyRound className="w-4 h-4" /> },
                  { id: 'sessions', label: 'Sessions & History', icon: <History className="w-4 h-4" /> },
                  { id: 'preferences', label: 'Theme & Layout', icon: <Palette className="w-4 h-4" /> },
                  { id: 'connected', label: 'Connected Profiles', icon: <Globe className="w-4 h-4" /> },
                  { id: 'audit', label: 'Profile Audit Log', icon: <Sliders className="w-4 h-4" /> },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                    style={activeTab === t.id
                      ? { background: accentColor, color: '#111827' }
                      : { color: 'var(--muted-foreground)' }
                    }
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ═══ RIGHT DETAILS AREA: CONTENT VIEWER ════════════════ */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >

              {/* 1. OVERVIEW TAB: SECURITY DASHBOARD */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Indicators Cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Account risk score</p>
                          <p className="text-xl font-extrabold mt-1 text-success">Excellent (98/100)</p>
                        </div>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-success/10 text-success">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Two-Factor Authentication</p>
                          <p className="text-xl font-extrabold mt-1" style={{ color: tfaEnabled ? SUCCESS : DANGER }}>
                            {tfaEnabled ? 'ENABLED' : 'DISABLED'}
                          </p>
                        </div>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: tfaEnabled ? `${SUCCESS}20` : `${DANGER}20`, color: tfaEnabled ? SUCCESS : DANGER }}>
                          <Smartphone className="w-5 h-5" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Login Sessions</p>
                          <p className="text-xl font-extrabold mt-1 text-primary">{sessions.length} Devices</p>
                        </div>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                          <Laptop className="w-5 h-5" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Summary list Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold">Account Metadata Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3.5 text-xs text-muted-foreground">
                      <div className="flex justify-between border-b border-border pb-2">
                        <span>Member Since</span>
                        <span className="font-semibold text-foreground">January 15, 2025</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-2">
                        <span>Last Password Change</span>
                        <span className="font-semibold text-foreground">30 days ago (June 08, 2026)</span>
                      </div>
                      <div className="flex justify-between border-b border-border pb-2">
                        <span>Associated Email</span>
                        <span className="font-semibold text-foreground">{email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>System Credentials Registry</span>
                        <Badge variant="outline">LOCAL + FIREBASE AUTH</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 2. PERSONAL INFO TAB */}
              {activeTab === 'personal' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Edit details synced across the CodePulse directory.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Full Name</label>
                        <Input value={name} onChange={e => setName(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Email Address</label>
                        <Input value={email} onChange={e => setEmail(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Mobile Number</label>
                        <Input value={phone} onChange={e => setPhone(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Department</label>
                        <Input value={dept} onChange={e => setDept(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Designation</label>
                        <Input value={designation} onChange={e => setDesignation(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Office Location</label>
                        <Input defaultValue="Main Block, Third Floor" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-muted-foreground mb-1 block">Administrator Bio</label>
                      <textarea
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        className="w-full min-h-[80px] bg-background border border-input rounded-lg p-3 text-sm focus:outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" className="border-border">Reset Changes</Button>
                      <Button onClick={savePersonalInfo}>Save Changes</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 3. SECURITY TAB: CREDENTIALS & 2FA */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Change Password Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Update Access Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={changePassword} className="space-y-4">
                        <div className="relative">
                          <label className="text-xs font-bold text-muted-foreground mb-1 block">Current Password</label>
                          <Input type={showPass ? 'text' : 'password'} value={currPassword} onChange={e => setCurrPassword(e.target.value)} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">New Password</label>
                            <div className="relative">
                              <Input type={showPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                              <button
                                type="button" onClick={() => setShowPass(!showPass)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-bold text-muted-foreground mb-1 block">Confirm Password</label>
                            <Input type={showPass ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                          </div>
                        </div>

                        {/* Password strength indicator */}
                        {newPassword && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                              <span>Password Strength</span>
                              <span style={{ color: passStrength >= 4 ? SUCCESS : passStrength >= 2 ? WARNING : DANGER }}>
                                {passStrength >= 4 ? 'Strong' : passStrength >= 2 ? 'Medium' : 'Weak'}
                              </span>
                            </div>
                            <div className="flex gap-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full" style={{ width: `${(passStrength / 5) * 100}%`, background: passStrength >= 4 ? SUCCESS : passStrength >= 2 ? WARNING : DANGER }} />
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end pt-2">
                          <Button type="submit">Modify Password</Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Two Factor Configuration */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
                      <CardDescription>Add an extra layer of identity verification to your administrator logins.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex justify-between items-center p-3.5 border border-border rounded-xl bg-muted/10">
                        <div>
                          <p className="text-xs font-bold text-foreground">Enforce Two-Factor Lock</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Require OTP code validation on authentication</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={tfaEnabled}
                          onChange={toggle2FA}
                          className="w-4 h-4 accent-[#F5B301] bg-slate-900 border-border"
                        />
                      </div>

                      {tfaEnabled && (
                        <div className="space-y-3.5 pt-2 border-t border-border">
                          <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Verification Method</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'app', label: 'Authenticator App' },
                              { id: 'email', label: 'Email OTP' },
                              { id: 'sms', label: 'SMS Code' },
                            ].map(method => (
                              <button
                                key={method.id}
                                onClick={() => setTfaMethod(method.id as any)}
                                className="py-2.5 px-2 rounded-lg border text-[11px] font-semibold transition-all uppercase tracking-wider text-center"
                                style={tfaMethod === method.id
                                  ? { borderColor: GOLD, background: `${GOLD}10`, color: GOLD }
                                  : { borderColor: BORDER, color: 'var(--muted-foreground)' }
                                }
                              >
                                {method.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 4. SESSIONS & HISTORY TAB */}
              {activeTab === 'sessions' && (
                <div className="space-y-6">
                  {/* Sessions Lists */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2 pb-3">
                      <div>
                        <CardTitle className="text-sm font-semibold">Active Login Sessions</CardTitle>
                        <CardDescription className="text-xs">Devices currently authenticated to access this admin panel.</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs font-semibold border-border" onClick={logoutAllDevices}>
                        Log Out All Devices
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {sessions.map(sess => (
                          <div key={sess.id} className="flex justify-between items-center p-4 text-xs">
                            <div className="flex items-center gap-3">
                              <Laptop className="w-5 h-5 text-primary shrink-0" />
                              <div>
                                <p className="font-semibold text-foreground flex items-center gap-1.5">
                                  {sess.device} · {sess.os}
                                  {sess.current && <Badge className="text-[9px] px-1 py-0.5">CURRENT SESSION</Badge>}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                                  {sess.browser} · IP: {sess.ip} · Location: {sess.location}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-right">
                              <div className="hidden sm:block">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Last Seen</span>
                                <span className="text-muted-foreground mt-0.5 block">{sess.lastActivity}</span>
                              </div>
                              {!sess.current && (
                                <button onClick={() => logoutSession(sess.id)} className="w-7 h-7 rounded bg-error/10 text-error flex items-center justify-center hover:bg-error/20">
                                  <LogOut className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* History Logs */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 pb-3">
                      <div>
                        <CardTitle className="text-sm font-semibold">Login Audits &amp; History</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="h-8 px-2 bg-background border border-border rounded-lg text-[10px] focus:outline-none focus:border-primary text-foreground uppercase tracking-wider font-semibold"
                          value={historyFilter}
                          onChange={e => setHistoryFilter(e.target.value as any)}
                        >
                          <option value="all">All Audits</option>
                          <option value="today">Today Only</option>
                        </select>
                        <Button variant="outline" size="sm" className="h-8 text-xs border-border" onClick={() => exportHistoryLogs('CSV')}>
                          <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-border bg-muted/20">
                              <th className="px-4 py-2.5 font-semibold text-muted-foreground">Date / Time</th>
                              <th className="px-4 py-2.5 font-semibold text-muted-foreground">Device</th>
                              <th className="px-4 py-2.5 font-semibold text-muted-foreground">IP Address</th>
                              <th className="px-4 py-2.5 font-semibold text-muted-foreground">Location</th>
                              <th className="px-4 py-2.5 font-semibold text-muted-foreground">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {filterLoginHistory.map(h => (
                              <tr key={h.id} className="hover:bg-slate-50/5 text-muted-foreground">
                                <td className="px-4 py-2.5 font-mono">{h.date} · {h.time}</td>
                                <td className="px-4 py-2.5 text-foreground">{h.device} ({h.browser})</td>
                                <td className="px-4 py-2.5 font-mono">{h.ip}</td>
                                <td className="px-4 py-2.5">{h.location}</td>
                                <td className="px-4 py-2.5">
                                  <Badge variant={h.status === 'Success' ? 'success' : 'error'} className="text-[9px] uppercase tracking-wider font-mono">
                                    {h.status}
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

              {/* 5. THEME & PREFERENCES TAB */}
              {activeTab === 'preferences' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance Preferences</CardTitle>
                    <CardDescription>Tailor the operations console UI aesthetics to your liking.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Accent Color picker */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase block">System Highlight Theme Accent</label>
                      <div className="flex gap-3">
                        {[
                          { name: 'Standard Gold', color: GOLD },
                          { name: 'Sky Blue', color: '#3B82F6' },
                          { name: 'Emerald', color: '#10B981' },
                          { name: 'Purple Power', color: '#8B5CF6' },
                        ].map(c => (
                          <button
                            key={c.color}
                            onClick={() => {
                              setAccentColor(c.color)
                              toast({ title: 'Highlight Accent Changed', description: `Consoles updated to ${c.name}.` })
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold"
                            style={accentColor === c.color ? { borderColor: c.color, background: `${c.color}15`, color: c.color } : { borderColor: BORDER, color: 'var(--muted-foreground)' }}
                          >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Table Density */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <label className="text-xs font-bold text-muted-foreground uppercase block">Data Tables Spacing density</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setTableDensity('cozy')}
                          className="py-2 px-4 border rounded-lg text-xs font-semibold tracking-wider text-center"
                          style={tableDensity === 'cozy'
                            ? { borderColor: accentColor, background: `${accentColor}10`, color: accentColor }
                            : { borderColor: BORDER, color: 'var(--muted-foreground)' }
                          }
                        >
                          Cozy Spacing (Standard)
                        </button>
                        <button
                          onClick={() => setTableDensity('compact')}
                          className="py-2 px-4 border rounded-lg text-xs font-semibold tracking-wider text-center"
                          style={tableDensity === 'compact'
                            ? { borderColor: accentColor, background: `${accentColor}10`, color: accentColor }
                            : { borderColor: BORDER, color: 'var(--muted-foreground)' }
                          }
                        >
                          Compact Spacing (Dense Rows)
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 6. CONNECTED PROFILES TAB */}
              {activeTab === 'connected' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Connected Profiles</CardTitle>
                    <CardDescription>Manage OAuth integrations with student analytics engines.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: 'LeetCode OAuth Sync', desc: 'Sync student solves profiles', connected: leetcodeConnected, set: setLeetcodeConnected },
                      { name: 'GitHub Integration', desc: 'Verify repos commit graphs', connected: githubConnected, set: setGithubConnected },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3.5 border border-border rounded-xl bg-muted/10 text-xs">
                        <div>
                          <p className="font-bold text-foreground">{item.name}</p>
                          <p className="text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline" size="sm" className="text-xs"
                            onClick={() => {
                              item.set(!item.connected)
                              toast({ title: item.connected ? 'OAuth Terminated' : 'Integration Established', description: `LeetCode API context modified.` })
                            }}
                          >
                            {item.connected ? 'Disconnect' : 'Connect Account'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* 7. PROFILE AUDIT LOG */}
              {activeTab === 'audit' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Audit Trail Logs</CardTitle>
                    <CardDescription>Chronological change record targeting this user's profile settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-border bg-muted/20">
                            <th className="px-4 py-2.5 font-semibold text-muted-foreground">Timestamp</th>
                            <th className="px-4 py-2.5 font-semibold text-muted-foreground">Action Type</th>
                            <th className="px-4 py-2.5 font-semibold text-muted-foreground">Field Affected</th>
                            <th className="px-4 py-2.5 font-semibold text-muted-foreground">Old State</th>
                            <th className="px-4 py-2.5 font-semibold text-muted-foreground">New State</th>
                            <th className="px-4 py-2.5 font-semibold text-muted-foreground">IP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border font-mono text-muted-foreground">
                          {auditLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50/5">
                              <td className="px-4 py-2.5 font-semibold text-foreground">{log.date}</td>
                              <td className="px-4 py-2.5">{log.action}</td>
                              <td className="px-4 py-2.5">
                                <Badge variant="outline" className="text-[10px]">{log.field}</Badge>
                              </td>
                              <td className="px-4 py-2.5 text-error">{log.oldVal}</td>
                              <td className="px-4 py-2.5 text-success">{log.newVal}</td>
                              <td className="px-4 py-2.5">{log.ip}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </motion.div>
  )
}
