import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { JWTPayload, UserRole } from '../types.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function verifyToken(req: Request): JWTPayload | null {
  const token = req.cookies?.bites_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    return decoded;
  } catch (err) {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = verifyToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Please log in to continue.' });
  }
  req.user = user;
  next();
}

export function requireRole(role: UserRole) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Please log in to continue.' });
    }
    if (user.role !== role) {
      return res.status(403).json({ error: `Access restricted to ${role} account.` });
    }
    req.user = user;
    next();
  };
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const user = verifyToken(req);
  if (user) {
    req.user = user;
  }
  next();
}
