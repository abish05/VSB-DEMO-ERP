import apiClient from './apiClient'
import type {
  LeetCodeProfile,
  DailyActivity,
  ContestHistory,
  SyncLog,
  StudentStats,
  UserProfile,
} from '@/types'

export const leetcodeService = {
  async linkUsername(username: string): Promise<LeetCodeProfile> {
    const { data } = await apiClient.post('/leetcode/link', { username })
    return data
  },

  async getProfile(userId: string): Promise<LeetCodeProfile> {
    const { data } = await apiClient.get(`/leetcode/profile/${userId}`)
    return data
  },

  async syncNow(userId: string): Promise<{ message: string }> {
    const { data } = await apiClient.post(`/leetcode/sync/${userId}`)
    return data
  },

  async getSyncLogs(userId: string): Promise<SyncLog[]> {
    const { data } = await apiClient.get(`/leetcode/sync/logs/${userId}`)
    return data
  },

  async getDailyActivity(userId: string, days = 365): Promise<DailyActivity[]> {
    const { data } = await apiClient.get(`/leetcode/activity/${userId}`, {
      params: { days },
    })
    return data
  },

  async getContestHistory(userId: string): Promise<ContestHistory[]> {
    const { data } = await apiClient.get(`/leetcode/contests/${userId}`)
    return data
  },

  async getMyStudents(): Promise<UserProfile[]> {
    const { data } = await apiClient.get('/leetcode/my-students')
    return data
  },

  async getStudentStats(userId: string): Promise<StudentStats> {
    const { data } = await apiClient.get(`/leetcode/stats/${userId}`)
    return data
  },

  async checkUsername(username: string): Promise<{ exists: boolean; profile: unknown }> {
    const { data } = await apiClient.get(`/leetcode/check/${username}`)
    return data
  },

  async getLeaderboard(): Promise<any[]> {
    const { data } = await apiClient.get('/leetcode/leaderboard')
    return data
  },
}
