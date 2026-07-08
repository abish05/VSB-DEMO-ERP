import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SolvedAreaChart, RatingLineChart, DifficultyPieChart } from '@/components/charts/Charts'
import { DataTable } from '@/components/tables/DataTable'
import { useAuth } from '@/hooks/useAuth'
import { leetcodeService } from '@/services/leetcode.service'
import type { ContestHistory, LeetCodeProfile, UserProfile } from '@/types'
import { Activity, Bell, RefreshCw, TrendingUp, Trophy, Users } from 'lucide-react'

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}
const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }

function calendarToWeeklyData(calendar: unknown) {
  const parsed = typeof calendar === 'string' ? JSON.parse(calendar || '{}') : calendar
  const heatmap = Object.entries((parsed || {}) as Record<string, number>).reduce<Record<string, number>>((acc, [timestamp, count]) => {
    const date = new Date(Number(timestamp) * 1000)
    if (!Number.isNaN(date.getTime())) acc[date.toISOString().split('T')[0]] = count
    return acc
  }, {})

  const today = new Date()
  return Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (6 - index))
    const key = date.toISOString().split('T')[0]
    return {
      day: date.toLocaleDateString(undefined, { weekday: 'short' }),
      solved: heatmap[key] || 0,
    }
  })
}

export default function FacultyDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<LeetCodeProfile | null>(user?.leetcodeProfile || null)
  const [contests, setContests] = useState<ContestHistory[]>([])
  const [students, setStudents] = useState<UserProfile[]>([])
  const [syncing, setSyncing] = useState(false)
  const [message, setMessage] = useState('')

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return
    const [nextProfile, nextContests, nextStudents] = await Promise.all([
      leetcodeService.getProfile(user.id).catch(() => null),
      leetcodeService.getContestHistory(user.id).catch(() => []),
      leetcodeService.getMyStudents().catch(() => []),
    ])
    setProfile(nextProfile)
    setContests(nextContests)
    setStudents(nextStudents)
  }, [user?.id])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const weeklyActivity = useMemo(() => calendarToWeeklyData(profile?.submissionCalendar), [profile?.submissionCalendar])
  const ratingHistory = contests
    .slice()
    .reverse()
    .slice(-8)
    .map((contest) => ({ contest: contest.contestTitle, rating: contest.rating }))

  const pieData = [
    { name: 'Easy', value: profile?.easySolved || 0, color: '#22C55E' },
    { name: 'Medium', value: profile?.mediumSolved || 0, color: '#F59E0B' },
    { name: 'Hard', value: profile?.hardSolved || 0, color: '#EF4444' },
  ]

  const studentRows = students.map((student) => ({
    id: student.id,
    rollNo: student.rollNo || '-',
    name: student.name,
    solved: student.leetcodeProfile?.totalSolved || 0,
    streak: student.leetcodeProfile?.currentStreak || 0,
    rating: Math.round(student.leetcodeProfile?.contestRating || 0),
    status: student.leetcodeProfile?.lastSyncedAt ? 'SYNCED' : 'PENDING',
  }))

  const activeStudents = studentRows.filter((student) => student.status === 'SYNCED').length
  const totalSolvedByStudents = studentRows.reduce((total, student) => total + student.solved, 0)
  const topPerformer = studentRows.slice().sort((a, b) => b.solved - a.solved)[0]
  const overviewStats = [
    { label: 'Total Students', value: String(students.length), sub: 'Assigned students', icon: <Users className="w-5 h-5" />, color: 'bg-primary/10 text-primary' },
    { label: 'Active Students', value: String(activeStudents), sub: 'Synced LeetCode profiles', icon: <Activity className="w-5 h-5" />, color: 'bg-success/10 text-success' },
    { label: 'Daily Activity Summary', value: String(totalSolvedByStudents), sub: 'Total solved by assigned students', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-warning/10 text-warning' },
    { label: 'Top Performers', value: topPerformer?.name || 'No data', sub: topPerformer ? `${topPerformer.solved} solved` : 'Awaiting submissions', icon: <Trophy className="w-5 h-5" />, color: 'bg-error/10 text-error' },
    { label: 'Recent Notifications', value: '0', sub: 'No unread alerts', icon: <Bell className="w-5 h-5" />, color: 'bg-primary/10 text-primary' },
  ]

  const handleSync = async () => {
    if (!user?.id || !profile) return
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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Faculty Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            LeetCode: <span className="font-mono font-medium text-foreground">{profile?.username || 'Not linked'}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Last sync: {profile?.lastSyncedAt ? new Date(profile.lastSyncedAt).toLocaleString() : 'Not synced yet'}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleSync} isLoading={syncing} disabled={!profile}>
          <RefreshCw className="w-4 h-4" /> Sync LeetCode
        </Button>
      </motion.div>

      {message && <div className="text-sm bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">{message}</div>}

      <motion.div variants={itemVariants}>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Dashboard Overview</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {overviewStats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
              </div>
              <p className="text-2xl font-bold truncate">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Problem Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DifficultyPieChart data={pieData} height={200} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> This Week's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SolvedAreaChart data={weeklyActivity} xKey="day" yKey="solved" color="#22C55E" height={200} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-warning" /> Contest Rating Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RatingLineChart data={ratingHistory} xKey="contest" lines={[{ key: 'rating', color: '#F59E0B', label: 'Rating' }]} height={200} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" /> My Students
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">{studentRows.filter((s) => s.status === 'SYNCED').length} Synced</Badge>
                <Badge variant="warning">{studentRows.filter((s) => s.status === 'PENDING').length} Pending</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={studentRows}
              columns={[
                { key: 'rollNo', label: 'Roll No' },
                { key: 'name', label: 'Name', sortable: true },
                { key: 'solved', label: 'Solved', sortable: true },
                { key: 'streak', label: 'Streak', sortable: true, render: (row) => <span>{row.streak as number} days</span> },
                { key: 'rating', label: 'Rating', sortable: true },
                { key: 'status', label: 'Status', render: (row) => <Badge variant={row.status === 'SYNCED' ? 'success' : 'warning'}>{row.status as string}</Badge> },
              ]}
              exportFilename="my-students"
              pageSize={8}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
