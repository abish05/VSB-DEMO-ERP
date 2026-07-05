import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SolvedAreaChart, DifficultyPieChart } from '@/components/charts/Charts'
import { Target, CheckCircle, Zap, TrendingUp } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

const pieData = [
  { name: 'Easy', value: 142, color: '#22C55E' },
  { name: 'Medium', value: 142, color: '#F59E0B' },
  { name: 'Hard', value: 40, color: '#EF4444' },
]

const monthlyData = [
  { month: 'Jan', solved: 45 }, { month: 'Feb', solved: 52 }, { month: 'Mar', solved: 38 },
  { month: 'Apr', solved: 61 }, { month: 'May', solved: 47 }, { month: 'Jun', solved: 58 },
  { month: 'Jul', solved: 29 },
]

export default function MyProgressPage() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">My Progress</h1>
        <p className="text-muted-foreground text-sm mt-1">Detailed problem solving analytics</p>
      </motion.div>

      {/* Difficulty breakdown */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
        {[
          { label: 'Easy', value: 142, total: 800, color: 'text-success', bg: 'bg-success', pct: 17.75 },
          { label: 'Medium', value: 142, total: 1600, color: 'text-warning', bg: 'bg-warning', pct: 8.875 },
          { label: 'Hard', value: 40, total: 600, color: 'text-error', bg: 'bg-error', pct: 6.67 },
        ].map((d) => (
          <Card key={d.label}>
            <CardContent className="pt-6 text-center">
              <p className={`text-3xl font-bold ${d.color}`}>{d.value}</p>
              <p className="text-xs text-muted-foreground mt-1">of {d.total} {d.label}</p>
              <div className="h-1.5 bg-muted rounded-full mt-3">
                <div className={`h-1.5 rounded-full ${d.bg}`} style={{ width: `${d.pct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{d.pct.toFixed(1)}%</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Monthly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SolvedAreaChart data={monthlyData} xKey="month" yKey="solved" height={220} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Difficulty Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DifficultyPieChart data={pieData} height={220} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Goals */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader><CardTitle className="text-sm">Progress Goals</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Solve 500 problems', current: 324, target: 500, icon: <Target className="w-4 h-4" /> },
              { label: 'Solve 200 medium problems', current: 142, target: 200, icon: <Zap className="w-4 h-4" /> },
              { label: 'Solve 100 hard problems', current: 40, target: 100, icon: <CheckCircle className="w-4 h-4" /> },
            ].map((g) => {
              const pct = Math.round((g.current / g.target) * 100)
              return (
                <div key={g.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm">
                      {g.icon}
                      <span>{g.label}</span>
                    </div>
                    <span className="text-sm font-semibold">{g.current}/{g.target} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-2 bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
