import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SolvedAreaChart, RatingLineChart, DifficultyPieChart } from '@/components/charts/Charts'
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar'
import { useAuth } from '@/hooks/useAuth'
import { leetcodeService } from '@/services/leetcode.service'
import type { ContestHistory, LeetCodeProfile, SyncLog } from '@/types'
import {
  Clock,
  Code2,
  Flame,
  RefreshCw,
  Star,
  Trophy,
  TrendingUp,
} from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

function calendarToHeatmap(calendar: unknown): Record<string, number> {
  const parsed = typeof calendar === 'string' ? JSON.parse(calendar || '{}') : calendar
  const entries = Object.entries((parsed || {}) as Record<string, number>)

  return entries.reduce<Record<string, number>>((acc, [timestamp, count]) => {
    const date = new Date(Number(timestamp) * 1000)
    if (!Number.isNaN(date.getTime())) {
      acc[date.toISOString().split('T')[0]] = count
    }
    return acc
  }, {})
}

function formatSyncTime(value?: string) {
  return value ? new Date(value).toLocaleString() : 'Not synced yet'
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<LeetCodeProfile | null>(user?.leetcodeProfile || null)
  const [contests, setContests] = useState<ContestHistory[]>([])
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState('')

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [nextProfile, nextContests, nextLogs] = await Promise.all([
        leetcodeService.getProfile(user.id),
        leetcodeService.getContestHistory(user.id),
        leetcodeService.getSyncLogs(user.id),
      ])
      setProfile(nextProfile)
      setContests(nextContests)
      setSyncLogs(nextLogs)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const heatmapData = useMemo(() => calendarToHeatmap(profile?.submissionCalendar), [profile?.submissionCalendar])

  const weeklyData = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - index))
      const key = date.toISOString().split('T')[0]
      return {
        day: date.toLocaleDateString(undefined, { weekday: 'short' }),
        solved: heatmapData[key] || 0,
      }
    })
  }, [heatmapData])

  const ratingHistory = contests
    .slice()
    .reverse()
    .slice(-8)
    .map((contest) => ({
      contest: contest.contestTitle,
      rating: contest.rating,
    }))

  const pieData = [
    { name: 'Easy', value: profile?.easySolved || 0, color: '#22C55E' },
    { name: 'Medium', value: profile?.mediumSolved || 0, color: '#F59E0B' },
    { name: 'Hard', value: profile?.hardSolved || 0, color: '#EF4444' },
  ]

  const stats = [
    { label: 'Total Solved', value: String(profile?.totalSolved || 0), sub: 'Synced from LeetCode', icon: <Code2 className="w-5 h-5" />, color: 'bg-primary/10 text-primary' },
    { label: 'Current Streak', value: `${profile?.currentStreak || 0} days`, sub: 'Calculated from submissions', icon: <Flame className="w-5 h-5" />, color: 'bg-warning/10 text-warning' },
    { label: 'Contest Rating', value: String(Math.round(profile?.contestRating || 0)), sub: 'Latest contest rating', icon: <Trophy className="w-5 h-5" />, color: 'bg-success/10 text-success' },
    { label: 'Recent Activity', value: String(profile?.recentSubmissions?.length || 0), sub: 'Recent synced submissions', icon: <Clock className="w-5 h-5" />, color: 'bg-primary/10 text-primary' },
    { label: 'Leaderboard Position', value: profile?.globalRank ? `#${profile.globalRank}` : 'Unranked', sub: 'Current rank snapshot', icon: <Star className="w-5 h-5" />, color: 'bg-error/10 text-error' },
  ]

  const handleSync = async () => {
    if (!user?.id) return
    setSyncing(true)
    setMessage('')
    try {
      const result = await leetcodeService.syncNow(user.id)
      setMessage(result.message)
      await loadDashboard()
    } catch {
      setMessage('Sync failed. Last successful data is still shown.')
    } finally {
      setSyncing(false)
    }
  }

  const latestLog = syncLogs[0]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            LeetCode: <span className="font-mono font-medium text-foreground">{profile?.username || 'Not linked'}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">Last sync: {formatSyncTime(profile?.lastSyncedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          {latestLog && <Badge variant={latestLog.status === 'SUCCESS' ? 'success' : 'error'}>{latestLog.status}</Badge>}
          <Button variant="outline" size="sm" className="gap-2" onClick={handleSync} isLoading={syncing} disabled={!profile || loading}>
            <RefreshCw className="w-4 h-4" /> Sync Now
          </Button>
        </div>
      </motion.div>

      {message && <div className="text-sm bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">{message}</div>}

      <motion.div variants={itemVariants}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dashboard Overview</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
            </div>
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Weekly Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SolvedAreaChart data={weeklyData} xKey="day" yKey="solved" color="#2563EB" height={220} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Problem Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <DifficultyPieChart data={pieData} height={180} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Submission Calendar</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <HeatmapCalendar data={heatmapData} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-warning" /> Contest Rating History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RatingLineChart
              data={ratingHistory}
              xKey="contest"
              lines={[{ key: 'rating', color: '#F59E0B', label: 'Rating' }]}
              height={200}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Recent Submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(profile?.recentSubmissions || []).slice(0, 5).map((submission) => (
              <div key={`${submission.titleSlug}-${submission.timestamp}`} className="flex items-start justify-between gap-3 border-b border-border last:border-0 pb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{submission.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{submission.lang}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant={submission.statusDisplay === 'Accepted' ? 'success' : 'error'}>{submission.statusDisplay}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{formatSyncTime(new Date(Number(submission.timestamp) * 1000).toISOString())}</p>
                </div>
              </div>
            ))}
            {!profile?.recentSubmissions?.length && <p className="text-sm text-muted-foreground">No recent submissions synced yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sync History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {syncLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between border-b border-border last:border-0 pb-2">
                <div>
                  <Badge variant={log.status === 'SUCCESS' ? 'success' : 'error'}>{log.status}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{log.message || 'No details'}</p>
                </div>
                <p className="text-xs text-muted-foreground">{formatSyncTime(log.syncedAt)}</p>
              </div>
            ))}
            {syncLogs.length === 0 && <p className="text-sm text-muted-foreground">No sync history yet.</p>}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
