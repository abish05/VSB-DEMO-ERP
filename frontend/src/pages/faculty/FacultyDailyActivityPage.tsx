import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { leetcodeService } from '@/services/leetcode.service'
import type { UserProfile } from '@/types'
import { RefreshCw, Users, Activity, Code2, TrendingUp, CheckCircle2 } from 'lucide-react'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

function isToday(ts?: string): boolean {
  if (!ts) return false
  const d = new Date(ts)
  const today = new Date()
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
}

export default function FacultyDailyActivityPage() {
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try { setStudents(await leetcodeService.getMyStudents()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const activeToday = useMemo(() =>
    students.filter(s => s.leetcodeProfile && (s.leetcodeProfile.dailySolvedCount ?? 0) > 0)
  , [students])

  const totalSolvedToday = activeToday.reduce((s, u) => s + (u.leetcodeProfile?.dailySolvedCount ?? 0), 0)
  const noProfile = students.filter(s => !s.leetcodeProfile).length

  if (loading) return <div className="space-y-6 animate-pulse">{Array.from({length:2}).map((_,i)=><div key={i} className="h-40 rounded-xl bg-muted/20"/>)}</div>

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={iv} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Daily Activity</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} — Today's student activity
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={load} isLoading={loading}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Today', value: activeToday.length, icon: <Activity className="w-5 h-5"/>, color: 'bg-success/10 text-success', sub: 'Students who solved problems' },
          { label: 'Problems Solved', value: totalSolvedToday, icon: <Code2 className="w-5 h-5"/>, color: 'bg-primary/10 text-primary', sub: 'Total by all students' },
          { label: 'Inactive Today', value: students.length - activeToday.length - noProfile, icon: <Users className="w-5 h-5"/>, color: 'bg-warning/10 text-warning', sub: 'No activity today' },
          { label: 'No Profile', value: noProfile, icon: <TrendingUp className="w-5 h-5"/>, color: 'bg-error/10 text-error', sub: 'LeetCode not linked' },
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

      {/* Active students */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" /> Active Students Today ({activeToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activeToday.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3 text-center">
                <Activity className="w-10 h-10 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">No students have solved problems today yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="px-4 py-3 font-semibold text-muted-foreground">#</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Student</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Roll No</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">LeetCode</th>
                      <th className="px-4 py-3 font-semibold text-primary">Solved Today</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Streak</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activeToday
                      .sort((a, b) => (b.leetcodeProfile?.dailySolvedCount ?? 0) - (a.leetcodeProfile?.dailySolvedCount ?? 0))
                      .map((s, i) => {
                        const lp = s.leetcodeProfile!
                        return (
                          <tr key={s.id} className="hover:bg-muted/10">
                            <td className="px-4 py-2.5 font-mono text-muted-foreground">{i+1}</td>
                            <td className="px-4 py-2.5 font-semibold text-foreground">{s.name}</td>
                            <td className="px-4 py-2.5 font-mono text-muted-foreground">{s.rollNo || '—'}</td>
                            <td className="px-4 py-2.5 font-mono text-primary">{lp.username}</td>
                            <td className="px-4 py-2.5 font-bold text-primary">{lp.dailySolvedCount ?? 0}</td>
                            <td className="px-4 py-2.5 text-muted-foreground">{lp.currentStreak}d</td>
                            <td className="px-4 py-2.5 text-foreground">{lp.totalSolved}</td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* All students status */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">All Students — Today's Status</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Student</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Roll No</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Solved Today</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Streak</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...students].sort((a, b) => (b.leetcodeProfile?.dailySolvedCount ?? -1) - (a.leetcodeProfile?.dailySolvedCount ?? -1)).map(s => {
                    const lp = s.leetcodeProfile
                    const daily = lp?.dailySolvedCount ?? 0
                    return (
                      <tr key={s.id} className="hover:bg-muted/10">
                        <td className="px-4 py-2.5 font-semibold text-foreground">{s.name}</td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{s.rollNo || '—'}</td>
                        <td className="px-4 py-2.5 font-bold text-foreground">{lp ? daily : '—'}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{lp ? `${lp.currentStreak}d` : '—'}</td>
                        <td className="px-4 py-2.5">
                          {!lp ? <Badge variant="error" className="text-[9px]">No Profile</Badge>
                            : daily > 0 ? <Badge variant="success" className="text-[9px]">Active</Badge>
                            : <Badge variant="secondary" className="text-[9px]">Inactive</Badge>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
