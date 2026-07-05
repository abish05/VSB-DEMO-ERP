import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/tables/DataTable'
import { RatingLineChart } from '@/components/charts/Charts'
import { Trophy } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

const CONTESTS = [
  { id: '1', contestTitle: 'Weekly Contest 405', ranking: 1234, rating: 1543, change: +42, problemsSolved: 3, totalProblems: 4, attended: '2024-12-08' },
  { id: '2', contestTitle: 'Biweekly Contest 124', ranking: 2890, rating: 1501, change: +28, problemsSolved: 2, totalProblems: 4, attended: '2024-11-30' },
  { id: '3', contestTitle: 'Weekly Contest 402', ranking: 3210, rating: 1473, change: -12, problemsSolved: 2, totalProblems: 4, attended: '2024-11-17' },
  { id: '4', contestTitle: 'Weekly Contest 400', ranking: 2100, rating: 1485, change: +35, problemsSolved: 3, totalProblems: 4, attended: '2024-11-03' },
  { id: '5', contestTitle: 'Biweekly Contest 120', ranking: 4500, rating: 1450, change: -8, problemsSolved: 1, totalProblems: 4, attended: '2024-10-19' },
]

const ratingHistory = CONTESTS.slice().reverse().map((c) => ({
  contest: c.contestTitle.replace('Weekly Contest ', 'WC ').replace('Biweekly Contest ', 'BC '),
  rating: c.rating,
}))

export default function ContestHistoryPage() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">Contest History</h1>
        <p className="text-muted-foreground text-sm mt-1">All LeetCode contest participations and ratings</p>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Contests', value: CONTESTS.length, color: 'text-primary' },
          { label: 'Current Rating', value: '1,543', color: 'text-warning' },
          { label: 'Best Rank', value: '#1,234', color: 'text-success' },
          { label: 'Avg Problems', value: '2.2/4', color: 'text-foreground' },
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
              data={CONTESTS}
              columns={[
                { key: 'attended', label: 'Date', sortable: true },
                { key: 'contestTitle', label: 'Contest', sortable: true },
                { key: 'ranking', label: 'Rank', sortable: true, render: (r) => <span className="font-mono">#{r.ranking}</span> },
                { key: 'rating', label: 'Rating', sortable: true, render: (r) => <span className="font-bold">{r.rating as number}</span> },
                { key: 'change', label: '±', render: (r) => {
                  const c = r.change as number
                  return <span className={c > 0 ? 'text-success font-medium' : 'text-error font-medium'}>{c > 0 ? '+' : ''}{c}</span>
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
