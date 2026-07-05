import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'
import { leetcodeService } from '@/services/leetcode.service'
import type { LeetCodeProfile, SyncLog } from '@/types'
import { CheckCircle, Code2, RefreshCw } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

function formatDateTime(value?: string) {
  return value ? new Date(value).toLocaleString() : 'Not synced yet'
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<LeetCodeProfile | null>(user?.leetcodeProfile || null)
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState('')

  const loadProfile = useCallback(async () => {
    if (!user?.id) return
    const [nextProfile, nextLogs] = await Promise.all([
      leetcodeService.getProfile(user.id).catch(() => null),
      leetcodeService.getSyncLogs(user.id).catch(() => []),
    ])
    setProfile(nextProfile)
    setLogs(nextLogs)
  }, [user?.id])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleSync = async () => {
    if (!user?.id || !profile) return
    setSyncing(true)
    setMessage('')
    try {
      const result = await leetcodeService.syncNow(user.id)
      setMessage(result.message)
      await loadProfile()
    } catch {
      setMessage('Sync failed. Last successful data is still shown.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6 max-w-2xl">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and LeetCode synchronization</p>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar fallback={getInitials(user?.name || 'U')} size="xl" src={user?.avatar} />
              <div className="flex-1">
                <h2 className="text-lg font-semibold">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge variant="success" className="mt-1">{user?.role}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Code2 className="w-4 h-4 text-primary" /> LeetCode Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile ? (
              <div className="flex items-center gap-3 p-4 bg-success/5 border border-success/20 rounded-xl">
                <CheckCircle className="w-5 h-5 text-success shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Connected as <span className="font-mono text-primary">@{profile.username}</span></p>
                  <p className="text-xs text-muted-foreground mt-0.5">Last synced: {formatDateTime(profile.lastSyncedAt)}</p>
                </div>
                <Button variant="ghost" size="sm" className="gap-2" onClick={handleSync} isLoading={syncing}>
                  <RefreshCw className="w-3.5 h-3.5" /> Sync
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 border border-dashed border-border rounded-xl text-center">
                <Code2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">No LeetCode account connected</p>
                <p className="text-xs text-muted-foreground mt-1">A valid LeetCode username is required during registration.</p>
              </div>
            )}

            {message && <div className="text-sm bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">{message}</div>}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Account Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Email', value: user?.email },
              { label: 'Department', value: user?.department?.name || '-' },
              { label: 'Register Number', value: user?.rollNo || '-' },
              { label: 'Role', value: user?.role },
              { label: 'Latest Sync Status', value: logs[0]?.status || 'No sync yet' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
