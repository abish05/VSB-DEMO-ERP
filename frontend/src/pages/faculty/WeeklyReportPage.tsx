import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { leetcodeService } from '@/services/leetcode.service'
import type { UserProfile } from '@/types'
import { RefreshCw, Download, FileSpreadsheet, FileText, Search, UserCheck, AlertTriangle } from 'lucide-react'
import * as XLSX from 'xlsx'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

export default function FacultyReportsPage() {
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setStudents(await leetcodeService.getMyStudents())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() =>
    students.filter(s =>
      search === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.rollNo || '').toLowerCase().includes(search.toLowerCase())
    )
  , [students, search])

  const stats = useMemo(() => {
    const total = students.length
    const linked = students.filter(s => s.leetcodeProfile).length
    const activeThisWeek = students.filter(s => (s.leetcodeProfile?.weeklySolvedCount ?? 0) > 0).length
    const activeThisMonth = students.filter(s => (s.leetcodeProfile?.monthlySolvedCount ?? 0) > 0).length
    return { total, linked, activeThisWeek, activeThisMonth }
  }, [students])

  const exportAllToExcel = () => {
    const rows = filtered.map((s, idx) => ({
      'S.No': idx + 1,
      Name: s.name,
      'Roll Number': s.rollNo || 'N/A',
      Email: s.email,
      'LeetCode Username': s.leetcodeProfile?.username || 'Not Linked',
      'Total Solved': s.leetcodeProfile?.totalSolved ?? 0,
      'Easy Solved': s.leetcodeProfile?.easySolved ?? 0,
      'Medium Solved': s.leetcodeProfile?.mediumSolved ?? 0,
      'Hard Solved': s.leetcodeProfile?.hardSolved ?? 0,
      'Contest Rating': Math.round(s.leetcodeProfile?.contestRating ?? 0),
      'Streak (Days)': s.leetcodeProfile?.currentStreak ?? 0,
      'Weekly Solved': s.leetcodeProfile?.weeklySolvedCount ?? 0,
      'Monthly Solved': s.leetcodeProfile?.monthlySolvedCount ?? 0,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Student Performance Report')
    XLSX.writeFile(wb, `student_performance_report_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-muted/30 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/20" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-muted/20" />
      </div>
    )
  }

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={iv} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Student Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Generate and export student LeetCode metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" className="gap-2" onClick={exportAllToExcel}>
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={load} isLoading={loading}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats.total, icon: <UserCheck className="w-5 h-5" />, color: 'bg-primary/10 text-primary', sub: 'Assigned to section' },
          { label: 'Linked Accounts', value: stats.linked, icon: <FileText className="w-5 h-5" />, color: 'bg-success/10 text-success', sub: `${stats.total - stats.linked} accounts pending` },
          { label: 'Active This Week', value: stats.activeThisWeek, icon: <FileSpreadsheet className="w-5 h-5" />, color: 'bg-warning/10 text-warning', sub: `${Math.round((stats.activeThisWeek / (stats.linked || 1)) * 100)}% active rate` },
          { label: 'Active This Month', value: stats.activeThisMonth, icon: <AlertTriangle className="w-5 h-5" />, color: 'bg-indigo-500/10 text-indigo-400', sub: 'Solved in last 30 days' },
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

      {/* Student List & Search */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm">Detailed Performance Summary</CardTitle>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or roll no..."
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs focus:outline-none focus:border-primary text-foreground"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Student</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Roll No</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Username</th>
                    <th className="px-4 py-3 font-semibold text-success text-center">Easy</th>
                    <th className="px-4 py-3 font-semibold text-warning text-center">Medium</th>
                    <th className="px-4 py-3 font-semibold text-error text-center">Hard</th>
                    <th className="px-4 py-3 font-semibold text-foreground text-center">Total</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Rating</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Streak</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Weekly</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-center">Monthly</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-foreground">{s.name}</td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">{s.rollNo || 'N/A'}</td>
                      <td className="px-4 py-2.5 font-mono text-primary">
                        {s.leetcodeProfile?.username ? (
                          <a
                            href={`https://leetcode.com/${s.leetcodeProfile.username}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                          >
                            {s.leetcodeProfile.username}
                          </a>
                        ) : (
                          <span className="text-error font-sans text-xs">Not Linked</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-success font-semibold text-center">{s.leetcodeProfile?.easySolved ?? 0}</td>
                      <td className="px-4 py-2.5 text-warning font-semibold text-center">{s.leetcodeProfile?.mediumSolved ?? 0}</td>
                      <td className="px-4 py-2.5 text-error font-semibold text-center">{s.leetcodeProfile?.hardSolved ?? 0}</td>
                      <td className="px-4 py-2.5 font-bold text-foreground text-center">{s.leetcodeProfile?.totalSolved ?? 0}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-center">{Math.round(s.leetcodeProfile?.contestRating ?? 0)}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-center">{s.leetcodeProfile?.currentStreak ?? 0}d</td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge variant={(s.leetcodeProfile?.weeklySolvedCount ?? 0) > 0 ? 'success' : 'secondary'} className="text-[10px]">
                          {s.leetcodeProfile?.weeklySolvedCount ?? 0}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge variant={(s.leetcodeProfile?.monthlySolvedCount ?? 0) > 0 ? 'default' : 'secondary'} className="text-[10px]">
                          {s.leetcodeProfile?.monthlySolvedCount ?? 0}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                        No students found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
