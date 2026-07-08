import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { leetcodeService } from '@/services/leetcode.service'
import type { UserProfile } from '@/types'
import { Trophy, RefreshCw, Medal, Crown, Search } from 'lucide-react'
import { getInitials } from '@/lib/utils'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

export default function FacultyLeaderboardPage() {
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await leetcodeService.getMyStudents()
      setStudents(data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const ranked = useMemo(() => {
    return [...students]
      .sort((a, b) => (b.leetcodeProfile?.totalSolved ?? 0) - (a.leetcodeProfile?.totalSolved ?? 0))
      .filter(s =>
        search === '' ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.rollNo || '').toLowerCase().includes(search.toLowerCase())
      )
  }, [students, search])

  const top3 = ranked.slice(0, 3)

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 bg-muted/30 rounded-lg" />
      <div className="h-48 rounded-xl bg-muted/20" />
      <div className="h-64 rounded-xl bg-muted/20" />
    </div>
  )

  const podiumColors = ['text-yellow-400 bg-yellow-400/10', 'text-slate-300 bg-slate-300/10', 'text-orange-400 bg-orange-400/10']
  const podiumIcons = [<Crown className="w-5 h-5" />, <Trophy className="w-5 h-5" />, <Medal className="w-5 h-5" />]

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={iv} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Department Leaderboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Top performers in your section — ranked by total problems solved</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 self-start" onClick={load} isLoading={loading}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </motion.div>

      {/* Podium Top 3 */}
      {top3.length >= 1 && (
        <motion.div variants={iv} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {top3.map((s, idx) => {
            const lp = s.leetcodeProfile
            return (
              <Card key={s.id} className={`text-center ${idx === 0 ? 'border-yellow-500/40 bg-yellow-500/5' : ''}`}>
                <CardContent className="pt-6 pb-4 space-y-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${podiumColors[idx]}`}>
                    {podiumIcons[idx]}
                  </div>
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto text-sm font-bold text-primary">
                    {getInitials(s.name)}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{s.rollNo || '—'}</p>
                  </div>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Badge variant="default" className="text-[10px]">#{idx + 1}</Badge>
                    <Badge variant="success" className="text-[10px]">{lp?.totalSolved ?? 0} solved</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Rating: <span className="font-semibold text-foreground">{Math.round(lp?.contestRating ?? 0)}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </motion.div>
      )}

      {/* Full Rankings Table */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm">Full Rankings</CardTitle>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search student..."
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs focus:outline-none focus:border-primary text-foreground"
              />
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
                    <th className="px-4 py-3 font-semibold text-success">Easy</th>
                    <th className="px-4 py-3 font-semibold text-warning">Medium</th>
                    <th className="px-4 py-3 font-semibold text-error">Hard</th>
                    <th className="px-4 py-3 font-semibold text-foreground">Total</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Rating</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ranked.map((s, idx) => {
                    const lp = s.leetcodeProfile
                    const rank = students.indexOf(s) + 1
                    return (
                      <tr key={s.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-2.5">
                          <span className={`font-bold ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-orange-400' : 'text-muted-foreground'}`}>
                            #{rank}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                              {getInitials(s.name)}
                            </div>
                            <span className="font-semibold text-foreground">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{s.rollNo || '—'}</td>
                        <td className="px-4 py-2.5 text-success font-semibold">{lp?.easySolved ?? 0}</td>
                        <td className="px-4 py-2.5 text-warning font-semibold">{lp?.mediumSolved ?? 0}</td>
                        <td className="px-4 py-2.5 text-error font-semibold">{lp?.hardSolved ?? 0}</td>
                        <td className="px-4 py-2.5 font-bold text-foreground">{lp?.totalSolved ?? 0}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{Math.round(lp?.contestRating ?? 0)}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{lp?.currentStreak ?? 0}d</td>
                      </tr>
                    )
                  })}
                  {ranked.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No students found</td></tr>
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
