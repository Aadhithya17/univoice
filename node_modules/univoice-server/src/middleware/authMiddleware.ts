import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'univoice_super_secret_key_13579';

// Parse cookie value manually
const getCookieValue = (cookieHeader: string | undefined, name: string): string | null => {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token = getCookieValue(req.headers.cookie, 'token');

  // Also support Authorization header for flexibility
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, login required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    
    // Fetch user from DB to verify they still exist and aren't banned
    const user = await User.findById(decoded.id).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been banned by an administrator' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      isBanned: user.isBanned,
      email: user.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin' && req.user.email === 'admin@univoice.edu') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied, administrator role required' });
  }
};

export const moderatorOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === 'moderator' || req.user.role === 'admin') && req.user.email === 'admin@univoice.edu') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied, moderator or administrator role required' });
  }
};
