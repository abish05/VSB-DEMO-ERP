import { Request, Response, NextFunction } from 'express'
import { firebaseAuth } from '@/config/firebase'
import prisma from '@/config/prisma'

import { ParamsDictionary } from 'express-serve-static-core'
import { ParsedQs } from 'qs'

export interface AuthRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = ParsedQs
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  userId?: string
  userRole?: string
  firebaseUid?: string
  firebaseEmail?: string
  firebaseName?: string
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    const decoded = await firebaseAuth.verifyIdToken(token)

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid }
    })

    if (!user) {
      const isRegister =
        req.path === '/register' ||
        req.path === '/api/auth/register'

      if (isRegister) {
        req.firebaseUid = decoded.uid
        req.firebaseEmail = decoded.email
        req.firebaseName = (decoded as any).name || decoded.email?.split('@')[0] || 'User'
        return next()
      }
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account is inactive' })
    }

    req.userId = user.id
    req.userRole = user.role
    req.firebaseUid = user.firebaseUid
    req.firebaseEmail = decoded.email
    req.firebaseName = (decoded as any).name || decoded.email?.split('@')[0] || 'User'
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' })
    }
    next()
  }
}
