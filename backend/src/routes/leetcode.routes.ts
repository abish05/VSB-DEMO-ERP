import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '@/middleware/auth'
import prisma from '@/config/prisma'
import { checkUsernameExists } from '@/services/leetcode.service'
import { syncUser } from '@/services/sync.service'
import { SyncStatus } from '@prisma/client'

const router = Router()

// GET /api/leetcode/check/:username
router.get('/check/:username', async (req: AuthRequest, res: Response) => {
  try {
    const username = String(req.params.username || '').trim()
    if (!username) return res.status(400).json({ exists: false, available: false })

    const [exists, duplicate] = await Promise.all([
      checkUsernameExists(username),
      prisma.leetCodeProfile.findUnique({ where: { username } }),
    ])

    res.json({
      exists,
      available: exists && !duplicate,
      message: !exists
        ? 'LeetCode username not found'
        : duplicate
          ? 'This LeetCode username is already linked'
          : 'LeetCode username verified',
    })
  } catch {
    res.json({ exists: false, available: false, message: 'Could not validate LeetCode username' })
  }
})

router.use(authenticate)

async function canAccessUser(req: AuthRequest, targetId: string) {
  if (req.userId === targetId || req.userRole === 'ADMIN') return true
  if (req.userRole !== 'FACULTY' || !req.userId) return false

  const assignedStudent = await prisma.user.findFirst({
    where: {
      id: targetId,
      role: 'STUDENT',
      section: {
        facultyId: req.userId,
      },
    },
    select: { id: true },
  })

  return !!assignedStudent
}

// GET /api/leetcode/leaderboard
router.get('/leaderboard', async (req: AuthRequest, res: Response) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', isActive: true, leetcodeProfile: { isNot: null } },
      include: {
        leetcodeProfile: true,
        department: true,
      }
    })

    const leaderboard = students
      .map(student => ({
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        dept: student.department?.code || 'N/A',
        solved: student.leetcodeProfile?.totalSolved || 0,
        streak: student.leetcodeProfile?.currentStreak || 0,
        rating: Math.round(student.leetcodeProfile?.contestRating || 0),
        change: 0
      }))
      .sort((a, b) => b.solved - a.solved)
      .map((s, index) => ({ ...s, rank: index + 1 }))

    res.json(leaderboard)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch leaderboard' })
  }
})

// GET /api/leetcode/my-students
router.get('/my-students', async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'FACULTY' && req.userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Only faculty and admins can view assigned students' })
    }

    const where = req.userRole === 'FACULTY'
      ? {
          role: 'STUDENT' as const,
          section: {
            facultyId: req.userId,
          },
        }
      : {
          role: 'STUDENT' as const,
        }

    const students = await prisma.user.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        department: true,
        section: {
          include: {
            batch: true,
          },
        },
        leetcodeProfile: true,
      },
    })

    res.json(students)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students' })
  }
})

// GET /api/leetcode/profile/:userId
router.get('/profile/:userId', async (req: AuthRequest, res: Response) => {
  try {
    if (!(await canAccessUser(req, req.params.userId as string))) {
      return res.status(403).json({ message: 'Cannot access another user profile' })
    }
    const lp = await prisma.leetCodeProfile.findUnique({
      where: { userId: req.params.userId as string }
    })
    if (!lp) return res.status(404).json({ message: 'No LeetCode profile linked' })
    res.json(lp)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile' })
  }
})

// POST /api/leetcode/link
router.post('/link', async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.body
    const normalizedUsername = String(username || '').trim()
    if (!normalizedUsername) {
      return res.status(400).json({ message: 'LeetCode username is required' })
    }

    const exists = await checkUsernameExists(normalizedUsername)
    if (!exists) return res.status(400).json({ message: 'LeetCode username not found' })

    const duplicate = await prisma.leetCodeProfile.findUnique({
      where: { username: normalizedUsername },
    })
    if (duplicate && duplicate.userId !== req.userId) {
      return res.status(409).json({ message: 'This LeetCode username is already linked' })
    }

    const profile = await prisma.leetCodeProfile.upsert({
      where: { userId: req.userId! },
      create: {
        userId: req.userId!,
        username: normalizedUsername,
        syncStatus: SyncStatus.PENDING,
      },
      update: {
        username: normalizedUsername,
        syncStatus: SyncStatus.PENDING,
      }
    })

    await syncUser(req.userId!)

    res.status(201).json(profile)
  } catch (err) {
    res.status(500).json({ message: 'Failed to link username' })
  }
})

// POST /api/leetcode/sync/:userId
router.post('/sync/:userId', async (req: AuthRequest, res: Response) => {
  const targetId = req.params.userId as string
  if (!(await canAccessUser(req, targetId))) {
    return res.status(403).json({ message: 'Cannot sync another user' })
  }
  try {
    await prisma.leetCodeProfile.update({
      where: { userId: targetId },
      data: { syncStatus: SyncStatus.PENDING },
    })
    await syncUser(targetId)
    res.json({ message: 'Sync completed successfully' })
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : 'Sync failed' })
  }
})

// GET /api/leetcode/sync/logs/:userId
router.get('/sync/logs/:userId', async (req: AuthRequest, res: Response) => {
  try {
    if (!(await canAccessUser(req, req.params.userId as string))) {
      return res.status(403).json({ message: 'Cannot access another user sync logs' })
    }
    const logs = await prisma.syncLog.findMany({
      where: { userId: req.params.userId as string },
      orderBy: { syncedAt: 'desc' },
      take: 20
    })
    res.json(logs)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch sync logs' })
  }
})

// GET /api/leetcode/activity/:userId
router.get('/activity/:userId', async (req: AuthRequest, res: Response) => {
  try {
    if (!(await canAccessUser(req, req.params.userId as string))) {
      return res.status(403).json({ message: 'Cannot access another user activity' })
    }
    const days = parseInt(req.query.days as string) || 365
    const since = new Date()
    since.setDate(since.getDate() - days)

    const activities = await prisma.dailyActivity.findMany({
      where: {
        userId: req.params.userId as string,
        date: { gte: since }
      },
      orderBy: { date: 'asc' }
    })
    res.json(activities)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch activity' })
  }
})

// GET /api/leetcode/contests/:userId
router.get('/contests/:userId', async (req: AuthRequest, res: Response) => {
  try {
    if (!(await canAccessUser(req, req.params.userId as string))) {
      return res.status(403).json({ message: 'Cannot access another user contests' })
    }
    const contests = await prisma.contestHistory.findMany({
      where: { userId: req.params.userId as string },
      orderBy: { attended: 'desc' }
    })
    res.json(contests)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch contests' })
  }
})

// GET /api/leetcode/stats/:userId
router.get('/stats/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.userId as string
    if (!(await canAccessUser(req, userId))) {
      return res.status(403).json({ message: 'Cannot access another user stats' })
    }

    const [profile, activities] = await Promise.all([
      prisma.leetCodeProfile.findUnique({ where: { userId } }),
      prisma.dailyActivity.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
      }),
    ])

    if (!profile) return res.status(404).json({ message: 'No LeetCode profile linked' })

    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - 6)
    const startOfMonth = new Date(today)
    startOfMonth.setDate(today.getDate() - 29)

    res.json({
      totalSolved: profile.totalSolved,
      easySolved: profile.easySolved,
      mediumSolved: profile.mediumSolved,
      hardSolved: profile.hardSolved,
      acceptanceRate: profile.acceptanceRate,
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      contestRating: profile.contestRating,
      globalRank: profile.globalRank,
      displayName: profile.displayName,
      avatar: profile.avatar,
      country: profile.country,
      reputation: profile.reputation,
      bestContestRanking: profile.bestContestRanking,
      totalContestsParticipated: profile.totalContestsParticipated,
      dailySolvedCount: profile.dailySolvedCount,
      weeklySolvedCount: profile.weeklySolvedCount,
      monthlySolvedCount: profile.monthlySolvedCount,
      totalActiveDays: profile.totalActiveDays,
      lastSubmissionDate: profile.lastSubmissionDate,
      recentSubmissions: profile.recentSubmissions || [],
      syncStatus: profile.syncStatus,
      lastSyncedAt: profile.lastSyncedAt,
      submissionCalendar: profile.submissionCalendar || {},
      weeklyActivity: activities
        .filter((a) => a.date >= startOfWeek)
        .map((a) => ({ date: a.date.toISOString(), count: a.solved })),
      monthlyActivity: activities
        .filter((a) => a.date >= startOfMonth)
        .map((a) => ({ month: a.date.toISOString(), count: a.solved })),
    })
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
})

export default router
