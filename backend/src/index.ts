import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth.routes'
import leetcodeRoutes from './routes/leetcode.routes'
import adminRoutes from './routes/admin.routes'
import { errorHandler, notFound, logger } from './middleware/errorHandler'
import { startScheduledSync } from './services/sync.service'
import prisma from './config/prisma'

const app = express()
const PORT = process.env.PORT || 5001
const configuredOrigins = (process.env.FRONTEND_URL || 'http://localhost:3001')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

function isAllowedOrigin(origin?: string) {
  if (!origin) return true
  if (configuredOrigins.includes(origin)) return true
  return /^http:\/\/localhost:(3\d{3}|5\d{3})$/.test(origin)
}

// ─── Security & Middleware ───
app.use(helmet())
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true)
      return
    }
    callback(new Error(`CORS blocked origin: ${origin}`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('combined'))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000'),
  message: { message: 'Too many requests, please try again later' },
})
app.use('/api', limiter)

// ─── Health Check ───
app.get('/health', async (_req, res) => {
  let dbStatus = 'unknown'
  try {
    await prisma.$queryRaw`SELECT 1`
    dbStatus = 'connected'
  } catch {
    dbStatus = 'disconnected'
  }
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
  })
})

// ─── Routes ───
app.use('/api/auth', authRoutes)
app.use('/api/leetcode', leetcodeRoutes)
app.use('/api/admin', adminRoutes)

// ─── Error Handling ───
app.use(notFound)
app.use(errorHandler)

// ─── Start Server ───
app.listen(PORT, () => {
  logger.info(`🚀 VSB LeetCode API running on port ${PORT}`)
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)

  // Start cron job for LeetCode sync in all environments
  startScheduledSync()
})

export default app
