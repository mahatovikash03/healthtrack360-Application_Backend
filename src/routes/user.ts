import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import User from '../models/User';

const router = Router();
router.use(protect);

// GET /api/v1/user/profile
router.get('/profile', (req: Request, res: Response) => {
  const user = (req as any).user;
  res.json({
    success: true,
    user: {
      id:        user._id,
      name:      user.name,
      email:     user.email,
      role:      user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
  });
});

// PATCH /api/v1/user/profile
router.patch('/profile', async (req: Request, res: Response) => {
  try {
    const { name, avatarUrl, gender, age, city, state, country } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
    }
    const updates: any = { name: name.trim() };
    if (avatarUrl)               updates.avatarUrl = avatarUrl;
    if (gender !== undefined)    updates.gender    = gender;
    if (age    !== undefined)    updates.age       = age;
    if (city   !== undefined)    updates.city      = city.trim();
    if (state  !== undefined)    updates.state     = state.trim();
    if (country !== undefined)   updates.country   = country.trim();

    const user = await User.findByIdAndUpdate(
      (req as any).user._id,
      updates,
      { new: true, runValidators: true }
    );
    res.json({
      success: true,
      user: {
        id:        user!._id,
        name:      user!.name,
        email:     user!.email,
        role:      user!.role,
        avatarUrl: user!.avatarUrl,
        gender:    user!.gender,
        age:       user!.age,
        city:      user!.city,
        state:     user!.state,
        country:   user!.country,
      },
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/user/password  (change password)
router.patch('/password', async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both fields are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }
    const user = await User.findById((req as any).user._id).select('+password');
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/user/account
router.delete('/account', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: 'Account deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
