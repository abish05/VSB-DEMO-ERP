export type UserRole = 'ADMIN' | 'FACULTY' | 'STUDENT'

export interface UserProfile {
  id: string
  firebaseUid: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  rollNo?: string
  employeeId?: string
  designation?: string
  departmentId?: string
  department?: Department
  sectionId?: string
  section?: Section
  leetcodeProfile?: LeetCodeProfile
  createdAt: string
  updatedAt: string
}

export interface Department {
  id: string
  name: string
  code: string
  description?: string
  createdAt: string
}

export interface AcademicYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export interface Batch {
  id: string
  name: string
  year: number
  departmentId: string
  department?: Department
  academicYearId: string
  academicYear?: AcademicYear
}

export interface Section {
  id: string
  name: string
  batchId: string
  batch?: Batch
  facultyId: string
  faculty?: UserProfile
}

export interface LeetCodeProfile {
  id: string
  userId: string
  username: string
  displayName?: string
  avatar?: string
  country?: string
  reputation?: number
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  acceptanceRate: number
  contestRating: number
  globalRank?: number
  bestContestRanking?: number
  totalContestsParticipated?: number
  currentStreak: number
  longestStreak: number
  dailySolvedCount?: number
  weeklySolvedCount?: number
  monthlySolvedCount?: number
  totalActiveDays?: number
  lastSubmissionDate?: string
  recentSubmissions?: Array<{
    title: string
    titleSlug: string
    timestamp: string
    statusDisplay: string
    lang: string
  }>
  syncStatus?: 'SUCCESS' | 'ERROR' | 'PENDING'
  submissionCalendar?: Record<string, number> | string
  lastSyncedAt?: string
}

export interface DailyActivity {
  id: string
  userId: string
  date: string
  solved: number
  easy: number
  medium: number
  hard: number
}

export interface ContestHistory {
  id: string
  userId: string
  contestTitle: string
  contestSlug?: string
  rating: number
  rank?: number
  ranking?: number
  attended: string
  problemsSolved?: number
  totalProblems?: number
}

export interface Notification {
  id: string
  userId: string
  type: 'CONTEST' | 'REMINDER' | 'ACHIEVEMENT' | 'ALERT' | 'ANNOUNCEMENT'
  title: string
  body: string
  read: boolean
  createdAt: string
}

export interface SyncLog {
  id: string
  userId: string
  status: 'SUCCESS' | 'ERROR' | 'PENDING'
  message?: string
  syncedAt: string
  user?: UserProfile
}

export interface LeaderboardEntry {
  rank: number
  user: UserProfile
  leetcodeProfile: LeetCodeProfile
  weeklyChange?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  statusCode?: number
}

export interface DashboardStats {
  totalStudents: number
  totalFaculty: number
  activeUsers: number
  dailyCodingActivity: number
  topPerformers: UserProfile[]
  recentLogins: UserProfile[]
}

export interface StudentStats {
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  acceptanceRate: number
  currentStreak: number
  longestStreak: number
  contestRating: number
  globalRank?: number
  weeklyActivity: { date: string; count: number }[]
  monthlyActivity: { month: string; count: number }[]
  submissionCalendar: Record<string, number>
}
