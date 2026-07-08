import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { leetcodeService } from '@/services/leetcode.service'
import type { DailyActivity, LeetCodeProfile } from '@/types'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts'
import { RefreshCw, Zap, TrendingUp, Code2, Flame, CheckCircle2 } from 'lucide-react'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getLast7Days() {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

export default function WeeklyActivityPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<LeetCodeProfile | null>(null)
  const [activity, setActivity] = useState<DailyActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const loadData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [prof, acts] = await Promise.all([
        leetcodeService.getProfile(user.id),
        leetcodeService.getDailyActivity(user.id, 7),
      ])
      setProfile(prof)
      setActivity(acts)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { void loadData() }, [loadData])

  const handleSync = async () => {
    if (!user?.id) return
    setSyncing(true)
    try { await leetcodeService.syncNow(user.id); await loadData() } catch { /* noop */ } finally { setSyncing(false) }
  }

  // Build chart data for last 7 days
  const chartData = useMemo(() => {
    const last7 = getLast7Days()
    return last7.map(dateKey => {
      const rec = activity.find(a => a.date?.startsWith(dateKey))
      const dayName = DAYS[new Date(dateKey).getDay()]
      return {
        day: dayName,
        date: dateKey,
        solved: rec?.solved ?? 0,
        easy: rec?.easy ?? 0,
        medium: rec?.medium ?? 0,
        hard: rec?.hard ?? 0,
      }
    })
  }, [activity])

  const weeklyTotal = chartData.reduce((s, d) => s + d.solved, 0)
  const weeklyEasy = chartData.reduce((s, d) => s + d.easy, 0)
  const weeklyMedium = chartData.reduce((s, d) => s + d.medium, 0)
  const weeklyHard = chartData.reduce((s, d) => s + d.hard, 0)
  const bestDay = chartData.reduce((best, d) => d.solved > best.solved ? d : best, chartData[0] || { day: '—', solved: 0 })

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 bg-muted/30 rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-28 rounded-xl bg-muted/20"/>)}</div>
      <div className="h-72 rounded-xl bg-muted/20" />
    </div>
  )

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={iv} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Weekly Activity</h1>
          <p className="text-muted-foreground text-sm mt-1">Last 7 days coding performance · <span className="font-mono text-foreground">{profile?.username || 'Not linked'}</span></p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start" onClick={handleSync} isLoading={syncing}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total This Week', value: weeklyTotal, icon: <Code2 className="w-5 h-5"/>, color: 'bg-primary/10 text-primary', sub: 'Problems solved' },
          { label: 'Best Day', value: `${bestDay.solved} (${bestDay.day})`, icon: <Zap className="w-5 h-5"/>, color: 'bg-warning/10 text-warning', sub: 'Most active day' },
          { label: 'Current Streak', value: `${profile?.currentStreak ?? 0} days`, icon: <Flame className="w-5 h-5"/>, color: 'bg-error/10 text-error', sub: 'Active streak' },
          { label: 'Weekly Solved', value: profile?.weeklySolvedCount ?? weeklyTotal, icon: <TrendingUp className="w-5 h-5"/>, color: 'bg-success/10 text-success', sub: 'From LeetCode sync' },
        ].map(c => (
          <div key={c.label} className="stat-card flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.color}`}>{c.icon}</div>
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* Bar Chart */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Daily Problems Solved — Past 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8 }} />
                <Bar dataKey="easy" stackId="a" fill="#22C55E" radius={[0,0,0,0]} name="Easy" />
                <Bar dataKey="medium" stackId="a" fill="#F59E0B" name="Medium" />
                <Bar dataKey="hard" stackId="a" fill="#EF4444" radius={[4,4,0,0]} name="Hard" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Difficulty Breakdown + Daily Table */}
      <motion.div variants={iv} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Easy', value: weeklyEasy, color: 'text-success', bg: 'bg-success/10' },
          { label: 'Medium', value: weeklyMedium, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'Hard', value: weeklyHard, color: 'text-error', bg: 'bg-error/10' },
        ].map(d => (
          <Card key={d.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${d.bg} flex items-center justify-center`}>
                <span className={`text-lg font-extrabold ${d.color}`}>{d.label[0]}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{d.label}</p>
                <p className={`text-3xl font-extrabold ${d.color}`}>{d.value}</p>
                <p className="text-xs text-muted-foreground">this week</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Daily breakdown table */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Daily Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Day</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Date</th>
                    <th className="px-4 py-3 font-semibold text-success">Easy</th>
                    <th className="px-4 py-3 font-semibold text-warning">Medium</th>
                    <th className="px-4 py-3 font-semibold text-error">Hard</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Total</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {chartData.map(row => (
                    <tr key={row.date} className="hover:bg-muted/10">
                      <td className="px-4 py-2.5 font-semibold text-foreground">{row.day}</td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">{row.date}</td>
                      <td className="px-4 py-2.5 text-success font-semibold">{row.easy}</td>
                      <td className="px-4 py-2.5 text-warning font-semibold">{row.medium}</td>
                      <td className="px-4 py-2.5 text-error font-semibold">{row.hard}</td>
                      <td className="px-4 py-2.5 font-bold text-foreground">{row.solved}</td>
                      <td className="px-4 py-2.5">
                        {row.solved > 0
                          ? <Badge variant="success" className="text-[9px]"><CheckCircle2 className="w-3 h-3 mr-1"/>Active</Badge>
                          : <Badge variant="secondary" className="text-[9px]">No Activity</Badge>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
