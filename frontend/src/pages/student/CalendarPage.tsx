import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar'
import { CalendarDays } from 'lucide-react'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

// Generate mock heatmap data
const heatmapData: Record<string, number> = {}
const today = new Date()
for (let i = 0; i < 365; i++) {
  const d = new Date(today)
  d.setDate(d.getDate() - i)
  const key = d.toISOString().split('T')[0]
  if (Math.random() > 0.35) {
    heatmapData[key] = Math.floor(Math.random() * 10) + 1
  }
}

const totalDays = Object.keys(heatmapData).length
const totalSubmissions = Object.values(heatmapData).reduce((a, b) => a + b, 0)
const maxStreak = 34

export default function CalendarPage() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">Submission Calendar</h1>
        <p className="text-muted-foreground text-sm mt-1">Your coding activity over the past year</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Days', value: totalDays, sub: 'Last 365 days' },
          { label: 'Total Submissions', value: totalSubmissions, sub: 'All time' },
          { label: 'Current Streak', value: '15 days 🔥', sub: 'Keep going!' },
          { label: 'Longest Streak', value: `${maxStreak} days`, sub: 'Personal best' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold mt-2">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4 text-primary" /> Activity Heatmap (Last 12 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HeatmapCalendar data={heatmapData} />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
