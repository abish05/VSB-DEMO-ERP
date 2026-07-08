// Faculty Contest History Page — shows student contest performances
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { leetcodeService } from '@/services/leetcode.service'
import type { UserProfile } from '@/types'
import { RefreshCw, Trophy, Search, TrendingUp, Users } from 'lucide-react'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

export default function FacultyContestHistoryPage() {
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setStudents(await leetcodeService.getMyStudents()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const withRating = useMemo(() =>
    students.filter(s => s.leetcodeProfile && (s.leetcodeProfile.contestRating ?? 0) > 0)
  , [students])

  const filtered = useMemo(() =>
    [...withRating]
      .filter(s => search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || (s.rollNo || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b.leetcodeProfile?.contestRating ?? 0) - (a.leetcodeProfile?.contestRating ?? 0))
  , [withRating, search])

  const avgRating = withRating.length
    ? Math.round(withRating.reduce((s, u) => s + (u.leetcodeProfile?.contestRating ?? 0), 0) / withRating.length)
    : 0

  const totalContests = withRating.reduce((s, u) => s + (u.leetcodeProfile?.totalContestsParticipated ?? 0), 0)

  if (loading) return <div className="space-y-6 animate-pulse"><div className="h-40 rounded-xl bg-muted/20"/><div className="h-64 rounded-xl bg-muted/20"/></div>

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={iv} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Contest History</h1>
          <p className="text-muted-foreground text-sm mt-1">Student contest ratings and participation</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={load} isLoading={loading}><RefreshCw className="w-3.5 h-3.5" /> Refresh</Button>
      </motion.div>

      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Rated Students', value: withRating.length, icon: <Trophy className="w-5 h-5"/>, color: 'bg-warning/10 text-warning', sub: 'With contest rating' },
          { label: 'Avg Rating', value: avgRating, icon: <TrendingUp className="w-5 h-5"/>, color: 'bg-primary/10 text-primary', sub: 'Section average' },
          { label: 'Total Contests', value: totalContests, icon: <Users className="w-5 h-5"/>, color: 'bg-success/10 text-success', sub: 'Participations' },
          { label: 'Best Rating', value: Math.round(Math.max(...withRating.map(s => s.leetcodeProfile?.contestRating ?? 0), 0)), icon: <Trophy className="w-5 h-5"/>, color: 'bg-yellow-500/10 text-yellow-400', sub: 'Top in section' },
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
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm flex items-center gap-2"><Trophy className="w-4 h-4 text-warning"/> Student Contest Rankings</CardTitle>
            <div className="relative w-44">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs focus:outline-none focus:border-primary text-foreground" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Rank</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Student</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Roll No</th>
                    <th className="px-4 py-3 font-semibold text-warning">Contest Rating</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Best Rank</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Contests</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((s, i) => {
                    const lp = s.leetcodeProfile!
                    const rating = Math.round(lp.contestRating ?? 0)
                    const tier = rating >= 2200 ? 'Guardian' : rating >= 1800 ? 'Knight' : rating >= 1500 ? 'Specialist' : 'Pupil'
                    const tierColor = rating >= 2200 ? 'text-yellow-400' : rating >= 1800 ? 'text-purple-400' : rating >= 1500 ? 'text-blue-400' : 'text-muted-foreground'
                    return (
                      <tr key={s.id} className="hover:bg-muted/10">
                        <td className="px-4 py-2.5 font-mono font-bold text-muted-foreground">#{i+1}</td>
                        <td className="px-4 py-2.5 font-semibold text-foreground">{s.name}</td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{s.rollNo || '—'}</td>
                        <td className="px-4 py-2.5 font-bold text-warning">{rating}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{lp.bestContestRanking ? `#${lp.bestContestRanking}` : '—'}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{lp.totalContestsParticipated ?? 0}</td>
                        <td className={`px-4 py-2.5 font-semibold ${tierColor}`}>{tier}</td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No rated students found</td></tr>
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
