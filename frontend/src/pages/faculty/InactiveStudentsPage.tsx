import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { leetcodeService } from '@/services/leetcode.service'
import type { UserProfile } from '@/types'
import { RefreshCw, UserX, AlertTriangle, Search, Mail, Clock } from 'lucide-react'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

const INACTIVITY_DAYS = 7

function daysSinceLastSync(lastSyncedAt?: string): number {
  if (!lastSyncedAt) return 999
  const diff = Date.now() - new Date(lastSyncedAt).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function InactiveStudentsPage() {
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [threshold, setThreshold] = useState(INACTIVITY_DAYS)

  const load = useCallback(async () => {
    setLoading(true)
    try { setStudents(await leetcodeService.getMyStudents()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const inactive = useMemo(() =>
    students.filter(s => {
      if (!s.leetcodeProfile) return true
      const days = daysSinceLastSync(s.leetcodeProfile.lastSyncedAt)
      return days >= threshold || (s.leetcodeProfile.currentStreak === 0 && s.leetcodeProfile.weeklySolvedCount === 0)
    }).filter(s =>
      search === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.rollNo || '').toLowerCase().includes(search.toLowerCase())
    )
  , [students, threshold, search])

  const noProfile = students.filter(s => !s.leetcodeProfile)

  if (loading) return <div className="space-y-6 animate-pulse">{Array.from({length:3}).map((_,i)=><div key={i} className="h-32 rounded-xl bg-muted/20"/>)}</div>

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={iv} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inactive Students</h1>
          <p className="text-muted-foreground text-sm mt-1">Students with no coding activity in the last {threshold} days</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start" onClick={load} isLoading={loading}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="stat-card flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inactive Students</p>
          <p className="text-3xl font-bold text-error">{inactive.length}</p>
          <p className="text-xs text-muted-foreground">No activity ≥{threshold} days</p>
        </div>
        <div className="stat-card flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">No LeetCode Profile</p>
          <p className="text-3xl font-bold text-warning">{noProfile.length}</p>
          <p className="text-xs text-muted-foreground">Not yet linked</p>
        </div>
        <div className="stat-card flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Students</p>
          <p className="text-3xl font-bold text-foreground">{students.length}</p>
          <p className="text-xs text-muted-foreground">In your section</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={iv} className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or roll no..."
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-xs focus:outline-none focus:border-primary text-foreground"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Inactive if ≥</span>
          <select
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            className="h-9 px-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:border-primary text-foreground"
          >
            {[3, 5, 7, 14, 30].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
      </motion.div>

      {/* Inactive Students Table */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserX className="w-4 h-4 text-error" /> Inactive / At-Risk Students ({inactive.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {inactive.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <AlertTriangle className="w-8 h-8 text-success" />
                <p className="font-semibold text-success">No inactive students found 🎉</p>
                <p className="text-sm text-muted-foreground">All students are actively coding!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Student</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Roll No</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">LeetCode</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Last Synced</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Weekly Solved</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Streak</th>
                      <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {inactive.map(s => {
                      const lp = s.leetcodeProfile
                      const daysSince = daysSinceLastSync(lp?.lastSyncedAt)
                      return (
                        <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-foreground">{s.name}</td>
                          <td className="px-4 py-2.5 font-mono text-muted-foreground">{s.rollNo || '—'}</td>
                          <td className="px-4 py-2.5 font-mono text-muted-foreground">{lp?.username || <span className="text-error">Not linked</span>}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {lp?.lastSyncedAt ? (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {daysSince === 999 ? 'Never' : `${daysSince}d ago`}
                              </div>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">{lp?.weeklySolvedCount ?? 0}</td>
                          <td className="px-4 py-2.5 text-muted-foreground">{lp?.currentStreak ?? 0}d</td>
                          <td className="px-4 py-2.5">
                            {!lp
                              ? <Badge variant="error" className="text-[9px]">No Profile</Badge>
                              : daysSince >= 14
                              ? <Badge variant="error" className="text-[9px]">Critical</Badge>
                              : <Badge variant="warning" className="text-[9px]">At Risk</Badge>
                            }
                          </td>
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
    </motion.div>
  )
}
