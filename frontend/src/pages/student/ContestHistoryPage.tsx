import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/tables/DataTable'
import { RatingLineChart } from '@/components/charts/Charts'
import { Trophy } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { leetcodeService } from '@/services/leetcode.service'
import type { ContestHistory } from '@/types'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function ContestHistoryPage() {
  const { user } = useAuth()
  const [contests, setContests] = useState<ContestHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      leetcodeService.getContestHistory(user.id)
        .then(setContests)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [user?.id])

  const ratingHistory = contests.slice().reverse().map((c) => ({
    contest: c.contestTitle.replace('Weekly Contest ', 'WC ').replace('Biweekly Contest ', 'BC '),
    rating: Math.round(c.rating),
  }))

  const bestRank = contests.length > 0 ? Math.min(...contests.map(c => c.ranking || Infinity)) : 0
  const avgProblems = contests.length > 0 
    ? (contests.reduce((acc, c) => acc + (c.problemsSolved || 0), 0) / contests.length).toFixed(1)
    : '0'
  const currentRating = contests.length > 0 ? Math.round(contests[0].rating) : 0

  // Calculate rating changes
  const formattedContests = contests.map((c, i) => {
    const change = i < contests.length - 1 ? Math.round(c.rating - contests[i+1].rating) : 0
    return {
      ...c,
      rating: Math.round(c.rating),
      attended: new Date(c.attended).toLocaleDateString(),
      change
    }
  })
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">Contest History</h1>
        <p className="text-muted-foreground text-sm mt-1">All LeetCode contest participations and ratings</p>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Contests', value: contests.length, color: 'text-primary' },
          { label: 'Current Rating', value: currentRating, color: 'text-warning' },
          { label: 'Best Rank', value: bestRank ? `#${bestRank}` : 'N/A', color: 'text-success' },
          { label: 'Avg Problems', value: `${avgProblems}/4`, color: 'text-foreground' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Rating chart */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-warning" /> Rating Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RatingLineChart
              data={ratingHistory}
              xKey="contest"
              lines={[{ key: 'rating', color: '#F59E0B', label: 'Contest Rating' }]}
              height={250}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Contest table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contest Participation</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={formattedContests}
              isLoading={loading}
              columns={[
                { key: 'attended', label: 'Date', sortable: true },
                { key: 'contestTitle', label: 'Contest', sortable: true },
                { key: 'ranking', label: 'Rank', sortable: true, render: (r) => <span className="font-mono">#{r.ranking}</span> },
                { key: 'rating', label: 'Rating', sortable: true, render: (r) => <span className="font-bold">{r.rating as number}</span> },
                { key: 'change', label: '±', render: (r) => {
                  const c = r.change as number
                  return <span className={c > 0 ? 'text-success font-medium' : c < 0 ? 'text-error font-medium' : 'text-muted-foreground font-medium'}>{c > 0 ? '+' : ''}{c}</span>
                }},
                { key: 'problemsSolved', label: 'Solved', render: (r) => (
                  <span>{r.problemsSolved as number}/{r.totalProblems as number}</span>
                )},
              ]}
              exportFilename="contest-history"
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
