import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import apiClient from '@/services/apiClient'
import { leetcodeService } from '@/services/leetcode.service'
import { User, Mail, Shield, Building, CreditCard, RefreshCw, CheckCircle2, Award } from 'lucide-react'
import { getInitials } from '@/lib/utils'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

export default function FacultyProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [usernameInput, setUsernameInput] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState('')

  const loadProfile = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const p = await leetcodeService.getProfile(user.id).catch(() => null)
      setProfile(p)
      if (p?.username) setUsernameInput(p.username)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleLinkUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usernameInput) return
    setSyncing(true)
    setMsg('')
    try {
      await leetcodeService.linkUsername(usernameInput)
      setMsg('LeetCode account linked and synced successfully!')
      void loadProfile()
    } catch {
      setMsg('Failed to verify LeetCode account. Ensure the username is correct.')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) return <div className="h-64 rounded-xl bg-muted/20 animate-pulse" />

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={iv}>
        <h1 className="text-2xl font-bold">Faculty Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account information and LeetCode link</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <motion.div variants={iv} className="lg:col-span-1 space-y-6">
          <Card className="text-center">
            <CardContent className="pt-8 pb-6 space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto text-2xl font-bold text-primary border-2 border-primary/40 shadow-inner">
                {user ? getInitials(user.name) : <User className="w-8 h-8" />}
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">{user?.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{user?.designation || 'Faculty Member'}</p>
              </div>
              <div className="flex justify-center">
                <Badge variant="default" className="text-[10px] tracking-wider uppercase font-mono">
                  {user?.role}
                </Badge>
              </div>
              <div className="border-t border-border pt-4 text-left space-y-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>ID: {user?.employeeId || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5" />
                  <span>{user?.department?.name || 'Department Name'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile editing / leetcode link */}
        <motion.div variants={iv} className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-primary" /> LeetCode Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/20 border border-border flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Linked LeetCode Username</p>
                      <p className="font-mono font-bold text-foreground text-sm mt-0.5">{profile.username}</p>
                    </div>
                    <Badge variant="success" className="text-[10px] uppercase font-mono">
                      Synced
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    {[
                      { label: 'Total Solved', value: profile.totalSolved },
                      { label: 'Easy Solved', value: profile.easySolved },
                      { label: 'Medium Solved', value: profile.mediumSolved },
                      { label: 'Hard Solved', value: profile.hardSolved },
                    ].map(st => (
                      <div key={st.label} className="p-3 bg-muted/15 rounded-lg text-center border border-border/40">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{st.label}</p>
                        <p className="text-lg font-bold text-foreground mt-1">{st.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLinkUsername} className="space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Link your personal LeetCode username to display your programming achievements, daily activity tracks and metrics on the dashboard.
                  </p>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      LeetCode Username
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={usernameInput}
                        onChange={e => setUsernameInput(e.target.value)}
                        placeholder="e.g. leetcode_user12"
                        className="flex-1 bg-background border border-border rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-primary text-foreground"
                      />
                      <Button type="submit" isLoading={syncing}>
                        Link & Verify
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Full Name</p>
                  <p className="font-semibold text-foreground text-sm mt-0.5">{user?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Designation</p>
                  <p className="font-semibold text-foreground text-sm mt-0.5">{user?.designation || 'Lecturer / Assistant Professor'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email Address</p>
                  <p className="font-semibold text-foreground text-sm mt-0.5">{user?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department Office</p>
                  <p className="font-semibold text-foreground text-sm mt-0.5">Admin Wing, Block-A</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
