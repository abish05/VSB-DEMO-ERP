import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { adminService } from '@/services/admin.service'
import { getInitials, downloadCSV } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import {
  FileText, BarChart3, Download, RefreshCw, Filter,
  Search, Trophy, Users, TrendingUp, Zap, Activity,
  Eye, FileSpreadsheet, Printer, ChevronUp, ChevronDown,
  Star, Clock, CheckCircle2, XCircle, ChevronsLeft,
  ChevronsRight, ChevronLeft, ChevronRight, X,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { UserProfile } from '@/types'

const cv = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } }
const iv = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.32 } } }

// ─── Design tokens ────────────────────────────────────────────
const GOLD = '#F5B301'

// ─── Report Types ─────────────────────────────────────────────
const REPORT_TYPES = [
  { id: 'student-performance', label: 'Student Performance' },
  { id: 'contest-rating',      label: 'Contest Rating'      },
  { id: 'daily-activity',      label: 'Daily Activity'      },
  { id: 'placement-readiness', label: 'Placement Readiness' },
  { id: 'faculty-performance', label: 'Faculty Performance' },
]

// ─── Helpers ──────────────────────────────────────────────────
const fmt = (n?: number | null, decimals = 0) =>
  n != null ? Number(n).toFixed(decimals) : '0'

const placementScore = (r: any): number => {
  const lp = r.leetcodeProfile
  if (!lp) return 0
  const solved  = Math.min((lp.totalSolved   / 300) * 40, 40)
  const medium  = Math.min((lp.mediumSolved  / 100) * 20, 20)
  const hard    = Math.min((lp.hardSolved    / 30)  * 20, 20)
  const rating  = Math.min((lp.contestRating / 2000) * 20, 20)
  return Math.round(solved + medium + hard + rating)
}

// ─── Mini stat card ───────────────────────────────────────────
function SummaryCard({ label, value, sub, icon, accent }: {
  label: string; value: string | number; sub?: string
  icon: React.ReactNode; accent: string
}) {
  return (
    <div className="stat-card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export default function AdminReportsPage() {
  const { toast } = useToast()

  // ── State ────────────────────────────────────────────────────
  const [reportType,   setReportType]   = useState('student-performance')
  const [search,       setSearch]       = useState('')
  const [filterDept,   setFilterDept]   = useState('')
  const [filterYear,   setFilterYear]   = useState('')
  const [filterStatus, setFilterStatus] = useState<'' | 'active' | 'inactive'>('')
  const [filterMinRating, setFilterMinRating] = useState('')
  const [filterMaxRating, setFilterMaxRating] = useState('')
  const [showFilters,  setShowFilters]  = useState(false)
  const [sortKey,      setSortKey]      = useState<string>('totalSolved')
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('desc')
  const [page,         setPage]         = useState(1)
  const PAGE_SIZE = 15
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null)
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'analytics' | 'submissions'>('details')

  // ── Data fetching ─────────────────────────────────────────────
  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: () => adminService.getDepartments() })
  const { data: allUsersData, isLoading, refetch } = useQuery({
    queryKey: ['adminAllUsers'],
    queryFn: () => adminService.getUsers({ limit: 2000 }),
  })
  const allUsers: UserProfile[] = allUsersData?.data || []

  const students = useMemo(() => allUsers.filter(u => u.role === 'STUDENT'), [allUsers])
  const faculty = useMemo(() => allUsers.filter(u => u.role === 'FACULTY'), [allUsers])

  // ── Sync mutation ─────────────────────────────────────────────
  const syncMutation = useMutation({
    mutationFn: (id: string) => adminService.syncUser(id),
    onSuccess: () => toast({ title: 'Sync Triggered', description: 'LeetCode data sync started.' }),
    onError:   (e: any) => toast({ title: 'Sync Failed', description: e?.response?.data?.message, variant: 'destructive' }),
  })

  // ── Flatten rows ──────────────────────────────────────────────
  const rows = useMemo(() => students.map((s) => {
    const lp = s.leetcodeProfile
    return {
      id:            s.id,
      name:          s.name,
      email:         s.email,
      rollNo:        s.rollNo || '—',
      department:    s.department?.code || '—',
      year:          s.section?.batch?.year?.toString() || '—',
      section:       s.section?.name || '—',
      leetcode:      lp?.username || '—',
      totalSolved:   lp?.totalSolved        ?? 0,
      solvedToday:   lp?.dailySolvedCount   ?? 0,
      easy:          lp?.easySolved         ?? 0,
      medium:        lp?.mediumSolved       ?? 0,
      hard:          lp?.hardSolved         ?? 0,
      contestRating: lp?.contestRating      ?? 0,
      acceptance:    lp?.acceptanceRate     ?? 0,
      streak:        lp?.currentStreak      ?? 0,
      lastSynced:    lp?.lastSyncedAt
        ? new Date(lp.lastSyncedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit', hour:'2-digit', minute:'2-digit' })
        : '—',
      isActive:      (s as any).isActive !== false,
      placement:     placementScore(s),
      raw:           s,
    }
  }), [students])

  // ── Faculty Performance rows ───────────────────────────────────
  const facultyRows = useMemo(() => {
    return faculty.map((f) => {
      const managedStudents = students.filter(s => s.section?.faculty?.id === f.id)
      const totalStudents = managedStudents.length
      const linkedProfiles = managedStudents.filter(s => s.leetcodeProfile).length
      
      const totalSolved = managedStudents.reduce((sum, s) => sum + (s.leetcodeProfile?.totalSolved ?? 0), 0)
      const avgSolved = totalStudents > 0 ? (totalSolved / totalStudents).toFixed(1) : '0'
      
      const ratedStudentsCount = managedStudents.filter(s => (s.leetcodeProfile?.contestRating ?? 0) > 0).length
      const totalRatingSum = managedStudents.reduce((sum, s) => sum + (s.leetcodeProfile?.contestRating ?? 0), 0)
      const avgRating = ratedStudentsCount > 0 ? (totalRatingSum / ratedStudentsCount).toFixed(0) : '0'
      
      const sectionsSet = new Set(managedStudents.map(s => s.section?.name).filter(Boolean))
      const sectionsManaged = sectionsSet.size > 0 ? Array.from(sectionsSet).join(', ') : '—'
      
      return {
        id: f.id,
        name: f.name,
        email: f.email,
        employeeId: f.employeeId || '—',
        department: f.department?.code || '—',
        sections: sectionsManaged,
        totalStudents,
        linkedProfiles,
        avgSolved: Number(avgSolved),
        avgRating: Number(avgRating),
        activeRate: totalStudents > 0 ? Math.round((linkedProfiles / totalStudents) * 100) : 0,
      }
    })
  }, [faculty, students])

  // ── Reset Page & sort fields on Report Type change ────────────────
  useEffect(() => {
    setPage(1)
    if (reportType === 'faculty-performance') {
      setSortKey('totalStudents')
    } else {
      setSortKey('totalSolved')
    }
  }, [reportType])

  // ── Summary cards ─────────────────────────────────────────────
  const summary = useMemo(() => {
    const withProfile = rows.filter(r => r.leetcode !== '—')
    const totalSolved = rows.reduce((a, r) => a + r.totalSolved, 0)
    const solvedToday = rows.reduce((a, r) => a + r.solvedToday, 0)
    const avgSolved   = rows.length ? (totalSolved / rows.length).toFixed(1) : '0'
    const avgRating   = withProfile.length ? (withProfile.reduce((a, r) => a + r.contestRating, 0) / withProfile.length).toFixed(0) : '0'
    const avgAcc      = withProfile.length ? (withProfile.reduce((a, r) => a + r.acceptance, 0) / withProfile.length).toFixed(1) : '0'
    const top         = [...rows].sort((a, b) => b.totalSolved - a.totalSolved)[0]
    const highStreak  = Math.max(...rows.map(r => r.streak), 0)
    const active      = rows.filter(r => r.isActive).length
    return { totalSolved, solvedToday, avgSolved, avgRating, avgAcc, top, highStreak, active, withProfile: withProfile.length }
  }, [rows])

  // ── Filter + search (Students) ──────────────────────────────────
  const filtered = useMemo(() => {
    let d = [...rows]
    if (search) {
      const q = search.toLowerCase()
      d = d.filter(r => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.rollNo.toLowerCase().includes(q) || r.leetcode.toLowerCase().includes(q))
    }
    if (filterDept)   d = d.filter(r => r.department === filterDept)
    if (filterYear)   d = d.filter(r => r.year === filterYear)
    if (filterStatus === 'active')   d = d.filter(r => r.isActive)
    if (filterStatus === 'inactive') d = d.filter(r => !r.isActive)
    if (filterMinRating) d = d.filter(r => r.contestRating >= Number(filterMinRating))
    if (filterMaxRating) d = d.filter(r => r.contestRating <= Number(filterMaxRating))
    return d
  }, [rows, search, filterDept, filterYear, filterStatus, filterMinRating, filterMaxRating])

  // ── Filter + search (Faculty) ───────────────────────────────────
  const filteredFaculty = useMemo(() => {
    let list = [...facultyRows]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(f => f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q) || f.employeeId.toLowerCase().includes(q))
    }
    if (filterDept) {
      list = list.filter(f => f.department === filterDept)
    }
    return list
  }, [facultyRows, search, filterDept])

  // ── Sort Students ──────────────────────────────────────────────
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = (a as any)[sortKey], bv = (b as any)[sortKey]
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  // ── Sort Faculty ───────────────────────────────────────────────
  const sortedFaculty = useMemo(() => {
    return [...filteredFaculty].sort((a, b) => {
      const av = (a as any)[sortKey], bv = (b as any)[sortKey]
      const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filteredFaculty, sortKey, sortDir])

  const totalPages = reportType === 'faculty-performance'
    ? Math.max(1, Math.ceil(sortedFaculty.length / PAGE_SIZE))
    : Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))

  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const paginatedFaculty = sortedFaculty.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
    setPage(1)
  }

  const clearFilters = () => {
    setSearch(''); setFilterDept(''); setFilterYear(''); setFilterStatus(''); setFilterMinRating(''); setFilterMaxRating('')
    setPage(1)
  }

  const hasFilters = search || filterDept || filterYear || filterStatus || filterMinRating || filterMaxRating

  // ── Export helpers ────────────────────────────────────────────
  const exportRows = useMemo(() => {
    if (reportType === 'faculty-performance') {
      return sortedFaculty.map((f, i) => ({
        '#': i + 1,
        'Faculty Name': f.name,
        'Email': f.email,
        'Employee ID': f.employeeId,
        'Department': f.department,
        'Sections': f.sections,
        'Total Students': f.totalStudents,
        'Linked Profiles': f.linkedProfiles,
        'Active Rate %': `${f.activeRate}%`,
        'Avg Solved': f.avgSolved,
        'Avg Rating': f.avgRating,
      }))
    }
    return sorted.map((r, i) => ({
      '#':               i + 1,
      'Student Name':    r.name,
      'Email':           r.email,
      'Register No':     r.rollNo,
      'Department':      r.department,
      'Year':            r.year,
      'Section':         r.section,
      'LeetCode':        r.leetcode,
      'Total Solved':    r.totalSolved,
      'Solved Today':    r.solvedToday,
      'Easy':            r.easy,
      'Medium':          r.medium,
      'Hard':            r.hard,
      'Contest Rating':  r.contestRating,
      'Acceptance %':    r.acceptance.toFixed(1),
      'Daily Streak':    r.streak,
      'Last Synced':     r.lastSynced,
      'Status':          r.isActive ? 'Active' : 'Inactive',
      'Placement Score': r.placement,
    }))
  }, [reportType, sorted, sortedFaculty])

  const handleExcelExport = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(exportRows)
      const wb = XLSX.utils.book_new()
      const sheetName = reportType === 'faculty-performance' ? 'Faculty Performance' : 'Students'
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
      XLSX.writeFile(wb, `vsb_report_${reportType}_${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast({ title: 'Excel Exported', description: `${exportRows.length} records downloaded.` })
    } catch {
      toast({ title: 'Export Failed', variant: 'destructive' })
    }
  }

  const handleCSVExport = () => {
    downloadCSV(exportRows, `vsb_report_${reportType}_${new Date().toISOString().slice(0, 10)}`)
    toast({ title: 'CSV Exported', description: `${exportRows.length} records downloaded.` })
  }

  const handlePDFExport = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      doc.setFontSize(16)
      
      if (reportType === 'faculty-performance') {
        doc.text('VSB LeetCode Analytics – Faculty Performance Report', 14, 14)
        doc.setFontSize(9)
        doc.text(`Generated: ${new Date().toLocaleString()} | Total: ${sortedFaculty.length} faculty members`, 14, 20)
        
        autoTable(doc, {
          startY: 26,
          head: [['#', 'Faculty Name', 'Email', 'Dept', 'Employee ID', 'Sections', 'Students', 'Linked', 'Active %', 'Avg Solved', 'Avg Rating']],
          body: sortedFaculty.map((f, i) => [
            i + 1, f.name, f.email, f.department,
            f.employeeId, f.sections, f.totalStudents,
            f.linkedProfiles, `${f.activeRate}%`, f.avgSolved, f.avgRating
          ]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [245, 179, 1], textColor: [17, 24, 39] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
        })
      } else {
        doc.text('VSB LeetCode Analytics – Student Performance Report', 14, 14)
        doc.setFontSize(9)
        doc.text(`Generated: ${new Date().toLocaleString()} | Total: ${sorted.length} students`, 14, 20)
        
        autoTable(doc, {
          startY: 26,
          head: [['#', 'Name', 'Email', 'Dept', 'Total', 'Easy', 'Med', 'Hard', 'Rating', 'Acc%', 'Streak', 'Status']],
          body: sorted.map((r, i) => [
            i + 1, r.name, r.email, r.department,
            r.totalSolved, r.easy, r.medium, r.hard,
            r.contestRating, r.acceptance.toFixed(1), r.streak,
            r.isActive ? 'Active' : 'Inactive',
          ]),
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [245, 179, 1], textColor: [17, 24, 39] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
        })
      }
      
      doc.save(`vsb_report_${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`)
      toast({ title: 'PDF Exported', description: `${exportRows.length} records downloaded.` })
    } catch {
      toast({ title: 'PDF Export Failed', variant: 'destructive' })
    }
  }

  const handlePrint = () => window.print()

  // ── Sortable column header ────────────────────────────────────
  const SortTh = ({ label, k }: { label: string; k: string }) => (
    <th
      className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none whitespace-nowrap"
      onClick={() => handleSort(k)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === k
          ? sortDir === 'asc'
            ? <ChevronUp className="w-3 h-3 text-primary" />
            : <ChevronDown className="w-3 h-3 text-primary" />
          : <ChevronUp className="w-3 h-3 opacity-20" />}
      </div>
    </th>
  )

  // ── Department years ──────────────────────────────────────────
  const years = useMemo(() => [...new Set(rows.map(r => r.year).filter(y => y !== '—'))].sort(), [rows])
  const deptCodes = depts?.map(d => d.code) || []

  return (
    <motion.div variants={cv} initial="hidden" animate="show" className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div variants={iv} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports Console</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Comprehensive student analytics &amp; institutional performance metrics
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExcelExport}>
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleCSVExport}>
            <Download className="w-3.5 h-3.5 text-blue-500" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handlePDFExport}>
            <FileText className="w-3.5 h-3.5 text-red-500" /> PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
          <Button size="sm" className="gap-2" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </motion.div>

      {/* ── Report Type Tabs ─────────────────────────────────────── */}
      <motion.div variants={iv} className="flex gap-1 bg-card border border-border rounded-xl p-1 w-fit flex-wrap">
        {REPORT_TYPES.map(rt => (
          <button
            key={rt.id}
            onClick={() => setReportType(rt.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={reportType === rt.id
              ? { background: GOLD, color: '#111827' }
              : { color: 'var(--muted-foreground)', background: 'transparent' }
            }
          >
            {rt.label}
          </button>
        ))}
      </motion.div>

      {/* ── Summary Cards ─────────────────────────────────────────── */}
      <motion.div variants={iv} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <SummaryCard label="Total Students"    value={rows.length}            icon={<Users       className="w-5 h-5" />} accent="bg-primary/10 text-primary" />
        <SummaryCard label="Active Students"   value={summary.active}         icon={<CheckCircle2 className="w-5 h-5"/>} accent="bg-success/10 text-success" />
        <SummaryCard label="Solved Today"      value={summary.solvedToday}    icon={<Zap          className="w-5 h-5"/>} accent="bg-yellow-500/10 text-yellow-500" />
        <SummaryCard label="Total Problems"    value={summary.totalSolved.toLocaleString()} icon={<Activity className="w-5 h-5"/>} accent="bg-blue-500/10 text-blue-500" />
        <SummaryCard label="Avg / Student"     value={summary.avgSolved}      icon={<BarChart3    className="w-5 h-5"/>} accent="bg-indigo-500/10 text-indigo-500" />
        <SummaryCard label="Avg Contest Rating" value={summary.avgRating}     icon={<TrendingUp   className="w-5 h-5"/>} accent="bg-orange-500/10 text-orange-500" />
        <SummaryCard label="Avg Acceptance %"   value={`${summary.avgAcc}%`}  icon={<Star         className="w-5 h-5"/>} accent="bg-teal-500/10 text-teal-500" />
        <SummaryCard label="Highest Streak"     value={`${summary.highStreak}d`} icon={<Trophy   className="w-5 h-5"/>} accent="bg-amber-500/10 text-amber-500" />
        <SummaryCard label="Linked Profiles"    value={summary.withProfile}   icon={<FileText     className="w-5 h-5"/>} accent="bg-violet-500/10 text-violet-500" />
        <SummaryCard
          label="Top Performer"
          value={summary.top?.name.split(' ')[0] || '—'}
          sub={summary.top ? `${summary.top.totalSolved} problems` : ''}
          icon={<Trophy className="w-5 h-5" />}
          accent="bg-primary/10 text-primary"
        />
      </motion.div>

      {/* ── Filter bar ────────────────────────────────────────────── */}
      <motion.div variants={iv} className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search name, email, register no, LeetCode..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasFilters && (
              <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: GOLD, color: '#111827' }}>
                {[filterDept, filterYear, filterStatus, filterMinRating, filterMaxRating].filter(Boolean).length}
              </span>
            )}
          </Button>

          {hasFilters && (
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={clearFilters}>
              <X className="w-3.5 h-3.5" /> Clear
            </Button>
          )}

          <span className="text-xs text-muted-foreground ml-auto">
            {reportType === 'faculty-performance'
              ? `${sortedFaculty.length} of ${facultyRows.length} faculty`
              : `${sorted.length} of ${rows.length} students`}
          </span>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 bg-card border border-border rounded-xl"
          >
            {/* Department */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Department</label>
              <select
                value={filterDept}
                onChange={e => { setFilterDept(e.target.value); setPage(1) }}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
              >
                <option value="">All Departments</option>
                {deptCodes.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Year</label>
              <select
                value={filterYear}
                onChange={e => { setFilterYear(e.target.value); setPage(1) }}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
              >
                <option value="">All Years</option>
                {years.map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Status</label>
              <select
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value as any); setPage(1) }}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
              >
                <option value="">All Students</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Min Rating */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Min Rating</label>
              <input
                type="number"
                value={filterMinRating}
                onChange={e => { setFilterMinRating(e.target.value); setPage(1) }}
                placeholder="e.g. 1400"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Max Rating */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Max Rating</label>
              <input
                type="number"
                value={filterMaxRating}
                onChange={e => { setFilterMaxRating(e.target.value); setPage(1) }}
                placeholder="e.g. 2000"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Report type (repeated for convenience) */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Report Type</label>
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
              >
                {REPORT_TYPES.map(rt => <option key={rt.id} value={rt.id}>{rt.label}</option>)}
              </select>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ── Data Table ────────────────────────────────────────────── */}
      <motion.div variants={iv}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4 text-primary" />
                {REPORT_TYPES.find(r => r.id === reportType)?.label} — {reportType === 'faculty-performance' ? sortedFaculty.length : sorted.length} Records
              </CardTitle>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Loading skeleton */}
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <div key={j} className="h-4 rounded bg-muted animate-pulse flex-1" />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  {reportType === 'faculty-performance' ? (
                    <>
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">#</th>
                          <SortTh label="Faculty" k="name" />
                          <SortTh label="Dept" k="department" />
                          <SortTh label="Employee ID" k="employeeId" />
                          <SortTh label="Sections" k="sections" />
                          <SortTh label="Total Students" k="totalStudents" />
                          <SortTh label="Linked Profiles" k="linkedProfiles" />
                          <SortTh label="Active Rate %" k="activeRate" />
                          <SortTh label="Avg Solved" k="avgSolved" />
                          <SortTh label="Avg Rating" k="avgRating" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginatedFaculty.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="px-4 py-16 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <FileText className="w-10 h-10 text-muted-foreground/30" />
                                <p className="text-muted-foreground text-sm font-medium">No faculty members found</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginatedFaculty.map((f, i) => (
                            <tr key={f.id} className="hover:bg-accent/30 transition-colors group">
                              <td className="px-3 py-3 text-xs text-muted-foreground font-mono">
                                {(page - 1) * PAGE_SIZE + i + 1}
                              </td>
                              <td className="px-3 py-3 font-semibold text-foreground">
                                <div>
                                  <p className="font-semibold text-sm leading-tight">{f.name}</p>
                                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">{f.email}</p>
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <Badge variant="secondary" className="text-xs font-semibold">{f.department}</Badge>
                              </td>
                              <td className="px-3 py-3 font-mono text-xs">{f.employeeId}</td>
                              <td className="px-3 py-3 font-medium text-xs">{f.sections}</td>
                              <td className="px-3 py-3 text-center text-sm font-semibold">{f.totalStudents}</td>
                              <td className="px-3 py-3 text-center text-sm">{f.linkedProfiles}</td>
                              <td className="px-3 py-3 text-center">
                                <Badge variant={f.activeRate >= 80 ? 'success' : f.activeRate >= 50 ? 'warning' : 'error'} className="text-xs">
                                  {f.activeRate}%
                                </Badge>
                              </td>
                              <td className="px-3 py-3 text-center font-bold text-sm text-primary">{f.avgSolved}</td>
                              <td className="px-3 py-3 text-center font-bold text-sm text-warning">{f.avgRating}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </>
                  ) : (
                    <>
                      <thead>
                        <tr className="border-b border-border bg-muted/40">
                          <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-10">#</th>
                          <SortTh label="Student"        k="name"          />
                          <SortTh label="Dept"           k="department"    />
                          <SortTh label="Year"           k="year"          />
                          <SortTh label="Section"        k="section"       />
                          <SortTh label="LeetCode"       k="leetcode"      />
                          <SortTh label="Total"          k="totalSolved"   />
                          <SortTh label="Today"          k="solvedToday"   />
                          <SortTh label="Easy"           k="easy"          />
                          <SortTh label="Medium"         k="medium"        />
                          <SortTh label="Hard"           k="hard"          />
                          <SortTh label="Rating"         k="contestRating" />
                          <SortTh label="Acc %"          k="acceptance"    />
                          <SortTh label="Streak"         k="streak"        />
                          {reportType === 'placement-readiness' && <SortTh label="Placement" k="placement" />}
                          <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Sync</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginated.length === 0 ? (
                          <tr>
                            <td colSpan={20} className="px-4 py-16 text-center">
                              <div className="flex flex-col items-center gap-3">
                                <FileText className="w-10 h-10 text-muted-foreground/30" />
                                <p className="text-muted-foreground text-sm font-medium">No students match your filters</p>
                                <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear all filters</button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          paginated.map((r, i) => (
                            <tr key={r.id} className="hover:bg-accent/30 transition-colors group">
                              {/* # */}
                              <td className="px-3 py-3 text-xs text-muted-foreground font-mono">
                                {(page - 1) * PAGE_SIZE + i + 1}
                              </td>

                              {/* Student */}
                              <td className="px-3 py-3 min-w-[180px]">
                                <div className="flex items-center gap-2.5">
                                  <Avatar fallback={getInitials(r.name)} size="sm" />
                                  <div>
                                    <p className="font-semibold text-sm leading-tight">{r.name}</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[160px]">{r.email}</p>
                                    {r.rollNo !== '—' && (
                                      <p className="text-xs font-mono text-muted-foreground/60">{r.rollNo}</p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Dept */}
                              <td className="px-3 py-3">
                                <Badge variant="secondary" className="text-xs font-semibold">{r.department}</Badge>
                              </td>

                              {/* Year */}
                              <td className="px-3 py-3 text-xs text-center font-medium">{r.year}</td>

                              {/* Section */}
                              <td className="px-3 py-3 text-xs text-center">{r.section}</td>

                              {/* LeetCode */}
                              <td className="px-3 py-3">
                                {r.leetcode !== '—' ? (
                                  <a
                                    href={`https://leetcode.com/${r.leetcode}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-mono font-semibold hover:underline"
                                    style={{ color: GOLD }}
                                  >
                                    {r.leetcode}
                                  </a>
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">Unlinked</span>
                                )}
                              </td>

                              {/* Total Solved */}
                              <td className="px-3 py-3 text-center">
                                <span className="font-bold text-sm">{r.totalSolved}</span>
                              </td>

                              {/* Today */}
                              <td className="px-3 py-3 text-center">
                                <span className={`text-xs font-bold ${r.solvedToday > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                                  {r.solvedToday > 0 ? `+${r.solvedToday}` : '0'}
                                </span>
                              </td>

                              {/* Easy */}
                              <td className="px-3 py-3 text-center">
                                <span className="text-xs font-semibold text-emerald-500">{r.easy}</span>
                              </td>

                              {/* Medium */}
                              <td className="px-3 py-3 text-center">
                                <span className="text-xs font-semibold text-amber-500">{r.medium}</span>
                              </td>

                              {/* Hard */}
                              <td className="px-3 py-3 text-center">
                                <span className="text-xs font-semibold text-red-500">{r.hard}</span>
                              </td>

                              {/* Contest Rating */}
                              <td className="px-3 py-3 text-center">
                                {r.contestRating > 0 ? (
                                  <span className="text-xs font-bold" style={{ color: GOLD }}>{r.contestRating}</span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>

                              {/* Acceptance */}
                              <td className="px-3 py-3 text-center">
                                <span className="text-xs">{fmt(r.acceptance, 1)}%</span>
                              </td>

                              {/* Streak */}
                              <td className="px-3 py-3 text-center">
                                {r.streak > 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500">
                                    🔥 {r.streak}d
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>

                              {/* Placement score (conditional) */}
                              {reportType === 'placement-readiness' && (
                                <td className="px-3 py-3 text-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-sm font-bold">{r.placement}%</span>
                                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                          width: `${r.placement}%`,
                                          background: r.placement >= 70 ? '#22C55E' : r.placement >= 40 ? GOLD : '#EF4444',
                                        }}
                                      />
                                    </div>
                                  </div>
                                </td>
                              )}

                              {/* Last Sync */}
                              <td className="px-3 py-3">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">{r.lastSynced}</span>
                              </td>

                              {/* Status */}
                              <td className="px-3 py-3">
                                {r.isActive ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                                    <CheckCircle2 className="w-3 h-3" /> Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-error">
                                    <XCircle className="w-3 h-3" /> Inactive
                                  </span>
                                )}
                              </td>

                              {/* Row Actions */}
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                  <button
                                    title="View Details"
                                    onClick={() => { setSelectedStudent(r); setActiveModalTab('details') }}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    title="View Analytics"
                                    onClick={() => { setSelectedStudent(r); setActiveModalTab('analytics') }}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-blue-500 hover:text-blue-600"
                                  >
                                    <BarChart3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    title="Sync LeetCode Data"
                                    onClick={() => r.leetcode !== '—' && syncMutation.mutate(r.id)}
                                    disabled={r.leetcode === '—' || syncMutation.isPending}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-success hover:text-success/80 disabled:opacity-30"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    title="Download Report"
                                    onClick={() => downloadCSV([exportRows[(page-1)*PAGE_SIZE+i]], `${r.name.replace(/ /g,'_')}_report`)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-primary hover:text-primary-hover"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </>
                  )}
                </table>
              </div>
            )}

            {/* ── Pagination ──────────────────────────────────────── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {Math.min((page - 1) * PAGE_SIZE + 1, reportType === 'faculty-performance' ? sortedFaculty.length : sorted.length)}–{Math.min(page * PAGE_SIZE, reportType === 'faculty-performance' ? sortedFaculty.length : sorted.length)} of {reportType === 'faculty-performance' ? sortedFaculty.length : sorted.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(1)} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors">
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className="w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors"
                          style={p === page ? { background: GOLD, color: '#111827' } : {}}
                        >
                          {p}
                        </button>
                      )
                    })}
                  </div>
                  <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted disabled:opacity-30 transition-colors">
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Student Details & Analytics Modal ──────────────────────── */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card border border-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Profile Header */}
              <div className="p-6 border-b border-border bg-muted/20 flex gap-4 items-center">
                <Avatar fallback={getInitials(selectedStudent.name)} size="lg" className="w-16 h-16 border-2 border-primary/20" />
                <div>
                  <h2 className="text-xl font-bold text-foreground leading-snug">{selectedStudent.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedStudent.email} · Reg No: {selectedStudent.rollNo}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs font-semibold">{selectedStudent.department}</Badge>
                    <Badge variant="outline" className="text-xs">Class {selectedStudent.section}</Badge>
                    <Badge variant="outline" className="text-xs">Year {selectedStudent.year}</Badge>
                  </div>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-border px-6 bg-muted/10">
                {(['details', 'analytics', 'submissions'] as const).map((tabName) => (
                  <button
                    key={tabName}
                    onClick={() => setActiveModalTab(tabName)}
                    className="py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all"
                    style={{
                      borderColor: activeModalTab === tabName ? GOLD : 'transparent',
                      color: activeModalTab === tabName ? 'var(--foreground)' : 'var(--muted-foreground)',
                    }}
                  >
                    {tabName}
                  </button>
                ))}
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* DETAILS TAB */}
                {activeModalTab === 'details' && (
                  <div className="space-y-6">
                    {/* LeetCode Sync Overview */}
                    <div className="bg-muted/30 border border-border p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">LeetCode Profile</p>
                        {selectedStudent.leetcode !== '—' ? (
                          <a
                            href={`https://leetcode.com/${selectedStudent.leetcode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base font-semibold hover:underline mt-1 block"
                            style={{ color: GOLD }}
                          >
                            {selectedStudent.leetcode} ↗
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground italic mt-1 block">Not Linked</span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Last Sync</p>
                        <p className="text-xs font-medium text-foreground mt-1">{selectedStudent.lastSynced}</p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-3 bg-muted/20 border border-border rounded-xl text-center">
                        <p className="text-xs text-muted-foreground font-semibold">Total Solved</p>
                        <p className="text-2xl font-bold mt-1 text-foreground">{selectedStudent.totalSolved}</p>
                      </div>
                      <div className="p-3 bg-muted/20 border border-border rounded-xl text-center">
                        <p className="text-xs text-muted-foreground font-semibold">Current Streak</p>
                        <p className="text-2xl font-bold mt-1 text-orange-500">🔥 {selectedStudent.streak}d</p>
                      </div>
                      <div className="p-3 bg-muted/20 border border-border rounded-xl text-center">
                        <p className="text-xs text-muted-foreground font-semibold">Contest Rating</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: GOLD }}>
                          {selectedStudent.contestRating > 0 ? selectedStudent.contestRating : '—'}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/20 border border-border rounded-xl text-center">
                        <p className="text-xs text-muted-foreground font-semibold">Acceptance Rate</p>
                        <p className="text-2xl font-bold mt-1 text-foreground">{selectedStudent.acceptance.toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Solve Counts Bars */}
                    <div className="space-y-3 bg-muted/10 border border-border p-4 rounded-xl">
                      <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2">Difficulty Split</h4>
                      
                      {/* Easy */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-emerald-500 font-semibold">Easy</span>
                          <span className="text-foreground">{selectedStudent.easy} solved</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${selectedStudent.totalSolved > 0 ? (selectedStudent.easy / selectedStudent.totalSolved) * 100 : 0}%` }} />
                        </div>
                      </div>

                      {/* Medium */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-amber-500 font-semibold">Medium</span>
                          <span className="text-foreground">{selectedStudent.medium} solved</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${selectedStudent.totalSolved > 0 ? (selectedStudent.medium / selectedStudent.totalSolved) * 100 : 0}%` }} />
                        </div>
                      </div>

                      {/* Hard */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-red-500 font-semibold">Hard</span>
                          <span className="text-foreground">{selectedStudent.hard} solved</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${selectedStudent.totalSolved > 0 ? (selectedStudent.hard / selectedStudent.totalSolved) * 100 : 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ANALYTICS TAB */}
                {activeModalTab === 'analytics' && (
                  <div className="space-y-6">
                    {/* Placement readiness gauge */}
                    <div className="bg-muted/10 border border-border p-6 rounded-xl text-center space-y-4">
                      <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Placement Readiness Prediction</h4>
                      <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="64" cy="64" r="54" strokeWidth="8" stroke="currentColor" className="text-muted/20" fill="transparent" />
                          <circle
                            cx="64"
                            cy="64"
                            r="54"
                            strokeWidth="8"
                            stroke={selectedStudent.placement >= 70 ? '#22C55E' : selectedStudent.placement >= 40 ? GOLD : '#EF4444'}
                            strokeDasharray={339.29}
                            strokeDashoffset={339.29 - (339.29 * selectedStudent.placement) / 100}
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </svg>
                        <div className="absolute text-center">
                          <p className="text-3xl font-extrabold text-foreground">{selectedStudent.placement}%</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Score</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Based on dynamic programming, array algorithms, contest rating threshold, and solved problem difficulty counts.
                      </p>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-success/5 border border-success/20 p-4 rounded-xl space-y-2">
                        <h5 className="text-xs uppercase font-bold text-success tracking-wider">Identified Strengths</h5>
                        <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                          <li>Strong consistency (Streak: {selectedStudent.streak} days)</li>
                          {selectedStudent.totalSolved > 150 && <li>High practice volume ({selectedStudent.totalSolved} solved)</li>}
                          {selectedStudent.medium + selectedStudent.hard > 50 && <li>Healthy Medium/Hard solving ratio</li>}
                        </ul>
                      </div>
                      <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl space-y-2">
                        <h5 className="text-xs uppercase font-bold text-red-500 tracking-wider">Weak Areas & Focus</h5>
                        <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                          {selectedStudent.contestRating === 0 && <li>Needs contest attendance / contest rating tracking</li>}
                          {selectedStudent.hard === 0 && <li>Try attempting 5 Hard Level problems to challenge depth</li>}
                          {selectedStudent.medium / (selectedStudent.totalSolved || 1) < 0.3 && <li>Focus on increasing Medium level algorithm solving</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBMISSIONS TAB */}
                {activeModalTab === 'submissions' && (
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Recent Submissions (Linked Profile)</h4>
                    {selectedStudent.raw.leetcodeProfile?.recentSubmissions && selectedStudent.raw.leetcodeProfile.recentSubmissions.length > 0 ? (
                      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border bg-muted/10">
                        {selectedStudent.raw.leetcodeProfile.recentSubmissions.map((sub: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center p-3 text-xs">
                            <div>
                              <p className="font-semibold text-foreground">{sub.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Lang: <span className="font-mono">{sub.lang}</span></p>
                            </div>
                            <div className="text-right">
                              <Badge variant={sub.statusDisplay === 'Accepted' ? 'success' : 'error'} className="text-[10px] font-semibold">
                                {sub.statusDisplay}
                              </Badge>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {new Date(Number(sub.timestamp) * 1000).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 border border-dashed border-border rounded-xl text-center text-muted-foreground text-xs">
                        No recent submission log synced for this user.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-muted/20 border-t border-border flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedStudent(null)}>Close Info</Button>
                <Button
                  size="sm"
                  style={{ background: GOLD, color: '#111827' }}
                  onClick={() => {
                    if (selectedStudent.leetcode !== '—') {
                      syncMutation.mutate(selectedStudent.id)
                      setSelectedStudent(null)
                    }
                  }}
                  disabled={selectedStudent.leetcode === '—'}
                >
                  Force Profile Sync
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Report Metadata Footer ────────────────────────────────── */}
      <motion.div variants={iv}>
        <div className="flex items-center justify-between text-xs text-muted-foreground border border-border rounded-xl px-4 py-3 bg-card">
          <div className="flex items-center gap-4">
            <span>📅 Report generated: <strong>{new Date().toLocaleString('en-IN')}</strong></span>
            <span>📊 Total records: <strong>{rows.length}</strong></span>
            <span>✅ Filtered: <strong>{sorted.length}</strong></span>
          </div>
          <span>VSB Engineering College · LeetCode Analytics Platform</span>
        </div>
      </motion.div>

    </motion.div>
  )
}
