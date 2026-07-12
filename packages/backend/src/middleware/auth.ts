import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface UserPayload {
  id: string;
  role: 'user' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export function authenticateUser(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: 'Authentication required. Authorization header is missing.' });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ message: 'Authentication required. Header format must be Bearer <token>.' });
      return;
    }

    const token = parts[1];
    if (!token || token.trim() === '') {
      res.status(401).json({ message: 'Authentication required. Token is empty.' });
      return;
    }

    // JWT secret validation
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      if (process.env.NODE_ENV !== 'test') {
        throw new Error('Server Configuration Error: JWT_SECRET environment variable is missing.');
      }
    }
    const jwtSecret = secret || 'localdevsecretkeyfordealership';

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as UserPayload;
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication required. Invalid or expired token.' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: 'Access denied. Administrator privileges are required.' });
    return;
  }
  next();
}
