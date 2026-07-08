import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { leetcodeService } from '@/services/leetcode.service'
import type { UserProfile } from '@/types'
import { RefreshCw, Code2, TrendingUp, Users, BarChart3, Download, Calendar } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import * as XLSX from 'xlsx'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function MonthlyReportPage() {
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setStudents(await leetcodeService.getMyStudents()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const now = new Date()

  const stats = useMemo(() => {
    const withProfile = students.filter(s => s.leetcodeProfile)
    const totalMonthly = withProfile.reduce((sum, s) => sum + (s.leetcodeProfile?.monthlySolvedCount ?? 0), 0)
    const activeCount = withProfile.filter(s => (s.leetcodeProfile?.monthlySolvedCount ?? 0) > 0).length
    const avgMonthly = withProfile.length ? (totalMonthly / withProfile.length).toFixed(1) : '0'
    const topStudent = [...withProfile].sort((a, b) => (b.leetcodeProfile?.monthlySolvedCount ?? 0) - (a.leetcodeProfile?.monthlySolvedCount ?? 0))[0]
    return { totalMonthly, activeCount, avgMonthly, topStudent }
  }, [students])

  const chartData = useMemo(() =>
    [...students]
      .filter(s => s.leetcodeProfile)
      .sort((a, b) => (b.leetcodeProfile?.monthlySolvedCount ?? 0) - (a.leetcodeProfile?.monthlySolvedCount ?? 0))
      .slice(0, 10)
      .map(s => ({ name: s.name.split(' ')[0], solved: s.leetcodeProfile?.monthlySolvedCount ?? 0 }))
  , [students])

  const filtered = useMemo(() =>
    [...students]
      .filter(s => search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || (s.rollNo || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b.leetcodeProfile?.monthlySolvedCount ?? 0) - (a.leetcodeProfile?.monthlySolvedCount ?? 0))
  , [students, search])

  const exportXLSX = () => {
    const rows = filtered.map((s, i) => ({
      Rank: i + 1, Name: s.name, 'Roll No': s.rollNo || '—',
      'Monthly Solved': s.leetcodeProfile?.monthlySolvedCount ?? 0,
      'Total Solved': s.leetcodeProfile?.totalSolved ?? 0,
      'Contest Rating': Math.round(s.leetcodeProfile?.contestRating ?? 0),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report')
    XLSX.writeFile(wb, `monthly_report_${new Date().toISOString().slice(0, 7)}.xlsx`)
  }

  if (loading) return <div className="space-y-6 animate-pulse">{Array.from({length:3}).map((_,i)=><div key={i} className="h-40 rounded-xl bg-muted/20"/>)}</div>

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={iv} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Monthly Performance Report</h1>
          <p className="text-muted-foreground text-sm mt-1">{MONTHS[now.getMonth()]} {now.getFullYear()} · {students.length} students</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={exportXLSX}><Download className="w-3.5 h-3.5" /> Export</Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={load} isLoading={loading}><RefreshCw className="w-3.5 h-3.5" /> Refresh</Button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Total', value: stats.totalMonthly, icon: <Code2 className="w-5 h-5"/>, color: 'bg-primary/10 text-primary', sub: 'All students combined' },
          { label: 'Active Students', value: `${stats.activeCount} / ${students.filter(s=>s.leetcodeProfile).length}`, icon: <Users className="w-5 h-5"/>, color: 'bg-success/10 text-success', sub: 'Solved this month' },
          { label: 'Avg / Student', value: stats.avgMonthly, icon: <TrendingUp className="w-5 h-5"/>, color: 'bg-warning/10 text-warning', sub: 'Monthly average' },
          { label: 'Top Performer', value: stats.topStudent?.name.split(' ')[0] || '—', icon: <Calendar className="w-5 h-5"/>, color: 'bg-indigo-500/10 text-indigo-400', sub: `${stats.topStudent?.leetcodeProfile?.monthlySolvedCount ?? 0} solved` },
        ].map(c => (
          <div key={c.label} className="stat-card flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.color}`}>{c.icon}</div>
            </div>
            <p className="text-2xl font-bold truncate">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary"/> Top 10 Students — Monthly Solved</CardTitle></CardHeader>
          <CardContent className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8 }} />
                <Bar dataKey="solved" fill="#6366F1" radius={[4,4,0,0]} name="Monthly Solved" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm">Monthly Performance Table</CardTitle>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-40 h-8 px-3 rounded-lg border border-border bg-background text-xs focus:outline-none focus:border-primary text-foreground"
            />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Rank</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Student</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Roll No</th>
                    <th className="px-4 py-3 font-semibold text-primary">This Month</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Total Solved</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Rating</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((s, i) => {
                    const lp = s.leetcodeProfile
                    const monthly = lp?.monthlySolvedCount ?? 0
                    return (
                      <tr key={s.id} className="hover:bg-muted/10">
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">#{i+1}</td>
                        <td className="px-4 py-2.5 font-semibold text-foreground">{s.name}</td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{s.rollNo || '—'}</td>
                        <td className="px-4 py-2.5 font-bold text-indigo-400">{monthly}</td>
                        <td className="px-4 py-2.5 text-foreground">{lp?.totalSolved ?? 0}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{Math.round(lp?.contestRating ?? 0)}</td>
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
