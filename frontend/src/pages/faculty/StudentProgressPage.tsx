import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { leetcodeService } from '@/services/leetcode.service'
import type { UserProfile } from '@/types'
import { RefreshCw, TrendingUp, Users, Code2, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

type SortKey = 'totalSolved' | 'contestRating' | 'currentStreak' | 'weeklySolvedCount' | 'monthlySolvedCount'

export default function StudentProgressPage() {
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('totalSolved')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const load = useCallback(async () => {
    setLoading(true)
    try { setStudents(await leetcodeService.getMyStudents()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline ml-0.5" /> : <ChevronUp className="w-3 h-3 inline ml-0.5" />) : null

  const sorted = useMemo(() =>
    [...students]
      .filter(s => s.leetcodeProfile)
      .filter(s => search === '' || s.name.toLowerCase().includes(search.toLowerCase()) || (s.rollNo || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        const va = (a.leetcodeProfile as any)?.[sortKey] ?? 0
        const vb = (b.leetcodeProfile as any)?.[sortKey] ?? 0
        return sortDir === 'desc' ? vb - va : va - vb
      })
  , [students, search, sortKey, sortDir])

  const stats = useMemo(() => {
    const withProfile = students.filter(s => s.leetcodeProfile)
    return {
      total: students.length,
      linked: withProfile.length,
      avgSolved: withProfile.length ? Math.round(withProfile.reduce((s, u) => s + (u.leetcodeProfile?.totalSolved ?? 0), 0) / withProfile.length) : 0,
      totalSolved: withProfile.reduce((s, u) => s + (u.leetcodeProfile?.totalSolved ?? 0), 0),
    }
  }, [students])

  // Top 8 for chart
  const chartData = useMemo(() =>
    [...students]
      .filter(s => s.leetcodeProfile)
      .sort((a, b) => (b.leetcodeProfile?.totalSolved ?? 0) - (a.leetcodeProfile?.totalSolved ?? 0))
      .slice(0, 8)
      .map(s => ({ name: s.name.split(' ')[0], easy: s.leetcodeProfile?.easySolved ?? 0, medium: s.leetcodeProfile?.mediumSolved ?? 0, hard: s.leetcodeProfile?.hardSolved ?? 0 }))
  , [students])

  if (loading) return <div className="space-y-6 animate-pulse">{Array.from({length:3}).map((_,i)=><div key={i} className="h-36 rounded-xl bg-muted/20"/>)}</div>

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={iv} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Student Progress</h1>
          <p className="text-muted-foreground text-sm mt-1">Full performance overview of your section</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={load} isLoading={loading}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={iv} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats.total, icon: <Users className="w-5 h-5"/>, color: 'bg-primary/10 text-primary', sub: 'In your section' },
          { label: 'Profiles Linked', value: stats.linked, icon: <Code2 className="w-5 h-5"/>, color: 'bg-success/10 text-success', sub: `${students.length - stats.linked} unlinked` },
          { label: 'Total Problems', value: stats.totalSolved, icon: <TrendingUp className="w-5 h-5"/>, color: 'bg-warning/10 text-warning', sub: 'Section total' },
          { label: 'Avg / Student', value: stats.avgSolved, icon: <Code2 className="w-5 h-5"/>, color: 'bg-indigo-500/10 text-indigo-400', sub: 'Problems solved' },
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

      {/* Stacked bar chart */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Top 8 Students — Difficulty Breakdown</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8 }} />
                <Bar dataKey="easy" stackId="a" fill="#22C55E" name="Easy" />
                <Bar dataKey="medium" stackId="a" fill="#F59E0B" name="Medium" />
                <Bar dataKey="hard" stackId="a" fill="#EF4444" radius={[4,4,0,0]} name="Hard" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress table */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-sm">Student Progress Table</CardTitle>
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
                    <th className="px-4 py-3 font-semibold text-muted-foreground">#</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Student</th>
                    <th className="px-4 py-3 font-semibold text-success">Easy</th>
                    <th className="px-4 py-3 font-semibold text-warning">Medium</th>
                    <th className="px-4 py-3 font-semibold text-error">Hard</th>
                    <th onClick={() => handleSort('totalSolved')} className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground text-muted-foreground">Total <SortIcon col="totalSolved"/></th>
                    <th onClick={() => handleSort('contestRating')} className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground text-muted-foreground">Rating <SortIcon col="contestRating"/></th>
                    <th onClick={() => handleSort('currentStreak')} className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground text-muted-foreground">Streak <SortIcon col="currentStreak"/></th>
                    <th onClick={() => handleSort('weeklySolvedCount')} className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground text-muted-foreground">This Week <SortIcon col="weeklySolvedCount"/></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sorted.map((s, i) => {
                    const lp = s.leetcodeProfile!
                    return (
                      <tr key={s.id} className="hover:bg-muted/10">
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">{i+1}</td>
                        <td className="px-4 py-2.5">
                          <div>
                            <p className="font-semibold text-foreground">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{s.rollNo || '—'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-success font-semibold">{lp.easySolved}</td>
                        <td className="px-4 py-2.5 text-warning font-semibold">{lp.mediumSolved}</td>
                        <td className="px-4 py-2.5 text-error font-semibold">{lp.hardSolved}</td>
                        <td className="px-4 py-2.5 font-bold text-foreground">{lp.totalSolved}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{Math.round(lp.contestRating)}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{lp.currentStreak}d</td>
                        <td className="px-4 py-2.5">
                          <Badge variant={(lp.weeklySolvedCount ?? 0) > 0 ? 'success' : 'secondary'} className="text-[9px]">
                            {lp.weeklySolvedCount ?? 0}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                  {sorted.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No students found</td></tr>}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
