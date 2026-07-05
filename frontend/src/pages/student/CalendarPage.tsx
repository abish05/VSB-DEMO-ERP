import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HeatmapCalendar } from '@/components/charts/HeatmapCalendar'
import { CalendarDays } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

function calendarToHeatmap(calendar: unknown): Record<string, number> {
  if (!calendar) return {}
  const parsed = typeof calendar === 'string' ? JSON.parse(calendar) : calendar
  const entries = Object.entries((parsed || {}) as Record<string, number>)

  return entries.reduce<Record<string, number>>((acc, [timestamp, count]) => {
    const date = new Date(Number(timestamp) * 1000)
    if (!Number.isNaN(date.getTime())) {
      acc[date.toISOString().split('T')[0]] = count
    }
    return acc
  }, {})
}

export default function CalendarPage() {
  const { user } = useAuth()
  const profile = user?.leetcodeProfile

  const heatmapData = useMemo(() => calendarToHeatmap(profile?.submissionCalendar), [profile?.submissionCalendar])
  
  const totalDays = profile?.totalActiveDays || Object.keys(heatmapData).length
  const totalSubmissions = Object.values(heatmapData).reduce((a, b) => a + b, 0)
  const maxStreak = profile?.longestStreak || 0
  const currentStreak = profile?.currentStreak || 0

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">Submission Calendar</h1>
        <p className="text-muted-foreground text-sm mt-1">Your coding activity over the past year</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Days', value: totalDays, sub: 'Last 365 days' },
          { label: 'Total Submissions', value: totalSubmissions, sub: 'Synced from LeetCode' },
          { label: 'Current Streak', value: `${currentStreak} days 🔥`, sub: 'Keep going!' },
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
