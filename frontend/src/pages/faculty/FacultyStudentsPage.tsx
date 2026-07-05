import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/tables/DataTable'
import { Avatar } from '@/components/ui/avatar'
import { SolvedAreaChart } from '@/components/charts/Charts'
import { getInitials } from '@/lib/utils'
import { Users, UserX, TrendingUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

const STUDENTS = [
  { id: '1', name: 'Arjun Kumar', rollNo: '21CSE001', solved: 324, streak: 15, rating: 1543, lastActive: 'Today', status: 'ACTIVE' },
  { id: '2', name: 'Priya Devi', rollNo: '21CSE002', solved: 287, streak: 8, rating: 1412, lastActive: 'Yesterday', status: 'ACTIVE' },
  { id: '3', name: 'Ravi S', rollNo: '21CSE003', solved: 145, streak: 0, rating: 1234, lastActive: '5 days ago', status: 'INACTIVE' },
  { id: '4', name: 'Sneha M', rollNo: '21CSE004', solved: 412, streak: 23, rating: 1678, lastActive: 'Today', status: 'ACTIVE' },
  { id: '5', name: 'Kumar T', rollNo: '21CSE005', solved: 89, streak: 0, rating: 1100, lastActive: '8 days ago', status: 'INACTIVE' },
]

const weeklyTrend = [
  { day: 'Mon', solved: 24 }, { day: 'Tue', solved: 31 }, { day: 'Wed', solved: 19 },
  { day: 'Thu', solved: 28 }, { day: 'Fri', solved: 35 }, { day: 'Sat', solved: 42 }, { day: 'Sun', solved: 29 },
]

export default function FacultyStudentsPage() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Students</h1>
          <p className="text-muted-foreground text-sm mt-1">Section A · Batch 2021-25 · CSE</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> Add Student</Button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: STUDENTS.length, icon: <Users className="w-5 h-5" />, color: 'bg-primary/10 text-primary' },
          { label: 'Active Today', value: 3, icon: <TrendingUp className="w-5 h-5" />, color: 'bg-success/10 text-success' },
          { label: 'Inactive (7d)', value: 2, icon: <UserX className="w-5 h-5" />, color: 'bg-error/10 text-error' },
          { label: 'Avg Solved', value: Math.round(STUDENTS.reduce((a, s) => a + s.solved, 0) / STUDENTS.length), icon: <TrendingUp className="w-5 h-5" />, color: 'bg-warning/10 text-warning' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Section Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <SolvedAreaChart data={weeklyTrend} xKey="day" yKey="solved" color="#22C55E" height={180} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Status Overview</CardTitle></CardHeader>
          <CardContent className="space-y-4 pt-4">
            {[
              { label: 'Active Students', count: 3, pct: 60, color: 'bg-success' },
              { label: 'Inactive Students', count: 2, pct: 40, color: 'bg-error' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.label}</span><span className="font-semibold">{item.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader><CardTitle className="text-sm">Student Roster</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              data={STUDENTS}
              columns={[
                { key: 'name', label: 'Student', sortable: true, render: (r) => (
                  <div className="flex items-center gap-3">
                    <Avatar fallback={getInitials(r.name as string)} size="sm" />
                    <div>
                      <p className="font-medium text-sm">{r.name as string}</p>
                      <p className="text-xs text-muted-foreground">{r.rollNo as string}</p>
                    </div>
                  </div>
                )},
                { key: 'solved', label: 'Solved', sortable: true },
                { key: 'streak', label: 'Streak', render: (r) => <span>{r.streak as number > 0 ? '🔥' : '—'} {r.streak as number}d</span> },
                { key: 'rating', label: 'Rating', sortable: true },
                { key: 'lastActive', label: 'Last Active' },
                { key: 'status', label: 'Status', render: (r) => (
                  <Badge variant={r.status === 'ACTIVE' ? 'success' : 'error'}>{r.status as string}</Badge>
                )},
              ]}
              exportFilename="my-students"
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
