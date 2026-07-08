import apiClient from './apiClient'
import type { Department, AcademicYear, Batch, Section, PaginatedResponse, UserProfile } from '@/types'

export const adminService = {
  // Dashboard
  async getDashboardStats() {
    const { data } = await apiClient.get('/admin/dashboard')
    return data
  },

  // Departments
  async getDepartments(): Promise<Department[]> {
    const { data } = await apiClient.get('/admin/departments')
    return data
  },
  async createDepartment(payload: Partial<Department>): Promise<Department> {
    const { data } = await apiClient.post('/admin/departments', payload)
    return data
  },
  async updateDepartment(id: string, payload: Partial<Department>): Promise<Department> {
    const { data } = await apiClient.put(`/admin/departments/${id}`, payload)
    return data
  },
  async deleteDepartment(id: string): Promise<void> {
    await apiClient.delete(`/admin/departments/${id}`)
  },

  // Academic Years
  async getAcademicYears(): Promise<AcademicYear[]> {
    const { data } = await apiClient.get('/admin/academic-years')
    return data
  },
  async createAcademicYear(payload: Partial<AcademicYear>): Promise<AcademicYear> {
    const { data } = await apiClient.post('/admin/academic-years', payload)
    return data
  },
  async updateAcademicYear(id: string, payload: Partial<AcademicYear>): Promise<AcademicYear> {
    const { data } = await apiClient.put(`/admin/academic-years/${id}`, payload)
    return data
  },
  async deleteAcademicYear(id: string): Promise<void> {
    await apiClient.delete(`/admin/academic-years/${id}`)
  },

  // Batches
  async getBatches(): Promise<Batch[]> {
    const { data } = await apiClient.get('/admin/batches')
    return data
  },
  async createBatch(payload: Partial<Batch>): Promise<Batch> {
    const { data } = await apiClient.post('/admin/batches', payload)
    return data
  },
  async updateBatch(id: string, payload: Partial<Batch>): Promise<Batch> {
    const { data } = await apiClient.put(`/admin/batches/${id}`, payload)
    return data
  },
  async deleteBatch(id: string): Promise<void> {
    await apiClient.delete(`/admin/batches/${id}`)
  },

  // Sections
  async getSections(): Promise<Section[]> {
    const { data } = await apiClient.get('/admin/sections')
    return data
  },
  async createSection(payload: Partial<Section>): Promise<Section> {
    const { data } = await apiClient.post('/admin/sections', payload)
    return data
  },
  async updateSection(id: string, payload: Partial<Section>): Promise<Section> {
    const { data } = await apiClient.put(`/admin/sections/${id}`, payload)
    return data
  },
  async deleteSection(id: string): Promise<void> {
    await apiClient.delete(`/admin/sections/${id}`)
  },

  // Users
  async getUsers(params?: { role?: string; page?: number; limit?: number }): Promise<PaginatedResponse<UserProfile>> {
    const { data } = await apiClient.get('/admin/users', { params })
    return data
  },
  async createUser(payload: Record<string, any>): Promise<UserProfile> {
    const { data } = await apiClient.post('/admin/users', payload)
    return data
  },
  async updateUser(userId: string, payload: Record<string, any>): Promise<UserProfile> {
    const { data } = await apiClient.put(`/admin/users/${userId}`, payload)
    return data
  },
  async updateUserRole(userId: string, role: string): Promise<UserProfile> {
    const { data } = await apiClient.put(`/admin/users/${userId}/role`, { role })
    return data
  },
  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(`/admin/users/${userId}`)
  },
  async updateUserPassword(userId: string, password: string): Promise<void> {
    await apiClient.put(`/admin/users/${userId}/password`, { password })
  },

  // CSV Import (Client-side parsed)
  async importCSV(file: File, type: 'students' | 'faculty'): Promise<{ imported: number; errors: string[] }> {
    const text = await file.text()
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
    if (lines.length <= 1) {
      return { imported: 0, errors: ['CSV file is empty or only contains headers'] }
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const emailIndex = headers.indexOf('email')
    const nameIndex = headers.indexOf('name')
    const leetcodeIndex = headers.indexOf('leetcodeusername') > -1 ? headers.indexOf('leetcodeusername') : headers.indexOf('leetcode')
    const deptIndex = headers.indexOf('dept') > -1 ? headers.indexOf('dept') : headers.indexOf('department')
    const passwordIndex = headers.indexOf('password')
    const rollNoIndex = headers.findIndex(h => ['roll number', 'rollno', 'roll no', 'reg num', 'regnum'].includes(h))
    const empIdIndex = headers.findIndex(h => ['emp id', 'empid', 'employee id', 'employeeid'].includes(h))

    if (emailIndex === -1 || nameIndex === -1) {
      return { imported: 0, errors: ['CSV must contain "email" and "name" columns'] }
    }

    const users = lines.slice(1).map(line => {
      const parts = line.split(',').map(p => p.trim())
      return {
        email: parts[emailIndex],
        name: parts[nameIndex],
        leetcodeUsername: leetcodeIndex !== -1 ? parts[leetcodeIndex] : undefined,
        departmentCode: deptIndex !== -1 ? parts[deptIndex] : undefined,
        password: passwordIndex !== -1 ? parts[passwordIndex] : undefined,
        rollNo: rollNoIndex !== -1 ? parts[rollNoIndex] : undefined,
        employeeId: empIdIndex !== -1 ? parts[empIdIndex] : undefined,
      }
    })

    const { data } = await apiClient.post('/admin/import/json', { type, users })
    return data
  },

  async importJSON(type: 'students' | 'faculty', users: any[]): Promise<{ imported: number; errors: string[] }> {
    const { data } = await apiClient.post('/admin/import/json', { type, users })
    return data
  },

  // Reports
  async generateReport(type: string, params: Record<string, unknown>) {
    const { data } = await apiClient.get('/admin/reports', { params: { type, ...params } })
    return data
  },

  // Notifications
  async sendNotification(payload: { title: string; body: string; type?: string; targetRole?: string }) {
    const { data } = await apiClient.post('/admin/notifications', payload)
    return data
  },

  async syncAllUsers() {
    const { data } = await apiClient.post('/admin/sync/all')
    return data
  },

  async syncUser(userId: string) {
    const { data } = await apiClient.post(`/admin/sync/user/${userId}`)
    return data
  },

  async getUser(userId: string): Promise<UserProfile> {
    const { data } = await apiClient.get(`/admin/users/${userId}`)
    return data
  },

  async exportExcelReport(): Promise<void> {
    const response = await apiClient.get('/admin/reports/export', {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `codepulse_report_${new Date().toISOString().slice(0,10)}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  },

  async getSettings(): Promise<any> {
    const { data } = await apiClient.get('/admin/settings')
    return data
  },

  async saveSettings(settings: any): Promise<any> {
    const { data } = await apiClient.post('/admin/settings', settings)
    return data
  },

  async getAuditLogs(): Promise<any[]> {
    const { data } = await apiClient.get('/admin/profile/audit-logs')
    return data
  },

  async getLoginHistory(): Promise<any[]> {
    const { data } = await apiClient.get('/admin/profile/login-history')
    return data
  },

  async getActiveSessions(): Promise<any[]> {
    const { data } = await apiClient.get('/admin/profile/active-sessions')
    return data
  },

  async terminateSession(sessionId: string): Promise<any> {
    const { data } = await apiClient.post('/admin/profile/terminate-session', { sessionId })
    return data
  },

  async terminateAllSessions(): Promise<any> {
    const { data } = await apiClient.post('/admin/profile/terminate-all-sessions')
    return data
  },

  async getMonitoringMetrics(): Promise<any> {
    const { data } = await apiClient.get('/admin/monitoring/metrics')
    return data
  },

  async getBackgroundJobs(): Promise<any[]> {
    const { data } = await apiClient.get('/admin/background-jobs')
    return data
  },
}
