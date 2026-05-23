import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Protect — verify JWT and attach user to request
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const user = await User.findById(decoded.id);

    if (!user)
      return res.status(401).json({ success: false, message: 'User no longer exists.' });

    (req as any).user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// Restrict to specific roles
export const restrictTo = (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes((req as any).user?.role))
      return res.status(403).json({ success: false, message: 'Access denied.' });
    next();
  };
