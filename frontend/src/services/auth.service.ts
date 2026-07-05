import apiClient from './apiClient'
import type { Batch, Department, Section, UserProfile } from '@/types'

export interface RegistrationOptions {
  departments: Department[]
  batches: Batch[]
  sections: Section[]
}

export interface LeetCodeCheckResult {
  exists: boolean
  available: boolean
  message: string
}

export const authService = {
  async getCurrentUser(): Promise<UserProfile> {
    const { data } = await apiClient.get('/auth/me')
    return data
  },

  async registerUser(payload: {
    firebaseUid: string
    email: string
    name: string
    role?: string
    avatar?: string
    registerNumber?: string
    employeeId?: string
    designation?: string
    departmentId?: string
    batchId?: string
    sectionId?: string
    leetcodeUsername: string
  }): Promise<UserProfile> {
    const { data } = await apiClient.post('/auth/register', payload)
    return data
  },

  async getRegistrationOptions(): Promise<RegistrationOptions> {
    const { data } = await apiClient.get('/auth/registration-options')
    return data
  },

  async checkLeetCodeUsername(username: string): Promise<LeetCodeCheckResult> {
    const { data } = await apiClient.get(`/auth/check-leetcode/${encodeURIComponent(username)}`)
    return data
  },

  async updateProfile(payload: Partial<UserProfile>): Promise<UserProfile> {
    const { data } = await apiClient.put('/auth/profile', payload)
    return data
  },
}
