// Faculty Weekly Activity — students' weekly performance summary
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { leetcodeService } from '@/services/leetcode.service'
import type { UserProfile } from '@/types'
import { RefreshCw, Users, TrendingUp, Code2, BarChart3 } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

export default function FacultyWeeklyActivityPage() {
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setStudents(await leetcodeService.getMyStudents()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const withProfile = useMemo(() => students.filter(s => s.leetcodeProfile), [students])
  const totalWeekly = withProfile.reduce((s, u) => s + (u.leetcodeProfile?.weeklySolvedCount ?? 0), 0)
  const activeWeek = withProfile.filter(s => (s.leetcodeProfile?.weeklySolvedCount ?? 0) > 0).length

  const chartData = useMemo(() =>
    [...withProfile]
      .sort((a, b) => (b.leetcodeProfile?.weeklySolvedCount ?? 0) - (a.leetcodeProfile?.weeklySolvedCount ?? 0))
      .slice(0, 10)
      .map(s => ({ name: s.name.split(' ')[0], weekly: s.leetcodeProfile?.weeklySolvedCount ?? 0 }))
  , [withProfile])

  const filtered = useMemo(() =>
    [...withProfile]
      .filter(s => search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || (s.rollNo || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b.leetcodeProfile?.weeklySolvedCount ?? 0) - (a.leetcodeProfile?.weeklySolvedCount ?? 0))
  , [withProfile, search])

  if (loading) return <div className="space-y-6 animate-pulse">{Array.from({length:2}).map((_,i)=><div key={i} className="h-40 rounded-xl bg-muted/20"/>)}</div>

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={iv} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Weekly Activity</h1>
          <p className="text-muted-foreground text-sm mt-1">Student performance this week</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={load} isLoading={loading}><RefreshCw className="w-3.5 h-3.5" /> Refresh</Button>
      </motion.div>

      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total This Week', value: totalWeekly, icon: <Code2 className="w-5 h-5"/>, color: 'bg-primary/10 text-primary', sub: 'Problems solved' },
          { label: 'Active Students', value: activeWeek, icon: <Users className="w-5 h-5"/>, color: 'bg-success/10 text-success', sub: 'Solved at least 1' },
          { label: 'Avg / Student', value: withProfile.length ? (totalWeekly / withProfile.length).toFixed(1) : '0', icon: <TrendingUp className="w-5 h-5"/>, color: 'bg-warning/10 text-warning', sub: 'Weekly average' },
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

      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary"/> Top 10 — Weekly Solved</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8 }} />
                <Bar dataKey="weekly" fill="#22C55E" radius={[4,4,0,0]} name="Weekly" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm">Weekly Summary Table</CardTitle>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-36 h-8 px-3 rounded-lg border border-border bg-background text-xs focus:outline-none focus:border-primary text-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 font-semibold text-muted-foreground">#</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Student</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Roll No</th>
                    <th className="px-4 py-3 font-semibold text-primary">This Week</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Total</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Streak</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((s, i) => {
                    const lp = s.leetcodeProfile!
                    return (
                      <tr key={s.id} className="hover:bg-muted/10">
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">#{i+1}</td>
                        <td className="px-4 py-2.5 font-semibold text-foreground">{s.name}</td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{s.rollNo || '—'}</td>
                        <td className="px-4 py-2.5 font-bold text-primary">{lp.weeklySolvedCount ?? 0}</td>
                        <td className="px-4 py-2.5">{lp.totalSolved}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{lp.currentStreak}d</td>
                        <td className="px-4 py-2.5">
                          {(lp.weeklySolvedCount ?? 0) > 0
                            ? <Badge variant="success" className="text-[9px]">Active</Badge>
                            : <Badge variant="secondary" className="text-[9px]">Inactive</Badge>}
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No students found</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
