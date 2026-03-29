import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../lib/prisma';
import { getAdminCredentials } from '../lib/adminConfig';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
  isAdmin?: boolean;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId?: string; role?: Role; isAdmin?: boolean };
    
    if (!decoded.userId && !decoded.isAdmin) {
      res.status(401).json({ error: 'Invalid token payload' });
      return;
    }

    if (decoded.isAdmin && !decoded.userId) {
      req.isAdmin = true;
      req.userRole = Role.ADMIN;
      next();
      return;
    }

    // For standard users (even if they have admin privileges in DB)
    const liveUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, email: true, blocked: true }
    });

    if (!liveUser) {
      res.status(401).json({ error: 'User no longer exists' });
      return;
    }

    if (liveUser.blocked) {
      res.status(403).json({ error: 'Account has been blocked by an administrator' });
      return;
    }

    req.userId = liveUser.id;
    req.userRole = liveUser.role;
    const adminCreds = getAdminCredentials();
    req.isAdmin = liveUser.role === Role.ADMIN || !!(adminCreds && liveUser.email === adminCreds.email);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

export function authorizeRoles(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ error: 'Role-based access forbidden' });
      return;
    }
    next();
  };
}
