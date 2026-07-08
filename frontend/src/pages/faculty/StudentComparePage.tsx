import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { leetcodeService } from '@/services/leetcode.service'
import type { UserProfile } from '@/types'
import { RefreshCw, Users, GitCompare, Code2, TrendingUp, Flame } from 'lucide-react'
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

export default function StudentComparePage() {
  const [students, setStudents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [studentA, setStudentA] = useState('')
  const [studentB, setStudentB] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setStudents(await leetcodeService.getMyStudents()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const sA = useMemo(() => students.find(s => s.id === studentA) || null, [students, studentA])
  const sB = useMemo(() => students.find(s => s.id === studentB) || null, [students, studentB])

  const radarData = useMemo(() => {
    if (!sA || !sB) return []
    return [
      { metric: 'Easy',    A: sA.leetcodeProfile?.easySolved ?? 0,    B: sB.leetcodeProfile?.easySolved ?? 0 },
      { metric: 'Medium',  A: sA.leetcodeProfile?.mediumSolved ?? 0,  B: sB.leetcodeProfile?.mediumSolved ?? 0 },
      { metric: 'Hard',    A: sA.leetcodeProfile?.hardSolved ?? 0,    B: sB.leetcodeProfile?.hardSolved ?? 0 },
      { metric: 'Rating',  A: Math.round((sA.leetcodeProfile?.contestRating ?? 0) / 20), B: Math.round((sB.leetcodeProfile?.contestRating ?? 0) / 20) },
      { metric: 'Streak',  A: sA.leetcodeProfile?.currentStreak ?? 0, B: sB.leetcodeProfile?.currentStreak ?? 0 },
      { metric: 'Weekly',  A: sA.leetcodeProfile?.weeklySolvedCount ?? 0, B: sB.leetcodeProfile?.weeklySolvedCount ?? 0 },
    ]
  }, [sA, sB])

  function statRow(label: string, va: number | string, vb: number | string, higherBetter = true) {
    const numA = Number(va)
    const numB = Number(vb)
    const aWins = higherBetter ? numA > numB : numA < numB
    const bWins = higherBetter ? numB > numA : numB < numA
    return (
      <tr className="border-b border-border last:border-0">
        <td className={`px-4 py-2.5 font-bold text-sm ${aWins ? 'text-success' : bWins ? 'text-muted-foreground' : 'text-foreground'}`}>{va}</td>
        <td className="px-4 py-2.5 text-center text-xs text-muted-foreground font-medium">{label}</td>
        <td className={`px-4 py-2.5 font-bold text-sm text-right ${bWins ? 'text-success' : aWins ? 'text-muted-foreground' : 'text-foreground'}`}>{vb}</td>
      </tr>
    )
  }

  if (loading) return <div className="h-64 rounded-xl bg-muted/20 animate-pulse" />

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={iv} className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Compare Students</h1>
          <p className="text-muted-foreground text-sm mt-1">Side-by-side performance comparison</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={load} isLoading={loading}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </motion.div>

      {/* Selectors */}
      <motion.div variants={iv} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: 'Student A', value: studentA, onChange: setStudentA, color: '#6366F1' },
          { label: 'Student B', value: studentB, onChange: setStudentB, color: '#F59E0B' },
        ].map(sel => (
          <div key={sel.label}>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">{sel.label}</label>
            <select
              value={sel.value}
              onChange={e => sel.onChange(e.target.value)}
              className="w-full bg-background border border-border rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-primary text-foreground"
            >
              <option value="">— Select Student —</option>
              {students.filter(s => s.leetcodeProfile).map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.rollNo || s.id.slice(0,6)})</option>
              ))}
            </select>
          </div>
        ))}
      </motion.div>

      {sA && sB ? (
        <>
          {/* Radar chart */}
          <motion.div variants={iv}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-primary" /> Skill Radar — {sA.name.split(' ')[0]} vs {sB.name.split(' ')[0]}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#94A3B8' }} />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar dataKey="A" stroke="#6366F1" fill="#6366F1" fillOpacity={0.25} name={sA.name.split(' ')[0]} />
                    <Radar dataKey="B" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.25} name={sB.name.split(' ')[0]} />
                    <Tooltip contentStyle={{ background: '#1E293B', borderColor: '#334155', borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Head-to-head table */}
          <motion.div variants={iv}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-indigo-400">{sA.name}</div>
                  <CardTitle className="text-sm text-muted-foreground">vs</CardTitle>
                  <div className="font-bold text-warning text-right">{sB.name}</div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <tbody>
                    {statRow('Total Solved', sA.leetcodeProfile?.totalSolved ?? 0, sB.leetcodeProfile?.totalSolved ?? 0)}
                    {statRow('Easy Solved', sA.leetcodeProfile?.easySolved ?? 0, sB.leetcodeProfile?.easySolved ?? 0)}
                    {statRow('Medium Solved', sA.leetcodeProfile?.mediumSolved ?? 0, sB.leetcodeProfile?.mediumSolved ?? 0)}
                    {statRow('Hard Solved', sA.leetcodeProfile?.hardSolved ?? 0, sB.leetcodeProfile?.hardSolved ?? 0)}
                    {statRow('Contest Rating', Math.round(sA.leetcodeProfile?.contestRating ?? 0), Math.round(sB.leetcodeProfile?.contestRating ?? 0))}
                    {statRow('Current Streak', `${sA.leetcodeProfile?.currentStreak ?? 0}d`, `${sB.leetcodeProfile?.currentStreak ?? 0}d`)}
                    {statRow('Longest Streak', `${sA.leetcodeProfile?.longestStreak ?? 0}d`, `${sB.leetcodeProfile?.longestStreak ?? 0}d`)}
                    {statRow('Weekly Solved', sA.leetcodeProfile?.weeklySolvedCount ?? 0, sB.leetcodeProfile?.weeklySolvedCount ?? 0)}
                    {statRow('Monthly Solved', sA.leetcodeProfile?.monthlySolvedCount ?? 0, sB.leetcodeProfile?.monthlySolvedCount ?? 0)}
                    {statRow('Acceptance Rate', `${(sA.leetcodeProfile?.acceptanceRate ?? 0).toFixed(1)}%`, `${(sB.leetcodeProfile?.acceptanceRate ?? 0).toFixed(1)}%`)}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : (
        <motion.div variants={iv} className="stat-card flex flex-col items-center py-16 gap-3">
          <GitCompare className="w-10 h-10 text-muted-foreground" />
          <p className="font-semibold text-muted-foreground">Select two students above to compare their performance</p>
        </motion.div>
      )}
    </motion.div>
  )
}
