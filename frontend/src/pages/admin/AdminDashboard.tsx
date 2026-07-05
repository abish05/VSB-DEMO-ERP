import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SolvedAreaChart, DifficultyBarChart, DifficultyPieChart } from '@/components/charts/Charts'
import { DataTable } from '@/components/tables/DataTable'
import { DashboardSkeleton } from '@/components/shared/Skeleton'
import { adminService } from '@/services/admin.service'
import { useToast } from '@/hooks/use-toast'
import {
  Users,
  GraduationCap,
  Activity,
  TrendingUp,
  Code2,
  BarChart3,
  ShieldCheck,
  Zap,
  Building2,
  Layers,
  FolderOpen,
  CalendarDays,
  Plus,
  Send,
  RefreshCw,
  Download,
  FileSpreadsheet,
} from 'lucide-react'

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: () => adminService.getDashboardStats(),
  })

  const syncMutation = useMutation({
    mutationFn: () => adminService.syncAllUsers(),
    onSuccess: (res) => {
      toast({
        title: 'LeetCode Sync Triggered',
        description: res?.message || 'Syncing all user profiles in the background.',
      })
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] })
    },
    onError: (err: any) => {
      toast({
        title: 'Sync Failed',
        description: err?.response?.data?.message || 'Failed to trigger sync. Please try again.',
        variant: 'destructive',
      })
    },
  })

  if (isLoading) return <DashboardSkeleton />
  if (error || !data) {
    return (
      <div className="p-12 text-center border border-border rounded-xl">
        <p className="text-error font-medium">Failed to load dashboard statistics.</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  const { stats, charts } = data

  const statsRow = [
    { label: 'Total Students', value: stats.totalStudents, icon: <Users className="w-5 h-5" />, color: 'bg-primary/10 text-primary' },
    { label: 'Total Faculty', value: stats.totalFaculty, icon: <GraduationCap className="w-5 h-5" />, color: 'bg-success/10 text-success' },
    { label: 'Departments', value: stats.totalDepartments, icon: <Building2 className="w-5 h-5" />, color: 'bg-indigo-500/10 text-indigo-500' },
    { label: 'Batches', value: stats.totalBatches, icon: <Layers className="w-5 h-5" />, color: 'bg-teal-500/10 text-teal-500' },
    { label: 'Sections', value: stats.totalSections, icon: <FolderOpen className="w-5 h-5" />, color: 'bg-cyan-500/10 text-cyan-500' },
    { label: 'Active Today', value: stats.activeToday, icon: <Activity className="w-5 h-5" />, color: 'bg-warning/10 text-warning' },
    { label: 'Linked Profiles', value: stats.totalWithProfile, icon: <Code2 className="w-5 h-5" />, color: 'bg-error/10 text-error' },
    { label: 'Solved Today', value: stats.solvedToday, icon: <Code2 className="w-5 h-5" />, color: 'bg-emerald-500/10 text-emerald-500' },
  ]

  const pieData = [
    { name: 'Easy', value: charts.difficultyDistribution.easy || 0, color: '#22C55E' },
    { name: 'Medium', value: charts.difficultyDistribution.medium || 0, color: '#F59E0B' },
    { name: 'Hard', value: charts.difficultyDistribution.hard || 0, color: '#EF4444' },
  ]

  const quickActions = [
    { label: 'Add Student', icon: <Plus className="w-4 h-4" />, onClick: () => navigate('/admin/students') },
    { label: 'Add Faculty', icon: <Plus className="w-4 h-4" />, onClick: () => navigate('/admin/faculty') },
    { label: 'Add Department', icon: <Plus className="w-4 h-4" />, onClick: () => navigate('/admin/departments') },
    { label: 'Create Batch', icon: <Plus className="w-4 h-4" />, onClick: () => navigate('/admin/batches') },
    { label: 'Create Section', icon: <Plus className="w-4 h-4" />, onClick: () => navigate('/admin/sections') },
    { label: 'Import CSV', icon: <FileSpreadsheet className="w-4 h-4" />, onClick: () => navigate('/admin/csv-import') },
    { label: 'Export Reports', icon: <Download className="w-4 h-4" />, onClick: () => navigate('/admin/reports') },
    { label: 'Send Alert', icon: <Send className="w-4 h-4" />, onClick: () => navigate('/admin/notifications') },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Console</h1>
          <p className="text-muted-foreground text-sm mt-1">Institutional LeetCode Performance Analytics & Management</p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          isLoading={syncMutation.isPending}
          className="gap-2 shrink-0 shadow-lg"
        >
          <RefreshCw className="w-4 h-4" /> Sync LeetCode Data
        </Button>
      </motion.div>

      {/* Quick Actions Panel */}
      <motion.div variants={itemVariants}>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">Quick Actions Portal</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="flex flex-col gap-2 h-20 bg-background hover:bg-muted"
                onClick={action.onClick}
              >
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                  {action.icon}
                </div>
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsRow.map((s) => (
          <div key={s.label} className="stat-card flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                {s.icon}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Main Charts row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Coding Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingUp className="w-4 h-4 text-primary" /> Daily Coding Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SolvedAreaChart data={charts.dailyActivity} xKey="day" yKey="solved" label="Problems Solved" height={240} />
          </CardContent>
        </Card>

        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BarChart3 className="w-4 h-4 text-primary" /> Department Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DifficultyBarChart
              data={charts.deptPerformance}
              xKey="dept"
              bars={[
                { key: 'easy', color: '#22C55E', label: 'Easy' },
                { key: 'medium', color: '#F59E0B', label: 'Medium' },
                { key: 'hard', color: '#EF4444', label: 'Hard' },
              ]}
              height={240}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Secondary Charts row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Difficulty Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Code2 className="w-4 h-4 text-primary" /> Solve Difficulty Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <DifficultyPieChart data={pieData} height={200} />
          </CardContent>
        </Card>

        {/* Contest Rating Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <BarChart3 className="w-4 h-4 text-primary" /> Contest Rating Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DifficultyBarChart
              data={charts.contestRatingDistribution}
              xKey="range"
              bars={[{ key: 'count', color: '#3B82F6', label: 'Students' }]}
              height={200}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* System Health */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="w-4 h-4 text-success" /> System Health & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'API Server', status: 'Online', ok: true },
              { label: 'Database', status: 'Connected', ok: true },
              { label: 'LeetCode Sync Engine', status: 'Running', ok: true },
              { label: 'Cron Scheduler', status: 'Active (Daily 2:00 AM)', ok: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 border border-border rounded-lg bg-slate-50/5">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.ok ? 'bg-success animate-pulse' : 'bg-error'}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-xs text-muted-foreground font-semibold">{item.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
