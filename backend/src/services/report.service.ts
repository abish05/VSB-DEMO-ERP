import ExcelJS from 'exceljs'
import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Score calculation helper ───────────────────────────────────
function calcScore(lp: {
  totalSolved: number
  contestRating: number
  currentStreak: number
  totalContestsParticipated: number
} | null) {
  if (!lp) return { lcScore: 0, totalScore: 0, classification: 'No Profile' }

  // LC score: weighted sum (0-100 scale)
  const solvedScore = Math.min((lp.totalSolved / 500) * 50, 50)
  const ratingScore = Math.min(((lp.contestRating - 1200) / 1800) * 30, 30)
  const streakScore = Math.min((lp.currentStreak / 30) * 10, 10)
  const contestScore = Math.min((lp.totalContestsParticipated / 20) * 10, 10)
  const lcScore = Math.round(solvedScore + ratingScore + streakScore + contestScore)
  const totalScore = lcScore

  let classification = 'Needs Improvement'
  if (lcScore >= 80) classification = 'Excellent'
  else if (lcScore >= 60) classification = 'Good'
  else if (lcScore >= 40) classification = 'Average'

  return { lcScore, totalScore, classification }
}

// ─── Style helpers ───────────────────────────────────────────────
function applyHeaderStyle(row: ExcelJS.Row, color = '2563EB') {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${color}` } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
    }
  })
  row.height = 30
}

function applyDataRowStyle(row: ExcelJS.Row, isEven: boolean) {
  row.eachCell((cell) => {
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false }
    cell.font = { size: 9 }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' },
    }
    cell.border = {
      bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
      right: { style: 'hair', color: { argb: 'FFE2E8F0' } },
    }
  })
  row.height = 18
}

function applyClassificationStyle(cell: ExcelJS.Cell, classification: string) {
  const colors: Record<string, string> = {
    Excellent: 'FF22C55E',
    Good: 'FF3B82F6',
    Average: 'FFF59E0B',
    'Needs Improvement': 'FFEF4444',
    'No Profile': 'FF94A3B8',
  }
  cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } }
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: colors[classification] || 'FF94A3B8' },
  }
  cell.alignment = { horizontal: 'center', vertical: 'middle' }
}

// ─── Main report generator ───────────────────────────────────────
export async function generateExcelReport(): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'VSB LeetCode ERP'
  wb.lastModifiedBy = 'VSB Admin'
  wb.created = new Date()
  wb.modified = new Date()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // ─── Fetch all data ──────────────────────────────────────────
  const [students, faculty, todayActivity, allActivity] = await Promise.all([
    prisma.user.findMany({
      where: { role: Role.STUDENT },
      include: {
        department: true,
        section: { include: { batch: true } },
        leetcodeProfile: true,
      },
      orderBy: [{ department: { code: 'asc' } }, { name: 'asc' }],
    }),
    prisma.user.findMany({
      where: { role: Role.FACULTY },
      include: {
        department: true,
        leetcodeProfile: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.dailyActivity.findMany({
      where: { date: { gte: todayStart } },
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { solved: 'desc' },
    }),
    prisma.dailyActivity.findMany({
      orderBy: [{ userId: 'asc' }, { date: 'desc' }],
      include: { user: { select: { name: true, email: true, role: true } } },
    }),
  ])

  // Build today solved map
  const todaySolvedMap: Record<string, number> = {}
  todayActivity.forEach(a => {
    todaySolvedMap[a.userId] = (todaySolvedMap[a.userId] || 0) + a.solved
  })

  const totalStudents = students.length
  const activeStudents = students.filter(s => s.leetcodeProfile).length
  const avgScore = students.length
    ? Math.round(
        students.reduce((sum, s) => sum + calcScore(s.leetcodeProfile).lcScore, 0) / students.length * 100
      ) / 100
    : 0

  // ════════════════════════════════════════════════
  // SHEET 1: Summary
  // ════════════════════════════════════════════════
  const summarySheet = wb.addWorksheet('Summary')
  summarySheet.properties.defaultRowHeight = 20

  // Title banner
  summarySheet.mergeCells('A1:B1')
  const titleCell = summarySheet.getCell('A1')
  titleCell.value = 'VSB College — CodePulse Report'
  titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  summarySheet.getRow(1).height = 36

  summarySheet.mergeCells('A2:B2')
  const subtitleCell = summarySheet.getCell('A2')
  subtitleCell.value = `LeetCode Performance Analytics — ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`
  subtitleCell.font = { size: 10, color: { argb: 'FFFFFFFF' } }
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  summarySheet.getRow(2).height = 22

  summarySheet.addRow([])

  // Header row
  const summaryHeader = summarySheet.addRow(['Metric', 'Value'])
  applyHeaderStyle(summaryHeader)

  const summaryRows = [
    ['Total Users', totalStudents + faculty.length],
    ['Total Students', totalStudents],
    ['Total Faculty', faculty.length],
    ['Active Users (with LeetCode)', activeStudents],
    ['Average Score', avgScore],
    ['Problems Solved Today', Object.values(todaySolvedMap).reduce((a, b) => a + b, 0)],
    ['Report Generated', now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'],
  ]
  summaryRows.forEach(([metric, value], i) => {
    const row = summarySheet.addRow([metric, value])
    applyDataRowStyle(row, i % 2 === 0)
    row.getCell(1).font = { bold: true, size: 9 }
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
  })

  summarySheet.getColumn('A').width = 32
  summarySheet.getColumn('B').width = 28

  // ════════════════════════════════════════════════
  // SHEET 2: Students
  // ════════════════════════════════════════════════
  const studentSheet = wb.addWorksheet('Students')
  studentSheet.properties.defaultRowHeight = 18

  const studentHeaders = [
    'Name', 'Email', 'Reg No', 'Year', 'Section',
    'LeetCode Username', 'Total Solved', 'Easy', 'Medium', 'Hard',
    'Solved Today', 'Contest Rating', 'Streak', 'SM Contests',
    'Total Score', 'LC Score', 'Classification', 'Department',
  ]
  const studentHeaderRow = studentSheet.addRow(studentHeaders)
  applyHeaderStyle(studentHeaderRow, '1D4ED8')

  students.forEach((s, i) => {
    const lp = s.leetcodeProfile
    const { lcScore, totalScore, classification } = calcScore(lp)
    const solvedToday = todaySolvedMap[s.id] || 0
    const batchName = s.section?.batch?.name || '—'
    const yearMatch = batchName.match(/(\d{4})-\d{2}/)
    const year = yearMatch ? `${parseInt(yearMatch[1]) + 1}` : '—'

    const row = studentSheet.addRow([
      s.name,
      s.email,
      s.rollNo || '—',
      year,
      s.section?.name ? `${s.section.name}` : '—',
      lp?.username || '—',
      lp?.totalSolved ?? 0,
      lp?.easySolved ?? 0,
      lp?.mediumSolved ?? 0,
      lp?.hardSolved ?? 0,
      solvedToday,
      lp?.contestRating ? Math.round(lp.contestRating) : 0,
      lp?.currentStreak ?? 0,
      lp?.totalContestsParticipated ?? 0,
      totalScore,
      lcScore,
      classification,
      s.department?.code || '—',
    ])
    applyDataRowStyle(row, i % 2 === 0)
    // Color-code today's solved
    const solvedTodayCell = row.getCell(11)
    if (solvedToday > 0) {
      solvedTodayCell.font = { bold: true, size: 9, color: { argb: 'FF16A34A' } }
    }
    // Color-code classification
    applyClassificationStyle(row.getCell(17), classification)
  })

  const studentColWidths = [22, 28, 15, 6, 8, 18, 12, 8, 8, 8, 12, 14, 8, 12, 11, 10, 18, 12]
  studentHeaders.forEach((_, idx) => {
    studentSheet.getColumn(idx + 1).width = studentColWidths[idx] || 12
  })
  studentSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]

  // ════════════════════════════════════════════════
  // SHEET 3: Staff
  // ════════════════════════════════════════════════
  const staffSheet = wb.addWorksheet('Staff')
  staffSheet.properties.defaultRowHeight = 18

  const staffHeaders = [
    'Name', 'Email', 'Employee ID', 'Designation',
    'LeetCode Username', 'Total Solved', 'Easy', 'Medium', 'Hard',
    'Solved Today', 'Contest Rating', 'Streak', 'SM Contests',
    'Total Score', 'LC Score', 'Classification', 'Department',
  ]
  const staffHeaderRow = staffSheet.addRow(staffHeaders)
  applyHeaderStyle(staffHeaderRow, '065F46')

  faculty.forEach((f, i) => {
    const lp = f.leetcodeProfile
    const { lcScore, totalScore, classification } = calcScore(lp)
    const solvedToday = todaySolvedMap[f.id] || 0

    const row = staffSheet.addRow([
      f.name,
      f.email,
      f.employeeId || '—',
      f.designation || '—',
      lp?.username || '—',
      lp?.totalSolved ?? 0,
      lp?.easySolved ?? 0,
      lp?.mediumSolved ?? 0,
      lp?.hardSolved ?? 0,
      solvedToday,
      lp?.contestRating ? Math.round(lp.contestRating) : 0,
      lp?.currentStreak ?? 0,
      lp?.totalContestsParticipated ?? 0,
      totalScore,
      lcScore,
      classification,
      f.department?.code || '—',
    ])
    applyDataRowStyle(row, i % 2 === 0)
    const solvedTodayCell = row.getCell(10)
    if (solvedToday > 0) {
      solvedTodayCell.font = { bold: true, size: 9, color: { argb: 'FF16A34A' } }
    }
    applyClassificationStyle(row.getCell(16), classification)
  })

  const staffColWidths = [22, 28, 13, 22, 18, 12, 8, 8, 8, 12, 14, 8, 12, 11, 10, 18, 12]
  staffHeaders.forEach((_, idx) => {
    staffSheet.getColumn(idx + 1).width = staffColWidths[idx] || 12
  })
  staffSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]

  // ════════════════════════════════════════════════
  // SHEET 4: Daily LeetCode Activity (Today)
  // ════════════════════════════════════════════════
  const dailySheet = wb.addWorksheet('Daily LeetCode Activity')
  dailySheet.properties.defaultRowHeight = 18

  const dailyHeaders = ['Name', 'Email', 'Role', 'Date', 'Problems Solved']
  const dailyHeaderRow = dailySheet.addRow(dailyHeaders)
  applyHeaderStyle(dailyHeaderRow, '7C3AED')

  // Show today's activity for all users
  if (todayActivity.length > 0) {
    todayActivity.forEach((a, i) => {
      const row = dailySheet.addRow([
        a.user.name,
        a.user.email,
        a.user.role,
        todayStart.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        a.solved,
      ])
      applyDataRowStyle(row, i % 2 === 0)
      const solvedCell = row.getCell(5)
      solvedCell.font = { bold: true, size: 9, color: { argb: a.solved > 0 ? 'FF16A34A' : 'FF94A3B8' } }
    })
  } else {
    // No activity today — show all users with 0
    const allUsers = [...students, ...faculty]
    allUsers.forEach((u, i) => {
      const row = dailySheet.addRow([
        u.name,
        u.email,
        u.role,
        todayStart.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        todaySolvedMap[u.id] || 0,
      ])
      applyDataRowStyle(row, i % 2 === 0)
    })
  }

  dailySheet.getColumn(1).width = 22
  dailySheet.getColumn(2).width = 28
  dailySheet.getColumn(3).width = 10
  dailySheet.getColumn(4).width = 14
  dailySheet.getColumn(5).width = 16
  dailySheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]

  // ════════════════════════════════════════════════
  // SHEET 5: Leaderboard
  // ════════════════════════════════════════════════
  const leaderSheet = wb.addWorksheet('Leaderboard')
  leaderSheet.properties.defaultRowHeight = 18

  // Build leaderboard sorted by totalScore desc
  const leaderData = students
    .map(s => {
      const lp = s.leetcodeProfile
      const { lcScore, totalScore, classification } = calcScore(lp)
      return {
        name: s.name,
        email: s.email,
        dept: s.department?.code || '—',
        section: s.section?.name || '—',
        username: lp?.username || '—',
        totalSolved: lp?.totalSolved ?? 0,
        solvedToday: todaySolvedMap[s.id] || 0,
        contestRating: lp?.contestRating ? Math.round(lp.contestRating) : 0,
        streak: lp?.currentStreak ?? 0,
        lcScore,
        totalScore,
        classification,
      }
    })
    .sort((a, b) => b.totalScore - a.totalScore)

  const leaderHeaders = ['Rank', 'Name', 'Email', 'Dept', 'Section', 'LeetCode', 'Total Solved', 'Solved Today', 'Contest Rating', 'Streak', 'Total Score', 'Classification']
  const leaderHeaderRow = leaderSheet.addRow(leaderHeaders)
  applyHeaderStyle(leaderHeaderRow, 'B45309')

  leaderData.forEach((ld, i) => {
    const row = leaderSheet.addRow([
      i + 1,
      ld.name,
      ld.email,
      ld.dept,
      ld.section,
      ld.username,
      ld.totalSolved,
      ld.solvedToday,
      ld.contestRating,
      ld.streak,
      ld.totalScore,
      ld.classification,
    ])
    applyDataRowStyle(row, i % 2 === 0)

    // Gold / Silver / Bronze for top 3
    const rankCell = row.getCell(1)
    rankCell.alignment = { horizontal: 'center', vertical: 'middle' }
    if (i === 0) { rankCell.font = { bold: true, size: 11, color: { argb: 'FFF59E0B' } }; rankCell.value = '🥇 1' }
    else if (i === 1) { rankCell.font = { bold: true, size: 11, color: { argb: 'FF94A3B8' } }; rankCell.value = '🥈 2' }
    else if (i === 2) { rankCell.font = { bold: true, size: 11, color: { argb: 'FFCD7F32' } }; rankCell.value = '🥉 3' }

    // Highlight today's solvers
    const solvedTodayCell = row.getCell(8)
    if (ld.solvedToday > 0) {
      solvedTodayCell.font = { bold: true, size: 9, color: { argb: 'FF16A34A' } }
    }

    applyClassificationStyle(row.getCell(12), ld.classification)
  })

  const leaderColWidths = [7, 22, 28, 8, 8, 16, 12, 12, 14, 8, 11, 18]
  leaderHeaders.forEach((_, idx) => {
    leaderSheet.getColumn(idx + 1).width = leaderColWidths[idx] || 12
  })
  leaderSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]

  return wb.xlsx.writeBuffer()
}
