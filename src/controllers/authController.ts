import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Notification from '../models/Notification';

// ── Fix: use number (seconds) instead of string for expiresIn ─────────────────
const signToken = (id: string): string => {
  const secret = process.env.JWT_SECRET as string;
  return jwt.sign({ id }, secret, { expiresIn: 60 * 60 * 24 * 7 }); // 7 days in seconds
};

// POST /api/v1/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, gender, age, city, state, country } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    if (password.length < 8)
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ success: false, message: 'This email is already registered.' });

    const user  = await User.create({ name, email, password, gender, age, city, state, country });
    const token = signToken(String(user._id));

    // Seed welcome notifications
    await Notification.insertMany([
      { userId: user._id, title: '👋 Welcome to HealthTrack360!',  message: 'Start by logging your first health entry today.',             type: 'tip'         },
      { userId: user._id, title: '🤖 AI Assistant Activated',       message: 'Your personal AI health assistant is ready to help anytime.', type: 'achievement' },
      { userId: user._id, title: '💡 Daily Wellness Tip',           message: 'Drink 2 glasses of water first thing every morning.',         type: 'tip'         },
      { userId: user._id, title: '🎯 Set Your First Habit',         message: 'Go to Habits and add a healthy daily habit to track.',        type: 'reminder'    },
    ]);

    res.status(201).json({
      success: true,
      token,
      user: {
        id:      user._id,
        name:    user.name,
        email:   user.email,
        role:    user.role,
        gender:  user.gender,
        age:     user.age,
        city:    user.city,
        state:   user.state,
        country: user.country,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// POST /api/v1/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = signToken(String(user._id));
    res.json({
      success: true,
      token,
      user: {
        id:      user._id,
        name:    user.name,
        email:   user.email,
        role:    user.role,
        gender:  user.gender,
        age:     user.age,
        city:    user.city,
        state:   user.state,
        country: user.country,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Server error.' });
  }
};

// GET /api/v1/auth/me
export const getMe = async (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({
    success: true,
    user: {
      id:        user._id,
      name:      user.name,
      email:     user.email,
      role:      user.role,
      gender:    user.gender,
      age:       user.age,
      city:      user.city,
      state:     user.state,
      country:   user.country,
      createdAt: user.createdAt,
    },
  });
};
