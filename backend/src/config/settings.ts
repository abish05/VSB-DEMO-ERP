import fs from 'fs'
import path from 'path'

const settingsPath = path.join(process.cwd(), 'settings.json')

export interface SystemSettings {
  collegeName: string
  academicYear: string
  timeZone: string
  maintenanceMode: boolean
  maintenanceMsg: string
  leetcodeSyncFreq: string
  githubSyncEnabled: boolean
  githubSyncFreq: string
  notifyEmail: boolean
  notifyPush: boolean
  notifySms: boolean
  notifyPlacement: boolean
  require2FA: boolean
  jwtExpiry: string
  rateLimit: number
  maxLoginAttempts: number
  leetcodeApiStatus: string
  githubApiStatus: string
  geminiApiKey: string
  geminiStatus: string
}

const defaultSettings: SystemSettings = {
  collegeName: 'VSB Engineering College',
  academicYear: '2025-2026',
  timeZone: 'UTC+5:30 (IST)',
  maintenanceMode: false,
  maintenanceMsg: 'System is undergoing scheduled database maintenance.',
  leetcodeSyncFreq: '6h',
  githubSyncEnabled: true,
  githubSyncFreq: '12h',
  notifyEmail: true,
  notifyPush: true,
  notifySms: false,
  notifyPlacement: true,
  require2FA: false,
  jwtExpiry: '24h',
  rateLimit: 100,
  maxLoginAttempts: 5,
  leetcodeApiStatus: 'healthy',
  githubApiStatus: 'healthy',
  geminiApiKey: '••••••••••••••••••••••••',
  geminiStatus: 'healthy'
}

export function getSettings(): SystemSettings {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8')
      return { ...defaultSettings, ...JSON.parse(data) }
    }
  } catch (err) {
    console.error('Failed to read settings file, using defaults', err)
  }
  return defaultSettings
}

export function saveSettings(settings: Partial<SystemSettings>): SystemSettings {
  const current = getSettings()
  const updated = { ...current, ...settings }
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to save settings file', err)
  }
  return updated
}
