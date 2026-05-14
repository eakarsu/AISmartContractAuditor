import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from './auth';

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (roles.length > 0 && !roles.includes(req.user.role as Role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
    }
    next();
  };
};
