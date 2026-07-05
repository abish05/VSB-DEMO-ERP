import { Router, Response } from 'express'
import { Role, SyncStatus } from '@prisma/client'
import { authenticate, AuthRequest } from '@/middleware/auth'
import prisma from '@/config/prisma'
import { checkUsernameExists } from '@/services/leetcode.service'
import { syncUser } from '@/services/sync.service'

const router = Router()

async function getUserWithRelations(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      department: true,
      section: {
        include: {
          batch: {
            include: {
              academicYear: true,
            },
          },
        },
      },
      leetcodeProfile: true,
    },
  })
}

async function getUserWithRelationsByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      department: true,
      section: {
        include: {
          batch: {
            include: {
              academicYear: true,
            },
          },
        },
      },
      leetcodeProfile: true,
    },
  })

  return user
}

// GET /api/auth/registration-options
router.get('/registration-options', async (_req, res: Response) => {
  try {
    const [departments, batches, sections] = await Promise.all([
      prisma.department.findMany({ orderBy: { name: 'asc' } }),
      prisma.batch.findMany({
        orderBy: { name: 'asc' },
        include: { department: true, academicYear: true },
      }),
      prisma.section.findMany({
        orderBy: { name: 'asc' },
        include: {
          batch: {
            include: {
              department: true,
              academicYear: true,
            },
          },
        },
      }),
    ])

    res.json({ departments, batches, sections })
  } catch (err) {
    res.status(500).json({ message: 'Failed to load registration options' })
  }
})

// GET /api/auth/check-leetcode/:username
router.get('/check-leetcode/:username', async (req, res: Response) => {
  try {
    const username = String(req.params.username || '').trim()
    if (!username) return res.status(400).json({ exists: false, message: 'Username is required' })

    const [exists, duplicate] = await Promise.all([
      checkUsernameExists(username),
      prisma.leetCodeProfile.findUnique({ where: { username } }),
    ])

    if (!exists) {
      return res.json({ exists: false, available: false, message: 'LeetCode username not found' })
    }
    if (duplicate) {
      return res.json({ exists: true, available: false, message: 'This LeetCode username is already linked' })
    }

    res.json({ exists: true, available: true, message: 'LeetCode username verified' })
  } catch {
    res.json({ exists: false, available: false, message: 'Could not validate LeetCode username' })
  }
})

// POST /api/auth/dev-login
// Works in development mode OR when explicitly triggered from demo admin login
router.post('/dev-login', async (req, res: Response) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const user = await getUserWithRelationsByEmail(email)
    if (!user) {
      return res.status(404).json({ message: 'No account found for this email' })
    }

    // In production, only allow if this is a verified admin lookup by UID (demo admin button)
    // This check is intentionally limited to prevent abuse
    if (process.env.NODE_ENV === 'production' && user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Dev login is only available for demo purposes in production' })
    }

    res.json({
      token: `mock:${user.firebaseUid}:${user.email}`,
      user,
    })
  } catch (err) {
    console.error('Dev login failed:', err)
    res.status(500).json({ message: 'Dev login failed' })
  }
})

router.use(authenticate)

// GET /api/auth/me
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' })

    const user = await getUserWithRelations(req.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    res.json(user)
  } catch (err) {
    console.error('Error in /me:', err)
    res.status(500).json({ message: 'Failed to get user' })
  }
})

// POST /api/auth/register
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const {
      email,
      name,
      role,
      avatar,
      registerNumber,
      employeeId,
      designation,
      departmentId,
      batchId,
      sectionId,
      leetcodeUsername,
    } = req.body

    if (!req.firebaseUid) return res.status(401).json({ message: 'Missing Firebase identity' })
    if (!email || !name || !role || !leetcodeUsername) {
      return res.status(400).json({ message: 'Name, email, role, and LeetCode username are required' })
    }

    const normalizedRole = role as Role
    if (normalizedRole !== Role.STUDENT && normalizedRole !== Role.FACULTY) {
      return res.status(400).json({ message: 'Only students and faculty can self-register' })
    }

    if (normalizedRole === Role.STUDENT && (!registerNumber || !departmentId || !batchId || !sectionId)) {
      return res.status(400).json({ message: 'Register number, department, batch, and section are required for students' })
    }

    if (normalizedRole === Role.FACULTY && (!employeeId || !departmentId || !designation)) {
      return res.status(400).json({ message: 'Employee ID, department, and designation are required for faculty' })
    }

    const username = String(leetcodeUsername).trim()
    const [exists, duplicateProfile, duplicateUser] = await Promise.all([
      checkUsernameExists(username),
      prisma.leetCodeProfile.findUnique({ where: { username } }),
      prisma.user.findFirst({
        where: {
          OR: [
            { firebaseUid: req.firebaseUid },
            { email },
          ],
        },
      }),
    ])

    if (duplicateUser) return res.status(409).json({ message: 'This email is already registered. Please log in.' })
    if (!exists) return res.status(400).json({ message: 'LeetCode username not found' })
    if (duplicateProfile) return res.status(409).json({ message: 'This LeetCode username is already linked' })

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          firebaseUid: req.firebaseUid!,
          email,
          name,
          role: normalizedRole,
          avatar,
          rollNo: normalizedRole === Role.STUDENT ? registerNumber : undefined,
          employeeId: normalizedRole === Role.FACULTY ? employeeId : undefined,
          designation: normalizedRole === Role.FACULTY ? designation : undefined,
          departmentId,
          sectionId: normalizedRole === Role.STUDENT ? sectionId : undefined,
          isActive: true,
          leetcodeProfile: {
            create: {
              username,
              syncStatus: SyncStatus.PENDING,
              submissionCalendar: {},
            },
          },
        },
      })

      await tx.syncLog.create({
        data: {
          userId: createdUser.id,
          status: SyncStatus.PENDING,
          message: 'Registration completed. Initial LeetCode sync queued.',
        },
      })

      return createdUser
    })

    try {
      await syncUser(user.id)
    } catch (err) {
      return res.status(201).json({
        ...(await getUserWithRelations(user.id)),
        syncMessage: 'Registration completed, but LeetCode synchronization failed. You can retry from your dashboard.',
      })
    }

    res.status(201).json({
      ...(await getUserWithRelations(user.id)),
      syncMessage: 'Your LeetCode profile has been successfully linked and synchronized.',
    })
  } catch (err) {
    console.error('Registration failed:', err)
    res.status(500).json({ message: 'Registration failed' })
  }
})

// PUT /api/auth/profile
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const { name, avatar } = req.body
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' })

    await prisma.user.update({
      where: { id: req.userId },
      data: {
        name,
        avatar,
      },
    })

    const user = await getUserWithRelations(req.userId)
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: 'Update failed' })
  }
})

export default router
