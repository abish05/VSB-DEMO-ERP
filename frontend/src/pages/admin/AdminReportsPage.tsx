import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/tables/DataTable'
import { adminService } from '@/services/admin.service'
import { FileText, BarChart3, Search, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('solve-count')
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  // Query reports data
  const { data: reportData = [], isLoading, refetch } = useQuery({
    queryKey: ['adminReports', reportType],
    queryFn: () => adminService.generateReport(reportType, {}),
  })

  // We can format/filter the reports based on the type
  const formattedData = reportData.map((item: any) => ({
    name: item.name,
    email: item.email,
    solved: item.solved || 0,
    solvedToday: item.solvedToday || 0,
    easy: item.easy || 0,
    medium: item.medium || 0,
    hard: item.hard || 0,
    rating: item.rating || 0,
  }))

  const getColumns = () => {
    const baseCols = [
      { key: 'name', label: 'Student Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
    ]

    if (reportType === 'solve-count') {
      return [
        ...baseCols,
        { key: 'solved', label: 'Total Solved', sortable: true, render: (r: any) => <span className="font-bold text-foreground">{r.solved}</span> },
        { 
          key: 'solvedToday', 
          label: 'Solved Today', 
          sortable: true, 
          render: (r: any) => (
            <span className={r.solvedToday > 0 ? "font-bold text-success" : "text-muted-foreground"}>
              {r.solvedToday > 0 ? `+${r.solvedToday}` : r.solvedToday}
            </span>
          ) 
        },
        { key: 'easy', label: 'Easy Solved', sortable: true, render: (r: any) => <span className="text-success">{r.easy}</span> },
        { key: 'medium', label: 'Medium Solved', sortable: true, render: (r: any) => <span className="text-warning">{r.medium}</span> },
        { key: 'hard', label: 'Hard Solved', sortable: true, render: (r: any) => <span className="text-error">{r.hard}</span> },
      ]
    }

    // contest-ratings
    return [
      ...baseCols,
      { key: 'rating', label: 'Contest Rating', sortable: true, render: (r: any) => <span className="font-semibold text-primary">{r.rating.toFixed(0)}</span> },
      { key: 'solved', label: 'Total Solved', sortable: true },
    ]
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports Console</h1>
          <p className="text-muted-foreground text-sm mt-1">Compile institutional metrics and LeetCode performance logs</p>
        </div>

        <div className="flex gap-2 bg-background p-1 border border-border rounded-lg">
          <Button
            variant={reportType === 'solve-count' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setReportType('solve-count')}
            className="h-8 text-xs"
          >
            Problems Solved Report
          </Button>
          <Button
            variant={reportType === 'contest-rating' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setReportType('contest-rating')}
            className="h-8 text-xs"
          >
            Contest Ratings Report
          </Button>
        </div>
      </motion.div>

      {/* Quick Summary card */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Report Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Target Group</label>
              <select className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs text-muted-foreground">
                <option>All Enrolled Students</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Activity Threshold</label>
              <select className="w-full bg-background border border-border rounded-lg h-9 px-3 text-xs text-muted-foreground">
                <option>All Active Users</option>
              </select>
            </div>

            <Button onClick={() => refetch()} className="w-full h-9 text-xs gap-2 mt-2" disabled={isLoading}>
              <Search className="w-3.5 h-3.5" /> Compile Fresh Report
            </Button>
            
            <Button 
              onClick={async () => {
                try {
                  setIsExporting(true)
                  await adminService.exportExcelReport()
                  toast({ title: 'Export Successful', description: 'Excel report downloaded.' })
                } catch (err) {
                  toast({ title: 'Export Failed', description: 'Failed to generate Excel report.', variant: 'destructive' })
                } finally {
                  setIsExporting(false)
                }
              }} 
              variant="secondary" 
              className="w-full h-9 text-xs gap-2 mt-2"
              disabled={isExporting}
            >
              <Download className="w-3.5 h-3.5" /> {isExporting ? 'Exporting...' : 'Export to Excel'}
            </Button>
          </CardContent>
        </Card>

        {/* Display Table */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Compiled Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={formattedData}
              isLoading={isLoading}
              columns={getColumns()}
              exportFilename={`vsb_leetcode_${reportType}`}
              pageSize={15}
            />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
