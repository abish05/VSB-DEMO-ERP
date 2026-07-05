import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { DataTable } from '@/components/tables/DataTable'
import { Trophy, Medal, Flame } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { adminService } from '@/services/admin.service'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

const rankIcon = (rank: number) => {
  if (rank === 1) return <Medal className="w-6 h-6 text-yellow-500 animate-bounce" />
  if (rank === 2) return <Medal className="w-6 h-6 text-muted-foreground" />
  if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />
  return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
}

export default function AdminLeaderboardPage() {
  const { data: studentsData, isLoading } = useQuery({
    queryKey: ['adminStudents'],
    queryFn: () => adminService.getUsers({ role: 'STUDENT', limit: 1000 }),
  })
  const students = studentsData?.data || []

  // Compile leaderboard entries sorted by totalSolved desc
  const leaderboard = [...students]
    .map((s: any) => ({
      ...s,
      solved: s.leetcodeProfile?.totalSolved || 0,
      rating: s.leetcodeProfile?.contestRating || 0,
      streak: s.leetcodeProfile?.currentStreak || 0,
    }))
    .sort((a, b) => b.solved - a.solved)
    .map((s, idx) => ({
      rank: idx + 1,
      ...s,
    }))

  const topThree = leaderboard.slice(0, 3)

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">Institutional Leaderboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Ranking of all students by total LeetCode problems solved</p>
      </motion.div>

      {/* Podium */}
      {topThree.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
          {topThree.map((s) => (
            <Card key={s.rank} className={`text-center py-6 relative overflow-hidden ${
              s.rank === 1 ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-border'
            }`}>
              <div className="absolute top-2 right-2">{rankIcon(s.rank)}</div>
              <CardContent className="space-y-3 pt-4">
                <Avatar fallback={getInitials(s.name)} size="lg" className="mx-auto border-2 border-primary/20" />
                <div>
                  <p className="font-bold text-sm text-foreground">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.email}</p>
                </div>
                <div className="flex flex-col gap-1.5 items-center">
                  <Badge variant={s.rank === 1 ? 'default' : 'secondary'}>{s.solved} solved</Badge>
                  {s.streak > 0 && (
                    <span className="text-xs text-orange-400 flex items-center gap-0.5">
                      <Flame className="w-3.5 h-3.5 fill-orange-400" /> {s.streak}d streak
                    </span>
                  )}
                  <p className="text-xs text-indigo-400 font-semibold">Rating: {s.rating.toFixed(0)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      {/* Full Leaderboard Table */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-warning" /> Standings Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={leaderboard}
              isLoading={isLoading}
              columns={[
                {
                  key: 'rank',
                  label: 'Rank',
                  render: (r: any) => <div className="flex items-center justify-center w-8">{rankIcon(r.rank)}</div>,
                },
                {
                  key: 'name',
                  label: 'Student',
                  sortable: true,
                  render: (r: any) => (
                    <div className="flex items-center gap-3">
                      <Avatar fallback={getInitials(r.name)} size="sm" />
                      <div>
                        <p className="font-semibold text-sm">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.email}</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'dept',
                  label: 'Department',
                  render: (r: any) => <Badge variant="secondary">{r.department?.code || '—'}</Badge>,
                },
                {
                  key: 'solved',
                  label: 'Total Solved',
                  sortable: true,
                  render: (r: any) => <span className="font-bold text-foreground">{r.solved}</span>,
                },
                {
                  key: 'streak',
                  label: 'Current Streak',
                  sortable: true,
                  render: (r: any) => (
                    <span className={r.streak > 0 ? 'text-orange-400 font-semibold' : 'text-muted-foreground'}>
                      {r.streak > 0 ? `🔥 ${r.streak} days` : '—'}
                    </span>
                  ),
                },
                {
                  key: 'rating',
                  label: 'Contest Rating',
                  sortable: true,
                  render: (r: any) => <span className="font-mono text-indigo-400">{r.rating.toFixed(0)}</span>,
                },
              ]}
              exportFilename="institutional_leaderboard"
              pageSize={25}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
