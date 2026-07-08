import fs from 'fs'
import path from 'path'

const sessionsPath = path.join(process.cwd(), 'active_sessions.json')
const historyPath = path.join(process.cwd(), 'login_history.json')
const auditPath = path.join(process.cwd(), 'audit_logs.json')

export interface SessionRecord {
  id: string
  userId: string
  device: string
  browser: string
  os: string
  ip: string
  location: string
  loginTime: string
  lastActivity: string
  token: string
}

export interface HistoryRecord {
  id: string
  userId: string
  date: string
  time: string
  ip: string
  browser: string
  device: string
  location: string
  status: 'Success' | 'Failed'
}

export interface AuditRecord {
  id: string
  userId: string
  userEmail: string
  date: string
  action: string
  field: string
  oldVal: string
  newVal: string
  ip: string
}

export function loadJSON(filePath: string): any[] {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    }
  } catch (err) {
    console.error(`Failed to read file ${filePath}:`, err)
  }
  return []
}

export function saveJSON(filePath: string, data: any[]) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error(`Failed to write file ${filePath}:`, err)
  }
}

function parseUserAgent(uaStr: string) {
  let device = 'Desktop PC'
  let browser = 'Chrome'
  let os = 'Windows 11'

  const ua = uaStr.toLowerCase()

  // Parse OS
  if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS'
  else if (ua.includes('iphone')) os = 'iOS'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('linux')) os = 'Linux'

  // Parse Device Type
  if (ua.includes('mobi') || ua.includes('iphone') || ua.includes('android')) {
    device = 'Mobile Device'
  }

  // Parse Browser
  if (ua.includes('edg/')) browser = 'Edge'
  else if (ua.includes('firefox/')) browser = 'Firefox'
  else if (ua.includes('chrome/')) browser = 'Chrome'
  else if (ua.includes('safari/')) browser = 'Safari'

  return { device, browser, os }
}

export function trackRequestSession(userId: string, email: string, token: string, ip: string, userAgentStr: string) {
  const sessions = loadJSON(sessionsPath)
  const { device, browser, os } = parseUserAgent(userAgentStr || '')
  
  const existingIndex = sessions.findIndex((s: any) => s.token === token)
  const now = new Date()
  
  if (existingIndex > -1) {
    sessions[existingIndex].lastActivity = 'Active Now'
    saveJSON(sessionsPath, sessions)
  } else {
    const newSession: SessionRecord = {
      id: `sess-${Math.random().toString(36).substring(2, 9)}`,
      userId,
      device,
      browser,
      os,
      ip,
      location: 'Karur, India',
      loginTime: now.toLocaleString('en-IN'),
      lastActivity: 'Active Now',
      token
    }
    sessions.push(newSession)
    saveJSON(sessionsPath, sessions)
    
    const history = loadJSON(historyPath)
    const newHistory: HistoryRecord = {
      id: `h-${Math.random().toString(36).substring(2, 9)}`,
      userId,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ip,
      browser,
      device,
      location: 'Karur, India',
      status: 'Success'
    }
    history.unshift(newHistory)
    if (history.length > 100) history.pop()
    saveJSON(historyPath, history)
  }
}

export function getActiveSessions(userId: string) {
  const sessions = loadJSON(sessionsPath)
  return sessions.filter((s: any) => s.userId === userId)
}

export function terminateSession(userId: string, sessionId: string) {
  let sessions = loadJSON(sessionsPath)
  sessions = sessions.filter((s: any) => !(s.userId === userId && s.id === sessionId))
  saveJSON(sessionsPath, sessions)
}

export function terminateAllSessions(userId: string, currentToken: string) {
  let sessions = loadJSON(sessionsPath)
  sessions = sessions.filter((s: any) => s.userId !== userId || s.token === currentToken)
  saveJSON(sessionsPath, sessions)
}

export function getLoginHistory(userId: string) {
  const history = loadJSON(historyPath)
  return history.filter((h: any) => h.userId === userId)
}

export function getAuditLogs() {
  return loadJSON(auditPath)
}

export function logAudit(userId: string, email: string, action: string, field: string, oldVal: string, newVal: string, ip: string) {
  const audits = loadJSON(auditPath)
  const now = new Date()
  const record: AuditRecord = {
    id: `audit-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    userEmail: email,
    date: now.toLocaleString('en-IN'),
    action,
    field,
    oldVal,
    newVal,
    ip
  }
  audits.unshift(record)
  if (audits.length > 200) audits.pop()
  saveJSON(auditPath, audits)
}
