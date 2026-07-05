import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { DataTable } from '@/components/tables/DataTable'
import { Trophy, Medal, Star, TrendingUp } from 'lucide-react'
import { getInitials } from '@/lib/utils'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

const LEADERBOARD = [
  { rank: 1, name: 'Sneha M', rollNo: '21CSE004', solved: 412, streak: 23, rating: 1678, dept: 'CSE', change: +2 },
  { rank: 2, name: 'Arjun Kumar', rollNo: '21CSE001', solved: 324, streak: 15, rating: 1543, dept: 'CSE', change: 0 },
  { rank: 3, name: 'Priya Devi', rollNo: '21CSE002', solved: 287, streak: 8, rating: 1412, dept: 'CSE', change: -1 },
  { rank: 4, name: 'Mohammed Ali', rollNo: '21CSE006', solved: 478, streak: 12, rating: 1389, dept: 'CSE', change: +3 },
  { rank: 5, name: 'Kavitha S', rollNo: '21IT001', solved: 265, streak: 5, rating: 1254, dept: 'IT', change: -2 },
]

const rankIcon = (rank: number) => {
  if (rank === 1) return <Medal className="w-5 h-5 text-yellow-500" />
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
  return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
}

export default function LeaderboardPage() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Section ranking by total problems solved</p>
      </motion.div>

      {/* Top 3 podium */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
        {LEADERBOARD.slice(0, 3).map((s) => (
          <Card key={s.rank} className={`text-center py-6 ${s.rank === 1 ? 'border-yellow-300/50 bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
            <CardContent className="space-y-3">
              <div className="flex justify-center">{rankIcon(s.rank)}</div>
              <Avatar fallback={getInitials(s.name)} size="lg" className="mx-auto" />
              <div>
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.rollNo}</p>
              </div>
              <div className="flex flex-col gap-1">
                <Badge variant="default" className="mx-auto">{s.solved} solved</Badge>
                <p className="text-xs text-warning">Rating: {s.rating}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Full table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-warning" /> Section Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={LEADERBOARD}
              columns={[
                { key: 'rank', label: 'Rank', render: (r) => (
                  <div className="flex items-center justify-center w-8">{rankIcon(r.rank as number)}</div>
                )},
                { key: 'name', label: 'Student', sortable: true, render: (r) => (
                  <div className="flex items-center gap-3">
                    <Avatar fallback={getInitials(r.name as string)} size="sm" />
                    <div>
                      <p className="font-medium text-sm">{r.name as string}</p>
                      <p className="text-xs text-muted-foreground">{r.rollNo as string}</p>
                    </div>
                  </div>
                )},
                { key: 'solved', label: 'Total Solved', sortable: true },
                { key: 'streak', label: 'Streak', render: (r) => (
                  <span>{r.streak as number > 0 ? '🔥' : '—'} {r.streak as number}d</span>
                )},
                { key: 'rating', label: 'Contest Rating', sortable: true },
                { key: 'change', label: 'Change', render: (r) => {
                  const c = r.change as number
                  return (
                    <span className={`flex items-center gap-1 text-sm ${c > 0 ? 'text-success' : c < 0 ? 'text-error' : 'text-muted-foreground'}`}>
                      {c > 0 ? '↑' : c < 0 ? '↓' : '—'} {c !== 0 ? Math.abs(c) : ''}
                    </span>
                  )
                }},
              ]}
              exportFilename="leaderboard"
              pageSize={20}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
