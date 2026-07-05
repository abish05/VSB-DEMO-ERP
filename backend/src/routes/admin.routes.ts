import { Router, Request, Response, NextFunction } from 'express'
import { authenticate, AuthRequest, requireRole } from '@/middleware/auth'
import prisma from '@/config/prisma'
import { Role, SyncStatus, NotificationType } from '@prisma/client'
import { syncAllUsers } from '@/services/sync.service'

const router = Router()

async function resolveUserRelations(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: true,
      section: {
        include: {
          batch: {
            include: {
              academicYear: true
            }
          }
        }
      },
      leetcodeProfile: true
    }
  })
}

const adminGuard = [
  authenticate as (req: Request, res: Response, next: NextFunction) => void,
  requireRole('ADMIN'),
]
router.use(adminGuard)

// GET /api/admin/dashboard
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const [
      totalStudents,
      totalFaculty,
      totalDepartments,
      totalBatches,
      totalSections,
      totalWithProfile,
    ] = await Promise.all([
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.user.count({ where: { role: Role.FACULTY } }),
      prisma.department.count(),
      prisma.batch.count(),
      prisma.section.count(),
      prisma.leetCodeProfile.count(),
    ])

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfThisWeek = new Date(startOfToday)
    startOfThisWeek.setDate(startOfThisWeek.getDate() - 7)
    const startOfThisMonth = new Date(startOfToday)
    startOfThisMonth.setMonth(startOfThisMonth.getMonth() - 1)

    // Generate last 7 days labels
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const last7Days: { dateStr: string; label: string; solved: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfToday)
      d.setDate(d.getDate() - i)
      last7Days.push({
        dateStr: d.toISOString().split('T')[0],
        label: daysOfWeek[d.getDay()],
        solved: 0,
      })
    }

    const depts = await prisma.department.findMany()
    const deptSolves: Record<string, { dept: string; easy: number; medium: number; hard: number }> = {}
    depts.forEach(d => {
      deptSolves[d.code] = { dept: d.code, easy: 0, medium: 0, hard: 0 }
    })

    const students = await prisma.user.findMany({
      where: { role: Role.STUDENT },
      include: {
        department: true,
        leetcodeProfile: true
      }
    })

    let easyTotal = 0
    let mediumTotal = 0
    let hardTotal = 0

    const ratingDistribution = {
      '< 1400': 0,
      '1400 - 1600': 0,
      '1600 - 1800': 0,
      '1800 - 2000': 0,
      '2000+': 0,
    }

    const profiles = await prisma.leetCodeProfile.findMany()
    profiles.forEach(profile => {
      easyTotal += profile.easySolved || 0
      mediumTotal += profile.mediumSolved || 0
      hardTotal += profile.hardSolved || 0

      const student = students.find(s => s.id === profile.userId)
      const deptCode = student?.department?.code || 'CSE'

      if (deptSolves[deptCode]) {
        deptSolves[deptCode].easy += profile.easySolved || 0
        deptSolves[deptCode].medium += profile.mediumSolved || 0
        deptSolves[deptCode].hard += profile.hardSolved || 0
      }

      const rating = profile.contestRating || 0
      if (rating > 0) {
        if (rating < 1400) ratingDistribution['< 1400']++
        else if (rating < 1600) ratingDistribution['1400 - 1600']++
        else if (rating < 1800) ratingDistribution['1600 - 1800']++
        else if (rating < 2000) ratingDistribution['1800 - 2000']++
        else ratingDistribution['2000+']++
      }
    })

    // Sum solved metrics from dailyActivity
    const dailyTodayAgg = await prisma.dailyActivity.aggregate({
      where: { date: { gte: startOfToday } },
      _sum: { solved: true }
    })
    const solvedToday = dailyTodayAgg._sum.solved || 0

    const dailyWeekAgg = await prisma.dailyActivity.aggregate({
      where: { date: { gte: startOfThisWeek } },
      _sum: { solved: true }
    })
    const solvedThisWeek = dailyWeekAgg._sum.solved || 0

    const dailyMonthAgg = await prisma.dailyActivity.aggregate({
      where: { date: { gte: startOfThisMonth } },
      _sum: { solved: true }
    })
    const solvedThisMonth = dailyMonthAgg._sum.solved || 0

    const activeTodayCount = await prisma.dailyActivity.count({
      where: {
        date: { gte: startOfToday },
        solved: { gt: 0 }
      }
    })

    // Populate last 7 days chart solved counts
    const activitiesLast7Days = await prisma.dailyActivity.findMany({
      where: { date: { gte: new Date(last7Days[0].dateStr) } }
    })

    activitiesLast7Days.forEach(act => {
      const dateStr = act.date.toISOString().split('T')[0]
      const dayObj = last7Days.find(d => d.dateStr === dateStr)
      if (dayObj) {
        dayObj.solved += act.solved
      }
    })

    res.json({
      stats: {
        totalStudents,
        totalFaculty,
        totalDepartments,
        totalBatches,
        totalSections,
        totalWithProfile,
        activeToday: activeTodayCount,
        solvedToday,
        solvedThisWeek,
        solvedThisMonth,
      },
      charts: {
        dailyActivity: last7Days.map((d) => ({ day: d.label, solved: d.solved })),
        deptPerformance: Object.values(deptSolves),
        difficultyDistribution: {
          easy: easyTotal,
          medium: mediumTotal,
          hard: hardTotal,
        },
        contestRatingDistribution: Object.entries(ratingDistribution).map(([range, count]) => ({ range, count })),
      },
    })
  } catch (err) {
    console.error('Dashboard stats error:', err)
    res.status(500).json({ message: 'Dashboard stats failed' })
  }
})

// ─── Departments CRUD ─────────────────────────────────────────────
router.get('/departments', async (_req: Request, res: Response) => {
  try {
    const depts = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    })
    res.json(depts)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch departments' })
  }
})

router.post('/departments', async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, description } = req.body
    const dept = await prisma.department.create({
      data: { name, code, description }
    })
    res.status(201).json(dept)
  } catch (err) {
    res.status(400).json({ message: 'Failed to create department' })
  }
})

router.put('/departments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { name, code, description } = req.body
    const dept = await prisma.department.update({
      where: { id },
      data: { name, code, description }
    })
    res.json(dept)
  } catch (err) {
    res.status(400).json({ message: 'Failed to update department' })
  }
})

router.delete('/departments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    await prisma.department.delete({
      where: { id }
    })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete department' })
  }
})

// ─── Academic Years ───────────────────────────────────────────────
router.get('/academic-years', async (_req: Request, res: Response) => {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' }
    })
    res.json(years)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch academic years' })
  }
})

router.post('/academic-years', async (req: AuthRequest, res: Response) => {
  try {
    const { name, startDate, endDate, isActive } = req.body
    const year = await prisma.academicYear.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: !!isActive,
      }
    })
    res.status(201).json(year)
  } catch (err) {
    res.status(400).json({ message: 'Failed to create academic year' })
  }
})

router.put('/academic-years/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { name, startDate, endDate, isActive } = req.body
    const year = await prisma.academicYear.update({
      where: { id },
      data: {
        name,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive: isActive !== undefined ? !!isActive : undefined,
      }
    })
    res.json(year)
  } catch (err) {
    res.status(400).json({ message: 'Failed to update academic year' })
  }
})

router.delete('/academic-years/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    await prisma.academicYear.delete({
      where: { id }
    })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete academic year' })
  }
})

// ─── Batches ──────────────────────────────────────────────────────
router.get('/batches', async (_req: Request, res: Response) => {
  try {
    const batches = await prisma.batch.findMany({
      include: {
        department: true,
        academicYear: true
      }
    })
    res.json(batches)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch batches' })
  }
})

router.post('/batches', async (req: AuthRequest, res: Response) => {
  try {
    const { name, year, departmentId, academicYearId } = req.body
    const batch = await prisma.batch.create({
      data: {
        name,
        year: parseInt(year),
        departmentId,
        academicYearId,
      }
    })
    res.status(201).json(batch)
  } catch (err) {
    res.status(400).json({ message: 'Failed to create batch' })
  }
})

router.put('/batches/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { name, year, departmentId, academicYearId } = req.body
    const batch = await prisma.batch.update({
      where: { id },
      data: {
        name,
        year: year ? parseInt(year) : undefined,
        departmentId,
        academicYearId,
      }
    })
    res.json(batch)
  } catch (err) {
    res.status(400).json({ message: 'Failed to update batch' })
  }
})

router.delete('/batches/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    await prisma.batch.delete({
      where: { id }
    })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete batch' })
  }
})

// ─── Sections ─────────────────────────────────────────────────────
router.get('/sections', async (_req: Request, res: Response) => {
  try {
    const sections = await prisma.section.findMany({
      include: {
        batch: {
          include: {
            department: true
          }
        },
        faculty: true
      }
    })
    res.json(sections)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sections' })
  }
})

router.post('/sections', async (req: AuthRequest, res: Response) => {
  try {
    const { name, batchId, facultyId } = req.body
    const section = await prisma.section.create({
      data: { name, batchId, facultyId }
    })
    res.status(201).json(section)
  } catch (err) {
    res.status(400).json({ message: 'Failed to create section' })
  }
})

router.put('/sections/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { name, batchId, facultyId } = req.body
    const section = await prisma.section.update({
      where: { id },
      data: { name, batchId, facultyId }
    })
    res.json(section)
  } catch (err) {
    res.status(400).json({ message: 'Failed to update section' })
  }
})

router.delete('/sections/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    await prisma.section.delete({
      where: { id }
    })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete section' })
  }
})

// ─── Users ────────────────────────────────────────────────────────
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { role, page = '1', limit = '20', search, departmentId, batchId, sectionId } = req.query as any
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)

    const where: any = {}
    if (role) where.role = role as Role
    if (departmentId) where.departmentId = departmentId
    if (sectionId) where.sectionId = sectionId
    if (batchId) {
      where.section = { batchId }
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const total = await prisma.user.count({ where })
    const data = await prisma.user.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      include: {
        department: true,
        section: {
          include: {
            batch: {
              include: {
                academicYear: true
              }
            }
          }
        },
        leetcodeProfile: true
      }
    })

    res.json({
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    })
  } catch (err) {
    console.error("Users fetch error:", err)
    res.status(500).json({ message: 'Failed to fetch users' })
  }
})

router.put('/users/:id/role', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const user = await prisma.user.update({
      where: { id },
      data: { role: req.body.role as Role }
    })
    res.json(user)
  } catch (err) {
    res.status(400).json({ message: 'Failed to update role' })
  }
})

router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    await prisma.user.delete({
      where: { id }
    })
    res.json({ message: 'User deleted' })
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete user' })
  }
})

// POST /api/admin/users
router.post('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { email, name, role, departmentId, sectionId, leetcodeUsername } = req.body

    const user = await prisma.user.create({
      data: {
        firebaseUid: `seed-${role.toLowerCase()}-${Math.random().toString(36).substring(2, 9)}`,
        email,
        name,
        role: role || Role.STUDENT,
        departmentId: departmentId || undefined,
        sectionId: sectionId || undefined,
        isActive: true,
        leetcodeProfile: leetcodeUsername ? {
          create: {
            username: leetcodeUsername,
            totalSolved: 0,
            easySolved: 0,
            mediumSolved: 0,
            hardSolved: 0,
            contestRating: 0,
            currentStreak: 0,
            longestStreak: 0,
            submissionCalendar: {},
            lastSyncedAt: new Date(),
          }
        } : undefined
      },
      include: {
        leetcodeProfile: true
      }
    })

    res.status(201).json(user)
  } catch (err) {
    console.error(err)
    res.status(400).json({ message: 'Failed to create user' })
  }
})

// PUT /api/admin/users/:id
router.put('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string
    const { name, email, role, departmentId, sectionId, leetcodeUsername } = req.body

    await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role: role as Role,
        departmentId: departmentId !== undefined ? departmentId : undefined,
        sectionId: sectionId !== undefined ? sectionId : undefined,
      }
    })

    if (leetcodeUsername !== undefined) {
      await prisma.leetCodeProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          username: leetcodeUsername,
          totalSolved: 0,
          easySolved: 0,
          mediumSolved: 0,
          hardSolved: 0,
          contestRating: 0,
          currentStreak: 0,
          longestStreak: 0,
          submissionCalendar: {},
          lastSyncedAt: new Date(),
        },
        update: {
          username: leetcodeUsername
        }
      })
    }

    const fullUser = await resolveUserRelations(id)
    res.json(fullUser)
  } catch (err) {
    res.status(400).json({ message: 'Failed to update user' })
  }
})

// POST /api/admin/import/json
router.post('/import/json', async (req: AuthRequest, res: Response) => {
  try {
    const { type, users } = req.body as { type: 'students' | 'faculty'; users: any[] }
    let imported = 0
    const errors: string[] = []

    for (const u of users) {
      if (!u.email || !u.name) {
        errors.push(`Missing email or name for user: ${JSON.stringify(u)}`)
        continue
      }

      try {
        await prisma.user.create({
          data: {
            firebaseUid: `seed-${type}-${Math.random().toString(36).substring(2, 9)}`,
            email: u.email,
            name: u.name,
            role: type === 'students' ? Role.STUDENT : Role.FACULTY,
            departmentId: u.departmentId || null,
            sectionId: u.sectionId || null,
            isActive: true,
            leetcodeProfile: (type === 'students' && u.leetcodeUsername) ? {
              create: {
                username: u.leetcodeUsername,
                totalSolved: 0,
                easySolved: 0,
                mediumSolved: 0,
                hardSolved: 0,
                contestRating: 0,
                currentStreak: 0,
                longestStreak: 0,
                submissionCalendar: {},
                lastSyncedAt: new Date(),
              }
            } : undefined
          }
        })
        imported++
      } catch (e) {
        errors.push(`Failed to import ${u.email}: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    }

    res.json({ imported, errors })
  } catch (err) {
    res.status(500).json({ message: 'JSON Import failed' })
  }
})

// GET /api/admin/reports
router.get('/reports', async (_req: Request, res: Response) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: Role.STUDENT },
      include: { leetcodeProfile: true }
    })
    const reportData = students.map(s => ({
      name: s.name,
      email: s.email,
      solved: s.leetcodeProfile?.totalSolved || 0,
      easy: s.leetcodeProfile?.easySolved || 0,
      medium: s.leetcodeProfile?.mediumSolved || 0,
      hard: s.leetcodeProfile?.hardSolved || 0,
      rating: s.leetcodeProfile?.contestRating || 0,
    }))
    res.json(reportData)
  } catch (err) {
    res.status(500).json({ message: 'Reports generation failed' })
  }
})

// POST /api/admin/notifications
router.post('/notifications', async (req: AuthRequest, res: Response) => {
  try {
    const { title, body, type, targetRole } = req.body

    const where: any = {}
    if (targetRole) where.role = targetRole as Role

    const users = await prisma.user.findMany({ where })
    const now = new Date()

    await prisma.notification.createMany({
      data: users.map(u => ({
        userId: u.id,
        title,
        body,
        type: type as NotificationType || NotificationType.ANNOUNCEMENT,
        read: false,
        createdAt: now,
      }))
    })

    res.json({ message: `Notification sent to ${users.length} users` })
  } catch (err) {
    res.status(500).json({ message: 'Failed to send notifications' })
  }
})

// POST /api/admin/sync/all
router.post('/sync/all', async (_req: Request, res: Response) => {
  try {
    syncAllUsers().catch((err) => console.error('Global sync failed:', err))
    res.json({ message: 'Global LeetCode sync started in background' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to trigger global sync' })
  }
})

export default router
