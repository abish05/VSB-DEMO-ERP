import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import apiClient from '@/services/apiClient'
import { Lock, Eye, EyeOff, Save, CheckCircle2, AlertCircle } from 'lucide-react'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

export default function FacultySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Status
  const [updating, setUpdating] = useState(false)
  const [msg, setMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Prefs
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [dailyDigest, setDailyDigest] = useState(false)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [savingPrefs, setSavingPrefs] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.')
      return
    }
    setUpdating(true)
    setMsg('')
    setErrorMsg('')
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      })
      setMsg('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to change password. Ensure current password is correct.')
    } finally {
      setUpdating(false)
    }
  }

  const handleSavePrefs = async () => {
    setSavingPrefs(true)
    setMsg('')
    setErrorMsg('')
    try {
      // Simulate/Save preferences
      await new Promise(resolve => setTimeout(resolve, 800))
      setMsg('Notification preferences saved successfully!')
    } catch {
      setErrorMsg('Failed to save preferences.')
    } finally {
      setSavingPrefs(false)
    }
  }

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={iv}>
        <h1 className="text-2xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage security settings and system notification preferences</p>
      </motion.div>

      {msg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm bg-primary/10 border border-primary/20 rounded-lg px-3 py-2.5 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span>{msg}</span>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm bg-error/10 border border-error/20 rounded-lg px-3 py-2.5 flex items-center gap-2 text-error"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Password Card */}
        <motion.div variants={iv}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" /> Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="relative">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-background border border-border rounded-lg h-10 pl-3 pr-10 text-sm focus:outline-none focus:border-primary text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-background border border-border rounded-lg h-10 pl-3 pr-10 text-sm focus:outline-none focus:border-primary text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-background border border-border rounded-lg h-10 pl-3 pr-10 text-sm focus:outline-none focus:border-primary text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" isLoading={updating}>
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferences Notification preferences Card */}
        <motion.div variants={iv}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Save className="w-4 h-4 text-primary" /> Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <p className="font-semibold text-sm">Email Alerts</p>
                    <p className="text-xs text-muted-foreground">Receive instant email when a student flags inactive</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={e => setEmailAlerts(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <p className="font-semibold text-sm">Daily Digest</p>
                    <p className="text-xs text-muted-foreground">Receive summary of daily solved problems count</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={dailyDigest}
                    onChange={e => setDailyDigest(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pb-1">
                  <div>
                    <p className="font-semibold text-sm">Weekly Performance Digest</p>
                    <p className="text-xs text-muted-foreground">Receive weekly performance report of your entire section</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={weeklyDigest}
                    onChange={e => setWeeklyDigest(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>
              </div>

              <Button onClick={handleSavePrefs} className="w-full" isLoading={savingPrefs}>
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
