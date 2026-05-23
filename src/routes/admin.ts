import { Router, Request, Response } from 'express';
import { protect, restrictTo } from '../middleware/auth';
import User from '../models/User';
import HealthLog from '../models/HealthLog';
import Notification from '../models/Notification';
import Streak from '../models/Streak';
import CommunityPost from '../models/CommunityPost';

const router = Router();
router.use(protect, restrictTo('admin'));

// GET /api/v1/admin/stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalUsers  = await User.countDocuments();
    const totalLogs   = await HealthLog.countDocuments();
    const today       = new Date(); today.setHours(0, 0, 0, 0);
    const activeToday = (await HealthLog.distinct('userId', { createdAt: { $gte: today } })).length;
    const scoreAgg    = await HealthLog.aggregate([{ $group: { _id: null, avg: { $avg: '$wellnessScore' } } }]);
    const avgScore    = Math.round(scoreAgg[0]?.avg || 0);
    res.json({ success: true, data: { totalUsers, totalLogs, avgScore, activeToday } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/admin/users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/admin/users/:id/role
router.patch('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/admin/users/:id
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await HealthLog.deleteMany({ userId: req.params.id });
    await Notification.deleteMany({ userId: req.params.id });
    await Streak.deleteMany({ userId: req.params.id });
    await CommunityPost.deleteMany({ author: req.params.id });
    res.json({ success: true, message: 'User and all data deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
