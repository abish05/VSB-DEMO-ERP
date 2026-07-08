// Faculty Monthly Activity Page
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { leetcodeService } from '@/services/leetcode.service'
import type { UserProfile } from '@/types'
import { RefreshCw, Users, Code2, TrendingUp, BarChart3 } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function FacultyMonthlyActivityPage() {
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setStudents(await leetcodeService.getMyStudents()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const withProfile = useMemo(() => students.filter(s => s.leetcodeProfile), [students])
  const totalMonthly = withProfile.reduce((s, u) => s + (u.leetcodeProfile?.monthlySolvedCount ?? 0), 0)
  const activeMonth = withProfile.filter(s => (s.leetcodeProfile?.monthlySolvedCount ?? 0) > 0).length
  const now = new Date()

  const chartData = useMemo(() =>
    [...withProfile]
      .sort((a, b) => (b.leetcodeProfile?.monthlySolvedCount ?? 0) - (a.leetcodeProfile?.monthlySolvedCount ?? 0))
      .slice(0, 10)
      .map(s => ({ name: s.name.split(' ')[0], monthly: s.leetcodeProfile?.monthlySolvedCount ?? 0 }))
  , [withProfile])

  const filtered = useMemo(() =>
    [...withProfile]
      .filter(s => search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || (s.rollNo || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b.leetcodeProfile?.monthlySolvedCount ?? 0) - (a.leetcodeProfile?.monthlySolvedCount ?? 0))
  , [withProfile, search])

  if (loading) return <div className="space-y-6 animate-pulse">{Array.from({length:2}).map((_,i)=><div key={i} className="h-40 rounded-xl bg-muted/20"/>)}</div>

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={iv} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Monthly Activity</h1>
          <p className="text-muted-foreground text-sm mt-1">{MONTHS[now.getMonth()]} {now.getFullYear()} — Monthly student performance</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={load} isLoading={loading}><RefreshCw className="w-3.5 h-3.5" /> Refresh</Button>
      </motion.div>

      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Monthly Total', value: totalMonthly, icon: <Code2 className="w-5 h-5"/>, color: 'bg-primary/10 text-primary', sub: 'All students combined' },
          { label: 'Active Students', value: activeMonth, icon: <Users className="w-5 h-5"/>, color: 'bg-success/10 text-success', sub: `of ${withProfile.length} with profile` },
          { label: 'Avg / Student', value: withProfile.length ? (totalMonthly / withProfile.length).toFixed(1) : '0', icon: <TrendingUp className="w-5 h-5"/>, color: 'bg-warning/10 text-warning', sub: 'Monthly average' },
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
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary"/> Top 10 — Monthly Solved</CardTitle></CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8 }} />
                <Bar dataKey="monthly" fill="#6366F1" radius={[4,4,0,0]} name="Monthly" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm">Monthly Summary Table</CardTitle>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-36 h-8 px-3 rounded-lg border border-border bg-background text-xs focus:outline-none focus:border-primary text-foreground" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 font-semibold text-muted-foreground">#</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Student</th>
                    <th className="px-4 py-3 font-semibold text-indigo-400">This Month</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Total</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Rating</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((s, i) => {
                    const lp = s.leetcodeProfile!
                    const monthly = lp.monthlySolvedCount ?? 0
                    return (
                      <tr key={s.id} className="hover:bg-muted/10">
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">#{i+1}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-semibold text-foreground">{s.name}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{s.rollNo || '—'}</p>
                        </td>
                        <td className="px-4 py-2.5 font-bold text-indigo-400">{monthly}</td>
                        <td className="px-4 py-2.5">{lp.totalSolved}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{Math.round(lp.contestRating)}</td>
                        <td className="px-4 py-2.5">
                          {monthly >= 30 ? <Badge variant="success" className="text-[9px]">Excellent</Badge>
                            : monthly >= 15 ? <Badge variant="default" className="text-[9px]">Good</Badge>
                            : monthly > 0 ? <Badge variant="warning" className="text-[9px]">Low</Badge>
                            : <Badge variant="secondary" className="text-[9px]">Inactive</Badge>
                          }
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No students found</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
