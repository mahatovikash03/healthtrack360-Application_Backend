import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import Streak from '../models/Streak';

const router = Router();
router.use(protect);

// ── Helper: calculate elapsed time from startDate ──────────────────────────
function calcElapsed(startDate: Date) {
  const diff = Math.floor((Date.now() - new Date(startDate).getTime()) / 1000);
  const days    = Math.floor(diff / 86400);
  const hours   = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  return { days, hours, minutes, seconds, totalSeconds: diff };
}

// GET /api/v1/streak/current — get current active streak + all history
router.get('/current', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const current = await Streak.findOne({ userId, active: true }).sort({ createdAt: -1 });
    const history = await Streak.find({ userId, active: false }).sort({ createdAt: -1 }).limit(20);

    let elapsed = null;
    if (current?.startDate) {
      elapsed = calcElapsed(current.startDate);
    }

    res.json({ success: true, data: { current, elapsed, history } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/streak/start — start a new streak
router.post('/start', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;

    // Deactivate any existing active streak without reason
    await Streak.updateMany({ userId, active: true }, { active: false, endDate: new Date() });

    const streak = await Streak.create({
      userId,
      active: true,
      startDate: new Date(),
      days: 0, hours: 0, minutes: 0, seconds: 0,
      bestDays: 0,
      checkIns: [new Date()],
    });

    res.status(201).json({ success: true, data: streak });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST /api/v1/streak/break — break current streak with reason
router.post('/break', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { reason } = req.body;

    const current = await Streak.findOne({ userId, active: true });
    if (!current) return res.status(404).json({ success: false, message: 'No active streak found.' });

    const elapsed = calcElapsed(current.startDate);

    current.active      = false;
    current.endDate     = new Date();
    current.days        = elapsed.days;
    current.hours       = elapsed.hours;
    current.minutes     = elapsed.minutes;
    current.seconds     = elapsed.seconds;
    current.breakReason = reason || 'No reason given';
    current.bestDays    = Math.max(current.bestDays, elapsed.days);
    await current.save();

    res.json({ success: true, data: current });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/v1/streak/:id/reason — update break reason
router.patch('/:id/reason', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { reason } = req.body;
    const streak = await Streak.findOneAndUpdate(
      { _id: req.params.id, userId },
      { breakReason: reason },
      { new: true }
    );
    if (!streak) return res.status(404).json({ success: false, message: 'Streak not found.' });
    res.json({ success: true, data: streak });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/v1/streak/:id — delete a streak entry
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    await Streak.findOneAndDelete({ _id: req.params.id, userId });
    res.json({ success: true, message: 'Streak deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/streak/history  ← MUST be before /:id
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const history = await Streak.find({ userId }).sort({ createdAt: -1 }).limit(50);
    const best = history.reduce((b, s) => Math.max(b, s.days), 0);
    const total = history.length;
    res.json({ success: true, data: { history, best, total } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
