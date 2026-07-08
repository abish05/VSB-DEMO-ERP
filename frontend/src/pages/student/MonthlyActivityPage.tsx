import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { leetcodeService } from '@/services/leetcode.service'
import type { DailyActivity, LeetCodeProfile } from '@/types'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { RefreshCw, Code2, Flame, TrendingUp, CalendarDays, CheckCircle2 } from 'lucide-react'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function MonthlyActivityPage() {
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
        leetcodeService.getDailyActivity(user.id, 30),
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

  // Build last 30 days chart data grouped by week
  const chartData = useMemo(() => {
    return activity.slice(-30).map(a => ({
      date: a.date ? new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—',
      solved: a.solved ?? 0,
      easy: a.easy ?? 0,
      medium: a.medium ?? 0,
      hard: a.hard ?? 0,
    }))
  }, [activity])

  // Weekly summaries for the month
  const weeklyBreakdown = useMemo(() => {
    const weeks: { week: string; solved: number; easy: number; medium: number; hard: number }[] = []
    for (let w = 0; w < 4; w++) {
      const chunk = chartData.slice(w * 7, (w + 1) * 7)
      weeks.push({
        week: `Week ${w + 1}`,
        solved: chunk.reduce((s, d) => s + d.solved, 0),
        easy: chunk.reduce((s, d) => s + d.easy, 0),
        medium: chunk.reduce((s, d) => s + d.medium, 0),
        hard: chunk.reduce((s, d) => s + d.hard, 0),
      })
    }
    return weeks
  }, [chartData])

  const monthlyTotal = chartData.reduce((s, d) => s + d.solved, 0)
  const activeDays = chartData.filter(d => d.solved > 0).length
  const avgPerDay = activeDays > 0 ? (monthlyTotal / activeDays).toFixed(1) : '0'
  const now = new Date()

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
          <h1 className="text-2xl font-bold">Monthly Activity</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {MONTH_NAMES[now.getMonth()]} {now.getFullYear()} · <span className="font-mono text-foreground">{profile?.username || 'Not linked'}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start" onClick={handleSync} isLoading={syncing}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Total', value: monthlyTotal, icon: <Code2 className="w-5 h-5"/>, color: 'bg-primary/10 text-primary', sub: 'Problems this month' },
          { label: 'Active Days', value: activeDays, icon: <CalendarDays className="w-5 h-5"/>, color: 'bg-indigo-500/10 text-indigo-400', sub: 'Days with submissions' },
          { label: 'Avg / Active Day', value: avgPerDay, icon: <TrendingUp className="w-5 h-5"/>, color: 'bg-success/10 text-success', sub: 'Daily average' },
          { label: 'Streak', value: `${profile?.currentStreak ?? 0} days`, icon: <Flame className="w-5 h-5"/>, color: 'bg-warning/10 text-warning', sub: `Best: ${profile?.longestStreak ?? 0}d` },
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

      {/* Area Chart */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> 30-Day Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F5B301" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F5B301" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={9} interval={4} />
                <YAxis stroke="#94A3B8" fontSize={9} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8 }} />
                <Area dataKey="solved" stroke="#F5B301" fill="url(#monthGrad)" strokeWidth={2} name="Solved" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly breakdown table */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Weekly Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Period</th>
                    <th className="px-4 py-3 font-semibold text-success">Easy</th>
                    <th className="px-4 py-3 font-semibold text-warning">Medium</th>
                    <th className="px-4 py-3 font-semibold text-error">Hard</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Total</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {weeklyBreakdown.map(w => (
                    <tr key={w.week} className="hover:bg-muted/10">
                      <td className="px-4 py-2.5 font-semibold text-foreground">{w.week}</td>
                      <td className="px-4 py-2.5 text-success font-semibold">{w.easy}</td>
                      <td className="px-4 py-2.5 text-warning font-semibold">{w.medium}</td>
                      <td className="px-4 py-2.5 text-error font-semibold">{w.hard}</td>
                      <td className="px-4 py-2.5 font-bold text-foreground">{w.solved}</td>
                      <td className="px-4 py-2.5">
                        {w.solved >= 10
                          ? <Badge variant="success" className="text-[9px]">Excellent</Badge>
                          : w.solved >= 5
                          ? <Badge variant="default" className="text-[9px]">Good</Badge>
                          : w.solved > 0
                          ? <Badge variant="warning" className="text-[9px]">Low</Badge>
                          : <Badge variant="secondary" className="text-[9px]">Inactive</Badge>
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
