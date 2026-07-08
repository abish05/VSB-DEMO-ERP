import { PrismaClient, Role, SyncStatus } from '@prisma/client'
import { syncUser } from '../src/services/sync.service'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Prisma database seed...')

  const admin = await prisma.user.upsert({
    where: { firebaseUid: 'seed-admin-uid-001' },
    update: {
      email: 'abishstk@gmail.com',
      name: 'VSB Administrator',
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      id: 'seed-admin-uid-001',
      firebaseUid: 'seed-admin-uid-001',
      email: 'abishstk@gmail.com',
      name: 'VSB Administrator',
      role: Role.ADMIN,
      isActive: true,
    },
  })
  console.log(`Admin ready: ${admin.email}`)

  const departments = [
    { id: 'cse-dept-id', name: 'Computer Science & Engineering', code: 'CSE' },
    { id: 'ece-dept-id', name: 'Electronics & Communication Engineering', code: 'ECE' },
    { id: 'it-dept-id', name: 'Information Technology', code: 'IT' },
  ]

  for (const department of departments) {
    await prisma.department.upsert({
      where: { code: department.code },
      update: { name: department.name },
      create: department,
    })
  }
  console.log('Departments ready: CSE, ECE, IT')

  await prisma.academicYear.upsert({
    where: { name: '2024-25' },
    update: {
      startDate: new Date('2024-06-01T00:00:00Z'),
      endDate: new Date('2025-05-31T23:59:59Z'),
      isActive: true,
    },
    create: {
      id: 'ay-2024-25-id',
      name: '2024-25',
      startDate: new Date('2024-06-01T00:00:00Z'),
      endDate: new Date('2025-05-31T23:59:59Z'),
      isActive: true,
    },
  })
  console.log('Academic year ready')

  await prisma.batch.upsert({
    where: {
      name_departmentId: {
        name: '2021-25',
        departmentId: 'cse-dept-id',
      },
    },
    update: {
      year: 2021,
      academicYearId: 'ay-2024-25-id',
    },
    create: {
      id: 'batch-2021-25-id',
      name: '2021-25',
      year: 2021,
      departmentId: 'cse-dept-id',
      academicYearId: 'ay-2024-25-id',
    },
  })
  console.log('Batch ready')

  await prisma.user.upsert({
    where: { firebaseUid: 'seed-faculty-uid-001' },
    update: {
      email: 'faculty@vsb.edu.in',
      name: 'Dr. Priya Nair',
      role: Role.FACULTY,
      departmentId: 'cse-dept-id',
      employeeId: 'EMP-1001',
      designation: 'Assistant Professor',
      isActive: true,
    },
    create: {
      id: 'seed-faculty-uid-001',
      firebaseUid: 'seed-faculty-uid-001',
      email: 'faculty@vsb.edu.in',
      name: 'Dr. Priya Nair',
      role: Role.FACULTY,
      departmentId: 'cse-dept-id',
      employeeId: 'EMP-1001',
      designation: 'Assistant Professor',
      isActive: true,
    },
  })
  console.log('Faculty ready')

  await prisma.section.upsert({
    where: {
      name_batchId: {
        name: 'A',
        batchId: 'batch-2021-25-id',
      },
    },
    update: {
      facultyId: 'seed-faculty-uid-001',
    },
    create: {
      id: 'section-a-id',
      name: 'A',
      batchId: 'batch-2021-25-id',
      facultyId: 'seed-faculty-uid-001',
    },
  })
  console.log('Section ready')

  const students = [
    {
      email: 'lee215@vsb.edu.in',
      name: 'Lee Demo',
      uid: 'seed-student-uid-001',
      rollNo: '922521104001',
      leetcodeUsername: 'lee215',
    },
    {
      email: 'walkccc@vsb.edu.in',
      name: 'Walkccc Demo',
      uid: 'seed-student-uid-002',
      rollNo: '922521104002',
      leetcodeUsername: 'walkccc',
    },
    {
      email: 'wisdompeak@vsb.edu.in',
      name: 'Wisdompeak Demo',
      uid: 'seed-student-uid-003',
      rollNo: '922521104003',
      leetcodeUsername: 'wisdompeak',
    },
  ]

  for (const student of students) {
    const user = await prisma.user.upsert({
      where: { firebaseUid: student.uid },
      update: {
        email: student.email,
        name: student.name,
        role: Role.STUDENT,
        rollNo: student.rollNo,
        departmentId: 'cse-dept-id',
        sectionId: 'section-a-id',
        isActive: true,
      },
      create: {
        id: student.uid,
        firebaseUid: student.uid,
        email: student.email,
        name: student.name,
        role: Role.STUDENT,
        rollNo: student.rollNo,
        departmentId: 'cse-dept-id',
        sectionId: 'section-a-id',
        isActive: true,
      },
    })

    await prisma.leetCodeProfile.upsert({
      where: { userId: user.id },
      update: {
        username: student.leetcodeUsername,
        syncStatus: SyncStatus.PENDING,
      },
      create: {
        userId: user.id,
        username: student.leetcodeUsername,
        syncStatus: SyncStatus.PENDING,
        submissionCalendar: {},
      },
    })

    try {
      // Bypassed network sync during initial seeding to run instantly
      // await syncUser(user.id)
      console.log(`Queued initial sync for ${student.leetcodeUsername}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown sync error'
      console.warn(`Could not sync ${student.leetcodeUsername}: ${message}`)
    }
  }

  console.log('Seed complete. Registration options and sample real LeetCode profiles are ready.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
