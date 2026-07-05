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

const app = express()
const PORT = process.env.PORT || 5000

// ─── Security & Middleware ───
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan('combined'))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: { message: 'Too many requests, please try again later' },
})
app.use('/api', limiter)

// ─── Health Check ───
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
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

  // Start cron job for LeetCode sync
  if (process.env.NODE_ENV === 'production') {
    startScheduledSync()
  }
})

export default app
