import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Prisma database seed...')

  // Clean existing tables first
  await prisma.syncLog.deleteMany({})
  await prisma.notification.deleteMany({})
  await prisma.contestHistory.deleteMany({})
  await prisma.dailyActivity.deleteMany({})
  await prisma.leetCodeProfile.deleteMany({})
  await prisma.section.deleteMany({})
  await prisma.user.deleteMany({})
  await prisma.batch.deleteMany({})
  await prisma.academicYear.deleteMany({})
  await prisma.department.deleteMany({})

  // 1. Create Admin
  await prisma.user.create({
    data: {
      id: 'seed-admin-uid-001',
      firebaseUid: 'seed-admin-uid-001',
      email: 'abishstk@gmail.com',
      name: 'VSB Administrator',
      role: Role.ADMIN,
      isActive: true,
    }
  })
  console.log('✅ Admin created: abishstk@gmail.com')

  // 2. Create Departments
  await prisma.department.createMany({
    data: [
      { id: 'cse-dept-id', name: 'Computer Science & Engineering', code: 'CSE' },
      { id: 'ece-dept-id', name: 'Electronics & Communication Engineering', code: 'ECE' },
      { id: 'it-dept-id', name: 'Information Technology', code: 'IT' },
    ]
  })
  console.log('✅ Departments created: CSE, ECE, IT')

  // 3. Create Academic Year
  await prisma.academicYear.create({
    data: {
      id: 'ay-2024-25-id',
      name: '2024-25',
      startDate: new Date('2024-06-01T00:00:00Z'),
      endDate: new Date('2025-05-31T23:59:59Z'),
      isActive: true,
    }
  })
  console.log('✅ Academic Year created')

  // 4. Create Batch
  await prisma.batch.create({
    data: {
      id: 'batch-2021-25-id',
      name: '2021-25',
      year: 2021,
      departmentId: 'cse-dept-id',
      academicYearId: 'ay-2024-25-id',
    }
  })
  console.log('✅ Batch created')

  // 5. Create Faculty
  await prisma.user.create({
    data: {
      id: 'seed-faculty-uid-001',
      firebaseUid: 'seed-faculty-uid-001',
      email: 'faculty@vsb.edu.in',
      name: 'Dr. Priya Nair',
      role: Role.FACULTY,
      departmentId: 'cse-dept-id',
      isActive: true,
    }
  })
  console.log('✅ Faculty created')

  // 6. Create Section
  await prisma.section.create({
    data: {
      id: 'section-a-id',
      name: 'A',
      batchId: 'batch-2021-25-id',
      facultyId: 'seed-faculty-uid-001',
    }
  })
  console.log('✅ Section created')

  // 7. Create Sample Students and LeetCode Profiles
  const students = [
    { email: 'arjun@vsb.edu.in', name: 'Arjun Kumar', uid: 'seed-student-uid-001', lc: 'arjun_kumar_lc', solved: 324, easy: 142, med: 142, hard: 40, rating: 1543 },
    { email: 'priya@vsb.edu.in', name: 'Priya Devi', uid: 'seed-student-uid-002', lc: 'priya_devi_lc', solved: 287, easy: 130, med: 120, hard: 37, rating: 1412 },
    { email: 'sneha@vsb.edu.in', name: 'Sneha M', uid: 'seed-student-uid-003', lc: 'sneha_m_lc', solved: 412, easy: 178, med: 185, hard: 49, rating: 1678 },
  ]

  for (const s of students) {
    await prisma.user.create({
      data: {
        id: s.uid,
        firebaseUid: s.uid,
        email: s.email,
        name: s.name,
        role: Role.STUDENT,
        departmentId: 'cse-dept-id',
        sectionId: 'section-a-id',
        isActive: true,
        leetcodeProfile: {
          create: {
            username: s.lc,
            totalSolved: s.solved,
            easySolved: s.easy,
            mediumSolved: s.med,
            hardSolved: s.hard,
            contestRating: s.rating,
            currentStreak: Math.floor(Math.random() * 30),
            longestStreak: Math.floor(Math.random() * 60) + 30,
            submissionCalendar: {},
            lastSyncedAt: new Date(),
          }
        }
      }
    })
  }

  console.log('✅ Sample students and LeetCode profiles created')
  console.log('🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
