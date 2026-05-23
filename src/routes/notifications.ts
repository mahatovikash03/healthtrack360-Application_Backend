import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import Notification from '../models/Notification';

const router = Router();
router.use(protect);

// GET /api/v1/notifications
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
    const unread = notifications.filter(n => !n.read).length;
    res.json({ success: true, unread, data: notifications });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/notifications/read-all  ← MUST be before /:id
router.patch('/read-all', async (req: Request, res: Response) => {
  try {
    await Notification.updateMany({ userId: (req as any).user._id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/notifications/clear-all  ← MUST be before /:id
router.delete('/clear-all', async (req: Request, res: Response) => {
  try {
    await Notification.deleteMany({ userId: (req as any).user._id });
    res.json({ success: true, message: 'All notifications cleared.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: (req as any).user._id },
      { read: true }
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/notifications/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: (req as any).user._id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
