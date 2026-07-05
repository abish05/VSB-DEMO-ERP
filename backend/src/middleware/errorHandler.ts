import { Request, Response, NextFunction } from 'express'
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
})

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error(`${req.method} ${req.path} — ${err.message}`, { stack: err.stack })
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({ message: `Route ${req.path} not found` })
}
