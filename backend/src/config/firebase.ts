import admin from 'firebase-admin'
import dotenv from 'dotenv'

dotenv.config()

const hasCreds = 
  process.env.FIREBASE_PROJECT_ID && 
  process.env.FIREBASE_CLIENT_EMAIL && 
  process.env.FIREBASE_PRIVATE_KEY

if (hasCreds) {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  }
} else {
  console.warn("⚠️ Warning: Firebase Admin credentials not found in environment. Using signature-free JWT decoder for development.")
}

export const firebaseAdmin = admin
export const firebaseAuth = hasCreds ? admin.auth() : {
  verifyIdToken: async (token: string) => {
    if (token.startsWith('mock:')) {
      const parts = token.split(':')
      const uid = parts[1] || 'mock-user-id'
      const email = parts[2] || 'mock@example.com'
      return { uid, email }
    }
    try {
      const parts = token.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
        return {
          uid: payload.user_id || payload.sub,
          email: payload.email,
        }
      }
    } catch (e) {
      console.error("Failed to parse token as JWT", e)
    }
    return {
      uid: 'seed-admin-uid-001',
      email: 'abishstk@gmail.com',
    }
  }
} as any

// ─────────────────── Mock Firestore DB (Development Fallback) ───────────────────

const globalForMock = globalThis as unknown as { mockFirestoreDbState: any }
if (!globalForMock.mockFirestoreDbState) {
  globalForMock.mockFirestoreDbState = {}
}
const mockDbState = globalForMock.mockFirestoreDbState

class MockDocRef {
  constructor(public colName: string, public docId: string, public dbState: any) {}

  async get() {
    const data = this.dbState[this.colName]?.[this.docId]
    return {
      exists: !!data,
      id: this.docId,
      data: () => data ? JSON.parse(JSON.stringify(data)) : undefined,
    }
  }

  async set(data: any, options?: { merge?: boolean }) {
    if (!this.dbState[this.colName]) this.dbState[this.colName] = {}
    
    if (options?.merge && this.dbState[this.colName][this.docId]) {
      this.dbState[this.colName][this.docId] = {
        ...this.dbState[this.colName][this.docId],
        ...data,
      }
    } else {
      this.dbState[this.colName][this.docId] = {
        id: this.docId,
        ...data,
      }
    }
  }

  async update(data: any) {
    if (!this.dbState[this.colName]?.[this.docId]) {
      throw new Error(`Document ${this.colName}/${this.docId} not found`)
    }
    this.dbState[this.colName][this.docId] = {
      ...this.dbState[this.colName][this.docId],
      ...data,
    }
  }

  async delete() {
    if (this.dbState[this.colName]) {
      delete this.dbState[this.colName][this.docId]
    }
  }

  collection(subcolName: string) {
    const path = `${this.colName}/${this.docId}/${subcolName}`
    return new MockCollectionRef(path, this.dbState)
  }
}

class MockCollectionRef {
  constructor(public colPath: string, public dbState: any) {}

  doc(id?: string) {
    const docId = id || Math.random().toString(36).substring(2, 15)
    return new MockDocRef(this.colPath, docId, this.dbState)
  }

  async add(data: any) {
    const id = Math.random().toString(36).substring(2, 15)
    const docRef = new MockDocRef(this.colPath, id, this.dbState)
    await docRef.set(data)
    return docRef
  }

  where(field: string, op: string, value: any) {
    return new MockQuery(this.colPath, this.dbState).where(field, op, value)
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    return new MockQuery(this.colPath, this.dbState).orderBy(field, direction)
  }

  limit(n: number) {
    return new MockQuery(this.colPath, this.dbState).limit(n)
  }

  async get() {
    return new MockQuery(this.colPath, this.dbState).get()
  }
}

class MockQuery {
  private filters: Array<{ field: string; op: string; value: any }> = []
  private orderField: string | null = null
  private orderDirection: 'asc' | 'desc' = 'asc'
  private limitNum: number | null = null

  constructor(public colPath: string, public dbState: any) {}

  where(field: string, op: string, value: any) {
    this.filters.push({ field, op, value })
    return this
  }

  orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
    this.orderField = field
    this.orderDirection = direction
    return this
  }

  limit(n: number) {
    this.limitNum = n
    return this
  }

  async get() {
    const allDocs = Object.values(this.dbState[this.colPath] || {}) as any[]
    let results = [...allDocs]

    for (const f of this.filters) {
      results = results.filter(doc => {
        const val = doc[f.field]
        if (f.op === '==' || f.op === '===') return val === f.value
        if (f.op === '!=') return val !== f.value
        if (f.op === '>') return val > f.value
        if (f.op === '>=') return val >= f.value
        if (f.op === '<') return val < f.value
        if (f.op === '<=') return val <= f.value
        if (f.op === 'array-contains') return Array.isArray(val) && val.includes(f.value)
        if (f.op === 'in') return Array.isArray(f.value) && f.value.includes(val)
        return true
      })
    }

    if (this.orderField) {
      const field = this.orderField
      const dir = this.orderDirection === 'desc' ? -1 : 1
      results.sort((a, b) => {
        const va = a[field]
        const vb = b[field]
        if (va < vb) return -1 * dir
        if (va > vb) return 1 * dir
        return 0
      })
    }

    if (this.limitNum !== null) {
      results = results.slice(0, this.limitNum)
    }

    const docs = results.map(data => ({
      id: data.id,
      data: () => JSON.parse(JSON.stringify(data)),
      ref: new MockDocRef(this.colPath, data.id, this.dbState)
    }))

    return {
      empty: docs.length === 0,
      size: docs.length,
      docs,
      forEach(cb: (doc: any) => void) {
        docs.forEach(cb)
      }
    }
  }
}

class MockFirestoreDb {
  collection(name: string) {
    return new MockCollectionRef(name, mockDbState)
  }

  collectionGroup(name: string) {
    const getFn = async () => {
      let results: any[] = []
      for (const key of Object.keys(mockDbState)) {
        if (key.endsWith(`/${name}`)) {
          const docs = Object.values(mockDbState[key] || {})
          results = results.concat(docs)
        }
      }
      const docs = results.map(data => ({
        id: data.id,
        data: () => JSON.parse(JSON.stringify(data)),
        ref: { id: data.id }
      }))
      return {
        empty: docs.length === 0,
        size: docs.length,
        docs,
        forEach(cb: (doc: any) => void) {
          docs.forEach(cb)
        }
      }
    }

    return {
      get: getFn,
      where: (field: string, op: string, value: any) => {
        return {
          get: async () => {
            const res = await getFn()
            const filteredDocs = res.docs.filter((d: any) => {
              const docData = d.data()
              if (op === '==') return docData[field] === value
              return true
            })
            return {
              empty: filteredDocs.length === 0,
              size: filteredDocs.length,
              docs: filteredDocs,
              forEach(cb: (doc: any) => void) {
                filteredDocs.forEach(cb)
              }
            }
          }
        } as any
      }
    }
  }
}

export const db = hasCreds ? admin.firestore() : (new MockFirestoreDb() as any)

// Pre-seed mock database for local development
if (!hasCreds) {
  const seedMockDb = () => {
    // 1. Create Admin
    mockDbState['users'] = {
      'seed-admin-uid-001': {
        id: 'seed-admin-uid-001',
        firebaseUid: 'seed-admin-uid-001',
        email: 'abishstk@gmail.com',
        name: 'VSB Administrator',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      'seed-faculty-uid-001': {
        id: 'seed-faculty-uid-001',
        firebaseUid: 'seed-faculty-uid-001',
        email: 'faculty@vsb.edu.in',
        name: 'Dr. Priya Nair',
        role: 'FACULTY',
        departmentId: 'cse-dept-id',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    mockDbState['departments'] = {
      'cse-dept-id': {
        id: 'cse-dept-id',
        name: 'Computer Science & Engineering',
        code: 'CSE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      'ece-dept-id': {
        id: 'ece-dept-id',
        name: 'Electronics & Communication Engineering',
        code: 'ECE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      'it-dept-id': {
        id: 'it-dept-id',
        name: 'Information Technology',
        code: 'IT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    mockDbState['academic_years'] = {
      'ay-2024-25-id': {
        id: 'ay-2024-25-id',
        name: '2024-25',
        startDate: '2024-06-01',
        endDate: '2025-05-31',
        isActive: true,
        createdAt: new Date().toISOString(),
      }
    }

    mockDbState['batches'] = {
      'batch-2021-25-id': {
        id: 'batch-2021-25-id',
        name: '2021-25',
        year: 2021,
        departmentId: 'cse-dept-id',
        academicYearId: 'ay-2024-25-id',
        createdAt: new Date().toISOString(),
      }
    }

    mockDbState['sections'] = {
      'section-a-id': {
        id: 'section-a-id',
        name: 'A',
        batchId: 'batch-2021-25-id',
        facultyId: 'seed-faculty-uid-001',
        createdAt: new Date().toISOString(),
      }
    }

    const generateMockCalendar = () => {
      const calendar: Record<string, number> = {}
      const today = new Date()
      for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        // 70% chance of solving on a given day
        if (Math.random() > 0.3) {
          const ts = Math.floor(date.getTime() / 1000)
          calendar[String(ts)] = Math.floor(Math.random() * 5) + 1
        }
      }
      return JSON.stringify(calendar)
    }

    const students = [
      { email: 'arjun@vsb.edu.in', name: 'Arjun Kumar', uid: 'seed-student-uid-001', lc: 'arjun_kumar_lc', solved: 324, easy: 142, med: 142, hard: 40, rating: 1543 },
      { email: 'priya@vsb.edu.in', name: 'Priya Devi', uid: 'seed-student-uid-002', lc: 'priya_devi_lc', solved: 287, easy: 130, med: 120, hard: 37, rating: 1412 },
      { email: 'sneha@vsb.edu.in', name: 'Sneha M', uid: 'seed-student-uid-003', lc: 'sneha_m_lc', solved: 412, easy: 178, med: 185, hard: 49, rating: 1678 },
    ]

    for (const s of students) {
      mockDbState['users'][s.uid] = {
        id: s.uid,
        firebaseUid: s.uid,
        email: s.email,
        name: s.name,
        role: 'STUDENT',
        departmentId: 'cse-dept-id',
        sectionId: 'section-a-id',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const path = `users/${s.uid}/leetcode_profiles`
      if (!mockDbState[path]) mockDbState[path] = {}
      mockDbState[path]['main'] = {
        id: 'main',
        userId: s.uid,
        username: s.lc,
        totalSolved: s.solved,
        easySolved: s.easy,
        mediumSolved: s.med,
        hardSolved: s.hard,
        contestRating: s.rating,
        currentStreak: Math.floor(Math.random() * 30),
        longestStreak: Math.floor(Math.random() * 60) + 30,
        submissionCalendar: generateMockCalendar(),
        lastSyncedAt: new Date().toISOString(),
      }
    }
  }

  // Only seed if empty
  if (!mockDbState['users'] || Object.keys(mockDbState['users']).length === 0) {
    seedMockDb()
    console.log('🌱 Pre-seeded in-memory MockFirestoreDb with development data!')
  }
}

